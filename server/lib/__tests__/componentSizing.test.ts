/**
 * Unit tests for Component Sizing Optimization
 */

import { describe, it, expect } from 'vitest';
import { solveComponentSizing, generateSizingRecommendations } from '../componentSizing';
import type { Concentrator, PVCell, Battery } from '../../types';

describe('Component Sizing Optimization', () => {
  // Mock technologies
  const mockConcentrator: Concentrator = {
    name: 'Test Concentrator',
    concentration_ratio: 15,
    efficiency: 0.85,
    mass_per_m2: 5.0,
    cost_per_m2: 10000,
    trl: 8,
    era: 'current'
  };

  const mockPVCell: PVCell = {
    name: 'Test PV Cell',
    efficiency: 0.30,
    degradation_per_year: 0.01,
    mass_per_m2: 2.0,
    cost_per_m2: 50000,
    temp_coefficient: -0.002,
    trl: 8,
    era: 'current'
  };

  const mockBattery: Battery = {
    name: 'Test Battery',
    energy_density: 200,
    cycle_life: 50000,
    charge_efficiency: 0.95,
    discharge_efficiency: 0.95,
    self_discharge_rate: 0.001,
    mass_per_kwh: 5.0,
    cost_per_kwh: 200000,
    trl: 8,
    era: 'current'
  };

  describe('solveComponentSizing', () => {
    it('should calculate component sizes for basic requirements', async () => {
      const requirements = {
        averagePowerLoad: 150,
        peakPowerLoad: 250,
        minEnergyMargin: 30,
        minBatterySOC: 20,
        eclipseDuration: 2.1,
        missionDuration: 10,
        maxTotalMass: 100,
        maxTotalCost: 10000000,
        concentratorId: 'Test Concentrator',
        pvCellId: 'Test PV Cell',
        batteryId: 'Test Battery'
      };

      const solution = await solveComponentSizing(
        requirements,
        mockConcentrator,
        mockPVCell,
        mockBattery
      );

      expect(solution).toBeDefined();
      expect(solution.pvArea).toBeGreaterThan(0);
      expect(solution.batteryCapacity).toBeGreaterThan(0);
      expect(solution.totalMass).toBeGreaterThan(0);
      expect(solution.totalCost).toBeGreaterThan(0);
    });

    it('should return feasible solution when constraints are met', async () => {
      const requirements = {
        averagePowerLoad: 100,
        peakPowerLoad: 150,
        minEnergyMargin: 20,
        minBatterySOC: 20,
        eclipseDuration: 2.1,
        missionDuration: 10,
        maxTotalMass: 200,
        maxTotalCost: 20000000,
        concentratorId: 'Test Concentrator',
        pvCellId: 'Test PV Cell',
        batteryId: 'Test Battery'
      };

      const solution = await solveComponentSizing(
        requirements,
        mockConcentrator,
        mockPVCell,
        mockBattery
      );

      expect(solution.feasible).toBe(true);
      expect(solution.constraintViolations).toHaveLength(0);
    });

    it('should detect mass constraint violations', async () => {
      const requirements = {
        averagePowerLoad: 500,
        peakPowerLoad: 800,
        minEnergyMargin: 50,
        minBatterySOC: 30,
        eclipseDuration: 2.1,
        missionDuration: 10,
        maxTotalMass: 10, // Very low mass limit
        maxTotalCost: 50000000,
        concentratorId: 'Test Concentrator',
        pvCellId: 'Test PV Cell',
        batteryId: 'Test Battery'
      };

      const solution = await solveComponentSizing(
        requirements,
        mockConcentrator,
        mockPVCell,
        mockBattery
      );

      expect(solution.feasible).toBe(false);
      expect(solution.constraintViolations.some(v => v.includes('mass'))).toBe(true);
    });

    it('should work without concentrator', async () => {
      const requirements = {
        averagePowerLoad: 150,
        peakPowerLoad: 250,
        minEnergyMargin: 30,
        minBatterySOC: 20,
        eclipseDuration: 2.1,
        missionDuration: 10,
        maxTotalMass: 100,
        maxTotalCost: 10000000,
        concentratorId: null,
        pvCellId: 'Test PV Cell',
        batteryId: 'Test Battery'
      };

      const solution = await solveComponentSizing(
        requirements,
        null,
        mockPVCell,
        mockBattery
      );

      expect(solution).toBeDefined();
      expect(solution.concentratorArea).toBe(0);
      expect(solution.pvArea).toBeGreaterThan(0);
    });

    it('should calculate sensitivity metrics', async () => {
      const requirements = {
        averagePowerLoad: 150,
        peakPowerLoad: 250,
        minEnergyMargin: 30,
        minBatterySOC: 20,
        eclipseDuration: 2.1,
        missionDuration: 10,
        maxTotalMass: 200,
        maxTotalCost: 20000000,
        concentratorId: 'Test Concentrator',
        pvCellId: 'Test PV Cell',
        batteryId: 'Test Battery'
      };

      const solution = await solveComponentSizing(
        requirements,
        mockConcentrator,
        mockPVCell,
        mockBattery
      );

      expect(solution.sensitivity).toBeDefined();
      expect(solution.sensitivity.massMargin).toBeGreaterThanOrEqual(0);
      expect(solution.sensitivity.costMargin).toBeGreaterThanOrEqual(0);
      expect(solution.sensitivity.powerMargin).toBeDefined();
    });
  });

  describe('generateSizingRecommendations', () => {
    it('should generate recommendations for feasible solution', () => {
      const solution = {
        concentratorArea: 3,
        pvArea: 1,
        batteryCapacity: 8000,
        totalMass: 50,
        totalCost: 5000000,
        energyMargin: 35,
        minSOC: 20,
        feasible: true,
        constraintViolations: [],
        sensitivity: {
          massMargin: 50,
          costMargin: 50,
          powerMargin: 40
        }
      };

      const recommendations = generateSizingRecommendations(solution);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('✅'))).toBe(true);
    });

    it('should generate warnings for infeasible solution', () => {
      const solution = {
        concentratorArea: 3,
        pvArea: 1,
        batteryCapacity: 8000,
        totalMass: 150,
        totalCost: 15000000,
        energyMargin: 10,
        minSOC: 15,
        feasible: false,
        constraintViolations: ['Total mass exceeds limit'],
        sensitivity: {
          massMargin: -50,
          costMargin: -50,
          powerMargin: 5
        }
      };

      const recommendations = generateSizingRecommendations(solution);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('⚠️'))).toBe(true);
    });
  });
});
