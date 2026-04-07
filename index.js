// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var simulations = mysqlTable("simulations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  concentrator: varchar("concentrator", { length: 255 }).notNull(),
  pvCell: varchar("pvCell", { length: 255 }).notNull(),
  battery: varchar("battery", { length: 255 }).notNull(),
  concentratorArea: int("concentratorArea").default(3).notNull(),
  pvArea: int("pvArea").default(1).notNull(),
  batteryCapacity: int("batteryCapacity").default(8e3).notNull(),
  baseLoad: int("baseLoad").default(100).notNull(),
  durationHours: int("durationHours").default(48).notNull(),
  yearsOperation: int("yearsOperation").default(0).notNull(),
  avgPowerGenerated: int("avgPowerGenerated").notNull(),
  maxPowerGenerated: int("maxPowerGenerated").notNull(),
  avgPowerConsumed: int("avgPowerConsumed").notNull(),
  minBatterySoc: int("minBatterySoc").notNull(),
  // Stored as percentage * 100
  maxBatterySoc: int("maxBatterySoc").notNull(),
  // Stored as percentage * 100
  finalBatterySoc: int("finalBatterySoc").notNull(),
  // Stored as percentage * 100
  energyGenerated: int("energyGenerated").notNull(),
  energyConsumed: int("energyConsumed").notNull(),
  energyBalance: int("energyBalance").notNull(),
  systemViable: int("systemViable").default(0).notNull(),
  // 0 or 1 (boolean)
  resultsJson: text("resultsJson").notNull(),
  // Full results as JSON
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var savedConfigurations = mysqlTable("savedConfigurations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  concentrator: varchar("concentrator", { length: 255 }),
  pvCell: varchar("pvCell", { length: 255 }).notNull(),
  battery: varchar("battery", { length: 255 }).notNull(),
  concentratorArea: int("concentratorArea").default(3).notNull(),
  pvArea: int("pvArea").default(1).notNull(),
  batteryCapacity: int("batteryCapacity").default(8e3).notNull(),
  baseLoad: int("baseLoad").default(100).notNull(),
  durationHours: int("durationHours").default(48).notNull(),
  yearsOperation: int("yearsOperation").default(0).notNull(),
  // Store last simulation results for quick comparison
  lastSimulationId: int("lastSimulationId").references(() => simulations.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var sizingScenarios = mysqlTable("sizingScenarios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  notes: text("notes"),
  tags: text("tags"),
  // Comma-separated tags
  createdBy: varchar("createdBy", { length: 255 }),
  lastModifiedBy: varchar("lastModifiedBy", { length: 255 }),
  lastModifiedAt: timestamp("lastModifiedAt").defaultNow().onUpdateNow(),
  // Input parameters
  avgPower: int("avgPower").notNull(),
  // W
  peakPower: int("peakPower").notNull(),
  // W
  energyMargin: int("energyMargin").notNull(),
  // %
  minSOC: int("minSOC").notNull(),
  // %
  eclipseDuration: int("eclipseDuration").notNull(),
  // hours * 100 (2.1 hours = 210)
  missionDuration: int("missionDuration").notNull(),
  // years
  maxMass: int("maxMass").notNull(),
  // kg
  maxCost: int("maxCost").notNull(),
  // dollars
  concentrator: varchar("concentrator", { length: 255 }).notNull(),
  pvCell: varchar("pvCell", { length: 255 }).notNull(),
  battery: varchar("battery", { length: 255 }).notNull(),
  // Results (stored as JSON for flexibility)
  resultsJson: text("resultsJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var costBenefitScenarios = mysqlTable("costBenefitScenarios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  notes: text("notes"),
  tags: text("tags"),
  // Comma-separated tags
  createdBy: varchar("createdBy", { length: 255 }),
  lastModifiedBy: varchar("lastModifiedBy", { length: 255 }),
  lastModifiedAt: timestamp("lastModifiedAt").defaultNow().onUpdateNow(),
  // Input parameters
  avgPower: int("avgPower").notNull(),
  // W
  peakPower: int("peakPower").notNull(),
  // W
  missionDuration: int("missionDuration").notNull(),
  // years
  concentrator: varchar("concentrator", { length: 255 }).notNull(),
  pvCell: varchar("pvCell", { length: 255 }).notNull(),
  battery: varchar("battery", { length: 255 }).notNull(),
  // Results (stored as JSON for flexibility)
  resultsJson: text("resultsJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function saveSimulation(simulation) {
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
async function getUserSimulations(userId, limit = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get simulations: database not available");
    return [];
  }
  try {
    const results = await db.select().from(simulations).where(eq(simulations.userId, userId)).orderBy(desc(simulations.createdAt)).limit(limit);
    return results;
  } catch (error) {
    console.error("[Database] Failed to get simulations:", error);
    throw error;
  }
}
async function getSimulationById(id) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get simulation: database not available");
    return null;
  }
  try {
    const result = await db.select().from(simulations).where(eq(simulations.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get simulation:", error);
    throw error;
  }
}
async function saveSavedConfiguration(config) {
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
async function getUserSavedConfigurations(userId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get configurations: database not available");
    return [];
  }
  try {
    const results = await db.select().from(savedConfigurations).where(eq(savedConfigurations.userId, userId)).orderBy(desc(savedConfigurations.createdAt));
    return results;
  } catch (error) {
    console.error("[Database] Failed to get configurations:", error);
    throw error;
  }
}
async function getSavedConfigurationById(id) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get configuration: database not available");
    return null;
  }
  try {
    const result = await db.select().from(savedConfigurations).where(eq(savedConfigurations.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get configuration:", error);
    throw error;
  }
}
async function updateSavedConfiguration(id, config) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update configuration: database not available");
    return null;
  }
  try {
    const result = await db.update(savedConfigurations).set(config).where(eq(savedConfigurations.id, id));
    return result;
  } catch (error) {
    console.error("[Database] Failed to update configuration:", error);
    throw error;
  }
}
async function deleteSavedConfiguration(id) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete configuration: database not available");
    return null;
  }
  try {
    const result = await db.delete(savedConfigurations).where(eq(savedConfigurations.id, id));
    return result;
  } catch (error) {
    console.error("[Database] Failed to delete configuration:", error);
    throw error;
  }
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z7 } from "zod";

// server/technologyData.ts
var TECHNOLOGY_DATABASE = {
  "concentrators": [
    {
      "name": "Simple Parabolic Mirror",
      "type_category": "Historical",
      "concentration_ratio": 5,
      "optical_efficiency": 0.65,
      "mass_per_m2": 8,
      "complexity": 2,
      "trl": 9,
      "description": "Early space mirror concentrators used on satellites"
    },
    {
      "name": "Flat Mirror Array",
      "type_category": "Historical",
      "concentration_ratio": 3,
      "optical_efficiency": 0.7,
      "mass_per_m2": 6,
      "complexity": 1,
      "trl": 9,
      "description": "Simple flat mirror arrays with basic tracking"
    },
    {
      "name": "Compound Parabolic Concentrator (CPC)",
      "type_category": "Current",
      "concentration_ratio": 10,
      "optical_efficiency": 0.82,
      "mass_per_m2": 5.5,
      "complexity": 3,
      "trl": 8,
      "description": "Non-imaging concentrator with wide acceptance angle"
    },
    {
      "name": "Fresnel Lens Concentrator",
      "type_category": "Current",
      "concentration_ratio": 15,
      "optical_efficiency": 0.85,
      "mass_per_m2": 4,
      "complexity": 3,
      "trl": 8,
      "description": "Lightweight refractive concentrator using Fresnel optics"
    },
    {
      "name": "Parabolic Dish Concentrator",
      "type_category": "Current",
      "concentration_ratio": 20,
      "optical_efficiency": 0.88,
      "mass_per_m2": 7,
      "complexity": 4,
      "trl": 9,
      "description": "High-efficiency parabolic dish with precision tracking"
    },
    {
      "name": "Linear Fresnel Reflector",
      "type_category": "Current",
      "concentration_ratio": 12,
      "optical_efficiency": 0.8,
      "mass_per_m2": 4.5,
      "complexity": 3,
      "trl": 8,
      "description": "Linear concentrator with segmented mirrors"
    },
    {
      "name": "Inflatable Concentrator",
      "type_category": "Theoretical",
      "concentration_ratio": 25,
      "optical_efficiency": 0.9,
      "mass_per_m2": 1.5,
      "complexity": 4,
      "trl": 5,
      "description": "Ultra-lightweight inflatable membrane concentrator"
    },
    {
      "name": "Metamaterial Concentrator",
      "type_category": "Theoretical",
      "concentration_ratio": 30,
      "optical_efficiency": 0.92,
      "mass_per_m2": 2,
      "complexity": 5,
      "trl": 3,
      "description": "Advanced metamaterial-based light concentration"
    },
    {
      "name": "Holographic Concentrator",
      "type_category": "Theoretical",
      "concentration_ratio": 22,
      "optical_efficiency": 0.89,
      "mass_per_m2": 1.8,
      "complexity": 4,
      "trl": 4,
      "description": "Holographic optical elements for lightweight concentration"
    }
  ],
  "pv_cells": [
    {
      "name": "Silicon Solar Cells (Early)",
      "type_category": "Historical",
      "base_efficiency": 0.1,
      "degradation_rate": 0.015,
      "temp_coefficient": -45e-4,
      "mass_per_m2": 3,
      "cost_relative": 0.3,
      "trl": 9,
      "description": "First generation silicon cells used in early space missions"
    },
    {
      "name": "GaAs Single Junction",
      "type_category": "Historical",
      "base_efficiency": 0.18,
      "degradation_rate": 0.01,
      "temp_coefficient": -35e-4,
      "mass_per_m2": 2.5,
      "cost_relative": 1.5,
      "trl": 9,
      "description": "Early Gallium Arsenide cells for space applications"
    },
    {
      "name": "Monocrystalline Silicon",
      "type_category": "Current",
      "base_efficiency": 0.22,
      "degradation_rate": 5e-3,
      "temp_coefficient": -38e-4,
      "mass_per_m2": 2.8,
      "cost_relative": 0.8,
      "trl": 9,
      "description": "High-efficiency monocrystalline silicon cells"
    },
    {
      "name": "Multi-junction GaAs (2J)",
      "type_category": "Current",
      "base_efficiency": 0.28,
      "degradation_rate": 4e-3,
      "temp_coefficient": -28e-4,
      "mass_per_m2": 2.2,
      "cost_relative": 3,
      "trl": 9,
      "description": "Dual-junction GaAs cells for space applications"
    },
    {
      "name": "Triple-junction GaAs (3J)",
      "type_category": "Current",
      "base_efficiency": 0.32,
      "degradation_rate": 3e-3,
      "temp_coefficient": -25e-4,
      "mass_per_m2": 2.3,
      "cost_relative": 4,
      "trl": 9,
      "description": "State-of-art triple-junction cells (InGaP/GaAs/Ge)"
    },
    {
      "name": "CIGS Thin Film",
      "type_category": "Current",
      "base_efficiency": 0.2,
      "degradation_rate": 6e-3,
      "temp_coefficient": -32e-4,
      "mass_per_m2": 1.5,
      "cost_relative": 1.2,
      "trl": 8,
      "description": "Copper Indium Gallium Selenide thin film cells"
    },
    {
      "name": "Perovskite Solar Cells",
      "type_category": "Current",
      "base_efficiency": 0.25,
      "degradation_rate": 8e-3,
      "temp_coefficient": -3e-3,
      "mass_per_m2": 1.2,
      "cost_relative": 0.6,
      "trl": 6,
      "description": "Emerging perovskite technology with high efficiency"
    },
    {
      "name": "Quad-junction (4J) Advanced",
      "type_category": "Theoretical",
      "base_efficiency": 0.38,
      "degradation_rate": 2e-3,
      "temp_coefficient": -2e-3,
      "mass_per_m2": 2.4,
      "cost_relative": 6,
      "trl": 5,
      "description": "Advanced four-junction cells with optimized bandgaps"
    },
    {
      "name": "Quantum Dot Solar Cells",
      "type_category": "Theoretical",
      "base_efficiency": 0.42,
      "degradation_rate": 2e-3,
      "temp_coefficient": -15e-4,
      "mass_per_m2": 1.8,
      "cost_relative": 5,
      "trl": 4,
      "description": "Quantum dot enhanced multi-junction cells"
    },
    {
      "name": "Hot Carrier Solar Cells",
      "type_category": "Theoretical",
      "base_efficiency": 0.48,
      "degradation_rate": 1e-3,
      "temp_coefficient": -1e-3,
      "mass_per_m2": 2,
      "cost_relative": 8,
      "trl": 3,
      "description": "Theoretical hot carrier cells exceeding S-Q limit"
    },
    {
      "name": "Tandem Perovskite-Silicon",
      "type_category": "Theoretical",
      "base_efficiency": 0.35,
      "degradation_rate": 3e-3,
      "temp_coefficient": -22e-4,
      "mass_per_m2": 1.6,
      "cost_relative": 2.5,
      "trl": 5,
      "description": "Hybrid perovskite-silicon tandem architecture"
    }
  ],
  "batteries": [
    {
      "name": "Nickel-Cadmium (NiCd)",
      "type_category": "Historical",
      "energy_density": 40,
      "power_density": 150,
      "cycle_life": 2e3,
      "charge_efficiency": 0.85,
      "discharge_efficiency": 0.9,
      "self_discharge_rate": 1e-3,
      "temp_range_min": 233.15,
      "temp_range_max": 333.15,
      "cost_relative": 0.5,
      "trl": 9,
      "description": "Classic NiCd batteries used in early spacecraft"
    },
    {
      "name": "Nickel-Hydrogen (NiH2)",
      "type_category": "Historical",
      "energy_density": 60,
      "power_density": 200,
      "cycle_life": 2e4,
      "charge_efficiency": 0.88,
      "discharge_efficiency": 0.92,
      "self_discharge_rate": 5e-4,
      "temp_range_min": 253.15,
      "temp_range_max": 323.15,
      "cost_relative": 2,
      "trl": 9,
      "description": "Long-life NiH2 batteries for satellites and ISS"
    },
    {
      "name": "Silver-Zinc (AgZn)",
      "type_category": "Historical",
      "energy_density": 130,
      "power_density": 300,
      "cycle_life": 100,
      "charge_efficiency": 0.9,
      "discharge_efficiency": 0.95,
      "self_discharge_rate": 15e-4,
      "temp_range_min": 263.15,
      "temp_range_max": 323.15,
      "cost_relative": 5,
      "trl": 9,
      "description": "High energy density but limited cycle life"
    },
    {
      "name": "Lithium-ion (LiCoO2)",
      "type_category": "Current",
      "energy_density": 150,
      "power_density": 250,
      "cycle_life": 1e3,
      "charge_efficiency": 0.92,
      "discharge_efficiency": 0.95,
      "self_discharge_rate": 2e-4,
      "temp_range_min": 253.15,
      "temp_range_max": 333.15,
      "cost_relative": 1,
      "trl": 9,
      "description": "Standard lithium-ion with cobalt oxide cathode"
    },
    {
      "name": "Lithium-ion (NMC)",
      "type_category": "Current",
      "energy_density": 180,
      "power_density": 280,
      "cycle_life": 2e3,
      "charge_efficiency": 0.94,
      "discharge_efficiency": 0.96,
      "self_discharge_rate": 1e-4,
      "temp_range_min": 243.15,
      "temp_range_max": 333.15,
      "cost_relative": 1.2,
      "trl": 9,
      "description": "Nickel Manganese Cobalt cathode for improved performance"
    },
    {
      "name": "Lithium-ion (LFP)",
      "type_category": "Current",
      "energy_density": 120,
      "power_density": 220,
      "cycle_life": 5e3,
      "charge_efficiency": 0.93,
      "discharge_efficiency": 0.95,
      "self_discharge_rate": 1e-4,
      "temp_range_min": 253.15,
      "temp_range_max": 343.15,
      "cost_relative": 0.8,
      "trl": 9,
      "description": "Lithium Iron Phosphate for safety and longevity"
    },
    {
      "name": "Lithium-Polymer",
      "type_category": "Current",
      "energy_density": 160,
      "power_density": 300,
      "cycle_life": 1500,
      "charge_efficiency": 0.93,
      "discharge_efficiency": 0.95,
      "self_discharge_rate": 2e-4,
      "temp_range_min": 253.15,
      "temp_range_max": 333.15,
      "cost_relative": 1.5,
      "trl": 8,
      "description": "Flexible polymer electrolyte lithium batteries"
    },
    {
      "name": "Solid-State Lithium",
      "type_category": "Theoretical",
      "energy_density": 400,
      "power_density": 500,
      "cycle_life": 1e4,
      "charge_efficiency": 0.96,
      "discharge_efficiency": 0.98,
      "self_discharge_rate": 5e-5,
      "temp_range_min": 223.15,
      "temp_range_max": 353.15,
      "cost_relative": 3,
      "trl": 5,
      "description": "Solid electrolyte for high energy density and safety"
    },
    {
      "name": "Lithium-Sulfur",
      "type_category": "Theoretical",
      "energy_density": 500,
      "power_density": 400,
      "cycle_life": 3e3,
      "charge_efficiency": 0.94,
      "discharge_efficiency": 0.96,
      "self_discharge_rate": 1e-4,
      "temp_range_min": 243.15,
      "temp_range_max": 333.15,
      "cost_relative": 1.5,
      "trl": 4,
      "description": "High theoretical energy density with sulfur cathode"
    },
    {
      "name": "Lithium-Air",
      "type_category": "Theoretical",
      "energy_density": 800,
      "power_density": 300,
      "cycle_life": 1e3,
      "charge_efficiency": 0.9,
      "discharge_efficiency": 0.92,
      "self_discharge_rate": 3e-4,
      "temp_range_min": 263.15,
      "temp_range_max": 323.15,
      "cost_relative": 2.5,
      "trl": 3,
      "description": "Ultra-high energy density using atmospheric oxygen"
    },
    {
      "name": "Sodium-ion Advanced",
      "type_category": "Theoretical",
      "energy_density": 200,
      "power_density": 350,
      "cycle_life": 8e3,
      "charge_efficiency": 0.95,
      "discharge_efficiency": 0.96,
      "self_discharge_rate": 1e-4,
      "temp_range_min": 233.15,
      "temp_range_max": 343.15,
      "cost_relative": 0.6,
      "trl": 6,
      "description": "Abundant sodium-based alternative to lithium"
    },
    {
      "name": "Aluminum-ion",
      "type_category": "Theoretical",
      "energy_density": 300,
      "power_density": 600,
      "cycle_life": 2e4,
      "charge_efficiency": 0.96,
      "discharge_efficiency": 0.97,
      "self_discharge_rate": 5e-5,
      "temp_range_min": 243.15,
      "temp_range_max": 353.15,
      "cost_relative": 0.8,
      "trl": 4,
      "description": "Fast-charging aluminum-based batteries"
    }
  ]
};

