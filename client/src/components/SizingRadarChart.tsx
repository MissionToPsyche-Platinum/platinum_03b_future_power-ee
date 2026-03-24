/**
 * Sizing Radar Chart Component
 * 
 * Multi-dimensional visualization of sizing scenario performance
 */

import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface SizingScenario {
  id: number;
  name: string;
  resultsJson: string;
}

interface SizingRadarChartProps {
  scenarios: SizingScenario[];
}

const COLORS = [
  'rgba(59, 130, 246, 0.6)',   // blue
  'rgba(168, 85, 247, 0.6)',   // purple
  'rgba(34, 197, 94, 0.6)',    // green
  'rgba(239, 68, 68, 0.6)',    // red
  'rgba(251, 191, 36, 0.6)',   // yellow
];

const BORDER_COLORS = [
  'rgb(59, 130, 246)',
  'rgb(168, 85, 247)',
  'rgb(34, 197, 94)',
  'rgb(239, 68, 68)',
  'rgb(251, 191, 36)',
];

export function SizingRadarChart({ scenarios }: SizingRadarChartProps) {
  const datasets = scenarios.map((scenario, index) => {
    const results = JSON.parse(scenario.resultsJson);
    const solution = results.solution;
    
    // Normalize values to 0-100 scale for radar chart
    const normalizedData = [
      Math.min(100, (solution.energyMargin / 200) * 100), // Energy Margin (0-200% → 0-100)
      Math.min(100, ((100 - solution.minSoc) / 80) * 100), // SOC Margin (20-100% → 0-100)
      Math.min(100, 100 - (solution.totalMass / 100) * 100), // Mass Efficiency (lower is better, inverted)
      Math.min(100, 100 - (solution.totalCost / 100000) * 100), // Cost Efficiency (lower is better, inverted)
      solution.feasible ? 100 : 0, // Feasibility
    ];
    
    return {
      label: scenario.name,
      data: normalizedData,
      backgroundColor: COLORS[index % COLORS.length],
      borderColor: BORDER_COLORS[index % BORDER_COLORS.length],
      borderWidth: 2,
    };
  });
  
  const data = {
    labels: [
      'Energy Margin',
      'SOC Margin',
      'Mass Efficiency',
      'Cost Efficiency',
      'Feasibility',
    ],
    datasets,
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e2e8f0',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.r.toFixed(1);
            return `${label}: ${value}/100`;
          }
        }
      },
    },
    scales: {
      r: {
        angleLines: {
          color: 'rgba(148, 163, 184, 0.2)',
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.2)',
        },
        pointLabels: {
          color: '#e2e8f0',
          font: {
            size: 12,
          },
        },
        ticks: {
          color: '#e2e8f0',
          backdropColor: 'transparent',
        },
        min: 0,
        max: 100,
      },
    },
  };
  
  return (
    <div className="h-96">
      <Radar data={data} options={options} />
    </div>
  );
}
