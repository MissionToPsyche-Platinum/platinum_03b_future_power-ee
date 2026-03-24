/**
 * Component Sizing Optimization Engine
 * 
 * This module implements a constraint solver for determining optimal component sizes
 * based on user-specified mission requirements. It calculates required concentrator area,
 * PV array area, and battery capacity to meet power and energy margin constraints.
 */

import type { Concentrator, PVCell, Battery } from '../types';

/**
 * User requirements for component sizing
 */
export interface SizingRequirements {
  // Power requirements
  averagePowerLoad: number;      // Average power consumption in Watts
  peakPowerLoad: number;         // Peak power consumption in Watts
  
  // Energy margin requirements
  minEnergyMargin: number;       // Minimum energy margin percentage (e.g., 30%)
  minBatterySOC: number;         // Minimum battery state of charge percentage (e.g., 20%)
  
  // Mission parameters
  eclipseDuration: number;       // Maximum eclipse duration in hours
  missionDuration: number;       // Total mission duration in years
  
  // Constraints
  maxTotalMass: number;          // Maximum allowable system mass in kg
  maxTotalCost: number;          // Maximum allowable system cost in $
  
  // Selected technologies
  concentratorId: string | null;
  pvCellId: string | null;
  batteryId: string | null;
}

/**
 * Sizing solution with component specifications
 */
export interface SizingSolution {
  // Calculated sizes
  concentratorArea: number;      // Required concentrator area in m²
  pvArea: number;                // Required PV array area in m²
  batteryCapacity: number;       // Required battery capacity in Wh
  
  // System metrics
  totalMass: number;             // Total system mass in kg
  totalCost: number;             // Total system cost in $
  energyMargin: number;          // Achieved energy margin percentage
  minSOC: number;                // Minimum battery SOC percentage
  
  // Viability
  feasible: boolean;             // Whether solution meets all constraints
  constraintViolations: string[]; // List of violated constraints
  
  // Sensitivity analysis
  sensitivity: {
    massMargin: number;          // Percentage of mass budget remaining
    costMargin: number;          // Percentage of cost budget remaining
    powerMargin: number;         // Percentage of power margin
  };
}

/**
 * Environmental constants for 16 Psyche at 2.9 AU
 */
const PSYCHE_CONSTANTS = {
  SOLAR_CONSTANT_EARTH: 1361,    // W/m² at 1 AU
  DISTANCE_AU: 2.9,              // Distance from Sun in AU
  ROTATION_PERIOD: 4.2,          // hours
  TEMP_AVG: 185,                 // Average temperature in Kelvin
  TEMP_REF: 298,                 // Reference temperature for PV (K)
};

/**
 * Calculate solar irradiance at 16 Psyche
 */
function getSolarIrradiance(): number {
  return PSYCHE_CONSTANTS.SOLAR_CONSTANT_EARTH / (PSYCHE_CONSTANTS.DISTANCE_AU ** 2);
}

/**
 * Calculate average power generation for given component sizes
 */
function calculateAveragePower(
  concentratorArea: number,
  concentratorEfficiency: number,
  concentrationRatio: number,
  pvArea: number,
  pvEfficiency: number,
  tempCoefficient: number
): number {
  const irradiance = getSolarIrradiance();
  
  // Average over rotation period (50% sunlit, 50% eclipse)
  const avgCosineLoss = 0.5; // Simplified: average of cos(θ) over hemisphere
  
  // Concentrator power
  const concentratorPower = irradiance * concentratorArea * concentratorEfficiency * avgCosineLoss;
  
  // Temperature effect on PV efficiency
  const tempDelta = PSYCHE_CONSTANTS.TEMP_AVG - PSYCHE_CONSTANTS.TEMP_REF;
  const efficiencyAdjustment = 1 + (tempCoefficient * tempDelta);
  const actualPVEfficiency = pvEfficiency * Math.max(0.1, efficiencyAdjustment);
  
  // PV power output
  const pvPower = concentratorPower * actualPVEfficiency;
  
  return pvPower;
}

/**
 * Solve for optimal component sizes given requirements
 */
