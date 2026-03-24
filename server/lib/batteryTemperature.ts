/**
 * Temperature-Dependent Battery Performance Model
 * 
 * Implements temperature effects on Li-ion battery performance based on:
 * - NASA/TM-2009-215751 Guidelines
 * - Academic literature on low-temperature Li-ion performance
 * 
 * Models:
 * - Capacity derating at low/high temperatures
 * - Voltage curve slope changes
 * - Internal resistance temperature dependence
 * - Charge/discharge rate limits
 */

export interface TemperatureEffects {
  capacityDerating: number; // Multiplier for available capacity (0-1)
  voltageSlopeFactor: number; // Multiplier for voltage curve slope (1.0 = normal, >1.0 = steeper)
  resistanceMultiplier: number; // Multiplier for internal resistance (1.0 = normal, >1.0 = higher)
  maxDischargeRate: number; // Maximum safe C-rate for discharge
  maxChargeRate: number; // Maximum safe C-rate for charge
  efficiencyPenalty: number; // Additional efficiency loss (0-1)
}

/**
 * Calculate capacity derating factor based on temperature
 * 
 * Based on NASA data:
 * - Optimum: 20-40°C (293-313K) → 100% capacity
 * - 0°C (273K) → ~80% capacity
 * - -20°C (253K) → ~60% capacity
 * - -40°C (233K) → ~40% capacity (specialty cells only)
 * - 60°C (333K) → ~95% capacity (but accelerated aging)
 * 
 * @param temperatureK - Battery temperature in Kelvin
 * @returns Capacity derating factor (0-1)
 */
function calculateCapacityDerating(temperatureK: number): number {
  const tempC = temperatureK - 273.15;
  
  if (tempC >= 20 && tempC <= 40) {
    // Optimum range: full capacity
    return 1.0;
  } else if (tempC > 40 && tempC <= 60) {
    // Warm range: slight capacity reduction
    return 1.0 - (tempC - 40) * 0.0025; // -0.25% per °C above 40°C
  } else if (tempC > 60) {
    // Hot range: significant capacity loss and safety concerns
    return Math.max(0.85, 0.95 - (tempC - 60) * 0.01); // -1% per °C above 60°C
  } else if (tempC >= 0 && tempC < 20) {
    // Cool range: linear degradation
    return 0.80 + (tempC / 20) * 0.20; // 80% at 0°C, 100% at 20°C
  } else if (tempC >= -20 && tempC < 0) {
    // Cold range: steeper degradation
    return 0.60 + ((tempC + 20) / 20) * 0.20; // 60% at -20°C, 80% at 0°C
  } else if (tempC >= -40 && tempC < -20) {
    // Extreme cold: severe degradation
    return 0.40 + ((tempC + 40) / 20) * 0.20; // 40% at -40°C, 60% at -20°C
  } else {
    // Below -40°C: minimal capacity (specialty cells only)
    return Math.max(0.20, 0.40 + (tempC + 40) * 0.01);
  }
}

/**
 * Calculate voltage curve slope adjustment factor
 * 
 * At lower temperatures, the discharge curve becomes steeper (voltage drops faster)
 * This affects the usable capacity and voltage regulation
 * 
 * @param temperatureK - Battery temperature in Kelvin
 * @returns Slope factor (1.0 = normal, >1.0 = steeper slope)
 */
function calculateVoltageSlopeFactor(temperatureK: number): number {
  const tempC = temperatureK - 273.15;
  
  if (tempC >= 20) {
    // Normal or warm: standard slope
    return 1.0;
  } else if (tempC >= 0) {
    // Cool: slightly steeper
    return 1.0 + (20 - tempC) * 0.01; // +1% per °C below 20°C
  } else if (tempC >= -20) {
    // Cold: significantly steeper
    return 1.20 + (-tempC) * 0.02; // +2% per °C below 0°C
  } else {
    // Extreme cold: very steep
    return 1.60 + ((-tempC - 20) * 0.03); // +3% per °C below -20°C
  }
}

/**
 * Calculate internal resistance multiplier based on temperature
 * 
 * Internal resistance increases exponentially at low temperatures due to:
 * - Reduced ionic conductivity in electrolyte
 * - Slower charge transfer kinetics
 * - Increased SEI layer resistance
 * 
 * @param temperatureK - Battery temperature in Kelvin
 * @returns Resistance multiplier (1.0 = normal, >1.0 = higher resistance)
 */
function calculateResistanceMultiplier(temperatureK: number): number {
  const tempC = temperatureK - 273.15;
  
  if (tempC >= 25) {
    // Warm: slightly lower resistance
    return Math.max(0.9, 1.0 - (tempC - 25) * 0.002);
  } else if (tempC >= 0) {
    // Cool: exponential increase
    const factor = (25 - tempC) / 25;
    return 1.0 + factor * 0.5; // Up to 1.5x at 0°C
  } else if (tempC >= -20) {
    // Cold: steep exponential increase
    const factor = -tempC / 20;
    return 1.5 + factor * 2.5; // 1.5x at 0°C, 4.0x at -20°C
  } else {
    // Extreme cold: very high resistance
    const factor = (-tempC - 20) / 20;
    return 4.0 + factor * 6.0; // 4.0x at -20°C, 10.0x at -40°C
  }
}

