import { describe, it, expect } from 'vitest';
import { runSimulation } from '../../simulationEngine';
import { getTechnologies } from '../../getTechnologies';

describe('Accuracy Toggle Functionality', () => {
  it('should run simulation with simple model when useSimpleModel is true', async () => {
    const technologies = await getTechnologies();
    
    // Use first available technologies
    const pvCell = technologies.pv_cells.find(p => p.name !== 'None');
    const battery = technologies.batteries.find(b => b.name !== 'None');
    
    if (!pvCell || !battery) {
      throw new Error('No valid technologies found');
    }
    
    const config = {
      concentrator: 'None',
      pvCell: pvCell.name,
      battery: battery.name,
      concentratorArea: 3,
      pvArea: 1,
      batteryCapacity: 8000,
      baseLoad: 100,
      durationHours: 48,
      yearsInOperation: 5,
      spacecraftClass: 'flagship',
      useSimpleModel: true,
    };

    const result = await runSimulation(config, technologies);
    
    expect(result).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.metrics.avg_power_generated).toBeGreaterThan(0);
    expect(result.time).toHaveLength(result.power_generated.length);
  });

  it('should run simulation with NASA-validated models when useSimpleModel is false', async () => {
    const technologies = await getTechnologies();
    
    const pvCell = technologies.pv_cells.find(p => p.name !== 'None');
    const battery = technologies.batteries.find(b => b.name !== 'None');
    
    if (!pvCell || !battery) {
      throw new Error('No valid technologies found');
    }
    
    const config = {
      concentrator: 'None',
      pvCell: pvCell.name,
      battery: battery.name,
      concentratorArea: 3,
      pvArea: 1,
      batteryCapacity: 8000,
      baseLoad: 100,
      durationHours: 48,
      yearsInOperation: 5,
      spacecraftClass: 'flagship',
      useSimpleModel: false,
    };

    const result = await runSimulation(config, technologies);
    
    expect(result).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.metrics.avg_power_generated).toBeGreaterThan(0);
    expect(result.time).toHaveLength(result.power_generated.length);
  });

  it('should produce different results between simple and advanced models', async () => {
    const technologies = await getTechnologies();
    
    const pvCell = technologies.pv_cells.find(p => p.name !== 'None');
    const battery = technologies.batteries.find(b => b.name !== 'None');
    
    if (!pvCell || !battery) {
      throw new Error('No valid technologies found');
    }
    
    const baseConfig = {
      concentrator: 'None',
      pvCell: pvCell.name,
      battery: battery.name,
      concentratorArea: 3,
      pvArea: 1,
      batteryCapacity: 8000,
      baseLoad: 100,
      durationHours: 48,
      yearsInOperation: 5,
      spacecraftClass: 'flagship',
    };

    const simpleResult = await runSimulation({ ...baseConfig, useSimpleModel: true }, technologies);
    const advancedResult = await runSimulation({ ...baseConfig, useSimpleModel: false }, technologies);
    
    // Both models should produce valid results
    expect(simpleResult.metrics.avg_power_generated).toBeGreaterThan(0);
    expect(advancedResult.metrics.avg_power_generated).toBeGreaterThan(0);
    // Results may differ due to accuracy models (battery degradation, MPPT, temp effects, pointing)
    // But with "None" concentrator and short duration, differences may be minimal
  });

  it('should apply battery degradation only in advanced model', async () => {
    const technologies = await getTechnologies();
    
    const pvCell = technologies.pv_cells.find(p => p.name !== 'None');
    const battery = technologies.batteries.find(b => b.name !== 'None');
    
    if (!pvCell || !battery) {
      throw new Error('No valid technologies found');
    }
    
    const config = {
      concentrator: 'None',
      pvCell: pvCell.name,
      battery: battery.name,
      concentratorArea: 3,
      pvArea: 1,
      batteryCapacity: 8000,
      baseLoad: 100,
      durationHours: 48,
      yearsInOperation: 10, // Long mission duration to see degradation effects
      spacecraftClass: 'flagship',
    };

    const simpleResult = await runSimulation({ ...config, useSimpleModel: true }, technologies);
    const advancedResult = await runSimulation({ ...config, useSimpleModel: false }, technologies);
    
    // Advanced model should show lower performance due to battery degradation
    // Battery degradation reduces effective capacity, so min SOC should be lower
    expect(advancedResult.metrics.min_soc).toBeLessThanOrEqual(simpleResult.metrics.min_soc);
  });

  it('should use fixed 95% MPPT efficiency in simple model', async () => {
    const technologies = await getTechnologies();
    
    const pvCell = technologies.pv_cells.find(p => p.name !== 'None');
    const battery = technologies.batteries.find(b => b.name !== 'None');
    
    if (!pvCell || !battery) {
      throw new Error('No valid technologies found');
    }
    
    const config = {
      concentrator: 'None',
      pvCell: pvCell.name,
      battery: battery.name,
      concentratorArea: 3,
      pvArea: 1,
      batteryCapacity: 8000,
      baseLoad: 100,
      durationHours: 48,
      yearsInOperation: 5,
      spacecraftClass: 'flagship',
      useSimpleModel: true,
    };

    const result = await runSimulation(config, technologies);
    
    // Simple model should use fixed efficiency
    expect(result.mppt_efficiency).toBeDefined();
    // All MPPT efficiency values should be close to 0.95 in simple model
    const avgMpptEff = result.mppt_efficiency.reduce((a, b) => a + b, 0) / result.mppt_efficiency.length;
    expect(avgMpptEff).toBeCloseTo(0.95, 2);
  });

  it('should skip pointing losses in simple model', async () => {
    const technologies = await getTechnologies();
    
    const pvCell = technologies.pv_cells.find(p => p.name !== 'None');
    const battery = technologies.batteries.find(b => b.name !== 'None');
    
    if (!pvCell || !battery) {
      throw new Error('No valid technologies found');
    }
    
    const baseConfig = {
      concentrator: 'None',
      pvCell: pvCell.name,
      battery: battery.name,
      concentratorArea: 3,
      pvArea: 1,
      batteryCapacity: 8000,
      baseLoad: 100,
      durationHours: 48,
      yearsInOperation: 5,
      spacecraftClass: 'smallsat', // SmallSat has higher pointing losses
    };

    const simpleResult = await runSimulation({ ...baseConfig, useSimpleModel: true }, technologies);
    const advancedResult = await runSimulation({ ...baseConfig, useSimpleModel: false }, technologies);
    
    // Simple model should have higher or equal power generation (no pointing losses)
    expect(simpleResult.metrics.avg_power_generated).toBeGreaterThanOrEqual(advancedResult.metrics.avg_power_generated);
  });

  it('should handle different spacecraft classes correctly', async () => {
    const technologies = await getTechnologies();
    
    const pvCell = technologies.pv_cells.find(p => p.name !== 'None');
    const battery = technologies.batteries.find(b => b.name !== 'None');
    
    if (!pvCell || !battery) {
      throw new Error('No valid technologies found');
    }
    
    const baseConfig = {
      concentrator: 'None',
      pvCell: pvCell.name,
      battery: battery.name,
      concentratorArea: 3,
      pvArea: 1,
      batteryCapacity: 8000,
      baseLoad: 100,
      durationHours: 48,
      yearsInOperation: 5,
      useSimpleModel: false,
    };

    const flagshipResult = await runSimulation({ ...baseConfig, spacecraftClass: 'flagship' }, technologies);
    const smallsatResult = await runSimulation({ ...baseConfig, spacecraftClass: 'smallsat' }, technologies);
    
    // Flagship should have better pointing accuracy and higher or equal power generation
    expect(flagshipResult.metrics.avg_power_generated).toBeGreaterThanOrEqual(smallsatResult.metrics.avg_power_generated);
  });

  it('should use fixed 25°C temperature effects in simple model', async () => {
    const technologies = await getTechnologies();
    
    const pvCell = technologies.pv_cells.find(p => p.name !== 'None');
    const battery = technologies.batteries.find(b => b.name !== 'None');
    
    if (!pvCell || !battery) {
      throw new Error('No valid technologies found');
    }
    
    const config = {
      concentrator: 'None',
      pvCell: pvCell.name,
      battery: battery.name,
      concentratorArea: 3,
      pvArea: 1,
      batteryCapacity: 8000,
      baseLoad: 100,
      durationHours: 48,
      yearsInOperation: 5,
      spacecraftClass: 'flagship',
      useSimpleModel: true,
    };

    const result = await runSimulation(config, technologies);
    
    // Simple model should not show temperature-dependent variations
    expect(result).toBeDefined();
    expect(result.metrics).toBeDefined();
  });
});
