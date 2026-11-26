import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          NEO4J_URI: "neo4j+s://test.databases.neo4j.io",
          NEO4J_USERNAME: "neo4j",
          NEO4J_PASSWORD: "test-password",
          NEO4J_DATABASE: "neo4j",
        },
      },
    }),
  ],
  test: {
    include: ["test/**/*.test.ts"],
  },
});
