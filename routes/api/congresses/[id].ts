import type { RouteHandler } from "fresh";

import { runQuery, int } from "@/lib/neo4j.ts";
import type { Congress, ApiResponse, QueryParams } from "@/lib/types.ts";

type CongressDetailResponse = ApiResponse<Congress>;
type State = Record<string, unknown>;

export const handler: RouteHandler<CongressDetailResponse, State> = {
  async GET(ctx) {
    try {
      console.log("Context:", ctx);
      if (!ctx || !ctx.params) {
        throw new Error("Context or params missing");
      }
      const { id } = ctx.params;

      // Check if id is a number (congress_number) or ULID
      const isNumber = /^\d+$/.test(id);

      let query: string;
      const params: QueryParams = {};

      if (isNumber) {
        // Query by congress_number
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
        // Query by ULID
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

      const result = await runQuery(query, params);

      if (!result || result.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: `Congress with id '${id}' not found`,
            },
          }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      const congress = result[0];

      // Get additional statistics
      const statsQuery = `
        MATCH (c:Congress)
        WHERE c.id = $id OR c.congress_number = $congress_number
        OPTIONAL MATCH (p:Person)-[r:SERVED_IN]->(c)
        WITH c,
             COUNT(CASE WHEN r.position = 'senator' THEN 1 END) as total_senators,
             COUNT(CASE WHEN r.position = 'representative' THEN 1 END) as total_representatives
        OPTIONAL MATCH (com:Committee)-[:BELONGS_TO]->(c)
        RETURN total_senators,
               total_representatives,
               COUNT(DISTINCT com) as total_committees
      `;

      const statsParams = isNumber
        ? { congress_number: int(parseInt(id)) }
        : { id };

      const stats = await runQuery(statsQuery, statsParams);

      if (stats && stats[0]) {
        congress.total_senators = stats[0].total_senators || 0;
        congress.total_representatives = stats[0].total_representatives || 0;
        congress.total_committees = stats[0].total_committees || 0;
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: congress
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Congress detail error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch congress",
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