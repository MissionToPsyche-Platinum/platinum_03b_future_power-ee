// Auto-generated technology database
// This file is generated from psyche_technology_database.py

export interface Technology {
  name: string;
  type_category: string;
  concentration_ratio?: number;
  optical_efficiency?: number;
  base_efficiency?: number;
  mass_per_m2?: number;
  complexity?: number;
  trl?: number;
  degradation_rate?: number;
  temp_coefficient?: number;
  energy_density?: number;
  power_density?: number;
  cycle_life?: number;
  charge_efficiency?: number;
  discharge_efficiency?: number;
  self_discharge_rate?: number;
  temp_range_min?: number;
  temp_range_max?: number;
  cost_relative?: number;
  description?: string;
}

export interface TechnologyDatabase {
  concentrators: Technology[];
  pv_cells: Technology[];
  batteries: Technology[];
}

export const TECHNOLOGY_DATABASE: TechnologyDatabase = {
  "concentrators": [
    {
      "name": "Simple Parabolic Mirror",
      "type_category": "Historical",
      "concentration_ratio": 5.0,
      "optical_efficiency": 0.65,
      "mass_per_m2": 8.0,
      "complexity": 2,
      "trl": 9,
      "description": "Early space mirror concentrators used on satellites"
    },
    {
      "name": "Flat Mirror Array",
      "type_category": "Historical",
      "concentration_ratio": 3.0,
      "optical_efficiency": 0.7,
      "mass_per_m2": 6.0,
      "complexity": 1,
      "trl": 9,
      "description": "Simple flat mirror arrays with basic tracking"
    },
    {
      "name": "Compound Parabolic Concentrator (CPC)",
      "type_category": "Current",
      "concentration_ratio": 10.0,
      "optical_efficiency": 0.82,
      "mass_per_m2": 5.5,
      "complexity": 3,
      "trl": 8,
      "description": "Non-imaging concentrator with wide acceptance angle"
    },
    {
      "name": "Fresnel Lens Concentrator",
      "type_category": "Current",
      "concentration_ratio": 15.0,
      "optical_efficiency": 0.85,
      "mass_per_m2": 4.0,
      "complexity": 3,
      "trl": 8,
      "description": "Lightweight refractive concentrator using Fresnel optics"
    },
    {
      "name": "Parabolic Dish Concentrator",
      "type_category": "Current",
      "concentration_ratio": 20.0,
      "optical_efficiency": 0.88,
      "mass_per_m2": 7.0,
      "complexity": 4,
      "trl": 9,
      "description": "High-efficiency parabolic dish with precision tracking"
    },
    {
      "name": "Linear Fresnel Reflector",
      "type_category": "Current",
      "concentration_ratio": 12.0,
      "optical_efficiency": 0.8,
      "mass_per_m2": 4.5,
      "complexity": 3,
      "trl": 8,
      "description": "Linear concentrator with segmented mirrors"
    },
    {
      "name": "Inflatable Concentrator",
      "type_category": "Theoretical",
      "concentration_ratio": 25.0,
      "optical_efficiency": 0.9,
      "mass_per_m2": 1.5,
      "complexity": 4,
      "trl": 5,
      "description": "Ultra-lightweight inflatable membrane concentrator"
    },
    {
      "name": "Metamaterial Concentrator",
      "type_category": "Theoretical",
      "concentration_ratio": 30.0,
      "optical_efficiency": 0.92,
      "mass_per_m2": 2.0,
      "complexity": 5,
      "trl": 3,
      "description": "Advanced metamaterial-based light concentration"
    },
    {
      "name": "Holographic Concentrator",
      "type_category": "Theoretical",
      "concentration_ratio": 22.0,
      "optical_efficiency": 0.89,
      "mass_per_m2": 1.8,
      "complexity": 4,
      "trl": 4,
      "description": "Holographic optical elements for lightweight concentration"
    }
  ],
  "pv_cells": [
    {
      "name": "Silicon Solar Cells (Early)",
      "type_category": "Historical",
      "base_efficiency": 0.1,
      "degradation_rate": 0.015,
      "temp_coefficient": -0.0045,
      "mass_per_m2": 3.0,
      "cost_relative": 0.3,
      "trl": 9,
      "description": "First generation silicon cells used in early space missions"
    },
    {
      "name": "GaAs Single Junction",
      "type_category": "Historical",
      "base_efficiency": 0.18,
      "degradation_rate": 0.01,
      "temp_coefficient": -0.0035,
      "mass_per_m2": 2.5,
      "cost_relative": 1.5,
      "trl": 9,
      "description": "Early Gallium Arsenide cells for space applications"
    },
    {
      "name": "Monocrystalline Silicon",
      "type_category": "Current",
      "base_efficiency": 0.22,
      "degradation_rate": 0.005,
      "temp_coefficient": -0.0038,
      "mass_per_m2": 2.8,
      "cost_relative": 0.8,
      "trl": 9,
      "description": "High-efficiency monocrystalline silicon cells"
    },
    {
      "name": "Multi-junction GaAs (2J)",
      "type_category": "Current",
      "base_efficiency": 0.28,
      "degradation_rate": 0.004,
      "temp_coefficient": -0.0028,
      "mass_per_m2": 2.2,
      "cost_relative": 3.0,
      "trl": 9,
      "description": "Dual-junction GaAs cells for space applications"
    },
    {
      "name": "Triple-junction GaAs (3J)",
      "type_category": "Current",
      "base_efficiency": 0.32,
      "degradation_rate": 0.003,
      "temp_coefficient": -0.0025,
      "mass_per_m2": 2.3,
      "cost_relative": 4.0,
      "trl": 9,
      "description": "State-of-art triple-junction cells (InGaP/GaAs/Ge)"
    },
    {
      "name": "CIGS Thin Film",
      "type_category": "Current",
      "base_efficiency": 0.2,
      "degradation_rate": 0.006,
      "temp_coefficient": -0.0032,
      "mass_per_m2": 1.5,
      "cost_relative": 1.2,
      "trl": 8,
      "description": "Copper Indium Gallium Selenide thin film cells"
    },
    {
      "name": "Perovskite Solar Cells",
      "type_category": "Current",
      "base_efficiency": 0.25,
      "degradation_rate": 0.008,
      "temp_coefficient": -0.003,
      "mass_per_m2": 1.2,
      "cost_relative": 0.6,
      "trl": 6,
      "description": "Emerging perovskite technology with high efficiency"
    },
    {
      "name": "Quad-junction (4J) Advanced",
      "type_category": "Theoretical",
      "base_efficiency": 0.38,
      "degradation_rate": 0.002,
      "temp_coefficient": -0.002,
      "mass_per_m2": 2.4,
      "cost_relative": 6.0,
      "trl": 5,
      "description": "Advanced four-junction cells with optimized bandgaps"
    },
    {
      "name": "Quantum Dot Solar Cells",
      "type_category": "Theoretical",
      "base_efficiency": 0.42,
      "degradation_rate": 0.002,
      "temp_coefficient": -0.0015,
      "mass_per_m2": 1.8,
      "cost_relative": 5.0,
      "trl": 4,
      "description": "Quantum dot enhanced multi-junction cells"
    },
    {
      "name": "Hot Carrier Solar Cells",
      "type_category": "Theoretical",
      "base_efficiency": 0.48,
      "degradation_rate": 0.001,
      "temp_coefficient": -0.001,
      "mass_per_m2": 2.0,
      "cost_relative": 8.0,
      "trl": 3,
      "description": "Theoretical hot carrier cells exceeding S-Q limit"
    },
    {
      "name": "Tandem Perovskite-Silicon",
      "type_category": "Theoretical",
      "base_efficiency": 0.35,
      "degradation_rate": 0.003,
      "temp_coefficient": -0.0022,
      "mass_per_m2": 1.6,
      "cost_relative": 2.5,
      "trl": 5,
      "description": "Hybrid perovskite-silicon tandem architecture"
    }
  ],
  "batteries": [
    {
      "name": "Nickel-Cadmium (NiCd)",
      "type_category": "Historical",
      "energy_density": 40.0,
      "power_density": 150.0,
      "cycle_life": 2000,
      "charge_efficiency": 0.85,
      "discharge_efficiency": 0.9,
      "self_discharge_rate": 0.001,
      "temp_range_min": 233.15,
      "temp_range_max": 333.15,
      "cost_relative": 0.5,
      "trl": 9,
      "description": "Classic NiCd batteries used in early spacecraft"
    },
    {
      "name": "Nickel-Hydrogen (NiH2)",
      "type_category": "Historical",
      "energy_density": 60.0,
      "power_density": 200.0,
      "cycle_life": 20000,
      "charge_efficiency": 0.88,
      "discharge_efficiency": 0.92,
      "self_discharge_rate": 0.0005,
      "temp_range_min": 253.15,
      "temp_range_max": 323.15,
      "cost_relative": 2.0,
      "trl": 9,
      "description": "Long-life NiH2 batteries for satellites and ISS"
    },
    {
      "name": "Silver-Zinc (AgZn)",
      "type_category": "Historical",
      "energy_density": 130.0,
      "power_density": 300.0,
      "cycle_life": 100,
      "charge_efficiency": 0.9,
      "discharge_efficiency": 0.95,
      "self_discharge_rate": 0.0015,
      "temp_range_min": 263.15,
      "temp_range_max": 323.15,
      "cost_relative": 5.0,
      "trl": 9,
      "description": "High energy density but limited cycle life"
    },
    {
      "name": "Lithium-ion (LiCoO2)",
      "type_category": "Current",
      "energy_density": 150.0,
      "power_density": 250.0,
      "cycle_life": 1000,
      "charge_efficiency": 0.92,
      "discharge_efficiency": 0.95,
      "self_discharge_rate": 0.0002,
      "temp_range_min": 253.15,
      "temp_range_max": 333.15,
      "cost_relative": 1.0,
      "trl": 9,
      "description": "Standard lithium-ion with cobalt oxide cathode"
    },
    {
      "name": "Lithium-ion (NMC)",
      "type_category": "Current",
      "energy_density": 180.0,
      "power_density": 280.0,
      "cycle_life": 2000,
      "charge_efficiency": 0.94,
      "discharge_efficiency": 0.96,
      "self_discharge_rate": 0.0001,
      "temp_range_min": 243.15,
      "temp_range_max": 333.15,
      "cost_relative": 1.2,
      "trl": 9,
      "description": "Nickel Manganese Cobalt cathode for improved performance"
    },
    {
      "name": "Lithium-ion (LFP)",
      "type_category": "Current",
      "energy_density": 120.0,
      "power_density": 220.0,
      "cycle_life": 5000,
      "charge_efficiency": 0.93,
      "discharge_efficiency": 0.95,
      "self_discharge_rate": 0.0001,
      "temp_range_min": 253.15,
      "temp_range_max": 343.15,
      "cost_relative": 0.8,
      "trl": 9,
      "description": "Lithium Iron Phosphate for safety and longevity"
    },
    {
      "name": "Lithium-Polymer",
      "type_category": "Current",
      "energy_density": 160.0,
      "power_density": 300.0,
      "cycle_life": 1500,
      "charge_efficiency": 0.93,
      "discharge_efficiency": 0.95,
      "self_discharge_rate": 0.0002,
      "temp_range_min": 253.15,
      "temp_range_max": 333.15,
      "cost_relative": 1.5,
      "trl": 8,
      "description": "Flexible polymer electrolyte lithium batteries"
    },
    {
      "name": "Solid-State Lithium",
      "type_category": "Theoretical",
      "energy_density": 400.0,
      "power_density": 500.0,
      "cycle_life": 10000,
      "charge_efficiency": 0.96,
      "discharge_efficiency": 0.98,
      "self_discharge_rate": 5e-05,
      "temp_range_min": 223.15,
      "temp_range_max": 353.15,
      "cost_relative": 3.0,
      "trl": 5,
      "description": "Solid electrolyte for high energy density and safety"
    },
    {
      "name": "Lithium-Sulfur",
      "type_category": "Theoretical",
      "energy_density": 500.0,
      "power_density": 400.0,
      "cycle_life": 3000,
      "charge_efficiency": 0.94,
      "discharge_efficiency": 0.96,
      "self_discharge_rate": 0.0001,
      "temp_range_min": 243.15,
      "temp_range_max": 333.15,
      "cost_relative": 1.5,
      "trl": 4,
      "description": "High theoretical energy density with sulfur cathode"
    },
    {
      "name": "Lithium-Air",
      "type_category": "Theoretical",
      "energy_density": 800.0,
      "power_density": 300.0,
      "cycle_life": 1000,
      "charge_efficiency": 0.9,
      "discharge_efficiency": 0.92,
      "self_discharge_rate": 0.0003,
      "temp_range_min": 263.15,
      "temp_range_max": 323.15,
      "cost_relative": 2.5,
      "trl": 3,
      "description": "Ultra-high energy density using atmospheric oxygen"
    },
    {
      "name": "Sodium-ion Advanced",
      "type_category": "Theoretical",
      "energy_density": 200.0,
      "power_density": 350.0,
      "cycle_life": 8000,
      "charge_efficiency": 0.95,
      "discharge_efficiency": 0.96,
      "self_discharge_rate": 0.0001,
      "temp_range_min": 233.15,
      "temp_range_max": 343.15,
      "cost_relative": 0.6,
      "trl": 6,
      "description": "Abundant sodium-based alternative to lithium"
    },
    {
      "name": "Aluminum-ion",
      "type_category": "Theoretical",
      "energy_density": 300.0,
      "power_density": 600.0,
      "cycle_life": 20000,
      "charge_efficiency": 0.96,
      "discharge_efficiency": 0.97,
      "self_discharge_rate": 5e-05,
      "temp_range_min": 243.15,
      "temp_range_max": 353.15,
      "cost_relative": 0.8,
      "trl": 4,
      "description": "Fast-charging aluminum-based batteries"
    }
  ]
};
