/**
 * localStore.ts
 *
 * Provides a localStorage-backed store that mirrors the server-side
 * configurations/scenarios API. Used as a fallback when the user is not
 * authenticated so that Compare Configurations and Compare Scenarios work
 * without requiring a login.
 *
 * Data is stored under namespaced keys:
 *   psyche:configs      – saved power-system configurations
 *   psyche:sizing       – sizing scenarios
 *   psyche:costBenefit  – cost-benefit scenarios
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface LocalConfig {
  id: number;
  name: string;
  description: string | null;
  concentrator: string | null;
  pvCell: string;
  battery: string;
  concentratorArea: number;
  pvArea: number;
  batteryCapacity: number;
  baseLoad: number;
  durationHours: number;
  yearsOperation: number;
  lastSimulationId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalSizingScenario {
  id: number;
  name: string;
  description: string | null;
  notes: string | null;
  tags: string | null;
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
  createdBy: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalCostBenefitScenario {
  id: number;
  name: string;
  description: string | null;
  notes: string | null;
  tags: string | null;
  avgPower: number;
  peakPower: number;
  missionDuration: number;
  concentrator: string;
  pvCell: string;
  battery: string;
  resultsJson: string;
  createdBy: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const KEYS = {
  configs: "psyche:configs",
  sizing: "psyche:sizing",
  costBenefit: "psyche:costBenefit",
} as const;

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function nextId<T extends { id: number }>(items: T[]): number {
  return items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;
}

function now(): string {
  return new Date().toISOString();
}

// ── Configurations ─────────────────────────────────────────────────────────

export const localConfigs = {
  list(): LocalConfig[] {
    return readList<LocalConfig>(KEYS.configs);
  },

  save(input: Omit<LocalConfig, "id" | "createdAt" | "updatedAt">): LocalConfig {
    const items = readList<LocalConfig>(KEYS.configs);
    const record: LocalConfig = {
      ...input,
      id: nextId(items),
      createdAt: now(),
      updatedAt: now(),
    };
    writeList(KEYS.configs, [...items, record]);
    return record;
  },

  getById(id: number): LocalConfig | undefined {
    return readList<LocalConfig>(KEYS.configs).find((c) => c.id === id);
  },

  update(id: number, updates: Partial<Omit<LocalConfig, "id" | "createdAt">>): LocalConfig | undefined {
    const items = readList<LocalConfig>(KEYS.configs);
    const idx = items.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...updates, updatedAt: now() };
    writeList(KEYS.configs, items);
    return items[idx];
  },

  delete(id: number): void {
    const items = readList<LocalConfig>(KEYS.configs).filter((c) => c.id !== id);
    writeList(KEYS.configs, items);
  },
};

// ── Sizing Scenarios ───────────────────────────────────────────────────────

export const localSizing = {
  list(): LocalSizingScenario[] {
    return readList<LocalSizingScenario>(KEYS.sizing);
  },

  save(input: Omit<LocalSizingScenario, "id" | "createdAt" | "updatedAt" | "createdBy" | "lastModifiedBy">): LocalSizingScenario {
    const items = readList<LocalSizingScenario>(KEYS.sizing);
    const record: LocalSizingScenario = {
      ...input,
      id: nextId(items),
      createdBy: "Guest",
      lastModifiedBy: "Guest",
      createdAt: now(),
      updatedAt: now(),
    };
    writeList(KEYS.sizing, [...items, record]);
    return record;
  },

  getById(id: number): LocalSizingScenario | undefined {
    return readList<LocalSizingScenario>(KEYS.sizing).find((s) => s.id === id);
  },

  update(id: number, updates: Partial<Pick<LocalSizingScenario, "name" | "description" | "notes" | "tags">>): LocalSizingScenario | undefined {
    const items = readList<LocalSizingScenario>(KEYS.sizing);
    const idx = items.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...updates, lastModifiedBy: "Guest", updatedAt: now() };
    writeList(KEYS.sizing, items);
    return items[idx];
  },

  delete(id: number): void {
    const items = readList<LocalSizingScenario>(KEYS.sizing).filter((s) => s.id !== id);
    writeList(KEYS.sizing, items);
  },

  compare(ids: number[]): LocalSizingScenario[] {
    return readList<LocalSizingScenario>(KEYS.sizing).filter((s) => ids.includes(s.id));
  },
};

// ── Cost-Benefit Scenarios ─────────────────────────────────────────────────

export const localCostBenefit = {
  list(): LocalCostBenefitScenario[] {
    return readList<LocalCostBenefitScenario>(KEYS.costBenefit);
  },

  save(input: Omit<LocalCostBenefitScenario, "id" | "createdAt" | "updatedAt" | "createdBy" | "lastModifiedBy">): LocalCostBenefitScenario {
    const items = readList<LocalCostBenefitScenario>(KEYS.costBenefit);
    const record: LocalCostBenefitScenario = {
      ...input,
      id: nextId(items),
      createdBy: "Guest",
      lastModifiedBy: "Guest",
      createdAt: now(),
      updatedAt: now(),
    };
    writeList(KEYS.costBenefit, [...items, record]);
    return record;
  },

  getById(id: number): LocalCostBenefitScenario | undefined {
    return readList<LocalCostBenefitScenario>(KEYS.costBenefit).find((s) => s.id === id);
  },

  update(id: number, updates: Partial<Pick<LocalCostBenefitScenario, "name" | "description" | "notes" | "tags">>): LocalCostBenefitScenario | undefined {
    const items = readList<LocalCostBenefitScenario>(KEYS.costBenefit);
    const idx = items.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...updates, lastModifiedBy: "Guest", updatedAt: now() };
    writeList(KEYS.costBenefit, items);
    return items[idx];
  },

  delete(id: number): void {
    const items = readList<LocalCostBenefitScenario>(KEYS.costBenefit).filter((s) => s.id !== id);
    writeList(KEYS.costBenefit, items);
  },

  compare(ids: number[]): LocalCostBenefitScenario[] {
    return readList<LocalCostBenefitScenario>(KEYS.costBenefit).filter((s) => ids.includes(s.id));
  },
};
