"""
16 Psyche Power System - Technology Database

This module contains comprehensive technology options for:
- Solar concentrators (parabolic, Fresnel, compound parabolic, etc.)
- Photovoltaic cells (historical to theoretical)
- Battery systems (various chemistries and generations)

Each technology is characterized by performance parameters based on
historical data, current capabilities, and projected future developments.

Author: Manus AI
Date: November 2025
"""

from dataclasses import dataclass
from typing import Dict, List
import json


# =============================================================================
# SOLAR CONCENTRATOR TECHNOLOGIES
# =============================================================================

@dataclass
class ConcentratorTechnology:
    """
    Defines a solar concentrator technology with its characteristics.
    
    Attributes:
        name: Technology name
        type_category: Historical, Current, or Theoretical
        concentration_ratio: Factor by which solar flux is concentrated
        optical_efficiency: Fraction of light successfully concentrated
        mass_per_m2: Specific mass in kg/m²
        complexity: Deployment complexity (1=simple, 5=complex)
        trl: Technology Readiness Level (1-9)
        description: Brief description of the technology
    """
    name: str
    type_category: str  # "Historical", "Current", "Theoretical"
    concentration_ratio: float
    optical_efficiency: float
    mass_per_m2: float  # kg/m²
    complexity: int  # 1-5 scale
    trl: int  # Technology Readiness Level 1-9
    description: str


# Historical concentrator technologies (1960s-1990s)
CONCENTRATOR_HISTORICAL = [
    ConcentratorTechnology(
        name="Simple Parabolic Mirror",
        type_category="Historical",
        concentration_ratio=5.0,
        optical_efficiency=0.65,
        mass_per_m2=8.0,
        complexity=2,
        trl=9,
        description="Early space mirror concentrators used on satellites"
    ),
    ConcentratorTechnology(
        name="Flat Mirror Array",
        type_category="Historical",
        concentration_ratio=3.0,
        optical_efficiency=0.70,
        mass_per_m2=6.0,
        complexity=1,
        trl=9,
        description="Simple flat mirror arrays with basic tracking"
    ),
]

# Current concentrator technologies (2000s-2020s)
CONCENTRATOR_CURRENT = [
    ConcentratorTechnology(
        name="Compound Parabolic Concentrator (CPC)",
        type_category="Current",
        concentration_ratio=10.0,
        optical_efficiency=0.82,
        mass_per_m2=5.5,
        complexity=3,
        trl=8,
        description="Non-imaging concentrator with wide acceptance angle"
    ),
    ConcentratorTechnology(
        name="Fresnel Lens Concentrator",
        type_category="Current",
        concentration_ratio=15.0,
        optical_efficiency=0.85,
        mass_per_m2=4.0,
        complexity=3,
        trl=8,
        description="Lightweight refractive concentrator using Fresnel optics"
    ),
    ConcentratorTechnology(
        name="Parabolic Dish Concentrator",
        type_category="Current",
        concentration_ratio=20.0,
        optical_efficiency=0.88,
        mass_per_m2=7.0,
        complexity=4,
        trl=9,
        description="High-efficiency parabolic dish with precision tracking"
    ),
    ConcentratorTechnology(
        name="Linear Fresnel Reflector",
        type_category="Current",
        concentration_ratio=12.0,
        optical_efficiency=0.80,
        mass_per_m2=4.5,
        complexity=3,
        trl=8,
        description="Linear concentrator with segmented mirrors"
    ),
]

# Theoretical/Future concentrator technologies (2030s+)
CONCENTRATOR_THEORETICAL = [
    ConcentratorTechnology(
        name="Inflatable Concentrator",
        type_category="Theoretical",
        concentration_ratio=25.0,
        optical_efficiency=0.90,
        mass_per_m2=1.5,
        complexity=4,
        trl=5,
        description="Ultra-lightweight inflatable membrane concentrator"
    ),
    ConcentratorTechnology(
        name="Metamaterial Concentrator",
        type_category="Theoretical",
        concentration_ratio=30.0,
        optical_efficiency=0.92,
        mass_per_m2=2.0,
        complexity=5,
        trl=3,
        description="Advanced metamaterial-based light concentration"
    ),
    ConcentratorTechnology(
        name="Holographic Concentrator",
        type_category="Theoretical",
        concentration_ratio=22.0,
        optical_efficiency=0.89,
        mass_per_m2=1.8,
        complexity=4,
        trl=4,
        description="Holographic optical elements for lightweight concentration"
    ),
]


