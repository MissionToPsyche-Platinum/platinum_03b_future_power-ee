"""
Enhanced 16 Psyche Power System Simulation with Technology Comparison

This module extends the base simulation with:
1. Sun-tracking sensor system for optimal array orientation
2. Multiple technology options for all components
3. Annual performance analysis across all combinations
4. Comprehensive comparison visualizations

Author: Manus AI
Date: November 2025
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec
import pandas as pd
from dataclasses import dataclass
from typing import List, Tuple, Dict
import json
from tqdm import tqdm

# Import technology database
from psyche_technology_database import (
    TechnologyDatabase, ConcentratorTechnology,
    PVTechnology, BatteryTechnology
)


# =============================================================================
# SUN TRACKING SENSOR SYSTEM
# =============================================================================

@dataclass
class SunSensor:
    """
    Models a sun sensor for tracking and array orientation.
    
    The sun sensor detects the sun's position and provides feedback
    to orient the solar array for maximum power generation.
    
    Attributes:
        accuracy_deg: Angular accuracy in degrees
        update_rate_hz: Sensor update frequency
        power_consumption_w: Sensor power consumption
        field_of_view_deg: Sensor field of view
    """
    accuracy_deg: float = 0.5  # 0.5 degree accuracy
    update_rate_hz: float = 1.0  # 1 Hz update rate
    power_consumption_w: float = 2.0  # 2W power consumption
    field_of_view_deg: float = 120.0  # Wide field of view
    
    def get_sun_vector(self, time_hours: float, rotation_period_hours: float) -> Tuple[float, float, float]:
        """
        Calculate the sun vector in the spacecraft reference frame.
        
        Args:
            time_hours: Current mission time in hours
            rotation_period_hours: Asteroid rotation period
            
        Returns:
            Tuple of (x, y, z) unit vector pointing to sun
        """
        # Calculate rotation angle (asteroid rotates, sun appears to move)
        angle_rad = 2 * np.pi * time_hours / rotation_period_hours
        
        # Sun vector in spacecraft frame (simplified model)
        # Assumes spacecraft on surface with z-axis pointing up
        sun_x = np.cos(angle_rad)
        sun_y = np.sin(angle_rad)
        sun_z = 0.1  # Slight elevation due to orbital inclination
        
        # Normalize
        magnitude = np.sqrt(sun_x**2 + sun_y**2 + sun_z**2)
        return (sun_x / magnitude, sun_y / magnitude, sun_z / magnitude)
    
    def calculate_tracking_efficiency(self, sun_vector: Tuple[float, float, float]) -> float:
        """
        Calculate tracking efficiency based on sun position.
        
        Perfect tracking would give 1.0, but sensor accuracy limits this.
        
        Args:
            sun_vector: Unit vector pointing to sun
            
        Returns:
            Tracking efficiency factor (0 to 1)
        """
        # Calculate angle error due to sensor accuracy
        angle_error_rad = np.deg2rad(self.accuracy_deg)
        
        # Tracking efficiency decreases with angle error
        # Using cosine loss model
        efficiency = np.cos(angle_error_rad)
        
        # If sun is below horizon (z < 0), no tracking possible
        if sun_vector[2] < 0:
            efficiency = 0.0
        
        return efficiency
    
    def get_array_orientation_factor(self, time_hours: float, 
                                     rotation_period_hours: float) -> float:
        """
        Get the array orientation factor for power calculation.
        
        This represents how well the array is oriented toward the sun.
        1.0 = perfect orientation, 0.0 = perpendicular or in shadow
        
        Args:
            time_hours: Current mission time
            rotation_period_hours: Asteroid rotation period
            
        Returns:
            Orientation factor (0 to 1)
        """
        # Get sun vector
        sun_vec = self.get_sun_vector(time_hours, rotation_period_hours)
        
        # Calculate tracking efficiency
        tracking_eff = self.calculate_tracking_efficiency(sun_vec)
        
        # Calculate sun angle factor (cosine of incidence angle)
        # Assuming array normal can track sun within sensor accuracy
        angle_rad = 2 * np.pi * time_hours / rotation_period_hours
        sun_angle_factor = max(0, np.sin(angle_rad))  # 0 when sun below horizon
        
        # Combined orientation factor
        return sun_angle_factor * tracking_eff


# =============================================================================
# ENHANCED POWER SYSTEM SIMULATION
# =============================================================================

class EnhancedPowerSystemSimulation:
    """
    Enhanced simulation with technology options and sun tracking.
    
    This class extends the base simulation to support:
    - Multiple technology choices for each component
    - Sun-tracking sensor system
    - Annual performance analysis
    - Technology comparison
    """
    
    def __init__(self,
                 concentrator_tech: ConcentratorTechnology,
                 pv_tech: PVTechnology,
                 battery_tech: BatteryTechnology,
                 concentrator_area_m2: float = 3.0,
                 pv_area_m2: float = 1.0,
                 battery_capacity_wh: float = 8000.0,
                 base_load_w: float = 100.0):
        """
        Initialize enhanced simulation with specific technologies.
        
        Args:
            concentrator_tech: Selected concentrator technology
            pv_tech: Selected PV cell technology
            battery_tech: Selected battery technology
            concentrator_area_m2: Concentrator collection area
            pv_area_m2: PV cell active area
            battery_capacity_wh: Battery capacity
            base_load_w: Base electrical load
        """
        # Store technology selections
        self.concentrator_tech = concentrator_tech
        self.pv_tech = pv_tech
        self.battery_tech = battery_tech
        
        # Store sizing parameters
        self.concentrator_area = concentrator_area_m2
        self.pv_area = pv_area_m2
        self.battery_capacity = battery_capacity_wh
        self.base_load = base_load_w
        
        # Initialize sun sensor
        self.sun_sensor = SunSensor()
        
        # Environmental parameters for 16 Psyche
        self.distance_au = 2.9  # Average distance from Sun
        self.rotation_period_hours = 4.196  # Rotation period
        self.solar_constant = 1361.0  # W/m² at 1 AU
        self.reference_temp_k = 298.15  # Reference temperature
        
        # Battery state
        self.battery_soc = 0.8  # Start at 80% SOC
        self.min_soc = 0.15
        self.max_soc = 0.95
        
    def get_solar_irradiance(self) -> float:
        """Calculate base solar irradiance at Psyche's distance."""
        return self.solar_constant / (self.distance_au ** 2)
    
    def calculate_surface_temperature(self, time_hours: float) -> float:
        """
        Estimate PV cell temperature based on solar exposure.
        
        Temperature affects PV efficiency significantly.
        """
        # Temperature range on Psyche's surface
        min_temp_k = 100.0
        max_temp_k = 270.0
        
        # Calculate based on sun angle with thermal lag
        phase_lag = 0.5  # hours
        lagged_time = time_hours - phase_lag
        angle_rad = 2 * np.pi * lagged_time / self.rotation_period_hours
        temp_factor = (np.sin(angle_rad) + 1) / 2  # 0 to 1
        
        return min_temp_k + (max_temp_k - min_temp_k) * temp_factor
    
    def calculate_power_generation(self, time_hours: float, 
                                   years_operation: float = 0) -> float:
        """
        Calculate instantaneous power generation with sun tracking.
        
        This is the core power generation calculation that accounts for:
        - Base solar irradiance at Psyche's distance
        - Solar concentrator performance
        - Sun tracking sensor optimization
        - PV cell efficiency with temperature effects
        - Long-term degradation
        
        Args:
            time_hours: Current time in hours
            years_operation: Years of operation for degradation
            
        Returns:
            Instantaneous power in Watts
        """
        # Step 1: Get base solar irradiance at Psyche
        base_irradiance = self.get_solar_irradiance()
        
        # Step 2: Apply sun tracking to get orientation factor
        orientation_factor = self.sun_sensor.get_array_orientation_factor(
            time_hours, self.rotation_period_hours)
        
        # Step 3: Apply solar concentrator
        concentrated_irradiance = (base_irradiance * 
                                  self.concentrator_tech.concentration_ratio *
                                  self.concentrator_tech.optical_efficiency *
                                  orientation_factor)
        
        # Step 4: Calculate PV cell temperature
        cell_temp = self.calculate_surface_temperature(time_hours)
        
        # Step 5: Calculate PV efficiency with temperature and degradation
        temp_effect = 1 + self.pv_tech.temp_coefficient * (cell_temp - self.reference_temp_k)
        degradation_effect = (1 - self.pv_tech.degradation_rate) ** years_operation
        pv_efficiency = self.pv_tech.base_efficiency * temp_effect * degradation_effect
        
        # Step 6: Calculate total power output
        power_w = concentrated_irradiance * self.pv_area * pv_efficiency
        
        # Subtract sun sensor power consumption
        power_w -= self.sun_sensor.power_consumption_w
        
        return max(0, power_w)  # Cannot be negative
    
    def calculate_load(self, time_hours: float) -> float:
        """
        Calculate power load based on operational profile.
        
        Load varies with mission activities and environmental conditions.
        """
        rotation_phase = (time_hours % self.rotation_period_hours) / self.rotation_period_hours
        
        # Base load always present
        load = self.base_load
        
        # Instruments active during day (when sun tracking is active)
        sun_vec = self.sun_sensor.get_sun_vector(time_hours, self.rotation_period_hours)
        if sun_vec[2] > 0:  # Sun above horizon
            load += 150.0  # Instrument load
        
        # Communication windows
        if (0.2 < rotation_phase < 0.3) or (0.7 < rotation_phase < 0.8):
            load += 80.0  # Communication load
        
        # Heaters when cold
        temp = self.calculate_surface_temperature(time_hours)
        if temp < 200.0:
            load += 100.0  # Heater load
        
        return load
    
    def update_battery(self, power_balance: float, dt_hours: float) -> float:
        """
        Update battery state of charge.
        
        Handles charging, discharging, and efficiency losses.
        
        Args:
            power_balance: Net power (generation - load)
            dt_hours: Time step
            
        Returns:
            Actual battery power (positive = charging, negative = discharging)
        """
        # Convert power to energy
        energy_wh = power_balance * dt_hours
        
        # Apply self-discharge
        self_discharge = (self.battery_capacity * 
                         self.battery_tech.self_discharge_rate * dt_hours)
        
        # Calculate maximum charge/discharge rates based on battery technology
        max_charge_rate = self.battery_tech.power_density * (
            self.battery_capacity / self.battery_tech.energy_density)
        max_discharge_rate = max_charge_rate * 1.5  # Can discharge faster
        
        if energy_wh > 0:  # Charging
            # Limit by max charge rate
            max_charge_energy = max_charge_rate * dt_hours
            energy_wh = min(energy_wh, max_charge_energy)
            
            # Apply charge efficiency
            energy_stored = energy_wh * self.battery_tech.charge_efficiency
            
            # Check capacity limits
            current_energy = self.battery_soc * self.battery_capacity
            available_capacity = self.max_soc * self.battery_capacity - current_energy
            energy_stored = min(energy_stored, available_capacity)
            
            # Update SOC
            self.battery_soc += energy_stored / self.battery_capacity
            actual_power = energy_stored / dt_hours / self.battery_tech.charge_efficiency
            
        else:  # Discharging
            # Limit by max discharge rate
            max_discharge_energy = max_discharge_rate * dt_hours
            energy_wh = max(energy_wh, -max_discharge_energy)
            
            # Apply discharge efficiency
            energy_needed = -energy_wh / self.battery_tech.discharge_efficiency
            
            # Check minimum SOC
            current_energy = self.battery_soc * self.battery_capacity
            available_energy = current_energy - self.min_soc * self.battery_capacity
            energy_needed = min(energy_needed, available_energy)
            
            # Update SOC
            self.battery_soc -= energy_needed / self.battery_capacity
            actual_power = -energy_needed * self.battery_tech.discharge_efficiency / dt_hours
        
        # Apply self-discharge
        self.battery_soc -= self_discharge / self.battery_capacity
        self.battery_soc = np.clip(self.battery_soc, self.min_soc, self.max_soc)
        
        return actual_power
    
    def run_simulation(self, duration_hours: float, dt_hours: float = 0.1,
                      years_operation: float = 0) -> Dict:
        """
        Run the power system simulation.
        
        Args:
            duration_hours: Total simulation duration
            dt_hours: Time step size
            years_operation: Years of operation (for degradation)
            
        Returns:
            Dictionary containing simulation results
        """
        # Initialize result arrays
        time_array = np.arange(0, duration_hours, dt_hours)
        power_generated = np.zeros(len(time_array))
        power_consumed = np.zeros(len(time_array))
        battery_soc = np.zeros(len(time_array))
        battery_power = np.zeros(len(time_array))
        
        # Reset battery state
        self.battery_soc = 0.8
        
        # Run simulation loop
        for i, t in enumerate(time_array):
            # Calculate power generation
            p_gen = self.calculate_power_generation(t, years_operation)
            
            # Calculate load
            p_load = self.calculate_load(t)
            
            # Power balance
            p_balance = p_gen - p_load
            
            # Update battery
            p_battery = self.update_battery(p_balance, dt_hours)
            
            # Store results
            power_generated[i] = p_gen
            power_consumed[i] = p_load
            battery_soc[i] = self.battery_soc
            battery_power[i] = p_battery
        
        # Calculate statistics
        results = {
            'time_hours': time_array,
            'power_generated': power_generated,
            'power_consumed': power_consumed,
            'battery_soc': battery_soc,
            'battery_power': battery_power,
            'statistics': {
                'avg_power_generated': np.mean(power_generated),
                'max_power_generated': np.max(power_generated),
                'avg_power_consumed': np.mean(power_consumed),
                'min_battery_soc': np.min(battery_soc),
                'max_battery_soc': np.max(battery_soc),
                'final_battery_soc': battery_soc[-1],
                'energy_generated_wh': np.trapezoid(power_generated, time_array),
                'energy_consumed_wh': np.trapezoid(power_consumed, time_array),
            }
        }
        
        return results


