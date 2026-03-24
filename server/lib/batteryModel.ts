/**
 * Advanced Battery State of Charge (SOC) Modeling
 * 
 * Implements Equivalent Circuit Model (ECM) with temperature-dependent
 * internal resistance, coulombic efficiency, and capacity fade.
 * 
 * References:
 * - Pop, V., et al. (2008). Battery Management Systems
 * - Plett, G. L. (2015). Battery Management Systems, Volume I: Battery Modeling
 */

/**
 * Battery chemistry types with different characteristics
 */
export type BatteryChemistry = 
  | 'li_ion_nmc' // Nickel Manganese Cobalt
  | 'li_ion_lfp' // Lithium Iron Phosphate
  | 'li_ion_nca' // Nickel Cobalt Aluminum
  | 'solid_state_li' // Solid-state lithium
  | 'silver_zinc' // Silver-Zinc (legacy)
  | 'nickel_hydrogen'; // Nickel-Hydrogen (legacy)

/**
 * Equivalent Circuit Model parameters
 */
export interface ECMParameters {
  /** Open circuit voltage vs. SOC curve (11 points from 0% to 100%) */
  ocvCurve: number[];
  /** Series resistance in Ohms (SOC-dependent) */
  seriesResistance: number[];
  /** RC pair resistance in Ohms */
  rc1Resistance: number;
  /** RC pair capacitance in Farads */
  rc1Capacitance: number;
  /** Temperature coefficient for resistance (Ohm/K) */
  tempCoeffResistance: number;
  /** Temperature coefficient for capacity (%/K) */
  tempCoeffCapacity: number;
  /** Nominal capacity in Ah */
  nominalCapacity: number;
  /** Coulombic efficiency at nominal conditions */
  nominalCoulombicEff: number;
  /** Cycle life (80% capacity retention) */
  cycleLife: number;
  /** Calendar aging rate (%/year) */
  calendarAgingRate: number;
}

/**
 * Database of ECM parameters for different battery chemistries
 */
