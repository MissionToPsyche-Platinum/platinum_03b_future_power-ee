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
  },
];