/**
 * Calculate maximum safe discharge rate (C-rate) based on temperature
 * 
 * At low temperatures, high discharge rates can cause:
 * - Voltage collapse
 * - Lithium plating
 * - Permanent damage
 * 
 * @param temperatureK - Battery temperature in Kelvin
 * @returns Maximum C-rate (e.g., 1.0 = 1C, 0.5 = 0.5C)
 */
function calculateMaxDischargeRate(temperatureK: number): number {
  const tempC = temperatureK - 273.15;
  
  if (tempC >= 20) {
    // Normal: full rate capability
    return 2.0; // 2C discharge
  } else if (tempC >= 0) {
    // Cool: reduced rate
    return 2.0 - (20 - tempC) * 0.05; // 2C at 20°C, 1C at 0°C
  } else if (tempC >= -20) {
    // Cold: significantly reduced
    return 1.0 + (tempC / 20) * 0.75; // 1C at 0°C, 0.25C at -20°C
  } else {
    // Extreme cold: very limited
    return Math.max(0.1, 0.25 + (tempC + 20) * 0.0075); // 0.25C at -20°C, 0.1C at -40°C
  }
}

/**
 * Calculate maximum safe charge rate (C-rate) based on temperature
 * 
 * Charging at low temperatures is more dangerous than discharging:
 * - Lithium plating risk
 * - Dendrite formation
 * - Safety hazards
 * 
 * Most Li-ion cells cannot be charged below 0°C
 * 
 * @param temperatureK - Battery temperature in Kelvin
 * @returns Maximum C-rate (0 if charging not allowed)
 */
function calculateMaxChargeRate(temperatureK: number): number {
  const tempC = temperatureK - 273.15;
  
  if (tempC < 0) {
    // Below freezing: NO CHARGING (lithium plating risk)
    return 0.0;
  } else if (tempC >= 20 && tempC <= 45) {
    // Optimum: full rate
    return 1.0; // 1C charge
  } else if (tempC < 20) {
    // Cool: reduced rate
    return (tempC / 20) * 1.0; // 0C at 0°C, 1C at 20°C
  } else if (tempC <= 60) {
    // Warm: reduced rate
    return 1.0 - (tempC - 45) * 0.03; // 1C at 45°C, 0.55C at 60°C
  } else {
    // Hot: very limited (safety)
    return Math.max(0.1, 0.55 - (tempC - 60) * 0.02);
  }
}

/**
 * Calculate additional efficiency penalty due to temperature
 * 
 * @param temperatureK - Battery temperature in Kelvin
 * @returns Efficiency penalty (0 = no penalty, 0.1 = 10% additional loss)
 */
function calculateEfficiencyPenalty(temperatureK: number): number {
  const tempC = temperatureK - 273.15;
  
  if (tempC >= 15 && tempC <= 45) {
    // Optimum range: no penalty
    return 0.0;
  } else if (tempC < 15 && tempC >= -20) {
    // Cold: increasing penalty
    return (15 - tempC) * 0.003; // +0.3% per °C below 15°C
  } else if (tempC < -20) {
    // Extreme cold: severe penalty
    return 0.105 + (-tempC - 20) * 0.005; // +0.5% per °C below -20°C
  } else if (tempC > 45) {
    // Hot: increasing penalty
    return (tempC - 45) * 0.002; // +0.2% per °C above 45°C
  }
  
  return 0.0;
}

/**
 * Calculate all temperature-dependent battery performance effects
 * 
 * @param temperatureK - Battery temperature in Kelvin
 * @returns Complete temperature effects on battery performance
 */
export function calculateTemperatureEffects(temperatureK: number): TemperatureEffects {
  return {
    capacityDerating: calculateCapacityDerating(temperatureK),
    voltageSlopeFactor: calculateVoltageSlopeFactor(temperatureK),
    resistanceMultiplier: calculateResistanceMultiplier(temperatureK),
    maxDischargeRate: calculateMaxDischargeRate(temperatureK),
    maxChargeRate: calculateMaxChargeRate(temperatureK),
    efficiencyPenalty: calculateEfficiencyPenalty(temperatureK),
  };
}

/**
 * Check if battery operation is safe at given temperature
 * 
 * @param temperatureK - Battery temperature in Kelvin
 * @param isCharging - True if attempting to charge
 * @returns Object with safety status and warning message
 */
export function checkTemperatureSafety(
  temperatureK: number,
  isCharging: boolean
): { safe: boolean; warning?: string } {
  const tempC = temperatureK - 273.15;
  
  if (isCharging && tempC < 0) {
    return {
      safe: false,
      warning: `Charging not allowed below 0°C (current: ${tempC.toFixed(1)}°C). Risk of lithium plating and permanent damage.`,
    };
  }
  
  if (tempC < -40) {
    return {
      safe: false,
      warning: `Temperature ${tempC.toFixed(1)}°C is below operational limit (-40°C). Battery may be permanently damaged.`,
    };
  }
  
  if (tempC > 60) {
    return {
      safe: false,
      warning: `Temperature ${tempC.toFixed(1)}°C exceeds safe limit (60°C). Risk of thermal runaway and fire.`,
    };
  }
  
  if (tempC < 0 || tempC > 50) {
    return {
      safe: true,
      warning: `Temperature ${tempC.toFixed(1)}°C is outside recommended range (0-50°C). Performance significantly degraded.`,
    };
  }
  
  return { safe: true };
}
