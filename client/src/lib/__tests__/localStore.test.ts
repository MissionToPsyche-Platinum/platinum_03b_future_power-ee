/**
 * Unit tests for localStore.ts
 *
 * These tests verify that the localStorage-backed fallback storage works
 * correctly for unauthenticated users (standalone deployment scenario).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Mock localStorage ──────────────────────────────────────────────────────
// jsdom provides localStorage, but we reset it before each test.

import { localConfigs, localSizing, localCostBenefit } from "../localStore";

const STORAGE_KEYS = {
  configs: "psyche:configs",
  sizing: "psyche:sizing",
  costBenefit: "psyche:costBenefit",
};

function clearAll() {
  localStorage.removeItem(STORAGE_KEYS.configs);
  localStorage.removeItem(STORAGE_KEYS.sizing);
  localStorage.removeItem(STORAGE_KEYS.costBenefit);
}

// ── localConfigs ───────────────────────────────────────────────────────────

describe("localConfigs", () => {
  beforeEach(clearAll);

  it("starts with an empty list", () => {
    expect(localConfigs.list()).toEqual([]);
  });

  it("saves a configuration and returns it with an id", () => {
    const saved = localConfigs.save({
      name: "Test Config",
      description: "A test",
      concentrator: "Fresnel Lens",
      pvCell: "Triple-junction GaAs",
      battery: "Lithium-ion",
      concentratorArea: 4,
      pvArea: 1.5,
      batteryCapacity: 12000,
      baseLoad: 120,
      durationHours: 48,
      yearsOperation: 5,
      lastSimulationId: null,
    });

    expect(saved.id).toBe(1);
    expect(saved.name).toBe("Test Config");
    expect(saved.pvCell).toBe("Triple-junction GaAs");
    expect(typeof saved.createdAt).toBe("string");
  });

  it("lists all saved configurations", () => {
    localConfigs.save({ name: "A", description: null, concentrator: null, pvCell: "Si", battery: "Li", concentratorArea: 1, pvArea: 1, batteryCapacity: 1000, baseLoad: 50, durationHours: 48, yearsOperation: 0, lastSimulationId: null });
    localConfigs.save({ name: "B", description: null, concentrator: null, pvCell: "GaAs", battery: "NiH2", concentratorArea: 2, pvArea: 2, batteryCapacity: 2000, baseLoad: 100, durationHours: 48, yearsOperation: 1, lastSimulationId: null });

    const list = localConfigs.list();
    expect(list).toHaveLength(2);
    expect(list[0].name).toBe("A");
    expect(list[1].name).toBe("B");
  });

  it("assigns incrementing IDs", () => {
    const a = localConfigs.save({ name: "A", description: null, concentrator: null, pvCell: "Si", battery: "Li", concentratorArea: 1, pvArea: 1, batteryCapacity: 1000, baseLoad: 50, durationHours: 48, yearsOperation: 0, lastSimulationId: null });
    const b = localConfigs.save({ name: "B", description: null, concentrator: null, pvCell: "Si", battery: "Li", concentratorArea: 1, pvArea: 1, batteryCapacity: 1000, baseLoad: 50, durationHours: 48, yearsOperation: 0, lastSimulationId: null });
    expect(b.id).toBe(a.id + 1);
  });

  it("retrieves a configuration by id", () => {
    const saved = localConfigs.save({ name: "Lookup", description: null, concentrator: null, pvCell: "Si", battery: "Li", concentratorArea: 1, pvArea: 1, batteryCapacity: 1000, baseLoad: 50, durationHours: 48, yearsOperation: 0, lastSimulationId: null });
    const found = localConfigs.getById(saved.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe("Lookup");
  });

  it("returns undefined for a non-existent id", () => {
    expect(localConfigs.getById(9999)).toBeUndefined();
  });

  it("updates a configuration", () => {
    const saved = localConfigs.save({ name: "Old Name", description: null, concentrator: null, pvCell: "Si", battery: "Li", concentratorArea: 1, pvArea: 1, batteryCapacity: 1000, baseLoad: 50, durationHours: 48, yearsOperation: 0, lastSimulationId: null });
    const updated = localConfigs.update(saved.id, { name: "New Name" });
    expect(updated!.name).toBe("New Name");
    expect(localConfigs.getById(saved.id)!.name).toBe("New Name");
  });

  it("deletes a configuration", () => {
    const saved = localConfigs.save({ name: "To Delete", description: null, concentrator: null, pvCell: "Si", battery: "Li", concentratorArea: 1, pvArea: 1, batteryCapacity: 1000, baseLoad: 50, durationHours: 48, yearsOperation: 0, lastSimulationId: null });
    localConfigs.delete(saved.id);
    expect(localConfigs.list()).toHaveLength(0);
  });

  it("does not affect other items when deleting", () => {
    const a = localConfigs.save({ name: "A", description: null, concentrator: null, pvCell: "Si", battery: "Li", concentratorArea: 1, pvArea: 1, batteryCapacity: 1000, baseLoad: 50, durationHours: 48, yearsOperation: 0, lastSimulationId: null });
    localConfigs.save({ name: "B", description: null, concentrator: null, pvCell: "Si", battery: "Li", concentratorArea: 1, pvArea: 1, batteryCapacity: 1000, baseLoad: 50, durationHours: 48, yearsOperation: 0, lastSimulationId: null });
    localConfigs.delete(a.id);
    const remaining = localConfigs.list();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe("B");
  });
});

// ── localSizing ────────────────────────────────────────────────────────────

describe("localSizing", () => {
  beforeEach(clearAll);

  it("starts with an empty list", () => {
    expect(localSizing.list()).toEqual([]);
  });

  it("saves a sizing scenario and returns it with an id", () => {
    const saved = localSizing.save({
      name: "Sizing Test",
      description: null,
      notes: null,
      tags: null,
      avgPower: 150,
      peakPower: 250,
      energyMargin: 30,
      minSOC: 20,
      eclipseDuration: 210,
      missionDuration: 10,
      maxMass: 100,
      maxCost: 10000000,
      concentrator: "None",
      pvCell: "Triple-junction GaAs",
      battery: "Lithium-ion",
      resultsJson: JSON.stringify({ solution: { pvArea: 2, batteryCapacity: 5000 } }),
    });

    expect(saved.id).toBe(1);
    expect(saved.name).toBe("Sizing Test");
    expect(saved.createdBy).toBe("Guest");
  });

  it("compare returns only the requested ids", () => {
    const a = localSizing.save({ name: "A", description: null, notes: null, tags: null, avgPower: 100, peakPower: 200, energyMargin: 20, minSOC: 15, eclipseDuration: 200, missionDuration: 5, maxMass: 50, maxCost: 5000000, concentrator: "None", pvCell: "Si", battery: "Li", resultsJson: "{}" });
    const b = localSizing.save({ name: "B", description: null, notes: null, tags: null, avgPower: 200, peakPower: 300, energyMargin: 25, minSOC: 20, eclipseDuration: 210, missionDuration: 10, maxMass: 100, maxCost: 10000000, concentrator: "None", pvCell: "GaAs", battery: "NiH2", resultsJson: "{}" });
    localSizing.save({ name: "C", description: null, notes: null, tags: null, avgPower: 300, peakPower: 400, energyMargin: 30, minSOC: 25, eclipseDuration: 220, missionDuration: 15, maxMass: 150, maxCost: 15000000, concentrator: "None", pvCell: "Perovskite", battery: "Li-S", resultsJson: "{}" });

    const comparison = localSizing.compare([a.id, b.id]);
    expect(comparison).toHaveLength(2);
    expect(comparison.map(s => s.name).sort()).toEqual(["A", "B"]);
  });

  it("deletes a sizing scenario", () => {
    const saved = localSizing.save({ name: "To Delete", description: null, notes: null, tags: null, avgPower: 100, peakPower: 200, energyMargin: 20, minSOC: 15, eclipseDuration: 200, missionDuration: 5, maxMass: 50, maxCost: 5000000, concentrator: "None", pvCell: "Si", battery: "Li", resultsJson: "{}" });
    localSizing.delete(saved.id);
    expect(localSizing.list()).toHaveLength(0);
  });
});

// ── localCostBenefit ───────────────────────────────────────────────────────

describe("localCostBenefit", () => {
  beforeEach(clearAll);

  it("starts with an empty list", () => {
    expect(localCostBenefit.list()).toEqual([]);
  });

  it("saves a cost-benefit scenario and returns it with an id", () => {
    const saved = localCostBenefit.save({
      name: "CB Test",
      description: null,
      notes: null,
      tags: null,
      avgPower: 150,
      peakPower: 250,
      missionDuration: 10,
      concentrator: "None",
      pvCell: "Triple-junction GaAs",
      battery: "Lithium-ion",
      resultsJson: JSON.stringify({ lifecycle: { totalLifecycle: 5000000 } }),
    });

    expect(saved.id).toBe(1);
    expect(saved.name).toBe("CB Test");
    expect(saved.createdBy).toBe("Guest");
  });

  it("compare returns only the requested ids", () => {
    const a = localCostBenefit.save({ name: "A", description: null, notes: null, tags: null, avgPower: 100, peakPower: 200, missionDuration: 5, concentrator: "None", pvCell: "Si", battery: "Li", resultsJson: "{}" });
    const b = localCostBenefit.save({ name: "B", description: null, notes: null, tags: null, avgPower: 200, peakPower: 300, missionDuration: 10, concentrator: "None", pvCell: "GaAs", battery: "NiH2", resultsJson: "{}" });
    localCostBenefit.save({ name: "C", description: null, notes: null, tags: null, avgPower: 300, peakPower: 400, missionDuration: 15, concentrator: "None", pvCell: "Perovskite", battery: "Li-S", resultsJson: "{}" });

    const comparison = localCostBenefit.compare([a.id, b.id]);
    expect(comparison).toHaveLength(2);
    expect(comparison.map(s => s.name).sort()).toEqual(["A", "B"]);
  });

  it("deletes a cost-benefit scenario", () => {
    const saved = localCostBenefit.save({ name: "To Delete", description: null, notes: null, tags: null, avgPower: 100, peakPower: 200, missionDuration: 5, concentrator: "None", pvCell: "Si", battery: "Li", resultsJson: "{}" });
    localCostBenefit.delete(saved.id);
    expect(localCostBenefit.list()).toHaveLength(0);
  });
});
