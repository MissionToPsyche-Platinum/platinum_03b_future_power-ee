import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertSimulation, InsertSavedConfiguration, users, simulations, savedConfigurations } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Save simulation results to database
 */
export async function saveSimulation(simulation: InsertSimulation) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save simulation: database not available");
    return null;
  }

  try {
    const result = await db.insert(simulations).values(simulation);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save simulation:", error);
    throw error;
  }
}

/**
 * Get user's simulation history
 */
export async function getUserSimulations(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get simulations: database not available");
    return [];
  }

  try {
    const results = await db
      .select()
      .from(simulations)
      .where(eq(simulations.userId, userId))
      .orderBy(desc(simulations.createdAt))
      .limit(limit);
    return results;
  } catch (error) {
    console.error("[Database] Failed to get simulations:", error);
    throw error;
  }
}

/**
 * Get simulation by ID
 */
export async function getSimulationById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get simulation: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(simulations)
      .where(eq(simulations.id, id))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get simulation:", error);
    throw error;
  }
}

/**
 * Save a new configuration
 */
export async function saveSavedConfiguration(config: InsertSavedConfiguration) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save configuration: database not available");
    return null;
  }

  try {
    const result = await db.insert(savedConfigurations).values(config);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save configuration:", error);
    throw error;
  }
}

/**
 * Get user's saved configurations
 */
export async function getUserSavedConfigurations(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get configurations: database not available");
    return [];
  }

  try {
    const results = await db
      .select()
      .from(savedConfigurations)
      .where(eq(savedConfigurations.userId, userId))
      .orderBy(desc(savedConfigurations.createdAt));
    return results;
  } catch (error) {
    console.error("[Database] Failed to get configurations:", error);
    throw error;
  }
}

/**
 * Get saved configuration by ID
 */
export async function getSavedConfigurationById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get configuration: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(savedConfigurations)
      .where(eq(savedConfigurations.id, id))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get configuration:", error);
    throw error;
  }
}

/**
 * Update saved configuration
 */
export async function updateSavedConfiguration(id: number, config: Partial<InsertSavedConfiguration>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update configuration: database not available");
    return null;
  }

  try {
    const result = await db
      .update(savedConfigurations)
      .set(config)
      .where(eq(savedConfigurations.id, id));
    return result;
  } catch (error) {
    console.error("[Database] Failed to update configuration:", error);
    throw error;
  }
}

/**
 * Delete saved configuration
 */
export async function deleteSavedConfiguration(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete configuration: database not available");
    return null;
  }

  try {
    const result = await db
      .delete(savedConfigurations)
      .where(eq(savedConfigurations.id, id));
    return result;
  } catch (error) {
    console.error("[Database] Failed to delete configuration:", error);
    throw error;
  }
}