# =============================================================================
# ANNUAL COMPARISON ANALYSIS
# =============================================================================

def run_annual_comparison(tech_db: TechnologyDatabase, 
                         duration_days: float = 365,
                         sample_combinations: int = None) -> pd.DataFrame:
    """
    Run annual simulations for multiple technology combinations.
    
    This function tests different combinations of concentrators, PV cells,
    and batteries to find optimal configurations.
    
    Args:
        tech_db: Technology database
        duration_days: Simulation duration in days
        sample_combinations: If set, randomly sample this many combinations
        
    Returns:
        DataFrame with results for each combination
    """
    print("\n" + "=" * 70)
    print("ANNUAL TECHNOLOGY COMPARISON ANALYSIS")
    print("=" * 70)
    
    # Convert duration to hours
    duration_hours = duration_days * 24
    
    # Generate all combinations or sample
    all_concentrators = tech_db.concentrators
    all_pv = tech_db.pv_cells
    all_batteries = tech_db.batteries
    
    total_combinations = len(all_concentrators) * len(all_pv) * len(all_batteries)
    print(f"\nTotal possible combinations: {total_combinations}")
    
    # Sample if requested
    if sample_combinations and sample_combinations < total_combinations:
        print(f"Sampling {sample_combinations} combinations for analysis...")
        # Randomly sample combinations
        import random
        combinations = []
        for _ in range(sample_combinations):
            c = random.choice(all_concentrators)
            p = random.choice(all_pv)
            b = random.choice(all_batteries)
            combinations.append((c, p, b))
    else:
        # Use all combinations
        print(f"Analyzing all {total_combinations} combinations...")
        combinations = [(c, p, b) for c in all_concentrators 
                       for p in all_pv for b in all_batteries]
    
    # Run simulations
    results_list = []
    
    for conc, pv, batt in tqdm(combinations, desc="Running simulations"):
        try:
            # Create simulation
            sim = EnhancedPowerSystemSimulation(
                concentrator_tech=conc,
                pv_tech=pv,
                battery_tech=batt,
                concentrator_area_m2=3.0,
                pv_area_m2=1.0,
                battery_capacity_wh=8000.0,
                base_load_w=100.0
            )
            
            # Run simulation (sample 10 days to save time, scale results)
            sample_duration = min(10 * 24, duration_hours)  # 10 days max
            result = sim.run_simulation(sample_duration, dt_hours=0.2)
            
            # Scale annual results
            scale_factor = duration_hours / sample_duration
            
            # Store results
            results_list.append({
                'Concentrator': conc.name,
                'Concentrator_Category': conc.type_category,
                'PV_Cell': pv.name,
                'PV_Category': pv.type_category,
                'Battery': batt.name,
                'Battery_Category': batt.type_category,
                'Avg_Power_W': result['statistics']['avg_power_generated'],
                'Max_Power_W': result['statistics']['max_power_generated'],
                'Annual_Energy_kWh': result['statistics']['energy_generated_wh'] * scale_factor / 1000,
                'Min_SOC': result['statistics']['min_battery_soc'],
                'Final_SOC': result['statistics']['final_battery_soc'],
                'Energy_Balance_kWh': (result['statistics']['energy_generated_wh'] - 
                                      result['statistics']['energy_consumed_wh']) * scale_factor / 1000,
                'System_Viable': result['statistics']['min_battery_soc'] > 0.20 and
                               result['statistics']['energy_generated_wh'] > result['statistics']['energy_consumed_wh']
            })
        except Exception as e:
            print(f"\nError with combination {conc.name}/{pv.name}/{batt.name}: {e}")
            continue
    
    # Create DataFrame
    df = pd.DataFrame(results_list)
    
    print(f"\nCompleted {len(df)} simulations successfully")
    print(f"Viable systems: {df['System_Viable'].sum()} ({df['System_Viable'].sum()/len(df)*100:.1f}%)")
    
    return df


