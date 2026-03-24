/**
 * Sizing Comparison Chart Component
 * 
 * Visualizes differences between sizing scenarios using bar charts
 */

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SizingScenario {
  id: number;
  name: string;
  resultsJson: string;
}

interface SizingComparisonChartProps {
  scenarios: SizingScenario[];
}

export function SizingComparisonChart({ scenarios }: SizingComparisonChartProps) {
  const labels = scenarios.map(s => s.name);
  
  const parsedData = scenarios.map(s => {
    const results = JSON.parse(s.resultsJson);
    return results.solution;
  });
  
  const massData = {
    labels,
    datasets: [
      {
        label: 'Total Mass (kg)',
        data: parsedData.map(d => d.totalMass),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };
  
  const costData = {
    labels,
    datasets: [
      {
        label: 'Total Cost ($M)',
        data: parsedData.map(d => d.totalCost / 1000000),
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 1,
      },
    ],
  };
  
  const energyMarginData = {
    labels,
    datasets: [
      {
        label: 'Energy Margin (%)',
        data: parsedData.map(d => d.energyMargin),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
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
    },
    scales: {
      y: {
        ticks: {
          color: '#e2e8f0',
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#e2e8f0',
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
    },
  };
  
  return (
    <div className="space-y-6">
      <div className="h-64">
        <Bar data={massData} options={{ ...options, plugins: { ...options.plugins, title: { display: true, text: 'Mass Comparison', color: '#e2e8f0' } } }} />
      </div>
      <div className="h-64">
        <Bar data={costData} options={{ ...options, plugins: { ...options.plugins, title: { display: true, text: 'Cost Comparison', color: '#e2e8f0' } } }} />
      </div>
      <div className="h-64">
        <Bar data={energyMarginData} options={{ ...options, plugins: { ...options.plugins, title: { display: true, text: 'Energy Margin Comparison', color: '#e2e8f0' } } }} />
      </div>
    </div>
  );
}
