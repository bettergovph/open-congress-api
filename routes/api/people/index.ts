import type { RouteHandler } from "fresh";

import { runQuery, int } from "@/lib/neo4j.ts";
import type { Person, ApiResponse, QueryParams } from "@/lib/types.ts";

type PeopleResponse = ApiResponse<Person[]>;
type State = Record<string, unknown>;

export const handler: RouteHandler<PeopleResponse, State> = {
  async GET(ctx) {
    try {
      const url = new URL(ctx.req.url);
      const type = url.searchParams.get("type"); // 'senator' or 'representative'
      const congress = url.searchParams.get("congress");
      const last_name = url.searchParams.get("last_name");
      const search = url.searchParams.get("search");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
      const offset = parseInt(url.searchParams.get("offset") || "0");

      // Build WHERE clause based on filters
      const whereConditions: string[] = [];
      const params: QueryParams = {};

      if (type) {
        whereConditions.push("r.position = $type");
        params.type = type;
      }

      if (congress) {
        whereConditions.push("c.congress_number = $congress");
        params.congress = int(parseInt(congress));
      }

      if (last_name) {
        whereConditions.push("p.last_name = $last_name");
        params.last_name = last_name;
      }

      if (search) {
        whereConditions.push(`(
          toLower(p.first_name) CONTAINS toLower($search) OR
          toLower(p.last_name) CONTAINS toLower($search) OR
          toLower(p.middle_name) CONTAINS toLower($search) OR
          ANY(alias IN p.aliases WHERE toLower(alias) CONTAINS toLower($search))
        )`);
        params.search = search;
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

      // Get total count
      const countQuery = congress || type
        ? `
          MATCH (p:Person)-[r:SERVED_IN]->(c:Congress)
          ${whereClause}
          RETURN COUNT(DISTINCT p) as total
        `
        : `
          MATCH (p:Person)
          ${whereClause}
          RETURN COUNT(DISTINCT p) as total
        `;

      const countResult = await runQuery(countQuery, params);
      const totalRaw = countResult[0]?.total || 0;
      const total: number = typeof totalRaw === 'object' && 'low' in totalRaw ? (totalRaw as { low: number }).low : Number(totalRaw);

      // Get paginated results with congress membership
      const query = congress || type
        ? `
          MATCH (p:Person)-[r:SERVED_IN]->(c:Congress)
          ${whereClause}
          WITH p
          ORDER BY p.last_name, p.first_name
          SKIP $offset
          LIMIT $limit
          MATCH (p)-[r2:SERVED_IN]->(c2:Congress)
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
          MATCH (p:Person)
          ${whereClause}
          WITH p
          ORDER BY p.last_name, p.first_name
          SKIP $offset
          LIMIT $limit
          OPTIONAL MATCH (p)-[r:SERVED_IN]->(c:Congress)
          WITH p, COLLECT(DISTINCT {
            congress_id: c.id,
            congress_number: c.congress_number,
            congress_ordinal: c.ordinal,
            position: r.position,
            year_range: c.year_range
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

      const people = await runQuery(query, params);
      const has_more = offset + people.length < total;

      return new Response(
        JSON.stringify({
          success: true,
          data: people,
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
      console.error("People list error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch people",
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