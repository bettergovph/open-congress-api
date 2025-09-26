import type { RouteHandler } from "fresh";

import { runQuery, int } from "@/lib/neo4j.ts";
import type { Congress, ApiResponse, QueryParams } from "@/lib/types.ts";

type CongressResponse = ApiResponse<Congress[]>;
type State = Record<string, unknown>;

export const handler: RouteHandler<CongressResponse, State> = {
  async GET(ctx) {
    try {
      const url = new URL(ctx.req.url);
      const year = url.searchParams.get("year");
      const ordinal = url.searchParams.get("ordinal");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
      const offset = parseInt(url.searchParams.get("offset") || "0");

      // Build the WHERE clause based on filters
      const whereConditions: string[] = [];
      const params: QueryParams = {};

      if (year) {
        whereConditions.push("(c.start_year <= $year AND c.end_year >= $year)");
        params.year = int(parseInt(year));
      }

      if (ordinal) {
        whereConditions.push("c.ordinal = $ordinal");
        params.ordinal = ordinal;
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

      // Get total count
      const countQuery = `
        MATCH (c:Congress)
        ${whereClause}
        RETURN COUNT(c) as total
      `;
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

      const congresses = await runQuery(query, params);

      const has_more = offset + congresses.length < total;

      return new Response(
        JSON.stringify({
          success: true,
          data: congresses,
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
      console.error("Congress list error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch congresses",
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