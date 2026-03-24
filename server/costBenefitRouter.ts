/**
 * tRPC Router for Cost-Benefit Analysis
 */

import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getTechnologies } from "./getTechnologies";
import { performCostBenefitAnalysis, compareConfigurations, type ConfigurationComparison } from "./lib/costBenefitAnalysis";

export const costBenefitRouter = router({
  /**
   * Analyze a single configuration
   */
  analyze: publicProcedure
    .input(
      z.object({
        concentratorId: z.string().nullable(),
        pvCellId: z.string(),
        batteryId: z.string(),
        
        // System sizing
        concentratorArea: z.number().min(0),
        pvArea: z.number().min(0.1),
        batteryCapacity: z.number().min(100),
        
        // Performance metrics
        averagePower: z.number().min(1),
        peakPower: z.number().min(1),
        energyMargin: z.number(),
        
        // Mission parameters
        missionDuration: z.number().min(0.1).max(20),
      })
    )
    .mutation(async ({ input }) => {
      // Get technologies database
      const technologies = await getTechnologies();
      
      // Find selected technologies
      const concentrator = input.concentratorId && input.concentratorId !== 'none'
        ? technologies.concentrators.find(c => c.name === input.concentratorId) || null
        : null;
      
      const pvCell = technologies.pv_cells.find(p => p.name === input.pvCellId) || null;
      const battery = technologies.batteries.find(b => b.name === input.batteryId) || null;
      
      if (!pvCell) {
        throw new Error(`PV cell not found: ${input.pvCellId}`);
      }
      
      if (!battery) {
        throw new Error(`Battery not found: ${input.batteryId}`);
      }
      
      // Perform cost-benefit analysis
      const analysis = performCostBenefitAnalysis({
        concentrator,
        pvCell,
        battery,
        concentratorArea: input.concentratorArea,
        pvArea: input.pvArea,
        batteryCapacity: input.batteryCapacity,
        averagePower: input.averagePower,
        peakPower: input.peakPower,
        energyMargin: input.energyMargin,
        missionDuration: input.missionDuration,
      });
      
      return {
        analysis,
        technologies: {
          concentrator: concentrator?.name || 'None',
          pvCell: pvCell.name,
          battery: battery.name,
        }
      };
    }),
  
  /**
   * Compare multiple configurations
   */
  compare: publicProcedure
    .input(
      z.object({
        configurations: z.array(
          z.object({
            name: z.string(),
            concentratorId: z.string().nullable(),
            pvCellId: z.string(),
            batteryId: z.string(),
            concentratorArea: z.number(),
            pvArea: z.number(),
            batteryCapacity: z.number(),
            averagePower: z.number(),
            peakPower: z.number(),
            energyMargin: z.number(),
            missionDuration: z.number(),
          })
        ).min(2).max(10)
      })
    )
    .mutation(async ({ input }) => {
      const technologies = await getTechnologies();
      
      // Analyze each configuration
      const comparisons: ConfigurationComparison[] = [];
      
      for (const config of input.configurations) {
        const concentrator = config.concentratorId && config.concentratorId !== 'none'
          ? technologies.concentrators.find(c => c.name === config.concentratorId) || null
          : null;
        
        const pvCell = technologies.pv_cells.find(p => p.name === config.pvCellId) || null;
        const battery = technologies.batteries.find(b => b.name === config.batteryId) || null;
        
        if (!pvCell || !battery) continue;
        
        const analysis = performCostBenefitAnalysis({
          concentrator,
          pvCell,
          battery,
          concentratorArea: config.concentratorArea,
          pvArea: config.pvArea,
          batteryCapacity: config.batteryCapacity,
          averagePower: config.averagePower,
          peakPower: config.peakPower,
          energyMargin: config.energyMargin,
          missionDuration: config.missionDuration,
        });
        
        comparisons.push({
          name: config.name,
          analysis
        });
      }
      
      // Compare configurations
      const comparison = compareConfigurations(comparisons);
      
      return {
        comparisons,
        comparison
      };
    }),
});
