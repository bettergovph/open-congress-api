import type { RouteHandler } from "fresh";

import { runQuery, int } from "@/lib/neo4j.ts";
import type { Bill, ApiResponse, QueryParams } from "@/lib/types.ts";

type BillsResponse = ApiResponse<Bill[]>;
type State = Record<string, unknown>;

export const handler: RouteHandler<BillsResponse, State> = {
  async GET(ctx) {
    const { id } = ctx.params;

    try {
      const url = new URL(ctx.req.url);
      const congress = url.searchParams.get("congress");
      const type = url.searchParams.get("type"); // 'HB' or 'SB'
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
      const offset = parseInt(url.searchParams.get("offset") || "0");

      // First check if the person exists
      const personCheckQuery = `
        MATCH (p:Person {id: $id})
        RETURN p.id
        LIMIT 1
      `;

      const personCheck = await runQuery(personCheckQuery, { id });

      if (!personCheck || personCheck.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: `Person with ID "${id}" not found`,
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

      // Build WHERE clause based on filters
      const whereConditions: string[] = ["d.type = 'bill'"];
      const params: QueryParams = { id };

      if (congress) {
        whereConditions.push("d.congress = $congress");
        params.congress = int(parseInt(congress));
      }

      if (type) {
        // Convert to uppercase to match data
        const upperType = type.toUpperCase();
        whereConditions.push("d.subtype = $type");
        params.type = upperType;
      }

      const whereClause = whereConditions.length > 0
        ? `AND ${whereConditions.join(" AND ")}`
        : "";

      // Get total count
      const countQuery = `
        MATCH (p:Person {id: $id})-[:AUTHORED]->(d:Document)
        ${whereClause.replace('AND', 'WHERE')}
        RETURN COUNT(d) as total
      `;

      const countResult = await runQuery(countQuery, params);
      const totalRaw = countResult[0]?.total || 0;
      const total: number = typeof totalRaw === 'object' && 'low' in totalRaw ? (totalRaw as { low: number }).low : Number(totalRaw);

      // Get paginated results
      const query = `
        MATCH (p:Person {id: $id})-[:AUTHORED]->(d:Document)
        ${whereClause.replace('AND', 'WHERE')}
        WITH d
        ORDER BY d.date_filed DESC, d.name
        SKIP $offset
        LIMIT $limit
        RETURN
          d.id as id,
          d.type as type,
          d.subtype as subtype,
          d.name as name,
          d.bill_number as bill_number,
          d.congress as congress,
          d.title as title,
          d.long_title as long_title,
          d.congress_website_title as congress_website_title,
          d.congress_website_abstract as congress_website_abstract,
          d.date_filed as date_filed,
          d.scope as scope,
          d.subjects as subjects,
          d.authors_raw as authors_raw,
          d.senate_website_permalink as senate_website_permalink,
          d.download_url_sources as download_url_sources
        ORDER BY d.date_filed DESC, d.name
      `;

      params.offset = int(offset);
      params.limit = int(limit);

      const bills = await runQuery(query, params);
      const has_more = offset + bills.length < total;

      return new Response(
        JSON.stringify({
          success: true,
          data: bills,
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
      console.error("Person bills fetch error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch person's bills",
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