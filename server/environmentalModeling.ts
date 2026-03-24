/**
 * Advanced Environmental Modeling for 16 Psyche Mission
 * 
 * Implements:
 * - Radiation damage effects on solar cells
 * - Thermal cycling fatigue
 * - Micrometeorite impact probability
 * - Battery degradation from temperature cycling
 */

export interface EnvironmentalFactors {
  // Radiation environment
  radiationFlux: number; // particles/cm²/s (protons + electrons)
  radiationEnergy: number; // MeV average
  missionDuration: number; // years
  
  // Thermal environment
  minTemperature: number; // K
  maxTemperature: number; // K
  cyclesPerOrbit: number; // thermal cycles per orbit
  orbitPeriod: number; // hours
  
  // Micrometeorite environment
  meteoriteFlux: number; // impacts/m²/year
  averageSize: number; // micrometers
}

export interface DegradationResult {
  pvDegradation: number; // fractional power loss (0-1)
  batteryDegradation: number; // fractional capacity loss (0-1)
  impactProbability: number; // probability of critical impact (0-1)
  thermalFatigue: number; // fractional degradation from cycling (0-1)
  totalDegradation: number; // combined effect (0-1)
  degradationByYear: Array<{
    year: number;
    pvPower: number; // fraction of original
    batteryCapacity: number; // fraction of original
  }>;
}

/**
 * Calculate radiation-induced degradation for solar cells
 * Based on published GaAs degradation data:
 * - GaAs: ~10-15% degradation per 10^15 1 MeV eq. electrons/cm²
 * - Silicon: ~20-30% degradation per 10^15 1 MeV eq. electrons/cm²
 */
export function calculateRadiationDegradation(
  cellType: string,
  radiationFlux: number, // particles/cm²/s
  radiationEnergy: number, // MeV
  missionDuration: number // years
): number {
  // Convert mission duration to seconds
  const secondsPerYear = 365.25 * 24 * 3600;
  const totalSeconds = missionDuration * secondsPerYear;
  
  // Calculate total fluence (particles/cm²)
  const totalFluence = radiationFlux * totalSeconds;
  
  // Normalize to 1 MeV equivalent electrons
  const energyFactor = Math.sqrt(radiationEnergy); // simplified energy scaling
  const equivalentFluence = totalFluence * energyFactor;
  
  // Degradation rates per 10^15 1 MeV eq. electrons/cm²
  let degradationRate = 0.15; // default for GaAs
  
  if (cellType.toLowerCase().includes('silicon') || cellType.toLowerCase().includes('si ')) {
    degradationRate = 0.25; // silicon degrades faster
  } else if (cellType.toLowerCase().includes('gaas') || cellType.toLowerCase().includes('multi-junction')) {
    degradationRate = 0.12; // multi-junction GaAs is more resistant
  } else if (cellType.toLowerCase().includes('perovskite')) {
    degradationRate = 0.35; // perovskite less radiation-hard
  } else if (cellType.toLowerCase().includes('quantum dot')) {
    degradationRate = 0.20;
  }
  
  // Calculate degradation
  const fluenceUnits = equivalentFluence / 1e15;
  const degradation = Math.min(degradationRate * fluenceUnits, 0.95); // cap at 95%
  
  return degradation;
}

/**
 * Calculate thermal cycling fatigue using Coffin-Manson relationship
 * Fatigue life: Nf = C * (ΔT)^-m
 * where C and m are material constants
 */
export function calculateThermalFatigue(
  minTemp: number, // K
  maxTemp: number, // K
  cyclesPerOrbit: number,
  orbitPeriod: number, // hours
  missionDuration: number // years
): number {
  const deltaT = maxTemp - minTemp;
  
  // Total number of thermal cycles over mission
  const orbitsPerYear = (365.25 * 24) / orbitPeriod;
  const totalCycles = cyclesPerOrbit * orbitsPerYear * missionDuration;
  
  // Coffin-Manson constants for solar cell solder joints
  const C = 1e6; // cycles to failure at 1K delta
  const m = 2.0; // temperature exponent
  
  // Calculate fatigue life
  const fatigueLife = C * Math.pow(deltaT, -m);
  
  // Degradation is ratio of cycles experienced to fatigue life
  const degradation = Math.min(totalCycles / fatigueLife, 0.90);
  
  return degradation;
}

/**
 * Calculate micrometeorite impact probability using Grün flux model
 * Flux ~ m^-α where m is mass and α ≈ 1.34 for main belt
 */
export function calculateImpactProbability(
  meteoriteFlux: number, // impacts/m²/year
  averageSize: number, // micrometers
  panelArea: number, // m²
  missionDuration: number // years
): number {
  // Total expected impacts
  const totalImpacts = meteoriteFlux * panelArea * missionDuration;
  
  // Critical size threshold (micrometers) - impacts above this cause significant damage
  const criticalSize = 100; // 100 microns
  
  // Power law distribution: fraction above critical size
  const alpha = 1.34;
  const fractionCritical = Math.pow(criticalSize / averageSize, -alpha);
  
  // Expected critical impacts
  const criticalImpacts = totalImpacts * fractionCritical;
  
  // Probability of at least one critical impact (Poisson distribution)
  const probability = 1 - Math.exp(-criticalImpacts);
  
  return probability;
}

