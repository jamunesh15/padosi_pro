import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    maxWorkers: 2,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
