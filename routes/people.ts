import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { runQuery, int } from "@/lib/neo4j.ts";
import {
  PersonSchema,
  BillSchema,
  GroupSchema,
  ApiSuccessSchema,
  ApiErrorSchema,
  PaginatedResponseSchema,
  type Person,
  type Bill,
  type Group,
} from "@/lib/schemas.ts";

export const peopleRouter = new OpenAPIHono();

/**
 * GET /people
 *
 * Purpose: List all people (senators and representatives) with filtering and search
 *
 * Neo4j Query:
 * - Matches: Person nodes
 * - Filters:
 *   - type: filters by position in SERVED_IN relationship ('senator' or 'representative')
 *   - congress: filters people who served in specific congress (via SERVED_IN->Congress)
 *   - last_name: exact match on p.last_name
 *   - search: searches in first_name, last_name, full_name, and aliases
 * - Returns: Person properties
 *
 * Example: GET /api/people?type=senator&congress=20&search=Aquino
 */
const listPeopleRoute = createRoute({
  method: "get",
  path: "/people",
  request: {
    query: z.object({
      type: z.string().optional().openapi({ example: "senator", description: "Filter by position: senator or representative" }),
      congress: z.string().optional().openapi({ example: "20", description: "Filter by congress number" }),
      last_name: z.string().optional().openapi({ description: "Filter by exact last name" }),
      search: z.string().optional().openapi({ description: "Search in names and aliases" }),
      sort: z.string().optional().openapi({ example: "last_name", description: "Sort field: first_name, middle_name, last_name, name_suffix" }),
      dir: z.string().optional().openapi({ example: "asc", description: "Sort direction: asc or desc" }),
      limit: z.string().optional().openapi({ example: "20" }),
      offset: z.string().optional().openapi({ example: "0" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PaginatedResponseSchema(PersonSchema),
        },
      },
      description: "Successfully retrieved people",
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
  tags: ["People"],
});

peopleRouter.openapi(listPeopleRoute, async (c) => {
  try {
    const {
      type,
      congress,
      last_name,
      search,
      sort = "last_name",
      dir = "asc",
      limit: limitStr,
      offset: offsetStr,
    } = c.req.valid("query");

    const limit = Math.min(parseInt(limitStr || "20"), 100);
    const offset = parseInt(offsetStr || "0");

    // Build match and where clauses
    let matchClause = "MATCH (p:Person)";
    const whereConditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (type || congress) {
      matchClause = `
        MATCH (p:Person)-[:MEMBER_OF]->(g:Group)-[:BELONGS_TO]->(c:Congress)
      `;

      if (type) {
        // Filter by group type: Senate for senators, House for representatives
        if (type.toLowerCase() === 'senator') {
          whereConditions.push("g.name CONTAINS 'Senate'");
        } else if (type.toLowerCase() === 'representative') {
          whereConditions.push("g.name CONTAINS 'House'");
        }
      }

      if (congress) {
        whereConditions.push("c.congress_number = $congress");
        params.congress = int(parseInt(congress));
      }
    }

    if (last_name) {
      whereConditions.push("p.last_name = $last_name");
      params.last_name = last_name;
    }

    if (search) {
      whereConditions.push(`(
        toLower(p.first_name) CONTAINS toLower($search) OR
        toLower(p.last_name) CONTAINS toLower($search) OR
        toLower(p.full_name) CONTAINS toLower($search) OR
        ANY(alias IN p.aliases WHERE toLower(alias) CONTAINS toLower($search))
      )`);
      params.search = search;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    // Count total
    const countQuery = `
      ${matchClause}
      ${whereClause}
      RETURN COUNT(DISTINCT p) as total
    `;

    const countResult = await runQuery(countQuery, params);
    const totalRaw = countResult[0]?.total || 0;
    const total: number = typeof totalRaw === 'object' && 'low' in totalRaw ? (totalRaw as { low: number }).low : Number(totalRaw);

    // Build ORDER BY clause
    const allowedSortFields = ["first_name", "middle_name", "last_name", "name_suffix"];
    const sortField = allowedSortFields.includes(sort) ? sort : "last_name";
    const sortDirection = dir.toLowerCase() === "desc" ? "DESC" : "ASC";
    const orderByClause = `p.${sortField} ${sortDirection}, p.last_name ${sortDirection}, p.first_name ${sortDirection}`;

    // Get paginated results
    const query = `
      ${matchClause}
      ${whereClause}
      WITH DISTINCT p
      ORDER BY ${orderByClause}
      SKIP $offset
      LIMIT $limit
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
    `;

    params.offset = int(offset);
    params.limit = int(limit);

    const people = await runQuery(query, params) as Person[];
    const has_more = offset + people.length < total;

    return c.json({
      success: true,
      data: people,
      pagination: {
        total,
        limit,
        offset,
        has_more,
        next_cursor: has_more ? String(offset + limit) : undefined,
      },
    }, 200);
  } catch (error) {
    console.error("People list error:", error);
    return c.json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch people",
      },
    }, 500);
  }
});

/**
 * GET /people/:id
 *
 * Purpose: Get details of a specific person by ID
 *
 * Neo4j Query:
 * - Matches: Person node by id (ULID)
 * - Returns: Person properties
 *
 * Example: GET /api/people/01H8ZXR5KBQZ...
 */
const getPersonRoute = createRoute({
  method: "get",
  path: "/people/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "01H8ZXR5KBQZ...",
      }),
    }),
    query: z.object({
      include_congresses: z.string().optional().openapi({
        example: "true",
        description: "Include congresses served via MEMBER_OF and BELONGS_TO relationships"
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiSuccessSchema(PersonSchema),
        },
      },
      description: "Successfully retrieved person",
    },
    404: {
      content: {
        "application/json": {
          schema: ApiErrorSchema,
        },
      },
      description: "Person not found",
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
  tags: ["People"],
});

