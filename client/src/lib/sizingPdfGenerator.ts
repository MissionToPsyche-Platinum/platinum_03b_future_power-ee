import jsPDF from "jspdf";

interface SizingResults {
  sizing: {
    concentrator_area_m2: number;
    pv_area_m2: number;
    battery_capacity_wh: number;
  };
  metrics: {
    total_mass_kg: number;
    total_cost_usd: number;
    energy_margin_percent: number;
    minimum_soc_percent: number;
  };
  sensitivity: {
    mass_margin_percent: number;
    cost_margin_percent: number;
    power_margin_percent: number;
  };
  feasible: boolean;
  recommendations: string[];
}

interface SizingInputs {
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

export async function generateSizingPDF(
  inputs: SizingInputs,
  results: SizingResults
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
  pdf.text("Component Sizing Report", pageWidth / 2, yPos, { align: "center" });
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
  const feasibleText = results.feasible
    ? "✓ FEASIBLE - Configuration meets all requirements"
    : "✗ NOT FEASIBLE - Configuration exceeds constraints";
  if (results.feasible) {
    pdf.setTextColor(0, 128, 0);
  } else {
    pdf.setTextColor(255, 0, 0);
  }
  pdf.setFont("helvetica", "bold");
  pdf.text(feasibleText, margin, yPos);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);
  yPos += 8;

  const summary = `This sizing analysis calculates the required component dimensions for a ${inputs.avgPower}W average power system at 2.9 AU from the Sun. The optimized configuration requires ${results.sizing.pv_area_m2.toFixed(2)} m² of PV array area and ${results.sizing.battery_capacity_wh.toFixed(0)} Wh of battery capacity, with a total system mass of ${results.metrics.total_mass_kg.toFixed(1)} kg and estimated cost of $${(results.metrics.total_cost_usd / 1e6).toFixed(2)}M.`;
  
  const summaryLines = pdf.splitTextToSize(summary, pageWidth - 2 * margin);
  pdf.text(summaryLines, margin, yPos);
  yPos += summaryLines.length * 5 + 10;

  checkPageBreak(60);

  // Mission Requirements with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("Mission Requirements", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  const requirements = [
    ["Average Power Load", `${inputs.avgPower} W`],
    ["Peak Power Load", `${inputs.peakPower} W`],
    ["Minimum Energy Margin", `${inputs.energyMargin}%`],
    ["Minimum Battery SOC", `${inputs.minSOC}%`],
    ["Maximum Eclipse Duration", `${inputs.eclipseDuration} hours`],
    ["Mission Duration", `${inputs.missionDuration} years`],
    ["Maximum Total Mass", `${inputs.maxMass} kg`],
    ["Maximum Total Cost", `$${(inputs.maxCost / 1e6).toFixed(2)}M`],
  ];

  const colWidths = [100, 60];
  const rowHeight = 6;
  
  requirements.forEach(([label, value], index) => {
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

  // Technology Selection with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("Technology Selection", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  pdf.text(`  • Solar Concentrator: ${inputs.concentrator}`, margin, yPos);
  yPos += 5;
  pdf.text(`  • PV Cell: ${inputs.pvCell}`, margin, yPos);
  yPos += 5;
  pdf.text(`  • Battery: ${inputs.battery}`, margin, yPos);
  yPos += 10;

  checkPageBreak(60);

  // Required Component Sizes with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("Required Component Sizes", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  const sizing = [
    ["Concentrator Area", `${results.sizing.concentrator_area_m2.toFixed(2)} m²`],
    ["PV Array Area", `${results.sizing.pv_area_m2.toFixed(2)} m²`],
    ["Battery Capacity", `${results.sizing.battery_capacity_wh.toFixed(0)} Wh`],
  ];

  sizing.forEach(([label, value], index) => {
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

  // System Metrics with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("System Metrics", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  const metrics = [
    ["Total Mass", `${results.metrics.total_mass_kg.toFixed(1)} kg`],
    ["Total Cost", `$${(results.metrics.total_cost_usd / 1e6).toFixed(2)}M`],
    ["Energy Margin", `${results.metrics.energy_margin_percent.toFixed(1)}%`],
    ["Minimum SOC", `${results.metrics.minimum_soc_percent.toFixed(1)}%`],
  ];

  metrics.forEach(([label, value], index) => {
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

  // Sensitivity Analysis with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("Sensitivity Analysis", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  const sensitivity = [
    ["Mass Margin", `${results.sensitivity.mass_margin_percent.toFixed(1)}%`],
    ["Cost Margin", `${results.sensitivity.cost_margin_percent.toFixed(1)}%`],
    ["Power Margin", `${results.sensitivity.power_margin_percent.toFixed(1)}%`],
  ];

  sensitivity.forEach(([label, value], index) => {
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

  checkPageBreak(40);

  // Recommendations with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("Recommendations", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  results.recommendations.forEach((rec) => {
    const lines = pdf.splitTextToSize(rec, pageWidth - 2 * margin);
    pdf.text(lines, margin, yPos);
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
