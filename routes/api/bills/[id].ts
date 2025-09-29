import type { RouteHandler } from "fresh";

import { runQuery } from "@/lib/neo4j.ts";
import type { Bill, ApiResponse } from "@/lib/types.ts";

type BillResponse = ApiResponse<Bill>;
type State = Record<string, unknown>;

export const handler: RouteHandler<BillResponse, State> = {
  async GET(ctx) {
    const { id } = ctx.params;

    try {
      // First try to find by ID, then by name (e.g., "SBN-2674")
      const query = `
        MATCH (d:Document)
        WHERE d.id = $id OR d.name = $id
        OPTIONAL MATCH (d)<-[:AUTHORED]-(p:Person)
        OPTIONAL MATCH (d)-[:FILED_IN]->(c:Congress)
        RETURN
          d.id as id,
          d.type as type,
          d.subtype as subtype,
          d.name as name,
          d.bill_number as bill_number,
          d.congress as congress,
          d.title as title,
          d.long_title as long_title,
          d.date_filed as date_filed,
          d.scope as scope,
          d.subjects as subjects,
          d.authors_raw as authors_raw,
          d.senate_website_permalink as senate_website_permalink,
          d.download_url_sources as download_url_sources,
          COLLECT(DISTINCT {
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            middle_name: p.middle_name,
            name_suffix: p.name_suffix,
            full_name: p.first_name + ' ' +
              CASE WHEN p.middle_name IS NOT NULL THEN p.middle_name + ' ' ELSE '' END +
              p.last_name +
              CASE WHEN p.name_suffix IS NOT NULL THEN ' ' + p.name_suffix ELSE '' END
          }) as authors,
          {
            id: c.id,
            congress_number: c.congress_number,
            name: c.name,
            ordinal: c.ordinal,
            year_range: c.year_range
          } as congress_details
        LIMIT 1
      `;

      const result = await runQuery(query, { id });

      if (!result || result.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: `Bill with ID or number "${id}" not found`,
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

      const bill = result[0];

      // Filter out null authors
      if (bill.authors) {
        bill.authors = bill.authors.filter((a: { id: string | null }) => a.id !== null);
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: bill,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Bill fetch error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch bill",
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