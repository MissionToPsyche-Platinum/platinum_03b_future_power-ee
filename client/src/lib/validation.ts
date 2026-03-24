/**
 * Parameter Validation Utilities
 * 
 * Provides validation rules and warning messages for spacecraft power system parameters
 * to help users identify potentially unrealistic or problematic input values.
 */

export interface ValidationWarning {
  type: 'warning' | 'error' | 'info';
  message: string;
  field: string;
}

/**
 * Validate concentrator area
 */
export function validateConcentratorArea(area: number): ValidationWarning | null {
  if (area < 0.5) {
    return {
      type: 'warning',
      field: 'concentratorArea',
      message: 'Concentrator area seems very small - typical values are 2-10 m² for deep space missions'
    };
  }
  if (area > 20) {
    return {
      type: 'warning',
      field: 'concentratorArea',
      message: 'Concentrator area seems very large - consider structural mass and deployment complexity'
    };
  }
  return null;
}

/**
 * Validate PV cell area
 */
export function validatePVArea(area: number): ValidationWarning | null {
  if (area < 0.1) {
    return {
      type: 'warning',
      field: 'pvArea',
      message: 'PV area seems very small - typical values are 0.5-5 m² for deep space missions'
    };
  }
  if (area > 15) {
    return {
      type: 'warning',
      field: 'pvArea',
      message: 'PV area seems very large - consider mass budget and deployment constraints'
    };
  }
  return null;
}

/**
 * Validate battery capacity
 */
export function validateBatteryCapacity(capacity: number, missionDuration?: number): ValidationWarning | null {
  if (capacity < 1000) {
    return {
      type: 'warning',
      field: 'batteryCapacity',
      message: 'Battery capacity seems low - typical deep space missions use 5000-20000 Wh'
    };
  }
  if (capacity > 50000) {
    return {
      type: 'warning',
      field: 'batteryCapacity',
      message: 'Battery capacity seems very high - consider mass budget (typical Li-ion: ~150 Wh/kg)'
    };
  }
  if (missionDuration && missionDuration > 5 && capacity < 5000) {
    return {
      type: 'warning',
      field: 'batteryCapacity',
      message: `For ${missionDuration}-year mission, consider 10000+ Wh to account for degradation (0.3%/year)`
    };
  }
  return null;
}

/**
 * Validate base load power
 */
export function validateBaseLoad(load: number): ValidationWarning | null {
  if (load < 10) {
    return {
      type: 'warning',
      field: 'baseLoad',
      message: 'Base load seems very low - typical spacecraft require 50-300 W for housekeeping systems'
    };
  }
  if (load > 1000) {
    return {
      type: 'warning',
      field: 'baseLoad',
      message: 'Base load seems very high - verify power budget includes only continuous systems'
    };
  }
  return null;
}

/**
 * Validate peak power
 */
export function validatePeakPower(peak: number, average: number): ValidationWarning | null {
  if (peak < average) {
    return {
      type: 'error',
      field: 'peakPower',
      message: 'Peak power must be greater than or equal to average power'
    };
  }
  if (peak > average * 5) {
    return {
      type: 'warning',
      field: 'peakPower',
      message: 'Peak power is >5x average - ensure battery can handle high discharge rates'
    };
  }
  return null;
}

/**
 * Validate simulation duration
 */
export function validateSimulationDuration(duration: number): ValidationWarning | null {
  if (duration < 1) {
    return {
      type: 'warning',
      field: 'simulationDuration',
      message: 'Simulation duration seems very short - consider at least one full orbit period'
    };
  }
  if (duration > 720) { // 30 days
    return {
      type: 'warning',
      field: 'simulationDuration',
      message: 'Simulation duration >30 days may take longer to compute - consider shorter periods'
    };
  }
  return null;
}

/**
 * Validate mission duration (years)
 */
export function validateMissionDuration(years: number): ValidationWarning | null {
  if (years < 1) {
    return {
      type: 'warning',
      field: 'missionDuration',
      message: 'Mission duration seems very short - typical deep space missions last 5-15 years'
    };
  }
  if (years > 20) {
    return {
      type: 'warning',
      field: 'missionDuration',
      message: 'Mission duration >20 years - ensure battery degradation (0.3%/year) is acceptable'
    };
  }
  return null;
}

/**
 * Validate years in operation (mission year)
 */
export function validateYearsInOperation(year: number, missionDuration: number): ValidationWarning | null {
  if (year < 0) {
    return {
      type: 'error',
      field: 'yearsInOperation',
      message: 'Years in operation cannot be negative'
    };
  }
  if (year > missionDuration) {
    return {
      type: 'warning',
      field: 'yearsInOperation',
      message: `Year ${year} exceeds mission duration of ${missionDuration} years`
    };
  }
  return null;
}

/**
 * Validate energy margin
 */