// server/getTechnologies.ts
async function getTechnologies() {
  const concentrators = TECHNOLOGY_DATABASE.concentrators.map((c) => ({
    name: c.name,
    concentration_ratio: c.concentration_ratio || 1,
    efficiency: c.optical_efficiency || 0.85,
    mass_per_m2: c.mass_per_m2 || 5,
    cost_per_m2: 1e3,
    // Default cost
    trl: c.trl || 5,
    era: c.type_category
  }));
  const pv_cells = TECHNOLOGY_DATABASE.pv_cells.map((p) => ({
    name: p.name,
    efficiency: p.base_efficiency || 0.3,
    degradation_per_year: p.degradation_rate || 5e-3,
    mass_per_m2: p.mass_per_m2 || 2.5,
    cost_per_m2: (p.cost_relative || 1) * 1e3,
    temp_coefficient: p.temp_coefficient || -3e-3,
    trl: p.trl || 5,
    era: p.type_category
  }));
  const batteries = TECHNOLOGY_DATABASE.batteries.map((b) => ({
    name: b.name,
    energy_density: b.energy_density || 150,
    cycle_life: b.cycle_life || 1e3,
    charge_efficiency: b.charge_efficiency || 0.9,
    discharge_efficiency: b.discharge_efficiency || 0.9,
    self_discharge_rate: b.self_discharge_rate || 1e-4,
    mass_per_kwh: 1e3 / (b.energy_density || 150),
    // Convert from Wh/kg to kg/kWh
    cost_per_kwh: (b.cost_relative || 1) * 500,
    trl: b.trl || 5,
    era: b.type_category
  }));
  return Promise.resolve({
    concentrators: [
      { name: "None", concentration_ratio: 1, efficiency: 1, mass_per_m2: 0, cost_per_m2: 0, trl: 9, era: "None" },
      ...concentrators
    ],
    pv_cells: [
      { name: "None", efficiency: 0, degradation_per_year: 0, mass_per_m2: 0, cost_per_m2: 0, temp_coefficient: 0, trl: 9, era: "None" },
      ...pv_cells
    ],
    batteries: [
      { name: "None", energy_density: 0, cycle_life: 0, charge_efficiency: 1, discharge_efficiency: 1, self_discharge_rate: 0, mass_per_kwh: 0, cost_per_kwh: 0, trl: 9, era: "None" },
      ...batteries
    ]
  });
}

// server/simulationEngine.ts
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// server/lib/radiationDamage.ts
var DAMAGE_COEFFICIENTS = {
  // Silicon cells
  "si_standard": {
    cellType: "Silicon (Standard)",
    protonDamageCoeff: 55e-10,
    // MeV·cm²
    electronDamageCoeff: 28e-10,
    annealingFactor: 0.15
    // 15% recovery at operating temps
  },
  "si_bsfr": {
    cellType: "Silicon (BSFR)",
    protonDamageCoeff: 48e-10,
    electronDamageCoeff: 25e-10,
    annealingFactor: 0.18
  },
  // GaAs single junction
  "gaas_single": {
    cellType: "GaAs Single Junction",
    protonDamageCoeff: 32e-10,
    electronDamageCoeff: 18e-10,
    annealingFactor: 0.1
  },
  // Multi-junction cells (more radiation resistant)
  "gaas_dual": {
    cellType: "GaAs/Ge Dual Junction",
    protonDamageCoeff: 28e-10,
    electronDamageCoeff: 15e-10,
    annealingFactor: 0.12
  },
  "gaas_triple": {
    cellType: "GaInP/GaAs/Ge Triple Junction",
    protonDamageCoeff: 24e-10,
    electronDamageCoeff: 13e-10,
    annealingFactor: 0.08
  },
  "gaas_inverted": {
    cellType: "Inverted Metamorphic Multi-Junction (IMM)",
    protonDamageCoeff: 2e-9,
    electronDamageCoeff: 11e-10,
    annealingFactor: 0.06
  },
  // Advanced technologies
  "perovskite_si": {
    cellType: "Perovskite/Si Tandem",
    protonDamageCoeff: 35e-10,
    // Less flight data, conservative estimate
    electronDamageCoeff: 2e-9,
    annealingFactor: 0.2
    // Perovskites show good recovery
  },
  "quantum_dot": {
    cellType: "Quantum Dot Enhanced",
    protonDamageCoeff: 26e-10,
    electronDamageCoeff: 14e-10,
    annealingFactor: 0.1
  }
};
function getCellDamageCoeffs(pvCellId) {
  const id = pvCellId.toLowerCase();
  if (id.includes("si_bsfr") || id.includes("silicon_bsfr")) {
    return DAMAGE_COEFFICIENTS["si_bsfr"];
  } else if (id.includes("si_") || id.includes("silicon")) {
    return DAMAGE_COEFFICIENTS["si_standard"];
  } else if (id.includes("gaas_triple") || id.includes("triple")) {
    return DAMAGE_COEFFICIENTS["gaas_triple"];
  } else if (id.includes("gaas_dual") || id.includes("dual")) {
    return DAMAGE_COEFFICIENTS["gaas_dual"];
  } else if (id.includes("imm") || id.includes("inverted")) {
    return DAMAGE_COEFFICIENTS["gaas_inverted"];
  } else if (id.includes("gaas")) {
    return DAMAGE_COEFFICIENTS["gaas_single"];
  } else if (id.includes("perovskite")) {
    return DAMAGE_COEFFICIENTS["perovskite_si"];
  } else if (id.includes("quantum")) {
    return DAMAGE_COEFFICIENTS["quantum_dot"];
  }
  return DAMAGE_COEFFICIENTS["gaas_triple"];
}
function getPsycheRadiationEnvironment(yearsInOperation) {
  const annualProtonFluence = 15e9;
  const annualElectronFluence = 3e10;
  const avgProtonEnergy = 10;
  const avgElectronEnergy = 1;
  return {
    protonFluence: annualProtonFluence * yearsInOperation,
    protonEnergy: avgProtonEnergy,
    electronFluence: annualElectronFluence * yearsInOperation,
    electronEnergy: avgElectronEnergy
  };
}
function calculateProtonNIEL(energy) {
  if (energy < 0.1) return 0;
  if (energy < 1) return 50 * energy;
  if (energy < 10) return 50 + 20 * (energy - 1);
  if (energy < 100) return 230 - 10 * Math.log10(energy / 10);
  return 200;
}
function calculateElectronNIEL(energy) {
  if (energy < 0.1) return 0;
  if (energy < 1) return 5 * energy;
  if (energy < 10) return 5 + 3 * (energy - 1);
  return 32;
}
function calculateDisplacementDamageDose(environment) {
  const protonNIEL = calculateProtonNIEL(environment.protonEnergy);
  const electronNIEL = calculateElectronNIEL(environment.electronEnergy);
  const thickness_cm = 0.03;
  const density = 5.32;
  const mass_per_cm2 = thickness_cm * density;
  const protonDDD = environment.protonFluence * protonNIEL / mass_per_cm2;
  const electronDDD = environment.electronFluence * electronNIEL / mass_per_cm2;
  return protonDDD + electronDDD;
}
function calculateRadiationDegradation(pvCellId, yearsInOperation, operatingTemp = 200) {
  const coeffs = getCellDamageCoeffs(pvCellId);
  const environment = getPsycheRadiationEnvironment(yearsInOperation);
  const DDD = calculateDisplacementDamageDose(environment);
  const totalFluence = environment.protonFluence + environment.electronFluence;
  if (totalFluence === 0 || !isFinite(totalFluence)) {
    return 1;
  }
  const weightedDamageCoeff = (coeffs.protonDamageCoeff * environment.protonFluence + coeffs.electronDamageCoeff * environment.electronFluence) / totalFluence;
  const degradationFactor = Math.exp(-weightedDamageCoeff * DDD);
  if (!isFinite(degradationFactor)) {
    console.warn("[Radiation Model] Invalid degradation factor, using fallback");
    return 1;
  }
  const annealingEffect = coeffs.annealingFactor * Math.max(0, (operatingTemp - 150) / 100);
  const recoveredFactor = degradationFactor + (1 - degradationFactor) * annealingEffect;
  return Math.max(0.5, Math.min(1, recoveredFactor));
}

// server/lib/batteryDegradation.ts
function calculateCapacityFade(params) {
  const { cycleCount, averageDOD, averageTemperature, yearsInOperation } = params;
  const baseRatePerCycle = 5e-4;
  const dodStressFactor = 0.5 + averageDOD * 1.5;
  const tempCelsius = averageTemperature - 273.15;
  let tempStressFactor = 1;
  if (tempCelsius < 20) {
    tempStressFactor = 1 + (20 - tempCelsius) * 0.02;
  } else if (tempCelsius > 40) {
    tempStressFactor = 1 + Math.pow((tempCelsius - 40) / 20, 2);
  }
  const calendarFade = yearsInOperation * 0.025;
  const cycleFade = cycleCount * baseRatePerCycle * dodStressFactor * tempStressFactor;
  const totalFade = Math.min(0.3, calendarFade + cycleFade);
  return 1 - totalFade;
}
function calculateImpedanceGrowth(params) {
  const { cycleCount, averageTemperature, yearsInOperation } = params;
  const baseGrowthPerCycle = 1e-3;
  const tempCelsius = averageTemperature - 273.15;
  const tempFactor = tempCelsius > 40 ? 1 + (tempCelsius - 40) * 0.05 : 1;
  const calendarGrowth = yearsInOperation * 0.05;
  const cycleGrowth = cycleCount * baseGrowthPerCycle * tempFactor;
  const totalGrowth = Math.min(1, calendarGrowth + cycleGrowth);
  return 1 + totalGrowth;
}
function estimateRemainingCycles(params, currentCapacityFactor) {
  if (currentCapacityFactor <= 0.7) {
    return 0;
  }
  const baseRatePerCycle = 5e-4;
  const dodStressFactor = 0.5 + params.averageDOD * 1.5;
  const tempCelsius = params.averageTemperature - 273.15;
  let tempStressFactor = 1;
  if (tempCelsius < 20) {
    tempStressFactor = 1 + (20 - tempCelsius) * 0.02;
  } else if (tempCelsius > 40) {
    tempStressFactor = 1 + Math.pow((tempCelsius - 40) / 20, 2);
  }
  const degradationRatePerCycle = baseRatePerCycle * dodStressFactor * tempStressFactor;
  const remainingFade = currentCapacityFactor - 0.7;
  const remainingCycles = remainingFade / degradationRatePerCycle;
  return Math.floor(remainingCycles);
}
function calculateBatteryDegradation(params) {
  const capacityFadeFactor = calculateCapacityFade(params);
  const impedanceGrowthFactor = calculateImpedanceGrowth(params);
  const cycleLifeRemaining = estimateRemainingCycles(params, capacityFadeFactor);
  const isEOL = capacityFadeFactor <= 0.7;
  return {
    capacityFadeFactor,
    impedanceGrowthFactor,
    cycleLifeRemaining,
    isEOL
  };
}
function estimateCycleCount(yearsInOperation, rotationPeriodHours = 4.2) {
  const cyclesPerDay = 24 / rotationPeriodHours;
  const cyclesPerYear = cyclesPerDay * 365.25;
  return Math.floor(yearsInOperation * cyclesPerYear);
}

