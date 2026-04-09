/**
 * Browser-compatible Power System Simulation Engine
 * Ported from server/simulationEngine.ts — no Node.js dependencies.
 */

import type { TechnologyDatabase, Concentrator, PVCell, Battery } from './types';
import { TECHNOLOGIES } from './technologies';
import { calculateRadiationDegradation } from './radiationDamage';
import { calculateBatteryDegradation, estimateCycleCount } from './batteryDegradation';
import { calculateTemperatureEffects, checkTemperatureSafety } from './batteryTemperature';
import { calculateMPPTEfficiency } from './mpptEfficiency';
import { calculatePointingLosses, applyPointingLosses, getTypicalPointingParams } from './pointingLosses';

const PSYCHE_CONSTANTS = {
  SOLAR_CONSTANT_EARTH: 1361,
  DISTANCE_AU: 2.9,
  ROTATION_PERIOD: 4.2,
  TEMP_MIN: 100,
  TEMP_MAX: 270,
  TEMP_REF: 298,
};

function getSolarIrradiance(): number {
  return PSYCHE_CONSTANTS.SOLAR_CONSTANT_EARTH / (PSYCHE_CONSTANTS.DISTANCE_AU ** 2);
}

function getSunAngle(timeHours: number): number {
  const rotationsPerHour = 1 / PSYCHE_CONSTANTS.ROTATION_PERIOD;
  const angle = (timeHours * rotationsPerHour * 2 * Math.PI) % (2 * Math.PI);
  return angle;
}

function getSurfaceTemperature(sunAngle: number): number {
  const tempRange = PSYCHE_CONSTANTS.TEMP_MAX - PSYCHE_CONSTANTS.TEMP_MIN;
  return PSYCHE_CONSTANTS.TEMP_MIN + tempRange * Math.max(0, Math.cos(sunAngle));
}

function calculateConcentratorPower(timeHours: number, concentratorArea: number, concentratorEfficiency: number): number {
  const irradiance = getSolarIrradiance();
  const sunAngle = getSunAngle(timeHours);
  const cosineLoss = Math.max(0, Math.cos(sunAngle));
  return irradiance * concentratorArea * concentratorEfficiency * cosineLoss;
}

function calculatePVPower(
  concentratedPower: number,
  concentrationRatio: number,
  pvArea: number,
  pvEfficiency: number,
  tempCoefficient: number,
  surfaceTemp: number,
  sunAngle: number
): number {
  const tempDelta = surfaceTemp - PSYCHE_CONSTANTS.TEMP_REF;
  const efficiencyAdjustment = 1 + (tempCoefficient * tempDelta);
  const actualEfficiency = pvEfficiency * Math.max(0.1, efficiencyAdjustment);
  const concentratedElectricalPower = concentratedPower * actualEfficiency;
  const irradiance = getSolarIrradiance();
  const cosineLoss = Math.max(0, Math.cos(sunAngle));
  const directPVPower = irradiance * pvArea * actualEfficiency * cosineLoss;
  return concentratedElectricalPower + directPVPower;
}

function calculatePowerConsumption(timeHours: number, baseLoad: number): number {
  const sunAngle = getSunAngle(timeHours);
  const isDay = Math.cos(sunAngle) > 0;
  let totalLoad = baseLoad;
  if (isDay) totalLoad += baseLoad * 1.5;
  const commCycle = timeHours % 6;
  if (commCycle < 0.5) totalLoad += baseLoad * 0.8;
  if (!isDay) totalLoad += baseLoad * 1.0;
  return totalLoad;
}

function updateBatterySOC(
  currentSOC: number,
  powerNet: number,
  batteryCapacity: number,
  chargeEfficiency: number,
  dischargeEfficiency: number,
  timeStep: number
): number {
  let energyChange = powerNet * timeStep;
  if (energyChange > 0) {
    energyChange *= chargeEfficiency;
  } else {
    energyChange /= dischargeEfficiency;
  }
  const socChange = energyChange / batteryCapacity;
  let newSOC = currentSOC + socChange;
  newSOC = Math.max(0.15, Math.min(0.95, newSOC));
  return newSOC;
}

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
  battery_capacity_fade: number[];
  mppt_efficiency: number[];
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
    battery_capacity_fade_percent: number;
    battery_cycle_count: number;
    battery_eol_reached: boolean;
    avg_battery_temp_k: number;
    temp_warnings: string[];
    avg_mppt_efficiency: number;
    avgOffPointingAngle: number;
    maxOffPointingAngle: number;
    avgPointingLossFactor: number;
  };
}