# =============================================================================
# PHOTOVOLTAIC CELL TECHNOLOGIES
# =============================================================================

@dataclass
class PVTechnology:
    """
    Defines a photovoltaic cell technology with its characteristics.
    
    Attributes:
        name: Technology name
        type_category: Historical, Current, or Theoretical
        base_efficiency: Conversion efficiency at standard conditions
        temp_coefficient: Efficiency change per Kelvin
        degradation_rate: Annual performance degradation
        mass_per_m2: Specific mass in kg/m²
        cost_relative: Relative cost (1.0 = baseline)
        trl: Technology Readiness Level (1-9)
        description: Brief description of the technology
    """
    name: str
    type_category: str
    base_efficiency: float
    temp_coefficient: float  # per K
    degradation_rate: float  # per year
    mass_per_m2: float  # kg/m²
    cost_relative: float
    trl: int
    description: str


# Historical PV technologies (1960s-1990s)
PV_HISTORICAL = [
    PVTechnology(
        name="Silicon Solar Cells (Early)",
        type_category="Historical",
        base_efficiency=0.10,
        temp_coefficient=-0.0045,
        degradation_rate=0.015,
        mass_per_m2=3.0,
        cost_relative=0.3,
        trl=9,
        description="First generation silicon cells used in early space missions"
    ),
    PVTechnology(
        name="GaAs Single Junction",
        type_category="Historical",
        base_efficiency=0.18,
        temp_coefficient=-0.0035,
        degradation_rate=0.010,
        mass_per_m2=2.5,
        cost_relative=1.5,
        trl=9,
        description="Early Gallium Arsenide cells for space applications"
    ),
]

# Current PV technologies (2000s-2020s)
PV_CURRENT = [
    PVTechnology(
        name="Monocrystalline Silicon",
        type_category="Current",
        base_efficiency=0.22,
        temp_coefficient=-0.0038,
        degradation_rate=0.005,
        mass_per_m2=2.8,
        cost_relative=0.8,
        trl=9,
        description="High-efficiency monocrystalline silicon cells"
    ),
    PVTechnology(
        name="Multi-junction GaAs (2J)",
        type_category="Current",
        base_efficiency=0.28,
        temp_coefficient=-0.0028,
        degradation_rate=0.004,
        mass_per_m2=2.2,
        cost_relative=3.0,
        trl=9,
        description="Dual-junction GaAs cells for space applications"
    ),
    PVTechnology(
        name="Triple-junction GaAs (3J)",
        type_category="Current",
        base_efficiency=0.32,
        temp_coefficient=-0.0025,
        degradation_rate=0.003,
        mass_per_m2=2.3,
        cost_relative=4.0,
        trl=9,
        description="State-of-art triple-junction cells (InGaP/GaAs/Ge)"
    ),
    PVTechnology(
        name="CIGS Thin Film",
        type_category="Current",
        base_efficiency=0.20,
        temp_coefficient=-0.0032,
        degradation_rate=0.006,
        mass_per_m2=1.5,
        cost_relative=1.2,
        trl=8,
        description="Copper Indium Gallium Selenide thin film cells"
    ),
    PVTechnology(
        name="Perovskite Solar Cells",
        type_category="Current",
        base_efficiency=0.25,
        temp_coefficient=-0.0030,
        degradation_rate=0.008,
        mass_per_m2=1.2,
        cost_relative=0.6,
        trl=6,
        description="Emerging perovskite technology with high efficiency"
    ),
]

