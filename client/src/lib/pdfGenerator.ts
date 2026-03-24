import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface SimulationResults {
  metrics: {
    avg_power_generated: number;
    peak_power_generated: number;
    avg_power_consumed: number;
    min_soc: number;
    max_soc: number;
    final_soc: number;
    energy_balance: number;
    viable: boolean;
  };
  time_series: Array<{
    time_hours: number;
    power_generated_w: number;
    battery_soc: number;
  }>;
}

interface Configuration {
  concentrator: string;
  pvCell: string;
  battery: string;
  concentratorArea: number;
  pvArea: number;
  batteryCapacity: number;
  baseLoad: number;
  durationHours: number;
  yearsOperation: number;
}

interface TechnologyDetails {
  concentrator?: any;
  pvCell?: any;
  battery?: any;
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

export async function generatePDFReport(
  config: Configuration,
  results: SimulationResults,
  techDetails: TechnologyDetails
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
  pdf.text("Simulation Report", pageWidth / 2, yPos, { align: "center" });
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
  const viableText = results.metrics.viable
    ? "✓ VIABLE - System meets all operational requirements"
    : "✗ NOT VIABLE - System fails to meet operational requirements";
  if (results.metrics.viable) {
    pdf.setTextColor(0, 128, 0);
  } else {
    pdf.setTextColor(255, 0, 0);
  }
  pdf.setFont("helvetica", "bold");
  pdf.text(viableText, margin, yPos);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);
  yPos += 8;

  const summary = `This simulation evaluates a power system configuration for the 16 Psyche asteroid mission at 2.9 AU from the Sun. The system generates an average of ${results.metrics.avg_power_generated.toFixed(1)} W with a peak of ${results.metrics.peak_power_generated.toFixed(1)} W, maintaining battery state of charge above ${(results.metrics.min_soc * 100).toFixed(1)}% throughout the ${config.durationHours}-hour simulation period.`;
  
  const summaryLines = pdf.splitTextToSize(summary, pageWidth - 2 * margin);
  pdf.text(summaryLines, margin, yPos);
  yPos += summaryLines.length * 5 + 10;

  checkPageBreak(60);

  // Technology Specifications with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("Technology Specifications", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  // Solar Concentrator
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(nasaBlue[0], nasaBlue[1], nasaBlue[2]);
  pdf.text("Solar Concentrator:", margin, yPos);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);
  yPos += 5;
  pdf.text(`  • Type: ${config.concentrator}`, margin, yPos);
  yPos += 5;
  if (techDetails.concentrator && config.concentrator !== "None") {
    pdf.text(`  • Concentration Ratio: ${techDetails.concentrator.concentration_ratio}x`, margin, yPos);
    yPos += 5;
    pdf.text(`  • Optical Efficiency: ${(techDetails.concentrator.optical_efficiency * 100).toFixed(1)}%`, margin, yPos);
    yPos += 5;
  }
  yPos += 3;

  // PV Cell
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(nasaBlue[0], nasaBlue[1], nasaBlue[2]);
  pdf.text("Photovoltaic Cell:", margin, yPos);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);
  yPos += 5;
  pdf.text(`  • Type: ${config.pvCell}`, margin, yPos);
  yPos += 5;
  if (techDetails.pvCell) {
    pdf.text(`  • Efficiency: ${(techDetails.pvCell.efficiency * 100).toFixed(1)}%`, margin, yPos);
    yPos += 5;
    pdf.text(`  • Temperature Coefficient: ${techDetails.pvCell.temp_coefficient_per_k} /K`, margin, yPos);
    yPos += 5;
  }
  yPos += 3;

  // Battery
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(nasaBlue[0], nasaBlue[1], nasaBlue[2]);
  pdf.text("Battery System:", margin, yPos);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);
  yPos += 5;
  pdf.text(`  • Type: ${config.battery}`, margin, yPos);
  yPos += 5;
  if (techDetails.battery) {
    pdf.text(`  • Energy Density: ${techDetails.battery.energy_density} Wh/kg`, margin, yPos);
    yPos += 5;
    pdf.text(`  • Cycle Life: ${techDetails.battery.cycle_life?.toLocaleString()} cycles`, margin, yPos);
    yPos += 5;
  }
  yPos += 10;

  checkPageBreak(60);

  // System Parameters with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("System Parameters", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);
  const params = [
    `Concentrator Area: ${config.concentratorArea} m²`,
    `PV Array Area: ${config.pvArea} m²`,
    `Battery Capacity: ${config.batteryCapacity} Wh`,
    `Base Load: ${config.baseLoad} W`,
    `Simulation Duration: ${config.durationHours} hours`,
    `Years in Operation: ${config.yearsOperation} years`,
  ];

  params.forEach((param) => {
    pdf.text(`  • ${param}`, margin, yPos);
    yPos += 5;
  });
  yPos += 10;

  checkPageBreak(60);

  // Performance Metrics with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("Performance Metrics", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  // Create metrics table with alternating row colors
  const metrics = [
    ["Average Power Generated", `${results.metrics.avg_power_generated.toFixed(1)} W`],
    ["Peak Power Generated", `${results.metrics.peak_power_generated.toFixed(1)} W`],
    ["Average Power Consumed", `${results.metrics.avg_power_consumed.toFixed(1)} W`],
    ["Minimum Battery SOC", `${(results.metrics.min_soc * 100).toFixed(1)}%`],
    ["Final Battery SOC", `${(results.metrics.final_soc * 100).toFixed(1)}%`],
    ["Net Energy Balance", `${results.metrics.energy_balance.toFixed(0)} Wh`],
  ];

  const colWidths = [100, 60];
  const rowHeight = 6;
  
  metrics.forEach(([label, value], index) => {
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

  let recommendations: string[] = [];

  if (results.metrics.viable) {
    recommendations.push("✓ System configuration is viable for mission requirements.");
    
    if (results.metrics.min_soc > 0.6) {
      recommendations.push("✓ Battery maintains healthy SOC above 60% - excellent margin.");
    } else if (results.metrics.min_soc > 0.4) {
      recommendations.push("⚠ Battery SOC drops below 60% - consider increasing capacity.");
    }

    if (results.metrics.energy_balance > config.batteryCapacity) {
      recommendations.push("✓ Significant energy surplus - system is over-provisioned.");
      recommendations.push("  Consider reducing array size to save mass.");
    }
  } else {
    recommendations.push("✗ System configuration is NOT viable.");
    
    if (results.metrics.min_soc < 0.2) {
      recommendations.push("✗ Critical: Battery SOC drops below 20% - increase capacity or array size.");
    }
    
    if (results.metrics.energy_balance < 0) {
      recommendations.push("✗ Negative energy balance - insufficient power generation.");
      recommendations.push("  Increase concentrator/PV area or reduce base load.");
    }
  }

  recommendations.forEach((rec) => {
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
