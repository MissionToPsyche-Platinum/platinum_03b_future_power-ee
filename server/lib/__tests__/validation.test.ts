/**
 * Unit tests for parameter validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateConcentratorArea,
  validatePVArea,
  validateBatteryCapacity,
  validateBaseLoad,
  validatePeakPower,
  validateSimulationDuration,
  validateMissionDuration,
  validateYearsInOperation,
  validateEnergyMargin,
  validateMinSOC,
  validateEclipseDuration,
  validateMaxMass,
  validateMaxCost,
  validateSimulationConfig,
} from '../../../client/src/lib/validation';

describe('Parameter Validation', () => {
  describe('validateConcentratorArea', () => {
    it('should warn for very small area', () => {
      const result = validateConcentratorArea(0.3);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('warning');
      expect(result?.message).toContain('very small');
    });

    it('should warn for very large area', () => {
      const result = validateConcentratorArea(25);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('warning');
      expect(result?.message).toContain('very large');
    });

    it('should pass for typical area', () => {
      const result = validateConcentratorArea(5);
      expect(result).toBeNull();
    });
  });

  describe('validatePVArea', () => {
    it('should warn for very small area', () => {
      const result = validatePVArea(0.05);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('warning');
    });

    it('should warn for very large area', () => {
      const result = validatePVArea(20);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('warning');
    });

    it('should pass for typical area', () => {
      const result = validatePVArea(2);
      expect(result).toBeNull();
    });
  });

  describe('validateBatteryCapacity', () => {
    it('should warn for low capacity', () => {
      const result = validateBatteryCapacity(500);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('low');
    });

    it('should warn for very high capacity', () => {
      const result = validateBatteryCapacity(60000);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('very high');
    });

    it('should warn for low capacity on long mission', () => {
      const result = validateBatteryCapacity(3000, 10);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('10-year');
    });

    it('should pass for typical capacity', () => {
      const result = validateBatteryCapacity(10000);
      expect(result).toBeNull();
    });
  });

  describe('validateBaseLoad', () => {
    it('should warn for very low load', () => {
      const result = validateBaseLoad(5);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('very low');
    });

    it('should warn for very high load', () => {
      const result = validateBaseLoad(1500);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('very high');
    });

    it('should pass for typical load', () => {
      const result = validateBaseLoad(150);
      expect(result).toBeNull();
    });
  });

  describe('validatePeakPower', () => {
    it('should error when peak < average', () => {
      const result = validatePeakPower(100, 200);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('error');
      expect(result?.message).toContain('greater than');
    });

    it('should warn when peak >> average', () => {
      const result = validatePeakPower(1000, 100);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('warning');
      expect(result?.message).toContain('>5x');
    });

    it('should pass for reasonable peak', () => {
      const result = validatePeakPower(300, 200);
      expect(result).toBeNull();
    });
  });

  describe('validateSimulationDuration', () => {
    it('should warn for very short duration', () => {
      const result = validateSimulationDuration(0.5);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('very short');
    });

    it('should warn for very long duration', () => {
      const result = validateSimulationDuration(800);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('>30 days');
    });

    it('should pass for typical duration', () => {
      const result = validateSimulationDuration(48);
      expect(result).toBeNull();
    });
  });

  describe('validateMissionDuration', () => {
    it('should warn for very short mission', () => {
      const result = validateMissionDuration(0.5);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('very short');
    });

    it('should warn for very long mission', () => {
      const result = validateMissionDuration(25);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('>20 years');
    });

    it('should pass for typical mission', () => {
      const result = validateMissionDuration(10);
      expect(result).toBeNull();
    });
  });

  describe('validateYearsInOperation', () => {
    it('should error for negative years', () => {
      const result = validateYearsInOperation(-1, 10);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('error');
    });

    it('should warn when exceeding mission duration', () => {
      const result = validateYearsInOperation(12, 10);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('exceeds');
    });

    it('should pass for valid year', () => {
      const result = validateYearsInOperation(5, 10);
      expect(result).toBeNull();
    });
  });

  describe('validateEnergyMargin', () => {
    it('should warn for low margin', () => {
      const result = validateEnergyMargin(5);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('<10%');
    });

    it('should warn for very high margin', () => {
      const result = validateEnergyMargin(150);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('>100%');
    });

    it('should pass for typical margin', () => {
      const result = validateEnergyMargin(30);
      expect(result).toBeNull();
    });
  });

  describe('validateMinSOC', () => {
    it('should warn for very low SOC', () => {
      const result = validateMinSOC(5);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('<10%');
    });

    it('should warn for very high SOC', () => {
      const result = validateMinSOC(60);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('>50%');
    });

    it('should pass for typical SOC', () => {
      const result = validateMinSOC(20);
      expect(result).toBeNull();
    });
  });

  describe('validateEclipseDuration', () => {
    it('should warn for very short eclipse', () => {
      const result = validateEclipseDuration(0.05);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('very short');
    });

    it('should warn for very long eclipse', () => {
      const result = validateEclipseDuration(15);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('>12 hours');
    });

    it('should pass for typical eclipse', () => {
      const result = validateEclipseDuration(4);
      expect(result).toBeNull();
    });
  });

  describe('validateMaxMass', () => {
    it('should warn for very low mass', () => {
      const result = validateMaxMass(5);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('<10 kg');
    });

    it('should warn for very high mass', () => {
      const result = validateMaxMass(600);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('>500 kg');
    });

    it('should pass for typical mass', () => {
      const result = validateMaxMass(50);
      expect(result).toBeNull();
    });
  });

  describe('validateMaxCost', () => {
    it('should warn for very low cost', () => {
      const result = validateMaxCost(50000);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('<$100k');
    });

    it('should warn for very high cost', () => {
      const result = validateMaxCost(60000000);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('>$50M');
    });

    it('should pass for typical cost', () => {
      const result = validateMaxCost(5000000);
      expect(result).toBeNull();
    });
  });

  describe('validateSimulationConfig', () => {
    it('should return multiple warnings for problematic config', () => {
      const warnings = validateSimulationConfig({
        concentratorArea: 0.2,
        pvArea: 0.05,
        batteryCapacity: 500,
        baseLoad: 5,
        simulationDuration: 0.3,
      });
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.field === 'concentratorArea')).toBe(true);
      expect(warnings.some(w => w.field === 'pvArea')).toBe(true);
      expect(warnings.some(w => w.field === 'batteryCapacity')).toBe(true);
    });

    it('should return no warnings for good config', () => {
      const warnings = validateSimulationConfig({
        concentratorArea: 5,
        pvArea: 2,
        batteryCapacity: 10000,
        baseLoad: 150,
        simulationDuration: 48,
        missionDuration: 10,
        yearsInOperation: 5,
        energyMargin: 30,
        minSOC: 20,
      });
      expect(warnings.length).toBe(0);
    });

    it('should validate peak vs average power relationship', () => {
      const warnings = validateSimulationConfig({
        averagePower: 200,
        peakPower: 100, // Peak < average
      });
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].type).toBe('error');
    });
  });
});
