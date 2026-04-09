import jsPDF from "jspdf";
import type { SizingScenarioLike as SizingScenario, CostBenefitScenarioLike as CostBenefitScenario } from "./scenarioTypes";

const COLORS = {
  primary: "#1e3a8a",
  secondary: "#3b82f6",
  accent: "#60a5fa",
  text: "#1f2937",
  lightText: "#6b7280",
  border: "#e5e7eb",
};

function addHeader(doc: jsPDF, title: string) {
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, doc.internal.pageSize.width, 35, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, 15);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("16 Psyche Power System Simulator", 20, 25);
  doc.text(`Generated: ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 20, 25, { align: "right" });
}

function addFooter(doc: jsPDF, pageNum: number) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText);
  doc.text(
    `Page ${pageNum} | NASA/ASU 16 Psyche Mission`,
    doc.internal.pageSize.width / 2,
    pageHeight - 10,
    { align: "center" }
  );
}

export function generateBatchSizingComparisonPDF(scenarios: SizingScenario[]) {
  if (!scenarios || scenarios.length === 0) {
    throw new Error("No scenarios provided for PDF generation");
  }
  
  // Parse results from JSON
  const scenariosWithResults = scenarios.map(s => {
    try {
      if (!s.resultsJson) {
        throw new Error(`Scenario "${s.name}" has no results data`);
      }
      const parsed = JSON.parse(s.resultsJson);
      if (!parsed.solution) {
        throw new Error(`Scenario "${s.name}" has invalid results format`);
      }
      return {
        ...s,
        results: parsed.solution
      };
    } catch (error) {
      console.error(`Error parsing scenario "${s.name}":`, error);
      throw new Error(`Failed to parse results for scenario "${s.name}": ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
  
  const doc = new jsPDF();
  let yPos = 45;
  let pageNum = 1;
  
  addHeader(doc, "Component Sizing Batch Comparison");
  
  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Comparison Summary", 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Scenarios: ${scenarios.length}`, 20, yPos);
  yPos += 6;
  doc.text(`Comparison Date: ${new Date().toLocaleDateString()}`, 20, yPos);
  yPos += 15;
  
  // Comparison table
  doc.setFontSize(12);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Scenario Comparison Table", 20, yPos);
  yPos += 10;
  
  // Table headers
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(COLORS.secondary);
  doc.setTextColor(255, 255, 255);
  doc.rect(20, yPos - 5, 170, 8, "F");
  doc.text("Scenario", 22, yPos);
  doc.text("PV Area", 70, yPos);
  doc.text("Battery", 100, yPos);
  doc.text("Mass", 130, yPos);
  doc.text("Cost", 155, yPos);
  yPos += 10;
  
  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.text);
  
  scenariosWithResults.forEach((scenario, index) => {
    if (yPos > 270) {
      addFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      addHeader(doc, "Component Sizing Batch Comparison");
      yPos = 45;
    }
    
    const bgColor = index % 2 === 0 ? "#f9fafb" : "#ffffff";
    doc.setFillColor(bgColor);
    doc.rect(20, yPos - 5, 170, 8, "F");
    
    doc.text(scenario.name.substring(0, 20), 22, yPos);
    doc.text(`${scenario.results.pvArea?.toFixed(1) || 'N/A'} m²`, 70, yPos);
    doc.text(`${scenario.results.batteryCapacity ? (scenario.results.batteryCapacity / 1000).toFixed(1) : 'N/A'} kWh`, 100, yPos);
    doc.text(`${scenario.results.totalMass?.toFixed(1) || 'N/A'} kg`, 130, yPos);
    doc.text(`$${scenario.results.totalCost ? (scenario.results.totalCost / 1000).toFixed(0) : 'N/A'}k`, 155, yPos);
    yPos += 8;
  });
  
  yPos += 10;
  
  // Detailed scenario breakdowns
  scenariosWithResults.forEach((scenario, index) => {
    if (yPos > 240) {
      addFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      addHeader(doc, "Component Sizing Batch Comparison");
      yPos = 45;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(`Scenario ${index + 1}: ${scenario.name}`, 20, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setTextColor(COLORS.text);
    doc.setFont("helvetica", "normal");
    
    if (scenario.description) {
      doc.text(`Description: ${scenario.description}`, 20, yPos);
      yPos += 6;
    }
    
    // Configuration
    doc.setFont("helvetica", "bold");
    doc.text("Configuration:", 20, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Average Power: ${scenario.avgPower} W`, 25, yPos);
    yPos += 5;
    doc.text(`Peak Power: ${scenario.peakPower} W`, 25, yPos);
    yPos += 5;
    doc.text(`Eclipse Duration: ${(scenario.eclipseDuration / 100).toFixed(1)} hours`, 25, yPos);
    yPos += 5;
    doc.text(`Mission Duration: ${scenario.missionDuration} years`, 25, yPos);
    yPos += 5;
    doc.text(`Energy Margin Target: ${scenario.energyMargin}%`, 25, yPos);
    yPos += 5;
    doc.text(`Minimum SOC: ${scenario.minSOC}%`, 25, yPos);
    yPos += 8;
    
    // Technologies
    doc.setFont("helvetica", "bold");
    doc.text("Technologies:", 20, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`PV Cell: ${scenario.pvCell}`, 25, yPos);
    yPos += 5;
    doc.text(`Battery: ${scenario.battery}`, 25, yPos);
    yPos += 8;
    
    // Results
    doc.setFont("helvetica", "bold");
    doc.text("Results:", 20, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`PV Array Area: ${scenario.results.pvArea?.toFixed(2) || 'N/A'} m²`, 25, yPos);
    yPos += 5;
    doc.text(`Battery Capacity: ${scenario.results.batteryCapacity ? (scenario.results.batteryCapacity / 1000).toFixed(2) : 'N/A'} kWh`, 25, yPos);
    yPos += 5;
    doc.text(`Total Mass: ${scenario.results.totalMass?.toFixed(2) || 'N/A'} kg`, 25, yPos);
    yPos += 5;
    doc.text(`Total Cost: $${scenario.results.totalCost?.toLocaleString() || 'N/A'}`, 25, yPos);
    yPos += 5;
    doc.text(`Energy Margin: ${scenario.results.energyMargin?.toFixed(1) || 'N/A'}%`, 25, yPos);
    yPos += 5;
    doc.text(`SOC Margin: ${scenario.results.socMargin?.toFixed(1) || 'N/A'}%`, 25, yPos);
    yPos += 5;
    doc.text(`Feasibility: ${scenario.results.feasible ? "Yes" : "No"}`, 25, yPos);
    yPos += 10;
    
    if (scenario.notes) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(COLORS.lightText);
      const splitNotes = doc.splitTextToSize(`Notes: ${scenario.notes}`, 170);
      doc.text(splitNotes, 20, yPos);
      yPos += splitNotes.length * 5 + 5;
      doc.setTextColor(COLORS.text);
    }
    
    // Separator
    doc.setDrawColor(COLORS.border);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
  });
  
  addFooter(doc, pageNum);
  
  return doc;
}

export function generateBatchCostBenefitComparisonPDF(scenarios: CostBenefitScenario[]) {
  if (!scenarios || scenarios.length === 0) {
    throw new Error("No scenarios provided for PDF generation");
  }
  
  // Parse results from JSON
  const scenariosWithResults = scenarios.map(s => {
    try {
      if (!s.resultsJson) {
        throw new Error(`Scenario "${s.name}" has no results data`);
      }
      const parsed = JSON.parse(s.resultsJson);
      return {
        ...s,
        results: parsed
      };
    } catch (error) {
      console.error(`Error parsing scenario "${s.name}":`, error);
      throw new Error(`Failed to parse results for scenario "${s.name}": ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
  
  const doc = new jsPDF();
  let yPos = 45;
  let pageNum = 1;
  
  addHeader(doc, "Cost-Benefit Analysis Batch Comparison");
  
  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Comparison Summary", 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Scenarios: ${scenarios.length}`, 20, yPos);
  yPos += 6;
  doc.text(`Comparison Date: ${new Date().toLocaleDateString()}`, 20, yPos);
  yPos += 15;
  
  // Comparison table
  doc.setFontSize(12);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Scenario Comparison Table", 20, yPos);
  yPos += 10;
  
  // Table headers
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(COLORS.secondary);
  doc.setTextColor(255, 255, 255);
  doc.rect(20, yPos - 5, 170, 8, "F");
  doc.text("Scenario", 22, yPos);
  doc.text("Total Cost", 70, yPos);
  doc.text("Total Mass", 105, yPos);
  doc.text("Score", 140, yPos);
  doc.text("TRL", 165, yPos);
  yPos += 10;
  
  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.text);
  
  scenariosWithResults.forEach((scenario, index) => {
    if (yPos > 270) {
      addFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      addHeader(doc, "Cost-Benefit Analysis Batch Comparison");
      yPos = 45;
    }
    
    const bgColor = index % 2 === 0 ? "#f9fafb" : "#ffffff";
    doc.setFillColor(bgColor);
    doc.rect(20, yPos - 5, 170, 8, "F");
    
    doc.text(scenario.name.substring(0, 20), 22, yPos);
    doc.text(`$${scenario.results.lifecycle?.totalCost ? (scenario.results.lifecycle.totalCost / 1000000).toFixed(1) : 'N/A'}M`, 70, yPos);
    doc.text(`${scenario.results.mass?.totalMass?.toFixed(0) || 'N/A'} kg`, 105, yPos);
    doc.text(`${scenario.results.performanceScore?.toFixed(0) || 'N/A'}/100`, 140, yPos);
    doc.text(`${scenario.results.trlLevel}`, 165, yPos);
    yPos += 8;
  });
  
  yPos += 10;
  
  // Detailed scenario breakdowns
  scenariosWithResults.forEach((scenario, index) => {
    if (yPos > 220) {
      addFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      addHeader(doc, "Cost-Benefit Analysis Batch Comparison");
      yPos = 45;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(`Scenario ${index + 1}: ${scenario.name}`, 20, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setTextColor(COLORS.text);
    doc.setFont("helvetica", "normal");
    
    if (scenario.description) {
      doc.text(`Description: ${scenario.description}`, 20, yPos);
      yPos += 6;
    }
    
    // Configuration
    doc.setFont("helvetica", "bold");
    doc.text("Configuration:", 20, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`PV Cell: ${scenario.pvCell}`, 25, yPos);
    yPos += 5;
    doc.text(`Battery: ${scenario.battery}`, 25, yPos);
    yPos += 5;
    doc.text(`Mission Duration: ${scenario.missionDuration} years`, 25, yPos);
    yPos += 5;
    doc.text(`Average Power: ${scenario.avgPower} W`, 25, yPos);
    yPos += 5;
    doc.text(`Peak Power: ${scenario.peakPower} W`, 25, yPos);
    yPos += 8;
    
    // Lifecycle Cost
    doc.setFont("helvetica", "bold");
    doc.text("Lifecycle Cost Breakdown:", 20, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    const lifecycle = scenario.results.lifecycle || {};
    doc.text(`Development: $${lifecycle.developmentCost ? (lifecycle.developmentCost / 1000000).toFixed(2) : 'N/A'}M`, 25, yPos);
    yPos += 5;
    doc.text(`Manufacturing: $${lifecycle.manufacturingCost ? (lifecycle.manufacturingCost / 1000000).toFixed(2) : 'N/A'}M`, 25, yPos);
    yPos += 5;
    doc.text(`Testing: $${lifecycle.testingCost ? (lifecycle.testingCost / 1000000).toFixed(2) : 'N/A'}M`, 25, yPos);
    yPos += 5;
    doc.text(`Integration: $${lifecycle.integrationCost ? (lifecycle.integrationCost / 1000000).toFixed(2) : 'N/A'}M`, 25, yPos);
    yPos += 5;
    doc.text(`Operations: $${lifecycle.operationsCost ? (lifecycle.operationsCost / 1000000).toFixed(2) : 'N/A'}M`, 25, yPos);
    yPos += 5;
    doc.text(`Total: $${lifecycle.totalCost ? (lifecycle.totalCost / 1000000).toFixed(2) : 'N/A'}M`, 25, yPos);
    yPos += 8;
    
    // Mass Budget
    doc.setFont("helvetica", "bold");
    doc.text("Mass Budget:", 20, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    const mass = scenario.results.mass || {};
    doc.text(`PV Array: ${mass.pvMass?.toFixed(1) || 'N/A'} kg`, 25, yPos);
    yPos += 5;
    doc.text(`Battery: ${mass.batteryMass?.toFixed(1) || 'N/A'} kg`, 25, yPos);
    yPos += 5;
    doc.text(`Structure: ${mass.structureMass?.toFixed(1) || 'N/A'} kg`, 25, yPos);
    yPos += 5;
    doc.text(`Electronics: ${mass.electronicsMass?.toFixed(1) || 'N/A'} kg`, 25, yPos);
    yPos += 5;
    doc.text(`Total: ${mass.totalMass?.toFixed(1) || 'N/A'} kg`, 25, yPos);
    yPos += 8;
    
    // Performance
    doc.setFont("helvetica", "bold");
    doc.text("Performance Metrics:", 20, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Overall Score: ${scenario.results.performanceScore?.toFixed(0) || 'N/A'}/100`, 25, yPos);
    yPos += 5;
    doc.text(`Power Density: ${scenario.results.powerDensity?.toFixed(2) || 'N/A'} W/kg`, 25, yPos);
    yPos += 5;
    doc.text(`Cost per Watt: $${scenario.results.costPerWatt?.toFixed(2) || 'N/A'}/W`, 25, yPos);
    yPos += 5;
    doc.text(`TRL Level: ${scenario.results.trlLevel}`, 25, yPos);
    yPos += 10;
    
    if (scenario.notes) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(COLORS.lightText);
      const splitNotes = doc.splitTextToSize(`Notes: ${scenario.notes}`, 170);
      doc.text(splitNotes, 20, yPos);
      yPos += splitNotes.length * 5 + 5;
      doc.setTextColor(COLORS.text);
    }
    
    // Separator
    doc.setDrawColor(COLORS.border);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
  });
  
  addFooter(doc, pageNum);
  
  return doc;
}
