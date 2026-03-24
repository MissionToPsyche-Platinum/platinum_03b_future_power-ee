/**
 * Unit tests for accuracy improvement modules
 * Tests battery degradation, temperature effects, and MPPT efficiency models
 */

import { describe, it, expect } from 'vitest';
import { calculateBatteryDegradation, estimateCycleCount } from '../batteryDegradation';
import { calculateTemperatureEffects, checkTemperatureSafety } from '../batteryTemperature';
import { calculateMPPTEfficiency, recommendConverterSize } from '../mpptEfficiency';

describe('Battery Degradation Model', () => {
  it('should calculate capacity fade based on cycle count', () => {
    const result = calculateBatteryDegradation({
      cycleCount: 1000,
      averageDOD: 0.50,
      averageTemperature: 298, // 25°C
      yearsInOperation: 2,
    });
    
    // NASA model shows significant degradation even at moderate cycle counts
    expect(result.capacityFadeFactor).toBeGreaterThan(0.65);
    expect(result.capacityFadeFactor).toBeLessThanOrEqual(1.0);
    // EOL is reached when capacity drops below 70% (30% fade)
    expect(result.isEOL).toBe(result.capacityFadeFactor <= 0.70);
  });
  
  it('should reach EOL after 30% capacity fade', () => {
    const result = calculateBatteryDegradation({
      cycleCount: 10000,
      averageDOD: 0.80, // High DOD accelerates aging
      averageTemperature: 313, // 40°C
      yearsInOperation: 10,
    });
    
    expect(result.capacityFadeFactor).toBeLessThanOrEqual(0.70);
    expect(result.isEOL).toBe(true);
  });
  
  it('should calculate impedance growth', () => {
    const result = calculateBatteryDegradation({
      cycleCount: 5000,
      averageDOD: 0.50,
      averageTemperature: 298,
      yearsInOperation: 5,
    });
    
    // Impedance growth correlates with capacity fade
    expect(result.impedanceGrowthFactor).toBeGreaterThanOrEqual(1.0);
    expect(result.impedanceGrowthFactor).toBeLessThanOrEqual(3.0); // Can grow significantly
  });
  
  it('should estimate cycle count for Psyche mission', () => {
    const cycles = estimateCycleCount(5, 4.2); // 5 years, 4.2 hour rotation
    expect(cycles).toBeGreaterThan(10000);
    expect(cycles).toBeLessThan(11000);
  });
});

describe('Temperature-Dependent Battery Performance', () => {
  it('should provide full capacity at optimal temperature (25°C)', () => {
    const effects = calculateTemperatureEffects(298); // 25°C
    
    expect(effects.capacityDerating).toBeCloseTo(1.0, 1);
    expect(effects.resistanceMultiplier).toBeCloseTo(1.0, 1);
    expect(effects.efficiencyPenalty).toBe(0);
  });
  
  it('should derate capacity at low temperature (0°C)', () => {
    const effects = calculateTemperatureEffects(273); // 0°C
    
    expect(effects.capacityDerating).toBeCloseTo(0.8, 1);
    expect(effects.resistanceMultiplier).toBeGreaterThan(1.0);
    expect(effects.maxDischargeRate).toBeLessThan(2.0);
  });
  
  it('should severely derate capacity at extreme cold (-20°C)', () => {
    const effects = calculateTemperatureEffects(253); // -20°C
    
    expect(effects.capacityDerating).toBeCloseTo(0.6, 1);
    expect(effects.resistanceMultiplier).toBeGreaterThan(2.0);
    expect(effects.maxDischargeRate).toBeLessThan(0.5);
  });
  
  it('should prevent charging below 0°C', () => {
    const effects = calculateTemperatureEffects(263); // -10°C
    
    expect(effects.maxChargeRate).toBe(0);
  });
  
  it('should warn about unsafe temperatures', () => {
    const coldSafety = checkTemperatureSafety(233, false); // -40°C
    expect(coldSafety.safe).toBe(false);
    expect(coldSafety.warning).toContain('operational limit');
    
    const hotSafety = checkTemperatureSafety(343, false); // 70°C
    expect(hotSafety.safe).toBe(false);
    expect(hotSafety.warning).toContain('thermal runaway');
  });
  
  it('should prevent charging at freezing temperatures', () => {
    const safety = checkTemperatureSafety(263, true); // -10°C, charging
    expect(safety.safe).toBe(false);
    expect(safety.warning).toContain('lithium plating');
  });
});

