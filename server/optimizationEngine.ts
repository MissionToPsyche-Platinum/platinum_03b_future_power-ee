import { runSimulation } from "./simulationEngine.js";
import { getTechnologies } from "./getTechnologies";
import { idToName, CONCENTRATOR_MAP, PV_CELL_MAP, BATTERY_MAP } from "./technologyMapping";

/**
 * Optimization Engine for 16 Psyche Power System
 * Uses genetic algorithms to find optimal technology combinations
 */

export interface OptimizationConstraints {
  maxMass?: number; // kg
  maxCost?: number; // $
  minPower?: number; // W
  minSOC?: number; // percentage (0-100)
}

export interface OptimizationObjective {
  type: "maximize_energy_margin" | "minimize_mass" | "minimize_cost" | "multi_objective";
  weights?: {
    energyMargin?: number;
    mass?: number;
    cost?: number;
  };
}

export interface OptimizationConfig {
  constraints: OptimizationConstraints;
  objective: OptimizationObjective;
  systemParams: {
    concentratorArea: number;
    pvArea: number;
    batteryCapacity: number;
    baseLoad: number;
    duration: number;
    yearsInOperation: number;
  };
  populationSize?: number;
  generations?: number;
  mutationRate?: number;
  eliteSize?: number;
}

export interface Individual {
  genes: {
    concentratorId: string;
    pvCellId: string;
    batteryId: string;
  };
  fitness: number;
  metrics?: {
    energyMargin: number;
    mass: number;
    cost: number;
    minSOC: number;
    viable: boolean;
  };
}

export interface OptimizationProgress {
  generation: number;
  bestFitness: number;
  averageFitness: number;
  bestIndividual: Individual;
}

export interface OptimizationResult {
  success: boolean;
  bestSolution: Individual;
  allSolutions: Individual[];
  paretoFrontier?: Individual[];
  progress: OptimizationProgress[];
  executionTime: number;
}

/**
 * Estimate mass for a technology configuration (simplified model)
 */
function estimateMass(
  concentratorId: string,
  pvCellId: string,
  batteryId: string,
  concentratorArea: number,
  pvArea: number,
  batteryCapacity: number
): number {
  
  // Mass estimates (kg/m² for arrays, kg/Wh for batteries)
  const concentratorMassPerM2: Record<string, number> = {
    "none": 0,
    "simple_parabolic": 8,
    "fresnel_lens": 6,
    "parabolic_dish": 12,
    "cpc": 7,
    "metamaterial": 4,
  };

  const pvMassPerM2: Record<string, number> = {
    "none": 0,
    "gaas_single": 2,
    "gaas_dual": 2.5,
    "gaas_triple": 3,
    "gaas_quad": 3.5,
    "quantum_dot": 1.5,
  };

  const batteryMassPerWh: Record<string, number> = {
    "none": 0,
    "nih2": 0.02,
    "liion_nmc": 0.0055,
    "liion_lfp": 0.006,
    "lisulfur": 0.004,
    "solid_state": 0.003,
  };

  const concentratorMass = concentratorMassPerM2[concentratorId] || 5;
  const pvMass = pvMassPerM2[pvCellId] || 2;
  const batteryMass = batteryMassPerWh[batteryId] || 0.005;

  return (
    concentratorArea * concentratorMass +
    pvArea * pvMass +
    batteryCapacity * batteryMass
  );
}

/**
 * Estimate cost for a technology configuration (simplified model)
 */
function estimateCost(
  concentratorId: string,
  pvCellId: string,
  batteryId: string,
  concentratorArea: number,
  pvArea: number,
  batteryCapacity: number
): number {
  // Cost estimates ($/m² for arrays, $/Wh for batteries)
  const concentratorCostPerM2: Record<string, number> = {
    "none": 0,
    "simple_parabolic": 500,
    "fresnel_lens": 800,
    "parabolic_dish": 1200,
    "cpc": 700,
    "metamaterial": 2000,
  };

  const pvCostPerM2: Record<string, number> = {
    "none": 0,
    "gaas_single": 1000,
    "gaas_dual": 1500,
    "gaas_triple": 2000,
    "gaas_quad": 2500,
    "quantum_dot": 3000,
  };

  const batteryCostPerWh: Record<string, number> = {
    "none": 0,
    "nih2": 0.5,
    "liion_nmc": 0.3,
    "liion_lfp": 0.25,
    "lisulfur": 0.4,
    "solid_state": 0.8,
  };

  const concentratorCost = concentratorCostPerM2[concentratorId] || 1000;
  const pvCost = pvCostPerM2[pvCellId] || 1500;
  const batteryCost = batteryCostPerWh[batteryId] || 0.3;

  return (
    concentratorArea * concentratorCost +
    pvArea * pvCost +
    batteryCapacity * batteryCost
  );
}

/**
 * Evaluate fitness of an individual based on simulation results
 */
