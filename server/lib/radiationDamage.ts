/**
 * NRL Displacement Damage Dose (DDD) Radiation Degradation Model
 * 
 * This module implements the Naval Research Laboratory's displacement damage dose
 * approach for predicting solar cell degradation in space radiation environments.
 * 
 * References:
 * - Anspaugh, B. E. (1996). GaAs solar cell radiation handbook (JPL Publication 96-9)
 * - Messenger, S. R., et al. (2001). Modeling solar cell degradation in space
 */

/**
 * Radiation environment parameters for different mission phases
 */
export interface RadiationEnvironment {
  /** Proton fluence in particles/cm² */
  protonFluence: number;
  /** Average proton energy in MeV */
  protonEnergy: number;
  /** Electron fluence in particles/cm² */
  electronFluence: number;
  /** Average electron energy in MeV */
  electronEnergy: number;
}

/**
 * Cell-specific radiation damage coefficients
 */
export interface DamageCoefficients {
  /** Cell technology identifier */
  cellType: string;
  /** Proton damage coefficient (MeV·cm²) */
  protonDamageCoeff: number;
  /** Electron damage coefficient (MeV·cm²) */
  electronDamageCoeff: number;
  /** Annealing factor (temperature-dependent recovery) */
  annealingFactor: number;
}

/**
 * Database of damage coefficients for different cell technologies
 * Based on published test data and flight experience
 */
const DAMAGE_COEFFICIENTS: Record<string, DamageCoefficients> = {
  // Silicon cells
  'si_standard': {
    cellType: 'Silicon (Standard)',
    protonDamageCoeff: 5.5e-9, // MeV·cm²
    electronDamageCoeff: 2.8e-9,
    annealingFactor: 0.15, // 15% recovery at operating temps
  },
  'si_bsfr': {
    cellType: 'Silicon (BSFR)',
    protonDamageCoeff: 4.8e-9,
    electronDamageCoeff: 2.5e-9,
    annealingFactor: 0.18,
  },
  
  // GaAs single junction
  'gaas_single': {
    cellType: 'GaAs Single Junction',
    protonDamageCoeff: 3.2e-9,
    electronDamageCoeff: 1.8e-9,
    annealingFactor: 0.10,
  },
  
  // Multi-junction cells (more radiation resistant)
  'gaas_dual': {
    cellType: 'GaAs/Ge Dual Junction',
    protonDamageCoeff: 2.8e-9,
    electronDamageCoeff: 1.5e-9,
    annealingFactor: 0.12,
  },
  'gaas_triple': {
    cellType: 'GaInP/GaAs/Ge Triple Junction',
    protonDamageCoeff: 2.4e-9,
    electronDamageCoeff: 1.3e-9,
    annealingFactor: 0.08,
  },
  'gaas_inverted': {
    cellType: 'Inverted Metamorphic Multi-Junction (IMM)',
    protonDamageCoeff: 2.0e-9,
    electronDamageCoeff: 1.1e-9,
    annealingFactor: 0.06,
  },
  
  // Advanced technologies
  'perovskite_si': {
    cellType: 'Perovskite/Si Tandem',
    protonDamageCoeff: 3.5e-9, // Less flight data, conservative estimate
    electronDamageCoeff: 2.0e-9,
    annealingFactor: 0.20, // Perovskites show good recovery
  },
  'quantum_dot': {
    cellType: 'Quantum Dot Enhanced',
    protonDamageCoeff: 2.6e-9,
    electronDamageCoeff: 1.4e-9,
    annealingFactor: 0.10,
  },
};

/**
 * Map PV cell IDs to damage coefficient keys
 * This connects the technology database to the radiation model
 */
function getCellDamageCoeffs(pvCellId: string): DamageCoefficients {
  // Default mapping based on cell ID patterns
  const id = pvCellId.toLowerCase();
  
  if (id.includes('si_bsfr') || id.includes('silicon_bsfr')) {
    return DAMAGE_COEFFICIENTS['si_bsfr'];
  } else if (id.includes('si_') || id.includes('silicon')) {
    return DAMAGE_COEFFICIENTS['si_standard'];
  } else if (id.includes('gaas_triple') || id.includes('triple')) {
    return DAMAGE_COEFFICIENTS['gaas_triple'];
  } else if (id.includes('gaas_dual') || id.includes('dual')) {
    return DAMAGE_COEFFICIENTS['gaas_dual'];
  } else if (id.includes('imm') || id.includes('inverted')) {
    return DAMAGE_COEFFICIENTS['gaas_inverted'];
  } else if (id.includes('gaas')) {
    return DAMAGE_COEFFICIENTS['gaas_single'];
  } else if (id.includes('perovskite')) {
    return DAMAGE_COEFFICIENTS['perovskite_si'];
  } else if (id.includes('quantum')) {
    return DAMAGE_COEFFICIENTS['quantum_dot'];
  }
  
  // Default to GaAs triple-junction (most common for deep space)
  return DAMAGE_COEFFICIENTS['gaas_triple'];
}