const ECM_DATABASE: Record<BatteryChemistry, ECMParameters> = {
  li_ion_nmc: {
    // NMC cells: high energy density, moderate cycle life
    ocvCurve: [3.0, 3.4, 3.5, 3.6, 3.65, 3.7, 3.75, 3.85, 4.0, 4.1, 4.2],
    seriesResistance: [0.08, 0.06, 0.05, 0.04, 0.03, 0.03, 0.03, 0.04, 0.05, 0.06, 0.08],
    rc1Resistance: 0.02,
    rc1Capacitance: 1000,
    tempCoeffResistance: -0.001, // Resistance decreases with temperature
    tempCoeffCapacity: 0.005, // 0.5%/K capacity increase
    nominalCapacity: 50, // Ah (typical spacecraft battery module)
    nominalCoulombicEff: 0.98,
    cycleLife: 5000,
    calendarAgingRate: 0.02, // 2%/year
  },
  
  li_ion_lfp: {
    // LFP cells: very long cycle life, lower energy density
    ocvCurve: [2.5, 3.0, 3.2, 3.25, 3.28, 3.30, 3.32, 3.35, 3.4, 3.5, 3.65],
    seriesResistance: [0.10, 0.07, 0.06, 0.05, 0.04, 0.04, 0.04, 0.05, 0.06, 0.07, 0.10],
    rc1Resistance: 0.025,
    rc1Capacitance: 1200,
    tempCoeffResistance: -0.0012,
    tempCoeffCapacity: 0.004,
    nominalCapacity: 40,
    nominalCoulombicEff: 0.99,
    cycleLife: 10000,
    calendarAgingRate: 0.015, // 1.5%/year
  },
  
  li_ion_nca: {
    // NCA cells: highest energy density, moderate cycle life
    ocvCurve: [3.0, 3.5, 3.6, 3.65, 3.7, 3.75, 3.8, 3.9, 4.05, 4.15, 4.25],
    seriesResistance: [0.07, 0.05, 0.04, 0.03, 0.025, 0.025, 0.025, 0.03, 0.04, 0.05, 0.07],
    rc1Resistance: 0.018,
    rc1Capacitance: 900,
    tempCoeffResistance: -0.0011,
    tempCoeffCapacity: 0.0055,
    nominalCapacity: 55,
    nominalCoulombicEff: 0.97,
    cycleLife: 3000,
    calendarAgingRate: 0.025, // 2.5%/year
  },
  
  solid_state_li: {
    // Solid-state: emerging technology, very long life
    ocvCurve: [3.2, 3.6, 3.7, 3.75, 3.8, 3.85, 3.9, 3.95, 4.1, 4.2, 4.3],
    seriesResistance: [0.05, 0.04, 0.03, 0.025, 0.02, 0.02, 0.02, 0.025, 0.03, 0.04, 0.05],
    rc1Resistance: 0.015,
    rc1Capacitance: 800,
    tempCoeffResistance: -0.0008,
    tempCoeffCapacity: 0.003,
    nominalCapacity: 60,
    nominalCoulombicEff: 0.995,
    cycleLife: 100000,
    calendarAgingRate: 0.005, // 0.5%/year
  },
  
  silver_zinc: {
    // Silver-Zinc: high power, limited cycle life
    ocvCurve: [1.2, 1.4, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9],
    seriesResistance: [0.03, 0.02, 0.015, 0.01, 0.008, 0.008, 0.008, 0.01, 0.015, 0.02, 0.03],
    rc1Resistance: 0.01,
    rc1Capacitance: 500,
    tempCoeffResistance: -0.0006,
    tempCoeffCapacity: 0.006,
    nominalCapacity: 30,
    nominalCoulombicEff: 0.95,
    cycleLife: 100,
    calendarAgingRate: 0.05, // 5%/year
  },
  
  nickel_hydrogen: {
    // NiH2: very long life, lower energy density
    ocvCurve: [1.0, 1.15, 1.2, 1.25, 1.28, 1.30, 1.32, 1.35, 1.4, 1.45, 1.5],
    seriesResistance: [0.12, 0.09, 0.08, 0.07, 0.06, 0.06, 0.06, 0.07, 0.08, 0.09, 0.12],
    rc1Resistance: 0.03,
    rc1Capacitance: 1500,
    tempCoeffResistance: -0.0015,
    tempCoeffCapacity: 0.007,
    nominalCapacity: 35,
    nominalCoulombicEff: 0.92,
    cycleLife: 50000,
    calendarAgingRate: 0.01, // 1%/year
  },
};

/**
 * Map battery IDs to chemistry types
 */
function getBatteryChemistry(batteryId: string): BatteryChemistry {
  const id = batteryId.toLowerCase();
  
  if (id.includes('nmc') || id.includes('nickel_manganese')) {
    return 'li_ion_nmc';
  } else if (id.includes('lfp') || id.includes('lifepo4') || id.includes('iron_phosphate')) {
    return 'li_ion_lfp';
  } else if (id.includes('nca') || id.includes('nickel_cobalt_aluminum')) {
    return 'li_ion_nca';
  } else if (id.includes('solid_state') || id.includes('solid-state')) {
    return 'solid_state_li';
  } else if (id.includes('silver_zinc') || id.includes('agzn')) {
    return 'silver_zinc';
  } else if (id.includes('nickel_hydrogen') || id.includes('nih2')) {
    return 'nickel_hydrogen';
  }
  
  // Default to NMC (most common for modern spacecraft)
  return 'li_ion_nmc';
}

/**
 * Interpolate value from lookup table based on SOC
 * 
 * @param soc - State of charge (0-1)
 * @param table - Lookup table with 11 values (0%, 10%, ..., 100%)
 * @returns Interpolated value
 */
function interpolateSOC(soc: number, table: number[]): number {
  // Clamp SOC to [0, 1]
  const clampedSOC = Math.max(0, Math.min(1, soc));
  
  // Convert to table index (0-10)
  const index = clampedSOC * 10;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  
  if (lowerIndex === upperIndex) {
    return table[lowerIndex];
  }
  
  // Linear interpolation
  const fraction = index - lowerIndex;
  return table[lowerIndex] * (1 - fraction) + table[upperIndex] * fraction;
}

