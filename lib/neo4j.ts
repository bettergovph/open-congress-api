import { env } from "cloudflare:workers";

/**
 * Minimal client for Neo4j's HTTPS Query API v2
 * (POST {httpUrl}/db/{database}/query/v2). Bolt is not used because it is not
 * reliable on Cloudflare Workers. Bindings are read inside functions, never at
 * module load, so a missing secret surfaces as a normal request error.
 */

export interface Neo4jEnv {
  NEO4J_URI?: string;
  NEO4J_USERNAME?: string;
  NEO4J_PASSWORD?: string;
  NEO4J_HTTP_URL?: string;
  NEO4J_DATABASE?: string;
}

const MISSING_ENV = "Missing Neo4j connection environment variables";

function currentEnv(): Neo4jEnv {
  return env as unknown as Neo4jEnv;
}

/** Derive the Query API base URL (no trailing slash) from the bindings. */
export function resolveHttpUrl(e: Neo4jEnv): string {
  if (e.NEO4J_HTTP_URL) return e.NEO4J_HTTP_URL.replace(/\/+$/, "");
  if (!e.NEO4J_URI) throw new Error(MISSING_ENV);

  const match = /^([a-z0-9+.-]+):\/\/([^/:?#]+)(?::\d+)?/i.exec(e.NEO4J_URI.trim());
  if (!match) throw new Error(`Invalid NEO4J_URI: ${e.NEO4J_URI}`);
  const scheme = match[1].toLowerCase();
  const host = match[2];
  // "+s" / "+ssc" schemes mean TLS; those hosts (e.g. Aura) serve HTTPS on 443.
  if (/\+ss?c?$/.test(scheme)) return `https://${host}`;
  return `http://${host}:7474`;
}

/** Unwrap Query API nodes/relationships to their properties, recursively. */
export function normalizeValue(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(normalizeValue);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("elementId" in o && "properties" in o) return o.properties;
  }
  return v;
}

/** SKIP/LIMIT values must be whole numbers. */
export function int(n: number): number {
  return Math.trunc(n);
}

async function execute(
  cypher: string,
  params?: Record<string, unknown>,
): Promise<{ fields: string[]; values: unknown[][] }> {
  const e = currentEnv();
  const { NEO4J_USERNAME: username, NEO4J_PASSWORD: password } = e;
  if (!username || !password) throw new Error(MISSING_ENV);
  const baseUrl = resolveHttpUrl(e);
  const database = e.NEO4J_DATABASE || "neo4j";

  const res = await fetch(`${baseUrl}/db/${encodeURIComponent(database)}/query/v2`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ statement: cypher, parameters: params ?? {} }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as {
        errors?: { code?: string; message?: string }[];
      };
      const first = body.errors?.[0];
      if (first) detail = `${first.code ?? "UnknownError"}: ${first.message ?? ""}`;
    } catch {
      // body was not JSON
    }
    throw new Error(detail || `Neo4j Query API error: HTTP ${res.status}`);
  }

  const body = (await res.json()) as {
    data?: { fields?: string[]; values?: unknown[][] };
  };
  return { fields: body.data?.fields ?? [], values: body.data?.values ?? [] };
}

export async function runQuery<
  T extends Record<string, unknown> = Record<string, unknown>,
>(cypher: string, params?: Record<string, unknown>): Promise<T[]> {
  const { fields, values } = await execute(cypher, params);
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    fields.forEach((field, i) => {
      obj[field] = normalizeValue(row[i]);
    });
    return obj as T;
  });
}

export async function verifyConnectivity(): Promise<void> {
  await execute("RETURN 1 AS ok");
}
