import type { RouteHandler } from "fresh";

import { runQuery, int } from "@/lib/neo4j.ts";
import type { Bill, ApiResponse, QueryParams } from "@/lib/types.ts";

type BillsResponse = ApiResponse<Bill[]>;
type State = Record<string, unknown>;

export const handler: RouteHandler<BillsResponse, State> = {
  async GET(ctx) {
    try {
      const url = new URL(ctx.req.url);
      const congress = url.searchParams.get("congress");
      const type = url.searchParams.get("type"); // 'HB' or 'SB'
      const scope = url.searchParams.get("scope"); // 'National', 'Local', or 'Both'
      const author = url.searchParams.get("author");
      const search = url.searchParams.get("search");
      const date_from = url.searchParams.get("date_from");
      const date_to = url.searchParams.get("date_to");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const sort = url.searchParams.get("sort") || "date_filed";
      const dir = (url.searchParams.get("dir") || "desc").toUpperCase();

      // Build WHERE clause based on filters
      const whereConditions: string[] = ["d.type = 'bill'"];
      const params: QueryParams = {};

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

      if (scope) {
        whereConditions.push("d.scope = $scope");
        params.scope = scope;
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

      if (search) {
        whereConditions.push(`(
          toLower(d.title) CONTAINS toLower($search) OR
          toLower(d.long_title) CONTAINS toLower($search) OR
          toLower(d.abstract) CONTAINS toLower($search) OR
          toLower(d.name) CONTAINS toLower($search) OR
          toLower(d.congress_website_title) CONTAINS toLower($search) OR
          toLower(d.congress_website_abstract) CONTAINS toLower($search) OR
          EXISTS {
            MATCH (d)<-[:AUTHORED]-(p:Person)
            WHERE toLower(p.first_name) CONTAINS toLower($search) OR
                  toLower(p.last_name) CONTAINS toLower($search) OR
                  ANY(alias IN p.aliases WHERE toLower(alias) CONTAINS toLower($search))
          }
        )`);
        params.search = search;
      }

      if (date_from) {
        whereConditions.push("d.date_filed >= $date_from");
        params.date_from = date_from;
      }

      if (date_to) {
        whereConditions.push("d.date_filed <= $date_to");
        params.date_to = date_to;
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

      // Get total count
      const countQuery = `
        MATCH (d:Document)
        ${whereClause}
        RETURN COUNT(d) as total
      `;

      const countResult = await runQuery(countQuery, params);
      const totalRaw = countResult[0]?.total || 0;
      const total: number = typeof totalRaw === 'object' && 'low' in totalRaw ? (totalRaw as { low: number }).low : Number(totalRaw);

      // Build ORDER BY clause
      let orderByClause = "";
      switch (sort) {
        case "congress":
          orderByClause = `d.congress ${dir}, d.name`;
          break;
        case "bill_number":
          orderByClause = `d.bill_number ${dir}, d.name`;
          break;
        case "date_filed":
          orderByClause = `d.date_filed ${dir}, d.name`;
          break;
        case "title":
          orderByClause = `COALESCE(d.title, d.congress_website_title) ${dir}, d.name`;
          break;
        case "scope":
          orderByClause = `d.scope ${dir}, d.name`;
          break;
        case "authors_count":
          // For authors count, we'll need to use SIZE(authors) in the final ORDER BY
          orderByClause = `SIZE(authors) ${dir}, d.name`;
          break;
        default:
          orderByClause = `d.date_filed DESC, d.name`;
      }

      // Get paginated results
      const query = `
        MATCH (d:Document)
        ${whereClause}
        WITH d
        ORDER BY ${sort === 'authors_count' ? 'd.name' : orderByClause}
        SKIP $offset
        LIMIT $limit
        OPTIONAL MATCH (d)<-[:AUTHORED]-(p:Person)
        WITH d, COLLECT(DISTINCT {
          id: p.id,
          first_name: p.first_name,
          middle_name: p.middle_name,
          last_name: p.last_name,
          name_suffix: p.name_suffix,
          aliases: p.aliases
        }) as authors
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
          d.download_url_sources as download_url_sources,
          CASE WHEN SIZE(authors) > 0 AND authors[0].id IS NOT NULL THEN authors ELSE [] END as authors
        ORDER BY ${orderByClause}
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
      console.error("Bills list error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch bills",
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