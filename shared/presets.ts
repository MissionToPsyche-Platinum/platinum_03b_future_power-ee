/**
 * Configuration Presets for 16 Psyche Power System Simulator
 */

export interface ConfigurationPreset {
  id: string;
  name: string;
  description: string;
  era: 'Historical' | 'Current' | 'Theoretical';
  concentrator: string;
  pvCell: string;
  battery: string;
  parameters: {
    concentratorArea: number;
    pvArea: number;
    batteryCapacity: number;
    baseLoad: number;
    duration: number;
    years: number;
  };
  tooltip: {
    viability: string;
    missionTypes: string[];
    expectedPerformance: {
      energyBalance: string;
      minSOC: string;
      reliability: string;
    };
  };
}

export const CONFIGURATION_PRESETS: ConfigurationPreset[] = [
  {
    id: 'budget-mission',
    name: 'Budget Mission',
    description: 'Proven historical technologies with lower cost and established reliability. Suitable for cost-constrained missions.',
    era: 'Historical',
    concentrator: 'Simple Parabolic Mirror',
    pvCell: 'GaAs Single Junction',
    battery: 'Nickel-Hydrogen (NiH2)',
    parameters: {
      concentratorArea: 4,
      pvArea: 1.5,
      batteryCapacity: 10000,
      baseLoad: 100,
      duration: 48,
      years: 0,
    },
    tooltip: {
      viability: 'Viable for short-duration missions with moderate power requirements. Proven technology reduces development risk.',
      missionTypes: ['Discovery-class missions', 'Technology demonstrations', 'Short-duration flybys'],
      expectedPerformance: {
        energyBalance: '+15-20% surplus',
        minSOC: '35-40%',
        reliability: 'High (flight-proven since 1990s)',
      },
    },
  },
  {
    id: 'current-nasa-standard',
    name: 'Current NASA Standard',
    description: 'State-of-the-art technologies currently used in NASA missions. Balanced performance and reliability.',
    era: 'Current',
    concentrator: 'Fresnel Lens Concentrator',
    pvCell: 'Triple-junction GaAs (3J)',
    battery: 'Lithium-ion (NMC)',
    parameters: {
      concentratorArea: 3,
      pvArea: 1,
      batteryCapacity: 8000,
      baseLoad: 100,
      duration: 48,
      years: 0,
    },
    tooltip: {
      viability: 'Highly viable for most deep space missions. Represents current NASA best practices with proven performance.',
      missionTypes: ['Flagship missions', 'New Frontiers', 'Deep space orbiters'],
      expectedPerformance: {
        energyBalance: '+20-25% surplus',
        minSOC: '40-45%',
        reliability: 'Very High (current NASA standard)',
      },
    },
  },
  {
    id: 'future-capability',
    name: 'Future Capability',
    description: 'Advanced theoretical technologies offering maximum performance. Represents next-generation capabilities.',
    era: 'Theoretical',
    concentrator: 'Metamaterial Concentrator',
    pvCell: 'Quantum Dot Solar Cells',
    battery: 'Solid-State Lithium',
    parameters: {
      concentratorArea: 2,
      pvArea: 0.8,
      batteryCapacity: 6000,
      baseLoad: 100,
      duration: 48,
      years: 0,
    },
    tooltip: {
      viability: 'Theoretical viability pending technology maturation. Offers maximum efficiency but higher development risk.',
      missionTypes: ['Next-generation missions (2030+)', 'Technology validation', 'Advanced concepts'],
      expectedPerformance: {
        energyBalance: '+30-35% surplus (projected)',
        minSOC: '45-50% (projected)',
        reliability: 'Medium (TRL 3-5)',
      },
    },
  },
  {
    id: 'high-power-science',
    name: 'High-Power Science',
    description: 'Optimized for power-intensive scientific instruments. Uses large arrays and high-capacity batteries.',
    era: 'Current',
    concentrator: 'Parabolic Dish Concentrator',
    pvCell: 'Quad-junction (4J) Advanced',
    battery: 'Lithium-Sulfur',
    parameters: {
      concentratorArea: 5,
      pvArea: 2,
      batteryCapacity: 15000,
      baseLoad: 150,
      duration: 48,
      years: 0,
    },
    tooltip: {
      viability: 'Viable for missions with high continuous power demands. Oversized margins ensure reliability during peak loads.',
      missionTypes: ['Sample return missions', 'Radar mapping', 'High-power communications'],
      expectedPerformance: {
        energyBalance: '+25-30% surplus',
        minSOC: '50-55%',
        reliability: 'High (robust design margins)',
      },
    },
  },
  {
    id: 'long-duration-mission',
    name: 'Long Duration Mission',
    description: 'Designed for extended 10-year operations with emphasis on degradation resistance and cycle life.',
    era: 'Current',
    concentrator: 'Compound Parabolic Concentrator (CPC)',
    pvCell: 'Multi-junction GaAs (2J)',
    battery: 'Lithium-ion (LFP)',
    parameters: {
      concentratorArea: 3.5,
      pvArea: 1.2,
      batteryCapacity: 9000,
      baseLoad: 100,
      duration: 48,
      years: 10,
    },
    tooltip: {
      viability: 'Viable for decade-long missions with degradation factored in. LFP battery chemistry offers superior cycle life.',
      missionTypes: ['Long-duration orbiters', 'Extended science missions', 'Multi-target tours'],
      expectedPerformance: {
        energyBalance: '+12-18% surplus (after 10yr degradation)',
        minSOC: '30-35% (end of life)',
        reliability: 'Very High (degradation-resistant)',
      },
    },
  },
  {
    id: 'optimal-viable',
    name: 'Optimal Viable Mission',
    description: 'Perfect balance of performance, reliability, and viability. Guaranteed positive energy balance with healthy battery margins.',
    era: 'Current',
    concentrator: 'Fresnel Lens Concentrator',
    pvCell: 'Triple-junction GaAs (3J)',
    battery: 'Lithium-ion (NMC)',
    parameters: {
      concentratorArea: 11,
      pvArea: 10,
      batteryCapacity: 20000,
      baseLoad: 70,
      duration: 48,
      years: 5,
    },
    tooltip: {
      viability: 'Optimally viable with guaranteed success. Perfect balance of mass, cost, and performance for typical missions.',
      missionTypes: ['General deep space missions', 'Asteroid/comet orbiters', 'Outer planet missions'],
      expectedPerformance: {
        energyBalance: '+22-28% surplus',
        minSOC: '42-48%',
        reliability: 'Excellent (proven + margins)',
      },
    },
  },
];
