import { vi } from "vitest";

export interface QueryApiRequest {
  statement: string;
  parameters: Record<string, unknown>;
  url: string;
  headers: Headers;
}

export type QueryApiResult = { fields: string[]; values?: unknown[][] };

/** Spy on global fetch and answer Neo4j Query API calls. */
export function mockQueryApi(
  handler: (req: QueryApiRequest) => QueryApiResult | Response,
) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input as RequestInfo, init);
      const body = (await request.json()) as {
        statement: string;
        parameters: Record<string, unknown>;
      };
      const out = handler({
        statement: body.statement,
        parameters: body.parameters,
        url: request.url,
        headers: request.headers,
      });
      if (out instanceof Response) return out;
      return new Response(
        JSON.stringify({
          data: { fields: out.fields, values: out.values ?? [] },
          bookmarks: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  );
}