# =============================================================================
# MODULE TEST
# =============================================================================

if __name__ == "__main__":
    # Load technology database
    tech_db = TechnologyDatabase()
    tech_db.print_summary()
    
    # Test sun sensor
    print("\n" + "=" * 70)
    print("SUN SENSOR TEST")
    print("=" * 70)
    sensor = SunSensor()
    for t in [0, 1, 2, 3, 4]:
        orientation = sensor.get_array_orientation_factor(t, 4.196)
        print(f"Time {t}h: Orientation factor = {orientation:.3f}")
    
    # Test single simulation
    print("\n" + "=" * 70)
    print("SINGLE SIMULATION TEST")
    print("=" * 70)
    
    # Select current technologies
    conc = tech_db.concentrators[5]  # Parabolic Dish
    pv = tech_db.pv_cells[4]  # Triple-junction GaAs
    batt = tech_db.batteries[4]  # Lithium-ion NMC
    
    print(f"\nTesting: {conc.name} / {pv.name} / {batt.name}")
    
    sim = EnhancedPowerSystemSimulation(conc, pv, batt)
    results = sim.run_simulation(duration_hours=20, dt_hours=0.1)
    
    print(f"\nResults:")
    print(f"  Avg Power: {results['statistics']['avg_power_generated']:.2f} W")
    print(f"  Max Power: {results['statistics']['max_power_generated']:.2f} W")
    print(f"  Min SOC: {results['statistics']['min_battery_soc']*100:.1f}%")
    print(f"  Energy Balance: {(results['statistics']['energy_generated_wh'] - results['statistics']['energy_consumed_wh']):.2f} Wh")
