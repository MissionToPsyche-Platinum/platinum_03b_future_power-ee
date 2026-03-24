/**
 * Cost-Benefit Analysis and Economic Modeling
 * 
 * This module implements lifecycle cost analysis, cost per watt calculations,
 * mass budget tracking, and Technology Readiness Level (TRL) risk assessment
 * for power system technologies.
 */

import type { Concentrator, PVCell, Battery } from '../types';

/**
 * System configuration for cost-benefit analysis
 */
export interface SystemConfiguration {
  concentrator: Concentrator | null;
  pvCell: PVCell | null;
  battery: Battery | null;
  
  // System sizing
  concentratorArea: number;      // m²
  pvArea: number;                // m²
  batteryCapacity: number;       // Wh
  
  // Performance metrics
  averagePower: number;          // W
  peakPower: number;             // W
  energyMargin: number;          // %
  
  // Mission parameters
  missionDuration: number;       // years
}

/**
 * Lifecycle cost breakdown
 */
export interface LifecycleCost {
  // Development costs (non-recurring)
  developmentCost: number;       // $
  testingCost: number;           // $
  qualificationCost: number;     // $
  
  // Production costs (recurring)
  componentCost: number;         // $
  integrationCost: number;       // $
  launchCost: number;            // $ (based on mass)
  
  // Total costs
  totalNonRecurring: number;     // $
  totalRecurring: number;        // $
  totalLifecycle: number;        // $
  
  // Cost metrics
  costPerWatt: number;           // $/W
  costPerKg: number;             // $/kg
  costPerYear: number;           // $/year
}

/**
 * Mass budget breakdown
 */
export interface MassBudget {
  concentratorMass: number;      // kg
  pvMass: number;                // kg
  batteryMass: number;           // kg
  structureMass: number;         // kg (estimated)
  harnessMass: number;           // kg (estimated)
  contingencyMass: number;       // kg (margin)
  
  totalMass: number;             // kg
  powerToMassRatio: number;      // W/kg
}

/**
 * TRL risk assessment
 */
export interface TRLRiskAssessment {
  concentratorTRL: number;       // 1-9
  pvCellTRL: number;             // 1-9
  batteryTRL: number;            // 1-9
  systemTRL: number;             // Minimum of component TRLs
  
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  riskScore: number;             // 0-100
  
  developmentTime: number;       // Estimated years to flight readiness
  developmentRisk: string;       // Description of development risks
  
  recommendations: string[];     // Risk mitigation recommendations
}

/**
 * Complete cost-benefit analysis result
 */
export interface CostBenefitAnalysis {
  lifecycle: LifecycleCost;
  mass: MassBudget;
  trl: TRLRiskAssessment;
  
  // Comparative metrics
  performanceScore: number;      // 0-100 (higher is better)
  costEffectiveness: number;     // Performance per dollar
  riskAdjustedValue: number;     // Value accounting for TRL risk
  
  // Overall assessment
  recommendation: string;
  tradeoffs: string[];
}

/**
 * Calculate lifecycle costs for a system configuration
 */
export function calculateLifecycleCost(config: SystemConfiguration): LifecycleCost {
  const { concentrator, pvCell, battery, concentratorArea, pvArea, batteryCapacity, missionDuration } = config;
  
  // Component costs
  const concentratorCost = concentrator ? concentratorArea * concentrator.cost_per_m2 : 0;
  const pvCost = pvCell ? pvArea * pvCell.cost_per_m2 : 0;
  const batteryCost = battery ? (batteryCapacity / 1000) * battery.cost_per_kwh : 0; // Convert Wh to kWh
  const componentCost = concentratorCost + pvCost + batteryCost;
  
  // Development costs (scale with TRL - lower TRL = higher development cost)
  const avgTRL = ((concentrator?.trl ?? 9) + (pvCell?.trl ?? 9) + (battery?.trl ?? 9)) / 3;
  const trlFactor = Math.max(1.0, (10 - avgTRL) / 3); // 1.0x for TRL 9, 3.0x for TRL 1
  
  const developmentCost = componentCost * 0.5 * trlFactor; // 50% of component cost, scaled by TRL
  const testingCost = componentCost * 0.2 * trlFactor;     // 20% of component cost
  const qualificationCost = componentCost * 0.3 * trlFactor; // 30% of component cost
  
  // Integration costs
  const integrationCost = componentCost * 0.15; // 15% of component cost
  
  // Launch costs (based on mass)
  const totalMass = calculateMassBudget(config).totalMass;
  const launchCostPerKg = 50000; // $50k per kg (typical for deep space missions)
  const launchCost = totalMass * launchCostPerKg;
  
  // Totals
  const totalNonRecurring = developmentCost + testingCost + qualificationCost;
  const totalRecurring = componentCost + integrationCost + launchCost;
  const totalLifecycle = totalNonRecurring + totalRecurring;
  
  // Metrics
  const costPerWatt = totalLifecycle / config.averagePower;
  const costPerKg = totalLifecycle / totalMass;
  const costPerYear = totalLifecycle / missionDuration;
  
  return {
    developmentCost,
    testingCost,
    qualificationCost,
    componentCost,
    integrationCost,
    launchCost,
    totalNonRecurring,
    totalRecurring,
    totalLifecycle,
    costPerWatt,
    costPerKg,
    costPerYear
  };
}