/**
 * Calculate radiation environment for 16 Psyche mission
 * Based on trajectory from Earth to 2.9 AU
 * 
 * @param yearsInOperation - Mission duration in years
 * @returns Cumulative radiation environment
 */
export function getPsycheRadiationEnvironment(yearsInOperation: number): RadiationEnvironment {
  // Radiation environment at 2.9 AU is dominated by:
  // 1. Galactic Cosmic Rays (GCR) - relatively constant
  // 2. Solar Particle Events (SPE) - probabilistic
  // 3. Trapped radiation during Earth flyby (if applicable)
  
  // Annual fluence rates at 2.9 AU (particles/cm²/year)
  // These are conservative estimates based on similar missions (Dawn, Juno)
  const annualProtonFluence = 1.5e10; // 1.5×10¹⁰ protons/cm²/year
  const annualElectronFluence = 3.0e10; // 3.0×10¹⁰ electrons/cm²/year
  
  // Average energies (MeV)
  const avgProtonEnergy = 10.0; // 10 MeV (typical GCR spectrum)
  const avgElectronEnergy = 1.0; // 1 MeV
  
  return {
    protonFluence: annualProtonFluence * yearsInOperation,
    protonEnergy: avgProtonEnergy,
    electronFluence: annualElectronFluence * yearsInOperation,
    electronEnergy: avgElectronEnergy,
  };
}

/**
 * Calculate Non-Ionizing Energy Loss (NIEL) for protons
 * NIEL represents the energy deposited in atomic displacements
 * 
 * @param energy - Proton energy in MeV
 * @returns NIEL in MeV·cm²/g
 */
function calculateProtonNIEL(energy: number): number {
  // Simplified NIEL curve for GaAs (piecewise approximation)
  // Based on published data from Summers et al.
  
  if (energy < 0.1) return 0;
  if (energy < 1.0) return 50 * energy; // Low energy rise
  if (energy < 10.0) return 50 + 20 * (energy - 1); // Peak region
  if (energy < 100.0) return 230 - 10 * Math.log10(energy / 10); // Slow decline
  return 200; // High energy plateau
}

/**
 * Calculate Non-Ionizing Energy Loss (NIEL) for electrons
 * 
 * @param energy - Electron energy in MeV
 * @returns NIEL in MeV·cm²/g
 */
function calculateElectronNIEL(energy: number): number {
  // Simplified NIEL curve for electrons in GaAs
  
  if (energy < 0.1) return 0;
  if (energy < 1.0) return 5 * energy;
  if (energy < 10.0) return 5 + 3 * (energy - 1);
  return 32; // High energy plateau
}

/**
 * Calculate Displacement Damage Dose (DDD)
 * DDD = Σ(fluence × NIEL) for all particle types and energies
 * 
 * @param environment - Radiation environment parameters
 * @returns Displacement damage dose in MeV/g
 */
export function calculateDisplacementDamageDose(environment: RadiationEnvironment): number {
  // Calculate NIEL for average energies
  const protonNIEL = calculateProtonNIEL(environment.protonEnergy);
  const electronNIEL = calculateElectronNIEL(environment.electronEnergy);
  
  // Convert fluence from particles/cm² to particles/g
  // For GaAs: density ≈ 5.32 g/cm³, assume 300 μm thick cell
  const thickness_cm = 0.03; // 300 μm = 0.03 cm
  const density = 5.32; // g/cm³
  const mass_per_cm2 = thickness_cm * density; // g/cm²
  
  // DDD = fluence × NIEL / mass
  const protonDDD = (environment.protonFluence * protonNIEL) / mass_per_cm2;
  const electronDDD = (environment.electronFluence * electronNIEL) / mass_per_cm2;
  
  return protonDDD + electronDDD;
}

