/**
 * Cost-Benefit Radar Chart Component
 * 
 * Multi-dimensional visualization of cost-benefit scenario performance
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

interface CostBenefitScenario {
  id: number;
  name: string;
  resultsJson: string;
}

interface CostBenefitRadarChartProps {
  scenarios: CostBenefitScenario[];
}

const COLORS = [
  'rgba(168, 85, 247, 0.6)',   // purple
  'rgba(59, 130, 246, 0.6)',   // blue
  'rgba(34, 197, 94, 0.6)',    // green
  'rgba(239, 68, 68, 0.6)',    // red
  'rgba(251, 191, 36, 0.6)',   // yellow
];

const BORDER_COLORS = [
  'rgb(168, 85, 247)',
  'rgb(59, 130, 246)',
  'rgb(34, 197, 94)',
  'rgb(239, 68, 68)',
  'rgb(251, 191, 36)',
];

export function CostBenefitRadarChart({ scenarios }: CostBenefitRadarChartProps) {
  const datasets = scenarios.map((scenario, index) => {
    const analysis = JSON.parse(scenario.resultsJson);
    
    // Normalize values to 0-100 scale for radar chart
    const normalizedData = [
      analysis.performanceScore || 0, // Performance Score (already 0-100)
      Math.min(100, 100 - ((analysis.lifecycle?.totalLifecycle || 0) / 10000000) * 100), // Cost Efficiency (lower is better, inverted)
      Math.min(100, 100 - ((analysis.mass?.totalMass || 0) / 200) * 100), // Mass Efficiency (lower is better, inverted)
      Math.min(100, ((analysis.mass?.powerToMass || 0) / 10) * 100), // Power-to-Mass Ratio
      analysis.trlRisk?.overallRisk === 'Low' ? 100 : analysis.trlRisk?.overallRisk === 'Medium' ? 50 : 25, // TRL Maturity
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
      'Performance',
      'Cost Efficiency',
      'Mass Efficiency',
      'Power Density',
      'TRL Maturity',
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