/**
 * Calculate temperature-dependent capacity
 * 
 * @param nominalCapacity - Capacity at reference temperature (Ah)
 * @param temperature - Current temperature (K)
 * @param tempCoeff - Temperature coefficient (%/K)
 * @param refTemp - Reference temperature (K), default 298K
 * @returns Adjusted capacity (Ah)
 */
function getTemperatureAdjustedCapacity(
  nominalCapacity: number,
  temperature: number,
  tempCoeff: number,
  refTemp: number = 298
): number {
  const tempDiff = temperature - refTemp;
  const capacityFactor = 1 + (tempCoeff * tempDiff);
  return nominalCapacity * Math.max(0.5, Math.min(1.5, capacityFactor));
}

/**
 * Calculate temperature-dependent resistance
 * 
 * @param nominalResistance - Resistance at reference temperature (Ohm)
 * @param temperature - Current temperature (K)
 * @param tempCoeff - Temperature coefficient (Ohm/K)
 * @param refTemp - Reference temperature (K), default 298K
 * @returns Adjusted resistance (Ohm)
 */
function getTemperatureAdjustedResistance(
  nominalResistance: number,
  temperature: number,
  tempCoeff: number,
  refTemp: number = 298
): number {
  const tempDiff = temperature - refTemp;
  return nominalResistance + (tempCoeff * tempDiff);
}

/**
 * Calculate capacity fade from cycling
 * 
 * @param cycleCount - Number of charge/discharge cycles
 * @param cycleLife - Cycles to 80% capacity retention
 * @returns Remaining capacity factor (0-1)
 */
function calculateCycleFade(cycleCount: number, cycleLife: number): number {
  // Empirical fade model: exponential decay
  // At cycleLife cycles, capacity = 0.8
  const fadeRate = -Math.log(0.8) / cycleLife;
  return Math.exp(-fadeRate * cycleCount);
}

/**
 * Calculate capacity fade from calendar aging
 * 
 * @param yearsInOperation - Time since manufacture (years)
 * @param agingRate - Annual capacity loss (%/year)
 * @returns Remaining capacity factor (0-1)
 */
function calculateCalendarFade(yearsInOperation: number, agingRate: number): number {
  return Math.pow(1 - agingRate, yearsInOperation);
}

/**
 * Advanced Battery SOC Model
 * Tracks state of charge with high-fidelity physics-based model
 */
export class AdvancedBatteryModel {
  private params: ECMParameters;
  private soc: number;
  private temperature: number;
  private cycleCount: number;
  private yearsInOperation: number;
  private rc1Voltage: number; // Voltage across RC pair
  
  constructor(
    batteryId: string,
    initialSOC: number = 0.8,
    initialTemp: number = 298,
    yearsInOperation: number = 0
  ) {
    const chemistry = getBatteryChemistry(batteryId);
    this.params = ECM_DATABASE[chemistry];
    this.soc = initialSOC;
    this.temperature = initialTemp;
    this.cycleCount = 0;
    this.yearsInOperation = yearsInOperation;
    this.rc1Voltage = 0;
  }
  
  /**
   * Get current state of charge
   */
  getSOC(): number {
    return this.soc;
  }
  
  /**
   * Get effective capacity accounting for temperature and aging
   */
  getEffectiveCapacity(): number {
    const tempAdjusted = getTemperatureAdjustedCapacity(
      this.params.nominalCapacity,
      this.temperature,
      this.params.tempCoeffCapacity
    );
    
    const cycleFade = calculateCycleFade(this.cycleCount, this.params.cycleLife);
    const calendarFade = calculateCalendarFade(this.yearsInOperation, this.params.calendarAgingRate);
    
    return tempAdjusted * cycleFade * calendarFade;
  }
  
  /**
   * Get open circuit voltage at current SOC
   */
  getOCV(): number {
    return interpolateSOC(this.soc, this.params.ocvCurve);
  }
  