peopleRouter.openapi(getPersonRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const { include_congresses } = c.req.valid("query");

    const query = `
      MATCH (p:Person {id: $id})
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
    `;

    const result = await runQuery(query, { id }) as Person[];

    if (!result || result.length === 0) {
      return c.json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Person with id '${id}' not found`,
        },
      }, 404);
    }

    const person = result[0];

    // If include_congresses is requested, fetch congresses served
    if (include_congresses === "true") {
      const congressQuery = `
        MATCH (p:Person {id: $id})-[:MEMBER_OF]->(g:Group)-[:BELONGS_TO]->(c:Congress)
        RETURN
          c.congress_number as congress_number,
          c.ordinal as congress_ordinal,
          g.name as group_name,
          CASE
            WHEN g.name CONTAINS 'Senate' THEN 'Senator'
            WHEN g.name CONTAINS 'House' THEN 'Representative'
            ELSE 'Member'
          END as position
        ORDER BY c.congress_number DESC
      `;

      const congressResult = await runQuery(congressQuery, { id });

      // Add congresses_served to the person object
      (person as any).congresses_served = congressResult.map((row: any) => ({
        congress_number: typeof row.congress_number === 'object' && 'low' in row.congress_number
          ? row.congress_number.low
          : Number(row.congress_number),
        congress_ordinal: row.congress_ordinal,
        position: row.position,
      }));
    }

    return c.json({
      success: true,
      data: person,
    }, 200);
  } catch (error) {
    console.error("Person detail error:", error);
    return c.json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch person",
      },
    }, 500);
  }
});

/**
 * GET /people/:id/groups
 *
 * Purpose: Get all chambers/groups where a person is a member
 *
 * Neo4j Query:
 * - Matches: Person node by id
 * - Matches: MEMBER_OF relationships to Group nodes (Chamber)
 * - Returns: Group/Chamber properties (senate or house)
 *
 * Example: GET /api/people/01H8ZXR5KBQZ.../groups
 */
const getPersonGroupsRoute = createRoute({
  method: "get",
  path: "/people/{id}/groups",
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "01H8ZXR5KBQZ...",
      }),
    }),
    query: z.object({
      type: z.string().optional().openapi({ example: "chamber", description: "Filter by group type" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiSuccessSchema(z.array(GroupSchema)),
        },
      },
      description: "Successfully retrieved person's groups/chambers",
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
  tags: ["People"],
});

peopleRouter.openapi(getPersonGroupsRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const { type } = c.req.valid("query");

    const whereConditions: string[] = [];
    const params: Record<string, unknown> = { id };

    if (type) {
      whereConditions.push("g.type = $type");
      params.type = type;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const query = `
      MATCH (p:Person {id: $id})-[:MEMBER_OF]->(g:Group)
      ${whereClause}
      RETURN
        g.id as id,
        g.name as name,
        g.type as type,
        g.subtype as subtype,
        g.congress as congress
      ORDER BY g.congress DESC, g.name
    `;

    const groups = await runQuery(query, params) as Group[];

    return c.json({
      success: true,
      data: groups,
    }, 200);
  } catch (error) {
    console.error("Person groups error:", error);
    return c.json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch person groups",
      },
    }, 500);
  }
});

/**
 * GET /people/:id/documents
 *
 * Purpose: Get all bills authored by a person
 *
 * Neo4j Query:
 * - Matches: Person node by id
 * - Matches: AUTHORED relationships to Document nodes
 * - Optional filters: congress, type
 * - Returns: Bill properties
 *
 * Example: GET /api/people/01H8ZXR5KBQZ.../documents?congress=20&type=HB
 */
const getPersonBillsRoute = createRoute({
  method: "get",
  path: "/people/{id}/documents",
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "01H8ZXR5KBQZ...",
      }),
    }),
    query: z.object({
      congress: z.string().optional().openapi({ example: "20" }),
      type: z.string().optional().openapi({ example: "HB" }),
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
      description: "Successfully retrieved person's bills",
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
  tags: ["People"],
});

peopleRouter.openapi(getPersonBillsRoute, async (c) => {

  try {
    const { id } = c.req.valid("param");
    const { congress, type, limit: limitStr, offset: offsetStr } = c.req.valid("query");

    const limit = Math.min(parseInt(limitStr || "20"), 100);
    const offset = parseInt(offsetStr || "0");

    const whereConditions: string[] = ["d.type = 'bill'"];
    const params: Record<string, unknown> = { id };

    if (congress) {
      whereConditions.push("d.congress = $congress");
      params.congress = int(parseInt(congress));
    }

    if (type) {
      whereConditions.push("d.subtype = $type");
      params.type = type.toUpperCase();
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    // Count total
    const countQuery = `
      MATCH (p:Person {id: $id})-[:AUTHORED]->(d:Document)
      ${whereClause}
      RETURN COUNT(d) as total
    `;

    const countResult = await runQuery(countQuery, params);
    const totalRaw = countResult[0]?.total || 0;
    const total: number = typeof totalRaw === 'object' && 'low' in totalRaw ? (totalRaw as { low: number }).low : Number(totalRaw);

    // Get paginated results
    const query = `
      MATCH (p:Person {id: $id})-[:AUTHORED]->(d:Document)
      ${whereClause}
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
        d.date_filed as date_filed,
        d.scope as scope,
        d.subjects as subjects,
        d.authors_raw as authors_raw,
        d.senate_website_permalink as senate_website_permalink
      ORDER BY d.date_filed DESC, d.name
      SKIP $offset
      LIMIT $limit
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
    console.error("Person bills error:", error);
    return c.json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch person bills",
      },
    }, 500);
  }
});

