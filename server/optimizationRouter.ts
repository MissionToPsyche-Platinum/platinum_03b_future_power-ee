import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { runOptimization, type OptimizationProgress } from "./optimizationEngine";

const optimizationConfigSchema = z.object({
  constraints: z.object({
    maxMass: z.number().optional(),
    maxCost: z.number().optional(),
    minPower: z.number().optional(),
    minSOC: z.number().optional(),
  }),
  objective: z.object({
    type: z.enum(["maximize_energy_margin", "minimize_mass", "minimize_cost", "multi_objective"]),
    weights: z.object({
      energyMargin: z.number().optional(),
      mass: z.number().optional(),
      cost: z.number().optional(),
    }).optional(),
  }),
  systemParams: z.object({
    concentratorArea: z.number(),
    pvArea: z.number(),
    batteryCapacity: z.number(),
    baseLoad: z.number(),
    duration: z.number(),
    yearsInOperation: z.number(),
  }),
  populationSize: z.number().optional(),
  generations: z.number().optional(),
  mutationRate: z.number().optional(),
  eliteSize: z.number().optional(),
});

export const optimizationRouter = router({
  /**
   * Run optimization to find optimal technology combinations
   */
  run: publicProcedure
    .input(optimizationConfigSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await runOptimization(input);
        return result;
      } catch (error) {
        console.error("Optimization error:", error);
        throw new Error(`Optimization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
});
