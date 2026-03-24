import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { simulateMissionTimeline, getDefaultPsycheMissionTimeline, type MissionPhase } from './missionTimelineSimulation';

const missionPhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  durationYears: z.number(),
  averagePowerLoad: z.number(),
  peakPowerLoad: z.number(),
  minBatterySOC: z.number(),
  communicationDutyCycle: z.number(),
});

export const timelineRouter = router({
  /**
   * Get default Psyche mission timeline
   */
  getDefaultTimeline: publicProcedure.query(() => {
    return getDefaultPsycheMissionTimeline();
  }),
  
  /**
   * Simulate mission timeline with given parameters
   */
  simulate: publicProcedure
    .input(
      z.object({
        phases: z.array(missionPhaseSchema),
        pvArea: z.number(),
        batteryCapacityWh: z.number(),
        cellType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const timeline = {
        phases: input.phases as MissionPhase[],
        totalDuration: input.phases.reduce((sum, p) => sum + p.durationYears, 0),
      };
      
      const result = simulateMissionTimeline(
        timeline,
        input.pvArea,
        input.batteryCapacityWh,
        input.cellType
      );
      
      return result;
    }),
});
