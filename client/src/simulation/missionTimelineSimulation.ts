/**
 * Mission Timeline Simulation for 16 Psyche
 * 
 * Implements multi-year, multi-phase mission simulation with:
 * - Launch, cruise, orbital insertion, science operations, extended mission phases
 * - Different power requirements per phase
 * - Degradation accumulation across timeline
 * - Phase transitions with realistic constraints
 */

import { calculateEnvironmentalDegradation, getDefaultPsycheEnvironment, type EnvironmentalFactors, type DegradationResult } from './environmentalModeling';

export interface MissionPhase {
  id: string;
  name: string;
  description: string;
  durationYears: number;
  
  // Power requirements
  averagePowerLoad: number; // W
  peakPowerLoad: number; // W
  
  // Environmental conditions (can override defaults)
  environmentalFactors?: Partial<EnvironmentalFactors>;
  
  // Operational constraints
  minBatterySOC: number; // Minimum state of charge (0-1)
  communicationDutyCycle: number; // Fraction of time transmitting (0-1)
}

export interface MissionTimeline {
  phases: MissionPhase[];
  totalDuration: number; // years
}

export interface PhaseSimulationResult {
  phaseId: string;
  phaseName: string;
  startYear: number;
  endYear: number;
  
  // Power metrics
  averagePowerGenerated: number; // W
  averagePowerConsumed: number; // W
  energyMargin: number; // Wh over phase duration
  
  // Degradation at end of phase
  pvEfficiencyFactor: number; // 0-1
  batteryCapacityFactor: number; // 0-1
  cumulativeDegradation: number; // %
  
  // Battery metrics
  minSOC: number; // Minimum SOC reached during phase
  avgSOC: number; // Average SOC during phase
  
  // Success criteria
  viable: boolean; // Phase completed successfully
  failureReason?: string;
}

export interface TimelineSimulationResult {
  timeline: MissionTimeline;
  phaseResults: PhaseSimulationResult[];
  
  // Overall mission metrics
  totalEnergyGenerated: number; // kWh
  totalEnergyConsumed: number; // kWh
  finalDegradation: number; // %
  missionSuccess: boolean;
  
  // Degradation progression
  degradationByYear: Array<{
    year: number;
    pvPower: number; // fraction of original
    batteryCapacity: number; // fraction of original
    cumulativeDegradation: number; // %
  }>;
}

/**
 * Default 16 Psyche mission timeline
 * Based on NASA mission profile
 */
export function getDefaultPsycheMissionTimeline(): MissionTimeline {
  const phases: MissionPhase[] = [
    {
      id: 'launch',
      name: 'Launch & Early Operations',
      description: 'Launch from Earth, deploy solar arrays, initial checkout',
      durationYears: 0.25, // 3 months
      averagePowerLoad: 150, // W (reduced operations)
      peakPowerLoad: 300, // W (deployment activities)
      minBatterySOC: 0.3,
      communicationDutyCycle: 0.1, // Minimal communication
      environmentalFactors: {
        // Near Earth: higher radiation
        radiationFlux: 5e3, // particles/cm²/s (near Earth orbit)
        minTemperature: 200,
        maxTemperature: 300,
      },
    },
    {
      id: 'cruise',
      name: 'Deep Space Cruise',
      description: 'Transit to asteroid belt, periodic trajectory corrections',
      durationYears: 3.5, // 3.5 years cruise
      averagePowerLoad: 100, // W (hibernation mode)
      peakPowerLoad: 200, // W (trajectory corrections)
      minBatterySOC: 0.2,
      communicationDutyCycle: 0.05, // Infrequent check-ins
      environmentalFactors: {
        // Deep space: lower radiation, extreme temperatures
        radiationFlux: 1e3, // particles/cm²/s (deep space, lower than LEO)
        minTemperature: 150,
        maxTemperature: 250,
      },
    },
    {
      id: 'insertion',
      name: 'Orbital Insertion',
      description: 'Approach Psyche, orbital insertion burns, orbit stabilization',
      durationYears: 0.5, // 6 months
      averagePowerLoad: 200, // W (active operations)
      peakPowerLoad: 400, // W (propulsion, high data rate)
      minBatterySOC: 0.4,
      communicationDutyCycle: 0.3, // Frequent communication
      environmentalFactors: {
        radiationFlux: 1.5e3, // particles/cm²/s (near asteroid)
        minTemperature: 150,
        maxTemperature: 250,
        cyclesPerOrbit: 2, // Frequent thermal cycles during approach
      },
    },
    {
      id: 'science_primary',
      name: 'Primary Science Operations',
      description: 'Orbital science, mapping, spectroscopy, magnetometry',
      durationYears: 2.0, // 2 years primary mission
      averagePowerLoad: 250, // W (full science operations)
      peakPowerLoad: 500, // W (all instruments + high-rate downlink)
      minBatterySOC: 0.3,
      communicationDutyCycle: 0.4, // Regular data downlink
      environmentalFactors: {
        radiationFlux: 1.5e3, // particles/cm²/s (orbiting asteroid)
        minTemperature: 150,
        maxTemperature: 250,
        cyclesPerOrbit: 1, // One cycle per Psyche rotation (4.2 hours)
        orbitPeriod: 4.2,
      },
    },
    {
      id: 'science_extended',
      name: 'Extended Mission',
      description: 'Extended science operations, close-approach observations',
      durationYears: 3.75, // Extended to 10 years total
      averagePowerLoad: 200, // W (reduced operations, degraded systems)
      peakPowerLoad: 400, // W
      minBatterySOC: 0.25,
      communicationDutyCycle: 0.3,
      environmentalFactors: {
        radiationFlux: 1.5e3, // particles/cm²/s (extended mission)
        minTemperature: 150,
        maxTemperature: 250,
        cyclesPerOrbit: 1,
        orbitPeriod: 4.2,
      },
    },
  ];
  
  const totalDuration = phases.reduce((sum, phase) => sum + phase.durationYears, 0);
  
  return {
    phases,
    totalDuration,
  };
}