// server/lib/batteryTemperature.ts
function calculateCapacityDerating(temperatureK) {
  const tempC = temperatureK - 273.15;
  if (tempC >= 20 && tempC <= 40) {
    return 1;
  } else if (tempC > 40 && tempC <= 60) {
    return 1 - (tempC - 40) * 25e-4;
  } else if (tempC > 60) {
    return Math.max(0.85, 0.95 - (tempC - 60) * 0.01);
  } else if (tempC >= 0 && tempC < 20) {
    return 0.8 + tempC / 20 * 0.2;
  } else if (tempC >= -20 && tempC < 0) {
    return 0.6 + (tempC + 20) / 20 * 0.2;
  } else if (tempC >= -40 && tempC < -20) {
    return 0.4 + (tempC + 40) / 20 * 0.2;
  } else {
    return Math.max(0.2, 0.4 + (tempC + 40) * 0.01);
  }
}
function calculateVoltageSlopeFactor(temperatureK) {
  const tempC = temperatureK - 273.15;
  if (tempC >= 20) {
    return 1;
  } else if (tempC >= 0) {
    return 1 + (20 - tempC) * 0.01;
  } else if (tempC >= -20) {
    return 1.2 + -tempC * 0.02;
  } else {
    return 1.6 + (-tempC - 20) * 0.03;
  }
}
function calculateResistanceMultiplier(temperatureK) {
  const tempC = temperatureK - 273.15;
  if (tempC >= 25) {
    return Math.max(0.9, 1 - (tempC - 25) * 2e-3);
  } else if (tempC >= 0) {
    const factor = (25 - tempC) / 25;
    return 1 + factor * 0.5;
  } else if (tempC >= -20) {
    const factor = -tempC / 20;
    return 1.5 + factor * 2.5;
  } else {
    const factor = (-tempC - 20) / 20;
    return 4 + factor * 6;
  }
}
function calculateMaxDischargeRate(temperatureK) {
  const tempC = temperatureK - 273.15;
  if (tempC >= 20) {
    return 2;
  } else if (tempC >= 0) {
    return 2 - (20 - tempC) * 0.05;
  } else if (tempC >= -20) {
    return 1 + tempC / 20 * 0.75;
  } else {
    return Math.max(0.1, 0.25 + (tempC + 20) * 75e-4);
  }
}
function calculateMaxChargeRate(temperatureK) {
  const tempC = temperatureK - 273.15;
  if (tempC < 0) {
    return 0;
  } else if (tempC >= 20 && tempC <= 45) {
    return 1;
  } else if (tempC < 20) {
    return tempC / 20 * 1;
  } else if (tempC <= 60) {
    return 1 - (tempC - 45) * 0.03;
  } else {
    return Math.max(0.1, 0.55 - (tempC - 60) * 0.02);
  }
}
function calculateEfficiencyPenalty(temperatureK) {
  const tempC = temperatureK - 273.15;
  if (tempC >= 15 && tempC <= 45) {
    return 0;
  } else if (tempC < 15 && tempC >= -20) {
    return (15 - tempC) * 3e-3;
  } else if (tempC < -20) {
    return 0.105 + (-tempC - 20) * 5e-3;
  } else if (tempC > 45) {
    return (tempC - 45) * 2e-3;
  }
  return 0;
}
function calculateTemperatureEffects(temperatureK) {
  return {
    capacityDerating: calculateCapacityDerating(temperatureK),
    voltageSlopeFactor: calculateVoltageSlopeFactor(temperatureK),
    resistanceMultiplier: calculateResistanceMultiplier(temperatureK),
    maxDischargeRate: calculateMaxDischargeRate(temperatureK),
    maxChargeRate: calculateMaxChargeRate(temperatureK),
    efficiencyPenalty: calculateEfficiencyPenalty(temperatureK)
  };
}
function checkTemperatureSafety(temperatureK, isCharging) {
  const tempC = temperatureK - 273.15;
  if (isCharging && tempC < 0) {
    return {
      safe: false,
      warning: `Charging not allowed below 0\xB0C (current: ${tempC.toFixed(1)}\xB0C). Risk of lithium plating and permanent damage.`
    };
  }
  if (tempC < -40) {
    return {
      safe: false,
      warning: `Temperature ${tempC.toFixed(1)}\xB0C is below operational limit (-40\xB0C). Battery may be permanently damaged.`
    };
  }
  if (tempC > 60) {
    return {
      safe: false,
      warning: `Temperature ${tempC.toFixed(1)}\xB0C exceeds safe limit (60\xB0C). Risk of thermal runaway and fire.`
    };
  }
  if (tempC < 0 || tempC > 50) {
    return {
      safe: true,
      warning: `Temperature ${tempC.toFixed(1)}\xB0C is outside recommended range (0-50\xB0C). Performance significantly degraded.`
    };
  }
  return { safe: true };
}

// server/lib/mpptEfficiency.ts
function calculateLoadDependentEfficiency(loadPercent) {
  if (loadPercent <= 0) {
    return 0;
  } else if (loadPercent < 10) {
    return 0.5 + loadPercent / 10 * 0.15;
  } else if (loadPercent < 30) {
    return 0.65 + (loadPercent - 10) / 20 * 0.2;
  } else if (loadPercent < 75) {
    return 0.85 + (loadPercent - 30) / 45 * 0.08;
  } else if (loadPercent <= 100) {
    return 0.93 + (loadPercent - 75) / 25 * 0.04;
  } else if (loadPercent <= 120) {
    return 0.97 - (loadPercent - 100) / 20 * 0.07;
  } else {
    return Math.max(0.75, 0.9 - (loadPercent - 120) * 5e-3);
  }
}
function calculateVoltageRatioPenalty(inputVoltage, outputVoltage) {
  const ratio = Math.max(inputVoltage / outputVoltage, outputVoltage / inputVoltage);
  if (ratio <= 1.5) {
    return 1;
  } else if (ratio <= 3) {
    return 1 - (ratio - 1.5) * 0.01;
  } else if (ratio <= 6) {
    return 0.985 - (ratio - 3) * 0.015;
  } else {
    return Math.max(0.9, 0.94 - (ratio - 6) * 0.02);
  }
}
function calculateTemperaturePenalty(temperatureK) {
  const tempC = temperatureK - 273.15;
  const optimalTempC = 25;
  if (tempC >= -40 && tempC <= 85) {
    const tempDelta = Math.abs(tempC - optimalTempC);
    const penalty = tempDelta * 15e-4;
    return Math.max(0.95, 1 - penalty);
  } else if (tempC < -40) {
    return Math.max(0.8, 0.95 - (-40 - tempC) * 0.01);
  } else {
    return Math.max(0.85, 0.95 - (tempC - 85) * 0.01);
  }
}
function calculateMPPTEfficiency(params) {
  const { loadPowerW, ratedPowerW, inputVoltage, outputVoltage, temperatureK } = params;
  const loadPercent = loadPowerW / ratedPowerW * 100;
  const baseEfficiency = calculateLoadDependentEfficiency(loadPercent);
  const voltageRatioFactor = calculateVoltageRatioPenalty(inputVoltage, outputVoltage);
  const temperatureFactor = calculateTemperaturePenalty(temperatureK);
  const overallEfficiency = baseEfficiency * voltageRatioFactor * temperatureFactor;
  return Math.max(0.5, Math.min(0.98, overallEfficiency));
}

// server/lib/pointingLosses.ts
function calculatePointingLosses(params) {
  const { attitudeAccuracy, dualAxisGimbal, missionPhase } = params;
  const phaseDegradation = missionPhase === "science" ? 1.5 : 1;
  const effectiveAccuracy = attitudeAccuracy * phaseDegradation;
  const gimbalCompensation = dualAxisGimbal ? 0.8 : 0.5;
  const residualError = effectiveAccuracy * (1 - gimbalCompensation);
  const avgOffPointingAngle = residualError * 0.8;
  const maxOffPointingAngle = residualError * 3;
  const avgAngleRad = avgOffPointingAngle * Math.PI / 180;
  const avgCosineLoss = Math.cos(avgAngleRad);
  const largeErrorThreshold = 5;
  const sigmaRatio = largeErrorThreshold / residualError;
  const largeErrorPercentage = Math.max(
    0,
    100 * 2 * Math.exp(-0.5 * sigmaRatio * sigmaRatio) / (sigmaRatio * Math.sqrt(2 * Math.PI))
  );
  return {
    avgOffPointingAngle,
    maxOffPointingAngle,
    avgCosineLoss,
    largeErrorPercentage
  };
}
function applyPointingLosses(idealPower, pointingLosses) {
  return idealPower * pointingLosses.avgCosineLoss;
}
function getTypicalPointingParams(spacecraftClass) {
  switch (spacecraftClass) {
    case "flagship":
      return {
        attitudeAccuracy: 0.5,
        dualAxisGimbal: true,
        missionPhase: "cruise"
      };
    case "new-frontiers":
      return {
        attitudeAccuracy: 1,
        dualAxisGimbal: true,
        missionPhase: "cruise"
      };
    case "discovery":
      return {
        attitudeAccuracy: 1.5,
        dualAxisGimbal: false,
        missionPhase: "cruise"
      };
    case "smallsat":
      return {
        attitudeAccuracy: 2,
        dualAxisGimbal: false,
        missionPhase: "cruise"
      };
  }
}

// server/simulationEngine.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var PSYCHE_CONSTANTS = {
  SOLAR_CONSTANT_EARTH: 1361,
  // W/m² at 1 AU
  DISTANCE_AU: 2.9,
  // Distance from Sun in Astronomical Units
  ROTATION_PERIOD: 4.2,
  // hours
  TEMP_MIN: 100,
  // Kelvin (night side)
  TEMP_MAX: 270,
  // Kelvin (day side, sunlit)
  TEMP_REF: 298
  // Reference temperature for PV cells (K)
};
function getSolarIrradiance() {
  return PSYCHE_CONSTANTS.SOLAR_CONSTANT_EARTH / PSYCHE_CONSTANTS.DISTANCE_AU ** 2;
}
function getSunAngle(timeHours) {
  const rotationsPerHour = 1 / PSYCHE_CONSTANTS.ROTATION_PERIOD;
  const angle = timeHours * rotationsPerHour * 2 * Math.PI % (2 * Math.PI);
  return angle;
}
function getSurfaceTemperature(sunAngle) {
  const tempRange = PSYCHE_CONSTANTS.TEMP_MAX - PSYCHE_CONSTANTS.TEMP_MIN;
  const temp = PSYCHE_CONSTANTS.TEMP_MIN + tempRange * Math.max(0, Math.cos(sunAngle));
  return temp;
}
function calculateConcentratorPower(timeHours, concentratorArea, concentratorEfficiency) {
  const irradiance = getSolarIrradiance();
  const sunAngle = getSunAngle(timeHours);
  const cosineLoss = Math.max(0, Math.cos(sunAngle));
  return irradiance * concentratorArea * concentratorEfficiency * cosineLoss;
}
function calculatePVPower(concentratedPower, concentrationRatio, pvArea, pvEfficiency, tempCoefficient, surfaceTemp) {
  const tempDelta = surfaceTemp - PSYCHE_CONSTANTS.TEMP_REF;
  const efficiencyAdjustment = 1 + tempCoefficient * tempDelta;
  const actualEfficiency = pvEfficiency * Math.max(0.1, efficiencyAdjustment);
  return concentratedPower * actualEfficiency;
}
function calculatePowerConsumption(timeHours, baseLoad) {
  const sunAngle = getSunAngle(timeHours);
  const isDay = Math.cos(sunAngle) > 0;
  let totalLoad = baseLoad;
  if (isDay) {
    totalLoad += baseLoad * 1.5;
  }
  const commCycle = timeHours % 6;
  if (commCycle < 0.5) {
    totalLoad += baseLoad * 0.8;
  }
  if (!isDay) {
    totalLoad += baseLoad * 1;
  }
  return totalLoad;
}
function updateBatterySOC(currentSOC, powerNet, batteryCapacity, chargeEfficiency, dischargeEfficiency, timeStep) {
  let energyChange = powerNet * timeStep;
  if (energyChange > 0) {
    energyChange *= chargeEfficiency;
  } else {
    energyChange /= dischargeEfficiency;
  }
  const socChange = energyChange / batteryCapacity;
  let newSOC = currentSOC + socChange;
  newSOC = Math.max(0.15, Math.min(0.95, newSOC));
  return newSOC;
}
async function runSimulation(config, technologies) {
  const concentrator = technologies.concentrators.find((c) => c.name === config.concentrator);
  const pvCell = technologies.pv_cells.find((p) => p.name === config.pvCell);
  const battery = technologies.batteries.find((b) => b.name === config.battery);
  if (!pvCell || !battery) {
    throw new Error("Selected technologies not found in database");
  }
  if (!concentrator && config.concentrator !== "None") {
    throw new Error("Selected concentrator not found in database");
  }
  if (pvCell.name === "None") {
    throw new Error("Cannot run simulation without photovoltaic cells");
  }
  const timeStep = 0.1;
  const numSteps = Math.floor(config.durationHours / timeStep);
  const spacecraftClass = config.spacecraftClass || "flagship";
  const pointingParams = getTypicalPointingParams(spacecraftClass);
  const pointingLosses = calculatePointingLosses(pointingParams);
  const concentratorEff = concentrator ? concentrator.efficiency * Math.pow(1 - 1e-3, config.yearsInOperation) : 0;
  let pvDegradationFactor;
  try {
    pvDegradationFactor = calculateRadiationDegradation(config.pvCell, config.yearsInOperation, 200);
  } catch (error) {
    console.warn("[Radiation Model] Failed to calculate DDD, using simple degradation:", error);
    pvDegradationFactor = Math.pow(1 - pvCell.degradation_per_year, config.yearsInOperation);
  }
  const pvEff = pvCell.efficiency * pvDegradationFactor;
  const useSimpleModel = config.useSimpleModel || false;
  const estimatedCycles = estimateCycleCount(config.yearsInOperation, PSYCHE_CONSTANTS.ROTATION_PERIOD);
  const avgDOD = 0.5;
  const estimatedAvgBatteryTemp = (PSYCHE_CONSTANTS.TEMP_MIN + PSYCHE_CONSTANTS.TEMP_MAX) / 2;
  let batteryDegradation;
  if (useSimpleModel) {
    batteryDegradation = { capacityFadeFactor: 1, capacityFadePercent: 0, isEOL: false, cyclesAtEOL: 0 };
  } else {
    batteryDegradation = calculateBatteryDegradation({
      cycleCount: estimatedCycles,
      averageDOD: avgDOD,
      averageTemperature: estimatedAvgBatteryTemp,
      yearsInOperation: config.yearsInOperation
    });
  }
  const effectiveBatteryCapacity = config.batteryCapacity * batteryDegradation.capacityFadeFactor;
  const time = [];
  const powerGenerated = [];
  const powerConsumed = [];
  const batterySOC = [];
  const temperature = [];
  const batteryCapacityFade = [];
  const mpptEfficiency = [];
  const tempWarnings = /* @__PURE__ */ new Set();
  let currentSOC = 0.8;
  for (let step = 0; step < numSteps; step++) {
    const t2 = step * timeStep;
    const sunAngle = getSunAngle(t2);
    const surfaceTemp = getSurfaceTemperature(sunAngle);
    const concentratorPower = calculateConcentratorPower(
      t2,
      config.concentratorArea,
      concentratorEff
    );
    const pvPower = calculatePVPower(
      concentratorPower,
      concentrator?.concentration_ratio ?? 10,
      config.pvArea,
      pvEff,
      pvCell.temp_coefficient ?? -3e-3,
      surfaceTemp
    );
    const loadPower = calculatePowerConsumption(t2, config.baseLoad);
    const mpptEff = useSimpleModel ? 0.95 : calculateMPPTEfficiency({
      loadPowerW: Math.abs(pvPower - loadPower),
      ratedPowerW: config.baseLoad * 3,
      // Assume converter rated for 3x base load
      inputVoltage: 70,
      // Typical solar array voltage
      outputVoltage: 28,
      // Typical spacecraft bus voltage
      temperatureK: surfaceTemp
    });
    const pvPowerAfterMPPT = pvPower * mpptEff;
    const pvPowerAfterPointing = useSimpleModel ? pvPowerAfterMPPT : applyPointingLosses(pvPowerAfterMPPT, pointingLosses);
    const netPower = pvPowerAfterPointing - loadPower;
    const tempEffects = useSimpleModel ? { capacityDerating: 1, efficiencyPenalty: 0 } : calculateTemperatureEffects(surfaceTemp);
    if (!useSimpleModel) {
      const tempSafety = checkTemperatureSafety(surfaceTemp, netPower > 0);
      if (!tempSafety.safe && tempSafety.warning) {
        tempWarnings.add(tempSafety.warning);
      }
    }
    const chargeEffAdjusted = (battery.charge_efficiency ?? 0.92) * (1 - tempEffects.efficiencyPenalty);
    const dischargeEffAdjusted = (battery.discharge_efficiency ?? 0.95) * (1 - tempEffects.efficiencyPenalty);
    const tempAdjustedCapacity = effectiveBatteryCapacity * tempEffects.capacityDerating;
    currentSOC = updateBatterySOC(
      currentSOC,
      netPower,
      tempAdjustedCapacity,
      chargeEffAdjusted,
      dischargeEffAdjusted,
      timeStep
    );
    time.push(t2);
    powerGenerated.push(pvPower);
    powerConsumed.push(loadPower);
    batterySOC.push(currentSOC);
    temperature.push(surfaceTemp);
    batteryCapacityFade.push(batteryDegradation.capacityFadeFactor);
    mpptEfficiency.push(mpptEff);
  }
  const avgPowerGenerated = powerGenerated.reduce((a, b) => a + b, 0) / powerGenerated.length;
  const peakPowerGenerated = Math.max(...powerGenerated);
  const avgPowerConsumed = powerConsumed.reduce((a, b) => a + b, 0) / powerConsumed.length;
  const peakPowerConsumed = Math.max(...powerConsumed);
  const totalEnergyGenerated = powerGenerated.reduce((sum, p, i) => sum + p * timeStep, 0);
  const totalEnergyConsumed = powerConsumed.reduce((sum, p, i) => sum + p * timeStep, 0);
  const energyBalance = totalEnergyGenerated - totalEnergyConsumed;
  const minSOC = Math.min(...batterySOC);
  const finalSOC = batterySOC[batterySOC.length - 1];
  let healthScore = 0;
  if (minSOC > 0.2) healthScore += 1;
  if (minSOC > 0.4) healthScore += 1;
  if (energyBalance > 0) healthScore += 1;
  if (finalSOC > 0.7) healthScore += 1;
  if (avgPowerGenerated > avgPowerConsumed * 1.2) healthScore += 1;
  const viable = minSOC > 0.2 && energyBalance > 0;
  const avgBatteryTemp = temperature.reduce((a, b) => a + b, 0) / temperature.length;
  const avgMPPTEff = mpptEfficiency.reduce((a, b) => a + b, 0) / mpptEfficiency.length;
  const capacityFadePercent = (1 - batteryDegradation.capacityFadeFactor) * 100;
  return {
    time,
    power_generated: powerGenerated,
    power_consumed: powerConsumed,
    battery_soc: batterySOC,
    temperature,
    battery_capacity_fade: batteryCapacityFade,
    mppt_efficiency: mpptEfficiency,
    metrics: {
      avg_power_generated: avgPowerGenerated,
      peak_power_generated: peakPowerGenerated,
      avg_power_consumed: avgPowerConsumed,
      peak_power_consumed: peakPowerConsumed,
      energy_balance: energyBalance,
      min_soc: minSOC,
      final_soc: finalSOC,
      system_health: healthScore,
      viable,
      // NEW: Battery degradation metrics
      battery_capacity_fade_percent: capacityFadePercent,
      battery_cycle_count: estimatedCycles,
      battery_eol_reached: batteryDegradation.isEOL,
      // NEW: Temperature effects
      avg_battery_temp_k: avgBatteryTemp,
      temp_warnings: Array.from(tempWarnings),
      // NEW: MPPT efficiency
      avg_mppt_efficiency: avgMPPTEff,
      // NEW: Pointing loss metrics
      avgOffPointingAngle: pointingLosses.avgOffPointingAngle,
      maxOffPointingAngle: pointingLosses.maxOffPointingAngle,
      avgPointingLossFactor: pointingLosses.avgCosineLoss
    }
  };
}