/**
 * Calculate mass budget breakdown
 */
export function calculateMassBudget(config: SystemConfiguration): MassBudget {
  const { concentrator, pvCell, battery, concentratorArea, pvArea, batteryCapacity } = config;
  
  // Component masses
  const concentratorMass = concentrator ? concentratorArea * concentrator.mass_per_m2 : 0;
  const pvMass = pvCell ? pvArea * pvCell.mass_per_m2 : 0;
  const batteryMass = battery ? (batteryCapacity / 1000) * battery.mass_per_kwh : 0; // Convert Wh to kWh
  
  // Supporting structure (estimated at 20% of component mass)
  const componentMass = concentratorMass + pvMass + batteryMass;
  const structureMass = componentMass * 0.20;
  
  // Wiring harness (estimated at 5% of component mass)
  const harnessMass = componentMass * 0.05;
  
  // Contingency margin (10% of total)
  const subtotal = componentMass + structureMass + harnessMass;
  const contingencyMass = subtotal * 0.10;
  
  const totalMass = subtotal + contingencyMass;
  const powerToMassRatio = config.averagePower / totalMass;
  
  return {
    concentratorMass,
    pvMass,
    batteryMass,
    structureMass,
    harnessMass,
    contingencyMass,
    totalMass,
    powerToMassRatio
  };
}

/**
 * Assess TRL risk for system configuration
 */
