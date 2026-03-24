/**
 * Monte Carlo Uncertainty Quantification
 * 
 * Implements probabilistic analysis to propagate parameter uncertainties
 * through the simulation and quantify confidence intervals.
 * 
 * References:
 * - Saltelli, A., et al. (2008). Global Sensitivity Analysis
 * - Helton, J. C., & Davis, F. J. (2003). Latin hypercube sampling
 */

import { runSimulation, type SimulationConfig, type SimulationResult } from '../simulationEngine';
import type { TechnologyDatabase } from '../types';

/**
 * Parameter distribution types
 */
export type DistributionType = 'normal' | 'uniform' | 'lognormal' | 'triangular';

/**
 * Parameter uncertainty specification
 */
export interface ParameterUncertainty {
  /** Parameter name */
  name: string;
  /** Distribution type */
  distribution: DistributionType;
  /** Mean or center value */
  mean: number;
  /** Standard deviation (for normal/lognormal) or half-width (for uniform/triangular) */
  stdDev: number;
  /** Minimum value (hard constraint) */
  min?: number;
  /** Maximum value (hard constraint) */
  max?: number;
}

/**
 * Monte Carlo configuration
 */
export interface MonteCarloConfig {
  /** Base simulation configuration */
  baseConfig: SimulationConfig;
  /** Parameter uncertainties to sample */
  uncertainties: ParameterUncertainty[];
  /** Number of Monte Carlo samples */
  numSamples: number;
  /** Random seed for reproducibility */
  seed?: number;
  /** Enable parallel execution */
  parallel?: boolean;
}

/**
 * Monte Carlo results with statistics
 */
export interface MonteCarloResult {
  /** Mean energy margin */
  meanEnergyMargin: number;
  /** Standard deviation of energy margin */
  stdEnergyMargin: number;
  /** 5th percentile (lower confidence bound) */
  p5EnergyMargin: number;
  /** 95th percentile (upper confidence bound) */
  p95EnergyMargin: number;
  /** Probability of system viability */
  viabilityProbability: number;
  /** Sensitivity indices (Sobol indices) */
  sensitivityIndices: Record<string, number>;
  /** All sample results for detailed analysis */
  samples: Array<{
    energyMargin: number;
    totalMass: number;
    totalCost: number;
    viable: boolean;
  }>;
}

/**
 * Simple random number generator with seed support
 * Uses Linear Congruential Generator (LCG)
 */
class SeededRandom {
  private seed: number;
  