/**
 * Calculate battery degradation from temperature cycling
 * Based on cycle life degradation models
 */
export function calculateBatteryDegradation(
  minTemp: number, // K
  maxTemp: number, // K
  cyclesPerOrbit: number,
  orbitPeriod: number, // hours
  missionDuration: number // years
): number {
  const deltaT = maxTemp - minTemp;
  
  // Total thermal cycles
  const orbitsPerYear = (365.25 * 24) / orbitPeriod;
  const totalCycles = cyclesPerOrbit * orbitsPerYear * missionDuration;
  
  // Temperature stress factor (normalized to 20K delta)
  const tempStressFactor = Math.pow(deltaT / 20, 1.5);
  
  // Base degradation rate: 0.5% per 1000 cycles at 20K delta
  const baseRate = 0.005 / 1000;
  
  // Actual degradation rate with temperature stress
  const degradationRate = baseRate * tempStressFactor;
  
  // Total degradation
  const degradation = Math.min(degradationRate * totalCycles, 0.80); // cap at 80%
  
  return degradation;
}

/**
 * Calculate year-by-year degradation progression
 */
export function calculateDegradationProgression(
  cellType: string,
  factors: EnvironmentalFactors,
  panelArea: number
): Array<{ year: number; pvPower: number; batteryCapacity: number }> {
  const progression = [];
  
  for (let year = 0; year <= factors.missionDuration; year++) {
    // Calculate degradation up to this year
    const radDeg = calculateRadiationDegradation(
      cellType,
      factors.radiationFlux,
      factors.radiationEnergy,
      year
    );
    
    const thermalDeg = calculateThermalFatigue(
      factors.minTemperature,
      factors.maxTemperature,
      factors.cyclesPerOrbit,
      factors.orbitPeriod,
      year
    );
    
    const batteryDeg = calculateBatteryDegradation(
      factors.minTemperature,
      factors.maxTemperature,
      factors.cyclesPerOrbit,
      factors.orbitPeriod,
      year
    );
    
    // Combined PV degradation (multiplicative)
    const pvPower = (1 - radDeg) * (1 - thermalDeg);
    
    // Battery degradation
    const batteryCapacity = 1 - batteryDeg;
    
    progression.push({
      year,
      pvPower,
      batteryCapacity,
    });
  }
  
  return progression;
}

/**
 * Main function to calculate all environmental degradation effects
 */
export function calculateEnvironmentalDegradation(
  cellType: string,
  panelArea: number,
  factors: EnvironmentalFactors
): DegradationResult {
  // Calculate individual degradation components
  const pvRadiation = calculateRadiationDegradation(
    cellType,
    factors.radiationFlux,
    factors.radiationEnergy,
    factors.missionDuration
  );
  
  const thermalFatigue = calculateThermalFatigue(
    factors.minTemperature,
    factors.maxTemperature,
    factors.cyclesPerOrbit,
    factors.orbitPeriod,
    factors.missionDuration
  );
  
  const impactProb = calculateImpactProbability(
    factors.meteoriteFlux,
    factors.averageSize,
    panelArea,
    factors.missionDuration
  );
  
  const batteryDeg = calculateBatteryDegradation(
    factors.minTemperature,
    factors.maxTemperature,
    factors.cyclesPerOrbit,
    factors.orbitPeriod,
    factors.missionDuration
  );
  
  // Combined degradation (multiplicative for independent effects)
  const pvDegradation = 1 - (1 - pvRadiation) * (1 - thermalFatigue);
  const batteryDegradation = batteryDeg;
  
  // Total system degradation (weighted average)
  const totalDegradation = 0.6 * pvDegradation + 0.4 * batteryDegradation;
  
  // Calculate year-by-year progression
  const degradationByYear = calculateDegradationProgression(
    cellType,
    factors,
    panelArea
  );
  
  return {
    pvDegradation,
    batteryDegradation,
    impactProbability: impactProb,
    thermalFatigue,
    totalDegradation,
    degradationByYear,
  };
}

/**
 * Get default environmental factors for 16 Psyche mission
 */
export function getDefaultPsycheEnvironment(): EnvironmentalFactors {
  return {
    // Radiation: main belt is relatively benign compared to Jupiter
    radiationFlux: 1e6, // particles/cm²/s (lower than inner solar system)
    radiationEnergy: 1.0, // MeV average
    missionDuration: 6, // years (default mission)
    
    // Thermal: large temperature swings at 2.9 AU
    minTemperature: 150, // K (cold side, away from sun)
    maxTemperature: 250, // K (sun-facing side)
    cyclesPerOrbit: 1, // one cycle per Psyche rotation
    orbitPeriod: 4.2, // hours (Psyche rotation period)
    
    // Micrometeorites: main belt has higher flux
    meteoriteFlux: 1e-6, // impacts/m²/year (main belt estimate)
    averageSize: 50, // micrometers
  };
}
