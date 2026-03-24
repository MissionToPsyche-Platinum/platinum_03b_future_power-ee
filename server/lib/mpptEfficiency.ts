/**
 * MPPT Converter Efficiency Model
 * 
 * Implements load-dependent DC/DC converter efficiency based on:
 * - NASA GSFC Advanced DC/DC Converters research
 * - Commercial space-grade MPPT converter datasheets
 * - Academic literature on power electronics efficiency
 * 
 * Models:
 * - Load-dependent efficiency curves
 * - Voltage ratio effects
 * - Temperature effects on converter efficiency
 */

export interface MPPTEfficiencyParams {
  loadPowerW: number; // Current load power in Watts
  ratedPowerW: number; // Rated/maximum power of converter in Watts
  inputVoltage: number; // Input voltage (V)
  outputVoltage: number; // Output voltage (V)
  temperatureK: number; // Converter temperature in Kelvin
}

/**
 * Calculate MPPT converter efficiency based on load percentage
 * 
 * Typical space-grade MPPT efficiency characteristics:
 * - Light load (10%): 65% efficiency
 * - Medium load (30%): 85% efficiency
 * - Optimal load (50-75%): 93-97% efficiency
 * - Full load (100%): 97% efficiency
 * - Overload (>100%): 90% efficiency (if supported)
 * 
 * @param loadPercent - Load as percentage of rated power (0-100+)
 * @returns Efficiency (0-1)
 */
function calculateLoadDependentEfficiency(loadPercent: number): number {
  if (loadPercent <= 0) {
    // No load: standby losses only
    return 0.0;
  } else if (loadPercent < 10) {
    // Very light load: poor efficiency due to fixed losses
    return 0.50 + (loadPercent / 10) * 0.15; // 50% at 0%, 65% at 10%
  } else if (loadPercent < 30) {
    // Light to medium load: improving efficiency
    return 0.65 + ((loadPercent - 10) / 20) * 0.20; // 65% at 10%, 85% at 30%
  } else if (loadPercent < 75) {
    // Medium to optimal load: high efficiency
    return 0.85 + ((loadPercent - 30) / 45) * 0.08; // 85% at 30%, 93% at 75%
  } else if (loadPercent <= 100) {
    // Optimal to full load: peak efficiency
    return 0.93 + ((loadPercent - 75) / 25) * 0.04; // 93% at 75%, 97% at 100%
  } else if (loadPercent <= 120) {
    // Overload: degraded efficiency
    return 0.97 - ((loadPercent - 100) / 20) * 0.07; // 97% at 100%, 90% at 120%
  } else {
    // Severe overload: poor efficiency and potential damage
    return Math.max(0.75, 0.90 - (loadPercent - 120) * 0.005);
  }
}

/**
 * Calculate voltage ratio penalty
 * 
 * Efficiency decreases with larger voltage conversion ratios
 * Typical: 1-2% loss per voltage step
 * 
 * @param inputVoltage - Input voltage (V)
 * @param outputVoltage - Output voltage (V)
 * @returns Efficiency penalty factor (0.95-1.0)
 */
function calculateVoltageRatioPenalty(inputVoltage: number, outputVoltage: number): number {
  const ratio = Math.max(inputVoltage / outputVoltage, outputVoltage / inputVoltage);
  
  if (ratio <= 1.5) {
    // Small conversion ratio: minimal penalty
    return 1.0;
  } else if (ratio <= 3.0) {
    // Moderate ratio: small penalty
    return 1.0 - (ratio - 1.5) * 0.01; // -1% per step above 1.5x
  } else if (ratio <= 6.0) {
    // Large ratio: significant penalty
    return 0.985 - (ratio - 3.0) * 0.015; // -1.5% per step above 3x
  } else {
    // Very large ratio: substantial penalty
    return Math.max(0.90, 0.940 - (ratio - 6.0) * 0.02); // -2% per step above 6x
  }
}

/**
 * Calculate temperature effect on converter efficiency
 * 
 * Higher temperatures increase switching losses and conduction losses
 * Space-grade converters typically operate -40°C to +85°C
 * 
 * @param temperatureK - Converter temperature in Kelvin
 * @returns Temperature penalty factor (0.95-1.0)
 */