/**
 * Simulate a single mission phase
 */
function simulatePhase(
  phase: MissionPhase,
  startYear: number,
  initialPVEfficiency: number,
  initialBatteryCapacity: number,
  pvArea: number,
  batteryCapacityWh: number,
  cellType: string
): PhaseSimulationResult {
  // Merge phase-specific environmental factors with defaults
  const baseEnv = getDefaultPsycheEnvironment();
  const phaseEnv: EnvironmentalFactors = {
    ...baseEnv,
    ...phase.environmentalFactors,
    missionDuration: phase.durationYears,
  };
  
  // Calculate degradation during this phase
  const degradation = calculateEnvironmentalDegradation(cellType, pvArea, phaseEnv);
  
  // Apply degradation to initial values
  const endPVEfficiency = initialPVEfficiency * degradation.degradationByYear[Math.floor(phase.durationYears)]?.pvPower || initialPVEfficiency * 0.95;
  const endBatteryCapacity = initialBatteryCapacity * degradation.degradationByYear[Math.floor(phase.durationYears)]?.batteryCapacity || initialBatteryCapacity * 0.95;
  
  // Average efficiency during phase (linear interpolation)
  const avgPVEfficiency = (initialPVEfficiency + endPVEfficiency) / 2;
  const avgBatteryCapacity = (initialBatteryCapacity + endBatteryCapacity) / 2;
  
  // Estimate power generation (simplified - assumes constant solar flux at 2.9 AU)
  const solarFluxAt29AU = 590; // W/m² at 1 AU / (2.9²)
  const averagePowerGenerated = pvArea * solarFluxAt29AU * avgPVEfficiency;
  
  // Power consumption
  const averagePowerConsumed = phase.averagePowerLoad;
  
  // Energy margin over phase duration
  const hoursInPhase = phase.durationYears * 365.25 * 24;
  const energyGenerated = averagePowerGenerated * hoursInPhase;
  const energyConsumed = averagePowerConsumed * hoursInPhase;
  const energyMargin = energyGenerated - energyConsumed;
  
  // Battery SOC estimation (simplified)
  // Assume battery cycles between minSOC and maxSOC
  const energyDeficitPerCycle = Math.max(0, phase.peakPowerLoad - averagePowerGenerated) * (phaseEnv.orbitPeriod || 24);
  const maxBatteryDraw = energyDeficitPerCycle / (avgBatteryCapacity * batteryCapacityWh);
  const minSOC = Math.max(phase.minBatterySOC, 1 - maxBatteryDraw);
  const avgSOC = (minSOC + 1.0) / 2;
  
  // Viability check
  let viable = true;
  let failureReason: string | undefined;
  
  if (energyMargin < 0) {
    viable = false;
    failureReason = `Insufficient power generation: ${averagePowerGenerated.toFixed(1)}W generated vs ${averagePowerConsumed.toFixed(1)}W required`;
  } else if (minSOC < phase.minBatterySOC) {
    viable = false;
    failureReason = `Battery SOC drops below minimum: ${(minSOC * 100).toFixed(1)}% < ${(phase.minBatterySOC * 100).toFixed(1)}%`;
  } else if (endPVEfficiency < 0.3) {
    viable = false;
    failureReason = `Excessive PV degradation: ${((1 - endPVEfficiency) * 100).toFixed(1)}% degraded`;
  }
  
  return {
    phaseId: phase.id,
    phaseName: phase.name,
    startYear,
    endYear: startYear + phase.durationYears,
    
    averagePowerGenerated,
    averagePowerConsumed,
    energyMargin,
    
    pvEfficiencyFactor: endPVEfficiency,
    batteryCapacityFactor: endBatteryCapacity,
    cumulativeDegradation: (1 - Math.min(endPVEfficiency, endBatteryCapacity)) * 100,
    
    minSOC,
    avgSOC,
    
    viable,
    failureReason,
  };
}