async function evaluateFitness(
  individual: Individual,
  config: OptimizationConfig
): Promise<number> {
  const { genes } = individual;
  const { constraints, objective, systemParams } = config;

  // Get technologies database
  const technologies = await getTechnologies();
  
  // Map IDs to names using the mapping utility
  const concentratorName = idToName(genes.concentratorId, "concentrator");
  const pvCellName = idToName(genes.pvCellId, "pv_cell");
  const batteryName = idToName(genes.batteryId, "battery");

  // Run simulation
  const simResult = await runSimulation({
    concentrator: concentratorName,
    pvCell: pvCellName,
    battery: batteryName,
    concentratorArea: systemParams.concentratorArea,
    pvArea: systemParams.pvArea,
    batteryCapacity: systemParams.batteryCapacity,
    baseLoad: systemParams.baseLoad,
    durationHours: systemParams.duration,
    yearsInOperation: systemParams.yearsInOperation,
  }, technologies);

  // Calculate metrics
  const energyMargin = simResult.metrics.energy_balance;
  const mass = estimateMass(
    genes.concentratorId,
    genes.pvCellId,
    genes.batteryId,
    systemParams.concentratorArea,
    systemParams.pvArea,
    systemParams.batteryCapacity
  );
  const cost = estimateCost(
    genes.concentratorId,
    genes.pvCellId,
    genes.batteryId,
    systemParams.concentratorArea,
    systemParams.pvArea,
    systemParams.batteryCapacity
  );
  const minSOC = simResult.metrics.min_soc;
  const viable = simResult.metrics.viable;

  // Store metrics
  individual.metrics = {
    energyMargin,
    mass,
    cost,
    minSOC,
    viable,
  };

  // Check constraints
  let penaltyFactor = 1.0;
  
  if (!viable) {
    penaltyFactor *= 0.1; // Heavy penalty for non-viable systems
  }
  
  if (constraints.maxMass && mass > constraints.maxMass) {
    penaltyFactor *= 0.5;
  }
  
  if (constraints.maxCost && cost > constraints.maxCost) {
    penaltyFactor *= 0.5;
  }
  
  if (constraints.minPower && simResult.metrics.avg_power_generated < constraints.minPower) {
    penaltyFactor *= 0.3;
  }
  
  if (constraints.minSOC && minSOC < constraints.minSOC) {
    penaltyFactor *= 0.4;
  }

  // Calculate fitness based on objective
  let fitness = 0;

  if (objective.type === "maximize_energy_margin") {
    fitness = energyMargin * penaltyFactor;
  } else if (objective.type === "minimize_mass") {
    fitness = (1 / (mass + 1)) * 10000 * penaltyFactor;
  } else if (objective.type === "minimize_cost") {
    fitness = (1 / (cost + 1)) * 1000000 * penaltyFactor;
  } else if (objective.type === "multi_objective") {
    const weights = objective.weights || {
      energyMargin: 0.4,
      mass: 0.3,
      cost: 0.3,
    };
    
    // Normalize and combine objectives
    const normalizedEnergy = energyMargin / 10000; // Normalize to ~0-1 range
    const normalizedMass = 1 / (mass + 1);
    const normalizedCost = 1 / (cost + 1);
    
    fitness = (
      weights.energyMargin! * normalizedEnergy +
      weights.mass! * normalizedMass * 100 +
      weights.cost! * normalizedCost * 10000
    ) * penaltyFactor;
  }

  return fitness;
}

/**
 * Create initial random population
 */
async function createInitialPopulation(size: number): Promise<Individual[]> {
  const technologies = await getTechnologies();
  const population: Individual[] = [];
  
  // Get available technology IDs from mapping
  const concentratorIds = Object.keys(CONCENTRATOR_MAP);
  const pvCellIds = Object.keys(PV_CELL_MAP).filter(id => id !== 'none'); // Exclude 'none' for PV cells
  const batteryIds = Object.keys(BATTERY_MAP);

  for (let i = 0; i < size; i++) {
    const concentratorId = concentratorIds[Math.floor(Math.random() * concentratorIds.length)];
    const pvCellId = pvCellIds[Math.floor(Math.random() * pvCellIds.length)];
    const batteryId = batteryIds[Math.floor(Math.random() * batteryIds.length)];

    population.push({
      genes: {
        concentratorId,
        pvCellId,
        batteryId,
      },
      fitness: 0,
    });
  }

  return population;
}

/**
 * Tournament selection
 */
function selectParent(population: Individual[], tournamentSize: number = 3): Individual {
  const tournament: Individual[] = [];
  
  for (let i = 0; i < tournamentSize; i++) {
    const randomIndex = Math.floor(Math.random() * population.length);
    tournament.push(population[randomIndex]);
  }
  
  tournament.sort((a, b) => b.fitness - a.fitness);
  return tournament[0];
}

/**
 * Crossover two parents to create offspring
 */
