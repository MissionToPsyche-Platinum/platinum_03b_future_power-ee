/**
 * Adaptive Time-Stepping Integration
 * 
 * Implements Runge-Kutta 4/5 (Dormand-Prince) method with adaptive step size control
 * for efficient and accurate numerical integration of power system dynamics.
 * 
 * References:
 * - Dormand, J. R., & Prince, P. J. (1980). A family of embedded Runge-Kutta formulae
 * - Hairer, E., et al. (1993). Solving Ordinary Differential Equations I
 */

/**
 * State vector for power system
 */
export interface PowerSystemState {
  /** Battery state of charge (0-1) */
  soc: number;
  /** Battery voltage (V) */
  voltage: number;
  /** System temperature (K) */
  temperature: number;
}

/**
 * Derivative function type
 */
export type DerivativeFunction = (
  time: number,
  state: PowerSystemState,
  params: any
) => PowerSystemState;

/**
 * Adaptive step size controller
 */
export class AdaptiveStepController {
  private minStep: number;
  private maxStep: number;
  private tolerance: number;
  private safetyFactor: number;
  
  constructor(
    minStep: number = 0.001, // 0.001 hours = 3.6 seconds
    maxStep: number = 1.0, // 1 hour
    tolerance: number = 1e-6,
    safetyFactor: number = 0.9
  ) {
    this.minStep = minStep;
    this.maxStep = maxStep;
    this.tolerance = tolerance;
    this.safetyFactor = safetyFactor;
  }
  
  /**
   * Calculate optimal step size based on error estimate
   * 
   * @param currentStep - Current step size
   * @param error - Estimated local truncation error
   * @returns New step size
   */
  calculateStepSize(currentStep: number, error: number): number {
    if (error === 0) {
      // No error, use maximum step
      return this.maxStep;
    }
    
    // Step size adjustment formula from Dormand-Prince
    // h_new = h_old * safety * (tol / error)^(1/5)
    const errorRatio = this.tolerance / error;
    const stepMultiplier = this.safetyFactor * Math.pow(errorRatio, 0.2);
    
    // Limit step size changes to prevent oscillation
    const clampedMultiplier = Math.max(0.2, Math.min(5.0, stepMultiplier));
    
    const newStep = currentStep * clampedMultiplier;
    
    // Apply hard limits
    return Math.max(this.minStep, Math.min(this.maxStep, newStep));
  }
  
  /**
   * Check if step should be accepted based on error
   * 
   * @param error - Estimated local truncation error
   * @returns True if step is acceptable
   */
  acceptStep(error: number): boolean {
    return error <= this.tolerance;
  }
}

/**
 * Runge-Kutta 4/5 (Dormand-Prince) coefficients
 */
const RK45_COEFFICIENTS = {
  // Butcher tableau for Dormand-Prince method
  a: [
    [],
    [1/5],
    [3/40, 9/40],
    [44/45, -56/15, 32/9],
    [19372/6561, -25360/2187, 64448/6561, -212/729],
    [9017/3168, -355/33, 46732/5247, 49/176, -5103/18656],
  ],
  b4: [35/384, 0, 500/1113, 125/192, -2187/6784, 11/84], // 4th order
  b5: [5179/57600, 0, 7571/16695, 393/640, -92097/339200, 187/2100, 1/40], // 5th order
  c: [0, 1/5, 3/10, 4/5, 8/9, 1],
};

/**
 * Add two state vectors
 */
function addStates(s1: PowerSystemState, s2: PowerSystemState): PowerSystemState {
  return {
    soc: s1.soc + s2.soc,
    voltage: s1.voltage + s2.voltage,
    temperature: s1.temperature + s2.temperature,
  };
}

/**
 * Multiply state vector by scalar
 */
function scaleState(s: PowerSystemState, factor: number): PowerSystemState {
  return {
    soc: s.soc * factor,
    voltage: s.voltage * factor,
    temperature: s.temperature * factor,
  };
}

/**
 * Calculate norm of state vector (for error estimation)
 */
function stateNorm(s: PowerSystemState): number {
  return Math.sqrt(s.soc ** 2 + s.voltage ** 2 / 100 + s.temperature ** 2 / 10000);
}

/**
 * Subtract two state vectors
 */
function subtractStates(s1: PowerSystemState, s2: PowerSystemState): PowerSystemState {
  return {
    soc: s1.soc - s2.soc,
    voltage: s1.voltage - s2.voltage,
    temperature: s1.temperature - s2.temperature,
  };
}

/**
 * Perform one RK45 integration step with error estimate
 * 
 * @param f - Derivative function
 * @param t - Current time
 * @param y - Current state
 * @param h - Step size
 * @param params - Additional parameters for derivative function
 * @returns Object with new state (4th and 5th order) and error estimate
 */
