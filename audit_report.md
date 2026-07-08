# Open Congress API — Codebase Audit

> Date: 2026-07-07
> Repository: bettergovph/open-congress-api

---

## Summary

| Metric | Status |
|---|---|
| Runtime | Deno 2 / TypeScript (purely, despite vestigial Python/Node files) |
| Framework | Hono 4 + Zod OpenAPI + hono/jsx |
| Database | Neo4j 5 (graph) |
| Tests | **None** — zero test files exist |
| Type Check | **Failing** — `deno check main.ts` reports typed response errors |
| Linting | **Failing** — `deno lint` reports 6 issues |
| CI/CD | GitHub Actions — daily health check only |

---

## 🟥 Issues Requiring Attention

### 1. `SERVED_IN` vs `MEMBER_OF` Schema Mismatch

**Files:** `routes/people.ts:655`, `routes/congresses.ts:294`

The code uses two different relationship patterns to query Person→Congress membership:

```ts
// Search endpoint — uses SERVED_IN:
MATCH (p:Person)-[r:SERVED_IN]->(c:Congress)

// Other queries — use MEMBER_OF→BELONGS_TO path:
MATCH (p:Person)-[:MEMBER_OF]->(g:Group)-[:BELONGS_TO]->(c:Congress)
```

**`DATABASE.md`** explicitly states *"there are NO direct relationships from Person to Congress"* and documents only `MEMBER_OF`, `BELONGS_TO`, `AUTHORED`, `FILED_IN`. If `SERVED_IN` does not exist in the live database, the search and congress-stats endpoints silently return empty results. If it does exist, DATABASE.md is stale.

### 2. Neo4j Integer Truncation Bug

**Files:** `lib/neo4j.ts:56`, `routes/congresses.ts:308-313`, `routes/people.ts:138`

The integer handler in `runQuery` uses `value.low` instead of proper conversion:

```ts
if (value && typeof value === 'object' && 'low' in value && 'high' in value) {
  obj[key] = value.low;  // truncates values > 2^31
}
```

Neo4j's `Integer` is a 64-bit type represented as `{low, high}`. Using `.low` silently truncates values > 2,147,483,647. Should use `value.toNumber()` or `neo4j.integer.inSafeRange()`.

### 3. Cypher Injection in Dynamic `ORDER BY`

**Files:** `routes/bills.ts:172-194`, `routes/bills.ts:627-647`, `routes/people.ts:141-144`

Dynamic `ORDER BY` clauses are built via string interpolation. `sort` is constrained by a `switch`/whitelist, but in document routes `dir` is not constrained before interpolation:

```ts
const dirUpper = dir.toUpperCase();
orderByClause = `d.date_filed ${dirUpper}, d.name`;
```

This means an attacker-controlled `dir` query value can inject arbitrary Cypher fragments into `ORDER BY` for `/api/documents` and `/api/search/documents`.

`routes/people.ts` is safer because it normalizes direction with `dir.toLowerCase() === "desc" ? "DESC" : "ASC"` and whitelists sort fields.

### 4. Browser XSS Risk in View Pages

**Files:** `routes/view/documents.tsx:460`, `routes/view/people.tsx:387`, `routes/view/document-detail.tsx:226`, `routes/view/person-detail.tsx:249`

Several client-side render functions insert API/database fields directly into `innerHTML` template strings without escaping. Examples include document titles, names, aliases, subjects, group names, IDs, tooltip attributes, and authored document fields:

```js
tbody.innerHTML = bills.map(bill => `
  <div>${bill.title || bill.congress_website_title}</div>
`).join('');
```

Some detail fields correctly use `textContent`, but the table/list builders do not. If any upstream source data contains HTML or scriptable attributes, the view pages can execute injected markup.

### 5. Type Checking Fails

**Files:** `routes/ping.ts:47`, `routes/stats.ts:64`

`deno check main.ts` currently fails with OpenAPI typed response errors. The handlers return `c.json(body)` without explicit status in success branches, while the generated route types infer `200 | 500` and reject it for `200` responses:

```text
Types of property '_status' are incompatible.
Type '200 | 500' is not assignable to type '200'.
```

Affected routes observed:
- `GET /api/ping`
- `GET /api/stats`

### 6. Linting Fails

**Files:** `routes/view/congress-detail.tsx:7`, `routes/view/person-detail.tsx:7`, `routes/view/document-detail.tsx:7`, `routes/view/congresses.tsx:7`, `routes/people.ts:313`

`deno lint` currently reports:
- 4 `require-await` errors in view route handlers that are marked `async` but do not await anything
- 2 `no-explicit-any` errors in the `include_congresses` mapping in `routes/people.ts`

### 7. No Tests

