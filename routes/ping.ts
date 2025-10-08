import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { getDriver } from "@/lib/neo4j.ts";
import { ApiSuccessSchema, ApiErrorSchema } from "@/lib/schemas.ts";

export const pingRouter = new OpenAPIHono();

/**
 * GET /ping
 *
 * Purpose: Health check endpoint to verify API and database connectivity
 *
 * Neo4j Query: Simple connectivity test using driver.verifyConnectivity()
 *
 * Example: GET /api/ping
 */

const PingResponseSchema = z.object({
  status: z.string().openapi({ example: "ok" }),
  timestamp: z.string().openapi({ example: "2025-10-08T13:00:00.000Z" }),
  database: z.string().openapi({ example: "connected" }),
});

const pingRoute = createRoute({
  method: "get",
  path: "/ping",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiSuccessSchema(PingResponseSchema),
        },
      },
      description: "API and database are healthy",
    },
    500: {
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
      description: "API or database is unhealthy",
    },
  },
  tags: ["Utilities"],
});

pingRouter.openapi(pingRoute, async (c) => {
  try {
    // Test database connectivity
    const driver = getDriver();
    await driver.verifyConnectivity();

    return c.json({
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
      },
    });
  } catch (error) {
    console.error("Ping error:", error);
    return c.json({
      success: false,
      error: {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : "Database connection failed",
      },
    }, 500);
  }
});