# Theoretical/Future PV technologies (2030s+)
PV_THEORETICAL = [
    PVTechnology(
        name="Quad-junction (4J) Advanced",
        type_category="Theoretical",
        base_efficiency=0.38,
        temp_coefficient=-0.0020,
        degradation_rate=0.002,
        mass_per_m2=2.4,
        cost_relative=6.0,
        trl=5,
        description="Advanced four-junction cells with optimized bandgaps"
    ),
    PVTechnology(
        name="Quantum Dot Solar Cells",
        type_category="Theoretical",
        base_efficiency=0.42,
        temp_coefficient=-0.0015,
        degradation_rate=0.002,
        mass_per_m2=1.8,
        cost_relative=5.0,
        trl=4,
        description="Quantum dot enhanced multi-junction cells"
    ),
    PVTechnology(
        name="Hot Carrier Solar Cells",
        type_category="Theoretical",
        base_efficiency=0.48,
        temp_coefficient=-0.0010,
        degradation_rate=0.001,
        mass_per_m2=2.0,
        cost_relative=8.0,
        trl=3,
        description="Theoretical hot carrier cells exceeding S-Q limit"
    ),
    PVTechnology(
        name="Tandem Perovskite-Silicon",
        type_category="Theoretical",
        base_efficiency=0.35,
        temp_coefficient=-0.0022,
        degradation_rate=0.003,
        mass_per_m2=1.6,
        cost_relative=2.5,
        trl=5,
        description="Hybrid perovskite-silicon tandem architecture"
    ),
]


# =============================================================================
# BATTERY TECHNOLOGIES
# =============================================================================

@dataclass
class BatteryTechnology:
    """
    Defines a battery technology with its characteristics.
    
    Attributes:
        name: Technology name
        type_category: Historical, Current, or Theoretical
        energy_density: Specific energy in Wh/kg
        power_density: Specific power in W/kg
        cycle_life: Number of charge/discharge cycles
        charge_efficiency: Charging efficiency
        discharge_efficiency: Discharging efficiency
        self_discharge_rate: Self-discharge per hour
        temp_range_min: Minimum operating temperature (K)
        temp_range_max: Maximum operating temperature (K)
        cost_relative: Relative cost (1.0 = baseline)
        trl: Technology Readiness Level (1-9)
        description: Brief description of the technology
    """
    name: str
    type_category: str
    energy_density: float  # Wh/kg
    power_density: float  # W/kg
    cycle_life: int
    charge_efficiency: float
    discharge_efficiency: float
    self_discharge_rate: float  # per hour
    temp_range_min: float  # K
    temp_range_max: float  # K
    cost_relative: float
    trl: int
    description: str


# Historical battery technologies (1960s-1990s)
BATTERY_HISTORICAL = [
    BatteryTechnology(
        name="Nickel-Cadmium (NiCd)",
        type_category="Historical",
        energy_density=40.0,
        power_density=150.0,
        cycle_life=2000,
        charge_efficiency=0.85,
        discharge_efficiency=0.90,
        self_discharge_rate=0.0010,
        temp_range_min=233.15,  # -40°C
        temp_range_max=333.15,  # 60°C
        cost_relative=0.5,
        trl=9,
        description="Classic NiCd batteries used in early spacecraft"
    ),
    BatteryTechnology(
        name="Nickel-Hydrogen (NiH2)",
        type_category="Historical",
        energy_density=60.0,
        power_density=200.0,
        cycle_life=20000,
        charge_efficiency=0.88,
        discharge_efficiency=0.92,
        self_discharge_rate=0.0005,
        temp_range_min=253.15,  # -20°C
        temp_range_max=323.15,  # 50°C
        cost_relative=2.0,
        trl=9,
        description="Long-life NiH2 batteries for satellites and ISS"
    ),
    BatteryTechnology(
        name="Silver-Zinc (AgZn)",
        type_category="Historical",
        energy_density=130.0,
        power_density=300.0,
        cycle_life=100,
        charge_efficiency=0.90,
        discharge_efficiency=0.95,
        self_discharge_rate=0.0015,
        temp_range_min=263.15,  # -10°C
        temp_range_max=323.15,  # 50°C
        cost_relative=5.0,
        trl=9,
        description="High energy density but limited cycle life"
    ),
]