export function assessTRLRisk(config: SystemConfiguration): TRLRiskAssessment {
  const { concentrator, pvCell, battery } = config;
  
  const concentratorTRL = concentrator?.trl ?? 9;
  const pvCellTRL = pvCell?.trl ?? 9;
  const batteryTRL = battery?.trl ?? 9;
  
  // System TRL is minimum of component TRLs
  const systemTRL = Math.min(concentratorTRL, pvCellTRL, batteryTRL);
  
  // Calculate risk score (0-100, higher = more risk)
  // TRL 9 = 0 risk, TRL 1 = 100 risk
  const riskScore = ((9 - systemTRL) / 8) * 100;
  
  // Determine risk level
  let riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  if (systemTRL >= 8) riskLevel = 'Low';
  else if (systemTRL >= 6) riskLevel = 'Medium';
  else if (systemTRL >= 4) riskLevel = 'High';
  else riskLevel = 'Very High';
  
  // Estimate development time (years to reach TRL 9)
  const developmentTime = Math.max(0, (9 - systemTRL) * 1.5); // 1.5 years per TRL level
  
  // Development risk description
  let developmentRisk = '';
  if (systemTRL >= 8) {
    developmentRisk = 'Flight-proven technology with minimal development risk';
  } else if (systemTRL >= 6) {
    developmentRisk = 'Technology demonstrated in relevant environment; moderate development required';
  } else if (systemTRL >= 4) {
    developmentRisk = 'Technology validated in laboratory; significant development and testing required';
  } else {
    developmentRisk = 'Early-stage technology; extensive research, development, and validation required';
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (systemTRL < 6) {
    recommendations.push('Consider technology maturation program before mission commitment');
    recommendations.push('Develop backup options with higher TRL');
  }
  
  if (systemTRL < 8) {
    recommendations.push('Plan for extensive ground testing and qualification');
    recommendations.push('Budget additional schedule margin for development');
  }
  
  if (concentratorTRL < pvCellTRL - 2 || concentratorTRL < batteryTRL - 2) {
    recommendations.push('Concentrator technology is less mature than other components');
  }
  
  if (pvCellTRL < 7) {
    recommendations.push('PV cell technology requires space environment validation');
  }
  
  if (batteryTRL < 7) {
    recommendations.push('Battery technology requires long-duration cycling tests');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All technologies are flight-proven; low technical risk');
  }
  
  return {
    concentratorTRL,
    pvCellTRL,
    batteryTRL,
    systemTRL,
    riskLevel,
    riskScore,
    developmentTime,
    developmentRisk,
    recommendations
  };
}

/**
 * Perform complete cost-benefit analysis
 */
export function performCostBenefitAnalysis(config: SystemConfiguration): CostBenefitAnalysis {
  const lifecycle = calculateLifecycleCost(config);
  const mass = calculateMassBudget(config);
  const trl = assessTRLRisk(config);
  
  // Calculate performance score (0-100)
  // Based on: power output, energy margin, power-to-mass ratio
  const powerScore = Math.min(100, (config.averagePower / 500) * 100); // Normalize to 500W
  const marginScore = Math.min(100, config.energyMargin * 2); // 50% margin = 100 score
  const massScore = Math.min(100, mass.powerToMassRatio * 10); // 10 W/kg = 100 score
  const performanceScore = (powerScore + marginScore + massScore) / 3;
  
  // Cost effectiveness (performance per million dollars)
  const costEffectiveness = performanceScore / (lifecycle.totalLifecycle / 1e6);
  
  // Risk-adjusted value (performance discounted by risk)
  const riskDiscount = 1 - (trl.riskScore / 200); // 0% risk = no discount, 100% risk = 50% discount
  const riskAdjustedValue = performanceScore * riskDiscount;
  
  // Generate overall recommendation
  let recommendation = '';
  if (performanceScore > 70 && trl.riskLevel === 'Low' && lifecycle.costPerWatt < 100000) {
    recommendation = '✅ Excellent choice: High performance, low risk, cost-effective';
  } else if (performanceScore > 60 && trl.riskLevel !== 'Very High') {
    recommendation = '✓ Good choice: Balanced performance and risk';
  } else if (trl.riskLevel === 'Very High') {
    recommendation = '⚠️ High risk: Significant technology development required';
  } else if (lifecycle.costPerWatt > 150000) {
    recommendation = '⚠️ Expensive: Consider more cost-effective alternatives';
  } else if (performanceScore < 50) {
    recommendation = '⚠️ Low performance: May not meet mission requirements';
  } else {
    recommendation = '○ Acceptable: Meets basic requirements but room for improvement';
  }
  
  // Identify key tradeoffs
  const tradeoffs: string[] = [];
  
  if (performanceScore > 70 && lifecycle.costPerWatt > 100000) {
    tradeoffs.push('High performance comes at premium cost');
  }
  
  if (trl.riskLevel === 'Low' && performanceScore < 60) {
    tradeoffs.push('Low risk but limited performance potential');
  }
  
  if (mass.powerToMassRatio > 8 && lifecycle.costPerWatt > 120000) {
    tradeoffs.push('Excellent power-to-mass ratio but high cost');
  }
  
  if (trl.riskLevel !== 'Low' && performanceScore > 75) {
    tradeoffs.push('High performance potential but requires technology maturation');
  }
  
  if (lifecycle.launchCost > lifecycle.componentCost) {
    tradeoffs.push('Launch costs dominate lifecycle budget - consider mass reduction');
  }
  
  if (tradeoffs.length === 0) {
    tradeoffs.push('Well-balanced configuration with no major tradeoffs');
  }
  
  return {
    lifecycle,
    mass,
    trl,
    performanceScore,
    costEffectiveness,
    riskAdjustedValue,
    recommendation,
    tradeoffs
  };
}

/**
 * Compare multiple configurations
 */
export interface ConfigurationComparison {
  name: string;
  analysis: CostBenefitAnalysis;
}

export function compareConfigurations(configs: ConfigurationComparison[]): {
  bestPerformance: string;
  bestCost: string;
  bestRisk: string;
  bestValue: string;
  summary: string;
} {
  if (configs.length === 0) {
    return {
      bestPerformance: 'N/A',
      bestCost: 'N/A',
      bestRisk: 'N/A',
      bestValue: 'N/A',
      summary: 'No configurations to compare'
    };
  }
  
  // Find best in each category
  const bestPerformance = configs.reduce((best, curr) => 
    curr.analysis.performanceScore > best.analysis.performanceScore ? curr : best
  );
  
  const bestCost = configs.reduce((best, curr) => 
    curr.analysis.lifecycle.costPerWatt < best.analysis.lifecycle.costPerWatt ? curr : best
  );
  
  const bestRisk = configs.reduce((best, curr) => 
    curr.analysis.trl.riskScore < best.analysis.trl.riskScore ? curr : best
  );
  
  const bestValue = configs.reduce((best, curr) => 
    curr.analysis.riskAdjustedValue > best.analysis.riskAdjustedValue ? curr : best
  );
  
  const summary = `Best overall value: ${bestValue.name} (score: ${bestValue.analysis.riskAdjustedValue.toFixed(1)}). ` +
    `Highest performance: ${bestPerformance.name}. ` +
    `Most cost-effective: ${bestCost.name}. ` +
    `Lowest risk: ${bestRisk.name}.`;
  
  return {
    bestPerformance: bestPerformance.name,
    bestCost: bestCost.name,
    bestRisk: bestRisk.name,
    bestValue: bestValue.name,
    summary
  };
}
