import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { runQuery } from "@/lib/neo4j.ts";
import { ApiSuccessSchema, ApiErrorSchema } from "@/lib/schemas.ts";

export const statsRouter = new OpenAPIHono();

/**
 * GET /stats
 *
 * Purpose: Get comprehensive statistics about the database
 *
 * Neo4j Queries:
 * 1. Total bills count by type (HB vs SB)
 * 2. Total congresses count
 * 3. Total people count
 * 4. Total committees count
 * 5. Bills with/without filing dates
 * 6. Bills by congress breakdown
 *
 * Example: GET /api/stats
 */

const StatsSchema = z.object({
  total_bills: z.number(),
  total_house_bills: z.number(),
  total_senate_bills: z.number(),
  total_congresses: z.number(),
  total_people: z.number(),
  total_committees: z.number(),
  bills_with_dates: z.number(),
  bills_without_dates: z.number(),
  bills_by_congress: z.array(z.object({
    congress: z.number(),
    total: z.number(),
    house_bills: z.number(),
    senate_bills: z.number(),
  })),
});

const getStatsRoute = createRoute({
  method: "get",
  path: "/stats",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiSuccessSchema(StatsSchema),
        },
      },
      description: "Successfully retrieved statistics",
    },
    500: {
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
      description: "Server error",
    },
  },
  tags: ["Utilities"],
});

statsRouter.openapi(getStatsRoute, async (c) => {
  try {
    const toNumber = (val: unknown) => {
      if (typeof val === 'object' && val !== null && 'low' in val) {
        return (val as { low: number }).low;
      }
      return Number(val) || 0;
    };

    // Query 1: Total bills by type
    const billsQuery = `
      MATCH (d:Document {type: 'bill'})
      RETURN COUNT(d) as total_bills,
             SUM(CASE WHEN d.subtype = 'HB' THEN 1 ELSE 0 END) as total_house_bills,
             SUM(CASE WHEN d.subtype = 'SB' THEN 1 ELSE 0 END) as total_senate_bills
    `;

    // Query 2: Total counts for other entities
    const countsQuery = `
      MATCH (c:Congress)
      WITH COUNT(c) as total_congresses
      MATCH (p:Person)
      WITH total_congresses, COUNT(p) as total_people
      MATCH (com:Committee)
      RETURN total_congresses, total_people, COUNT(com) as total_committees
    `;

    // Query 3: Bills with/without dates
    const datesQuery = `
      MATCH (d:Document {type: 'bill'})
      RETURN COUNT(CASE WHEN d.date_filed IS NOT NULL THEN 1 END) as bills_with_dates,
             COUNT(CASE WHEN d.date_filed IS NULL THEN 1 END) as bills_without_dates
    `;

    // Query 4: Bills by congress
    const byCongressQuery = `
      MATCH (d:Document {type: 'bill'})
      WHERE d.congress IS NOT NULL
      RETURN d.congress as congress,
             COUNT(d) as total,
             SUM(CASE WHEN d.subtype = 'HB' THEN 1 ELSE 0 END) as house_bills,
             SUM(CASE WHEN d.subtype = 'SB' THEN 1 ELSE 0 END) as senate_bills
      ORDER BY congress DESC
    `;

    const [billsResult, countsResult, datesResult, byCongressResult] = await Promise.all([
      runQuery(billsQuery),
      runQuery(countsQuery),
      runQuery(datesQuery),
      runQuery(byCongressQuery),
    ]);

    const billsData = billsResult[0] || { total_bills: 0, total_house_bills: 0, total_senate_bills: 0 };
    const countsData = countsResult[0] || { total_congresses: 0, total_people: 0, total_committees: 0 };
    const datesData = datesResult[0] || { bills_with_dates: 0, bills_without_dates: 0 };

    const bills_by_congress = byCongressResult.map((row) => ({
      congress: toNumber(row.congress),
      total: toNumber(row.total),
      house_bills: toNumber(row.house_bills),
      senate_bills: toNumber(row.senate_bills),
    }));

    const stats = {
      total_bills: toNumber(billsData.total_bills),
      total_house_bills: toNumber(billsData.total_house_bills),
      total_senate_bills: toNumber(billsData.total_senate_bills),
      total_congresses: toNumber(countsData.total_congresses),
      total_people: toNumber(countsData.total_people),
      total_committees: toNumber(countsData.total_committees),
      bills_with_dates: toNumber(datesData.bills_with_dates),
      bills_without_dates: toNumber(datesData.bills_without_dates),
      bills_by_congress,
    };

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return c.json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch statistics",
      },
    }, 500);
  }
});
