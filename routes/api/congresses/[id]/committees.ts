import type { RouteHandler } from "fresh";

import { runQuery, int } from "@/lib/neo4j.ts";
import type { Committee, ApiResponse, QueryParams } from "@/lib/types.ts";

type CommitteesResponse = ApiResponse<Committee[]>;
type State = Record<string, unknown>;

export const handler: RouteHandler<CommitteesResponse, State> = {
  async GET(ctx) {
    try {
      const { id } = ctx.params;
      const url = new URL(ctx.req.url);
      const type = url.searchParams.get("type");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
      const offset = parseInt(url.searchParams.get("offset") || "0");

      // Check if id is a number (congress_number) or ULID
      const isNumber = /^\d+$/.test(id);

      // Build WHERE clause for type filter
      let typeFilter = "";
      const params: QueryParams = {};

      if (isNumber) {
        params.congress_number = int(parseInt(id));
      } else {
        params.id = id;
      }

      if (type) {
        typeFilter = "AND com.type = $type";
        params.type = type;
      }

      // Get total count
      const countQuery = isNumber
        ? `
          MATCH (com:Committee)-[:BELONGS_TO]->(c:Congress {congress_number: $congress_number})
          WHERE 1=1 ${typeFilter}
          RETURN COUNT(DISTINCT com) as total
        `
        : `
          MATCH (com:Committee)-[:BELONGS_TO]->(c:Congress {id: $id})
          WHERE 1=1 ${typeFilter}
          RETURN COUNT(DISTINCT com) as total
        `;

      const countResult = await runQuery(countQuery, params);
      const totalRaw = countResult[0]?.total || 0;
      const total: number = typeof totalRaw === 'object' && 'low' in totalRaw ? (totalRaw as { low: number }).low : Number(totalRaw);

      // Get paginated committees
      const query = isNumber
        ? `
          MATCH (com:Committee)-[:BELONGS_TO]->(c:Congress {congress_number: $congress_number})
          WHERE 1=1 ${typeFilter}
          RETURN DISTINCT
                 com.id as id,
                 com.name as name,
                 com.type as type,
                 com.senate_website_keys as senate_website_keys
          ORDER BY com.name
          SKIP $offset
          LIMIT $limit
        `
        : `
          MATCH (com:Committee)-[:BELONGS_TO]->(c:Congress {id: $id})
          WHERE 1=1 ${typeFilter}
          RETURN DISTINCT
                 com.id as id,
                 com.name as name,
                 com.type as type,
                 com.senate_website_keys as senate_website_keys
          ORDER BY com.name
          SKIP $offset
          LIMIT $limit
        `;

      params.offset = int(offset);
      params.limit = int(limit);

      const committees = await runQuery(query, params);
      const has_more = offset + committees.length < total;

      return new Response(
        JSON.stringify({
          success: true,
          data: committees,
          pagination: {
            total,
            limit,
            offset,
            has_more,
            next_cursor: has_more ? String(offset + limit) : undefined
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Congress committees error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch committees",
          },
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};