/**
 * Calculate remaining power factor after radiation exposure
 * Uses exponential degradation model: P/P₀ = exp(-K_d × DDD)
 * 
 * @param pvCellId - PV cell technology identifier
 * @param yearsInOperation - Mission duration in years
 * @param operatingTemp - Average operating temperature in Kelvin
 * @returns Remaining power factor (0-1)
 */
export function calculateRadiationDegradation(
  pvCellId: string,
  yearsInOperation: number,
  operatingTemp: number = 200 // Default to ~200K for deep space
): number {
  // Get cell-specific damage coefficients
  const coeffs = getCellDamageCoeffs(pvCellId);
  
  // Get radiation environment
  const environment = getPsycheRadiationEnvironment(yearsInOperation);
  
  // Calculate displacement damage dose
  const DDD = calculateDisplacementDamageDose(environment);
  
  // Calculate damage coefficient (average of proton and electron weighted by fluence)
  const totalFluence = environment.protonFluence + environment.electronFluence;
  
  // Guard against division by zero
  if (totalFluence === 0 || !isFinite(totalFluence)) {
    // No radiation exposure, return no degradation
    return 1.0;
  }
  
  const weightedDamageCoeff = 
    (coeffs.protonDamageCoeff * environment.protonFluence + 
     coeffs.electronDamageCoeff * environment.electronFluence) / totalFluence;
  
  // Calculate degradation with exponential model
  const degradationFactor = Math.exp(-weightedDamageCoeff * DDD);
  
  // Guard against NaN
  if (!isFinite(degradationFactor)) {
    console.warn('[Radiation Model] Invalid degradation factor, using fallback');
    return 1.0;
  }
  
  // Apply annealing (temperature-dependent recovery)
  // Annealing is more effective at higher temperatures
  const annealingEffect = coeffs.annealingFactor * Math.max(0, (operatingTemp - 150) / 100);
  const recoveredFactor = degradationFactor + (1 - degradationFactor) * annealingEffect;
  
  // Clamp to reasonable range [0.5, 1.0]
  // Even heavily damaged cells retain some function
  return Math.max(0.5, Math.min(1.0, recoveredFactor));
}

/**
 * Get detailed degradation breakdown for reporting
 * 
 * @param pvCellId - PV cell technology identifier
 * @param yearsInOperation - Mission duration in years
 * @returns Detailed degradation analysis
 */
export function getRadiationDegradationDetails(
  pvCellId: string,
  yearsInOperation: number
): {
  remainingPowerFactor: number;
  displacementDamageDose: number;
  protonContribution: number;
  electronContribution: number;
  annealingRecovery: number;
  cellType: string;
} {
  const coeffs = getCellDamageCoeffs(pvCellId);
  const environment = getPsycheRadiationEnvironment(yearsInOperation);
  const DDD = calculateDisplacementDamageDose(environment);
  
  // Calculate individual contributions
  const protonNIEL = calculateProtonNIEL(environment.protonEnergy);
  const electronNIEL = calculateElectronNIEL(environment.electronEnergy);
  const thickness_cm = 0.03;
  const density = 5.32;
  const mass_per_cm2 = thickness_cm * density;
  
  const protonDDD = (environment.protonFluence * protonNIEL) / mass_per_cm2;
  const electronDDD = (environment.electronFluence * electronNIEL) / mass_per_cm2;
  
  const totalFluence = environment.protonFluence + environment.electronFluence;
  const weightedDamageCoeff = 
    (coeffs.protonDamageCoeff * environment.protonFluence + 
     coeffs.electronDamageCoeff * environment.electronFluence) / totalFluence;
  
  const degradationFactor = Math.exp(-weightedDamageCoeff * DDD);
  const operatingTemp = 200; // Assume 200K
  const annealingEffect = coeffs.annealingFactor * Math.max(0, (operatingTemp - 150) / 100);
  const recoveredFactor = degradationFactor + (1 - degradationFactor) * annealingEffect;
  const finalFactor = Math.max(0.5, Math.min(1.0, recoveredFactor));
  
  return {
    remainingPowerFactor: finalFactor,
    displacementDamageDose: DDD,
    protonContribution: protonDDD / DDD,
    electronContribution: electronDDD / DDD,
    annealingRecovery: annealingEffect,
    cellType: coeffs.cellType,
  };
}
