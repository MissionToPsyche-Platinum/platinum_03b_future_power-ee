#!/usr/bin/env python3.11
"""
Run 16 Psyche power system simulation
Accepts configuration via command line argument, outputs results as JSON
"""

import json
import sys
import numpy as np
from psyche_technology_database import TechnologyDatabase
from psyche_enhanced_simulation import EnhancedPowerSystemSimulation

def numpy_to_python(obj):
    """Convert numpy types to Python native types for JSON serialization"""
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, dict):
        return {key: numpy_to_python(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [numpy_to_python(item) for item in obj]
    return obj

def tech_to_dict(tech):
    """Convert technology dataclass to dictionary"""
    result = {
        'name': tech.name,
        'type_category': tech.type_category,
        'trl': tech.trl,
        'description': tech.description,
    }
    
    # Add attributes that exist
    for attr in ['concentration_ratio', 'optical_efficiency', 'base_efficiency', 
                 'temp_coefficient', 'degradation_rate', 'energy_density', 
                 'power_density', 'cycle_life', 'charge_efficiency', 
                 'discharge_efficiency', 'self_discharge_rate', 'mass_per_m2', 
                 'mass_per_kwh', 'cost_relative', 'complexity']:
        if hasattr(tech, attr):
            result[attr] = getattr(tech, attr)
    
    return result

def main():
    try:
        # Parse configuration from command line argument
        if len(sys.argv) < 2:
            raise ValueError("Configuration JSON required as argument")
        
        config = json.loads(sys.argv[1])
        
        # Load technology database
        tech_db = TechnologyDatabase()
        
        # Find selected technologies by name
        concentrator = next((c for c in tech_db.concentrators if c.name == config['concentrator']), None)
        pv_cell = next((p for p in tech_db.pv_cells if p.name == config['pv_cell']), None)
        battery = next((b for b in tech_db.batteries if b.name == config['battery']), None)
        
        if not concentrator or not pv_cell or not battery:
            raise ValueError("Invalid technology selection")
        
        # Create simulation with configuration
        sim = EnhancedPowerSystemSimulation(
            concentrator_tech=concentrator,
            pv_tech=pv_cell,
            battery_tech=battery,
            concentrator_area_m2=config.get('concentrator_area_m2', 3.0),
            pv_area_m2=config.get('pv_area_m2', 1.0),
            battery_capacity_wh=config.get('battery_capacity_wh', 8000.0),
            base_load_w=config.get('base_load_w', 100.0)
        )
        
        # Run simulation
        duration_hours = config.get('duration_hours', 48.0)  # Default 2 days
        dt_hours = config.get('dt_hours', 0.1)
        years_operation = config.get('years_operation', 0)
        
        results = sim.run_simulation(
            duration_hours=duration_hours,
            dt_hours=dt_hours,
            years_operation=years_operation
        )
        
        # Add viability assessment
        stats = results['statistics']
        stats['energy_balance_wh'] = stats['energy_generated_wh'] - stats['energy_consumed_wh']
        stats['system_viable'] = (stats['min_battery_soc'] > 0.20 and 
                                 stats['energy_balance_wh'] > 0)
        
        # Sample data points for web display (max 500 points)
        total_points = len(results['time_hours'])
        if total_points > 500:
            step = total_points // 500
            results['time_hours'] = results['time_hours'][::step]
            results['power_generated'] = results['power_generated'][::step]
            results['power_consumed'] = results['power_consumed'][::step]
            results['battery_soc'] = results['battery_soc'][::step]
            results['battery_power'] = results['battery_power'][::step]
        
        # Add configuration info to results
        results['configuration'] = {
            'concentrator': tech_to_dict(concentrator),
            'pv_cell': tech_to_dict(pv_cell),
            'battery': tech_to_dict(battery),
        }
        
        # Convert numpy types and output JSON
        results_json = numpy_to_python(results)
        print(json.dumps(results_json))
        sys.exit(0)
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
