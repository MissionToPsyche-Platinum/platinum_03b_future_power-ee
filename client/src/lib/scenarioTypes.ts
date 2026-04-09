/**
 * scenarioTypes.ts
 *
 * Shared, loose scenario interfaces that are satisfied by both:
 *  - Drizzle-inferred DB types (SizingScenario, CostBenefitScenario)
 *  - LocalSizingScenario / LocalCostBenefitScenario from localStore.ts
 *
 * Use these types in PDF generators, Excel exporters, and comparison charts
 * so that unauthenticated (localStorage) data can flow through the same
 * code paths as authenticated (database) data.
 */

export interface SizingScenarioLike {
  id: number;
  name: string;
  description?: string | null;
  notes?: string | null;
  tags?: string | null;
  avgPower: number;
  peakPower: number;
  energyMargin: number;
  minSOC: number;
  eclipseDuration: number;
  missionDuration: number;
  maxMass: number;
  maxCost: number;
  concentrator: string;
  pvCell: string;
  battery: string;
  resultsJson: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // DB-only fields (optional so local records don't need them)
  userId?: number;
  createdBy?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedAt?: Date | string | null;
}

export interface CostBenefitScenarioLike {
  id: number;
  name: string;
  description?: string | null;
  notes?: string | null;
  tags?: string | null;
  avgPower: number;
  peakPower: number;
  missionDuration: number;
  concentrator: string;
  pvCell: string;
  battery: string;
  resultsJson: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // DB-only fields (optional so local records don't need them)
  userId?: number;
  createdBy?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedAt?: Date | string | null;
}
