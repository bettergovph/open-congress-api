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
      const type = url.searchParams.get("type"); // 'HB', 'SB', or 'all'
      const author = url.searchParams.get("author");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
      const offset = parseInt(url.searchParams.get("offset") || "0");

      // Parse congress ID - could be ULID or congress number
      let congressNumber: number;

      if (id.length > 10) {
        // Likely a ULID, look up the congress
        const congressQuery = `
          MATCH (c:Congress {id: $id})
          RETURN c.congress_number as congress_number
          LIMIT 1
        `;
        const congressResult = await runQuery(congressQuery, { id });

        if (!congressResult || congressResult.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: "NOT_FOUND",
                message: `Congress with ID "${id}" not found`,
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

        congressNumber = congressResult[0].congress_number;
      } else {
        // Assume it's a congress number
        congressNumber = parseInt(id);

        // Verify congress exists
        const congressQuery = `
          MATCH (c:Congress {congress_number: $congress_number})
          RETURN c.id
          LIMIT 1
        `;
        const congressResult = await runQuery(congressQuery, { congress_number: int(congressNumber) });

        if (!congressResult || congressResult.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: "NOT_FOUND",
                message: `Congress ${congressNumber} not found`,
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
      }

      // Build WHERE clause based on filters
      const whereConditions: string[] = ["d.type = 'bill'", "d.congress = $congress_number"];
      const params: QueryParams = { congress_number: int(congressNumber) };

      if (type && type !== "all") {
        // Convert to uppercase to match data
        const upperType = type.toUpperCase();
        whereConditions.push("d.subtype = $type");
        params.type = upperType;
      }

      if (author) {
        whereConditions.push(`
          EXISTS {
            MATCH (d)<-[:AUTHORED]-(p:Person)
            WHERE toLower(p.last_name) CONTAINS toLower($author)
          }
        `);
        params.author = author;
      }

      const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

      // Get total count
      const countQuery = `
        MATCH (d:Document)
        ${whereClause}
        RETURN COUNT(d) as total
      `;

      const countResult = await runQuery(countQuery, params);
      const totalRaw = countResult[0]?.total || 0;
      const total: number = typeof totalRaw === 'object' && 'low' in totalRaw ? (totalRaw as { low: number }).low : Number(totalRaw);

      // Get paginated results
      const query = `
        MATCH (d:Document)
        ${whereClause}
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
      console.error("Congress bills fetch error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch congress bills",
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