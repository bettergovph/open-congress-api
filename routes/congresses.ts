import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { runQuery, int } from "@/lib/neo4j.ts";
import {
  CongressSchema,
  ApiSuccessSchema,
  ApiErrorSchema,
  PaginatedResponseSchema,
  BillSchema,
  type Congress,
  type Bill,
} from "@/lib/schemas.ts";

export const congressesRouter = new OpenAPIHono();

/**
 * GET /congresses
 *
 * Purpose: List all Philippine congresses with pagination and filtering
 *
 * Neo4j Query:
 * - Matches: All Congress nodes
 * - Filters: Optional year (checks start_year/end_year range), optional ordinal
 * - Returns: Congress properties sorted by congress_number DESC
 * - Pagination: SKIP offset LIMIT limit
 *
 * Example: GET /api/congresses?year=2022&limit=10
 */
const listCongressesRoute = createRoute({
  method: "get",
  path: "/congresses",
  request: {
    query: z.object({
      year: z.string().optional().openapi({ example: "2022", description: "Filter by year (matches if within start_year and end_year)" }),
      ordinal: z.string().optional().openapi({ example: "20th", description: "Filter by ordinal (e.g., '20th')" }),
      limit: z.string().optional().openapi({ example: "20", description: "Items per page (max 100)" }),
      offset: z.string().optional().openapi({ example: "0", description: "Number of items to skip" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PaginatedResponseSchema(CongressSchema),
        },
      },
      description: "Successfully retrieved congresses",
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
  tags: ["Congresses"],
});

congressesRouter.openapi(listCongressesRoute, async (c) => {
  try {
    const { year, ordinal, limit: limitStr, offset: offsetStr } = c.req.valid("query");
    const limit = Math.min(parseInt(limitStr || "20"), 100);
    const offset = parseInt(offsetStr || "0");

    const whereConditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (year) {
      whereConditions.push("(c.start_year <= $year AND c.end_year >= $year)");
      params.year = int(parseInt(year));
    }

    if (ordinal) {
      whereConditions.push("c.ordinal = $ordinal");
      params.ordinal = ordinal;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Count total
    const countQuery = `MATCH (c:Congress) ${whereClause} RETURN COUNT(c) as total`;
    const countResult = await runQuery(countQuery, params);
    const totalRaw = countResult[0]?.total || 0;
    const total: number = typeof totalRaw === 'object' && 'low' in totalRaw ? (totalRaw as { low: number }).low : Number(totalRaw);

    // Get paginated results
    const query = `
      MATCH (c:Congress)
      ${whereClause}
      RETURN c.id as id,
             c.congress_number as congress_number,
             c.congress_website_key as congress_website_key,
             c.name as name,
             c.ordinal as ordinal,
             c.start_date as start_date,
             c.end_date as end_date,
             c.start_year as start_year,
             c.end_year as end_year,
             c.year_range as year_range
      ORDER BY c.congress_number DESC
      SKIP $offset
      LIMIT $limit
    `;

    params.offset = int(offset);
    params.limit = int(limit);

    const congresses = await runQuery(query, params) as Congress[];
    const has_more = offset + congresses.length < total;

    return c.json({
      success: true,
      data: congresses,
      pagination: {
        total,
        limit,
        offset,
        has_more,
        next_cursor: has_more ? String(offset + limit) : undefined,
      },
    }, 200);
  } catch (error) {
    console.error("Congress list error:", error);
    return c.json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch congresses",
      },
    }, 500);
  }
});

/**
 * GET /congresses/:id
 *
 * Purpose: Get details of a specific congress by ID or congress number
 *
 * Neo4j Queries:
 * 1. Main query - fetches congress node by id (ULID) or congress_number
 * 2. Stats query - counts senators, representatives, and committees for this congress
 *    - Uses SERVED_IN relationship to count senators/representatives by position
 *    - Uses BELONGS_TO relationship to count committees
 *
 * Example: GET /api/congresses/20 or GET /api/congresses/01H8ZXR5KBQZ...
 */
const getCongressRoute = createRoute({
  method: "get",
  path: "/congresses/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "20",
        description: "Congress number or ULID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiSuccessSchema(CongressSchema),
        },
      },
      description: "Successfully retrieved congress",
    },
    404: {
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
      description: "Congress not found",
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
  tags: ["Congresses"],
});

