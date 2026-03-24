import jsPDF from 'jspdf';

export interface OptimizationResult {
  bestSolution: {
    concentrator: string;
    pvCell: string;
    battery: string;
    fitness: number;
    energyMargin: number;
    mass: number;
    cost: number;
    minSoc: number;
    viable: boolean;
  };
  evolutionHistory: Array<{
    generation: number;
    bestFitness: number;
    avgFitness: number;
  }>;
  executionTime: number;
  config: {
    objective: string;
    constraints: {
      maxMass?: number;
      maxCost?: number;
      minPower?: number;
      minSoc?: number;
    };
    systemParams: {
      concentratorArea: number;
      pvArea: number;
      batteryCapacity: number;
      baseLoad: number;
      duration: number;
      years: number;
    };
    algorithmParams: {
      populationSize: number;
      generations: number;
      mutationRate: number;
      eliteSize: number;
    };
  };
}

/**
 * Export optimization results as JSON file
 */
export function exportAsJSON(result: OptimizationResult): void {
  const dataStr = JSON.stringify(result, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `psyche-optimization-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export optimization results as PDF
 */
export async function exportAsPDF(result: OptimizationResult): Promise<void> {
  const doc = new jsPDF();
  
  // Load logos
  const nasaLogo = await loadImage('/nasa-logo.png');
  const asuLogo = await loadImage('/asu-ee-logo.png');
  
  // Header with logos
  if (nasaLogo) {
    doc.addImage(nasaLogo, 'PNG', 15, 10, 25, 25);
  }
  if (asuLogo) {
    doc.addImage(asuLogo, 'PNG', 160, 10, 35, 25);
  }
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(11, 61, 145); // NASA blue
  doc.text('16 Psyche Power System', 105, 25, { align: 'center' });
  doc.text('Optimization Report', 105, 32, { align: 'center' });
  
  // Institutional info
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Arizona State University | Ira A. Fulton Schools of Engineering', 105, 40, { align: 'center' });
  doc.text('School of Electrical, Computer and Energy Engineering', 105, 45, { align: 'center' });
  doc.text('NASA Psyche Mission Collaboration', 105, 50, { align: 'center' });
  
  // Decorative line
  doc.setDrawColor(140, 29, 64); // ASU maroon
  doc.setLineWidth(0.5);
  doc.line(15, 55, 195, 55);
  
  let yPos = 65;
  
  // Executive Summary
  doc.setFontSize(14);
  doc.setTextColor(140, 29, 64); // ASU maroon
  doc.text('Executive Summary', 15, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Execution Time: ${result.executionTime.toFixed(2)}s`, 15, yPos);
  yPos += 6;
  doc.text(`Optimization Objective: ${result.config.objective}`, 15, yPos);
  yPos += 6;
  doc.text(`Generations: ${result.config.algorithmParams.generations}`, 15, yPos);
  yPos += 6;
  doc.text(`Population Size: ${result.config.algorithmParams.populationSize}`, 15, yPos);
  yPos += 10;
  
  // Best Solution
  doc.setFontSize(14);
  doc.setTextColor(140, 29, 64);
  doc.text('Best Solution Found', 15, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Solar Concentrator: ${result.bestSolution.concentrator}`, 15, yPos);
  yPos += 6;
  doc.text(`Photovoltaic Cell: ${result.bestSolution.pvCell}`, 15, yPos);
  yPos += 6;
  doc.text(`Battery System: ${result.bestSolution.battery}`, 15, yPos);
  yPos += 10;
  
  // Performance Metrics
  doc.setFontSize(12);
  doc.setTextColor(11, 61, 145); // NASA blue
  doc.text('Performance Metrics', 15, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const metrics = [
    ['Metric', 'Value'],
    ['Fitness Score', result.bestSolution.fitness.toFixed(2)],
    ['Energy Margin', `${result.bestSolution.energyMargin.toFixed(0)} Wh`],
    ['Total Mass', `${result.bestSolution.mass.toFixed(1)} kg`],
    ['Total Cost', `$${result.bestSolution.cost.toFixed(0)}`],
    ['Minimum SOC', `${result.bestSolution.minSoc.toFixed(1)}%`],
    ['Viable Solution', result.bestSolution.viable ? 'Yes' : 'No']
  ];
  
  // Draw table
  const tableStartY = yPos;
  const colWidths = [80, 80];
  const rowHeight = 7;
  
  metrics.forEach((row, i) => {
    const isHeader = i === 0;
    if (isHeader) {
      doc.setFillColor(240, 240, 240);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFillColor(i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250);
      doc.setFont('helvetica', 'normal');
    }
    
    doc.rect(15, yPos, colWidths[0], rowHeight, 'F');
    doc.rect(15 + colWidths[0], yPos, colWidths[1], rowHeight, 'F');
    
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, yPos, colWidths[0], rowHeight);
    doc.rect(15 + colWidths[0], yPos, colWidths[1], rowHeight);
    
    doc.setTextColor(0, 0, 0);
    doc.text(row[0], 20, yPos + 5);
    doc.text(row[1], 20 + colWidths[0], yPos + 5);
    
    yPos += rowHeight;
  });
  
  yPos += 10;
  
  // System Configuration
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(140, 29, 64);
  doc.text('System Configuration', 15, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Concentrator Area: ${result.config.systemParams.concentratorArea} m²`, 15, yPos);
  yPos += 6;
  doc.text(`PV Area: ${result.config.systemParams.pvArea} m²`, 15, yPos);
  yPos += 6;
  doc.text(`Battery Capacity: ${result.config.systemParams.batteryCapacity} Wh`, 15, yPos);
  yPos += 6;
  doc.text(`Base Load: ${result.config.systemParams.baseLoad} W`, 15, yPos);
  yPos += 6;
  doc.text(`Simulation Duration: ${result.config.systemParams.duration} hours`, 15, yPos);
  yPos += 6;
  doc.text(`Years in Operation: ${result.config.systemParams.years}`, 15, yPos);
  yPos += 10;
  
  // Constraints
  doc.setFontSize(14);
  doc.setTextColor(140, 29, 64);
  doc.text('Optimization Constraints', 15, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  if (result.config.constraints.maxMass) {
    doc.text(`Maximum Mass: ${result.config.constraints.maxMass} kg`, 15, yPos);
    yPos += 6;
  }
  if (result.config.constraints.maxCost) {
    doc.text(`Maximum Cost: $${result.config.constraints.maxCost}`, 15, yPos);
    yPos += 6;
  }
  if (result.config.constraints.minPower) {
    doc.text(`Minimum Power: ${result.config.constraints.minPower} W`, 15, yPos);
    yPos += 6;
  }
  if (result.config.constraints.minSoc) {
    doc.text(`Minimum Battery SOC: ${result.config.constraints.minSoc}%`, 15, yPos);
    yPos += 6;
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | 16 Psyche Power System Optimizer | ASU Engineering`,
      105,
      285,
      { align: 'center' }
    );
  }
  
  // Save PDF
  doc.save(`psyche-optimization-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Helper function to load an image
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