# Current battery technologies (2000s-2020s)
BATTERY_CURRENT = [
    BatteryTechnology(
        name="Lithium-ion (LiCoO2)",
        type_category="Current",
        energy_density=150.0,
        power_density=250.0,
        cycle_life=1000,
        charge_efficiency=0.92,
        discharge_efficiency=0.95,
        self_discharge_rate=0.0002,
        temp_range_min=253.15,  # -20°C
        temp_range_max=333.15,  # 60°C
        cost_relative=1.0,
        trl=9,
        description="Standard lithium-ion with cobalt oxide cathode"
    ),
    BatteryTechnology(
        name="Lithium-ion (NMC)",
        type_category="Current",
        energy_density=180.0,
        power_density=280.0,
        cycle_life=2000,
        charge_efficiency=0.94,
        discharge_efficiency=0.96,
        self_discharge_rate=0.0001,
        temp_range_min=243.15,  # -30°C
        temp_range_max=333.15,  # 60°C
        cost_relative=1.2,
        trl=9,
        description="Nickel Manganese Cobalt cathode for improved performance"
    ),
    BatteryTechnology(
        name="Lithium-ion (LFP)",
        type_category="Current",
        energy_density=120.0,
        power_density=220.0,
        cycle_life=5000,
        charge_efficiency=0.93,
        discharge_efficiency=0.95,
        self_discharge_rate=0.0001,
        temp_range_min=253.15,  # -20°C
        temp_range_max=343.15,  # 70°C
        cost_relative=0.8,
        trl=9,
        description="Lithium Iron Phosphate for safety and longevity"
    ),
    BatteryTechnology(
        name="Lithium-Polymer",
        type_category="Current",
        energy_density=160.0,
        power_density=300.0,
        cycle_life=1500,
        charge_efficiency=0.93,
        discharge_efficiency=0.95,
        self_discharge_rate=0.0002,
        temp_range_min=253.15,  # -20°C
        temp_range_max=333.15,  # 60°C
        cost_relative=1.5,
        trl=8,
        description="Flexible polymer electrolyte lithium batteries"
    ),
]

# Theoretical/Future battery technologies (2030s+)
BATTERY_THEORETICAL = [
    BatteryTechnology(
        name="Solid-State Lithium",
        type_category="Theoretical",
        energy_density=400.0,
        power_density=500.0,
        cycle_life=10000,
        charge_efficiency=0.96,
        discharge_efficiency=0.98,
        self_discharge_rate=0.00005,
        temp_range_min=223.15,  # -50°C
        temp_range_max=353.15,  # 80°C
        cost_relative=3.0,
        trl=5,
        description="Solid electrolyte for high energy density and safety"
    ),
    BatteryTechnology(
        name="Lithium-Sulfur",
        type_category="Theoretical",
        energy_density=500.0,
        power_density=400.0,
        cycle_life=3000,
        charge_efficiency=0.94,
        discharge_efficiency=0.96,
        self_discharge_rate=0.0001,
        temp_range_min=243.15,  # -30°C
        temp_range_max=333.15,  # 60°C
        cost_relative=1.5,
        trl=4,
        description="High theoretical energy density with sulfur cathode"
    ),
    BatteryTechnology(
        name="Lithium-Air",
        type_category="Theoretical",
        energy_density=800.0,
        power_density=300.0,
        cycle_life=1000,
        charge_efficiency=0.90,
        discharge_efficiency=0.92,
        self_discharge_rate=0.0003,
        temp_range_min=263.15,  # -10°C
        temp_range_max=323.15,  # 50°C
        cost_relative=2.5,
        trl=3,
        description="Ultra-high energy density using atmospheric oxygen"
    ),
    BatteryTechnology(
        name="Sodium-ion Advanced",
        type_category="Theoretical",
        energy_density=200.0,
        power_density=350.0,
        cycle_life=8000,
        charge_efficiency=0.95,
        discharge_efficiency=0.96,
        self_discharge_rate=0.0001,
        temp_range_min=233.15,  # -40°C
        temp_range_max=343.15,  # 70°C
        cost_relative=0.6,
        trl=6,
        description="Abundant sodium-based alternative to lithium"
    ),
    BatteryTechnology(
        name="Aluminum-ion",
        type_category="Theoretical",
        energy_density=300.0,
        power_density=600.0,
        cycle_life=20000,
        charge_efficiency=0.96,
        discharge_efficiency=0.97,
        self_discharge_rate=0.00005,
        temp_range_min=243.15,  # -30°C
        temp_range_max=353.15,  # 80°C
        cost_relative=0.8,
        trl=4,
        description="Fast-charging aluminum-based batteries"
    ),
]


