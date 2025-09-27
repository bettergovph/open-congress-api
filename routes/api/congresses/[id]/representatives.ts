import type { RouteHandler } from "fresh";

import { runQuery, int } from "@/lib/neo4j.ts";
import type { Person, ApiResponse, QueryParams } from "@/lib/types.ts";

type RepresentativesResponse = ApiResponse<Person[]>;
type State = Record<string, unknown>;

export const handler: RouteHandler<RepresentativesResponse, State> = {
  async GET(ctx) {
    try {
      const { id } = ctx.params;
      const url = new URL(ctx.req.url);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
      const offset = parseInt(url.searchParams.get("offset") || "0");

      // Check if id is a number (congress_number) or ULID
      const isNumber = /^\d+$/.test(id);

      const params: QueryParams = {};

      if (isNumber) {
        params.congress_number = int(parseInt(id));
      } else {
        params.id = id;
      }

      // Get total count of representatives
      const countQuery = isNumber
        ? `
          MATCH (c:Congress {congress_number: $congress_number})<-[:BELONGS_TO]-(g:Group {type: "chamber", subtype: "house"})<-[:MEMBER_OF]-(p:Person)
          RETURN COUNT(DISTINCT p) as total
        `
        : `
          MATCH (c:Congress {id: $id})<-[:BELONGS_TO]-(g:Group {type: "chamber", subtype: "house"})<-[:MEMBER_OF]-(p:Person)
          RETURN COUNT(DISTINCT p) as total
        `;

      const countResult = await runQuery(countQuery, params);
      const totalRaw = countResult[0]?.total || 0;
      const total: number = typeof totalRaw === 'object' && 'low' in totalRaw ? (totalRaw as { low: number }).low : Number(totalRaw);

      // Get paginated representatives with their full congress history
      const query = isNumber
        ? `
          MATCH (c:Congress {congress_number: $congress_number})<-[:BELONGS_TO]-(g:Group {type: "chamber", subtype: "house"})<-[:MEMBER_OF]-(p:Person)
          WITH p
          ORDER BY p.last_name, p.first_name
          SKIP $offset
          LIMIT $limit
          OPTIONAL MATCH (p)-[:MEMBER_OF]->(g2:Group {type: "chamber"})-[:BELONGS_TO]->(c2:Congress)
          WITH p, COLLECT(DISTINCT {
            congress_id: c2.id,
            congress_number: c2.congress_number,
            congress_ordinal: c2.ordinal,
            position: CASE WHEN g2.subtype = 'senate' THEN 'senator' ELSE 'representative' END,
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
          MATCH (c:Congress {id: $id})<-[:BELONGS_TO]-(g:Group {type: "chamber", subtype: "house"})<-[:MEMBER_OF]-(p:Person)
          WITH p
          ORDER BY p.last_name, p.first_name
          SKIP $offset
          LIMIT $limit
          OPTIONAL MATCH (p)-[:MEMBER_OF]->(g2:Group {type: "chamber"})-[:BELONGS_TO]->(c2:Congress)
          WITH p, COLLECT(DISTINCT {
            congress_id: c2.id,
            congress_number: c2.congress_number,
            congress_ordinal: c2.ordinal,
            position: CASE WHEN g2.subtype = 'senate' THEN 'senator' ELSE 'representative' END,
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

      const representatives = await runQuery(query, params);
      const has_more = offset + representatives.length < total;

      return new Response(
        JSON.stringify({
          success: true,
          data: representatives,
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
      console.error("Congress representatives error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch representatives",
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