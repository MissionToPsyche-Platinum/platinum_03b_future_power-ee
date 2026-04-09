/**
 * Solar Array Pointing Losses Model
 * 
 * Models spacecraft attitude dynamics and solar array gimbal limitations
 * to calculate realistic off-pointing losses in power generation.
 * 
 * Based on:
 * - NASA GSFC "Spacecraft Power Systems" handbook
 * - Typical spacecraft attitude control accuracy: ±0.5° to ±2°
 * - Solar array gimbal limitations: ±180° azimuth, ±90° elevation
 */

export interface PointingLossParams {
  /** Attitude control accuracy in degrees (typical: 0.5-2.0) */
  attitudeAccuracy: number;
  /** Whether solar array has dual-axis gimbal (true) or single-axis (false) */
  dualAxisGimbal: boolean;
  /** Mission phase: 'cruise' (better pointing) or 'science' (degraded pointing) */
  missionPhase: 'cruise' | 'science';
}

export interface PointingLossResult {
  /** Average off-pointing angle in degrees */
  avgOffPointingAngle: number;
  /** Maximum off-pointing angle in degrees */
  maxOffPointingAngle: number;
  /** Average cosine loss factor (0-1, where 1 = perfect pointing) */
  avgCosineLoss: number;
  /** Percentage of time with pointing errors > 5° */
  largeErrorPercentage: number;
}

/**
 * Calculate solar array pointing losses over mission duration
 */
export function calculatePointingLosses(
  params: PointingLossParams
): PointingLossResult {
  const { attitudeAccuracy, dualAxisGimbal, missionPhase } = params;

  // Mission phase affects pointing accuracy
  // Cruise: better pointing (focused on sun tracking)
  // Science: degraded pointing (prioritizing instrument pointing)
  const phaseDegradation = missionPhase === 'science' ? 1.5 : 1.0;
  const effectiveAccuracy = attitudeAccuracy * phaseDegradation;

  // Dual-axis gimbals can compensate for spacecraft attitude errors
  // Single-axis gimbals have residual cross-axis errors
  const gimbalCompensation = dualAxisGimbal ? 0.8 : 0.5;
  const residualError = effectiveAccuracy * (1 - gimbalCompensation);

  // Statistical model: off-pointing angles follow normal distribution
  // RMS error = residualError, peak errors can be 3x RMS
  const avgOffPointingAngle = residualError * 0.8; // RMS to mean conversion
  const maxOffPointingAngle = residualError * 3.0; // 3-sigma peak

  // Cosine loss: P_actual = P_ideal * cos(θ)
  // For small angles: cos(θ) ≈ 1 - θ²/2 (θ in radians)
  const avgAngleRad = (avgOffPointingAngle * Math.PI) / 180;
  const avgCosineLoss = Math.cos(avgAngleRad);

  // Percentage of time with large errors (>5°)
  // Using normal distribution: P(|X| > 5°) where σ = residualError
  const largeErrorThreshold = 5.0;
  const sigmaRatio = largeErrorThreshold / residualError;
  // Approximate: P(|X| > kσ) ≈ 2 * (1 - Φ(k)) where Φ is CDF
  // For k=5/σ, use simplified approximation
  const largeErrorPercentage = Math.max(
    0,
    100 * 2 * Math.exp(-0.5 * sigmaRatio * sigmaRatio) / (sigmaRatio * Math.sqrt(2 * Math.PI))
  );

  return {
    avgOffPointingAngle,
    maxOffPointingAngle,
    avgCosineLoss,
    largeErrorPercentage,
  };
}

/**
 * Apply pointing losses to solar power generation
 * 
 * @param idealPower - Power generation assuming perfect sun-pointing (W)
 * @param pointingLosses - Pointing loss characteristics
 * @returns Actual power after accounting for pointing errors (W)
 */
export function applyPointingLosses(
  idealPower: number,
  pointingLosses: PointingLossResult
): number {
  return idealPower * pointingLosses.avgCosineLoss;
}

/**
 * Get typical pointing loss parameters for different spacecraft classes
 */
export function getTypicalPointingParams(
  spacecraftClass: 'flagship' | 'new-frontiers' | 'discovery' | 'smallsat'
): PointingLossParams {
  switch (spacecraftClass) {
    case 'flagship':
      // Large missions (e.g., Cassini, Europa Clipper): excellent attitude control
      return {
        attitudeAccuracy: 0.5,
        dualAxisGimbal: true,
        missionPhase: 'cruise',
      };
    case 'new-frontiers':
      // Medium missions (e.g., New Horizons, Juno): good attitude control
      return {
        attitudeAccuracy: 1.0,
        dualAxisGimbal: true,
        missionPhase: 'cruise',
      };
    case 'discovery':
      // Smaller missions: moderate attitude control
      return {
        attitudeAccuracy: 1.5,
        dualAxisGimbal: false,
        missionPhase: 'cruise',
      };
    case 'smallsat':
      // CubeSats/SmallSats: limited attitude control
      return {
        attitudeAccuracy: 2.0,
        dualAxisGimbal: false,
        missionPhase: 'cruise',
      };
  }
}
