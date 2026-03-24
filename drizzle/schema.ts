import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Simulation results table
 * Stores user-run simulations for history and comparison
 */
export const simulations = mysqlTable("simulations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  concentrator: varchar("concentrator", { length: 255 }).notNull(),
  pvCell: varchar("pvCell", { length: 255 }).notNull(),
  battery: varchar("battery", { length: 255 }).notNull(),
  concentratorArea: int("concentratorArea").default(3).notNull(),
  pvArea: int("pvArea").default(1).notNull(),
  batteryCapacity: int("batteryCapacity").default(8000).notNull(),
  baseLoad: int("baseLoad").default(100).notNull(),
  durationHours: int("durationHours").default(48).notNull(),
  yearsOperation: int("yearsOperation").default(0).notNull(),
  avgPowerGenerated: int("avgPowerGenerated").notNull(),
  maxPowerGenerated: int("maxPowerGenerated").notNull(),
  avgPowerConsumed: int("avgPowerConsumed").notNull(),
  minBatterySoc: int("minBatterySoc").notNull(), // Stored as percentage * 100
  maxBatterySoc: int("maxBatterySoc").notNull(), // Stored as percentage * 100
  finalBatterySoc: int("finalBatterySoc").notNull(), // Stored as percentage * 100
  energyGenerated: int("energyGenerated").notNull(),
  energyConsumed: int("energyConsumed").notNull(),
  energyBalance: int("energyBalance").notNull(),
  systemViable: int("systemViable").default(0).notNull(), // 0 or 1 (boolean)
  resultsJson: text("resultsJson").notNull(), // Full results as JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = typeof simulations.$inferInsert;

/**
 * Saved configurations table
 * Allows users to save and name their power system configurations for later comparison
 */
export const savedConfigurations = mysqlTable("savedConfigurations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  concentrator: varchar("concentrator", { length: 255 }),
  pvCell: varchar("pvCell", { length: 255 }).notNull(),
  battery: varchar("battery", { length: 255 }).notNull(),
  concentratorArea: int("concentratorArea").default(3).notNull(),
  pvArea: int("pvArea").default(1).notNull(),
  batteryCapacity: int("batteryCapacity").default(8000).notNull(),
  baseLoad: int("baseLoad").default(100).notNull(),
  durationHours: int("durationHours").default(48).notNull(),
  yearsOperation: int("yearsOperation").default(0).notNull(),
  // Store last simulation results for quick comparison
  lastSimulationId: int("lastSimulationId").references(() => simulations.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedConfiguration = typeof savedConfigurations.$inferSelect;
export type InsertSavedConfiguration = typeof savedConfigurations.$inferInsert;

/**
 * Sizing scenarios table
 * Stores saved component sizing configurations and results for comparison
 */
export const sizingScenarios = mysqlTable("sizingScenarios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  notes: text("notes"),
  tags: text("tags"), // Comma-separated tags
  createdBy: varchar("createdBy", { length: 255 }),
  lastModifiedBy: varchar("lastModifiedBy", { length: 255 }),
  lastModifiedAt: timestamp("lastModifiedAt").defaultNow().onUpdateNow(),
  
  // Input parameters
  avgPower: int("avgPower").notNull(), // W
  peakPower: int("peakPower").notNull(), // W
  energyMargin: int("energyMargin").notNull(), // %
  minSOC: int("minSOC").notNull(), // %
  eclipseDuration: int("eclipseDuration").notNull(), // hours * 100 (2.1 hours = 210)
  missionDuration: int("missionDuration").notNull(), // years
  maxMass: int("maxMass").notNull(), // kg
  maxCost: int("maxCost").notNull(), // dollars
  concentrator: varchar("concentrator", { length: 255 }).notNull(),
  pvCell: varchar("pvCell", { length: 255 }).notNull(),
  battery: varchar("battery", { length: 255 }).notNull(),
  
  // Results (stored as JSON for flexibility)
  resultsJson: text("resultsJson").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SizingScenario = typeof sizingScenarios.$inferSelect;
export type InsertSizingScenario = typeof sizingScenarios.$inferInsert;

/**
 * Cost-benefit scenarios table
 * Stores saved cost-benefit analysis configurations and results for comparison
 */
export const costBenefitScenarios = mysqlTable("costBenefitScenarios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  notes: text("notes"),
  tags: text("tags"), // Comma-separated tags
  createdBy: varchar("createdBy", { length: 255 }),
  lastModifiedBy: varchar("lastModifiedBy", { length: 255 }),
  lastModifiedAt: timestamp("lastModifiedAt").defaultNow().onUpdateNow(),
  
  // Input parameters
  avgPower: int("avgPower").notNull(), // W
  peakPower: int("peakPower").notNull(), // W
  missionDuration: int("missionDuration").notNull(), // years
  concentrator: varchar("concentrator", { length: 255 }).notNull(),
  pvCell: varchar("pvCell", { length: 255 }).notNull(),
  battery: varchar("battery", { length: 255 }).notNull(),
  
  // Results (stored as JSON for flexibility)
  resultsJson: text("resultsJson").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CostBenefitScenario = typeof costBenefitScenarios.$inferSelect;
export type InsertCostBenefitScenario = typeof costBenefitScenarios.$inferInsert;