  /**
   * Get terminal voltage under load
   * 
   * @param current - Current in Amperes (positive = discharge, negative = charge)
   * @returns Terminal voltage in Volts
   */
  getTerminalVoltage(current: number): number {
    const ocv = this.getOCV();
    
    // Get SOC-dependent series resistance
    const nominalSeriesR = interpolateSOC(this.soc, this.params.seriesResistance);
    const seriesR = getTemperatureAdjustedResistance(
      nominalSeriesR,
      this.temperature,
      this.params.tempCoeffResistance
    );
    
    // Voltage drop across series resistance
    const seriesVoltageDrop = current * seriesR;
    
    // Voltage drop across RC pair
    const rc1VoltageDrop = this.rc1Voltage;
    
    // Terminal voltage
    return ocv - seriesVoltageDrop - rc1VoltageDrop;
  }
  
  /**
   * Update battery state for one time step
   * 
   * @param current - Current in Amperes (positive = discharge, negative = charge)
   * @param timeStepHours - Time step in hours
   * @param temperature - Current temperature in Kelvin
   */
  update(current: number, timeStepHours: number, temperature: number): void {
    this.temperature = temperature;
    
    // Get effective capacity
    const capacity = this.getEffectiveCapacity();
    
    // Calculate coulombic efficiency (decreases at high C-rates and low temps)
    const cRate = Math.abs(current) / capacity;
    const tempFactor = Math.max(0.5, (temperature - 200) / 100); // Reduced efficiency at low temps
    const rateFactor = Math.max(0.9, 1 - 0.1 * cRate); // Reduced efficiency at high rates
    const coulombicEff = this.params.nominalCoulombicEff * tempFactor * rateFactor;
    
    // Update SOC (accounting for coulombic efficiency)
    const chargeAh = current * timeStepHours;
    let effectiveChargeAh: number;
    
    if (current > 0) {
      // Discharging: full efficiency
      effectiveChargeAh = chargeAh;
    } else {
      // Charging: reduced by coulombic efficiency
      effectiveChargeAh = chargeAh * coulombicEff;
    }
    
    const deltaSOC = -effectiveChargeAh / capacity;
    this.soc = Math.max(0, Math.min(1, this.soc + deltaSOC));
    
    // Update RC pair voltage (first-order dynamics)
    const timeConstant = this.params.rc1Resistance * this.params.rc1Capacitance; // seconds
    const timeConstantHours = timeConstant / 3600;
    const alpha = Math.exp(-timeStepHours / timeConstantHours);
    const steadyStateVoltage = current * this.params.rc1Resistance;
    this.rc1Voltage = alpha * this.rc1Voltage + (1 - alpha) * steadyStateVoltage;
    
    // Track cycle count (simplified: count every full discharge)
    if (this.soc < 0.2 && current > 0) {
      this.cycleCount += 0.01; // Increment gradually
    }
  }
  
  /**
   * Get detailed state information
   */
  getState(): {
    soc: number;
    ocv: number;
    effectiveCapacity: number;
    cycleFade: number;
    calendarFade: number;
    cycleCount: number;
  } {
    const cycleFade = calculateCycleFade(this.cycleCount, this.params.cycleLife);
    const calendarFade = calculateCalendarFade(this.yearsInOperation, this.params.calendarAgingRate);
    
    return {
      soc: this.soc,
      ocv: this.getOCV(),
      effectiveCapacity: this.getEffectiveCapacity(),
      cycleFade,
      calendarFade,
      cycleCount: this.cycleCount,
    };
  }
}

/**
 * Simple interface for backward compatibility
 * Wraps AdvancedBatteryModel for use in existing simulation code
 */
export function calculateAdvancedBatterySOC(
  batteryId: string,
  currentSOC: number,
  chargePower: number, // Watts (positive = charging, negative = discharging)
  timeStepHours: number,
  temperature: number,
  batteryCapacity: number, // Wh
  yearsInOperation: number = 0
): number {
  // Create temporary model instance
  const model = new AdvancedBatteryModel(batteryId, currentSOC, temperature, yearsInOperation);
  
  // Convert power to current (assume nominal voltage from OCV curve midpoint)
  const nominalVoltage = model.getOCV();
  const current = -chargePower / nominalVoltage; // Negative because power convention is opposite
  
  // Update model
  model.update(current, timeStepHours, temperature);
  
  // Return new SOC
  return model.getSOC();
}
