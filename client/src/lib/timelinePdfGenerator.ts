import jsPDF from "jspdf";

interface TimelinePhase {
  phase: string;
  duration_years: number;
  avg_power_w: number;
  peak_power_w: number;
  energy_margin_percent: number;
  min_soc_percent: number;
  pv_degradation_percent: number;
  battery_degradation_percent: number;
  viable: boolean;
}

interface TimelineResults {
  phases: TimelinePhase[];
  overall_metrics: {
    total_duration_years: number;
    final_pv_efficiency_percent: number;
    final_battery_capacity_percent: number;
    mission_viable: boolean;
    critical_phases: string[];
  };
}

interface TimelineInputs {
  concentrator: string;
  pvCell: string;
  battery: string;
  concentratorArea: number;
  pvArea: number;
  batteryCapacity: number;
  baseLoad: number;
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

export async function generateTimelinePDF(
  inputs: TimelineInputs,
  results: TimelineResults
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
  pdf.text("Mission Timeline Report", pageWidth / 2, yPos, { align: "center" });
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
  const viableText = results.overall_metrics.mission_viable
    ? "✓ VIABLE - Mission completes successfully across all phases"
    : "✗ NOT VIABLE - Mission fails in one or more phases";
  if (results.overall_metrics.mission_viable) {
    pdf.setTextColor(0, 128, 0);
  } else {
    pdf.setTextColor(255, 0, 0);
  }
  pdf.setFont("helvetica", "bold");
  pdf.text(viableText, margin, yPos);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);
  yPos += 8;

  const summary = `This timeline analysis simulates a ${results.overall_metrics.total_duration_years}-year mission across ${results.phases.length} distinct phases. The system experiences environmental degradation, reducing PV efficiency to ${results.overall_metrics.final_pv_efficiency_percent.toFixed(1)}% and battery capacity to ${results.overall_metrics.final_battery_capacity_percent.toFixed(1)}% by mission end. ${results.overall_metrics.critical_phases.length > 0 ? `Critical phases requiring attention: ${results.overall_metrics.critical_phases.join(', ')}.` : 'All phases maintain adequate performance margins.'}`;
  
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
    ["Base Load", `${inputs.baseLoad} W`],
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

  // Mission Phases with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("Mission Phases", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  // Render each phase
  results.phases.forEach((phase, index) => {
    checkPageBreak(50);

    // Phase header
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(nasaBlue[0], nasaBlue[1], nasaBlue[2]);
    pdf.text(`Phase ${index + 1}: ${phase.phase}`, margin, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    yPos += 6;

    // Phase status
    if (phase.viable) {
      pdf.setTextColor(0, 128, 0);
      pdf.text("✓ Viable", margin + 5, yPos);
    } else {
      pdf.setTextColor(255, 0, 0);
      pdf.text("✗ Not Viable", margin + 5, yPos);
    }
    pdf.setTextColor(0, 0, 0);
    yPos += 6;

    // Phase metrics
    const phaseMetrics = [
      ["Duration", `${phase.duration_years.toFixed(1)} years`],
      ["Avg Power", `${phase.avg_power_w.toFixed(1)} W`],
      ["Peak Power", `${phase.peak_power_w.toFixed(1)} W`],
      ["Energy Margin", `${phase.energy_margin_percent.toFixed(1)}%`],
      ["Min SOC", `${phase.min_soc_percent.toFixed(1)}%`],
      ["PV Degradation", `${phase.pv_degradation_percent.toFixed(1)}%`],
      ["Battery Degradation", `${phase.battery_degradation_percent.toFixed(1)}%`],
    ];

    phaseMetrics.forEach(([label, value]) => {
      pdf.text(`  ${label}: ${value}`, margin + 5, yPos);
      yPos += 5;
    });
    yPos += 5;
  });

  checkPageBreak(60);

  // Overall Degradation Summary with ASU maroon header
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(asuMaroon[0], asuMaroon[1], asuMaroon[2]);
  pdf.text("Degradation Summary", margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  const degradation = [
    ["Final PV Efficiency", `${results.overall_metrics.final_pv_efficiency_percent.toFixed(1)}%`],
    ["Final Battery Capacity", `${results.overall_metrics.final_battery_capacity_percent.toFixed(1)}%`],
    ["Total Mission Duration", `${results.overall_metrics.total_duration_years.toFixed(1)} years`],
  ];

  degradation.forEach(([label, value], index) => {
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
