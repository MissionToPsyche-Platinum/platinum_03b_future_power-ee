/**
 * Cost-Benefit Comparison Chart Component
 * 
 * Visualizes differences between cost-benefit scenarios using bar charts
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

interface CostBenefitScenario {
  id: number;
  name: string;
  resultsJson: string;
}

interface CostBenefitComparisonChartProps {
  scenarios: CostBenefitScenario[];
}

export function CostBenefitComparisonChart({ scenarios }: CostBenefitComparisonChartProps) {
  const labels = scenarios.map(s => s.name);
  
  const parsedData = scenarios.map(s => {
    const analysis = JSON.parse(s.resultsJson);
    return analysis;
  });
  
  const lifecycleCostData = {
    labels,
    datasets: [
      {
        label: 'Total Lifecycle Cost ($M)',
        data: parsedData.map(d => (d.lifecycle?.totalLifecycle || 0) / 1000000),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
    ],
  };
  
  const massData = {
    labels,
    datasets: [
      {
        label: 'Total Mass (kg)',
        data: parsedData.map(d => d.mass?.totalMass || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };
  
  const performanceData = {
    labels,
    datasets: [
      {
        label: 'Performance Score',
        data: parsedData.map(d => d.performanceScore || 0),
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
        <Bar data={lifecycleCostData} options={{ ...options, plugins: { ...options.plugins, title: { display: true, text: 'Lifecycle Cost Comparison', color: '#e2e8f0' } } }} />
      </div>
      <div className="h-64">
        <Bar data={massData} options={{ ...options, plugins: { ...options.plugins, title: { display: true, text: 'Mass Comparison', color: '#e2e8f0' } } }} />
      </div>
      <div className="h-64">
        <Bar data={performanceData} options={{ ...options, plugins: { ...options.plugins, title: { display: true, text: 'Performance Score Comparison', color: '#e2e8f0' } } }} />
      </div>
    </div>
  );
}