export function validateEnergyMargin(margin: number): ValidationWarning | null {
  if (margin < 10) {
    return {
      type: 'warning',
      field: 'energyMargin',
      message: 'Energy margin <10% is risky - NASA typically requires 20-30% margin for safety'
    };
  }
  if (margin > 100) {
    return {
      type: 'warning',
      field: 'energyMargin',
      message: 'Energy margin >100% may indicate oversized system - consider mass/cost optimization'
    };
  }
  return null;
}

/**
 * Validate minimum SOC
 */
export function validateMinSOC(soc: number): ValidationWarning | null {
  if (soc < 10) {
    return {
      type: 'warning',
      field: 'minSOC',
      message: 'Minimum SOC <10% risks battery damage - typical safe range is 20-30%'
    };
  }
  if (soc > 50) {
    return {
      type: 'warning',
      field: 'minSOC',
      message: 'Minimum SOC >50% limits usable capacity - consider lowering to 20-30%'
    };
  }
  return null;
}

/**
 * Validate eclipse duration
 */
export function validateEclipseDuration(hours: number): ValidationWarning | null {
  if (hours < 0.1) {
    return {
      type: 'warning',
      field: 'eclipseDuration',
      message: 'Eclipse duration seems very short - verify orbital geometry'
    };
  }
  if (hours > 12) {
    return {
      type: 'warning',
      field: 'eclipseDuration',
      message: 'Eclipse duration >12 hours is unusual - ensure battery capacity can sustain load'
    };
  }
  return null;
}

/**
 * Validate maximum mass constraint
 */
export function validateMaxMass(mass: number): ValidationWarning | null {
  if (mass < 10) {
    return {
      type: 'warning',
      field: 'maxMass',
      message: 'Mass budget <10 kg is very tight - typical power systems are 30-100 kg'
    };
  }
  if (mass > 500) {
    return {
      type: 'warning',
      field: 'maxMass',
      message: 'Mass budget >500 kg is very generous - verify against spacecraft total mass'
    };
  }
  return null;
}

/**
 * Validate maximum cost constraint
 */
export function validateMaxCost(cost: number): ValidationWarning | null {
  if (cost < 100000) {
    return {
      type: 'warning',
      field: 'maxCost',
      message: 'Cost budget <$100k is very low - typical space-qualified power systems cost $1-10M'
    };
  }
  if (cost > 50000000) {
    return {
      type: 'warning',
      field: 'maxCost',
      message: 'Cost budget >$50M is very high - verify against mission total budget'
    };
  }
  return null;
}

/**
 * Validate all parameters for a simulation configuration
 */
export function validateSimulationConfig(config: {
  concentratorArea?: number;
  pvArea?: number;
  batteryCapacity?: number;
  baseLoad?: number;
  peakPower?: number;
  averagePower?: number;
  simulationDuration?: number;
  missionDuration?: number;
  yearsInOperation?: number;
  energyMargin?: number;
  minSOC?: number;
  eclipseDuration?: number;
  maxMass?: number;
  maxCost?: number;
}): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (config.concentratorArea !== undefined) {
    const w = validateConcentratorArea(config.concentratorArea);
    if (w) warnings.push(w);
  }

  if (config.pvArea !== undefined) {
    const w = validatePVArea(config.pvArea);
    if (w) warnings.push(w);
  }

  if (config.batteryCapacity !== undefined) {
    const w = validateBatteryCapacity(config.batteryCapacity, config.missionDuration);
    if (w) warnings.push(w);
  }

  if (config.baseLoad !== undefined) {
    const w = validateBaseLoad(config.baseLoad);
    if (w) warnings.push(w);
  }

  if (config.peakPower !== undefined && config.averagePower !== undefined) {
    const w = validatePeakPower(config.peakPower, config.averagePower);
    if (w) warnings.push(w);
  }

  if (config.simulationDuration !== undefined) {
    const w = validateSimulationDuration(config.simulationDuration);
    if (w) warnings.push(w);
  }

  if (config.missionDuration !== undefined) {
    const w = validateMissionDuration(config.missionDuration);
    if (w) warnings.push(w);
  }

  if (config.yearsInOperation !== undefined && config.missionDuration !== undefined) {
    const w = validateYearsInOperation(config.yearsInOperation, config.missionDuration);
    if (w) warnings.push(w);
  }

  if (config.energyMargin !== undefined) {
    const w = validateEnergyMargin(config.energyMargin);
    if (w) warnings.push(w);
  }

  if (config.minSOC !== undefined) {
    const w = validateMinSOC(config.minSOC);
    if (w) warnings.push(w);
  }

  if (config.eclipseDuration !== undefined) {
    const w = validateEclipseDuration(config.eclipseDuration);
    if (w) warnings.push(w);
  }

  if (config.maxMass !== undefined) {
    const w = validateMaxMass(config.maxMass);
    if (w) warnings.push(w);
  }

  if (config.maxCost !== undefined) {
    const w = validateMaxCost(config.maxCost);
    if (w) warnings.push(w);
  }

  return warnings;
}
