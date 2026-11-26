import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "cloudflare:workers";
import {
  normalizeValue,
  resolveHttpUrl,
  runQuery,
  verifyConnectivity,
} from "../lib/neo4j.ts";
import { mockQueryApi } from "./helpers/query-api.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveHttpUrl", () => {
  it("prefers NEO4J_HTTP_URL and strips trailing slash", () => {
    expect(resolveHttpUrl({ NEO4J_HTTP_URL: "https://x.example/" })).toBe("https://x.example");
  });
  it("derives https host from Aura neo4j+s URI", () => {
    expect(resolveHttpUrl({ NEO4J_URI: "neo4j+s://abc.databases.neo4j.io" })).toBe(
      "https://abc.databases.neo4j.io",
    );
  });
  it("drops the bolt port for bolt+s", () => {
    expect(resolveHttpUrl({ NEO4J_URI: "bolt+s://db.example.com:7687" })).toBe(
      "https://db.example.com",
    );
  });
  it("maps neo4j://localhost to http 7474", () => {
    expect(resolveHttpUrl({ NEO4J_URI: "neo4j://localhost" })).toBe("http://localhost:7474");
  });
  it("maps bolt://localhost:7687 to http 7474", () => {
    expect(resolveHttpUrl({ NEO4J_URI: "bolt://localhost:7687" })).toBe("http://localhost:7474");
  });
  it("throws when nothing is configured", () => {
    expect(() => resolveHttpUrl({})).toThrow(/Missing Neo4j connection environment variables/);
  });
});

describe("normalizeValue", () => {
  it("unwraps a node to its properties", () => {
    expect(
      normalizeValue({ elementId: "4:x:1", labels: ["Person"], properties: { id: "p1" } }),
    ).toEqual({ id: "p1" });
  });
  it("unwraps nodes inside arrays", () => {
    expect(
      normalizeValue([{ elementId: "e", labels: [], properties: { a: 1 } }, 2]),
    ).toEqual([{ a: 1 }, 2]);
  });
  it("leaves plain maps unchanged", () => {
    expect(normalizeValue({ name: "x", count: 3 })).toEqual({ name: "x", count: 3 });
  });
  it("keeps null", () => {
    expect(normalizeValue(null)).toBeNull();
  });
});

describe("runQuery", () => {
  it("posts statement and parameters", async () => {
    const spy = mockQueryApi(() => ({ fields: ["x"], values: [[5]] }));
    await runQuery("RETURN $x AS x", { x: 5 });
    expect(spy).toHaveBeenCalledTimes(1);
    const [input, init] = spy.mock.calls[0];
    const req = new Request(input as RequestInfo, init);
    expect(req.url).toBe("https://test.databases.neo4j.io/db/neo4j/query/v2");
    expect(req.method).toBe("POST");
    expect(req.headers.get("authorization")).toBe("Basic " + btoa("neo4j:test-password"));
    expect(await req.json()).toEqual({ statement: "RETURN $x AS x", parameters: { x: 5 } });
  });

  it("maps fields to records", async () => {
    mockQueryApi(() => ({ fields: ["id", "n"], values: [["a", 1], ["b", 2]] }));
    expect(await runQuery("RETURN 1")).toEqual([
      { id: "a", n: 1 },
      { id: "b", n: 2 },
    ]);
  });

  it("keeps null values", async () => {
    mockQueryApi(() => ({ fields: ["middle_name"], values: [[null]] }));
    const rows = await runQuery("RETURN 1");
    expect(rows).toEqual([{ middle_name: null }]);
    expect("middle_name" in rows[0]).toBe(true);
  });

  it("throws with Neo4j error code on non-2xx", async () => {
    mockQueryApi(
      () =>
        new Response(
          JSON.stringify({
            errors: [{ code: "Neo.ClientError.Security.Unauthorized", message: "bad creds" }],
          }),
          { status: 401 },
        ),
    );
    await expect(runQuery("RETURN 1")).rejects.toThrow(
      /Neo\.ClientError\.Security\.Unauthorized.*bad creds/,
    );
  });

  it("throws when credentials are missing", async () => {
    const e = env as unknown as Record<string, string | undefined>;
    const original = e.NEO4J_USERNAME;
    delete e.NEO4J_USERNAME;
    try {
      await expect(runQuery("RETURN 1")).rejects.toThrow(
        /Missing Neo4j connection environment variables/,
      );
    } finally {
      e.NEO4J_USERNAME = original;
    }
  });
});

describe("verifyConnectivity", () => {
  it("resolves when the database answers", async () => {
    mockQueryApi(({ statement }) => {
      expect(statement).toContain("RETURN 1 AS ok");
      return { fields: ["ok"], values: [[1]] };
    });
    await expect(verifyConnectivity()).resolves.toBeUndefined();
  });
  it("rejects on a 500", async () => {
    mockQueryApi(() => new Response("boom", { status: 500 }));
    await expect(verifyConnectivity()).rejects.toThrow(/HTTP 500/);
  });
});
