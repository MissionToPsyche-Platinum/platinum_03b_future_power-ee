import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createSizingScenario,
  getUserSizingScenarios,
  getSizingScenarioById,
  updateSizingScenario,
  deleteSizingScenario,
  getSizingScenariosForComparison,
} from "./db/sizingScenarios";
import {
  createCostBenefitScenario,
  getUserCostBenefitScenarios,
  getCostBenefitScenarioById,
  updateCostBenefitScenario,
  deleteCostBenefitScenario,
  getCostBenefitScenariosForComparison,
} from "./db/costBenefitScenarios";

export const scenarioRouter = router({
  sizing: router({
    /**
     * Save a new sizing scenario
     */
    save: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          notes: z.string().optional(),
          tags: z.string().optional(),
          avgPower: z.number(),
          peakPower: z.number(),
          energyMargin: z.number(),
          minSOC: z.number(),
          eclipseDuration: z.number(),
          missionDuration: z.number(),
          maxMass: z.number(),
          maxCost: z.number(),
          concentrator: z.string(),
          pvCell: z.string(),
          battery: z.string(),
          resultsJson: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createSizingScenario({
          userId: ctx.user.id,
          createdBy: ctx.user.name || ctx.user.email || 'Unknown',
          lastModifiedBy: ctx.user.name || ctx.user.email || 'Unknown',
          ...input,
        });
      }),

    /**
     * Get all sizing scenarios for current user
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserSizingScenarios(ctx.user.id);
    }),

    /**
     * Get a single sizing scenario
     */
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getSizingScenarioById(input.id, ctx.user.id);
      }),

    /**
     * Update a sizing scenario
     */
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          notes: z.string().optional(),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        return updateSizingScenario(id, ctx.user.id, {
          ...updates,
          lastModifiedBy: ctx.user.name || ctx.user.email || 'Unknown',
        });
      }),

    /**
     * Delete a sizing scenario
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteSizingScenario(input.id, ctx.user.id);
      }),

    /**
     * Get multiple scenarios for comparison
     */
    compare: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .query(async ({ ctx, input }) => {
        return getSizingScenariosForComparison(input.ids, ctx.user.id);
      }),
  }),
  
  costBenefit: router({
    /**
     * Save a new cost-benefit scenario
     */
    save: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          notes: z.string().optional(),
          tags: z.string().optional(),
          avgPower: z.number(),
          peakPower: z.number(),
          missionDuration: z.number(),
          concentrator: z.string(),
          pvCell: z.string(),
          battery: z.string(),
          resultsJson: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createCostBenefitScenario({
          userId: ctx.user.id,
          createdBy: ctx.user.name || ctx.user.email || 'Unknown',
          lastModifiedBy: ctx.user.name || ctx.user.email || 'Unknown',
          ...input,
        });
      }),

    /**
     * Get all cost-benefit scenarios for current user
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserCostBenefitScenarios(ctx.user.id);
    }),

    /**
     * Get a single cost-benefit scenario
     */
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getCostBenefitScenarioById(input.id, ctx.user.id);
      }),

    /**
     * Update a cost-benefit scenario
     */
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          notes: z.string().optional(),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        return updateCostBenefitScenario(id, ctx.user.id, {
          ...updates,
          lastModifiedBy: ctx.user.name || ctx.user.email || 'Unknown',
        });
      }),

    /**
     * Delete a cost-benefit scenario
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteCostBenefitScenario(input.id, ctx.user.id);
      }),

    /**
     * Get multiple scenarios for comparison
     */
    compare: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .query(async ({ ctx, input }) => {
        return getCostBenefitScenariosForComparison(input.ids, ctx.user.id);
      }),
  }),
});