export async function runSimulation(
  config: SimulationConfig,
  technologies: TechnologyDatabase
): Promise<SimulationResult> {
  const concentrator = technologies.concentrators.find((c: Concentrator) => c.name === config.concentrator);
  const pvCell = technologies.pv_cells.find((p: PVCell) => p.name === config.pvCell);
  const battery = technologies.batteries.find((b: Battery) => b.name === config.battery);

  if (!pvCell || !battery) throw new Error('Selected technologies not found in database');
  if (!concentrator && config.concentrator !== 'None') throw new Error('Selected concentrator not found in database');
  if (pvCell.name === 'None') throw new Error('Cannot run simulation without photovoltaic cells');

  const timeStep = 0.1;
  const numSteps = Math.floor(config.durationHours / timeStep);

  const spacecraftClass = (config.spacecraftClass || 'discovery') as 'flagship' | 'new-frontiers' | 'discovery' | 'smallsat';
  const pointingParams = getTypicalPointingParams(spacecraftClass);
  const pointingLosses = calculatePointingLosses(pointingParams);

  const concentratorEff = concentrator ? concentrator.efficiency * Math.pow(1 - 0.001, config.yearsInOperation) : 0;

  let pvDegradationFactor: number;
  try {
    pvDegradationFactor = calculateRadiationDegradation(config.pvCell, config.yearsInOperation, 200);
  } catch {
    pvDegradationFactor = Math.pow(1 - pvCell.degradation_per_year, config.yearsInOperation);
  }
  const pvEff = pvCell.efficiency * pvDegradationFactor;

  const useSimpleModel = config.useSimpleModel || false;
  const estimatedCycles = estimateCycleCount(config.yearsInOperation, PSYCHE_CONSTANTS.ROTATION_PERIOD);
  const avgDOD = 0.50;
  const estimatedAvgBatteryTemp = (PSYCHE_CONSTANTS.TEMP_MIN + PSYCHE_CONSTANTS.TEMP_MAX) / 2;

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

  const effectiveBatteryCapacity = config.batteryCapacity * batteryDegradation.capacityFadeFactor;

  const time: number[] = [];
  const powerGenerated: number[] = [];
  const powerConsumed: number[] = [];
  const batterySOC: number[] = [];
  const temperature: number[] = [];
  const batteryCapacityFade: number[] = [];
  const mpptEfficiency: number[] = [];
  const tempWarnings: Set<string> = new Set();

  let currentSOC = 0.80;

  for (let step = 0; step < numSteps; step++) {
    const t = step * timeStep;
    const sunAngle = getSunAngle(t);
    const surfaceTemp = getSurfaceTemperature(sunAngle);

    const concentratorPower = calculateConcentratorPower(t, config.concentratorArea, concentratorEff);
    const pvPower = calculatePVPower(
      concentratorPower,
      concentrator?.concentration_ratio ?? 10,
      config.pvArea,
      pvEff,
      pvCell.temp_coefficient ?? -0.003,
      surfaceTemp,
      sunAngle
    );

    const loadPower = calculatePowerConsumption(t, config.baseLoad);

    const mpptEff = useSimpleModel ? 0.95 : calculateMPPTEfficiency({
      loadPowerW: Math.abs(pvPower - loadPower),
      ratedPowerW: config.baseLoad * 3,
      inputVoltage: 70,
      outputVoltage: 28,
      temperatureK: surfaceTemp,
    });

    const pvPowerAfterMPPT = pvPower * mpptEff;
    const pvPowerAfterPointing = useSimpleModel ? pvPowerAfterMPPT : applyPointingLosses(pvPowerAfterMPPT, pointingLosses);
    const netPower = pvPowerAfterPointing - loadPower;

    const tempEffects = useSimpleModel
      ? { capacityDerating: 1.0, efficiencyPenalty: 0 }
      : calculateTemperatureEffects(surfaceTemp);

    if (!useSimpleModel) {
      const tempSafety = checkTemperatureSafety(surfaceTemp, netPower > 0);
      if (!tempSafety.safe && tempSafety.warning) tempWarnings.add(tempSafety.warning);
    }

    const chargeEffAdjusted = (battery.charge_efficiency ?? 0.92) * (1 - tempEffects.efficiencyPenalty);
    const dischargeEffAdjusted = (battery.discharge_efficiency ?? 0.95) * (1 - tempEffects.efficiencyPenalty);
    const tempAdjustedCapacity = effectiveBatteryCapacity * tempEffects.capacityDerating;

    currentSOC = updateBatterySOC(currentSOC, netPower, tempAdjustedCapacity, chargeEffAdjusted, dischargeEffAdjusted, timeStep);

    time.push(t);
    powerGenerated.push(pvPower);
    powerConsumed.push(loadPower);
    batterySOC.push(currentSOC);
    temperature.push(surfaceTemp);
    batteryCapacityFade.push(batteryDegradation.capacityFadeFactor);
    mpptEfficiency.push(mpptEff);
  }

  const avgPowerGenerated = powerGenerated.reduce((a, b) => a + b, 0) / powerGenerated.length;
  const peakPowerGenerated = Math.max(...powerGenerated);
  const avgPowerConsumed = powerConsumed.reduce((a, b) => a + b, 0) / powerConsumed.length;
  const peakPowerConsumed = Math.max(...powerConsumed);
  const totalEnergyGenerated = powerGenerated.reduce((sum, p) => sum + p * timeStep, 0);
  const totalEnergyConsumed = powerConsumed.reduce((sum, p) => sum + p * timeStep, 0);
  const energyBalance = totalEnergyGenerated - totalEnergyConsumed;
  const minSOC = Math.min(...batterySOC);
  const finalSOC = batterySOC[batterySOC.length - 1];

  let healthScore = 0;
  if (minSOC > 0.15) healthScore += 1;
  if (minSOC > 0.40) healthScore += 1;
  if (energyBalance > 0) healthScore += 1;
  if (finalSOC > 0.70) healthScore += 1;
  if (avgPowerGenerated > avgPowerConsumed * 1.2) healthScore += 1;

  const viable = minSOC >= 0.15 && energyBalance > 0;
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
      battery_capacity_fade_percent: capacityFadePercent,
      battery_cycle_count: estimatedCycles,
      battery_eol_reached: batteryDegradation.isEOL,
      avg_battery_temp_k: avgBatteryTemp,
      temp_warnings: Array.from(tempWarnings),
      avg_mppt_efficiency: avgMPPTEff,
      avgOffPointingAngle: pointingLosses.avgOffPointingAngle,
      maxOffPointingAngle: pointingLosses.maxOffPointingAngle,
      avgPointingLossFactor: pointingLosses.avgCosineLoss,
    },
  };
}

/** Get the inlined technology database (browser-compatible, no fs required) */
export function getTechnologies(): TechnologyDatabase {
  return TECHNOLOGIES as unknown as TechnologyDatabase;
}