describe('MPPT Converter Efficiency', () => {
  it('should provide peak efficiency at optimal load (75%)', () => {
    const efficiency = calculateMPPTEfficiency({
      loadPowerW: 750,
      ratedPowerW: 1000,
      inputVoltage: 70,
      outputVoltage: 28,
      temperatureK: 298,
    });
    
    expect(efficiency).toBeGreaterThan(0.92);
    expect(efficiency).toBeLessThanOrEqual(0.98);
  });
  
  it('should have lower efficiency at light load (10%)', () => {
    const efficiency = calculateMPPTEfficiency({
      loadPowerW: 100,
      ratedPowerW: 1000,
      inputVoltage: 70,
      outputVoltage: 28,
      temperatureK: 298,
    });
    
    expect(efficiency).toBeGreaterThan(0.60);
    expect(efficiency).toBeLessThan(0.70);
  });
  
  it('should have degraded efficiency at overload (110%)', () => {
    const efficiency = calculateMPPTEfficiency({
      loadPowerW: 1100,
      ratedPowerW: 1000,
      inputVoltage: 70,
      outputVoltage: 28,
      temperatureK: 298,
    });
    
    expect(efficiency).toBeGreaterThan(0.85);
    expect(efficiency).toBeLessThan(0.97);
  });
  
  it('should apply voltage ratio penalty', () => {
    const lowRatio = calculateMPPTEfficiency({
      loadPowerW: 500,
      ratedPowerW: 1000,
      inputVoltage: 42,
      outputVoltage: 28, // 1.5x ratio
      temperatureK: 298,
    });
    
    const highRatio = calculateMPPTEfficiency({
      loadPowerW: 500,
      ratedPowerW: 1000,
      inputVoltage: 140,
      outputVoltage: 28, // 5x ratio
      temperatureK: 298,
    });
    
    expect(lowRatio).toBeGreaterThan(highRatio);
  });
  
  it('should apply temperature penalty', () => {
    const coldEff = calculateMPPTEfficiency({
      loadPowerW: 500,
      ratedPowerW: 1000,
      inputVoltage: 70,
      outputVoltage: 28,
      temperatureK: 233, // -40°C
    });
    
    const optimalEff = calculateMPPTEfficiency({
      loadPowerW: 500,
      ratedPowerW: 1000,
      inputVoltage: 70,
      outputVoltage: 28,
      temperatureK: 298, // 25°C
    });
    
    expect(coldEff).toBeLessThan(optimalEff);
  });
  
  it('should recommend appropriate converter size', () => {
    const size = recommendConverterSize(600, 1000); // 600W avg, 1000W peak
    
    expect(size).toBeGreaterThanOrEqual(1000); // Must handle peak
    expect(size).toBeLessThanOrEqual(1200); // Sized for efficiency
    expect(size % 50).toBe(0); // Rounded to 50W
  });
});

describe('Integration Tests', () => {
  it('should show degradation accumulation over mission lifetime', () => {
    const year1 = calculateBatteryDegradation({
      cycleCount: 2080,
      averageDOD: 0.50,
      averageTemperature: 298,
      yearsInOperation: 1,
    });
    
    const year5 = calculateBatteryDegradation({
      cycleCount: 10400,
      averageDOD: 0.50,
      averageTemperature: 298,
      yearsInOperation: 5,
    });
    
    // More cycles and time = more degradation
    expect(year5.capacityFadeFactor).toBeLessThanOrEqual(year1.capacityFadeFactor);
    expect(year5.impedanceGrowthFactor).toBeGreaterThanOrEqual(year1.impedanceGrowthFactor);
  });
  
  it('should show temperature effects compound with degradation', () => {
    const degraded = calculateBatteryDegradation({
      cycleCount: 5000,
      averageDOD: 0.50,
      averageTemperature: 298,
      yearsInOperation: 3,
    });
    
    const tempEffects = calculateTemperatureEffects(273); // 0°C
    
    // Combined effect: degradation reduces capacity, temperature further derates it
    const effectiveCapacity = 100 * degraded.capacityFadeFactor * tempEffects.capacityDerating;
    
    expect(effectiveCapacity).toBeLessThan(80); // Less than 80% of original
  });
  
  it('should show MPPT efficiency affects overall system performance', () => {
    const pvPower = 1000; // 1000W from solar array
    
    const mpptEff = calculateMPPTEfficiency({
      loadPowerW: 800,
      ratedPowerW: 1000,
      inputVoltage: 70,
      outputVoltage: 28,
      temperatureK: 298,
    });
    
    const powerAfterMPPT = pvPower * mpptEff;
    
    expect(powerAfterMPPT).toBeGreaterThan(900); // >90% efficiency
    expect(powerAfterMPPT).toBeLessThan(1000); // Some loss
  });
});
