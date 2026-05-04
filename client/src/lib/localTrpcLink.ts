/**
 * Local tRPC Link — replaces the HTTP link for static/GitHub Pages deployment.
 *
 * All tRPC procedure calls are intercepted here and handled entirely in the
 * browser using the client-side simulation engine and localStorage.
 * No server, no OAuth, no database required.
 */

import { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "../../../server/routers";
import { runSimulation, getTechnologies } from "@/simulation/simulationEngine";
import { solveComponentSizing, generateSizingRecommendations } from "@/simulation/componentSizing";
import { performCostBenefitAnalysis } from "@/simulation/costBenefitAnalysis";
import { CONFIGURATION_PRESETS } from "@shared/presets";
import { localConfigs, localSizing, localCostBenefit } from "@/lib/localStore";
import { getDefaultPsycheMissionTimeline, simulateMissionTimeline } from "@/simulation/missionTimelineSimulation";
import { runOptimization } from "@/simulation/optimizationEngine";

// ─── helpers ────────────────────────────────────────────────────────────────

function ok(data: unknown) {
  return { result: { data } };
}

function err(message: string) {
  return { error: { message, code: -32600 } };
}

// ─── procedure router ────────────────────────────────────────────────────────

async function handleProcedure(path: string, input: unknown): Promise<unknown> {
  const technologies = getTechnologies();

  // ── auth ──────────────────────────────────────────────────────────────────
  if (path === "auth.me") return ok(null);
  if (path === "auth.logout") return ok({ success: true });

  // ── presets ───────────────────────────────────────────────────────────────
  if (path === "presets.list") return ok(CONFIGURATION_PRESETS);

  // ── simulation.getTechnologies ────────────────────────────────────────────
  if (path === "simulation.getTechnologies") return ok(technologies);

  // ── simulation.run ────────────────────────────────────────────────────────
  if (path === "simulation.run") {
    const i = input as any;
    const result = await runSimulation(
      {
        concentrator: i.concentrator,
        pvCell: i.pv_cell,
        battery: i.battery,
        concentratorArea: i.concentrator_area_m2 ?? 3,
        pvArea: i.pv_area_m2 ?? 1,
        batteryCapacity: i.battery_capacity_wh ?? 8000,
        baseLoad: i.base_load_w ?? 100,
        durationHours: i.duration_hours ?? 48,
        yearsInOperation: i.years_operation ?? 0,
        spacecraftClass: i.spacecraft_class ?? "discovery",
        useSimpleModel: i.use_simple_model ?? false,
      },
      technologies
    );
    return ok(result);
  }

  // ── accuracy.compare ──────────────────────────────────────────────────────
  if (path === "accuracy.compare") {
    const i = input as any;
    const baseConfig = {
      concentrator: i.concentrator ?? "None",
      pvCell: i.pvCell ?? "GaAs Triple Junction",
      battery: i.battery ?? "Lithium-ion (LiCoO2)",
      concentratorArea: i.concentratorArea ?? 0,
      pvArea: i.pvArea ?? 20,
      batteryCapacity: i.batteryCapacity ?? 5000,
      baseLoad: i.baseLoad ?? 500,
      durationHours: 48,
      yearsInOperation: i.yearsOperation ?? 5,
      spacecraftClass: "discovery",
    };
    const [baseline, withDegradation, withRadiation, fullModel] = await Promise.all([
      runSimulation({ ...baseConfig, useSimpleModel: true, yearsInOperation: 0 }, technologies),
      runSimulation({ ...baseConfig, useSimpleModel: false, yearsInOperation: baseConfig.yearsInOperation }, technologies),
      runSimulation({ ...baseConfig, useSimpleModel: false }, technologies),
      runSimulation({ ...baseConfig, useSimpleModel: false }, technologies),
    ]);
    return ok({ baseline, withDegradation, withRadiation, fullModel });
  }

  // ── sizing.solve ──────────────────────────────────────────────────────────
  if (path === "sizing.solve") {
    const i = input as any;
    const concentrator = i.concentratorId && i.concentratorId !== "none"
      ? technologies.concentrators.find((c: any) => c.name === i.concentratorId) || null
      : null;
    const pvCell = technologies.pv_cells.find((p: any) => p.name === i.pvCellId) || null;
    const battery = technologies.batteries.find((b: any) => b.name === i.batteryId) || null;
    if (!pvCell || !battery) return err("Technology not found");
    const solution = await solveComponentSizing(
      {
        averagePowerLoad: i.averagePowerLoad,
        peakPowerLoad: i.peakPowerLoad,
        minEnergyMargin: i.minEnergyMargin,
        minBatterySOC: i.minBatterySOC,
        eclipseDuration: i.eclipseDuration,
        missionDuration: i.missionDuration,
        maxTotalMass: i.maxTotalMass,
        maxTotalCost: i.maxTotalCost,
        concentratorId: i.concentratorId,
        pvCellId: i.pvCellId,
        batteryId: i.batteryId,
      },
      concentrator,
      pvCell,
      battery
    );
    const recommendations = generateSizingRecommendations(solution);
    return ok({ solution, recommendations });
  }

  // ── costBenefit.analyze ───────────────────────────────────────────────────
  if (path === "costBenefit.analyze") {
    const i = input as any;
    const concentrator = i.concentratorId && i.concentratorId !== "none"
      ? technologies.concentrators.find((c: any) => c.name === i.concentratorId) || null
      : null;
    const pvCell = technologies.pv_cells.find((p: any) => p.name === i.pvCellId) || null;
    const battery = technologies.batteries.find((b: any) => b.name === i.batteryId) || null;
    if (!pvCell || !battery) return err("Technology not found");
    const analysis = performCostBenefitAnalysis({
      concentrator,
      pvCell,
      battery,
      concentratorArea: i.concentratorArea,
      pvArea: i.pvArea,
      batteryCapacity: i.batteryCapacity,
      averagePower: i.averagePower,
      peakPower: i.peakPower,
      energyMargin: i.energyMargin,
      missionDuration: i.missionDuration,
    });
    return ok({
      analysis,
      technologies: {
        concentrator: concentrator?.name || "None",
        pvCell: pvCell.name,
        battery: battery.name,
      },
    });
  }

  // ── configurations (localStorage) ─────────────────────────────────────────
  if (path === "configurations.list") return ok(localConfigs.list());
  if (path === "configurations.save") {
    const i = input as any;
    const saved = localConfigs.save(i);
    return ok(saved);
  }
  if (path === "configurations.delete") {
    const i = input as any;
    localConfigs.delete(i.id);
    return ok({ success: true });
  }

  // ── scenarios.sizing (localStorage) ───────────────────────────────────────
  if (path === "scenarios.sizing.list") return ok(localSizing.list());
  if (path === "scenarios.sizing.save") {
    const i = input as any;
    return ok(localSizing.save(i));
  }
  if (path === "scenarios.sizing.delete") {
    const i = input as any;
    localSizing.delete(i.id);
    return ok({ success: true });
  }
  if (path === "scenarios.sizing.compare") {
    const i = input as any;
    const all = localSizing.list();
    const selected = all.filter((s: any) => (i.ids as string[]).includes(s.id));
    return ok(selected);
  }

  // ── scenarios.costBenefit (localStorage) ──────────────────────────────────
  if (path === "scenarios.costBenefit.list") return ok(localCostBenefit.list());
  if (path === "scenarios.costBenefit.save") {
    const i = input as any;
    return ok(localCostBenefit.save(i));
  }
  if (path === "scenarios.costBenefit.delete") {
    const i = input as any;
    localCostBenefit.delete(i.id);
    return ok({ success: true });
  }
  if (path === "scenarios.costBenefit.compare") {
    const i = input as any;
    const all = localCostBenefit.list();
    const selected = all.filter((s: any) => (i.ids as string[]).includes(s.id));
    return ok(selected);
  }

  // ── optimization.run ──────────────────────────────────────────────────────
  if (path === "optimization.run") {
    const result = await runOptimization(input as any);
    return ok(result);
  }

  // ── timeline ──────────────────────────────────────────────────────────────
  if (path === "timeline.getDefaultTimeline") {
    return ok(getDefaultPsycheMissionTimeline());
  }
  if (path === "timeline.simulate") {
    const i = input as any;
    const phases = i.phases ?? [];
    const totalDuration = phases.reduce((sum: number, p: any) => sum + (p.durationYears ?? 0), 0);
    const timeline = { phases, totalDuration };
    const result = simulateMissionTimeline(
      timeline,
      i.pvArea ?? 20,
      i.batteryCapacityWh ?? 5000,
      i.cellType ?? "GaAs Triple Junction"
    );
    return ok(result);
  }

  // ── system.notifyOwner ────────────────────────────────────────────────────
  if (path === "system.notifyOwner") return ok({ success: false });

  // ── fallback ──────────────────────────────────────────────────────────────
  console.warn(`[localTrpcLink] Unhandled procedure: ${path}`, input);
  return ok(null);
}

// ─── tRPC link factory ───────────────────────────────────────────────────────

export function createLocalLink(): TRPCLink<AppRouter> {
  return () =>
    ({ op }) =>
      observable((observer) => {
        handleProcedure(op.path, op.input)
          .then((result: any) => {
            if (result.error) {
              observer.error(new Error(result.error.message) as any);
            } else {
              observer.next(result);
              observer.complete();
            }
          })
          .catch((e: unknown) => {
            observer.error((e instanceof Error ? e : new Error(String(e))) as any);
          });
      });
}
