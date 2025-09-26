import type { RouteHandler } from "fresh";

import { runQuery } from "@/lib/neo4j.ts";
import type { CongressMembership, ApiResponse } from "@/lib/types.ts";

type CongressHistoryResponse = ApiResponse<CongressMembership[]>;
type State = Record<string, unknown>;

export const handler: RouteHandler<CongressHistoryResponse, State> = {
  async GET(ctx) {
    try {
      const { id } = ctx.params;

      // Get all congresses where the person served
      const query = `
        MATCH (p:Person {id: $id})-[r:SERVED_IN]->(c:Congress)
        RETURN c.id as congress_id,
               c.congress_number as congress_number,
               c.ordinal as congress_ordinal,
               c.name as congress_name,
               c.year_range as year_range,
               r.position as position,
               r.type as type,
               c.start_date as start_date,
               c.end_date as end_date
        ORDER BY c.congress_number DESC
      `;

      const congresses = await runQuery(query, { id });

      if (!congresses || congresses.length === 0) {
        // Check if the person exists
        const personQuery = `
          MATCH (p:Person {id: $id})
          RETURN p.id
        `;
        const person = await runQuery(personQuery, { id });

        if (!person || person.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: "NOT_FOUND",
                message: `Person with id '${id}' not found`,
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

        // Person exists but has no congress history
        return new Response(
          JSON.stringify({
            success: true,
            data: []
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: congresses
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Person congress history error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch congress history",
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