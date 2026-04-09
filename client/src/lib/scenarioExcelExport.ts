import * as XLSX from 'xlsx';
import type { SizingScenarioLike as SizingScenario, CostBenefitScenarioLike as CostBenefitScenario } from "./scenarioTypes";

/**
 * Export sizing scenarios to CSV format
 */
export function exportSizingScenariosToCSV(scenarios: SizingScenario[]) {
  const rows = scenarios.map(scenario => {
    const parsed = JSON.parse(scenario.resultsJson);
    const results = parsed.solution || parsed;
    return {
      'Scenario Name': scenario.name,
      'Description': scenario.description || '',
      'Created': new Date(scenario.createdAt).toLocaleDateString(),
      'PV Cell': scenario.pvCell,
      'Battery': scenario.battery,
      'Concentrator': scenario.concentrator,
      'Average Power (W)': scenario.avgPower,
      'Peak Power (W)': scenario.peakPower,
      'Energy Margin Target (%)': scenario.energyMargin,
      'Min SOC (%)': scenario.minSOC,
      'Eclipse Duration (hrs)': (scenario.eclipseDuration / 100).toFixed(1),
      'Mission Duration (yrs)': scenario.missionDuration,
      'Max Mass (kg)': scenario.maxMass,
      'Max Cost ($)': scenario.maxCost,
      'PV Area (m²)': results.pvArea?.toFixed(2) || 'N/A',
      'Battery Capacity (Wh)': results.batteryCapacity?.toFixed(0) || 'N/A',
      'Total Mass (kg)': results.totalMass?.toFixed(2) || 'N/A',
      'Total Cost ($)': results.totalCost?.toFixed(0) || 'N/A',
      'Energy Margin (%)': results.energyMargin?.toFixed(1) || 'N/A',
      'SOC Margin (%)': results.socMargin?.toFixed(1) || 'N/A',
      'Feasible': results.feasible ? 'Yes' : 'No',
      'Notes': scenario.notes || ''
    };
  });

  const csv = convertToCSV(rows);
  downloadFile(csv, `sizing-scenarios-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

/**
 * Export cost-benefit scenarios to CSV format
 */
export function exportCostBenefitScenariosToCSV(scenarios: CostBenefitScenario[]) {
  const rows = scenarios.map(scenario => {
    const results = JSON.parse(scenario.resultsJson);
    const lifecycle = results.lifecycle || {};
    const mass = results.mass || {};
    return {
      'Scenario Name': scenario.name,
      'Description': scenario.description || '',
      'Created': new Date(scenario.createdAt).toLocaleDateString(),
      'PV Cell': scenario.pvCell,
      'Battery': scenario.battery,
      'Concentrator': scenario.concentrator,
      'Average Power (W)': scenario.avgPower,
      'Peak Power (W)': scenario.peakPower,
      'Mission Duration (yrs)': scenario.missionDuration,
      'Development Cost ($M)': lifecycle.developmentCost ? (lifecycle.developmentCost / 1000000).toFixed(2) : 'N/A',
      'Manufacturing Cost ($M)': lifecycle.manufacturingCost ? (lifecycle.manufacturingCost / 1000000).toFixed(2) : 'N/A',
      'Testing Cost ($M)': lifecycle.testingCost ? (lifecycle.testingCost / 1000000).toFixed(2) : 'N/A',
      'Integration Cost ($M)': lifecycle.integrationCost ? (lifecycle.integrationCost / 1000000).toFixed(2) : 'N/A',
      'Operations Cost ($M)': lifecycle.operationsCost ? (lifecycle.operationsCost / 1000000).toFixed(2) : 'N/A',
      'Total Cost ($M)': lifecycle.totalCost ? (lifecycle.totalCost / 1000000).toFixed(2) : 'N/A',
      'PV Mass (kg)': mass.pvMass?.toFixed(1) || 'N/A',
      'Battery Mass (kg)': mass.batteryMass?.toFixed(1) || 'N/A',
      'Structure Mass (kg)': mass.structureMass?.toFixed(1) || 'N/A',
      'Electronics Mass (kg)': mass.electronicsMass?.toFixed(1) || 'N/A',
      'Total Mass (kg)': mass.totalMass?.toFixed(1) || 'N/A',
      'Performance Score': results.performanceScore?.toFixed(0) || 'N/A',
      'Power Density (W/kg)': results.powerDensity?.toFixed(2) || 'N/A',
      'Cost per Watt ($/W)': results.costPerWatt?.toFixed(2) || 'N/A',
      'TRL Level': results.trlLevel,
      'Notes': scenario.notes || ''
    };
  });

  const csv = convertToCSV(rows);
  downloadFile(csv, `cost-benefit-scenarios-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

/**
 * Export sizing scenarios to Excel format
 */
export function exportSizingScenariosToExcel(scenarios: SizingScenario[]) {
  const workbook = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = scenarios.map(scenario => {
    const parsed = JSON.parse(scenario.resultsJson);
    const results = parsed.solution || parsed;
    return {
      'Scenario Name': scenario.name,
      'Created': new Date(scenario.createdAt).toLocaleDateString(),
      'PV Area (m²)': results.pvArea ? parseFloat(results.pvArea.toFixed(2)) : 0,
      'Battery (Wh)': results.batteryCapacity ? parseInt(results.batteryCapacity.toFixed(0)) : 0,
      'Total Mass (kg)': results.totalMass ? parseFloat(results.totalMass.toFixed(2)) : 0,
      'Total Cost ($)': results.totalCost ? parseInt(results.totalCost.toFixed(0)) : 0,
      'Energy Margin (%)': results.energyMargin ? parseFloat(results.energyMargin.toFixed(1)) : 0,
      'Feasible': results.feasible ? 'Yes' : 'No'
    };
  });
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  // Detailed sheet
  const detailedData = scenarios.map(scenario => {
    const parsed = JSON.parse(scenario.resultsJson);
    const results = parsed.solution || parsed;
    return {
      'Scenario Name': scenario.name,
      'Description': scenario.description || '',
      'Created': new Date(scenario.createdAt).toLocaleDateString(),
      'PV Cell': scenario.pvCell,
      'Battery': scenario.battery,
      'Concentrator': scenario.concentrator,
      'Avg Power (W)': scenario.avgPower,
      'Peak Power (W)': scenario.peakPower,
      'Energy Margin Target (%)': scenario.energyMargin,
      'Min SOC (%)': scenario.minSOC,
      'Eclipse Duration (hrs)': parseFloat((scenario.eclipseDuration / 100).toFixed(1)),
      'Mission Duration (yrs)': scenario.missionDuration,
      'Max Mass (kg)': scenario.maxMass,
      'Max Cost ($)': scenario.maxCost,
      'PV Area (m²)': results.pvArea ? parseFloat(results.pvArea.toFixed(2)) : 0,
      'Battery Capacity (Wh)': results.batteryCapacity ? parseInt(results.batteryCapacity.toFixed(0)) : 0,
      'Total Mass (kg)': results.totalMass ? parseFloat(results.totalMass.toFixed(2)) : 0,
      'Total Cost ($)': results.totalCost ? parseInt(results.totalCost.toFixed(0)) : 0,
      'Energy Margin (%)': results.energyMargin ? parseFloat(results.energyMargin.toFixed(1)) : 0,
      'SOC Margin (%)': results.socMargin ? parseFloat(results.socMargin.toFixed(1)) : 0,
      'Feasible': results.feasible ? 'Yes' : 'No',
      'Notes': scenario.notes || ''
    };
  });
  const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed');
  
  XLSX.writeFile(workbook, `sizing-scenarios-${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export cost-benefit scenarios to Excel format
 */
export function exportCostBenefitScenariosToExcel(scenarios: CostBenefitScenario[]) {
  const workbook = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = scenarios.map(scenario => {
    const results = JSON.parse(scenario.resultsJson);
    const lifecycle = results.lifecycle || {};
    const mass = results.mass || {};
    return {
      'Scenario Name': scenario.name,
      'Created': new Date(scenario.createdAt).toLocaleDateString(),
      'Total Cost ($M)': lifecycle.totalCost ? parseFloat((lifecycle.totalCost / 1000000).toFixed(2)) : 0,
      'Total Mass (kg)': mass.totalMass ? parseFloat(mass.totalMass.toFixed(1)) : 0,
      'Performance Score': results.performanceScore ? parseInt(results.performanceScore.toFixed(0)) : 0,
      'Power Density (W/kg)': results.powerDensity ? parseFloat(results.powerDensity.toFixed(2)) : 0,
      'Cost/Watt ($/W)': results.costPerWatt ? parseFloat(results.costPerWatt.toFixed(2)) : 0,
      'TRL': results.trlLevel
    };
  });
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  // Cost Breakdown sheet
  const costData = scenarios.map(scenario => {
    const results = JSON.parse(scenario.resultsJson);
    const lifecycle = results.lifecycle || {};
    return {
      'Scenario': scenario.name,
      'Development ($M)': lifecycle.developmentCost ? parseFloat((lifecycle.developmentCost / 1000000).toFixed(2)) : 0,
      'Manufacturing ($M)': lifecycle.manufacturingCost ? parseFloat((lifecycle.manufacturingCost / 1000000).toFixed(2)) : 0,
      'Testing ($M)': lifecycle.testingCost ? parseFloat((lifecycle.testingCost / 1000000).toFixed(2)) : 0,
      'Integration ($M)': lifecycle.integrationCost ? parseFloat((lifecycle.integrationCost / 1000000).toFixed(2)) : 0,
      'Operations ($M)': lifecycle.operationsCost ? parseFloat((lifecycle.operationsCost / 1000000).toFixed(2)) : 0,
      'Total ($M)': lifecycle.totalCost ? parseFloat((lifecycle.totalCost / 1000000).toFixed(2)) : 0
    };
  });
  const costSheet = XLSX.utils.json_to_sheet(costData);
  XLSX.utils.book_append_sheet(workbook, costSheet, 'Cost Breakdown');
  
  // Mass Budget sheet
  const massData = scenarios.map(scenario => {
    const results = JSON.parse(scenario.resultsJson);
    const mass = results.mass || {};
    return {
      'Scenario': scenario.name,
      'PV Mass (kg)': mass.pvMass ? parseFloat(mass.pvMass.toFixed(1)) : 0,
      'Battery Mass (kg)': mass.batteryMass ? parseFloat(mass.batteryMass.toFixed(1)) : 0,
      'Structure Mass (kg)': mass.structureMass ? parseFloat(mass.structureMass.toFixed(1)) : 0,
      'Electronics Mass (kg)': mass.electronicsMass ? parseFloat(mass.electronicsMass.toFixed(1)) : 0,
      'Total Mass (kg)': mass.totalMass ? parseFloat(mass.totalMass.toFixed(1)) : 0
    };
  });
  const massSheet = XLSX.utils.json_to_sheet(massData);
  XLSX.utils.book_append_sheet(workbook, massSheet, 'Mass Budget');
  
  // Detailed sheet
  const detailedData = scenarios.map(scenario => {
    const results = JSON.parse(scenario.resultsJson);
    const lifecycle = results.lifecycle || {};
    const mass = results.mass || {};
    return {
      'Scenario Name': scenario.name,
      'Description': scenario.description || '',
      'Created': new Date(scenario.createdAt).toLocaleDateString(),
      'PV Cell': scenario.pvCell,
      'Battery': scenario.battery,
      'Concentrator': scenario.concentrator,
      'Avg Power (W)': scenario.avgPower,
      'Peak Power (W)': scenario.peakPower,
      'Mission Duration (yrs)': scenario.missionDuration,
      'Total Cost ($M)': lifecycle.totalCost ? parseFloat((lifecycle.totalCost / 1000000).toFixed(2)) : 0,
      'Total Mass (kg)': mass.totalMass ? parseFloat(mass.totalMass.toFixed(1)) : 0,
      'Performance Score': results.performanceScore ? parseInt(results.performanceScore.toFixed(0)) : 0,
      'Power Density (W/kg)': results.powerDensity ? parseFloat(results.powerDensity.toFixed(2)) : 0,
      'Cost per Watt ($/W)': results.costPerWatt ? parseFloat(results.costPerWatt.toFixed(2)) : 0,
      'TRL Level': results.trlLevel,
      'Notes': scenario.notes || ''
    };
  });
  const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed');
  
  XLSX.writeFile(workbook, `cost-benefit-scenarios-${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Convert array of objects to CSV string
 */
function convertToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape values containing commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Download file to user's computer
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