/**
 * GET /search/people
 *
 * Purpose: Search people (senators and representatives) with filters
 *
 * Neo4j Query:
 * - Matches: Person nodes
 * - Filters:
 *   - q: full-text search in first_name, last_name, full_name, and aliases
 *   - type: filters by position in SERVED_IN relationship ('senator' or 'representative')
 *   - congress: filters people who served in specific congress (via SERVED_IN->Congress)
 * - Returns: Person properties with pagination
 *
 * Example: GET /api/search/people?q=Aquino&type=senator&congress=20
 */
const searchPeopleRoute = createRoute({
  method: "get",
  path: "/search/people",
  request: {
    query: z.object({
      q: z.string().openapi({ example: "Aquino", description: "Search query for names and aliases" }),
      type: z.string().optional().openapi({ example: "senator", description: "Filter by position: senator or representative" }),
      congress: z.string().optional().openapi({ example: "20", description: "Filter by congress number or 'all' (default: all)" }),
      limit: z.string().optional().openapi({ example: "20", description: "Items per page (max 100)" }),
      offset: z.string().optional().openapi({ example: "0", description: "Number of items to skip" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PaginatedResponseSchema(PersonSchema),
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

peopleRouter.openapi(searchPeopleRoute, async (c) => {
  try {
    const {
      q,
      type,
      congress,
      limit: limitStr,
      offset: offsetStr,
    } = c.req.valid("query");

    const limit = Math.min(parseInt(limitStr || "20"), 100);
    const offset = parseInt(offsetStr || "0");

    // Build match and where clauses
    let matchClause = "MATCH (p:Person)";
    const whereConditions: string[] = [];
    const params: Record<string, unknown> = {};

    // Search query
    if (q) {
      whereConditions.push(`(
        toLower(p.first_name) CONTAINS toLower($q) OR
        toLower(p.last_name) CONTAINS toLower($q) OR
        toLower(p.full_name) CONTAINS toLower($q) OR
        ANY(alias IN p.aliases WHERE toLower(alias) CONTAINS toLower($q))
      )`);
      params.q = q;
    }

    if (type || congress) {
      matchClause = `MATCH (p:Person)-[r:SERVED_IN]->(c:Congress)`;

      if (type) {
        whereConditions.push("r.position = $position");
        params.position = type;
      }

      if (congress && congress.toLowerCase() !== 'all') {
        whereConditions.push("c.congress_number = $congress");
        params.congress = int(parseInt(congress));
      }
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    // Count total
    const countQuery = `
      ${matchClause}
      ${whereClause}
      RETURN COUNT(DISTINCT p) as total
    `;

    const countResult = await runQuery(countQuery, params);
    const totalRaw = countResult[0]?.total || 0;
    const total: number = typeof totalRaw === 'object' && 'low' in totalRaw ? (totalRaw as { low: number }).low : Number(totalRaw);

    // Get paginated results
    const query = `
      ${matchClause}
      ${whereClause}
      WITH DISTINCT p
      ORDER BY p.last_name, p.first_name
      SKIP $offset
      LIMIT $limit
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
    `;

    params.offset = int(offset);
    params.limit = int(limit);

    const people = await runQuery(query, params) as Person[];
    const has_more = offset + people.length < total;

    return c.json({
      success: true,
      data: people,
      pagination: {
        total,
        limit,
        offset,
        has_more,
        next_cursor: has_more ? String(offset + limit) : undefined,
      },
    }, 200);
  } catch (error) {
    console.error("People search error:", error);
    return c.json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to search people",
      },
    }, 500);
  }
});
