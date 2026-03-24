import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { sizingScenarios, type InsertSizingScenario, type SizingScenario } from "../../drizzle/schema";

/**
 * Save a new sizing scenario
 */
export async function createSizingScenario(scenario: InsertSizingScenario): Promise<SizingScenario> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(sizingScenarios).values(scenario).$returningId();
  
  const [result] = await db
    .select()
    .from(sizingScenarios)
    .where(eq(sizingScenarios.id, inserted.id))
    .limit(1);
    
  if (!result) throw new Error("Failed to create sizing scenario");
  return result;
}

/**
 * Get all sizing scenarios for a user
 */
export async function getUserSizingScenarios(userId: number): Promise<SizingScenario[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(sizingScenarios)
    .where(eq(sizingScenarios.userId, userId))
    .orderBy(desc(sizingScenarios.createdAt));
}

/**
 * Get a single sizing scenario by ID
 */
export async function getSizingScenarioById(id: number, userId: number): Promise<SizingScenario | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [result] = await db
    .select()
    .from(sizingScenarios)
    .where(and(eq(sizingScenarios.id, id), eq(sizingScenarios.userId, userId)))
    .limit(1);

  return result;
}

/**
 * Update a sizing scenario
 */
export async function updateSizingScenario(
  id: number,
  userId: number,
  updates: Partial<InsertSizingScenario>
): Promise<SizingScenario | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(sizingScenarios)
    .set(updates)
    .where(and(eq(sizingScenarios.id, id), eq(sizingScenarios.userId, userId)));

  return getSizingScenarioById(id, userId);
}

/**
 * Delete a sizing scenario
 */
export async function deleteSizingScenario(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .delete(sizingScenarios)
    .where(and(eq(sizingScenarios.id, id), eq(sizingScenarios.userId, userId)));

  return true;
}

/**
 * Get multiple sizing scenarios by IDs for comparison
 */
export async function getSizingScenariosForComparison(
  ids: number[],
  userId: number
): Promise<SizingScenario[]> {
  const db = await getDb();
  if (!db || ids.length === 0) return [];

  // Fetch all scenarios and filter by user
  const results = await db
    .select()
    .from(sizingScenarios)
    .where(eq(sizingScenarios.userId, userId));

  return results.filter(s => ids.includes(s.id));
}
