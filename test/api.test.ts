import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../main.ts";
import { mockQueryApi, type QueryApiRequest } from "./helpers/query-api.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

const unauthorized = () =>
  new Response(
    JSON.stringify({
      errors: [{ code: "Neo.ClientError.Security.Unauthorized", message: "bad creds" }],
    }),
    { status: 401 },
  );

const personRow = {
  id: "p1",
  first_name: "Juan",
  last_name: "Dela Cruz",
  middle_name: null,
  name_prefix: "Hon.",
  name_suffix: null,
  full_name: "Juan Dela Cruz",
  professional_designations: [],
  senate_website_keys: [],
  congress_website_primary_keys: [],
  congress_website_author_keys: [],
  aliases: [],
};

function rowOf(row: Record<string, unknown>) {
  return { fields: Object.keys(row), values: [Object.values(row)] };
}

describe("GET /api/ping", () => {
  it("ping returns ok", async () => {
    mockQueryApi(() => ({ fields: ["ok"], values: [[1]] }));
    const res = await app.request("/api/ping");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data.database).toBe("connected");
  });

  it("ping returns 500 when database rejects", async () => {
    mockQueryApi(unauthorized);
    const res = await app.request("/api/ping");
    expect(res.status).toBe(500);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("DB_ERROR");
  });

  it("trailing slash tolerated", async () => {
    mockQueryApi(() => ({ fields: ["ok"], values: [[1]] }));
    const res = await app.request("/api/ping/");
    expect(res.status).toBe(200);
  });
});

describe("people", () => {
  it("people list sends integer limit/offset", async () => {
    const seen: QueryApiRequest[] = [];
    mockQueryApi((req) => {
      seen.push(req);
      if (req.statement.includes("COUNT(")) return { fields: ["total"], values: [[1]] };
      return rowOf(personRow);
    });
    const res = await app.request("/api/people?limit=20&offset=0");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data[0].middle_name).toBeNull();
    const list = seen.find((r) => !r.statement.includes("COUNT("))!;
    expect(list.parameters.limit).toBe(20);
    expect(list.parameters.offset).toBe(0);
    expect(Number.isInteger(list.parameters.limit)).toBe(true);
  });

  it("people/:id returns 404 for unknown id", async () => {
    mockQueryApi(() => ({ fields: Object.keys(personRow) }));
    const res = await app.request("/api/people/nope");
    expect(res.status).toBe(404);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("invalid query param types do not crash", async () => {
    mockQueryApi((req) =>
      req.statement.includes("COUNT(")
        ? { fields: ["total"], values: [[0]] }
        : { fields: Object.keys(personRow) }
    );
    const res = await app.request("/api/people?limit=abc");
    const body = (await res.json()) as any;
    expect(res.status < 500 || body.success === false).toBe(true);
  });
});

describe("congresses", () => {
  it("congresses list returns pagination", async () => {
    const congress = (n: number) => ({
      id: `c${n}`,
      congress_number: n,
      congress_website_key: n,
      name: `${n}th Congress of the Philippines`,
      ordinal: `${n}th`,
      start_date: "2022-06-30",
      end_date: "2025-06-30",
      start_year: 2022,
      end_year: 2025,
      year_range: "2022-2025",
    });
    mockQueryApi((req) => {
      if (req.statement.includes("COUNT(")) return { fields: ["total"], values: [[2]] };
      return {
        fields: Object.keys(congress(20)),
        values: [Object.values(congress(20))],
      };
    });
    const res = await app.request("/api/congresses?limit=1");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.pagination.total).toBe(2);
    expect(body.pagination.limit).toBe(1);
    expect(body.pagination.offset).toBe(0);
    expect(body.pagination.has_more).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});

describe("stats", () => {
  it("stats aggregates four queries", async () => {
    mockQueryApi(({ statement }) => {
      if (statement.includes("total_house_bills") && !statement.includes("d.congress as congress")) {
        return {
          fields: ["total_bills", "total_house_bills", "total_senate_bills"],
          values: [[10, 6, 4]],
        };
      }
      if (statement.includes("total_congresses")) {
        return {
          fields: ["total_congresses", "total_people", "total_committees"],
          values: [[3, 100, 40]],
        };
      }
      if (statement.includes("bills_with_dates")) {
        return { fields: ["bills_with_dates", "bills_without_dates"], values: [[7, 3]] };
      }
      return {
        fields: ["congress", "total", "house_bills", "senate_bills"],
        values: [[20, 10, 6, 4]],
      };
    });
    const res = await app.request("/api/stats");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data.bills_with_dates).toBe(7);
    expect(body.data.total_bills).toBe(10);
    expect(body.data.total_people).toBe(100);
    expect(body.data.bills_by_congress).toHaveLength(1);
  });
});
