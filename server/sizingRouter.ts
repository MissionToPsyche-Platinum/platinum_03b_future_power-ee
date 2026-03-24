/**
 * tRPC Router for Component Sizing Optimization
 */

import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getTechnologies } from "./getTechnologies";
import { solveComponentSizing, generateSizingRecommendations } from "./lib/componentSizing";

export const sizingRouter = router({
  /**
   * Solve for optimal component sizes based on requirements
   */
  solve: publicProcedure
    .input(
      z.object({
        // Power requirements
        averagePowerLoad: z.number().min(1).max(10000),
        peakPowerLoad: z.number().min(1).max(10000),
        
        // Energy margin requirements
        minEnergyMargin: z.number().min(0).max(100),
        minBatterySOC: z.number().min(0).max(100),
        
        // Mission parameters
        eclipseDuration: z.number().min(0.1).max(24),
        missionDuration: z.number().min(0.1).max(20),
        
        // Constraints
        maxTotalMass: z.number().min(1).max(10000),
        maxTotalCost: z.number().min(1000).max(1e9),
        
        // Selected technologies
        concentratorId: z.string().nullable(),
        pvCellId: z.string(),
        batteryId: z.string(),
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
      
      // Solve for component sizes
      const solution = await solveComponentSizing(
        {
          averagePowerLoad: input.averagePowerLoad,
          peakPowerLoad: input.peakPowerLoad,
          minEnergyMargin: input.minEnergyMargin,
          minBatterySOC: input.minBatterySOC,
          eclipseDuration: input.eclipseDuration,
          missionDuration: input.missionDuration,
          maxTotalMass: input.maxTotalMass,
          maxTotalCost: input.maxTotalCost,
          concentratorId: input.concentratorId,
          pvCellId: input.pvCellId,
          batteryId: input.batteryId,
        },
        concentrator,
        pvCell,
        battery
      );
      
      // Generate recommendations
      const recommendations = generateSizingRecommendations(solution);
      
      return {
        solution,
        recommendations,
        technologies: {
          concentrator: concentrator?.name || 'None',
          pvCell: pvCell.name,
          battery: battery.name,
        }
      };
    }),
});