export function rk45Step(
  f: DerivativeFunction,
  t: number,
  y: PowerSystemState,
  h: number,
  params: any
): {
  y4: PowerSystemState; // 4th order solution
  y5: PowerSystemState; // 5th order solution
  error: number; // Error estimate
} {
  const { a, b4, b5, c } = RK45_COEFFICIENTS;
  
  // Calculate k values (slopes at different points)
  const k: PowerSystemState[] = [];
  
  // k1 = f(t, y)
  k[0] = f(t, y, params);
  
  // k2 = f(t + c1*h, y + h*(a10*k1))
  k[1] = f(
    t + c[1] * h,
    addStates(y, scaleState(k[0], h * a[1][0])),
    params
  );
  
  // k3 = f(t + c2*h, y + h*(a20*k1 + a21*k2))
  k[2] = f(
    t + c[2] * h,
    addStates(
      addStates(y, scaleState(k[0], h * a[2][0])),
      scaleState(k[1], h * a[2][1])
    ),
    params
  );
  
  // k4 = f(t + c3*h, y + h*(a30*k1 + a31*k2 + a32*k3))
  k[3] = f(
    t + c[3] * h,
    addStates(
      addStates(
        addStates(y, scaleState(k[0], h * a[3][0])),
        scaleState(k[1], h * a[3][1])
      ),
      scaleState(k[2], h * a[3][2])
    ),
    params
  );
  
  // k5
  k[4] = f(
    t + c[4] * h,
    addStates(
      addStates(
        addStates(
          addStates(y, scaleState(k[0], h * a[4][0])),
          scaleState(k[1], h * a[4][1])
        ),
        scaleState(k[2], h * a[4][2])
      ),
      scaleState(k[3], h * a[4][3])
    ),
    params
  );
  
  // k6
  k[5] = f(
    t + c[5] * h,
    addStates(
      addStates(
        addStates(
          addStates(
            addStates(y, scaleState(k[0], h * a[5][0])),
            scaleState(k[1], h * a[5][1])
          ),
          scaleState(k[2], h * a[5][2])
        ),
        scaleState(k[3], h * a[5][3])
      ),
      scaleState(k[4], h * a[5][4])
    ),
    params
  );
  
  // Calculate 4th order solution
  let y4 = y;
  for (let i = 0; i < 6; i++) {
    y4 = addStates(y4, scaleState(k[i], h * b4[i]));
  }
  
  // Calculate 5th order solution
  let y5 = y;
  for (let i = 0; i < 7; i++) {
    if (i < 6) {
      y5 = addStates(y5, scaleState(k[i], h * b5[i]));
    }
  }
  
  // Error estimate = ||y5 - y4||
  const errorState = subtractStates(y5, y4);
  const error = stateNorm(errorState);
  
  return { y4, y5, error };
}

/**
 * Integrate ODE with adaptive time-stepping
 * 
 * @param f - Derivative function
 * @param t0 - Initial time
 * @param tf - Final time
 * @param y0 - Initial state
 * @param params - Additional parameters for derivative function
 * @param controller - Step size controller
 * @returns Arrays of time points and states
 */
export function integrateAdaptive(
  f: DerivativeFunction,
  t0: number,
  tf: number,
  y0: PowerSystemState,
  params: any,
  controller: AdaptiveStepController = new AdaptiveStepController()
): {
  t: number[];
  y: PowerSystemState[];
  stats: {
    totalSteps: number;
    acceptedSteps: number;
    rejectedSteps: number;
    avgStepSize: number;
    minStepSize: number;
    maxStepSize: number;
  };
} {
  const t: number[] = [t0];
  const y: PowerSystemState[] = [y0];
  
  let currentTime = t0;
  let currentState = y0;
  let currentStep = 0.1; // Initial step size (hours)
  
  let totalSteps = 0;
  let acceptedSteps = 0;
  let rejectedSteps = 0;
  let minStepSize = currentStep;
  let maxStepSize = currentStep;
  let totalStepSize = 0;
  
  while (currentTime < tf) {
    // Adjust step size to not overshoot final time
    const remainingTime = tf - currentTime;
    const stepSize = Math.min(currentStep, remainingTime);
    
    // Perform RK45 step
    const { y4, y5, error } = rk45Step(f, currentTime, currentState, stepSize, params);
    
    totalSteps++;
    
    // Check if step is acceptable
    if (controller.acceptStep(error)) {
      // Accept step (use 5th order solution for better accuracy)
      currentTime += stepSize;
      currentState = y5;
      
      t.push(currentTime);
      y.push(currentState);
      
      acceptedSteps++;
      totalStepSize += stepSize;
      minStepSize = Math.min(minStepSize, stepSize);
      maxStepSize = Math.max(maxStepSize, stepSize);
    } else {
      // Reject step
      rejectedSteps++;
    }
    
    // Calculate new step size for next iteration
    currentStep = controller.calculateStepSize(stepSize, error);
  }
  
  return {
    t,
    y,
    stats: {
      totalSteps,
      acceptedSteps,
      rejectedSteps,
      avgStepSize: acceptedSteps > 0 ? totalStepSize / acceptedSteps : 0,
      minStepSize,
      maxStepSize,
    },
  };
}

/**
 * Detect eclipse transitions for event-based refinement
 * Eclipse transitions require smaller time steps for accuracy
 * 
 * @param sunAngle - Current sun angle (radians)
 * @param prevSunAngle - Previous sun angle (radians)
 * @returns True if eclipse transition detected
 */
export function detectEclipseTransition(sunAngle: number, prevSunAngle: number): boolean {
  const eclipseThreshold = Math.PI / 2; // 90 degrees
  
  // Check if crossing into or out of eclipse
  const wasInSunlight = Math.cos(prevSunAngle) > 0;
  const isInSunlight = Math.cos(sunAngle) > 0;
  
  return wasInSunlight !== isInSunlight;
}

/**
 * Create adaptive step controller with event detection
 * Uses smaller steps during eclipse transitions
 * 
 * @param baseController - Base step size controller
 * @param eclipseStepFactor - Step size reduction factor during eclipse (default 0.1)
 * @returns Modified controller
 */
export function createEventAwareController(
  baseController: AdaptiveStepController,
  eclipseStepFactor: number = 0.1
): AdaptiveStepController {
  // Return a controller with tighter tolerance for eclipse events
  return new AdaptiveStepController(
    0.0001, // Smaller min step for eclipse transitions
    baseController['maxStep'],
    baseController['tolerance'] * eclipseStepFactor,
    baseController['safetyFactor']
  );
}
