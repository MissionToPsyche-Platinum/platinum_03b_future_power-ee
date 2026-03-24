/**
 * JavaScript-based Power System Simulation Engine
 * 
 * This module implements a complete power system simulation for the 16 Psyche mission
 * without requiring Python dependencies. It models solar concentrators, photovoltaic cells,
 * battery storage, and power management under asteroid environmental conditions.
 */

import type { TechnologyDatabase, Concentrator, PVCell, Battery } from './types';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { calculateRadiationDegradation } from './lib/radiationDamage';
import { calculateBatteryDegradation, estimateCycleCount } from './lib/batteryDegradation';
import { calculateTemperatureEffects, checkTemperatureSafety } from './lib/batteryTemperature';
import { calculateMPPTEfficiency } from './lib/mpptEfficiency';
import { calculatePointingLosses, applyPointingLosses, getTypicalPointingParams } from './lib/pointingLosses';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Environmental constants for asteroid 16 Psyche at 2.9 AU from the Sun
 */
const PSYCHE_CONSTANTS = {
  SOLAR_CONSTANT_EARTH: 1361, // W/m² at 1 AU
  DISTANCE_AU: 2.9, // Distance from Sun in Astronomical Units
  ROTATION_PERIOD: 4.2, // hours
  TEMP_MIN: 100, // Kelvin (night side)
  TEMP_MAX: 270, // Kelvin (day side, sunlit)
  TEMP_REF: 298, // Reference temperature for PV cells (K)
};

/**
 * Calculate solar irradiance at 16 Psyche's distance from the Sun
 * Uses inverse square law: I = I₀ / d²
 */
function getSolarIrradiance(): number {
  return PSYCHE_CONSTANTS.SOLAR_CONSTANT_EARTH / (PSYCHE_CONSTANTS.DISTANCE_AU ** 2);
}

/**
 * Calculate sun angle based on asteroid rotation
 * Returns angle in radians (0 = facing sun, π = facing away)
 * 
 * @param timeHours - Time elapsed in hours
 * @returns Sun angle in radians
 */
function getSunAngle(timeHours: number): number {
  const rotationsPerHour = 1 / PSYCHE_CONSTANTS.ROTATION_PERIOD;
  const angle = (timeHours * rotationsPerHour * 2 * Math.PI) % (2 * Math.PI);
  return angle;
}

/**
 * Calculate surface temperature based on sun exposure
 * Simple model: varies between min and max based on sun angle
 * 
 * @param sunAngle - Current sun angle in radians
 * @returns Surface temperature in Kelvin
 */
function getSurfaceTemperature(sunAngle: number): number {
  // Temperature is highest when facing sun (angle = 0), lowest when facing away (angle = π)
  const tempRange = PSYCHE_CONSTANTS.TEMP_MAX - PSYCHE_CONSTANTS.TEMP_MIN;
  const temp = PSYCHE_CONSTANTS.TEMP_MIN + tempRange * Math.max(0, Math.cos(sunAngle));
  return temp;
}

/**
 * Calculate solar power incident on the concentrator
 * Includes sun-tracking (optimal orientation) and cosine losses
 * 
 * @param timeHours - Current simulation time in hours
 * @param concentratorArea - Area of concentrator in m²
 * @param concentratorEfficiency - Optical efficiency (0-1)
 * @returns Power collected by concentrator in Watts
 */
function calculateConcentratorPower(
  timeHours: number,
  concentratorArea: number,
  concentratorEfficiency: number
): number {
  const irradiance = getSolarIrradiance();
  const sunAngle = getSunAngle(timeHours);
  
  // Sun-tracking system keeps array optimally oriented
  // Power is zero when sun is behind the asteroid (angle > π/2)
  const cosineLoss = Math.max(0, Math.cos(sunAngle));
  
  return irradiance * concentratorArea * concentratorEfficiency * cosineLoss;
}