function calculateTemperaturePenalty(temperatureK: number): number {
  const tempC = temperatureK - 273.15;
  
  // Optimum efficiency at 25°C
  const optimalTempC = 25;
  
  if (tempC >= -40 && tempC <= 85) {
    // Within operational range
    const tempDelta = Math.abs(tempC - optimalTempC);
    // -0.1% to -0.2% per 10°C deviation
    const penalty = tempDelta * 0.0015; // 0.15% per 10°C
    return Math.max(0.95, 1.0 - penalty);
  } else if (tempC < -40) {
    // Below operational range: severe degradation
    return Math.max(0.80, 0.95 - ((-40 - tempC) * 0.01));
  } else {
    // Above operational range: severe degradation and potential damage
    return Math.max(0.85, 0.95 - ((tempC - 85) * 0.01));
  }
}

/**
 * Calculate overall MPPT converter efficiency
 * 
 * Combines load-dependent efficiency with voltage ratio and temperature effects
 * 
 * @param params - MPPT operating parameters
 * @returns Overall efficiency (0-1)
 */
export function calculateMPPTEfficiency(params: MPPTEfficiencyParams): number {
  const { loadPowerW, ratedPowerW, inputVoltage, outputVoltage, temperatureK } = params;
  
  // Calculate load percentage
  const loadPercent = (loadPowerW / ratedPowerW) * 100;
  
  // Base efficiency from load curve
  const baseEfficiency = calculateLoadDependentEfficiency(loadPercent);
  
  // Voltage ratio penalty
  const voltageRatioFactor = calculateVoltageRatioPenalty(inputVoltage, outputVoltage);
  
  // Temperature penalty
  const temperatureFactor = calculateTemperaturePenalty(temperatureK);
  
  // Combined efficiency
  const overallEfficiency = baseEfficiency * voltageRatioFactor * temperatureFactor;
  
  // Clamp to reasonable range
  return Math.max(0.50, Math.min(0.98, overallEfficiency));
}

/**
 * Estimate converter power loss
 * 
 * @param inputPowerW - Input power to converter (W)
 * @param efficiency - Converter efficiency (0-1)
 * @returns Power loss in Watts
 */
export function calculateConverterLoss(inputPowerW: number, efficiency: number): number {
  return inputPowerW * (1 - efficiency);
}

/**
 * Check if converter is operating within safe limits
 * 
 * @param loadPowerW - Current load power
 * @param ratedPowerW - Rated power
 * @param temperatureK - Converter temperature
 * @returns Safety status and warning message
 */
export function checkConverterSafety(
  loadPowerW: number,
  ratedPowerW: number,
  temperatureK: number
): { safe: boolean; warning?: string } {
  const loadPercent = (loadPowerW / ratedPowerW) * 100;
  const tempC = temperatureK - 273.15;
  
  if (loadPercent > 120) {
    return {
      safe: false,
      warning: `Converter overload: ${loadPercent.toFixed(1)}% of rated power. Risk of thermal shutdown or damage.`,
    };
  }
  
  if (tempC > 85) {
    return {
      safe: false,
      warning: `Converter temperature ${tempC.toFixed(1)}°C exceeds maximum (85°C). Risk of thermal shutdown.`,
    };
  }
  
  if (tempC < -40) {
    return {
      safe: false,
      warning: `Converter temperature ${tempC.toFixed(1)}°C below minimum (-40°C). Operation not guaranteed.`,
    };
  }
  
  if (loadPercent > 100 && loadPercent <= 120) {
    return {
      safe: true,
      warning: `Converter operating at ${loadPercent.toFixed(1)}% of rated power. Efficiency degraded, consider upsizing.`,
    };
  }
  
  if (loadPercent < 20) {
    return {
      safe: true,
      warning: `Converter lightly loaded (${loadPercent.toFixed(1)}%). Efficiency significantly reduced. Consider downsizing.`,
    };
  }
  
  return { safe: true };
}

/**
 * Recommend optimal converter sizing based on expected load profile
 * 
 * Best practice: size converter for 50-75% average load for optimal efficiency
 * 
 * @param averageLoadW - Average expected load power (W)
 * @param peakLoadW - Peak expected load power (W)
 * @returns Recommended converter rating (W)
 */
export function recommendConverterSize(averageLoadW: number, peakLoadW: number): number {
  // Size for average load at 60% of rating (optimal efficiency point)
  const sizeForAverage = averageLoadW / 0.60;
  
  // Ensure peak load doesn't exceed 100% of rating
  const sizeForPeak = peakLoadW;
  
  // Use the larger of the two, rounded up to nearest 50W
  const recommendedSize = Math.max(sizeForAverage, sizeForPeak);
  return Math.ceil(recommendedSize / 50) * 50;
}
