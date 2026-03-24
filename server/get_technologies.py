#!/usr/bin/env python3.11
"""
Get available technologies from the database
Outputs JSON to stdout for Node.js consumption
"""

import json
import sys
from psyche_technology_database import TechnologyDatabase

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
        # Load technology database
        tech_db = TechnologyDatabase()
        
        # Convert to JSON-serializable format
        result = {
            'concentrators': [tech_to_dict(c) for c in tech_db.concentrators],
            'pv_cells': [tech_to_dict(p) for p in tech_db.pv_cells],
            'batteries': [tech_to_dict(b) for b in tech_db.batteries],
        }
        
        # Output JSON to stdout
        print(json.dumps(result))
        sys.exit(0)
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
