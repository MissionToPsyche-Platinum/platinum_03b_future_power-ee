import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { costBenefitScenarios, type InsertCostBenefitScenario, type CostBenefitScenario } from "../../drizzle/schema";

/**
 * Save a new cost-benefit scenario
 */
export async function createCostBenefitScenario(scenario: InsertCostBenefitScenario): Promise<CostBenefitScenario> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(costBenefitScenarios).values(scenario).$returningId();
  
  const [result] = await db
    .select()
    .from(costBenefitScenarios)
    .where(eq(costBenefitScenarios.id, inserted.id))
    .limit(1);
    
  if (!result) throw new Error("Failed to create cost-benefit scenario");
  return result;
}

/**
 * Get all cost-benefit scenarios for a user
 */
export async function getUserCostBenefitScenarios(userId: number): Promise<CostBenefitScenario[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(costBenefitScenarios)
    .where(eq(costBenefitScenarios.userId, userId))
    .orderBy(desc(costBenefitScenarios.createdAt));
}

/**
 * Get a single cost-benefit scenario by ID
 */
export async function getCostBenefitScenarioById(id: number, userId: number): Promise<CostBenefitScenario | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [result] = await db
    .select()
    .from(costBenefitScenarios)
    .where(and(eq(costBenefitScenarios.id, id), eq(costBenefitScenarios.userId, userId)))
    .limit(1);

  return result;
}

/**
 * Update a cost-benefit scenario
 */
export async function updateCostBenefitScenario(
  id: number,
  userId: number,
  updates: Partial<InsertCostBenefitScenario>
): Promise<CostBenefitScenario | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(costBenefitScenarios)
    .set(updates)
    .where(and(eq(costBenefitScenarios.id, id), eq(costBenefitScenarios.userId, userId)));

  return getCostBenefitScenarioById(id, userId);
}

/**
 * Delete a cost-benefit scenario
 */
export async function deleteCostBenefitScenario(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(costBenefitScenarios)
    .where(and(eq(costBenefitScenarios.id, id), eq(costBenefitScenarios.userId, userId)));

  return true;
}

/**
 * Get multiple cost-benefit scenarios by IDs for comparison
 */
export async function getCostBenefitScenariosForComparison(
  ids: number[],
  userId: number
): Promise<CostBenefitScenario[]> {
  const db = await getDb();
  if (!db || ids.length === 0) return [];

  const results = await db
    .select()
    .from(costBenefitScenarios)
    .where(eq(costBenefitScenarios.userId, userId));

  return results.filter(s => ids.includes(s.id));
}