/**
 * Calculate PV cell power output with temperature effects
 * 
 * @param concentratedPower - Power from concentrator in Watts
 * @param concentrationRatio - Concentration ratio (e.g., 15x)
 * @param pvArea - PV cell area in m²
 * @param pvEfficiency - Base PV efficiency (0-1)
 * @param tempCoefficient - Temperature coefficient (%/K)
 * @param surfaceTemp - Current surface temperature in Kelvin
 * @returns Electrical power output in Watts
 */
function calculatePVPower(
  concentratedPower: number,
  concentrationRatio: number,
  pvArea: number,
  pvEfficiency: number,
  tempCoefficient: number,
  surfaceTemp: number
): number {
  // Temperature effect on efficiency
  const tempDelta = surfaceTemp - PSYCHE_CONSTANTS.TEMP_REF;
  const efficiencyAdjustment = 1 + (tempCoefficient * tempDelta);
  const actualEfficiency = pvEfficiency * Math.max(0.1, efficiencyAdjustment);
  
  // Power output
  return concentratedPower * actualEfficiency;
}

/**
 * Calculate spacecraft power consumption
 * Varies based on operational mode (sunlit vs eclipse)
 * 
 * @param timeHours - Current simulation time
 * @param baseLoad - Base load power in Watts
 * @returns Total power consumption in Watts
 */
function calculatePowerConsumption(timeHours: number, baseLoad: number): number {
  const sunAngle = getSunAngle(timeHours);
  const isDay = Math.cos(sunAngle) > 0;
  
  // Base load (always on): avionics, thermal control, etc.
  let totalLoad = baseLoad;
  
  // Science instruments (operate during day)
  if (isDay) {
    totalLoad += baseLoad * 1.5; // 150% of base load for instruments
  }
  
  // Communications (periodic, every ~6 hours)
  const commCycle = timeHours % 6;
  if (commCycle < 0.5) {
    totalLoad += baseLoad * 0.8; // 80% of base load for comms
  }
  
  // Heaters (operate during night/cold periods)
  if (!isDay) {
    totalLoad += baseLoad * 1.0; // 100% of base load for heaters
  }
  
  return totalLoad;
}

/**
 * Simulate battery charge/discharge dynamics
 * 
 * @param currentSOC - Current state of charge (0-1)
 * @param powerNet - Net power (positive = charging, negative = discharging) in Watts
 * @param batteryCapacity - Battery capacity in Wh
 * @param chargeEfficiency - Charging efficiency (0-1)
 * @param dischargeEfficiency - Discharging efficiency (0-1)
 * @param timeStep - Time step in hours
 * @returns New state of charge (0-1)
 */
function updateBatterySOC(
  currentSOC: number,
  powerNet: number,
  batteryCapacity: number,
  chargeEfficiency: number,
  dischargeEfficiency: number,
  timeStep: number
): number {
  let energyChange = powerNet * timeStep; // Wh
  
  // Apply efficiency losses
  if (energyChange > 0) {
    // Charging
    energyChange *= chargeEfficiency;
  } else {
    // Discharging
    energyChange /= dischargeEfficiency;
  }
  
  // Update SOC
  const socChange = energyChange / batteryCapacity;
  let newSOC = currentSOC + socChange;
  
  // Clamp to valid range
  newSOC = Math.max(0.15, Math.min(0.95, newSOC)); // 15% min, 95% max for battery health
  
  return newSOC;
}

/**
 * Main simulation function
 * Runs a time-domain simulation of the power system
 */
export interface SimulationConfig {
  concentrator: string;
  pvCell: string;
  battery: string;
  concentratorArea: number;
  pvArea: number;
  batteryCapacity: number;
  baseLoad: number;
  durationHours: number;
  yearsInOperation: number;
  spacecraftClass?: string;
  useSimpleModel?: boolean;
}