/**
 * Simulate entire mission timeline
 */
export function simulateMissionTimeline(
  timeline: MissionTimeline,
  pvArea: number,
  batteryCapacityWh: number,
  cellType: string
): TimelineSimulationResult {
  const phaseResults: PhaseSimulationResult[] = [];
  let currentYear = 0;
  let currentPVEfficiency = 1.0;
  let currentBatteryCapacity = 1.0;
  
  // Simulate each phase sequentially
  for (const phase of timeline.phases) {
    const result = simulatePhase(
      phase,
      currentYear,
      currentPVEfficiency,
      currentBatteryCapacity,
      pvArea,
      batteryCapacityWh,
      cellType
    );
    
    phaseResults.push(result);
    
    // Update for next phase
    currentYear = result.endYear;
    currentPVEfficiency = result.pvEfficiencyFactor;
    currentBatteryCapacity = result.batteryCapacityFactor;
    
    // Stop if phase failed
    if (!result.viable) {
      break;
    }
  }
  
  // Calculate overall metrics
  const totalEnergyGenerated = phaseResults.reduce((sum, r) => sum + r.averagePowerGenerated * r.endYear - r.startYear * 365.25 * 24, 0) / 1000; // kWh
  const totalEnergyConsumed = phaseResults.reduce((sum, r) => sum + r.averagePowerConsumed * (r.endYear - r.startYear) * 365.25 * 24, 0) / 1000; // kWh
  const finalDegradation = phaseResults[phaseResults.length - 1]?.cumulativeDegradation || 0;
  const missionSuccess = phaseResults.every(r => r.viable);
  
  // Build degradation progression
  const degradationByYear: Array<{
    year: number;
    pvPower: number;
    batteryCapacity: number;
    cumulativeDegradation: number;
  }> = [];
  
  for (let year = 0; year <= Math.ceil(timeline.totalDuration); year++) {
    // Find which phase this year falls in
    let cumulativeYears = 0;
    let phaseIndex = 0;
    for (let i = 0; i < timeline.phases.length; i++) {
      if (year >= cumulativeYears && year < cumulativeYears + timeline.phases[i].durationYears) {
        phaseIndex = i;
        break;
      }
      cumulativeYears += timeline.phases[i].durationYears;
    }
    
    const phaseResult = phaseResults[phaseIndex];
    if (phaseResult) {
      const yearInPhase = year - phaseResult.startYear;
      const phaseFraction = yearInPhase / (phaseResult.endYear - phaseResult.startYear);
      
      // Linear interpolation within phase
      const pvPower = 1.0 - (1.0 - phaseResult.pvEfficiencyFactor) * phaseFraction;
      const batteryCapacity = 1.0 - (1.0 - phaseResult.batteryCapacityFactor) * phaseFraction;
      const cumulativeDegradation = (1 - Math.min(pvPower, batteryCapacity)) * 100;
      
      degradationByYear.push({
        year,
        pvPower,
        batteryCapacity,
        cumulativeDegradation,
      });
    }
  }
  
  return {
    timeline,
    phaseResults,
    totalEnergyGenerated,
    totalEnergyConsumed,
    finalDegradation,
    missionSuccess,
    degradationByYear,
  };
}
