import jsPDF from "jspdf";

interface CostBenefitResults {
  lifecycle_costs: {
    development_cost_usd: number;
    component_cost_usd: number;
    testing_cost_usd: number;
    launch_cost_usd: number;
    total_lifecycle_cost_usd: number;
    cost_per_watt: number;
  };
  mass_budget: {
    pv_mass_kg: number;
    battery_mass_kg: number;
    structure_mass_kg: number;
    harness_mass_kg: number;
    contingency_mass_kg: number;
    total_mass_kg: number;
    power_to_mass_ratio: number;
  };
  trl_assessment: {
    concentrator_trl: number;
    pv_cell_trl: number;
    battery_trl: number;
    overall_risk_level: string;
    development_time_years: number;
    risk_score: number;
    risk_description: string;
  };
  performance_score: number;
  trade_offs: string[];
}

interface CostBenefitInputs {
  concentrator: string;
  pvCell: string;
  battery: string;
  concentratorArea: number;
  pvArea: number;
  batteryCapacity: number;
  avgPower: number;
  peakPower: number;
  energyMargin: number;
  missionDuration: number;
}

// Helper function to load image as base64
async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export async function generateCostBenefitPDF(
  inputs: CostBenefitInputs,
  results: CostBenefitResults
): Promise<Blob> {
  // ASU Colors
  const asuMaroon = [140, 29, 64]; // #8C1D40
  const asuGold = [255, 198, 39]; // #FFC627
  const nasaBlue = [11, 61, 145]; // #0B3D91

  // Load logos first before creating PDF
  let nasaLogoData: string | null = null;
  let asuLogoData: string | null = null;

  try {
    [nasaLogoData, asuLogoData] = await Promise.all([
      loadImageAsBase64("/logos/nasa-logo.png"),
      loadImageAsBase64("/logos/asu-ee-logo.png")
    ]);
  } catch (error) {
    console.warn("Failed to load logos:", error);
  }

  // Now create PDF after logos are loaded
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Header with logos and title
  if (nasaLogoData) {
    pdf.addImage(nasaLogoData, "PNG", margin, yPos, 20, 20);
  }
  
  if (asuLogoData) {
    // ASU logo on the right
    pdf.addImage(asuLogoData, "PNG", pageWidth - margin - 40, yPos, 40, 13);
  }

  yPos += 25;

  // Title with NASA blue color
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(nasaBlue[0], nasaBlue[1], nasaBlue[2]);
  pdf.text("16 Psyche Power System", pageWidth / 2, yPos, { align: "center" });
  yPos += 8;
  
  pdf.setFontSize(16);
  pdf.text("Cost-Benefit Analysis Report", pageWidth / 2, yPos, { align: "center" });
  yPos += 5;

  // Institutional affiliation
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text("Arizona State University | Ira A. Fulton Schools of Engineering", pageWidth / 2, yPos, { align: "center" });
  yPos += 4;
  pdf.text("School of Electrical, Computer and Energy Engineering", pageWidth / 2, yPos, { align: "center" });
  yPos += 4;
  pdf.text("NASA Psyche Mission Collaboration", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Decorative line with ASU maroon
  pdf.setDrawColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Executive Summary with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("Executive Summary", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  const summary = `This cost-benefit analysis evaluates a ${inputs.avgPower}W power system configuration for the 16 Psyche mission. The system achieves a performance score of ${results.performance_score.toFixed(1)}/100 with a total lifecycle cost of $${(results.lifecycle_costs.total_lifecycle_cost_usd / 1e6).toFixed(2)}M and a total mass of ${results.mass_budget.total_mass_kg.toFixed(1)} kg. The TRL assessment indicates ${results.trl_assessment.overall_risk_level.toLowerCase()} risk with ${results.trl_assessment.development_time_years.toFixed(1)} years to flight readiness.`;
  
  const summaryLines = pdf.splitTextToSize(summary, pageWidth - 2 * margin);
  pdf.text(summaryLines, margin, yPos);
  yPos += summaryLines.length * 5 + 10;

  checkPageBreak(60);

  // System Configuration with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("System Configuration", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  const config = [
    ["Solar Concentrator", inputs.concentrator],
    ["PV Cell", inputs.pvCell],
    ["Battery", inputs.battery],
    ["Concentrator Area", `${inputs.concentratorArea.toFixed(2)} m²`],
    ["PV Array Area", `${inputs.pvArea.toFixed(2)} m²`],
    ["Battery Capacity", `${inputs.batteryCapacity.toFixed(0)} Wh`],
    ["Average Power", `${inputs.avgPower} W`],
    ["Peak Power", `${inputs.peakPower} W`],
    ["Energy Margin", `${inputs.energyMargin}%`],
    ["Mission Duration", `${inputs.missionDuration} years`],
  ];

  const colWidths = [100, 60];
  const rowHeight = 6;
  
  config.forEach(([label, value], index) => {
    // Alternating row background
    if (index % 2 === 0) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin - 2, yPos - 4, pageWidth - 2 * margin + 4, rowHeight, 'F');
    }
    
    pdf.text(label, margin, yPos);
    pdf.setFont("helvetica", "bold");
    pdf.text(value, margin + colWidths[0], yPos);
    pdf.setFont("helvetica", "normal");
    yPos += rowHeight;
  });
  yPos += 10;

  checkPageBreak(60);

  // Lifecycle Costs with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("Lifecycle Costs", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  const costs = [
    ["Development", `$${(results.lifecycle_costs.development_cost_usd / 1e6).toFixed(2)}M`],
    ["Components", `$${(results.lifecycle_costs.component_cost_usd / 1e6).toFixed(2)}M`],
    ["Testing", `$${(results.lifecycle_costs.testing_cost_usd / 1e6).toFixed(2)}M`],
    ["Launch", `$${(results.lifecycle_costs.launch_cost_usd / 1e6).toFixed(2)}M`],
    ["Total Lifecycle Cost", `$${(results.lifecycle_costs.total_lifecycle_cost_usd / 1e6).toFixed(2)}M`],
    ["Cost per Watt", `$${(results.lifecycle_costs.cost_per_watt / 1000).toFixed(1)}k/W`],
  ];

  costs.forEach(([label, value], index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin - 2, yPos - 4, pageWidth - 2 * margin + 4, rowHeight, 'F');
    }
    
    pdf.text(label, margin, yPos);
    pdf.setFont("helvetica", "bold");
    pdf.text(value, margin + colWidths[0], yPos);
    pdf.setFont("helvetica", "normal");
    yPos += rowHeight;
  });
  yPos += 10;

  checkPageBreak(60);

  // Mass Budget with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("Mass Budget", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  const mass = [
    ["PV Array", `${results.mass_budget.pv_mass_kg.toFixed(1)} kg`],
    ["Battery", `${results.mass_budget.battery_mass_kg.toFixed(1)} kg`],
    ["Structure", `${results.mass_budget.structure_mass_kg.toFixed(1)} kg`],
    ["Harness", `${results.mass_budget.harness_mass_kg.toFixed(1)} kg`],
    ["Contingency", `${results.mass_budget.contingency_mass_kg.toFixed(1)} kg`],
    ["Total Mass", `${results.mass_budget.total_mass_kg.toFixed(1)} kg`],
    ["Power-to-Mass Ratio", `${results.mass_budget.power_to_mass_ratio.toFixed(2)} W/kg`],
  ];

  mass.forEach(([label, value], index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin - 2, yPos - 4, pageWidth - 2 * margin + 4, rowHeight, 'F');
    }
    
    pdf.text(label, margin, yPos);
    pdf.setFont("helvetica", "bold");
    pdf.text(value, margin + colWidths[0], yPos);
    pdf.setFont("helvetica", "normal");
    yPos += rowHeight;
  });
  yPos += 10;

  checkPageBreak(60);

  // TRL Risk Assessment with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("TRL Risk Assessment", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  const trl = [
    ["Concentrator TRL", `${results.trl_assessment.concentrator_trl}`],
    ["PV Cell TRL", `${results.trl_assessment.pv_cell_trl}`],
    ["Battery TRL", `${results.trl_assessment.battery_trl}`],
    ["Overall Risk Level", results.trl_assessment.overall_risk_level],
    ["Development Time", `${results.trl_assessment.development_time_years.toFixed(1)} years`],
    ["Risk Score", `${results.trl_assessment.risk_score}/100`],
  ];

  trl.forEach(([label, value], index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin - 2, yPos - 4, pageWidth - 2 * margin + 4, rowHeight, 'F');
    }
    
    pdf.text(label, margin, yPos);
    pdf.setFont("helvetica", "bold");
    pdf.text(value, margin + colWidths[0], yPos);
    pdf.setFont("helvetica", "normal");
    yPos += rowHeight;
  });
  yPos += 5;

  // Risk description
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(100, 100, 100);
  const riskLines = pdf.splitTextToSize(results.trl_assessment.risk_description, pageWidth - 2 * margin);
  pdf.text(riskLines, margin, yPos);
  yPos += riskLines.length * 5 + 10;

  checkPageBreak(40);

  // Key Trade-offs with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("Key Trade-offs", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  results.trade_offs.forEach((tradeoff) => {
    const lines = pdf.splitTextToSize(`• ${tradeoff}`, pageWidth - 2 * margin - 5);
    pdf.text(lines, margin + 5, yPos);
    yPos += lines.length * 5 + 2;
  });

  yPos += 10;

  // Footer with branding
  const footerY = pageHeight - 10;
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated on ${new Date().toLocaleString()}`, margin, footerY);
  pdf.text("16 Psyche Power System Simulator", pageWidth / 2, footerY, { align: "center" });
  pdf.text("ASU Engineering", pageWidth - margin, footerY, { align: "right" });

  // Return as blob
  return pdf.output("blob");
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