export async function solveComponentSizing(
  requirements: SizingRequirements,
  concentrator: Concentrator | null,
  pvCell: PVCell | null,
  battery: Battery | null
): Promise<SizingSolution> {
  
  const violations: string[] = [];
  
  // Validate inputs
  if (!concentrator && !pvCell) {
    return {
      concentratorArea: 0,
      pvArea: 0,
      batteryCapacity: 0,
      totalMass: 0,
      totalCost: 0,
      energyMargin: 0,
      minSOC: 0,
      feasible: false,
      constraintViolations: ['At least one of concentrator or PV cell must be selected'],
      sensitivity: { massMargin: 0, costMargin: 0, powerMargin: 0 }
    };
  }
  
  if (!battery) {
    return {
      concentratorArea: 0,
      pvArea: 0,
      batteryCapacity: 0,
      totalMass: 0,
      totalCost: 0,
      energyMargin: 0,
      minSOC: 0,
      feasible: false,
      constraintViolations: ['Battery must be selected for sizing optimization'],
      sensitivity: { massMargin: 0, costMargin: 0, powerMargin: 0 }
    };
  }
  
  // Extract technology parameters
  const concentratorEfficiency = concentrator?.efficiency ?? 0.85;
  const concentrationRatio = concentrator?.concentration_ratio ?? 1.0;
  const concentratorMassPerM2 = concentrator?.mass_per_m2 ?? 5.0; // kg/m²
  const concentratorCostPerM2 = concentrator?.cost_per_m2 ?? 10000; // $/m²
  
  const pvEfficiency = pvCell?.efficiency ?? 0.30;
  const tempCoefficient = pvCell?.temp_coefficient ?? -0.002;
  const pvMassPerM2 = pvCell?.mass_per_m2 ?? 2.0; // kg/m²
  const pvCostPerM2 = pvCell?.cost_per_m2 ?? 50000; // $/m²
  
  const batteryEnergyDensity = battery.energy_density; // Wh/kg
  const batteryCostPerKwh = battery.cost_per_kwh;
  const batteryCostPerWh = batteryCostPerKwh / 1000; // Convert $/kWh to $/Wh
  
  // Step 1: Calculate required power generation
  // Need to generate enough power to cover average load + charge battery during sunlit period
  const { averagePowerLoad, peakPowerLoad, eclipseDuration, minEnergyMargin } = requirements;
  
  // Energy needed during eclipse
  const eclipseEnergy = averagePowerLoad * eclipseDuration; // Wh
  
  // Battery must supply eclipse energy while maintaining minimum SOC
  const usableSOC = 1.0 - (requirements.minBatterySOC / 100);
  const requiredBatteryCapacity = eclipseEnergy / usableSOC;
  
  // During sunlit period, must generate enough to:
  // 1. Cover average load
  // 2. Recharge battery
  // 3. Provide energy margin
  const sunlitDuration = PSYCHE_CONSTANTS.ROTATION_PERIOD / 2; // hours
  const energyMarginFactor = 1 + (minEnergyMargin / 100);
  const requiredAveragePower = (averagePowerLoad + (eclipseEnergy / sunlitDuration)) * energyMarginFactor;
  
  // Step 2: Size PV array to meet power requirements
  // Use iterative approach to find minimum area
  let pvArea = 1.0; // Start with 1 m²
  let concentratorArea = concentrator ? pvArea * concentrationRatio : 0;
  let avgPower = 0;
  
  const maxIterations = 100;
  let iteration = 0;
  
  while (avgPower < requiredAveragePower && iteration < maxIterations) {
    concentratorArea = concentrator ? pvArea * concentrationRatio : pvArea;
    
    avgPower = calculateAveragePower(
      concentratorArea,
      concentratorEfficiency,
      concentrationRatio,
      pvArea,
      pvEfficiency,
      tempCoefficient
    );
    
    if (avgPower < requiredAveragePower) {
      // Increase area by 10%
      pvArea *= 1.1;
    }
    
    iteration++;
  }
  
  if (iteration >= maxIterations) {
    violations.push('Unable to meet power requirements within iteration limit');
  }
  
  // Step 3: Calculate system mass and cost
  const concentratorMass = concentrator ? concentratorArea * concentratorMassPerM2 : 0;
  const pvMass = pvArea * pvMassPerM2;
  const batteryMass = requiredBatteryCapacity / batteryEnergyDensity;
  const totalMass = concentratorMass + pvMass + batteryMass;
  
  const concentratorCost = concentrator ? concentratorArea * concentratorCostPerM2 : 0;
  const pvCost = pvArea * pvCostPerM2;
  const batteryCost = requiredBatteryCapacity * batteryCostPerWh;
  const totalCost = concentratorCost + pvCost + batteryCost;
  
  // Step 4: Check constraints
  if (totalMass > requirements.maxTotalMass) {
    violations.push(`Total mass (${totalMass.toFixed(1)} kg) exceeds limit (${requirements.maxTotalMass} kg)`);
  }
  
  if (totalCost > requirements.maxTotalCost) {
    violations.push(`Total cost ($${(totalCost / 1e6).toFixed(2)}M) exceeds limit ($${(requirements.maxTotalCost / 1e6).toFixed(2)}M)`);
  }
  
  if (avgPower < peakPowerLoad) {
    violations.push(`Average power (${avgPower.toFixed(1)} W) cannot meet peak load (${peakPowerLoad} W)`);
  }
  
  // Step 5: Calculate achieved margins
  const actualEnergyMargin = ((avgPower - averagePowerLoad) / averagePowerLoad) * 100;
  const massMargin = ((requirements.maxTotalMass - totalMass) / requirements.maxTotalMass) * 100;
  const costMargin = ((requirements.maxTotalCost - totalCost) / requirements.maxTotalCost) * 100;
  const powerMargin = ((avgPower - peakPowerLoad) / peakPowerLoad) * 100;
  
  return {
    concentratorArea: concentrator ? concentratorArea : 0,
    pvArea,
    batteryCapacity: requiredBatteryCapacity,
    totalMass,
    totalCost,
    energyMargin: actualEnergyMargin,
    minSOC: requirements.minBatterySOC,
    feasible: violations.length === 0,
    constraintViolations: violations,
    sensitivity: {
      massMargin: Math.max(0, massMargin),
      costMargin: Math.max(0, costMargin),
      powerMargin: Math.max(0, powerMargin)
    }
  };
}

