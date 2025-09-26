import type { RouteHandler } from "fresh";

import { runQuery, int } from "@/lib/neo4j.ts";
import type { Person, ApiResponse, QueryParams } from "@/lib/types.ts";

type SenatorsResponse = ApiResponse<Person[]>;
type State = Record<string, unknown>;

export const handler: RouteHandler<SenatorsResponse, State> = {
  async GET(ctx) {
    try {
      const { id } = ctx.params;
      const url = new URL(ctx.req.url);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
      const offset = parseInt(url.searchParams.get("offset") || "0");

      // Check if id is a number (congress_number) or ULID
      const isNumber = /^\d+$/.test(id);

      const params: QueryParams = {
        position: "senator"
      };

      if (isNumber) {
        params.congress_number = int(parseInt(id));
      } else {
        params.id = id;
      }

      // Get total count of senators
      const countQuery = isNumber
        ? `
          MATCH (p:Person)-[r:SERVED_IN]->(c:Congress {congress_number: $congress_number})
          WHERE r.position = $position
          RETURN COUNT(DISTINCT p) as total
        `
        : `
          MATCH (p:Person)-[r:SERVED_IN]->(c:Congress {id: $id})
          WHERE r.position = $position
          RETURN COUNT(DISTINCT p) as total
        `;

      const countResult = await runQuery(countQuery, params);
      const totalRaw = countResult[0]?.total || 0;
      const total: number = typeof totalRaw === 'object' && 'low' in totalRaw ? (totalRaw as { low: number }).low : Number(totalRaw);

      // Get paginated senators with their full congress history
      const query = isNumber
        ? `
          MATCH (p:Person)-[r:SERVED_IN]->(c:Congress {congress_number: $congress_number})
          WHERE r.position = $position
          WITH p
          ORDER BY p.last_name, p.first_name
          SKIP $offset
          LIMIT $limit
          OPTIONAL MATCH (p)-[r2:SERVED_IN]->(c2:Congress)
          WITH p, COLLECT(DISTINCT {
            congress_id: c2.id,
            congress_number: c2.congress_number,
            congress_ordinal: c2.ordinal,
            position: r2.position,
            year_range: c2.year_range
          }) as congresses_served
          RETURN DISTINCT
                 p.id as id,
                 p.first_name as first_name,
                 p.last_name as last_name,
                 p.middle_name as middle_name,
                 p.name_prefix as name_prefix,
                 p.name_suffix as name_suffix,
                 p.first_name + ' ' +
                   CASE WHEN p.middle_name IS NOT NULL THEN p.middle_name + ' ' ELSE '' END +
                   p.last_name +
                   CASE WHEN p.name_suffix IS NOT NULL THEN ' ' + p.name_suffix ELSE '' END as full_name,
                 p.professional_designations as professional_designations,
                 p.senate_website_keys as senate_website_keys,
                 p.congress_website_primary_keys as congress_website_primary_keys,
                 p.congress_website_author_keys as congress_website_author_keys,
                 p.aliases as aliases,
                 congresses_served
          ORDER BY p.last_name, p.first_name
        `
        : `
          MATCH (p:Person)-[r:SERVED_IN]->(c:Congress {id: $id})
          WHERE r.position = $position
          WITH p
          ORDER BY p.last_name, p.first_name
          SKIP $offset
          LIMIT $limit
          OPTIONAL MATCH (p)-[r2:SERVED_IN]->(c2:Congress)
          WITH p, COLLECT(DISTINCT {
            congress_id: c2.id,
            congress_number: c2.congress_number,
            congress_ordinal: c2.ordinal,
            position: r2.position,
            year_range: c2.year_range
          }) as congresses_served
          RETURN DISTINCT
                 p.id as id,
                 p.first_name as first_name,
                 p.last_name as last_name,
                 p.middle_name as middle_name,
                 p.name_prefix as name_prefix,
                 p.name_suffix as name_suffix,
                 p.first_name + ' ' +
                   CASE WHEN p.middle_name IS NOT NULL THEN p.middle_name + ' ' ELSE '' END +
                   p.last_name +
                   CASE WHEN p.name_suffix IS NOT NULL THEN ' ' + p.name_suffix ELSE '' END as full_name,
                 p.professional_designations as professional_designations,
                 p.senate_website_keys as senate_website_keys,
                 p.congress_website_primary_keys as congress_website_primary_keys,
                 p.congress_website_author_keys as congress_website_author_keys,
                 p.aliases as aliases,
                 congresses_served
          ORDER BY p.last_name, p.first_name
        `;

      params.offset = int(offset);
      params.limit = int(limit);

      const senators = await runQuery(query, params);
      const has_more = offset + senators.length < total;

      return new Response(
        JSON.stringify({
          success: true,
          data: senators,
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
      console.error("Congress senators error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch senators",
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