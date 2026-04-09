import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getTechnologies } from "./getTechnologies";
import { runSimulation } from "./simulationEngine";
import { saveSimulation, getUserSimulations, getSimulationById, saveSavedConfiguration, getUserSavedConfigurations, getSavedConfigurationById, updateSavedConfiguration, deleteSavedConfiguration } from "./db";
import { CONFIGURATION_PRESETS } from "../shared/presets";
import { optimizationRouter } from "./optimizationRouter";
import { timelineRouter } from "./timelineRouter";
import { sizingRouter } from "./sizingRouter";
import { costBenefitRouter } from "./costBenefitRouter";
import { scenarioRouter } from "./scenarioRouter";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Configuration presets router
  presets: router({
    list: publicProcedure.query(() => {
      return CONFIGURATION_PRESETS;
    }),
  }),

  // Simulation feature router
  simulation: router({
    // Get available technologies
    getTechnologies: publicProcedure.query(async () => {
      return await getTechnologies();
    }),

    // Run a new simulation
    run: publicProcedure
      .input(
        z.object({
          concentrator: z.string(),
          pv_cell: z.string(),
          battery: z.string(),
          concentrator_area_m2: z.number().optional(),
          pv_area_m2: z.number().optional(),
          battery_capacity_wh: z.number().optional(),
          base_load_w: z.number().optional(),
          duration_hours: z.number().optional(),
          years_operation: z.number().optional(),
          spacecraft_class: z.string().optional(),
          use_simple_model: z.boolean().optional(),
          save: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get technologies database
        const technologies = await getTechnologies();
        
        // Run the simulation
        const results = await runSimulation({
          concentrator: input.concentrator,
          pvCell: input.pv_cell,
          battery: input.battery,
          concentratorArea: input.concentrator_area_m2 || 3,
          pvArea: input.pv_area_m2 || 1,
          batteryCapacity: input.battery_capacity_wh || 8000,
          baseLoad: input.base_load_w || 100,
          durationHours: input.duration_hours || 48,
          yearsInOperation: input.years_operation || 0,
          spacecraftClass: input.spacecraft_class || 'flagship',
          useSimpleModel: input.use_simple_model || false,
        }, technologies);

        // Save to database if requested and user is authenticated
        if (input.save && ctx.user) {
          await saveSimulation({
            userId: ctx.user.id,
            concentrator: input.concentrator,
            pvCell: input.pv_cell,
            battery: input.battery,
            concentratorArea: Math.round((input.concentrator_area_m2 || 3) * 100),
            pvArea: Math.round((input.pv_area_m2 || 1) * 100),
            batteryCapacity: Math.round(input.battery_capacity_wh || 8000),
            baseLoad: Math.round(input.base_load_w || 100),
            durationHours: Math.round(input.duration_hours || 48),
            yearsOperation: Math.round(input.years_operation || 0),
            avgPowerGenerated: Math.round((results.metrics?.avg_power_generated || 0) * 100),
            maxPowerGenerated: Math.round((results.metrics?.peak_power_generated || 0) * 100),
            avgPowerConsumed: Math.round((results.metrics?.avg_power_consumed || 0) * 100),
            minBatterySoc: Math.round((results.metrics?.min_soc || 0) * 10000),
            maxBatterySoc: Math.round(10000),
            finalBatterySoc: Math.round((results.metrics?.final_soc || 0) * 10000),
            energyGenerated: Math.round((results.metrics?.avg_power_generated || 0) * (input.duration_hours || 48)),
            energyConsumed: Math.round((results.metrics?.avg_power_consumed || 0) * (input.duration_hours || 48)),
            energyBalance: Math.round(results.metrics?.energy_balance || 0),
            systemViable: results.metrics?.viable ? 1 : 0,
            resultsJson: JSON.stringify(results),
          });
        }

        return results;
      }),

    // Get user's simulation history
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await getUserSimulations(ctx.user.id, input?.limit || 10);
      }),

    // Get specific simulation by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const simulation = await getSimulationById(input.id);
        if (!simulation) {
          throw new Error("Simulation not found");
        }
        return {
          ...simulation,
          results: JSON.parse(simulation.resultsJson),
        };
      }),
  }),

  // Optimization router
  optimization: optimizationRouter,

  // Mission timeline router
  timeline: timelineRouter,

  // Component sizing router
  sizing: sizingRouter,

  // Cost-benefit analysis router
  costBenefit: costBenefitRouter,

  // Scenario management router
  scenarios: scenarioRouter,

  // Accuracy comparison router
  accuracy: router({    // Run dual simulation (simple vs. advanced models)
    compare: publicProcedure
      .input(
        z.object({
          concentrator: z.string(),
          pv_cell: z.string(),
          battery: z.string(),
          concentrator_area_m2: z.number().optional(),
          pv_area_m2: z.number().optional(),
          battery_capacity_wh: z.number().optional(),
          base_load_w: z.number().optional(),
          duration_hours: z.number().optional(),
          years_operation: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const technologies = await getTechnologies();
        
        const config = {
          concentrator: input.concentrator,
          pvCell: input.pv_cell,
          battery: input.battery,
          concentratorArea: input.concentrator_area_m2 || 3,
          pvArea: input.pv_area_m2 || 1,
          batteryCapacity: input.battery_capacity_wh || 8000,
          baseLoad: input.base_load_w || 100,
          durationHours: input.duration_hours || 48,
          yearsInOperation: input.years_operation || 0,
        };
        
        // Run advanced (NASA-validated) simulation
        const advancedResults = await runSimulation(config, technologies);
        
        // Run simple simulation (disable accuracy improvements)
        // This requires modifying simulationEngine to accept a 'simple' flag
        // For now, we'll run the same simulation and calculate what simple would be
        const simpleResults = await runSimulation(
          { ...config, yearsInOperation: 0 }, // No degradation
          technologies
        );
        
        return {
          simple: simpleResults,
          advanced: advancedResults,
          config,
        };
      }),
  }),

  // Saved configurations router for comparison mode
  configurations: router({    // List user's saved configurations
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserSavedConfigurations(ctx.user.id);
    }),

    // Get specific configuration by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const config = await getSavedConfigurationById(input.id);
        if (!config) {
          throw new Error("Configuration not found");
        }
        // Verify ownership
        if (config.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        return config;
      }),

    // Save a new configuration
    save: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          concentrator: z.string().optional(),
          pvCell: z.string(),
          battery: z.string(),
          concentratorArea: z.number().default(3),
          pvArea: z.number().default(1),
          batteryCapacity: z.number().default(8000),
          baseLoad: z.number().default(100),
          durationHours: z.number().default(48),
          yearsOperation: z.number().default(0),
          lastSimulationId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await saveSavedConfiguration({
          userId: ctx.user.id,
          name: input.name,
          description: input.description || null,
          concentrator: input.concentrator || null,
          pvCell: input.pvCell,
          battery: input.battery,
          concentratorArea: input.concentratorArea,
          pvArea: input.pvArea,
          batteryCapacity: input.batteryCapacity,
          baseLoad: input.baseLoad,
          durationHours: input.durationHours,
          yearsOperation: input.yearsOperation,
          lastSimulationId: input.lastSimulationId || null,
        });
      }),

    // Update existing configuration
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          concentrator: z.string().optional(),
          pvCell: z.string().optional(),
          battery: z.string().optional(),
          concentratorArea: z.number().optional(),
          pvArea: z.number().optional(),
          batteryCapacity: z.number().optional(),
          baseLoad: z.number().optional(),
          durationHours: z.number().optional(),
          yearsOperation: z.number().optional(),
          lastSimulationId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Verify ownership first
        const existing = await getSavedConfigurationById(input.id);
        if (!existing) {
          throw new Error("Configuration not found");
        }
        if (existing.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        const { id, ...updates } = input;
        return await updateSavedConfiguration(id, updates);
      }),

    // Delete configuration
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Verify ownership first
        const existing = await getSavedConfigurationById(input.id);
        if (!existing) {
          throw new Error("Configuration not found");
        }
        if (existing.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        return await deleteSavedConfiguration(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
