/**
 * Advanced Battery Degradation Model
 * 
 * Implements NASA-derived battery degradation models based on:
 * - NASA Ames Li-ion Battery Aging Datasets
 * - NASA/TM-2009-215751 Guidelines on Lithium-ion Battery Use in Space Applications
 * 
 * Models capacity fade, impedance growth, and cycle-dependent aging
 */

export interface BatteryDegradationParams {
  cycleCount: number;
  averageDOD: number; // Depth of discharge (0-1)
  averageTemperature: number; // Kelvin
  yearsInOperation: number;
}

export interface BatteryDegradationResult {
  capacityFadeFactor: number; // Multiplier for original capacity (1.0 = no fade, 0.7 = 30% fade)
  impedanceGrowthFactor: number; // Multiplier for internal resistance (1.0 = no growth, 2.0 = doubled)
  cycleLifeRemaining: number; // Estimated remaining cycles to EOL
  isEOL: boolean; // True if battery has reached end-of-life (30% capacity fade)
}

/**
 * Calculate battery capacity fade based on cycle count and operating conditions
 * 
 * Based on NASA data showing 30% capacity fade (2.0 Ah → 1.4 Ah) as EOL criterion
 * Degradation accelerates with:
 * - Higher depth of discharge (DOD)
 * - Higher/lower temperatures from optimum (20-40°C)
 * - Higher cycle count
 * 
 * @param params - Degradation parameters
 * @returns Capacity fade factor (1.0 = new, 0.7 = EOL)
 */
function calculateCapacityFade(params: BatteryDegradationParams): number {
  const { cycleCount, averageDOD, averageTemperature, yearsInOperation } = params;
  
  // Base degradation rate: 0.05% per cycle at nominal conditions (50% DOD, 25°C)
  const baseRatePerCycle = 0.0005;
  
  // DOD stress factor (deeper discharges cause faster aging)
  // 100% DOD → 2x degradation, 50% DOD → 1x, 20% DOD → 0.5x
  const dodStressFactor = 0.5 + (averageDOD * 1.5);
  
  // Temperature stress factor
  // Optimum: 20-40°C (293-313K) → factor = 1.0
  // Below 0°C or above 60°C → factor increases significantly
  const tempCelsius = averageTemperature - 273.15;
  let tempStressFactor = 1.0;
  
  if (tempCelsius < 20) {
    // Cold stress: increases linearly below 20°C
    tempStressFactor = 1.0 + (20 - tempCelsius) * 0.02; // +2% per degree below 20°C
  } else if (tempCelsius > 40) {
    // Heat stress: increases exponentially above 40°C
    tempStressFactor = 1.0 + Math.pow((tempCelsius - 40) / 20, 2); // Exponential above 40°C
  }
  
  // Calendar aging (time-based degradation even without cycling)
  // Approximately 2-3% per year at room temperature storage
  const calendarFade = yearsInOperation * 0.025;
  
  // Cycle-based degradation
  const cycleFade = cycleCount * baseRatePerCycle * dodStressFactor * tempStressFactor;
  
  // Total capacity fade (capped at 30% for EOL)
  const totalFade = Math.min(0.30, calendarFade + cycleFade);
  
  // Return capacity retention factor
  return 1.0 - totalFade;
}

/**
 * Calculate internal resistance growth due to aging
 * 
 * Based on NASA data showing growth in:
 * - Re (electrolyte resistance)
 * - Rct (charge transfer resistance)
 * 
 * @param params - Degradation parameters
 * @returns Impedance growth factor (1.0 = new, 2.0 = doubled resistance)
 */
function calculateImpedanceGrowth(params: BatteryDegradationParams): number {
  const { cycleCount, averageTemperature, yearsInOperation } = params;
  
  // Base impedance growth: ~0.1% per cycle
  const baseGrowthPerCycle = 0.001;
  
  // Temperature effect on impedance growth
  // Higher temperatures accelerate electrolyte decomposition
  const tempCelsius = averageTemperature - 273.15;
  const tempFactor = tempCelsius > 40 ? 1.0 + (tempCelsius - 40) * 0.05 : 1.0;
  
  // Calendar aging component
  const calendarGrowth = yearsInOperation * 0.05; // 5% per year
  
  // Cycle-based growth
  const cycleGrowth = cycleCount * baseGrowthPerCycle * tempFactor;
  
  // Total impedance growth (capped at 100% increase)
  const totalGrowth = Math.min(1.0, calendarGrowth + cycleGrowth);
  
  return 1.0 + totalGrowth;
}

/**
 * Estimate remaining cycle life to EOL (30% capacity fade)
 * 
 * @param params - Current degradation parameters
 * @param currentCapacityFactor - Current capacity retention factor
 * @returns Estimated cycles remaining until EOL
 */
function estimateRemainingCycles(
  params: BatteryDegradationParams,
  currentCapacityFactor: number
): number {
  // If already at or past EOL, return 0
  if (currentCapacityFactor <= 0.70) {
    return 0;
  }
  
  // Calculate degradation rate per cycle based on current conditions
  const baseRatePerCycle = 0.0005;
  const dodStressFactor = 0.5 + (params.averageDOD * 1.5);
  const tempCelsius = params.averageTemperature - 273.15;
  let tempStressFactor = 1.0;
  
  if (tempCelsius < 20) {
    tempStressFactor = 1.0 + (20 - tempCelsius) * 0.02;
  } else if (tempCelsius > 40) {
    tempStressFactor = 1.0 + Math.pow((tempCelsius - 40) / 20, 2);
  }
  
  const degradationRatePerCycle = baseRatePerCycle * dodStressFactor * tempStressFactor;
  
  // Remaining fade allowance
  const remainingFade = currentCapacityFactor - 0.70;
  
  // Estimated cycles to consume remaining fade allowance
  const remainingCycles = remainingFade / degradationRatePerCycle;
  
  return Math.floor(remainingCycles);
}

/**
 * Calculate comprehensive battery degradation metrics
 * 
 * @param params - Operating parameters and history
 * @returns Degradation results including capacity fade, impedance growth, and cycle life
 */
export function calculateBatteryDegradation(
  params: BatteryDegradationParams
): BatteryDegradationResult {
  const capacityFadeFactor = calculateCapacityFade(params);
  const impedanceGrowthFactor = calculateImpedanceGrowth(params);
  const cycleLifeRemaining = estimateRemainingCycles(params, capacityFadeFactor);
  const isEOL = capacityFadeFactor <= 0.70;
  
  return {
    capacityFadeFactor,
    impedanceGrowthFactor,
    cycleLifeRemaining,
    isEOL,
  };
}

/**
 * Estimate cycle count from mission duration and usage pattern
 * 
 * For LEO satellites: ~5800 cycles per year (16 orbits/day)
 * For deep space (16 Psyche): ~2080 cycles per year (4.2 hour rotation period)
 * 
 * @param yearsInOperation - Mission duration in years
 * @param rotationPeriodHours - Asteroid/body rotation period in hours
 * @returns Estimated cycle count
 */
export function estimateCycleCount(
  yearsInOperation: number,
  rotationPeriodHours: number = 4.2
): number {
  const cyclesPerDay = 24 / rotationPeriodHours;
  const cyclesPerYear = cyclesPerDay * 365.25;
  return Math.floor(yearsInOperation * cyclesPerYear);
}