/**
 * Generate sizing recommendations based on solution
 */
export function generateSizingRecommendations(solution: SizingSolution): string[] {
  const recommendations: string[] = [];
  
  if (!solution.feasible) {
    recommendations.push('⚠️ Current configuration does not meet all requirements');
    
    if (solution.constraintViolations.some(v => v.includes('mass'))) {
      recommendations.push('Consider selecting lighter technologies or relaxing mass constraints');
    }
    
    if (solution.constraintViolations.some(v => v.includes('cost'))) {
      recommendations.push('Consider selecting more cost-effective technologies or increasing budget');
    }
    
    if (solution.constraintViolations.some(v => v.includes('power'))) {
      recommendations.push('Consider increasing PV array size or selecting higher efficiency cells');
    }
  } else {
    recommendations.push('✅ Configuration meets all requirements');
    
    if (solution.sensitivity.massMargin > 20) {
      recommendations.push(`Significant mass margin (${solution.sensitivity.massMargin.toFixed(1)}%) - could reduce component sizes`);
    }
    
    if (solution.sensitivity.costMargin > 20) {
      recommendations.push(`Significant cost margin (${solution.sensitivity.costMargin.toFixed(1)}%) - could upgrade to higher performance technologies`);
    }
    
    if (solution.sensitivity.powerMargin > 30) {
      recommendations.push(`High power margin (${solution.sensitivity.powerMargin.toFixed(1)}%) - system is over-designed`);
    }
    
    if (solution.sensitivity.powerMargin < 10) {
      recommendations.push(`Low power margin (${solution.sensitivity.powerMargin.toFixed(1)}%) - consider adding buffer for degradation`);
    }
  }
  
  return recommendations;
}