// shared/presets.ts
var CONFIGURATION_PRESETS = [
  {
    id: "budget-mission",
    name: "Budget Mission",
    description: "Proven historical technologies with lower cost and established reliability. Suitable for cost-constrained missions.",
    era: "Historical",
    concentrator: "Simple Parabolic Mirror",
    pvCell: "GaAs Single Junction",
    battery: "Nickel-Hydrogen (NiH2)",
    parameters: {
      concentratorArea: 4,
      pvArea: 1.5,
      batteryCapacity: 1e4,
      baseLoad: 100,
      duration: 48,
      years: 0
    }
  },
  {
    id: "current-nasa-standard",
    name: "Current NASA Standard",
    description: "State-of-the-art technologies currently used in NASA missions. Balanced performance and reliability.",
    era: "Current",
    concentrator: "Fresnel Lens Concentrator",
    pvCell: "Triple-junction GaAs (3J)",
    battery: "Lithium-ion (NMC)",
    parameters: {
      concentratorArea: 3,
      pvArea: 1,
      batteryCapacity: 8e3,
      baseLoad: 100,
      duration: 48,
      years: 0
    }
  },
  {
    id: "future-capability",
    name: "Future Capability",
    description: "Advanced theoretical technologies offering maximum performance. Represents next-generation capabilities.",
    era: "Theoretical",
    concentrator: "Metamaterial Concentrator",
    pvCell: "Quantum Dot Solar Cells",
    battery: "Solid-State Lithium",
    parameters: {
      concentratorArea: 2,
      pvArea: 0.8,
      batteryCapacity: 6e3,
      baseLoad: 100,
      duration: 48,
      years: 0
    }
  },
  {
    id: "high-power-science",
    name: "High-Power Science",
    description: "Optimized for power-intensive scientific instruments. Uses large arrays and high-capacity batteries.",
    era: "Current",
    concentrator: "Parabolic Dish Concentrator",
    pvCell: "Quad-junction (4J) Advanced",
    battery: "Lithium-Sulfur",
    parameters: {
      concentratorArea: 5,
      pvArea: 2,
      batteryCapacity: 15e3,
      baseLoad: 150,
      duration: 48,
      years: 0
    }
  },
  {
    id: "long-duration-mission",
    name: "Long Duration Mission",
    description: "Designed for extended 10-year operations with emphasis on degradation resistance and cycle life.",
    era: "Current",
    concentrator: "Compound Parabolic Concentrator (CPC)",
    pvCell: "Multi-junction GaAs (2J)",
    battery: "Lithium-ion (LFP)",
    parameters: {
      concentratorArea: 3.5,
      pvArea: 1.2,
      batteryCapacity: 9e3,
      baseLoad: 100,
      duration: 48,
      years: 10
    }
  }
];

// server/optimizationRouter.ts
import { z as z2 } from "zod";

// server/technologyMapping.ts
var CONCENTRATOR_MAP = {
  "none": "None",
  "simple_parabolic": "Simple Parabolic Mirror",
  "flat_mirror": "Flat Mirror Array",
  "cpc": "Compound Parabolic Concentrator (CPC)",
  "fresnel_lens": "Fresnel Lens Concentrator",
  "parabolic_dish": "Parabolic Dish Concentrator",
  "linear_fresnel": "Linear Fresnel Reflector",
  "inflatable": "Inflatable Concentrator",
  "metamaterial": "Metamaterial Concentrator"
};
var PV_CELL_MAP = {
  "none": "None",
  "silicon_early": "Silicon Solar Cells (Early)",
  "gaas_single": "GaAs Single Junction",
  "silicon_mono": "Monocrystalline Silicon",
  "gaas_dual": "Multi-junction GaAs (2J)",
  "gaas_triple": "Triple-junction GaAs (3J)",
  "cigs": "CIGS Thin Film",
  "perovskite": "Perovskite Solar Cells",
  "gaas_quad": "Quad-junction (4J) Advanced",
  "quantum_dot": "Quantum Dot Solar Cells",
  "hot_carrier": "Hot Carrier Solar Cells",
  "tandem_perovskite": "Tandem Perovskite-Silicon"
};
var BATTERY_MAP = {
  "none": "None",
  "nicd": "Nickel-Cadmium (NiCd)",
  "nih2": "Nickel-Hydrogen (NiH2)",
  "agzn": "Silver-Zinc (AgZn)",
  "liion_licoo2": "Lithium-ion (LiCoO2)",
  "liion_nmc": "Lithium-ion (NMC)",
  "liion_lfp": "Lithium-ion (LFP)",
  "liion_polymer": "Lithium-Polymer",
  "solid_state": "Solid-State Lithium",
  "lisulfur": "Lithium-Sulfur",
  "liair": "Lithium-Air",
  "sodium_ion": "Sodium-ion Advanced",
  "aluminum_ion": "Aluminum-ion"
};
function idToName(id, type) {
  const maps = {
    concentrator: CONCENTRATOR_MAP,
    pv_cell: PV_CELL_MAP,
    battery: BATTERY_MAP
  };
  return maps[type][id] || "None";
}

// server/optimizationEngine.ts
function estimateMass(concentratorId, pvCellId, batteryId, concentratorArea, pvArea, batteryCapacity) {
  const concentratorMassPerM2 = {
    "none": 0,
    "simple_parabolic": 8,
    "fresnel_lens": 6,
    "parabolic_dish": 12,
    "cpc": 7,
    "metamaterial": 4
  };
  const pvMassPerM2 = {
    "none": 0,
    "gaas_single": 2,
    "gaas_dual": 2.5,
    "gaas_triple": 3,
    "gaas_quad": 3.5,
    "quantum_dot": 1.5
  };
  const batteryMassPerWh = {
    "none": 0,
    "nih2": 0.02,
    "liion_nmc": 55e-4,
    "liion_lfp": 6e-3,
    "lisulfur": 4e-3,
    "solid_state": 3e-3
  };
  const concentratorMass = concentratorMassPerM2[concentratorId] || 5;
  const pvMass = pvMassPerM2[pvCellId] || 2;
  const batteryMass = batteryMassPerWh[batteryId] || 5e-3;
  return concentratorArea * concentratorMass + pvArea * pvMass + batteryCapacity * batteryMass;
}
function estimateCost(concentratorId, pvCellId, batteryId, concentratorArea, pvArea, batteryCapacity) {
  const concentratorCostPerM2 = {
    "none": 0,
    "simple_parabolic": 500,
    "fresnel_lens": 800,
    "parabolic_dish": 1200,
    "cpc": 700,
    "metamaterial": 2e3
  };
  const pvCostPerM2 = {
    "none": 0,
    "gaas_single": 1e3,
    "gaas_dual": 1500,
    "gaas_triple": 2e3,
    "gaas_quad": 2500,
    "quantum_dot": 3e3
  };
  const batteryCostPerWh = {
    "none": 0,
    "nih2": 0.5,
    "liion_nmc": 0.3,
    "liion_lfp": 0.25,
    "lisulfur": 0.4,
    "solid_state": 0.8
  };
  const concentratorCost = concentratorCostPerM2[concentratorId] || 1e3;
  const pvCost = pvCostPerM2[pvCellId] || 1500;
  const batteryCost = batteryCostPerWh[batteryId] || 0.3;
  return concentratorArea * concentratorCost + pvArea * pvCost + batteryCapacity * batteryCost;
}
async function evaluateFitness(individual, config) {
  const { genes } = individual;
  const { constraints, objective, systemParams } = config;
  const technologies = await getTechnologies();
  const concentratorName = idToName(genes.concentratorId, "concentrator");
  const pvCellName = idToName(genes.pvCellId, "pv_cell");
  const batteryName = idToName(genes.batteryId, "battery");
  const simResult = await runSimulation({
    concentrator: concentratorName,
    pvCell: pvCellName,
    battery: batteryName,
    concentratorArea: systemParams.concentratorArea,
    pvArea: systemParams.pvArea,
    batteryCapacity: systemParams.batteryCapacity,
    baseLoad: systemParams.baseLoad,
    durationHours: systemParams.duration,
    yearsInOperation: systemParams.yearsInOperation
  }, technologies);
  const energyMargin = simResult.metrics.energy_balance;
  const mass = estimateMass(
    genes.concentratorId,
    genes.pvCellId,
    genes.batteryId,
    systemParams.concentratorArea,
    systemParams.pvArea,
    systemParams.batteryCapacity
  );
  const cost = estimateCost(
    genes.concentratorId,
    genes.pvCellId,
    genes.batteryId,
    systemParams.concentratorArea,
    systemParams.pvArea,
    systemParams.batteryCapacity
  );
  const minSOC = simResult.metrics.min_soc;
  const viable = simResult.metrics.viable;
  individual.metrics = {
    energyMargin,
    mass,
    cost,
    minSOC,
    viable
  };
  let penaltyFactor = 1;
  if (!viable) {
    penaltyFactor *= 0.1;
  }
  if (constraints.maxMass && mass > constraints.maxMass) {
    penaltyFactor *= 0.5;
  }
  if (constraints.maxCost && cost > constraints.maxCost) {
    penaltyFactor *= 0.5;
  }
  if (constraints.minPower && simResult.metrics.avg_power_generated < constraints.minPower) {
    penaltyFactor *= 0.3;
  }
  if (constraints.minSOC && minSOC < constraints.minSOC) {
    penaltyFactor *= 0.4;
  }
  let fitness = 0;
  if (objective.type === "maximize_energy_margin") {
    fitness = energyMargin * penaltyFactor;
  } else if (objective.type === "minimize_mass") {
    fitness = 1 / (mass + 1) * 1e4 * penaltyFactor;
  } else if (objective.type === "minimize_cost") {
    fitness = 1 / (cost + 1) * 1e6 * penaltyFactor;
  } else if (objective.type === "multi_objective") {
    const weights = objective.weights || {
      energyMargin: 0.4,
      mass: 0.3,
      cost: 0.3
    };
    const normalizedEnergy = energyMargin / 1e4;
    const normalizedMass = 1 / (mass + 1);
    const normalizedCost = 1 / (cost + 1);
    fitness = (weights.energyMargin * normalizedEnergy + weights.mass * normalizedMass * 100 + weights.cost * normalizedCost * 1e4) * penaltyFactor;
  }
  return fitness;
}
async function createInitialPopulation(size) {
  const technologies = await getTechnologies();
  const population = [];
  const concentratorIds = Object.keys(CONCENTRATOR_MAP);
  const pvCellIds = Object.keys(PV_CELL_MAP).filter((id) => id !== "none");
  const batteryIds = Object.keys(BATTERY_MAP);
  for (let i = 0; i < size; i++) {
    const concentratorId = concentratorIds[Math.floor(Math.random() * concentratorIds.length)];
    const pvCellId = pvCellIds[Math.floor(Math.random() * pvCellIds.length)];
    const batteryId = batteryIds[Math.floor(Math.random() * batteryIds.length)];
    population.push({
      genes: {
        concentratorId,
        pvCellId,
        batteryId
      },
      fitness: 0
    });
  }
  return population;
}
function selectParent(population, tournamentSize = 3) {
  const tournament = [];
  for (let i = 0; i < tournamentSize; i++) {
    const randomIndex = Math.floor(Math.random() * population.length);
    tournament.push(population[randomIndex]);
  }
  tournament.sort((a, b) => b.fitness - a.fitness);
  return tournament[0];
}
function crossover(parent1, parent2) {
  const offspring = {
    genes: {
      concentratorId: Math.random() < 0.5 ? parent1.genes.concentratorId : parent2.genes.concentratorId,
      pvCellId: Math.random() < 0.5 ? parent1.genes.pvCellId : parent2.genes.pvCellId,
      batteryId: Math.random() < 0.5 ? parent1.genes.batteryId : parent2.genes.batteryId
    },
    fitness: 0
  };
  return offspring;
}
function mutate(individual, mutationRate) {
  const concentratorIds = Object.keys(CONCENTRATOR_MAP);
  const pvCellIds = Object.keys(PV_CELL_MAP).filter((id) => id !== "none");
  const batteryIds = Object.keys(BATTERY_MAP);
  if (Math.random() < mutationRate) {
    individual.genes.concentratorId = concentratorIds[Math.floor(Math.random() * concentratorIds.length)];
  }
  if (Math.random() < mutationRate) {
    individual.genes.pvCellId = pvCellIds[Math.floor(Math.random() * pvCellIds.length)];
  }
  if (Math.random() < mutationRate) {
    individual.genes.batteryId = batteryIds[Math.floor(Math.random() * batteryIds.length)];
  }
}
function calculateParetoFrontier(population) {
  const frontier = [];
  for (const individual of population) {
    let isDominated = false;
    for (const other of population) {
      if (individual === other) continue;
      const iMetrics = individual.metrics;
      const oMetrics = other.metrics;
      const betterEnergy = oMetrics.energyMargin >= iMetrics.energyMargin;
      const betterMass = oMetrics.mass <= iMetrics.mass;
      const betterCost = oMetrics.cost <= iMetrics.cost;
      const strictlyBetter = oMetrics.energyMargin > iMetrics.energyMargin || oMetrics.mass < iMetrics.mass || oMetrics.cost < iMetrics.cost;
      if (betterEnergy && betterMass && betterCost && strictlyBetter) {
        isDominated = true;
        break;
      }
    }
    if (!isDominated) {
      frontier.push(individual);
    }
  }
  return frontier;
}
async function runOptimization(config, progressCallback) {
  const startTime = Date.now();
  const populationSize = config.populationSize || 50;
  const generations = config.generations || 100;
  const mutationRate = config.mutationRate || 0.1;
  const eliteSize = config.eliteSize || 5;
  let population = await createInitialPopulation(populationSize);
  for (const individual of population) {
    individual.fitness = await evaluateFitness(individual, config);
  }
  const progress = [];
  for (let gen = 0; gen < generations; gen++) {
    population.sort((a, b) => b.fitness - a.fitness);
    const avgFitness = population.reduce((sum, ind) => sum + ind.fitness, 0) / population.length;
    const progressData = {
      generation: gen,
      bestFitness: population[0].fitness,
      averageFitness: avgFitness,
      bestIndividual: JSON.parse(JSON.stringify(population[0]))
    };
    progress.push(progressData);
    if (progressCallback) {
      progressCallback(progressData);
    }
    const nextGeneration = [];
    for (let i = 0; i < eliteSize; i++) {
      nextGeneration.push(JSON.parse(JSON.stringify(population[i])));
    }
    while (nextGeneration.length < populationSize) {
      const parent1 = selectParent(population);
      const parent2 = selectParent(population);
      const offspring = crossover(parent1, parent2);
      await mutate(offspring, mutationRate);
      nextGeneration.push(offspring);
    }
    for (let i = eliteSize; i < nextGeneration.length; i++) {
      nextGeneration[i].fitness = await evaluateFitness(nextGeneration[i], config);
    }
    population = nextGeneration;
  }
  population.sort((a, b) => b.fitness - a.fitness);
  let paretoFrontier;
  if (config.objective.type === "multi_objective") {
    paretoFrontier = calculateParetoFrontier(population);
  }
  const executionTime = (Date.now() - startTime) / 1e3;
  return {
    success: true,
    bestSolution: population[0],
    allSolutions: population.slice(0, 20),
    // Top 20 solutions
    paretoFrontier,
    progress,
    executionTime
  };
}

