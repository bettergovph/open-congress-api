import type { RouteHandler } from "fresh";

import { runQuery } from "@/lib/neo4j.ts";
import type { ApiResponse } from "@/lib/types.ts";

interface Stats {
  total_bills: number;
  total_house_bills: number;
  total_senate_bills: number;
  total_congresses: number;
  total_people: number;
  total_committees: number;
  bills_by_congress: Array<{
    congress: number;
    total: number;
    house_bills: number;
    senate_bills: number;
  }>;
  bills_with_dates: number;
  bills_without_dates: number;
}

type StatsResponse = ApiResponse<Stats>;
type State = Record<string, unknown>;

export const handler: RouteHandler<StatsResponse, State> = {
  async GET(_ctx) {
    try {
      // Get overall counts
      const overallQuery = `
        MATCH (d:Document {type: 'bill'})
        WITH COUNT(d) as total_bills,
             SUM(CASE WHEN d.subtype = 'HB' THEN 1 ELSE 0 END) as total_house_bills,
             SUM(CASE WHEN d.subtype = 'SB' THEN 1 ELSE 0 END) as total_senate_bills,
             SUM(CASE WHEN d.date_filed IS NOT NULL THEN 1 ELSE 0 END) as bills_with_dates,
             SUM(CASE WHEN d.date_filed IS NULL THEN 1 ELSE 0 END) as bills_without_dates
        MATCH (c:Congress)
        WITH total_bills, total_house_bills, total_senate_bills, bills_with_dates, bills_without_dates, COUNT(c) as total_congresses
        MATCH (p:Person)
        WITH total_bills, total_house_bills, total_senate_bills, bills_with_dates, bills_without_dates, total_congresses, COUNT(p) as total_people
        OPTIONAL MATCH (com:Committee)
        RETURN total_bills, total_house_bills, total_senate_bills, bills_with_dates, bills_without_dates, total_congresses, total_people, COUNT(com) as total_committees
      `;

      const overallResult = await runQuery(overallQuery);
      const overall = overallResult[0] || {};

      // Get bills by congress
      const congressQuery = `
        MATCH (d:Document {type: 'bill'})
        WHERE d.congress IS NOT NULL
        WITH d.congress as congress,
             COUNT(d) as total,
             SUM(CASE WHEN d.subtype = 'HB' THEN 1 ELSE 0 END) as house_bills,
             SUM(CASE WHEN d.subtype = 'SB' THEN 1 ELSE 0 END) as senate_bills
        RETURN congress, total, house_bills, senate_bills
        ORDER BY congress DESC
      `;

      const congressResult = await runQuery(congressQuery);

      // Convert Neo4j integers to regular numbers
      const toNumber = (val: unknown) => {
        if (typeof val === 'object' && val !== null && 'low' in val) {
          return (val as { low: number }).low;
        }
        return Number(val) || 0;
      };

      const stats: Stats = {
        total_bills: toNumber(overall.total_bills),
        total_house_bills: toNumber(overall.total_house_bills),
        total_senate_bills: toNumber(overall.total_senate_bills),
        total_congresses: toNumber(overall.total_congresses),
        total_people: toNumber(overall.total_people),
        total_committees: toNumber(overall.total_committees),
        bills_with_dates: toNumber(overall.bills_with_dates),
        bills_without_dates: toNumber(overall.bills_without_dates),
        bills_by_congress: congressResult.map((row: Record<string, unknown>) => ({
          congress: toNumber(row.congress),
          total: toNumber(row.total),
          house_bills: toNumber(row.house_bills),
          senate_bills: toNumber(row.senate_bills)
        }))
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: stats
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Stats fetch error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: error instanceof Error ? error.message : "Failed to fetch statistics",
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