  constructor(seed: number = Date.now()) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2146483646;
  }
  
  /**
   * Generate random number in [0, 1)
   */
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  
  /**
   * Generate random number from normal distribution (Box-Muller transform)
   */
  nextNormal(mean: number = 0, stdDev: number = 1): number {
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
  
  /**
   * Generate random number from uniform distribution
   */
  nextUniform(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  
  /**
   * Generate random number from lognormal distribution
   */
  nextLognormal(mean: number, stdDev: number): number {
    const normal = this.nextNormal(0, 1);
    const mu = Math.log(mean / Math.sqrt(1 + (stdDev / mean) ** 2));
    const sigma = Math.sqrt(Math.log(1 + (stdDev / mean) ** 2));
    return Math.exp(mu + sigma * normal);
  }
  
  /**
   * Generate random number from triangular distribution
   */
  nextTriangular(min: number, mode: number, max: number): number {
    const u = this.next();
    const fc = (mode - min) / (max - min);
    
    if (u < fc) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }
}

/**
 * Sample parameter from specified distribution
 */
function sampleParameter(param: ParameterUncertainty, rng: SeededRandom): number {
  let value: number;
  
  switch (param.distribution) {
    case 'normal':
      value = rng.nextNormal(param.mean, param.stdDev);
      break;
    
    case 'uniform':
      const halfWidth = param.stdDev;
      value = rng.nextUniform(param.mean - halfWidth, param.mean + halfWidth);
      break;
    
    case 'lognormal':
      value = rng.nextLognormal(param.mean, param.stdDev);
      break;
    
    case 'triangular':
      const halfWidth2 = param.stdDev;
      value = rng.nextTriangular(param.mean - halfWidth2, param.mean, param.mean + halfWidth2);
      break;
    
    default:
      value = param.mean;
  }
  
  // Apply hard constraints if specified
  if (param.min !== undefined) value = Math.max(param.min, value);
  if (param.max !== undefined) value = Math.min(param.max, value);
  
  return value;
}

/**
 * Apply sampled parameters to simulation config
 */
function applySampledParameters(
  baseConfig: SimulationConfig,
  uncertainties: ParameterUncertainty[],
  samples: Record<string, number>
): SimulationConfig {
  const config = { ...baseConfig };
  
  // Map parameter names to config fields
  for (const param of uncertainties) {
    switch (param.name) {
      case 'concentratorArea':
        config.concentratorArea = samples[param.name];
        break;
      case 'pvArea':
        config.pvArea = samples[param.name];
        break;
      case 'batteryCapacity':
        config.batteryCapacity = samples[param.name];
        break;
      case 'baseLoad':
        config.baseLoad = samples[param.name];
        break;
      case 'durationHours':
        config.durationHours = samples[param.name];
        break;
      case 'yearsInOperation':
        config.yearsInOperation = samples[param.name];
        break;
    }
  }
  
  return config;
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArray: number[], p: number): number {
  if (sortedArray.length === 0) return 0;
  const index = (p / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

/**
 * Calculate Sobol sensitivity indices (first-order)
 * Measures the contribution of each parameter to output variance
 */
function calculateSobolIndices(
  uncertainties: ParameterUncertainty[],
  samples: Array<Record<string, number>>,
  outputs: number[]
): Record<string, number> {
  const indices: Record<string, number> = {};
  
  // Calculate total variance
  const mean = outputs.reduce((sum, val) => sum + val, 0) / outputs.length;
  const totalVariance = outputs.reduce((sum, val) => sum + (val - mean) ** 2, 0) / outputs.length;
  
  if (totalVariance === 0) {
    // No variance, all indices are zero
    for (const param of uncertainties) {
      indices[param.name] = 0;
    }
    return indices;
  }
  
  // For each parameter, calculate conditional variance
  for (const param of uncertainties) {
    // Group samples by parameter value (binning)
    const bins = 10;
    const paramValues = samples.map(s => s[param.name]);
    const minVal = Math.min(...paramValues);
    const maxVal = Math.max(...paramValues);
    const binWidth = (maxVal - minVal) / bins;
    
    const binOutputs: number[][] = Array(bins).fill(null).map(() => []);
    
    for (let i = 0; i < samples.length; i++) {
      const binIndex = Math.min(bins - 1, Math.floor((paramValues[i] - minVal) / binWidth));
      binOutputs[binIndex].push(outputs[i]);
    }
    
    // Calculate conditional means and variance of conditional means
    const conditionalMeans = binOutputs.map(binVals => {
      if (binVals.length === 0) return mean;
      return binVals.reduce((sum, val) => sum + val, 0) / binVals.length;
    });
    
    const varianceOfConditionalMeans = conditionalMeans.reduce(
      (sum, condMean) => sum + (condMean - mean) ** 2,
      0
    ) / conditionalMeans.length;
    
    // Sobol index = Variance of conditional means / Total variance
    indices[param.name] = varianceOfConditionalMeans / totalVariance;
  }
  
  return indices;
}

/**
 * Run Monte Carlo uncertainty analysis
 * 
 * @param config - Monte Carlo configuration
 * @param technologies - Technology database
 * @returns Statistical results with confidence intervals
 */
export async function runMonteCarloAnalysis(
  config: MonteCarloConfig,
  technologies: TechnologyDatabase
): Promise<MonteCarloResult> {
  const rng = new SeededRandom(config.seed);
  const samples: Array<Record<string, number>> = [];
  const results: Array<{
    energyMargin: number;
    totalMass: number;
    totalCost: number;
    viable: boolean;
  }> = [];
  
  // Generate samples
  for (let i = 0; i < config.numSamples; i++) {
    const sample: Record<string, number> = {};
    
    for (const param of config.uncertainties) {
      sample[param.name] = sampleParameter(param, rng);
    }
    
    samples.push(sample);
  }
  
  // Run simulations for each sample
  for (const sample of samples) {
    const simConfig = applySampledParameters(config.baseConfig, config.uncertainties, sample);
    
    try {
      const simResult = await runSimulation(simConfig, technologies);
      
      // Calculate energy margin from energy balance
      const avgPowerGenerated = simResult.metrics.avg_power_generated;
      const avgPowerConsumed = simResult.metrics.avg_power_consumed;
      const energyMargin = avgPowerConsumed > 0 
        ? ((avgPowerGenerated - avgPowerConsumed) / avgPowerConsumed) * 100 
        : 0;
      
      results.push({
        energyMargin,
        totalMass: 0, // TODO: Calculate from config
        totalCost: 0, // TODO: Calculate from config
        viable: simResult.metrics.viable,
      });
    } catch (error) {
      // If simulation fails, record as not viable
      results.push({
        energyMargin: -100,
        totalMass: 0,
        totalCost: 0,
        viable: false,
      });
    }
  }
  
  // Calculate statistics
  const energyMargins = results.map(r => r.energyMargin);
  const sortedMargins = [...energyMargins].sort((a, b) => a - b);
  
  const meanEnergyMargin = energyMargins.reduce((sum, val) => sum + val, 0) / energyMargins.length;
  const variance = energyMargins.reduce((sum, val) => sum + (val - meanEnergyMargin) ** 2, 0) / energyMargins.length;
  const stdEnergyMargin = Math.sqrt(variance);
  
  const p5EnergyMargin = percentile(sortedMargins, 5);
  const p95EnergyMargin = percentile(sortedMargins, 95);
  
  const viableCount = results.filter(r => r.viable).length;
  const viabilityProbability = viableCount / results.length;
  
  // Calculate sensitivity indices
  const sensitivityIndices = calculateSobolIndices(config.uncertainties, samples, energyMargins);
  
  return {
    meanEnergyMargin,
    stdEnergyMargin,
    p5EnergyMargin,
    p95EnergyMargin,
    viabilityProbability,
    sensitivityIndices,
    samples: results,
  };
}

/**
 * Get default uncertainty parameters for common variables
 */
export function getDefaultUncertainties(baseConfig: SimulationConfig): ParameterUncertainty[] {
  return [
    {
      name: 'pvArea',
      distribution: 'normal',
      mean: baseConfig.pvArea,
      stdDev: baseConfig.pvArea * 0.05, // ±5% uncertainty
      min: baseConfig.pvArea * 0.8,
      max: baseConfig.pvArea * 1.2,
    },
    {
      name: 'batteryCapacity',
      distribution: 'normal',
      mean: baseConfig.batteryCapacity,
      stdDev: baseConfig.batteryCapacity * 0.10, // ±10% uncertainty
      min: baseConfig.batteryCapacity * 0.7,
      max: baseConfig.batteryCapacity * 1.3,
    },
    {
      name: 'baseLoad',
      distribution: 'uniform',
      mean: baseConfig.baseLoad,
      stdDev: baseConfig.baseLoad * 0.15, // ±15% uniform variation
      min: baseConfig.baseLoad * 0.7,
      max: baseConfig.baseLoad * 1.3,
    },
  ];
}