# =============================================================================
# TECHNOLOGY DATABASE CLASS
# =============================================================================

class TechnologyDatabase:
    """
    Central database for all power system technologies.
    Provides methods to access and filter technologies by category.
    """
    
    def __init__(self):
        """Initialize the technology database with all available technologies."""
        # Compile all concentrator technologies
        self.concentrators = (CONCENTRATOR_HISTORICAL + 
                            CONCENTRATOR_CURRENT + 
                            CONCENTRATOR_THEORETICAL)
        
        # Compile all PV technologies
        self.pv_cells = (PV_HISTORICAL + 
                        PV_CURRENT + 
                        PV_THEORETICAL)
        
        # Compile all battery technologies
        self.batteries = (BATTERY_HISTORICAL + 
                         BATTERY_CURRENT + 
                         BATTERY_THEORETICAL)
    
    def get_concentrators_by_category(self, category: str) -> List[ConcentratorTechnology]:
        """Get all concentrators of a specific category."""
        return [c for c in self.concentrators if c.type_category == category]
    
    def get_pv_by_category(self, category: str) -> List[PVTechnology]:
        """Get all PV cells of a specific category."""
        return [p for p in self.pv_cells if p.type_category == category]
    
    def get_batteries_by_category(self, category: str) -> List[BatteryTechnology]:
        """Get all batteries of a specific category."""
        return [b for b in self.batteries if b.type_category == category]
    
    def get_all_categories(self) -> List[str]:
        """Get list of all technology categories."""
        return ["Historical", "Current", "Theoretical"]
    
    def print_summary(self):
        """Print a summary of all available technologies."""
        print("=" * 70)
        print("TECHNOLOGY DATABASE SUMMARY")
        print("=" * 70)
        
        print(f"\nSolar Concentrators: {len(self.concentrators)} technologies")
        for cat in self.get_all_categories():
            count = len(self.get_concentrators_by_category(cat))
            print(f"  {cat}: {count}")
        
        print(f"\nPhotovoltaic Cells: {len(self.pv_cells)} technologies")
        for cat in self.get_all_categories():
            count = len(self.get_pv_by_category(cat))
            print(f"  {cat}: {count}")
        
        print(f"\nBattery Systems: {len(self.batteries)} technologies")
        for cat in self.get_all_categories():
            count = len(self.get_batteries_by_category(cat))
            print(f"  {cat}: {count}")
        
        print(f"\nTotal Possible Combinations: {len(self.concentrators) * len(self.pv_cells) * len(self.batteries)}")
        print("=" * 70)


# =============================================================================
# MODULE TEST
# =============================================================================

if __name__ == "__main__":
    # Create and display technology database
    db = TechnologyDatabase()
    db.print_summary()
    
    # Display some example technologies
    print("\n" + "=" * 70)
    print("EXAMPLE TECHNOLOGIES")
    print("=" * 70)
    
    print("\nCurrent Concentrator Example:")
    print(f"  {db.concentrators[3].name}")
    print(f"  Concentration: {db.concentrators[3].concentration_ratio}x")
    print(f"  Efficiency: {db.concentrators[3].optical_efficiency * 100:.1f}%")
    
    print("\nCurrent PV Example:")
    print(f"  {db.pv_cells[4].name}")
    print(f"  Efficiency: {db.pv_cells[4].base_efficiency * 100:.1f}%")
    print(f"  Degradation: {db.pv_cells[4].degradation_rate * 100:.2f}%/year")
    
    print("\nCurrent Battery Example:")
    print(f"  {db.batteries[4].name}")
    print(f"  Energy Density: {db.batteries[4].energy_density} Wh/kg")
    print(f"  Cycle Life: {db.batteries[4].cycle_life} cycles")