congressesRouter.openapi(getCongressRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const isNumber = /^\d+$/.test(id);

    let query: string;
    const params: Record<string, unknown> = {};

    if (isNumber) {
      query = `
        MATCH (c:Congress {congress_number: $congress_number})
        RETURN c.id as id,
               c.congress_number as congress_number,
               c.congress_website_key as congress_website_key,
               c.name as name,
               c.ordinal as ordinal,
               c.start_date as start_date,
               c.end_date as end_date,
               c.start_year as start_year,
               c.end_year as end_year,
               c.year_range as year_range
      `;
      params.congress_number = int(parseInt(id));
    } else {
      query = `
        MATCH (c:Congress {id: $id})
        RETURN c.id as id,
               c.congress_number as congress_number,
               c.congress_website_key as congress_website_key,
               c.name as name,
               c.ordinal as ordinal,
               c.start_date as start_date,
               c.end_date as end_date,
               c.start_year as start_year,
               c.end_year as end_year,
               c.year_range as year_range
      `;
      params.id = id;
    }

    const result = await runQuery(query, params) as Congress[];

    if (!result || result.length === 0) {
      return c.json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Congress with id '${id}' not found`,
        },
      }, 404);
    }

    const congress = result[0] as Congress & { total_senators?: number; total_representatives?: number; total_committees?: number };

    // Get statistics
    const statsQuery = `
      MATCH (c:Congress {id: $congress_id})
      OPTIONAL MATCH (p:Person)-[r:SERVED_IN]->(c)
      WITH c,
           COUNT(CASE WHEN r.position = 'senator' THEN 1 END) as total_senators,
           COUNT(CASE WHEN r.position = 'representative' THEN 1 END) as total_representatives
      OPTIONAL MATCH (com:Committee)-[:BELONGS_TO]->(c)
      RETURN total_senators,
             total_representatives,
             COUNT(DISTINCT com) as total_committees
    `;

    const statsParams = { congress_id: congress.id };
    const stats = await runQuery(statsQuery, statsParams);

    if (stats && stats[0]) {
      const toNumber = (val: unknown) => {
        if (typeof val === 'object' && val !== null && 'low' in val) {
          return (val as { low: number }).low;
        }
        return Number(val) || 0;
      };

      congress.total_senators = toNumber(stats[0].total_senators);
      congress.total_representatives = toNumber(stats[0].total_representatives);
      congress.total_committees = toNumber(stats[0].total_committees);
    }

    return c.json({
      success: true,
      data: congress,
    }, 200);
  } catch (error) {
    console.error("Congress detail error:", error);
    return c.json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch congress",
      },
    }, 500);
  }
});

/**
 * GET /congresses/:id/documents
 *
 * Purpose: Get all documents/bills filed in a specific congress
 *
 * Neo4j Query:
 * - Matches: Congress node by id or congress_number
 * - Matches: Document nodes with FILED_IN relationship to Congress
 * - Optional filters: type (HB/SB)
 * - Returns: Bill properties with pagination
 *
 * Example: GET /api/congresses/20/documents?type=HB&limit=50
 */
const getCongressDocumentsRoute = createRoute({
  method: "get",
  path: "/congresses/{id}/documents",
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "20",
        description: "Congress number or ULID",
      }),
    }),
    query: z.object({
      type: z.string().optional().openapi({ example: "HB", description: "Filter by document subtype (HB or SB)" }),
      limit: z.string().optional().openapi({ example: "20" }),
      offset: z.string().optional().openapi({ example: "0" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PaginatedResponseSchema(BillSchema),
        },
      },
      description: "Successfully retrieved congress documents",
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
  tags: ["Congresses"],
});

congressesRouter.openapi(getCongressDocumentsRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const { type, limit: limitStr, offset: offsetStr } = c.req.valid("query");

    const limit = Math.min(parseInt(limitStr || "20"), 100);
    const offset = parseInt(offsetStr || "0");
    const isNumber = /^\d+$/.test(id);

    const whereConditions: string[] = ["d.type = 'bill'"];
    const params: Record<string, unknown> = {};

    if (isNumber) {
      whereConditions.push("c.congress_number = $congress_number");
      params.congress_number = int(parseInt(id));
    } else {
      whereConditions.push("c.id = $id");
      params.id = id;
    }

    if (type) {
      whereConditions.push("d.subtype = $type");
      params.type = type.toUpperCase();
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // Count total
    const countQuery = `
      MATCH (c:Congress)
      WHERE ${isNumber ? 'c.congress_number = $congress_number' : 'c.id = $id'}
      MATCH (d:Document)-[:FILED_IN]->(c)
      ${whereClause}
      RETURN COUNT(d) as total
    `;
    const countResult = await runQuery(countQuery, params);
    const totalRaw = countResult[0]?.total || 0;
    const total: number = typeof totalRaw === 'object' && 'low' in totalRaw ? (totalRaw as { low: number }).low : Number(totalRaw);

    // Get paginated results
    const query = `
      MATCH (c:Congress)
      WHERE ${isNumber ? 'c.congress_number = $congress_number' : 'c.id = $id'}
      MATCH (d:Document)-[:FILED_IN]->(c)
      ${whereClause}
      WITH d
      ORDER BY d.date_filed DESC, d.name
      SKIP $offset
      LIMIT $limit
      OPTIONAL MATCH (d)<-[:AUTHORED]-(p:Person)
      WITH d, COLLECT(DISTINCT {
        id: p.id,
        first_name: p.first_name,
        middle_name: p.middle_name,
        last_name: p.last_name,
        name_suffix: p.name_suffix,
        aliases: p.aliases
      }) as authors
      RETURN
        d.id as id,
        d.type as type,
        d.subtype as subtype,
        d.name as name,
        d.bill_number as bill_number,
        d.congress as congress,
        d.title as title,
        d.long_title as long_title,
        d.congress_website_title as congress_website_title,
        d.congress_website_abstract as congress_website_abstract,
        d.date_filed as date_filed,
        d.scope as scope,
        d.subjects as subjects,
        d.authors_raw as authors_raw,
        d.senate_website_permalink as senate_website_permalink,
        d.download_url_sources as download_url_sources,
        CASE WHEN SIZE(authors) > 0 AND authors[0].id IS NOT NULL THEN authors ELSE [] END as authors
      ORDER BY d.date_filed DESC, d.name
    `;

    params.offset = int(offset);
    params.limit = int(limit);

    const documents = await runQuery(query, params) as Bill[];
    const has_more = offset + documents.length < total;

    return c.json({
      success: true,
      data: documents,
      pagination: {
        total,
        limit,
        offset,
        has_more,
        next_cursor: has_more ? String(offset + limit) : undefined,
      },
    }, 200);
  } catch (error) {
    console.error("Congress documents error:", error);
    return c.json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch congress documents",
      },
    }, 500);
  }
});
