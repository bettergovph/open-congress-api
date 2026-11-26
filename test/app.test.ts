import { describe, expect, it } from "vitest";
import app from "../main.ts";

describe("app (DB-free routes)", () => {
  it("GET / renders the landing page", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(await res.text()).toContain("Open Congress");
  });

  it("GET /api/doc returns the OpenAPI document", async () => {
    const res = await app.request("/api/doc");
    expect(res.status).toBe(200);
    const doc = (await res.json()) as {
      openapi: string;
      info: { title: string };
      paths: Record<string, unknown>;
    };
    expect(doc.openapi).toBe("3.0.0");
    expect(doc.info.title).toBe("Open Congress API");
    for (const p of ["/congresses", "/people", "/people/{id}", "/ping", "/stats"]) {
      expect(Object.keys(doc.paths)).toContain(p);
    }
  });

  it("GET /api serves Swagger UI", async () => {
    const res = await app.request("/api");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("swagger-ui");
  });

  it("GET /api/scalar serves Scalar", async () => {
    const res = await app.request("/api/scalar");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("@scalar/api-reference");
  });

  it.each(["/view/people", "/view/documents"])("GET %s returns HTML", async (path) => {
    const res = await app.request(path);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
  });

  it("unknown path returns the HTML 404 page", async () => {
    const res = await app.request("/does-not-exist");
    expect(res.status).toBe(404);
    expect(await res.text()).toContain("Page Not Found");
  });
});