export interface SimulationResult {
  time: number[];
  power_generated: number[];
  power_consumed: number[];
  battery_soc: number[];
  temperature: number[];
  battery_capacity_fade: number[]; // NEW: Track capacity degradation over time
  mppt_efficiency: number[]; // NEW: Track MPPT converter efficiency
  metrics: {
    avg_power_generated: number;
    peak_power_generated: number;
    avg_power_consumed: number;
    peak_power_consumed: number;
    energy_balance: number;
    min_soc: number;
    final_soc: number;
    system_health: number;
    viable: boolean;
    // NEW: Battery degradation metrics
    battery_capacity_fade_percent: number;
    battery_cycle_count: number;
    battery_eol_reached: boolean;
    // NEW: Temperature effects
    avg_battery_temp_k: number;
    temp_warnings: string[];
    // NEW: MPPT efficiency
    avg_mppt_efficiency: number;
    // NEW: Pointing loss metrics
    avgOffPointingAngle: number;
    maxOffPointingAngle: number;
    avgPointingLossFactor: number;
  };
}

export async function runSimulation(
  config: SimulationConfig,
  technologies: TechnologyDatabase
): Promise<SimulationResult> {
  // Find selected technologies
  const concentrator = technologies.concentrators.find((c: Concentrator) => c.name === config.concentrator);
  const pvCell = technologies.pv_cells.find((p: PVCell) => p.name === config.pvCell);
  const battery = technologies.batteries.find((b: Battery) => b.name === config.battery);
  
  // Allow "None" for concentrator, but require PV cell and battery
  if (!pvCell || !battery) {
    throw new Error('Selected technologies not found in database');
  }
  
  if (!concentrator && config.concentrator !== 'None') {
    throw new Error('Selected concentrator not found in database');
  }
  
  // Handle "None" selections - system cannot operate without critical components
  if (pvCell.name === 'None') {
    throw new Error('Cannot run simulation without photovoltaic cells');
  }
  
  // Simulation parameters
  const timeStep = 0.1; // hours (6 minutes)
  const numSteps = Math.floor(config.durationHours / timeStep);
  
  // NEW: Calculate pointing losses based on spacecraft class
  const spacecraftClass = (config.spacecraftClass || 'flagship') as 'flagship' | 'new-frontiers' | 'discovery' | 'smallsat';
  const pointingParams = getTypicalPointingParams(spacecraftClass);
  const pointingLosses = calculatePointingLosses(pointingParams);
  
  // Apply degradation based on years in operation
  // Concentrators have minimal degradation (assume 0.1% per year)
  const concentratorEff = concentrator ? concentrator.efficiency * Math.pow(1 - 0.001, config.yearsInOperation) : 0;
  
  // Use NRL Displacement Damage Dose model for PV degradation (high-fidelity)
  // Falls back to simple model if radiation model fails
  let pvDegradationFactor: number;
  try {
    pvDegradationFactor = calculateRadiationDegradation(config.pvCell, config.yearsInOperation, 200);
  } catch (error) {
    console.warn('[Radiation Model] Failed to calculate DDD, using simple degradation:', error);
    pvDegradationFactor = Math.pow(1 - pvCell.degradation_per_year, config.yearsInOperation);
  }
  const pvEff = pvCell.efficiency * pvDegradationFactor;
  
  // NEW: Calculate battery degradation based on mission duration (skip if simple model)
  const useSimpleModel = config.useSimpleModel || false;
  const estimatedCycles = estimateCycleCount(config.yearsInOperation, PSYCHE_CONSTANTS.ROTATION_PERIOD);
  const avgDOD = 0.50; // Assume 50% average depth of discharge
  const estimatedAvgBatteryTemp = (PSYCHE_CONSTANTS.TEMP_MIN + PSYCHE_CONSTANTS.TEMP_MAX) / 2; // Average temperature
  
  let batteryDegradation;
  if (useSimpleModel) {
    batteryDegradation = { capacityFadeFactor: 1.0, capacityFadePercent: 0, isEOL: false, cyclesAtEOL: 0 };
  } else {
    batteryDegradation = calculateBatteryDegradation({
      cycleCount: estimatedCycles,
      averageDOD: avgDOD,
      averageTemperature: estimatedAvgBatteryTemp,
      yearsInOperation: config.yearsInOperation,
    });
  }
  
  // Apply capacity fade to battery capacity
  const effectiveBatteryCapacity = config.batteryCapacity * batteryDegradation.capacityFadeFactor;
  
  // Initialize arrays
  const time: number[] = [];
  const powerGenerated: number[] = [];
  const powerConsumed: number[] = [];
  const batterySOC: number[] = [];
  const temperature: number[] = [];
  const batteryCapacityFade: number[] = [];
  const mpptEfficiency: number[] = [];
  
  // Track temperature warnings
  const tempWarnings: Set<string> = new Set();
  
  // Initial conditions
  let currentSOC = 0.80; // Start at 80% SOC
  
  // Simulation loop
  for (let step = 0; step < numSteps; step++) {
    const t = step * timeStep;
    
    // Calculate environmental conditions
    const sunAngle = getSunAngle(t);
    const surfaceTemp = getSurfaceTemperature(sunAngle);
    
    // Calculate power generation
    const concentratorPower = calculateConcentratorPower(
      t,
      config.concentratorArea,
      concentratorEff
    );
    
    const pvPower = calculatePVPower(
      concentratorPower,
      concentrator?.concentration_ratio ?? 10,
      config.pvArea,
      pvEff,
      pvCell.temp_coefficient ?? -0.003,
      surfaceTemp
    );
    
    // Calculate power consumption
    const loadPower = calculatePowerConsumption(t, config.baseLoad);
    
    // NEW: Calculate MPPT converter efficiency (or use fixed 95% for simple model)
    const mpptEff = useSimpleModel ? 0.95 : calculateMPPTEfficiency({
      loadPowerW: Math.abs(pvPower - loadPower),
      ratedPowerW: config.baseLoad * 3, // Assume converter rated for 3x base load
      inputVoltage: 70, // Typical solar array voltage
      outputVoltage: 28, // Typical spacecraft bus voltage
      temperatureK: surfaceTemp,
    });
    
    // Apply MPPT efficiency to power flow
    const pvPowerAfterMPPT = pvPower * mpptEff;
    
    // NEW: Apply pointing losses to solar power (skip for simple model)
    const pvPowerAfterPointing = useSimpleModel ? pvPowerAfterMPPT : applyPointingLosses(pvPowerAfterMPPT, pointingLosses);
    
    // Net power after MPPT and pointing losses
    const netPower = pvPowerAfterPointing - loadPower;
    
    // NEW: Calculate temperature effects on battery (or use fixed 25°C for simple model)
    const tempEffects = useSimpleModel ? 
      { capacityDerating: 1.0, efficiencyPenalty: 0 } : 
      calculateTemperatureEffects(surfaceTemp);
    
    // Check temperature safety (skip for simple model)
    if (!useSimpleModel) {
      const tempSafety = checkTemperatureSafety(surfaceTemp, netPower > 0);
      if (!tempSafety.safe && tempSafety.warning) {
        tempWarnings.add(tempSafety.warning);
      }
    }
    
    // Apply temperature effects to battery efficiency
    const chargeEffAdjusted = (battery.charge_efficiency ?? 0.92) * (1 - tempEffects.efficiencyPenalty);
    const dischargeEffAdjusted = (battery.discharge_efficiency ?? 0.95) * (1 - tempEffects.efficiencyPenalty);
    
    // Apply temperature-dependent capacity derating
    const tempAdjustedCapacity = effectiveBatteryCapacity * tempEffects.capacityDerating;
    
    // Update battery
    currentSOC = updateBatterySOC(
      currentSOC,
      netPower,
      tempAdjustedCapacity,
      chargeEffAdjusted,
      dischargeEffAdjusted,
      timeStep
    );
    
    // Store results
    time.push(t);
    powerGenerated.push(pvPower);
    powerConsumed.push(loadPower);
    batterySOC.push(currentSOC);
    temperature.push(surfaceTemp);
    batteryCapacityFade.push(batteryDegradation.capacityFadeFactor);
    mpptEfficiency.push(mpptEff);
  }
  
  // Calculate metrics
  const avgPowerGenerated = powerGenerated.reduce((a, b) => a + b, 0) / powerGenerated.length;
  const peakPowerGenerated = Math.max(...powerGenerated);
  const avgPowerConsumed = powerConsumed.reduce((a, b) => a + b, 0) / powerConsumed.length;
  const peakPowerConsumed = Math.max(...powerConsumed);
  
  const totalEnergyGenerated = powerGenerated.reduce((sum, p, i) => sum + p * timeStep, 0);
  const totalEnergyConsumed = powerConsumed.reduce((sum, p, i) => sum + p * timeStep, 0);
  const energyBalance = totalEnergyGenerated - totalEnergyConsumed;
  
  const minSOC = Math.min(...batterySOC);
  const finalSOC = batterySOC[batterySOC.length - 1];
  
  // System health score (0-5)
  let healthScore = 0;
  if (minSOC > 0.20) healthScore += 1;
  if (minSOC > 0.40) healthScore += 1;
  if (energyBalance > 0) healthScore += 1;
  if (finalSOC > 0.70) healthScore += 1;
  if (avgPowerGenerated > avgPowerConsumed * 1.2) healthScore += 1;
  
  const viable = minSOC > 0.20 && energyBalance > 0;
  
  // NEW: Calculate additional metrics for accuracy improvements
  const avgBatteryTemp = temperature.reduce((a, b) => a + b, 0) / temperature.length;
  const avgMPPTEff = mpptEfficiency.reduce((a, b) => a + b, 0) / mpptEfficiency.length;
  const capacityFadePercent = (1 - batteryDegradation.capacityFadeFactor) * 100;
  
  return {
    time,
    power_generated: powerGenerated,
    power_consumed: powerConsumed,
    battery_soc: batterySOC,
    temperature,
    battery_capacity_fade: batteryCapacityFade,
    mppt_efficiency: mpptEfficiency,
    metrics: {
      avg_power_generated: avgPowerGenerated,
      peak_power_generated: peakPowerGenerated,
      avg_power_consumed: avgPowerConsumed,
      peak_power_consumed: peakPowerConsumed,
      energy_balance: energyBalance,
      min_soc: minSOC,
      final_soc: finalSOC,
      system_health: healthScore,
      viable,
      // NEW: Battery degradation metrics
      battery_capacity_fade_percent: capacityFadePercent,
      battery_cycle_count: estimatedCycles,
      battery_eol_reached: batteryDegradation.isEOL,
      // NEW: Temperature effects
      avg_battery_temp_k: avgBatteryTemp,
      temp_warnings: Array.from(tempWarnings),
      // NEW: MPPT efficiency
      avg_mppt_efficiency: avgMPPTEff,
      // NEW: Pointing loss metrics
      avgOffPointingAngle: pointingLosses.avgOffPointingAngle,
      maxOffPointingAngle: pointingLosses.maxOffPointingAngle,
      avgPointingLossFactor: pointingLosses.avgCosineLoss,
    },
  };
}

/**
 * Load technology database from JSON file
 * 
 * @returns Promise resolving to technology database
 */
export async function getTechnologies(): Promise<TechnologyDatabase> {
  try {
    // Use import.meta.url for ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const filePath = join(__dirname, 'technologies.json');
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load technologies.json:', error);
    throw new Error('Failed to load technology database');
  }
}