function crossover(parent1: Individual, parent2: Individual): Individual {
  const offspring: Individual = {
    genes: {
      concentratorId: Math.random() < 0.5 ? parent1.genes.concentratorId : parent2.genes.concentratorId,
      pvCellId: Math.random() < 0.5 ? parent1.genes.pvCellId : parent2.genes.pvCellId,
      batteryId: Math.random() < 0.5 ? parent1.genes.batteryId : parent2.genes.batteryId,
    },
    fitness: 0,
  };
  
  return offspring;
}

/**
 * Mutate an individual
 */
function mutate(individual: Individual, mutationRate: number): void {
  const concentratorIds = Object.keys(CONCENTRATOR_MAP);
  const pvCellIds = Object.keys(PV_CELL_MAP).filter(id => id !== 'none'); // Exclude 'none' for PV cells
  const batteryIds = Object.keys(BATTERY_MAP);
  
  if (Math.random() < mutationRate) {
    individual.genes.concentratorId = concentratorIds[Math.floor(Math.random() * concentratorIds.length)];
  }
  
  if (Math.random() < mutationRate) {
    individual.genes.pvCellId = pvCellIds[Math.floor(Math.random() * pvCellIds.length)];
  }
  
  if (Math.random() < mutationRate) {
    individual.genes.batteryId = batteryIds[Math.floor(Math.random() * batteryIds.length)];
  }
}

/**
 * Calculate Pareto frontier for multi-objective optimization
 */
function calculateParetoFrontier(population: Individual[]): Individual[] {
  const frontier: Individual[] = [];
  
  for (const individual of population) {
    let isDominated = false;
    
    for (const other of population) {
      if (individual === other) continue;
      
      const iMetrics = individual.metrics!;
      const oMetrics = other.metrics!;
      
      // Check if 'other' dominates 'individual'
      const betterEnergy = oMetrics.energyMargin >= iMetrics.energyMargin;
      const betterMass = oMetrics.mass <= iMetrics.mass;
      const betterCost = oMetrics.cost <= iMetrics.cost;
      
      const strictlyBetter =
        (oMetrics.energyMargin > iMetrics.energyMargin) ||
        (oMetrics.mass < iMetrics.mass) ||
        (oMetrics.cost < iMetrics.cost);
      
      if (betterEnergy && betterMass && betterCost && strictlyBetter) {
        isDominated = true;
        break;
      }
    }
    
    if (!isDominated) {
      frontier.push(individual);
    }
  }
  
  return frontier;
}

/**
 * Run genetic algorithm optimization
 */
export async function runOptimization(
  config: OptimizationConfig,
  progressCallback?: (progress: OptimizationProgress) => void
): Promise<OptimizationResult> {
  const startTime = Date.now();
  
  const populationSize = config.populationSize || 50;
  const generations = config.generations || 100;
  const mutationRate = config.mutationRate || 0.1;
  const eliteSize = config.eliteSize || 5;
  
  // Create initial population
  let population = await createInitialPopulation(populationSize);
  
  // Evaluate initial population
  for (const individual of population) {
    individual.fitness = await evaluateFitness(individual, config);
  }
  
  const progress: OptimizationProgress[] = [];
  
  // Evolution loop
  for (let gen = 0; gen < generations; gen++) {
    // Sort by fitness
    population.sort((a, b) => b.fitness - a.fitness);
    
    // Track progress
    const avgFitness = population.reduce((sum, ind) => sum + ind.fitness, 0) / population.length;
    const progressData: OptimizationProgress = {
      generation: gen,
      bestFitness: population[0].fitness,
      averageFitness: avgFitness,
      bestIndividual: JSON.parse(JSON.stringify(population[0])),
    };
    progress.push(progressData);
    
    if (progressCallback) {
      progressCallback(progressData);
    }
    
    // Create next generation
    const nextGeneration: Individual[] = [];
    
    // Elitism: keep best individuals
    for (let i = 0; i < eliteSize; i++) {
      nextGeneration.push(JSON.parse(JSON.stringify(population[i])));
    }
    
    // Create offspring
    while (nextGeneration.length < populationSize) {
      const parent1 = selectParent(population);
      const parent2 = selectParent(population);
      const offspring = crossover(parent1, parent2);
      await mutate(offspring, mutationRate);
      nextGeneration.push(offspring);
    }
    
    // Evaluate new individuals
    for (let i = eliteSize; i < nextGeneration.length; i++) {
      nextGeneration[i].fitness = await evaluateFitness(nextGeneration[i], config);
    }
    
    population = nextGeneration;
  }
  
  // Final sort
  population.sort((a, b) => b.fitness - a.fitness);
  
  // Calculate Pareto frontier for multi-objective
  let paretoFrontier: Individual[] | undefined;
  if (config.objective.type === "multi_objective") {
    paretoFrontier = calculateParetoFrontier(population);
  }
  
  const executionTime = (Date.now() - startTime) / 1000; // seconds
  
  return {
    success: true,
    bestSolution: population[0],
    allSolutions: population.slice(0, 20), // Top 20 solutions
    paretoFrontier,
    progress,
    executionTime,
  };
}
