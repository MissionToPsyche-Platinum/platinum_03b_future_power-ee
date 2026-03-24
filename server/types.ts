/**
 * Type definitions for power system technologies
 */

export interface Concentrator {
  name: string;
  concentration_ratio: number;
  efficiency: number;
  mass_per_m2: number;
  cost_per_m2: number;
  trl: number;
  era: string;
}

export interface PVCell {
  name: string;
  efficiency: number;
  degradation_per_year: number;
  mass_per_m2: number;
  cost_per_m2: number;
  temp_coefficient: number;
  trl: number;
  era: string;
}

export interface Battery {
  name: string;
  energy_density: number;
  cycle_life: number;
  charge_efficiency: number;
  discharge_efficiency: number;
  self_discharge_rate: number;
  mass_per_kwh: number;
  cost_per_kwh: number;
  trl: number;
  era: string;
}

export interface TechnologyDatabase {
  concentrators: Concentrator[];
  pv_cells: PVCell[];
  batteries: Battery[];
}
