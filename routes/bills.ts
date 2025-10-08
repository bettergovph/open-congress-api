import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { runQuery, int } from "@/lib/neo4j.ts";
import {
  BillSchema,
  ApiSuccessSchema,
  ApiErrorSchema,
  PaginatedResponseSchema,
  PersonSchema,
  type Bill,
  type Person,
} from "@/lib/schemas.ts";

export const billsRouter = new OpenAPIHono();

/**
 * GET /documents
 *
 * Purpose: List all legislative bills with advanced filtering and search
 *
 * Neo4j Query:
 * - Matches: Document nodes where type = 'bill'
 * - Filters:
 *   - congress: filters by d.congress property
 *   - type: filters by d.subtype ('HB' or 'SB')
 *   - scope: filters by d.scope ('National', 'Local', or 'Both')
 *   - author: searches Person nodes with AUTHORED relationship (by last_name)
 *   - search: full-text search in title, long_title, abstract, and author names
 *   - date_from/date_to: filters by d.date_filed range
 * - Returns: Bill properties + array of authors (via AUTHORED relationship)
 * - Sorting: Supports date_filed, congress, bill_number, title, scope, authors_count
 *
 * Example: GET /api/documents?congress=20&type=HB&search=education&limit=20
 */
const listBillsRoute = createRoute({
  method: "get",
  path: "/documents",
  request: {
    query: z.object({
      congress: z.string().optional().openapi({ example: "20" }),
      type: z.string().optional().openapi({ example: "HB", description: "HB or SB" }),
      scope: z.string().optional().openapi({ example: "National" }),
      author: z.string().optional().openapi({ description: "Filter by author last name" }),
      search: z.string().optional().openapi({ description: "Search in title, abstract, or author names" }),
      date_from: z.string().optional().openapi({ example: "2022-01-01" }),
      date_to: z.string().optional().openapi({ example: "2022-12-31" }),
      sort: z.string().optional().openapi({ example: "date_filed", description: "Sort field" }),
      dir: z.string().optional().openapi({ example: "desc", description: "Sort direction (asc/desc)" }),
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
      description: "Successfully retrieved bills",
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
  tags: ["Documents"],
});

billsRouter.openapi(listBillsRoute, async (c) => {
  try {
    const {
      congress,
      type,
      scope,
      author,
      search,
      date_from,
      date_to,
      sort = "date_filed",
      dir = "desc",
      limit: limitStr,
      offset: offsetStr,
    } = c.req.valid("query");

    const limit = Math.min(parseInt(limitStr || "20"), 100);
    const offset = parseInt(offsetStr || "0");

    // Build WHERE clause
    const whereConditions: string[] = ["d.type = 'bill'"];
    const params: Record<string, unknown> = {};

    if (congress) {
      whereConditions.push("d.congress = $congress");
      params.congress = int(parseInt(congress));
    }

    if (type) {
      whereConditions.push("d.subtype = $type");
      params.type = type.toUpperCase();
    }

    if (scope) {
      whereConditions.push("d.scope = $scope");
      params.scope = scope;
    }

    if (author) {
      whereConditions.push(`
        EXISTS {
          MATCH (d)<-[:AUTHORED]-(p:Person)
          WHERE toLower(p.last_name) CONTAINS toLower($author)
        }
      `);
      params.author = author;
    }

    if (search) {
      whereConditions.push(`(
        toLower(d.title) CONTAINS toLower($search) OR
        toLower(d.long_title) CONTAINS toLower($search) OR
        toLower(d.abstract) CONTAINS toLower($search) OR
        toLower(d.name) CONTAINS toLower($search) OR
        toLower(d.congress_website_title) CONTAINS toLower($search) OR
        toLower(d.congress_website_abstract) CONTAINS toLower($search) OR
        EXISTS {
          MATCH (d)<-[:AUTHORED]-(p:Person)
          WHERE toLower(p.first_name) CONTAINS toLower($search) OR
                toLower(p.last_name) CONTAINS toLower($search) OR
                ANY(alias IN p.aliases WHERE toLower(alias) CONTAINS toLower($search))
        }
      )`);
      params.search = search;
    }

    if (date_from) {
      whereConditions.push("d.date_filed >= $date_from");
      params.date_from = date_from;
    }

    if (date_to) {
      whereConditions.push("d.date_filed <= $date_to");
      params.date_to = date_to;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Count total
    const countQuery = `MATCH (d:Document) ${whereClause} RETURN COUNT(d) as total`;
    const countResult = await runQuery(countQuery, params);
    const totalRaw = countResult[0]?.total || 0;
    const total: number = typeof totalRaw === 'object' && 'low' in totalRaw ? (totalRaw as { low: number }).low : Number(totalRaw);

    // Build ORDER BY clause
    let orderByClause = "";
    const dirUpper = dir.toUpperCase();
    switch (sort) {
      case "congress":
        orderByClause = `d.congress ${dirUpper}, d.name`;
        break;
      case "bill_number":
        orderByClause = `d.bill_number ${dirUpper}, d.name`;
        break;
      case "date_filed":
        orderByClause = `d.date_filed ${dirUpper}, d.name`;
        break;
      case "title":
        orderByClause = `COALESCE(d.title, d.congress_website_title) ${dirUpper}, d.name`;
        break;
      case "scope":
        orderByClause = `d.scope ${dirUpper}, d.name`;
        break;
      case "authors_count":
        orderByClause = `SIZE(authors) ${dirUpper}, d.name`;
        break;
      default:
        orderByClause = `d.date_filed DESC, d.name`;
    }

    // Get paginated results
    const query = `
      MATCH (d:Document)
      ${whereClause}
      WITH d
      ORDER BY ${sort === 'authors_count' ? 'd.name' : orderByClause}
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
      ORDER BY ${orderByClause}
    `;

    params.offset = int(offset);
    params.limit = int(limit);

    const bills = await runQuery(query, params) as Bill[];
    const has_more = offset + bills.length < total;

    return c.json({
      success: true,
      data: bills,
      pagination: {
        total,
        limit,
        offset,
        has_more,
        next_cursor: has_more ? String(offset + limit) : undefined,
      },
    }, 200);
  } catch (error) {
    console.error("Bills list error:", error);
    return c.json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch bills",
      },
    }, 500);
  }
});

/**
 * GET /documents/:id
 *
 * Purpose: Get details of a specific bill by ID or bill number
 *
 * Neo4j Query:
 * - Matches: Document node by id (ULID) or bill_number
 * - Optional Match: Gets all Person nodes with AUTHORED relationship
 * - Returns: Full bill properties + array of authors
 *
 * Example: GET /api/documents/HB00001 or GET /api/documents/01H8ZXR5KB...
 */
const getBillRoute = createRoute({
  method: "get",
  path: "/documents/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "HB00001",
        description: "Bill number or ULID",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiSuccessSchema(BillSchema),
        },
      },
      description: "Successfully retrieved bill",
    },
    404: {
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
      description: "Bill not found",
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
  tags: ["Documents"],
});

