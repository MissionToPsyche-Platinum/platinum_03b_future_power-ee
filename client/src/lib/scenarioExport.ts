/**
 * Scenario Export Utilities
 * 
 * Provides functions to export sizing and cost-benefit scenarios as JSON files
 */

interface SizingScenarioExport {
  id: number;
  name: string;
  description: string | null;
  notes: string | null;
  avgPower: number;
  peakPower: number;
  energyMargin: number;
  minSOC: number;
  eclipseDuration: number;
  missionDuration: number;
  maxMass: number;
  maxCost: number;
  concentrator: string;
  pvCell: string;
  battery: string;
  resultsJson: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface CostBenefitScenarioExport {
  id: number;
  name: string;
  description: string | null;
  notes: string | null;
  avgPower: number;
  peakPower: number;
  missionDuration: number;
  concentrator: string;
  pvCell: string;
  battery: string;
  resultsJson: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Export a single sizing scenario as JSON file
 */
export function exportSizingScenarioAsJSON(scenario: SizingScenarioExport) {
  const exportData = {
    type: "sizing_scenario",
    exportedAt: new Date().toISOString(),
    scenario: {
      ...scenario,
      results: JSON.parse(scenario.resultsJson),
    },
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sizing_scenario_${scenario.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export a single cost-benefit scenario as JSON file
 */
export function exportCostBenefitScenarioAsJSON(scenario: CostBenefitScenarioExport) {
  const exportData = {
    type: "cost_benefit_scenario",
    exportedAt: new Date().toISOString(),
    scenario: {
      ...scenario,
      results: JSON.parse(scenario.resultsJson),
    },
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cost_benefit_scenario_${scenario.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export multiple sizing scenarios as a single JSON file
 */
export function exportMultipleSizingScenariosAsJSON(scenarios: SizingScenarioExport[]) {
  const exportData = {
    type: "sizing_scenarios_batch",
    exportedAt: new Date().toISOString(),
    count: scenarios.length,
    scenarios: scenarios.map(scenario => ({
      ...scenario,
      results: JSON.parse(scenario.resultsJson),
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sizing_scenarios_batch_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export multiple cost-benefit scenarios as a single JSON file
 */
export function exportMultipleCostBenefitScenariosAsJSON(scenarios: CostBenefitScenarioExport[]) {
  const exportData = {
    type: "cost_benefit_scenarios_batch",
    exportedAt: new Date().toISOString(),
    count: scenarios.length,
    scenarios: scenarios.map(scenario => ({
      ...scenario,
      results: JSON.parse(scenario.resultsJson),
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cost_benefit_scenarios_batch_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
