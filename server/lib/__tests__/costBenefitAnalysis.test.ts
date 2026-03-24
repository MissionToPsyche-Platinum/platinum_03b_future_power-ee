/**
 * Unit tests for Cost-Benefit Analysis
 */

import { describe, it, expect } from 'vitest';
import {
  calculateLifecycleCost,
  calculateMassBudget,
  assessTRLRisk,
  performCostBenefitAnalysis,
  compareConfigurations
} from '../costBenefitAnalysis';
import type { Concentrator, PVCell, Battery } from '../../types';

describe('Cost-Benefit Analysis', () => {
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

  const mockConfig = {
    concentrator: mockConcentrator,
    pvCell: mockPVCell,
    battery: mockBattery,
    concentratorArea: 3,
    pvArea: 1,
    batteryCapacity: 8000,
    averagePower: 150,
    peakPower: 250,
    energyMargin: 30,
    missionDuration: 10
  };

  describe('calculateLifecycleCost', () => {
    it('should calculate all cost components', () => {
      const lifecycle = calculateLifecycleCost(mockConfig);

      expect(lifecycle.developmentCost).toBeGreaterThan(0);
      expect(lifecycle.testingCost).toBeGreaterThan(0);
      expect(lifecycle.qualificationCost).toBeGreaterThan(0);
      expect(lifecycle.componentCost).toBeGreaterThan(0);
      expect(lifecycle.integrationCost).toBeGreaterThan(0);
      expect(lifecycle.launchCost).toBeGreaterThan(0);
    });

    it('should calculate total lifecycle cost', () => {
      const lifecycle = calculateLifecycleCost(mockConfig);

      expect(lifecycle.totalLifecycle).toBe(
        lifecycle.totalNonRecurring + lifecycle.totalRecurring
      );
    });

    it('should calculate cost metrics', () => {
      const lifecycle = calculateLifecycleCost(mockConfig);

      expect(lifecycle.costPerWatt).toBeGreaterThan(0);
      expect(lifecycle.costPerKg).toBeGreaterThan(0);
      expect(lifecycle.costPerYear).toBe(lifecycle.totalLifecycle / mockConfig.missionDuration);
    });

    it('should scale development costs with TRL', () => {
      const lowTRLConfig = {
        ...mockConfig,
        concentrator: { ...mockConcentrator, trl: 4 },
        pvCell: { ...mockPVCell, trl: 4 },
        battery: { ...mockBattery, trl: 4 }
      };

      const highTRLCost = calculateLifecycleCost(mockConfig);
      const lowTRLCost = calculateLifecycleCost(lowTRLConfig);

      expect(lowTRLCost.developmentCost).toBeGreaterThan(highTRLCost.developmentCost);
    });
  });

  describe('calculateMassBudget', () => {
    it('should calculate component masses', () => {
      const mass = calculateMassBudget(mockConfig);

      expect(mass.concentratorMass).toBeGreaterThan(0);
      expect(mass.pvMass).toBeGreaterThan(0);
      expect(mass.batteryMass).toBeGreaterThan(0);
    });

    it('should include structure and harness mass', () => {
      const mass = calculateMassBudget(mockConfig);

      expect(mass.structureMass).toBeGreaterThan(0);
      expect(mass.harnessMass).toBeGreaterThan(0);
    });

    it('should include contingency margin', () => {
      const mass = calculateMassBudget(mockConfig);

      expect(mass.contingencyMass).toBeGreaterThan(0);
    });

    it('should calculate total mass correctly', () => {
      const mass = calculateMassBudget(mockConfig);

      const expectedTotal = 
        mass.concentratorMass +
        mass.pvMass +
        mass.batteryMass +
        mass.structureMass +
        mass.harnessMass +
        mass.contingencyMass;

      expect(mass.totalMass).toBeCloseTo(expectedTotal, 1);
    });

    it('should calculate power-to-mass ratio', () => {
      const mass = calculateMassBudget(mockConfig);

      expect(mass.powerToMassRatio).toBe(mockConfig.averagePower / mass.totalMass);
    });
  });

  describe('assessTRLRisk', () => {
    it('should identify system TRL as minimum component TRL', () => {
      const config = {
        ...mockConfig,
        concentrator: { ...mockConcentrator, trl: 7 },
        pvCell: { ...mockPVCell, trl: 8 },
        battery: { ...mockBattery, trl: 9 }
      };

      const risk = assessTRLRisk(config);

      expect(risk.systemTRL).toBe(7);
    });

    it('should classify risk levels correctly', () => {
      const highTRLConfig = {
        ...mockConfig,
        concentrator: { ...mockConcentrator, trl: 9 },
        pvCell: { ...mockPVCell, trl: 9 },
        battery: { ...mockBattery, trl: 9 }
      };

      const lowTRLConfig = {
        ...mockConfig,
        concentrator: { ...mockConcentrator, trl: 3 },
        pvCell: { ...mockPVCell, trl: 3 },
        battery: { ...mockBattery, trl: 3 }
      };

      const highRisk = assessTRLRisk(highTRLConfig);
      const lowRisk = assessTRLRisk(lowTRLConfig);

      expect(highRisk.riskLevel).toBe('Low');
      expect(lowRisk.riskLevel).toBe('Very High');
    });

    it('should estimate development time based on TRL', () => {
      const trl5Config = {
        ...mockConfig,
        concentrator: { ...mockConcentrator, trl: 5 },
        pvCell: { ...mockPVCell, trl: 5 },
        battery: { ...mockBattery, trl: 5 }
      };

      const risk = assessTRLRisk(trl5Config);

      expect(risk.developmentTime).toBeGreaterThan(0);
      expect(risk.developmentTime).toBe((9 - 5) * 1.5);
    });

    it('should generate recommendations', () => {
      const risk = assessTRLRisk(mockConfig);

      expect(risk.recommendations).toBeDefined();
      expect(risk.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('performCostBenefitAnalysis', () => {
    it('should perform complete analysis', () => {
      const analysis = performCostBenefitAnalysis(mockConfig);

      expect(analysis.lifecycle).toBeDefined();
      expect(analysis.mass).toBeDefined();
      expect(analysis.trl).toBeDefined();
      expect(analysis.performanceScore).toBeGreaterThanOrEqual(0);
      expect(analysis.performanceScore).toBeLessThanOrEqual(100);
    });

    it('should calculate cost effectiveness', () => {
      const analysis = performCostBenefitAnalysis(mockConfig);

      expect(analysis.costEffectiveness).toBeGreaterThan(0);
    });

    it('should calculate risk-adjusted value', () => {
      const analysis = performCostBenefitAnalysis(mockConfig);

      expect(analysis.riskAdjustedValue).toBeGreaterThan(0);
      expect(analysis.riskAdjustedValue).toBeLessThanOrEqual(analysis.performanceScore);
    });

    it('should generate overall recommendation', () => {
      const analysis = performCostBenefitAnalysis(mockConfig);

      expect(analysis.recommendation).toBeDefined();
      expect(analysis.recommendation.length).toBeGreaterThan(0);
    });

    it('should identify trade-offs', () => {
      const analysis = performCostBenefitAnalysis(mockConfig);

      expect(analysis.tradeoffs).toBeDefined();
      expect(analysis.tradeoffs.length).toBeGreaterThan(0);
    });
  });

  describe('compareConfigurations', () => {
    it('should compare multiple configurations', () => {
      const config1 = {
        name: 'Config 1',
        analysis: performCostBenefitAnalysis(mockConfig)
      };

      const config2 = {
        name: 'Config 2',
        analysis: performCostBenefitAnalysis({
          ...mockConfig,
          averagePower: 200,
          energyMargin: 40
        })
      };

      const comparison = compareConfigurations([config1, config2]);

      expect(comparison.bestPerformance).toBeDefined();
      expect(comparison.bestCost).toBeDefined();
      expect(comparison.bestRisk).toBeDefined();
      expect(comparison.bestValue).toBeDefined();
      expect(comparison.summary).toBeDefined();
    });

    it('should handle empty configuration list', () => {
      const comparison = compareConfigurations([]);

      expect(comparison.bestPerformance).toBe('N/A');
      expect(comparison.bestCost).toBe('N/A');
      expect(comparison.bestRisk).toBe('N/A');
      expect(comparison.bestValue).toBe('N/A');
    });
  });
});