billsRouter.openapi(getBillRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");

    // Check if id looks like a bill number (e.g., HB00001, SB00123)
    const isBillNumber = /^(HB|SB|HBN|SBN)/i.test(id);

    const query = `
      MATCH (d:Document {type: 'bill'})
      WHERE ${isBillNumber ? 'd.name = $id OR d.bill_number = $bill_number' : 'd.id = $id'}
      OPTIONAL MATCH (d)<-[:AUTHORED]-(p:Person)
      WITH d, COLLECT(DISTINCT {
        id: p.id,
        first_name: p.first_name,
        middle_name: p.middle_name,
        last_name: p.last_name,
        name_suffix: p.name_suffix,
        full_name: p.full_name,
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
    `;

    const params: Record<string, unknown> = {};
    if (isBillNumber) {
      params.id = id.toUpperCase();
      // Extract bill number if format is like HB00001
      const match = id.match(/\d+/);
      if (match) {
        params.bill_number = int(parseInt(match[0]));
      }
    } else {
      params.id = id;
    }

    const result = await runQuery(query, params) as Bill[];

    if (!result || result.length === 0) {
      return c.json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Bill with id '${id}' not found`,
        },
      }, 404);
    }

    return c.json({
      success: true,
      data: result[0],
    }, 200);
  } catch (error) {
    console.error("Bill detail error:", error);
    return c.json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch bill",
      },
    }, 500);
  }
});

/**
 * GET /documents/:id/authors
 *
 * Purpose: Get all authors of a specific bill
 *
 * Neo4j Query:
 * - Matches: Document node by id or bill number
 * - Matches: Person nodes with AUTHORED relationship to the document
 * - Returns: Array of Person properties
 *
 * Example: GET /api/documents/HB00001/authors
 */
const getBillAuthorsRoute = createRoute({
  method: "get",
  path: "/documents/{id}/authors",
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "HB00001",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiSuccessSchema(z.array(PersonSchema)),
        },
      },
      description: "Successfully retrieved bill authors",
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
  tags: ["Documents"],
});

billsRouter.openapi(getBillAuthorsRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const isBillNumber = /^(HB|SB|HBN|SBN)/i.test(id);

    const query = `
      MATCH (d:Document {type: 'bill'})
      WHERE ${isBillNumber ? 'd.name = $id OR d.bill_number = $bill_number' : 'd.id = $id'}
      MATCH (p:Person)-[:AUTHORED]->(d)
      RETURN
        p.id as id,
        p.first_name as first_name,
        p.last_name as last_name,
        p.middle_name as middle_name,
        p.name_prefix as name_prefix,
        p.name_suffix as name_suffix,
        p.full_name as full_name,
        p.professional_designations as professional_designations,
        p.senate_website_keys as senate_website_keys,
        p.congress_website_primary_keys as congress_website_primary_keys,
        p.congress_website_author_keys as congress_website_author_keys,
        p.aliases as aliases
      ORDER BY p.last_name
    `;

    const params: Record<string, unknown> = {};
    if (isBillNumber) {
      params.id = id.toUpperCase();
      const match = id.match(/\d+/);
      if (match) {
        params.bill_number = int(parseInt(match[0]));
      }
    } else {
      params.id = id;
    }

    const authors = await runQuery(query, params) as Person[];

    return c.json({
      success: true,
      data: authors,
    }, 200);
  } catch (error) {
    console.error("Bill authors error:", error);
    return c.json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch bill authors",
      },
    }, 500);
  }
});

/**
 * GET /search/documents
 *
 * Purpose: Search documents/bills with full-text search and filters
 *
 * Neo4j Query:
 * - Matches: Document nodes where type = 'bill'
 * - Filters:
 *   - q: full-text search in title, long_title, abstract, and author names
 *   - scope: filters by d.scope ('national', 'local', 'both', 'any')
 *   - subtype: filters by d.subtype ('hb', 'sb', 'any')
 * - Sorting: date_filed, congress, bill_number, title, scope
 * - Returns: Bill properties + array of authors with pagination
 *
 * Example: GET /api/search/documents?q=education&scope=national&subtype=hb&sort=date_filed&dir=desc
 */
const searchDocumentsRoute = createRoute({
  method: "get",
  path: "/search/documents",
  request: {
    query: z.object({
      q: z.string().openapi({ example: "education", description: "Search query for title, abstract, or author names" }),
      congress: z.string().optional().openapi({ example: "20", description: "Filter by congress number, ULID, or 'all' (default: all)" }),
      scope: z.string().optional().openapi({ example: "national", description: "Filter by scope: national, local, both, any (default: any)" }),
      subtype: z.string().optional().openapi({ example: "hb", description: "Filter by document type: hb, sb, any (default: any)" }),
      sort: z.string().optional().openapi({ example: "date_filed", description: "Sort field: date_filed, congress, bill_number, title, scope" }),
      dir: z.string().optional().openapi({ example: "desc", description: "Sort direction: asc or desc" }),
      limit: z.string().optional().openapi({ example: "20", description: "Items per page (max 100)" }),
      offset: z.string().optional().openapi({ example: "0", description: "Number of items to skip" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PaginatedResponseSchema(BillSchema),
        },
      },
      description: "Successfully retrieved search results",
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
  tags: ["Search"],
});

billsRouter.openapi(searchDocumentsRoute, async (c) => {
  try {
    const {
      q,
      congress,
      scope,
      subtype,
      sort = "date_filed",
      dir = "desc",
      limit: limitStr,
      offset: offsetStr,
    } = c.req.valid("query");

    const limit = Math.min(parseInt(limitStr || "20"), 100);
    const offset = parseInt(offsetStr || "0");

    // Build WHERE clause
    const whereConditions: string[] = ["d.type = 'bill'"];
    const params: Record<string, unknown> = {};

    // Search query
    if (q) {
      whereConditions.push(`(
        toLower(d.title) CONTAINS toLower($q) OR
        toLower(d.long_title) CONTAINS toLower($q) OR
        toLower(d.abstract) CONTAINS toLower($q) OR
        toLower(d.name) CONTAINS toLower($q) OR
        toLower(d.congress_website_title) CONTAINS toLower($q) OR
        toLower(d.congress_website_abstract) CONTAINS toLower($q) OR
        EXISTS {
          MATCH (d)<-[:AUTHORED]-(p:Person)
          WHERE toLower(p.first_name) CONTAINS toLower($q) OR
                toLower(p.last_name) CONTAINS toLower($q) OR
                ANY(alias IN p.aliases WHERE toLower(alias) CONTAINS toLower($q))
        }
      )`);
      params.q = q;
    }

    // Congress filter
    if (congress && congress.toLowerCase() !== 'all') {
      const isNumber = /^\d+$/.test(congress);
      if (isNumber) {
        whereConditions.push("d.congress = $congress");
        params.congress = int(parseInt(congress));
      } else {
        // Assume it's a congress ID, need to match via relationship
        whereConditions.push(`EXISTS {
          MATCH (d)-[:FILED_IN]->(c:Congress {id: $congress_id})
        }`);
        params.congress_id = congress;
      }
    }

    // Scope filter
    if (scope && scope.toLowerCase() !== 'any') {
      whereConditions.push("toLower(d.scope) = toLower($scope)");
      params.scope = scope;
    }

    // Subtype filter
    if (subtype && subtype.toLowerCase() !== 'any') {
      whereConditions.push("toLower(d.subtype) = toLower($subtype)");
      params.subtype = subtype.toUpperCase();
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Count total
    const countQuery = `MATCH (d:Document) ${whereClause} RETURN COUNT(d) as total`;
    const countResult = await runQuery(countQuery, params);
    const totalRaw = countResult[0]?.total || 0;
    const total: number = typeof totalRaw === 'object' && 'low' in totalRaw ? (totalRaw as { low: number }).low : Number(totalRaw);

    // Build ORDER BY clause
    let orderByClause = "";
    const dirUpper = dir.toUpperCase();
    switch (sort) {
      case "congress":
        orderByClause = `d.congress ${dirUpper}, d.name`;
        break;
      case "bill_number":
        orderByClause = `d.bill_number ${dirUpper}, d.name`;
        break;
      case "date_filed":
        orderByClause = `d.date_filed ${dirUpper}, d.name`;
        break;
      case "title":
        orderByClause = `COALESCE(d.title, d.congress_website_title) ${dirUpper}, d.name`;
        break;
      case "scope":
        orderByClause = `d.scope ${dirUpper}, d.name`;
        break;
      default:
        orderByClause = `d.date_filed DESC, d.name`;
    }

    // Get paginated results
    const query = `
      MATCH (d:Document)
      ${whereClause}
      WITH d
      ORDER BY ${orderByClause}
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
      ORDER BY ${orderByClause}
    `;

    params.offset = int(offset);
    params.limit = int(limit);

    const bills = await runQuery(query, params) as Bill[];
    const has_more = offset + bills.length < total;

    return c.json({
      success: true,
      data: bills,
      pagination: {
        total,
        limit,
        offset,
        has_more,
        next_cursor: has_more ? String(offset + limit) : undefined,
      },
    }, 200);
  } catch (error) {
    console.error("Document search error:", error);
    return c.json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to search documents",
      },
    }, 500);
  }
});
