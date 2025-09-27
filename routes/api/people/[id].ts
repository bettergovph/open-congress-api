import type { RouteHandler } from "fresh";

import { runQuery } from "@/lib/neo4j.ts";
import type { Person, ApiResponse } from "@/lib/types.ts";

type PersonDetailResponse = ApiResponse<Person>;
type State = Record<string, unknown>;

export const handler: RouteHandler<PersonDetailResponse, State> = {
  async GET(ctx) {
    try {
      const { id } = ctx.params;

      // Get person details
      const query = `
        MATCH (p:Person {id: $id})
        RETURN p.id as id,
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
               p.aliases as aliases
      `;

      const result = await runQuery(query, { id });

      if (!result || result.length === 0) {
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

      const person = result[0];

      // Get congress history through Group (chamber) memberships
      const congressQuery = `
        MATCH (p:Person {id: $id})-[:MEMBER_OF]->(g:Group {type: "chamber"})-[:BELONGS_TO]->(c:Congress)
        RETURN c.id as congress_id,
               c.congress_number as congress_number,
               c.ordinal as congress_ordinal,
               CASE WHEN g.subtype = 'senate' THEN 'senator' ELSE 'representative' END as position,
               g.subtype as chamber,
               c.start_date as start_date,
               c.end_date as end_date,
               c.year_range as year_range
        ORDER BY c.congress_number DESC
      `;

      const congresses = await runQuery(congressQuery, { id });

      if (congresses && congresses.length > 0) {
        person.congresses = congresses;
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: person
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Person detail error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch person",
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