Zero test files. No testing framework configured. Missing at minimum:
- Health check endpoint test
- Each major endpoint smoke test
- Pagination boundary tests
- Neo4j query contract tests

### 8. Dead / Vestigial Files

| File | Issue |
|---|---|
| `package.json` | Not used (Deno uses `deno.json`) |
| `pyproject.toml` | Claims `deno>=2.5.3` as a Python dependency |
| `main.py` | Empty stub |
| `routes/_app.tsx` | Fresh framework leftover, never imported |
| `.venv/` | Contains Deno binary + Python packages — unused |
| `node_modules/` | Only exists if someone ran `npm install`; unused |

### 9. No Rate Limiting or Auth

All endpoints are public with no rate limiting, API keys, or throttling. Acceptable for a read-only public-data API, but a production risk for abuse/overload.

---

## 🟡 Moderate Concerns

### 10. Neo4j Session Management

`lib/neo4j.ts:42-86` — `runQuery` opens/closes a session per call. Fine for low traffic, but under load this creates connection churn.

### 11. Hardcoded Production URL

`.github/workflows/health-check.yml:16` pings `open-congress-api.bettergov.ph` directly — reveals the production endpoint in the public repo.

### 12. Pagination — Offset-Based

Uses `OFFSET`/`LIMIT` pagination. For large datasets this becomes slow (Neo4j still skips all preceding rows).

### 13. Broad `CONTAINS` Searches on Unindexed Properties

View routes pass user query strings into `toLower().contains()` filters on unindexed properties — could be slow on large datasets.

---

## 🟢 Good Practices Observed

- **Consistent error envelope** — `{success, data, error, pagination}` everywhere
- **OpenAPI 3.0 + Swagger UI + Scalar UI** — excellent developer experience
- **Zod validation** on all request params/query
- **Parameterized Cypher queries** (except ORDER BY)
- **Clean directory structure** — `lib/`, `routes/`, `components/`, `static/`
- **CC0 license** — public domain
- **Environment-based config** with `.env.example`
- **Graceful 404 handling** with helpful navigation links

---

## Recommended Actions (Priority Order)

1. **Fix Cypher injection in document sorting** — Normalize `dir` to `ASC`/`DESC`, reject invalid values, and keep `sort` mapped through explicit server-side constants
2. **Resolve `SERVED_IN` inconsistency** — Add it to sync script + update DATABASE.md, or replace with `MEMBER_OF→BELONGS_TO` everywhere
3. **Fix Neo4j integer handling** — Use `value.toNumber()` or `neo4j.integer.inSafeRange()` in `runQuery` and remove ad-hoc `.low` conversions
4. **Escape or safely render all view data** — Prefer DOM APIs/`textContent`; add a shared HTML escaping helper if string templates remain
5. **Restore static checks** — Make `deno check main.ts` and `deno lint` pass
6. **Add tests** — Smoke tests for all API endpoints, pagination boundaries, and query contract tests for Neo4j routes
7. **Clean up vestigial files** — `package.json`, `pyproject.toml`, `main.py`, `_app.tsx`, `.venv/`, `node_modules/`
8. **Add rate limiting** via Hono middleware
9. **Consider cursor-based pagination** for future scale

---

## Verification Performed

Commands run on 2026-07-07:

```sh
deno check main.ts
deno lint
```

Results:
- `deno check main.ts` failed with 2 typed response errors in `routes/ping.ts` and `routes/stats.ts`
- `deno lint` failed with 6 issues: 4 `require-await`, 2 `no-explicit-any`

---

## Resolved (branch: `bugfix`)

| # | Issue | Fix |
|---|-------|-----|
| 1 | Cypher injection in `ORDER BY` | Normalized `dir` to only allow `ASC`/`DESC` via ternary in both `bills.ts` sort blocks |
| 2 | `SERVED_IN` undocumented | Added `SERVED_IN` relationship documentation to `DATABASE.md` |
| 3 | Neo4j integer truncation (`.low`) | Created shared `toNumber()` helper using `.toNumber()`, replaced all 11 `.low` usages across 5 files |
| 4 | XSS in view pages | Added `escapeHtml()` to `documents.tsx`, `people.tsx`, `document-detail.tsx`, `person-detail.tsx`; wrapped all user-facing text fields |
| 5 | Type check fails | Added explicit `200` status to `return c.json()` in `ping.ts` and `stats.ts` |
| 6 | `deno lint` fails | Removed `async` from 4 view route handlers (`require-await`); replaced `as any` with typed assertion in `people.ts` (`no-explicit-any`) |
| 7 | Vestigial files | Deleted `_app.tsx`, `node_modules/`, `.venv/`, `main.py`, `package.json`, `pyproject.toml`; updated `.gitignore` |
- No test command exists and no test/spec files were found
