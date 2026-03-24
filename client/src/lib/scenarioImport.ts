/**
 * Scenario Import Utilities
 * 
 * Functions to import sizing and cost-benefit scenarios from JSON files
 */

export interface ImportedSizingScenario {
  name: string;
  description: string;
  notes?: string;
  pvCellId: number;
  batteryId: number;
  loadPower: number;
  minSoc: number;
  resultsJson: string;
}

export interface ImportedCostBenefitScenario {
  name: string;
  description: string;
  notes?: string;
  pvCellId: number;
  batteryId: number;
  resultsJson: string;
}

/**
 * Parse and validate imported sizing scenario JSON
 */
export function parseSizingScenarioJSON(jsonString: string): ImportedSizingScenario {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate required fields
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Invalid or missing "name" field');
    }
    if (!data.pvCellId || typeof data.pvCellId !== 'number') {
      throw new Error('Invalid or missing "pvCellId" field');
    }
    if (!data.batteryId || typeof data.batteryId !== 'number') {
      throw new Error('Invalid or missing "batteryId" field');
    }
    if (data.loadPower === undefined || typeof data.loadPower !== 'number') {
      throw new Error('Invalid or missing "loadPower" field');
    }
    if (data.minSoc === undefined || typeof data.minSoc !== 'number') {
      throw new Error('Invalid or missing "minSoc" field');
    }
    if (!data.resultsJson || typeof data.resultsJson !== 'string') {
      throw new Error('Invalid or missing "resultsJson" field');
    }
    
    return {
      name: data.name,
      description: data.description || '',
      notes: data.notes || '',
      pvCellId: data.pvCellId,
      batteryId: data.batteryId,
      loadPower: data.loadPower,
      minSoc: data.minSoc,
      resultsJson: data.resultsJson,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}

/**
 * Parse and validate imported cost-benefit scenario JSON
 */
export function parseCostBenefitScenarioJSON(jsonString: string): ImportedCostBenefitScenario {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate required fields
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Invalid or missing "name" field');
    }
    if (!data.pvCellId || typeof data.pvCellId !== 'number') {
      throw new Error('Invalid or missing "pvCellId" field');
    }
    if (!data.batteryId || typeof data.batteryId !== 'number') {
      throw new Error('Invalid or missing "batteryId" field');
    }
    if (!data.resultsJson || typeof data.resultsJson !== 'string') {
      throw new Error('Invalid or missing "resultsJson" field');
    }
    
    return {
      name: data.name,
      description: data.description || '',
      notes: data.notes || '',
      pvCellId: data.pvCellId,
      batteryId: data.batteryId,
      resultsJson: data.resultsJson,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}

/**
 * Read file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsText(file);
  });
}
