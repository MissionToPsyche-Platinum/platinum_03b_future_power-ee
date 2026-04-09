import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "client/**/*.test.ts", "client/**/*.spec.ts"],
    environmentMatchGlobs: [
      // Client-side tests need a browser-like environment with localStorage
      ["client/**/*.test.ts", "jsdom"],
      ["client/**/*.spec.ts", "jsdom"],
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client/src"),
    },
  },
});
