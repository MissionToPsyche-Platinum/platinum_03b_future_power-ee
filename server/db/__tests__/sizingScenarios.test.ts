import { describe, it, expect, beforeEach } from "vitest";
import {
  createSizingScenario,
  getUserSizingScenarios,
  getSizingScenarioById,
  updateSizingScenario,
  deleteSizingScenario,
  getSizingScenariosForComparison,
} from "../sizingScenarios";

describe("Sizing Scenarios Database Operations", () => {
  const mockUserId = 1;
  const mockScenario = {
    userId: mockUserId,
    name: "Test Scenario",
    description: "Test description",
    avgPower: 150,
    peakPower: 250,
    energyMargin: 30,
    minSOC: 20,
    eclipseDuration: 210, // 2.1 hours * 100
    missionDuration: 10,
    maxMass: 100,
    maxCost: 10000000,
    concentrator: "Parabolic Concentrator 10x",
    pvCell: "Triple-junction GaAs",
    battery: "Lithium-ion NMC",
    resultsJson: JSON.stringify({
      solution: {
        pvArea: 14.42,
        batteryCapacity: 394,
        totalMass: 35.4,
        totalCost: 60000,
        energyMargin: 171.4,
        minSOC: 20.0,
        feasible: true,
      },
    }),
  };

  it("should create a sizing scenario", async () => {
    const scenario = await createSizingScenario(mockScenario);
    expect(scenario).toBeDefined();
    expect(scenario.name).toBe(mockScenario.name);
    expect(scenario.userId).toBe(mockUserId);
    expect(scenario.avgPower).toBe(mockScenario.avgPower);
  });

  it("should retrieve user sizing scenarios", async () => {
    // Create a test scenario first
    await createSizingScenario(mockScenario);
    
    const scenarios = await getUserSizingScenarios(mockUserId);
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBeGreaterThan(0);
  });

  it("should get a single sizing scenario by ID", async () => {
    const created = await createSizingScenario(mockScenario);
    const retrieved = await getSizingScenarioById(created.id, mockUserId);
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.name).toBe(mockScenario.name);
  });

  it("should update a sizing scenario", async () => {
    const created = await createSizingScenario(mockScenario);
    const updated = await updateSizingScenario(created.id, mockUserId, {
      name: "Updated Name",
      description: "Updated description",
    });
    
    expect(updated).toBeDefined();
    expect(updated?.name).toBe("Updated Name");
    expect(updated?.description).toBe("Updated description");
  });

  it("should delete a sizing scenario", async () => {
    const created = await createSizingScenario(mockScenario);
    const deleted = await deleteSizingScenario(created.id, mockUserId);
    
    expect(deleted).toBe(true);
    
    const retrieved = await getSizingScenarioById(created.id, mockUserId);
    expect(retrieved).toBeUndefined();
  });

  it("should get multiple scenarios for comparison", async () => {
    const scenario1 = await createSizingScenario({
      ...mockScenario,
      name: "Scenario 1",
    });
    const scenario2 = await createSizingScenario({
      ...mockScenario,
      name: "Scenario 2",
    });
    
    const comparison = await getSizingScenariosForComparison(
      [scenario1.id, scenario2.id],
      mockUserId
    );
    
    expect(comparison.length).toBe(2);
    expect(comparison.map(s => s.id)).toContain(scenario1.id);
    expect(comparison.map(s => s.id)).toContain(scenario2.id);
  });

  it("should not retrieve scenarios from other users", async () => {
    const created = await createSizingScenario(mockScenario);
    const otherUserId = 999;
    
    const retrieved = await getSizingScenarioById(created.id, otherUserId);
    expect(retrieved).toBeUndefined();
  });
});
