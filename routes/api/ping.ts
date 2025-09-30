import type { RouteHandler } from "fresh";
import { runQuery } from "@/lib/neo4j.ts";

type PingResponse = {
  success: boolean;
  message?: string;
  timestamp?: string;
  database?: {
    connected: boolean;
    version?: string;
  };
  error?: {
    code: string;
    message: string;
  };
};

type State = Record<string, unknown>;

export const handler: RouteHandler<PingResponse, State> = {
  async GET(_ctx) {
    try {
      // Simple query to check database connectivity
      const result = await runQuery("RETURN 1 as ping");

      if (result && result.length > 0) {
        return new Response(
          JSON.stringify({
            success: true,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
          }),
          {
            status: 503,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    } catch (error) {
      console.error("Ping error:", error);
      return new Response(
        JSON.stringify({
          success: false,
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};
