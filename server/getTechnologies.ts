import { TECHNOLOGY_DATABASE } from './technologyData';
import type { TechnologyDatabase, Concentrator, PVCell, Battery } from './types';

/**
 * Get all technologies from the embedded database
 * This replaces the file-based loading approach which fails in production
 * Transforms the data to match the expected interface types
 */
export async function getTechnologies(): Promise<TechnologyDatabase> {
  // Transform concentrators to match expected interface
  const concentrators: Concentrator[] = TECHNOLOGY_DATABASE.concentrators.map(c => ({
    name: c.name,
    concentration_ratio: c.concentration_ratio || 1,
    efficiency: c.optical_efficiency || 0.85,
    mass_per_m2: c.mass_per_m2 || 5.0,
    cost_per_m2: 1000, // Default cost
    trl: c.trl || 5,
    era: c.type_category
  }));

  // Transform PV cells to match expected interface
  const pv_cells: PVCell[] = TECHNOLOGY_DATABASE.pv_cells.map(p => ({
    name: p.name,
    efficiency: p.base_efficiency || 0.3,
    degradation_per_year: p.degradation_rate || 0.005,
    mass_per_m2: p.mass_per_m2 || 2.5,
    cost_per_m2: (p.cost_relative || 1.0) * 1000,
    temp_coefficient: p.temp_coefficient || -0.003,
    trl: p.trl || 5,
    era: p.type_category
  }));

  // Transform batteries to match expected interface
  const batteries: Battery[] = TECHNOLOGY_DATABASE.batteries.map(b => ({
    name: b.name,
    energy_density: b.energy_density || 150,
    cycle_life: b.cycle_life || 1000,
    charge_efficiency: b.charge_efficiency || 0.9,
    discharge_efficiency: b.discharge_efficiency || 0.9,
    self_discharge_rate: b.self_discharge_rate || 0.0001,
    mass_per_kwh: 1000 / (b.energy_density || 150), // Convert from Wh/kg to kg/kWh
    cost_per_kwh: (b.cost_relative || 1.0) * 500,
    trl: b.trl || 5,
    era: b.type_category
  }));

  return Promise.resolve({
    concentrators: [
      { name: 'None', concentration_ratio: 1, efficiency: 1, mass_per_m2: 0, cost_per_m2: 0, trl: 9, era: 'None' },
      ...concentrators
    ],
    pv_cells: [
      { name: 'None', efficiency: 0, degradation_per_year: 0, mass_per_m2: 0, cost_per_m2: 0, temp_coefficient: 0, trl: 9, era: 'None' },
      ...pv_cells
    ],
    batteries: [
      { name: 'None', energy_density: 0, cycle_life: 0, charge_efficiency: 1, discharge_efficiency: 1, self_discharge_rate: 0, mass_per_kwh: 0, cost_per_kwh: 0, trl: 9, era: 'None' },
      ...batteries
    ]
  });
}