// server/optimizationRouter.ts
var optimizationConfigSchema = z2.object({
  constraints: z2.object({
    maxMass: z2.number().optional(),
    maxCost: z2.number().optional(),
    minPower: z2.number().optional(),
    minSOC: z2.number().optional()
  }),
  objective: z2.object({
    type: z2.enum(["maximize_energy_margin", "minimize_mass", "minimize_cost", "multi_objective"]),
    weights: z2.object({
      energyMargin: z2.number().optional(),
      mass: z2.number().optional(),
      cost: z2.number().optional()
    }).optional()
  }),
  systemParams: z2.object({
    concentratorArea: z2.number(),
    pvArea: z2.number(),
    batteryCapacity: z2.number(),
    baseLoad: z2.number(),
    duration: z2.number(),
    yearsInOperation: z2.number()
  }),
  populationSize: z2.number().optional(),
  generations: z2.number().optional(),
  mutationRate: z2.number().optional(),
  eliteSize: z2.number().optional()
});
var optimizationRouter = router({
  /**
   * Run optimization to find optimal technology combinations
   */
  run: publicProcedure.input(optimizationConfigSchema).mutation(async ({ input }) => {
    try {
      const result = await runOptimization(input);
      return result;
    } catch (error) {
      console.error("Optimization error:", error);
      throw new Error(`Optimization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  })
});

// server/timelineRouter.ts
import { z as z3 } from "zod";

// server/environmentalModeling.ts
function calculateRadiationDegradation2(cellType, radiationFlux, radiationEnergy, missionDuration) {
  const secondsPerYear = 365.25 * 24 * 3600;
  const totalSeconds = missionDuration * secondsPerYear;
  const totalFluence = radiationFlux * totalSeconds;
  const energyFactor = Math.sqrt(radiationEnergy);
  const equivalentFluence = totalFluence * energyFactor;
  let degradationRate = 0.15;
  if (cellType.toLowerCase().includes("silicon") || cellType.toLowerCase().includes("si ")) {
    degradationRate = 0.25;
  } else if (cellType.toLowerCase().includes("gaas") || cellType.toLowerCase().includes("multi-junction")) {
    degradationRate = 0.12;
  } else if (cellType.toLowerCase().includes("perovskite")) {
    degradationRate = 0.35;
  } else if (cellType.toLowerCase().includes("quantum dot")) {
    degradationRate = 0.2;
  }
  const fluenceUnits = equivalentFluence / 1e15;
  const degradation = Math.min(degradationRate * fluenceUnits, 0.95);
  return degradation;
}
function calculateThermalFatigue(minTemp, maxTemp, cyclesPerOrbit, orbitPeriod, missionDuration) {
  const deltaT = maxTemp - minTemp;
  const orbitsPerYear = 365.25 * 24 / orbitPeriod;
  const totalCycles = cyclesPerOrbit * orbitsPerYear * missionDuration;
  const C = 1e6;
  const m = 2;
  const fatigueLife = C * Math.pow(deltaT, -m);
  const degradation = Math.min(totalCycles / fatigueLife, 0.9);
  return degradation;
}
function calculateImpactProbability(meteoriteFlux, averageSize, panelArea, missionDuration) {
  const totalImpacts = meteoriteFlux * panelArea * missionDuration;
  const criticalSize = 100;
  const alpha = 1.34;
  const fractionCritical = Math.pow(criticalSize / averageSize, -alpha);
  const criticalImpacts = totalImpacts * fractionCritical;
  const probability = 1 - Math.exp(-criticalImpacts);
  return probability;
}
function calculateBatteryDegradation2(minTemp, maxTemp, cyclesPerOrbit, orbitPeriod, missionDuration) {
  const deltaT = maxTemp - minTemp;
  const orbitsPerYear = 365.25 * 24 / orbitPeriod;
  const totalCycles = cyclesPerOrbit * orbitsPerYear * missionDuration;
  const tempStressFactor = Math.pow(deltaT / 20, 1.5);
  const baseRate = 5e-3 / 1e3;
  const degradationRate = baseRate * tempStressFactor;
  const degradation = Math.min(degradationRate * totalCycles, 0.8);
  return degradation;
}
function calculateDegradationProgression(cellType, factors, panelArea) {
  const progression = [];
  for (let year = 0; year <= factors.missionDuration; year++) {
    const radDeg = calculateRadiationDegradation2(
      cellType,
      factors.radiationFlux,
      factors.radiationEnergy,
      year
    );
    const thermalDeg = calculateThermalFatigue(
      factors.minTemperature,
      factors.maxTemperature,
      factors.cyclesPerOrbit,
      factors.orbitPeriod,
      year
    );
    const batteryDeg = calculateBatteryDegradation2(
      factors.minTemperature,
      factors.maxTemperature,
      factors.cyclesPerOrbit,
      factors.orbitPeriod,
      year
    );
    const pvPower = (1 - radDeg) * (1 - thermalDeg);
    const batteryCapacity = 1 - batteryDeg;
    progression.push({
      year,
      pvPower,
      batteryCapacity
    });
  }
  return progression;
}
function calculateEnvironmentalDegradation(cellType, panelArea, factors) {
  const pvRadiation = calculateRadiationDegradation2(
    cellType,
    factors.radiationFlux,
    factors.radiationEnergy,
    factors.missionDuration
  );
  const thermalFatigue = calculateThermalFatigue(
    factors.minTemperature,
    factors.maxTemperature,
    factors.cyclesPerOrbit,
    factors.orbitPeriod,
    factors.missionDuration
  );
  const impactProb = calculateImpactProbability(
    factors.meteoriteFlux,
    factors.averageSize,
    panelArea,
    factors.missionDuration
  );
  const batteryDeg = calculateBatteryDegradation2(
    factors.minTemperature,
    factors.maxTemperature,
    factors.cyclesPerOrbit,
    factors.orbitPeriod,
    factors.missionDuration
  );
  const pvDegradation = 1 - (1 - pvRadiation) * (1 - thermalFatigue);
  const batteryDegradation = batteryDeg;
  const totalDegradation = 0.6 * pvDegradation + 0.4 * batteryDegradation;
  const degradationByYear = calculateDegradationProgression(
    cellType,
    factors,
    panelArea
  );
  return {
    pvDegradation,
    batteryDegradation,
    impactProbability: impactProb,
    thermalFatigue,
    totalDegradation,
    degradationByYear
  };
}
function getDefaultPsycheEnvironment() {
  return {
    // Radiation: main belt is relatively benign compared to Jupiter
    radiationFlux: 1e6,
    // particles/cm²/s (lower than inner solar system)
    radiationEnergy: 1,
    // MeV average
    missionDuration: 6,
    // years (default mission)
    // Thermal: large temperature swings at 2.9 AU
    minTemperature: 150,
    // K (cold side, away from sun)
    maxTemperature: 250,
    // K (sun-facing side)
    cyclesPerOrbit: 1,
    // one cycle per Psyche rotation
    orbitPeriod: 4.2,
    // hours (Psyche rotation period)
    // Micrometeorites: main belt has higher flux
    meteoriteFlux: 1e-6,
    // impacts/m²/year (main belt estimate)
    averageSize: 50
    // micrometers
  };
}

// server/missionTimelineSimulation.ts
function getDefaultPsycheMissionTimeline() {
  const phases = [
    {
      id: "launch",
      name: "Launch & Early Operations",
      description: "Launch from Earth, deploy solar arrays, initial checkout",
      durationYears: 0.25,
      // 3 months
      averagePowerLoad: 150,
      // W (reduced operations)
      peakPowerLoad: 300,
      // W (deployment activities)
      minBatterySOC: 0.3,
      communicationDutyCycle: 0.1,
      // Minimal communication
      environmentalFactors: {
        // Near Earth: higher radiation
        radiationFlux: 5e3,
        // particles/cm²/s (near Earth orbit)
        minTemperature: 200,
        maxTemperature: 300
      }
    },
    {
      id: "cruise",
      name: "Deep Space Cruise",
      description: "Transit to asteroid belt, periodic trajectory corrections",
      durationYears: 3.5,
      // 3.5 years cruise
      averagePowerLoad: 100,
      // W (hibernation mode)
      peakPowerLoad: 200,
      // W (trajectory corrections)
      minBatterySOC: 0.2,
      communicationDutyCycle: 0.05,
      // Infrequent check-ins
      environmentalFactors: {
        // Deep space: lower radiation, extreme temperatures
        radiationFlux: 1e3,
        // particles/cm²/s (deep space, lower than LEO)
        minTemperature: 150,
        maxTemperature: 250
      }
    },
    {
      id: "insertion",
      name: "Orbital Insertion",
      description: "Approach Psyche, orbital insertion burns, orbit stabilization",
      durationYears: 0.5,
      // 6 months
      averagePowerLoad: 200,
      // W (active operations)
      peakPowerLoad: 400,
      // W (propulsion, high data rate)
      minBatterySOC: 0.4,
      communicationDutyCycle: 0.3,
      // Frequent communication
      environmentalFactors: {
        radiationFlux: 1500,
        // particles/cm²/s (near asteroid)
        minTemperature: 150,
        maxTemperature: 250,
        cyclesPerOrbit: 2
        // Frequent thermal cycles during approach
      }
    },
    {
      id: "science_primary",
      name: "Primary Science Operations",
      description: "Orbital science, mapping, spectroscopy, magnetometry",
      durationYears: 2,
      // 2 years primary mission
      averagePowerLoad: 250,
      // W (full science operations)
      peakPowerLoad: 500,
      // W (all instruments + high-rate downlink)
      minBatterySOC: 0.3,
      communicationDutyCycle: 0.4,
      // Regular data downlink
      environmentalFactors: {
        radiationFlux: 1500,
        // particles/cm²/s (orbiting asteroid)
        minTemperature: 150,
        maxTemperature: 250,
        cyclesPerOrbit: 1,
        // One cycle per Psyche rotation (4.2 hours)
        orbitPeriod: 4.2
      }
    },
    {
      id: "science_extended",
      name: "Extended Mission",
      description: "Extended science operations, close-approach observations",
      durationYears: 3.75,
      // Extended to 10 years total
      averagePowerLoad: 200,
      // W (reduced operations, degraded systems)
      peakPowerLoad: 400,
      // W
      minBatterySOC: 0.25,
      communicationDutyCycle: 0.3,
      environmentalFactors: {
        radiationFlux: 1500,
        // particles/cm²/s (extended mission)
        minTemperature: 150,
        maxTemperature: 250,
        cyclesPerOrbit: 1,
        orbitPeriod: 4.2
      }
    }
  ];
  const totalDuration = phases.reduce((sum, phase) => sum + phase.durationYears, 0);
  return {
    phases,
    totalDuration
  };
}
function simulatePhase(phase, startYear, initialPVEfficiency, initialBatteryCapacity, pvArea, batteryCapacityWh, cellType) {
  const baseEnv = getDefaultPsycheEnvironment();
  const phaseEnv = {
    ...baseEnv,
    ...phase.environmentalFactors,
    missionDuration: phase.durationYears
  };
  const degradation = calculateEnvironmentalDegradation(cellType, pvArea, phaseEnv);
  const endPVEfficiency = initialPVEfficiency * degradation.degradationByYear[Math.floor(phase.durationYears)]?.pvPower || initialPVEfficiency * 0.95;
  const endBatteryCapacity = initialBatteryCapacity * degradation.degradationByYear[Math.floor(phase.durationYears)]?.batteryCapacity || initialBatteryCapacity * 0.95;
  const avgPVEfficiency = (initialPVEfficiency + endPVEfficiency) / 2;
  const avgBatteryCapacity = (initialBatteryCapacity + endBatteryCapacity) / 2;
  const solarFluxAt29AU = 590;
  const averagePowerGenerated = pvArea * solarFluxAt29AU * avgPVEfficiency;
  const averagePowerConsumed = phase.averagePowerLoad;
  const hoursInPhase = phase.durationYears * 365.25 * 24;
  const energyGenerated = averagePowerGenerated * hoursInPhase;
  const energyConsumed = averagePowerConsumed * hoursInPhase;
  const energyMargin = energyGenerated - energyConsumed;
  const energyDeficitPerCycle = Math.max(0, phase.peakPowerLoad - averagePowerGenerated) * (phaseEnv.orbitPeriod || 24);
  const maxBatteryDraw = energyDeficitPerCycle / (avgBatteryCapacity * batteryCapacityWh);
  const minSOC = Math.max(phase.minBatterySOC, 1 - maxBatteryDraw);
  const avgSOC = (minSOC + 1) / 2;
  let viable = true;
  let failureReason;
  if (energyMargin < 0) {
    viable = false;
    failureReason = `Insufficient power generation: ${averagePowerGenerated.toFixed(1)}W generated vs ${averagePowerConsumed.toFixed(1)}W required`;
  } else if (minSOC < phase.minBatterySOC) {
    viable = false;
    failureReason = `Battery SOC drops below minimum: ${(minSOC * 100).toFixed(1)}% < ${(phase.minBatterySOC * 100).toFixed(1)}%`;
  } else if (endPVEfficiency < 0.3) {
    viable = false;
    failureReason = `Excessive PV degradation: ${((1 - endPVEfficiency) * 100).toFixed(1)}% degraded`;
  }
  return {
    phaseId: phase.id,
    phaseName: phase.name,
    startYear,
    endYear: startYear + phase.durationYears,
    averagePowerGenerated,
    averagePowerConsumed,
    energyMargin,
    pvEfficiencyFactor: endPVEfficiency,
    batteryCapacityFactor: endBatteryCapacity,
    cumulativeDegradation: (1 - Math.min(endPVEfficiency, endBatteryCapacity)) * 100,
    minSOC,
    avgSOC,
    viable,
    failureReason
  };
}
function simulateMissionTimeline(timeline, pvArea, batteryCapacityWh, cellType) {
  const phaseResults = [];
  let currentYear = 0;
  let currentPVEfficiency = 1;
  let currentBatteryCapacity = 1;
  for (const phase of timeline.phases) {
    const result = simulatePhase(
      phase,
      currentYear,
      currentPVEfficiency,
      currentBatteryCapacity,
      pvArea,
      batteryCapacityWh,
      cellType
    );
    phaseResults.push(result);
    currentYear = result.endYear;
    currentPVEfficiency = result.pvEfficiencyFactor;
    currentBatteryCapacity = result.batteryCapacityFactor;
    if (!result.viable) {
      break;
    }
  }
  const totalEnergyGenerated = phaseResults.reduce((sum, r) => sum + r.averagePowerGenerated * r.endYear - r.startYear * 365.25 * 24, 0) / 1e3;
  const totalEnergyConsumed = phaseResults.reduce((sum, r) => sum + r.averagePowerConsumed * (r.endYear - r.startYear) * 365.25 * 24, 0) / 1e3;
  const finalDegradation = phaseResults[phaseResults.length - 1]?.cumulativeDegradation || 0;
  const missionSuccess = phaseResults.every((r) => r.viable);
  const degradationByYear = [];
  for (let year = 0; year <= Math.ceil(timeline.totalDuration); year++) {
    let cumulativeYears = 0;
    let phaseIndex = 0;
    for (let i = 0; i < timeline.phases.length; i++) {
      if (year >= cumulativeYears && year < cumulativeYears + timeline.phases[i].durationYears) {
        phaseIndex = i;
        break;
      }
      cumulativeYears += timeline.phases[i].durationYears;
    }
    const phaseResult = phaseResults[phaseIndex];
    if (phaseResult) {
      const yearInPhase = year - phaseResult.startYear;
      const phaseFraction = yearInPhase / (phaseResult.endYear - phaseResult.startYear);
      const pvPower = 1 - (1 - phaseResult.pvEfficiencyFactor) * phaseFraction;
      const batteryCapacity = 1 - (1 - phaseResult.batteryCapacityFactor) * phaseFraction;
      const cumulativeDegradation = (1 - Math.min(pvPower, batteryCapacity)) * 100;
      degradationByYear.push({
        year,
        pvPower,
        batteryCapacity,
        cumulativeDegradation
      });
    }
  }
  return {
    timeline,
    phaseResults,
    totalEnergyGenerated,
    totalEnergyConsumed,
    finalDegradation,
    missionSuccess,
    degradationByYear
  };
}

// server/timelineRouter.ts
var missionPhaseSchema = z3.object({
  id: z3.string(),
  name: z3.string(),
  description: z3.string(),
  durationYears: z3.number(),
  averagePowerLoad: z3.number(),
  peakPowerLoad: z3.number(),
  minBatterySOC: z3.number(),
  communicationDutyCycle: z3.number()
});
var timelineRouter = router({
  /**
   * Get default Psyche mission timeline
   */
  getDefaultTimeline: publicProcedure.query(() => {
    return getDefaultPsycheMissionTimeline();
  }),
  /**
   * Simulate mission timeline with given parameters
   */
  simulate: publicProcedure.input(
    z3.object({
      phases: z3.array(missionPhaseSchema),
      pvArea: z3.number(),
      batteryCapacityWh: z3.number(),
      cellType: z3.string()
    })
  ).mutation(async ({ input }) => {
    const timeline = {
      phases: input.phases,
      totalDuration: input.phases.reduce((sum, p) => sum + p.durationYears, 0)
    };
    const result = simulateMissionTimeline(
      timeline,
      input.pvArea,
      input.batteryCapacityWh,
      input.cellType
    );
    return result;
  })
});

// server/sizingRouter.ts
import { z as z4 } from "zod";

// server/lib/componentSizing.ts
var PSYCHE_CONSTANTS2 = {
  SOLAR_CONSTANT_EARTH: 1361,
  // W/m² at 1 AU
  DISTANCE_AU: 2.9,
  // Distance from Sun in AU
  ROTATION_PERIOD: 4.2,
  // hours
  TEMP_AVG: 185,
  // Average temperature in Kelvin
  TEMP_REF: 298
  // Reference temperature for PV (K)
};
function getSolarIrradiance2() {
  return PSYCHE_CONSTANTS2.SOLAR_CONSTANT_EARTH / PSYCHE_CONSTANTS2.DISTANCE_AU ** 2;
}
function calculateAveragePower(concentratorArea, concentratorEfficiency, concentrationRatio, pvArea, pvEfficiency, tempCoefficient) {
  const irradiance = getSolarIrradiance2();
  const avgCosineLoss = 0.5;
  const concentratorPower = irradiance * concentratorArea * concentratorEfficiency * avgCosineLoss;
  const tempDelta = PSYCHE_CONSTANTS2.TEMP_AVG - PSYCHE_CONSTANTS2.TEMP_REF;
  const efficiencyAdjustment = 1 + tempCoefficient * tempDelta;
  const actualPVEfficiency = pvEfficiency * Math.max(0.1, efficiencyAdjustment);
  const pvPower = concentratorPower * actualPVEfficiency;
  return pvPower;
}
async function solveComponentSizing(requirements, concentrator, pvCell, battery) {
  const violations = [];
  if (!concentrator && !pvCell) {
    return {
      concentratorArea: 0,
      pvArea: 0,
      batteryCapacity: 0,
      totalMass: 0,
      totalCost: 0,
      energyMargin: 0,
      minSOC: 0,
      feasible: false,
      constraintViolations: ["At least one of concentrator or PV cell must be selected"],
      sensitivity: { massMargin: 0, costMargin: 0, powerMargin: 0 }
    };
  }
  if (!battery) {
    return {
      concentratorArea: 0,
      pvArea: 0,
      batteryCapacity: 0,
      totalMass: 0,
      totalCost: 0,
      energyMargin: 0,
      minSOC: 0,
      feasible: false,
      constraintViolations: ["Battery must be selected for sizing optimization"],
      sensitivity: { massMargin: 0, costMargin: 0, powerMargin: 0 }
    };
  }
  const concentratorEfficiency = concentrator?.efficiency ?? 0.85;
  const concentrationRatio = concentrator?.concentration_ratio ?? 1;
  const concentratorMassPerM2 = concentrator?.mass_per_m2 ?? 5;
  const concentratorCostPerM2 = concentrator?.cost_per_m2 ?? 1e4;
  const pvEfficiency = pvCell?.efficiency ?? 0.3;
  const tempCoefficient = pvCell?.temp_coefficient ?? -2e-3;
  const pvMassPerM2 = pvCell?.mass_per_m2 ?? 2;
  const pvCostPerM2 = pvCell?.cost_per_m2 ?? 5e4;
  const batteryEnergyDensity = battery.energy_density;
  const batteryCostPerKwh = battery.cost_per_kwh;
  const batteryCostPerWh = batteryCostPerKwh / 1e3;
  const { averagePowerLoad, peakPowerLoad, eclipseDuration, minEnergyMargin } = requirements;
  const eclipseEnergy = averagePowerLoad * eclipseDuration;
  const usableSOC = 1 - requirements.minBatterySOC / 100;
  const requiredBatteryCapacity = eclipseEnergy / usableSOC;
  const sunlitDuration = PSYCHE_CONSTANTS2.ROTATION_PERIOD / 2;
  const energyMarginFactor = 1 + minEnergyMargin / 100;
  const requiredAveragePower = (averagePowerLoad + eclipseEnergy / sunlitDuration) * energyMarginFactor;
  let pvArea = 1;
  let concentratorArea = concentrator ? pvArea * concentrationRatio : 0;
  let avgPower = 0;
  const maxIterations = 100;
  let iteration = 0;
  while (avgPower < requiredAveragePower && iteration < maxIterations) {
    concentratorArea = concentrator ? pvArea * concentrationRatio : pvArea;
    avgPower = calculateAveragePower(
      concentratorArea,
      concentratorEfficiency,
      concentrationRatio,
      pvArea,
      pvEfficiency,
      tempCoefficient
    );
    if (avgPower < requiredAveragePower) {
      pvArea *= 1.1;
    }
    iteration++;
  }
  if (iteration >= maxIterations) {
    violations.push("Unable to meet power requirements within iteration limit");
  }
  const concentratorMass = concentrator ? concentratorArea * concentratorMassPerM2 : 0;
  const pvMass = pvArea * pvMassPerM2;
  const batteryMass = requiredBatteryCapacity / batteryEnergyDensity;
  const totalMass = concentratorMass + pvMass + batteryMass;
  const concentratorCost = concentrator ? concentratorArea * concentratorCostPerM2 : 0;
  const pvCost = pvArea * pvCostPerM2;
  const batteryCost = requiredBatteryCapacity * batteryCostPerWh;
  const totalCost = concentratorCost + pvCost + batteryCost;
  if (totalMass > requirements.maxTotalMass) {
    violations.push(`Total mass (${totalMass.toFixed(1)} kg) exceeds limit (${requirements.maxTotalMass} kg)`);
  }
  if (totalCost > requirements.maxTotalCost) {
    violations.push(`Total cost ($${(totalCost / 1e6).toFixed(2)}M) exceeds limit ($${(requirements.maxTotalCost / 1e6).toFixed(2)}M)`);
  }
  if (avgPower < peakPowerLoad) {
    violations.push(`Average power (${avgPower.toFixed(1)} W) cannot meet peak load (${peakPowerLoad} W)`);
  }
  const actualEnergyMargin = (avgPower - averagePowerLoad) / averagePowerLoad * 100;
  const massMargin = (requirements.maxTotalMass - totalMass) / requirements.maxTotalMass * 100;
  const costMargin = (requirements.maxTotalCost - totalCost) / requirements.maxTotalCost * 100;
  const powerMargin = (avgPower - peakPowerLoad) / peakPowerLoad * 100;
  return {
    concentratorArea: concentrator ? concentratorArea : 0,
    pvArea,
    batteryCapacity: requiredBatteryCapacity,
    totalMass,
    totalCost,
    energyMargin: actualEnergyMargin,
    minSOC: requirements.minBatterySOC,
    feasible: violations.length === 0,
    constraintViolations: violations,
    sensitivity: {
      massMargin: Math.max(0, massMargin),
      costMargin: Math.max(0, costMargin),
      powerMargin: Math.max(0, powerMargin)
    }
  };
}
function generateSizingRecommendations(solution) {
  const recommendations = [];
  if (!solution.feasible) {
    recommendations.push("\u26A0\uFE0F Current configuration does not meet all requirements");
    if (solution.constraintViolations.some((v) => v.includes("mass"))) {
      recommendations.push("Consider selecting lighter technologies or relaxing mass constraints");
    }
    if (solution.constraintViolations.some((v) => v.includes("cost"))) {
      recommendations.push("Consider selecting more cost-effective technologies or increasing budget");
    }
    if (solution.constraintViolations.some((v) => v.includes("power"))) {
      recommendations.push("Consider increasing PV array size or selecting higher efficiency cells");
    }
  } else {
    recommendations.push("\u2705 Configuration meets all requirements");
    if (solution.sensitivity.massMargin > 20) {
      recommendations.push(`Significant mass margin (${solution.sensitivity.massMargin.toFixed(1)}%) - could reduce component sizes`);
    }
    if (solution.sensitivity.costMargin > 20) {
      recommendations.push(`Significant cost margin (${solution.sensitivity.costMargin.toFixed(1)}%) - could upgrade to higher performance technologies`);
    }
    if (solution.sensitivity.powerMargin > 30) {
      recommendations.push(`High power margin (${solution.sensitivity.powerMargin.toFixed(1)}%) - system is over-designed`);
    }
    if (solution.sensitivity.powerMargin < 10) {
      recommendations.push(`Low power margin (${solution.sensitivity.powerMargin.toFixed(1)}%) - consider adding buffer for degradation`);
    }
  }
  return recommendations;
}

// server/sizingRouter.ts
var sizingRouter = router({
  /**
   * Solve for optimal component sizes based on requirements
   */
  solve: publicProcedure.input(
    z4.object({
      // Power requirements
      averagePowerLoad: z4.number().min(1).max(1e4),
      peakPowerLoad: z4.number().min(1).max(1e4),
      // Energy margin requirements
      minEnergyMargin: z4.number().min(0).max(100),
      minBatterySOC: z4.number().min(0).max(100),
      // Mission parameters
      eclipseDuration: z4.number().min(0.1).max(24),
      missionDuration: z4.number().min(0.1).max(20),
      // Constraints
      maxTotalMass: z4.number().min(1).max(1e4),
      maxTotalCost: z4.number().min(1e3).max(1e9),
      // Selected technologies
      concentratorId: z4.string().nullable(),
      pvCellId: z4.string(),
      batteryId: z4.string()
    })
  ).mutation(async ({ input }) => {
    const technologies = await getTechnologies();
    const concentrator = input.concentratorId && input.concentratorId !== "none" ? technologies.concentrators.find((c) => c.name === input.concentratorId) || null : null;
    const pvCell = technologies.pv_cells.find((p) => p.name === input.pvCellId) || null;
    const battery = technologies.batteries.find((b) => b.name === input.batteryId) || null;
    if (!pvCell) {
      throw new Error(`PV cell not found: ${input.pvCellId}`);
    }
    if (!battery) {
      throw new Error(`Battery not found: ${input.batteryId}`);
    }
    const solution = await solveComponentSizing(
      {
        averagePowerLoad: input.averagePowerLoad,
        peakPowerLoad: input.peakPowerLoad,
        minEnergyMargin: input.minEnergyMargin,
        minBatterySOC: input.minBatterySOC,
        eclipseDuration: input.eclipseDuration,
        missionDuration: input.missionDuration,
        maxTotalMass: input.maxTotalMass,
        maxTotalCost: input.maxTotalCost,
        concentratorId: input.concentratorId,
        pvCellId: input.pvCellId,
        batteryId: input.batteryId
      },
      concentrator,
      pvCell,
      battery
    );
    const recommendations = generateSizingRecommendations(solution);
    return {
      solution,
      recommendations,
      technologies: {
        concentrator: concentrator?.name || "None",
        pvCell: pvCell.name,
        battery: battery.name
      }
    };
  })
});

// server/costBenefitRouter.ts
import { z as z5 } from "zod";

// server/lib/costBenefitAnalysis.ts
function calculateLifecycleCost(config) {
  const { concentrator, pvCell, battery, concentratorArea, pvArea, batteryCapacity, missionDuration } = config;
  const concentratorCost = concentrator ? concentratorArea * concentrator.cost_per_m2 : 0;
  const pvCost = pvCell ? pvArea * pvCell.cost_per_m2 : 0;
  const batteryCost = battery ? batteryCapacity / 1e3 * battery.cost_per_kwh : 0;
  const componentCost = concentratorCost + pvCost + batteryCost;
  const avgTRL = ((concentrator?.trl ?? 9) + (pvCell?.trl ?? 9) + (battery?.trl ?? 9)) / 3;
  const trlFactor = Math.max(1, (10 - avgTRL) / 3);
  const developmentCost = componentCost * 0.5 * trlFactor;
  const testingCost = componentCost * 0.2 * trlFactor;
  const qualificationCost = componentCost * 0.3 * trlFactor;
  const integrationCost = componentCost * 0.15;
  const totalMass = calculateMassBudget(config).totalMass;
  const launchCostPerKg = 5e4;
  const launchCost = totalMass * launchCostPerKg;
  const totalNonRecurring = developmentCost + testingCost + qualificationCost;
  const totalRecurring = componentCost + integrationCost + launchCost;
  const totalLifecycle = totalNonRecurring + totalRecurring;
  const costPerWatt = totalLifecycle / config.averagePower;
  const costPerKg = totalLifecycle / totalMass;
  const costPerYear = totalLifecycle / missionDuration;
  return {
    developmentCost,
    testingCost,
    qualificationCost,
    componentCost,
    integrationCost,
    launchCost,
    totalNonRecurring,
    totalRecurring,
    totalLifecycle,
    costPerWatt,
    costPerKg,
    costPerYear
  };
}
function calculateMassBudget(config) {
  const { concentrator, pvCell, battery, concentratorArea, pvArea, batteryCapacity } = config;
  const concentratorMass = concentrator ? concentratorArea * concentrator.mass_per_m2 : 0;
  const pvMass = pvCell ? pvArea * pvCell.mass_per_m2 : 0;
  const batteryMass = battery ? batteryCapacity / 1e3 * battery.mass_per_kwh : 0;
  const componentMass = concentratorMass + pvMass + batteryMass;
  const structureMass = componentMass * 0.2;
  const harnessMass = componentMass * 0.05;
  const subtotal = componentMass + structureMass + harnessMass;
  const contingencyMass = subtotal * 0.1;
  const totalMass = subtotal + contingencyMass;
  const powerToMassRatio = config.averagePower / totalMass;
  return {
    concentratorMass,
    pvMass,
    batteryMass,
    structureMass,
    harnessMass,
    contingencyMass,
    totalMass,
    powerToMassRatio
  };
}
function assessTRLRisk(config) {
  const { concentrator, pvCell, battery } = config;
  const concentratorTRL = concentrator?.trl ?? 9;
  const pvCellTRL = pvCell?.trl ?? 9;
  const batteryTRL = battery?.trl ?? 9;
  const systemTRL = Math.min(concentratorTRL, pvCellTRL, batteryTRL);
  const riskScore = (9 - systemTRL) / 8 * 100;
  let riskLevel;
  if (systemTRL >= 8) riskLevel = "Low";
  else if (systemTRL >= 6) riskLevel = "Medium";
  else if (systemTRL >= 4) riskLevel = "High";
  else riskLevel = "Very High";
  const developmentTime = Math.max(0, (9 - systemTRL) * 1.5);
  let developmentRisk = "";
  if (systemTRL >= 8) {
    developmentRisk = "Flight-proven technology with minimal development risk";
  } else if (systemTRL >= 6) {
    developmentRisk = "Technology demonstrated in relevant environment; moderate development required";
  } else if (systemTRL >= 4) {
    developmentRisk = "Technology validated in laboratory; significant development and testing required";
  } else {
    developmentRisk = "Early-stage technology; extensive research, development, and validation required";
  }
  const recommendations = [];
  if (systemTRL < 6) {
    recommendations.push("Consider technology maturation program before mission commitment");
    recommendations.push("Develop backup options with higher TRL");
  }
  if (systemTRL < 8) {
    recommendations.push("Plan for extensive ground testing and qualification");
    recommendations.push("Budget additional schedule margin for development");
  }
  if (concentratorTRL < pvCellTRL - 2 || concentratorTRL < batteryTRL - 2) {
    recommendations.push("Concentrator technology is less mature than other components");
  }
  if (pvCellTRL < 7) {
    recommendations.push("PV cell technology requires space environment validation");
  }
  if (batteryTRL < 7) {
    recommendations.push("Battery technology requires long-duration cycling tests");
  }
  if (recommendations.length === 0) {
    recommendations.push("All technologies are flight-proven; low technical risk");
  }
  return {
    concentratorTRL,
    pvCellTRL,
    batteryTRL,
    systemTRL,
    riskLevel,
    riskScore,
    developmentTime,
    developmentRisk,
    recommendations
  };
}
function performCostBenefitAnalysis(config) {
  const lifecycle = calculateLifecycleCost(config);
  const mass = calculateMassBudget(config);
  const trl = assessTRLRisk(config);
  const powerScore = Math.min(100, config.averagePower / 500 * 100);
  const marginScore = Math.min(100, config.energyMargin * 2);
  const massScore = Math.min(100, mass.powerToMassRatio * 10);
  const performanceScore = (powerScore + marginScore + massScore) / 3;
  const costEffectiveness = performanceScore / (lifecycle.totalLifecycle / 1e6);
  const riskDiscount = 1 - trl.riskScore / 200;
  const riskAdjustedValue = performanceScore * riskDiscount;
  let recommendation = "";
  if (performanceScore > 70 && trl.riskLevel === "Low" && lifecycle.costPerWatt < 1e5) {
    recommendation = "\u2705 Excellent choice: High performance, low risk, cost-effective";
  } else if (performanceScore > 60 && trl.riskLevel !== "Very High") {
    recommendation = "\u2713 Good choice: Balanced performance and risk";
  } else if (trl.riskLevel === "Very High") {
    recommendation = "\u26A0\uFE0F High risk: Significant technology development required";
  } else if (lifecycle.costPerWatt > 15e4) {
    recommendation = "\u26A0\uFE0F Expensive: Consider more cost-effective alternatives";
  } else if (performanceScore < 50) {
    recommendation = "\u26A0\uFE0F Low performance: May not meet mission requirements";
  } else {
    recommendation = "\u25CB Acceptable: Meets basic requirements but room for improvement";
  }
  const tradeoffs = [];
  if (performanceScore > 70 && lifecycle.costPerWatt > 1e5) {
    tradeoffs.push("High performance comes at premium cost");
  }
  if (trl.riskLevel === "Low" && performanceScore < 60) {
    tradeoffs.push("Low risk but limited performance potential");
  }
  if (mass.powerToMassRatio > 8 && lifecycle.costPerWatt > 12e4) {
    tradeoffs.push("Excellent power-to-mass ratio but high cost");
  }
  if (trl.riskLevel !== "Low" && performanceScore > 75) {
    tradeoffs.push("High performance potential but requires technology maturation");
  }
  if (lifecycle.launchCost > lifecycle.componentCost) {
    tradeoffs.push("Launch costs dominate lifecycle budget - consider mass reduction");
  }
  if (tradeoffs.length === 0) {
    tradeoffs.push("Well-balanced configuration with no major tradeoffs");
  }
  return {
    lifecycle,
    mass,
    trl,
    performanceScore,
    costEffectiveness,
    riskAdjustedValue,
    recommendation,
    tradeoffs
  };
}
function compareConfigurations(configs) {
  if (configs.length === 0) {
    return {
      bestPerformance: "N/A",
      bestCost: "N/A",
      bestRisk: "N/A",
      bestValue: "N/A",
      summary: "No configurations to compare"
    };
  }
  const bestPerformance = configs.reduce(
    (best, curr) => curr.analysis.performanceScore > best.analysis.performanceScore ? curr : best
  );
  const bestCost = configs.reduce(
    (best, curr) => curr.analysis.lifecycle.costPerWatt < best.analysis.lifecycle.costPerWatt ? curr : best
  );
  const bestRisk = configs.reduce(
    (best, curr) => curr.analysis.trl.riskScore < best.analysis.trl.riskScore ? curr : best
  );
  const bestValue = configs.reduce(
    (best, curr) => curr.analysis.riskAdjustedValue > best.analysis.riskAdjustedValue ? curr : best
  );
  const summary = `Best overall value: ${bestValue.name} (score: ${bestValue.analysis.riskAdjustedValue.toFixed(1)}). Highest performance: ${bestPerformance.name}. Most cost-effective: ${bestCost.name}. Lowest risk: ${bestRisk.name}.`;
  return {
    bestPerformance: bestPerformance.name,
    bestCost: bestCost.name,
    bestRisk: bestRisk.name,
    bestValue: bestValue.name,
    summary
  };
}

// server/costBenefitRouter.ts
var costBenefitRouter = router({
  /**
   * Analyze a single configuration
   */
  analyze: publicProcedure.input(
    z5.object({
      concentratorId: z5.string().nullable(),
      pvCellId: z5.string(),
      batteryId: z5.string(),
      // System sizing
      concentratorArea: z5.number().min(0),
      pvArea: z5.number().min(0.1),
      batteryCapacity: z5.number().min(100),
      // Performance metrics
      averagePower: z5.number().min(1),
      peakPower: z5.number().min(1),
      energyMargin: z5.number(),
      // Mission parameters
      missionDuration: z5.number().min(0.1).max(20)
    })
  ).mutation(async ({ input }) => {
    const technologies = await getTechnologies();
    const concentrator = input.concentratorId && input.concentratorId !== "none" ? technologies.concentrators.find((c) => c.name === input.concentratorId) || null : null;
    const pvCell = technologies.pv_cells.find((p) => p.name === input.pvCellId) || null;
    const battery = technologies.batteries.find((b) => b.name === input.batteryId) || null;
    if (!pvCell) {
      throw new Error(`PV cell not found: ${input.pvCellId}`);
    }
    if (!battery) {
      throw new Error(`Battery not found: ${input.batteryId}`);
    }
    const analysis = performCostBenefitAnalysis({
      concentrator,
      pvCell,
      battery,
      concentratorArea: input.concentratorArea,
      pvArea: input.pvArea,
      batteryCapacity: input.batteryCapacity,
      averagePower: input.averagePower,
      peakPower: input.peakPower,
      energyMargin: input.energyMargin,
      missionDuration: input.missionDuration
    });
    return {
      analysis,
      technologies: {
        concentrator: concentrator?.name || "None",
        pvCell: pvCell.name,
        battery: battery.name
      }
    };
  }),
  /**
   * Compare multiple configurations
   */
  compare: publicProcedure.input(
    z5.object({
      configurations: z5.array(
        z5.object({
          name: z5.string(),
          concentratorId: z5.string().nullable(),
          pvCellId: z5.string(),
          batteryId: z5.string(),
          concentratorArea: z5.number(),
          pvArea: z5.number(),
          batteryCapacity: z5.number(),
          averagePower: z5.number(),
          peakPower: z5.number(),
          energyMargin: z5.number(),
          missionDuration: z5.number()
        })
      ).min(2).max(10)
    })
  ).mutation(async ({ input }) => {
    const technologies = await getTechnologies();
    const comparisons = [];
    for (const config of input.configurations) {
      const concentrator = config.concentratorId && config.concentratorId !== "none" ? technologies.concentrators.find((c) => c.name === config.concentratorId) || null : null;
      const pvCell = technologies.pv_cells.find((p) => p.name === config.pvCellId) || null;
      const battery = technologies.batteries.find((b) => b.name === config.batteryId) || null;
      if (!pvCell || !battery) continue;
      const analysis = performCostBenefitAnalysis({
        concentrator,
        pvCell,
        battery,
        concentratorArea: config.concentratorArea,
        pvArea: config.pvArea,
        batteryCapacity: config.batteryCapacity,
        averagePower: config.averagePower,
        peakPower: config.peakPower,
        energyMargin: config.energyMargin,
        missionDuration: config.missionDuration
      });
      comparisons.push({
        name: config.name,
        analysis
      });
    }
    const comparison = compareConfigurations(comparisons);
    return {
      comparisons,
      comparison
    };
  })
});

// server/scenarioRouter.ts
import { z as z6 } from "zod";

// server/db/sizingScenarios.ts
import { eq as eq2, and, desc as desc2 } from "drizzle-orm";
async function createSizingScenario(scenario) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(sizingScenarios).values(scenario).$returningId();
  const [result] = await db.select().from(sizingScenarios).where(eq2(sizingScenarios.id, inserted.id)).limit(1);
  if (!result) throw new Error("Failed to create sizing scenario");
  return result;
}
async function getUserSizingScenarios(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sizingScenarios).where(eq2(sizingScenarios.userId, userId)).orderBy(desc2(sizingScenarios.createdAt));
}
async function getSizingScenarioById(id, userId) {
  const db = await getDb();
  if (!db) return void 0;
  const [result] = await db.select().from(sizingScenarios).where(and(eq2(sizingScenarios.id, id), eq2(sizingScenarios.userId, userId))).limit(1);
  return result;
}
async function updateSizingScenario(id, userId, updates) {
  const db = await getDb();
  if (!db) return void 0;
  await db.update(sizingScenarios).set(updates).where(and(eq2(sizingScenarios.id, id), eq2(sizingScenarios.userId, userId)));
  return getSizingScenarioById(id, userId);
}
async function deleteSizingScenario(id, userId) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(sizingScenarios).where(and(eq2(sizingScenarios.id, id), eq2(sizingScenarios.userId, userId)));
  return true;
}
async function getSizingScenariosForComparison(ids, userId) {
  const db = await getDb();
  if (!db || ids.length === 0) return [];
  const results = await db.select().from(sizingScenarios).where(eq2(sizingScenarios.userId, userId));
  return results.filter((s) => ids.includes(s.id));
}

// server/db/costBenefitScenarios.ts
import { eq as eq3, and as and2, desc as desc3 } from "drizzle-orm";
async function createCostBenefitScenario(scenario) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(costBenefitScenarios).values(scenario).$returningId();
  const [result] = await db.select().from(costBenefitScenarios).where(eq3(costBenefitScenarios.id, inserted.id)).limit(1);
  if (!result) throw new Error("Failed to create cost-benefit scenario");
  return result;
}
async function getUserCostBenefitScenarios(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(costBenefitScenarios).where(eq3(costBenefitScenarios.userId, userId)).orderBy(desc3(costBenefitScenarios.createdAt));
}
async function getCostBenefitScenarioById(id, userId) {
  const db = await getDb();
  if (!db) return void 0;
  const [result] = await db.select().from(costBenefitScenarios).where(and2(eq3(costBenefitScenarios.id, id), eq3(costBenefitScenarios.userId, userId))).limit(1);
  return result;
}
async function updateCostBenefitScenario(id, userId, updates) {
  const db = await getDb();
  if (!db) return void 0;
  await db.update(costBenefitScenarios).set(updates).where(and2(eq3(costBenefitScenarios.id, id), eq3(costBenefitScenarios.userId, userId)));
  return getCostBenefitScenarioById(id, userId);
}
async function deleteCostBenefitScenario(id, userId) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(costBenefitScenarios).where(and2(eq3(costBenefitScenarios.id, id), eq3(costBenefitScenarios.userId, userId)));
  return true;
}
async function getCostBenefitScenariosForComparison(ids, userId) {
  const db = await getDb();
  if (!db || ids.length === 0) return [];
  const results = await db.select().from(costBenefitScenarios).where(eq3(costBenefitScenarios.userId, userId));
  return results.filter((s) => ids.includes(s.id));
}

// server/scenarioRouter.ts
var scenarioRouter = router({
  sizing: router({
    /**
     * Save a new sizing scenario
     */
    save: protectedProcedure.input(
      z6.object({
        name: z6.string().min(1).max(255),
        description: z6.string().optional(),
        notes: z6.string().optional(),
        tags: z6.string().optional(),
        avgPower: z6.number(),
        peakPower: z6.number(),
        energyMargin: z6.number(),
        minSOC: z6.number(),
        eclipseDuration: z6.number(),
        missionDuration: z6.number(),
        maxMass: z6.number(),
        maxCost: z6.number(),
        concentrator: z6.string(),
        pvCell: z6.string(),
        battery: z6.string(),
        resultsJson: z6.string()
      })
    ).mutation(async ({ ctx, input }) => {
      return createSizingScenario({
        userId: ctx.user.id,
        createdBy: ctx.user.name || ctx.user.email || "Unknown",
        lastModifiedBy: ctx.user.name || ctx.user.email || "Unknown",
        ...input
      });
    }),
    /**
     * Get all sizing scenarios for current user
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserSizingScenarios(ctx.user.id);
    }),
    /**
     * Get a single sizing scenario
     */
    get: protectedProcedure.input(z6.object({ id: z6.number() })).query(async ({ ctx, input }) => {
      return getSizingScenarioById(input.id, ctx.user.id);
    }),
    /**
     * Update a sizing scenario
     */
    update: protectedProcedure.input(
      z6.object({
        id: z6.number(),
        name: z6.string().min(1).max(255).optional(),
        description: z6.string().optional(),
        notes: z6.string().optional(),
        tags: z6.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      return updateSizingScenario(id, ctx.user.id, {
        ...updates,
        lastModifiedBy: ctx.user.name || ctx.user.email || "Unknown"
      });
    }),
    /**
     * Delete a sizing scenario
     */
    delete: protectedProcedure.input(z6.object({ id: z6.number() })).mutation(async ({ ctx, input }) => {
      return deleteSizingScenario(input.id, ctx.user.id);
    }),
    /**
     * Get multiple scenarios for comparison
     */
    compare: protectedProcedure.input(z6.object({ ids: z6.array(z6.number()) })).query(async ({ ctx, input }) => {
      return getSizingScenariosForComparison(input.ids, ctx.user.id);
    })
  }),
  costBenefit: router({
    /**
     * Save a new cost-benefit scenario
     */
    save: protectedProcedure.input(
      z6.object({
        name: z6.string().min(1).max(255),
        description: z6.string().optional(),
        notes: z6.string().optional(),
        tags: z6.string().optional(),
        avgPower: z6.number(),
        peakPower: z6.number(),
        missionDuration: z6.number(),
        concentrator: z6.string(),
        pvCell: z6.string(),
        battery: z6.string(),
        resultsJson: z6.string()
      })
    ).mutation(async ({ ctx, input }) => {
      return createCostBenefitScenario({
        userId: ctx.user.id,
        createdBy: ctx.user.name || ctx.user.email || "Unknown",
        lastModifiedBy: ctx.user.name || ctx.user.email || "Unknown",
        ...input
      });
    }),
    /**
     * Get all cost-benefit scenarios for current user
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserCostBenefitScenarios(ctx.user.id);
    }),
    /**
     * Get a single cost-benefit scenario
     */
    get: protectedProcedure.input(z6.object({ id: z6.number() })).query(async ({ ctx, input }) => {
      return getCostBenefitScenarioById(input.id, ctx.user.id);
    }),
    /**
     * Update a cost-benefit scenario
     */
    update: protectedProcedure.input(
      z6.object({
        id: z6.number(),
        name: z6.string().min(1).max(255).optional(),
        description: z6.string().optional(),
        notes: z6.string().optional(),
        tags: z6.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      return updateCostBenefitScenario(id, ctx.user.id, {
        ...updates,
        lastModifiedBy: ctx.user.name || ctx.user.email || "Unknown"
      });
    }),
    /**
     * Delete a cost-benefit scenario
     */
    delete: protectedProcedure.input(z6.object({ id: z6.number() })).mutation(async ({ ctx, input }) => {
      return deleteCostBenefitScenario(input.id, ctx.user.id);
    }),
    /**
     * Get multiple scenarios for comparison
     */
    compare: protectedProcedure.input(z6.object({ ids: z6.array(z6.number()) })).query(async ({ ctx, input }) => {
      return getCostBenefitScenariosForComparison(input.ids, ctx.user.id);
    })
  })
});

// server/routers.ts
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  // Configuration presets router
  presets: router({
    list: publicProcedure.query(() => {
      return CONFIGURATION_PRESETS;
    })
  }),
  // Simulation feature router
  simulation: router({
    // Get available technologies
    getTechnologies: publicProcedure.query(async () => {
      return await getTechnologies();
    }),
    // Run a new simulation
    run: publicProcedure.input(
      z7.object({
        concentrator: z7.string(),
        pv_cell: z7.string(),
        battery: z7.string(),
        concentrator_area_m2: z7.number().optional(),
        pv_area_m2: z7.number().optional(),
        battery_capacity_wh: z7.number().optional(),
        base_load_w: z7.number().optional(),
        duration_hours: z7.number().optional(),
        years_operation: z7.number().optional(),
        spacecraft_class: z7.string().optional(),
        use_simple_model: z7.boolean().optional(),
        save: z7.boolean().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const technologies = await getTechnologies();
      const results = await runSimulation({
        concentrator: input.concentrator,
        pvCell: input.pv_cell,
        battery: input.battery,
        concentratorArea: input.concentrator_area_m2 || 3,
        pvArea: input.pv_area_m2 || 1,
        batteryCapacity: input.battery_capacity_wh || 8e3,
        baseLoad: input.base_load_w || 100,
        durationHours: input.duration_hours || 48,
        yearsInOperation: input.years_operation || 0,
        spacecraftClass: input.spacecraft_class || "flagship",
        useSimpleModel: input.use_simple_model || false
      }, technologies);
      if (input.save && ctx.user) {
        await saveSimulation({
          userId: ctx.user.id,
          concentrator: input.concentrator,
          pvCell: input.pv_cell,
          battery: input.battery,
          concentratorArea: Math.round((input.concentrator_area_m2 || 3) * 100),
          pvArea: Math.round((input.pv_area_m2 || 1) * 100),
          batteryCapacity: Math.round(input.battery_capacity_wh || 8e3),
          baseLoad: Math.round(input.base_load_w || 100),
          durationHours: Math.round(input.duration_hours || 48),
          yearsOperation: Math.round(input.years_operation || 0),
          avgPowerGenerated: Math.round((results.metrics?.avg_power_generated || 0) * 100),
          maxPowerGenerated: Math.round((results.metrics?.peak_power_generated || 0) * 100),
          avgPowerConsumed: Math.round((results.metrics?.avg_power_consumed || 0) * 100),
          minBatterySoc: Math.round((results.metrics?.min_soc || 0) * 1e4),
          maxBatterySoc: Math.round(1e4),
          finalBatterySoc: Math.round((results.metrics?.final_soc || 0) * 1e4),
          energyGenerated: Math.round((results.metrics?.avg_power_generated || 0) * (input.duration_hours || 48)),
          energyConsumed: Math.round((results.metrics?.avg_power_consumed || 0) * (input.duration_hours || 48)),
          energyBalance: Math.round(results.metrics?.energy_balance || 0),
          systemViable: results.metrics?.viable ? 1 : 0,
          resultsJson: JSON.stringify(results)
        });
      }
      return results;
    }),
    // Get user's simulation history
    getHistory: publicProcedure.input(z7.object({ limit: z7.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return await getUserSimulations(ctx.user.id, input?.limit || 10);
    }),
    // Get specific simulation by ID
    getById: publicProcedure.input(z7.object({ id: z7.number() })).query(async ({ input }) => {
      const simulation = await getSimulationById(input.id);
      if (!simulation) {
        throw new Error("Simulation not found");
      }
      return {
        ...simulation,
        results: JSON.parse(simulation.resultsJson)
      };
    })
  }),
  // Optimization router
  optimization: optimizationRouter,
  // Mission timeline router
  timeline: timelineRouter,
  // Component sizing router
  sizing: sizingRouter,
  // Cost-benefit analysis router
  costBenefit: costBenefitRouter,
  // Scenario management router
  scenarios: scenarioRouter,
  // Accuracy comparison router
  accuracy: router({
    // Run dual simulation (simple vs. advanced models)
    compare: publicProcedure.input(
      z7.object({
        concentrator: z7.string(),
        pv_cell: z7.string(),
        battery: z7.string(),
        concentrator_area_m2: z7.number().optional(),
        pv_area_m2: z7.number().optional(),
        battery_capacity_wh: z7.number().optional(),
        base_load_w: z7.number().optional(),
        duration_hours: z7.number().optional(),
        years_operation: z7.number().optional()
      })
    ).mutation(async ({ input }) => {
      const technologies = await getTechnologies();
      const config = {
        concentrator: input.concentrator,
        pvCell: input.pv_cell,
        battery: input.battery,
        concentratorArea: input.concentrator_area_m2 || 3,
        pvArea: input.pv_area_m2 || 1,
        batteryCapacity: input.battery_capacity_wh || 8e3,
        baseLoad: input.base_load_w || 100,
        durationHours: input.duration_hours || 48,
        yearsInOperation: input.years_operation || 0
      };
      const advancedResults = await runSimulation(config, technologies);
      const simpleResults = await runSimulation(
        { ...config, yearsInOperation: 0 },
        // No degradation
        technologies
      );
      return {
        simple: simpleResults,
        advanced: advancedResults,
        config
      };
    })
  }),
  // Saved configurations router for comparison mode
  configurations: router({
    // List user's saved configurations
    list: publicProcedure.query(async ({ ctx }) => {
      return await getUserSavedConfigurations(ctx.user.id);
    }),
    // Get specific configuration by ID
    getById: publicProcedure.input(z7.object({ id: z7.number() })).query(async ({ input, ctx }) => {
      const config = await getSavedConfigurationById(input.id);
      if (!config) {
        throw new Error("Configuration not found");
      }
      if (config.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      return config;
    }),
    // Save a new configuration
    save: publicProcedure.input(
      z7.object({
        name: z7.string().min(1).max(255),
        description: z7.string().optional(),
        concentrator: z7.string().optional(),
        pvCell: z7.string(),
        battery: z7.string(),
        concentratorArea: z7.number().default(3),
        pvArea: z7.number().default(1),
        batteryCapacity: z7.number().default(8e3),
        baseLoad: z7.number().default(100),
        durationHours: z7.number().default(48),
        yearsOperation: z7.number().default(0),
        lastSimulationId: z7.number().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      return await saveSavedConfiguration({
        userId: ctx.user.id,
        name: input.name,
        description: input.description || null,
        concentrator: input.concentrator || null,
        pvCell: input.pvCell,
        battery: input.battery,
        concentratorArea: input.concentratorArea,
        pvArea: input.pvArea,
        batteryCapacity: input.batteryCapacity,
        baseLoad: input.baseLoad,
        durationHours: input.durationHours,
        yearsOperation: input.yearsOperation,
        lastSimulationId: input.lastSimulationId || null
      });
    }),
    // Update existing configuration
    update: publicProcedure.input(
      z7.object({
        id: z7.number(),
        name: z7.string().min(1).max(255).optional(),
        description: z7.string().optional(),
        concentrator: z7.string().optional(),
        pvCell: z7.string().optional(),
        battery: z7.string().optional(),
        concentratorArea: z7.number().optional(),
        pvArea: z7.number().optional(),
        batteryCapacity: z7.number().optional(),
        baseLoad: z7.number().optional(),
        durationHours: z7.number().optional(),
        yearsOperation: z7.number().optional(),
        lastSimulationId: z7.number().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const existing = await getSavedConfigurationById(input.id);
      if (!existing) {
        throw new Error("Configuration not found");
      }
      if (existing.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      const { id, ...updates } = input;
      return await updateSavedConfiguration(id, updates);
    }),
    // Delete configuration
    delete: publicProcedure.input(z7.object({ id: z7.number() })).mutation(async ({ input, ctx }) => {
      const existing = await getSavedConfigurationById(input.id);
      if (!existing) {
        throw new Error("Configuration not found");
      }
      if (existing.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      return await deleteSavedConfiguration(input.id);
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  base: "/platinum_03b_future_power-ee/",
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
