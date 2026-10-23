import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "tests/server-only-stub.ts"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgres://kalima:kalima@localhost:5432/kalima_test",
      SESSION_SECRET: "test-secret-test-secret-test-secret-123",
      EMAIL_PROVIDER: "log",
      APP_URL: "http://localhost:3000",
    },
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
