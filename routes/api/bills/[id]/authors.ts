import type { RouteHandler } from "fresh";

import { runQuery } from "@/lib/neo4j.ts";
import type { Person, ApiResponse } from "@/lib/types.ts";

type AuthorsResponse = ApiResponse<Person[]>;
type State = Record<string, unknown>;

export const handler: RouteHandler<AuthorsResponse, State> = {
  async GET(ctx) {
    const { id } = ctx.params;

    try {
      // First check if the bill exists
      const billCheckQuery = `
        MATCH (d:Document)
        WHERE d.id = $id OR d.name = $id
        RETURN d.id
        LIMIT 1
      `;

      const billCheck = await runQuery(billCheckQuery, { id });

      if (!billCheck || billCheck.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: `Bill with ID or name "${id}" not found`,
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

      // Get authors
      const query = `
        MATCH (d:Document)<-[:AUTHORED]-(p:Person)
        WHERE d.id = $id OR d.name = $id
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
          p.aliases as aliases
        ORDER BY p.last_name, p.first_name
      `;

      const authors = await runQuery(query, { id });

      return new Response(
        JSON.stringify({
          success: true,
          data: authors,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Bill authors fetch error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch bill authors",
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