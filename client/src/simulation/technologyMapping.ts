/**
 * Utility functions for mapping between technology IDs and names
 */

// Technology ID to name mappings
export const CONCENTRATOR_MAP: Record<string, string> = {
  "none": "None",
  "simple_parabolic": "Simple Parabolic Mirror",
  "flat_mirror": "Flat Mirror Array",
  "cpc": "Compound Parabolic Concentrator (CPC)",
  "fresnel_lens": "Fresnel Lens Concentrator",
  "parabolic_dish": "Parabolic Dish Concentrator",
  "linear_fresnel": "Linear Fresnel Reflector",
  "inflatable": "Inflatable Concentrator",
  "metamaterial": "Metamaterial Concentrator",
};

export const PV_CELL_MAP: Record<string, string> = {
  "none": "None",
  "silicon_early": "Silicon Solar Cells (Early)",
  "gaas_single": "GaAs Single Junction",
  "silicon_mono": "Monocrystalline Silicon",
  "gaas_dual": "Multi-junction GaAs (2J)",
  "gaas_triple": "Triple-junction GaAs (3J)",
  "cigs": "CIGS Thin Film",
  "perovskite": "Perovskite Solar Cells",
  "gaas_quad": "Quad-junction (4J) Advanced",
  "quantum_dot": "Quantum Dot Solar Cells",
  "hot_carrier": "Hot Carrier Solar Cells",
  "tandem_perovskite": "Tandem Perovskite-Silicon",
};

export const BATTERY_MAP: Record<string, string> = {
  "none": "None",
  "nicd": "Nickel-Cadmium (NiCd)",
  "nih2": "Nickel-Hydrogen (NiH2)",
  "agzn": "Silver-Zinc (AgZn)",
  "liion_licoo2": "Lithium-ion (LiCoO2)",
  "liion_nmc": "Lithium-ion (NMC)",
  "liion_lfp": "Lithium-ion (LFP)",
  "liion_polymer": "Lithium-Polymer",
  "solid_state": "Solid-State Lithium",
  "lisulfur": "Lithium-Sulfur",
  "liair": "Lithium-Air",
  "sodium_ion": "Sodium-ion Advanced",
  "aluminum_ion": "Aluminum-ion",
};

/**
 * Convert technology ID to name
 */
export function idToName(id: string, type: "concentrator" | "pv_cell" | "battery"): string {
  const maps = {
    concentrator: CONCENTRATOR_MAP,
    pv_cell: PV_CELL_MAP,
    battery: BATTERY_MAP,
  };
  
  return maps[type][id] || "None";
}

/**
 * Convert technology name to ID
 */
export function nameToId(name: string, type: "concentrator" | "pv_cell" | "battery"): string {
  const maps = {
    concentrator: CONCENTRATOR_MAP,
    pv_cell: PV_CELL_MAP,
    battery: BATTERY_MAP,
  };
  
  const map = maps[type];
  const entry = Object.entries(map).find(([_, n]) => n === name);
  return entry ? entry[0] : "none";
}
