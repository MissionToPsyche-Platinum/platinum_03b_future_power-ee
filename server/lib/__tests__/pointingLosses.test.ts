import { describe, it, expect } from 'vitest';
import {
  calculatePointingLosses,
  applyPointingLosses,
  getTypicalPointingParams,
} from '../pointingLosses';

describe('Solar Array Pointing Losses', () => {
  describe('calculatePointingLosses', () => {
    it('should calculate pointing losses for flagship spacecraft', () => {
      const params = getTypicalPointingParams('flagship');
      const result = calculatePointingLosses(params);

      expect(result.avgOffPointingAngle).toBeGreaterThan(0);
      expect(result.avgOffPointingAngle).toBeLessThan(1); // Flagship should have <1° error
      expect(result.maxOffPointingAngle).toBeGreaterThan(result.avgOffPointingAngle);
      expect(result.avgCosineLoss).toBeGreaterThan(0.99); // Very small losses for flagship
      expect(result.avgCosineLoss).toBeLessThanOrEqual(1);
    });

    it('should show worse pointing for smallsat vs flagship', () => {
      const flagshipParams = getTypicalPointingParams('flagship');
      const smallsatParams = getTypicalPointingParams('smallsat');

      const flagshipResult = calculatePointingLosses(flagshipParams);
      const smallsatResult = calculatePointingLosses(smallsatParams);

      expect(smallsatResult.avgOffPointingAngle).toBeGreaterThan(flagshipResult.avgOffPointingAngle);
      expect(smallsatResult.avgCosineLoss).toBeLessThan(flagshipResult.avgCosineLoss);
    });

    it('should show degraded pointing during science phase', () => {
      const cruiseParams = { attitudeAccuracy: 1.0, dualAxisGimbal: true, missionPhase: 'cruise' as const };
      const scienceParams = { ...cruiseParams, missionPhase: 'science' as const };

      const cruiseResult = calculatePointingLosses(cruiseParams);
      const scienceResult = calculatePointingLosses(scienceParams);

      expect(scienceResult.avgOffPointingAngle).toBeGreaterThan(cruiseResult.avgOffPointingAngle);
      expect(scienceResult.avgCosineLoss).toBeLessThan(cruiseResult.avgCosineLoss);
    });

    it('should show better compensation with dual-axis gimbal', () => {
      const singleAxisParams = { attitudeAccuracy: 1.0, dualAxisGimbal: false, missionPhase: 'cruise' as const };
      const dualAxisParams = { ...singleAxisParams, dualAxisGimbal: true };

      const singleAxisResult = calculatePointingLosses(singleAxisParams);
      const dualAxisResult = calculatePointingLosses(dualAxisParams);

      expect(dualAxisResult.avgOffPointingAngle).toBeLessThan(singleAxisResult.avgOffPointingAngle);
      expect(dualAxisResult.avgCosineLoss).toBeGreaterThan(singleAxisResult.avgCosineLoss);
    });

    it('should calculate realistic large error percentage', () => {
      const params = getTypicalPointingParams('flagship');
      const result = calculatePointingLosses(params);

      expect(result.largeErrorPercentage).toBeGreaterThanOrEqual(0);
      expect(result.largeErrorPercentage).toBeLessThan(5); // Flagship should rarely have >5° errors
    });
  });

  describe('applyPointingLosses', () => {
    it('should reduce power output based on pointing losses', () => {
      const idealPower = 1000; // W
      const pointingLosses = {
        avgOffPointingAngle: 1.0,
        maxOffPointingAngle: 3.0,
        avgCosineLoss: 0.9998, // ~1° off-pointing
        largeErrorPercentage: 0.1,
      };

      const actualPower = applyPointingLosses(idealPower, pointingLosses);

      expect(actualPower).toBeLessThan(idealPower);
      expect(actualPower).toBeGreaterThan(idealPower * 0.99); // Loss should be small for 1° error
      expect(actualPower).toBeCloseTo(idealPower * pointingLosses.avgCosineLoss, 1);
    });

    it('should show larger losses for worse pointing', () => {
      const idealPower = 1000; // W
      const goodPointing = {
        avgOffPointingAngle: 0.5,
        maxOffPointingAngle: 1.5,
        avgCosineLoss: 0.9999,
        largeErrorPercentage: 0.01,
      };
      const poorPointing = {
        avgOffPointingAngle: 2.0,
        maxOffPointingAngle: 6.0,
        avgCosineLoss: 0.9988,
        largeErrorPercentage: 1.0,
      };

      const powerWithGoodPointing = applyPointingLosses(idealPower, goodPointing);
      const powerWithPoorPointing = applyPointingLosses(idealPower, poorPointing);

      expect(powerWithPoorPointing).toBeLessThan(powerWithGoodPointing);
    });
  });

  describe('getTypicalPointingParams', () => {
    it('should return valid parameters for all spacecraft classes', () => {
      const classes: Array<'flagship' | 'new-frontiers' | 'discovery' | 'smallsat'> = [
        'flagship',
        'new-frontiers',
        'discovery',
        'smallsat',
      ];

      classes.forEach((spacecraftClass) => {
        const params = getTypicalPointingParams(spacecraftClass);

        expect(params.attitudeAccuracy).toBeGreaterThan(0);
        expect(params.attitudeAccuracy).toBeLessThan(5);
        expect(typeof params.dualAxisGimbal).toBe('boolean');
        expect(['cruise', 'science']).toContain(params.missionPhase);
      });
    });

    it('should show increasing attitude accuracy from flagship to smallsat', () => {
      const flagship = getTypicalPointingParams('flagship');
      const newFrontiers = getTypicalPointingParams('new-frontiers');
      const discovery = getTypicalPointingParams('discovery');
      const smallsat = getTypicalPointingParams('smallsat');

      expect(flagship.attitudeAccuracy).toBeLessThan(newFrontiers.attitudeAccuracy);
      expect(newFrontiers.attitudeAccuracy).toBeLessThan(discovery.attitudeAccuracy);
      expect(discovery.attitudeAccuracy).toBeLessThan(smallsat.attitudeAccuracy);
    });
  });

  describe('Integration with power simulation', () => {
    it('should produce realistic pointing loss factors for Psyche mission', () => {
      // Psyche is a Discovery-class mission (Discovery Mission #14)
      // Solar arrays are single-axis gimbaled; attitude accuracy ~1.5°
      const params = getTypicalPointingParams('discovery');
      const result = calculatePointingLosses(params);

      // For Psyche mission (Discovery class), expect:
      // - Moderate attitude control (single-axis gimbal, ~1.5° accuracy)
      // - Small but non-negligible power losses (<2%)
      expect(result.avgOffPointingAngle).toBeLessThan(2.0);
      expect(result.avgCosineLoss).toBeGreaterThan(0.99);

      // Apply to typical Psyche power level at asteroid (~2.7kW at 3.1 AU)
      const psychePower = 2700; // W
      const actualPower = applyPointingLosses(psychePower, result);
      const lossPercent = ((psychePower - actualPower) / psychePower) * 100;

      expect(lossPercent).toBeLessThan(2.0); // <2% loss for Discovery-class mission
    });
  });
});
