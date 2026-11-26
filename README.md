# Open Congress API

A modern REST API built for [Cloudflare Workers](https://workers.cloudflare.com/) with
[TypeScript](https://www.typescriptlang.org/) and
[Hono](https://hono.dev/) that serves Philippine Congress data from a
Neo4j graph database. Features auto-generated OpenAPI documentation via Swagger UI. Based on data from the
[bettergovph/open-congress-data](https://github.com/bettergovph/open-congress-data)
repository.

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono 4.x
- **API Docs**: @hono/zod-openapi + Swagger UI
- **Validation**: Zod
- **Database**: Neo4j 5.19+ via the HTTPS Query API
- **Tests**: Vitest + @cloudflare/vitest-pool-workers

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- A [Neo4j](https://neo4j.com/download/) 5.19+ instance (Aura works as-is) with the HTTP(S) port reachable from the Worker, loaded with [bettergovph/open-congress-data](https://github.com/bettergovph/open-congress-data/blob/main/DEVELOPMENT.md)

## Development

```bash
npm install
cp .dev.vars.example .dev.vars   # then fill in your Neo4j credentials
npm run dev
```

The API will be available at `http://localhost:8787`

`NEO4J_URI` may stay Bolt-style (`neo4j+s://...`, `bolt://...`); the Query API
HTTP URL is derived from it. Set `NEO4J_HTTP_URL` to override it.

Other scripts: `npm test`, `npm run typecheck`, `npm run cf-typegen`.

## Deployment

```bash
npx wrangler login
npx wrangler secret put NEO4J_URI
npx wrangler secret put NEO4J_USERNAME
npx wrangler secret put NEO4J_PASSWORD
# optional: npx wrangler secret put NEO4J_HTTP_URL
npm run deploy
```

To serve `open-congress-api.bettergov.ph`, uncomment the `routes` block in
`wrangler.jsonc` and move the DNS record off Deno Deploy.

The `Deploy` GitHub workflow deploys on every push to `main`. It needs the
repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Available Endpoints

### API Endpoints
- **API**: `http://localhost:8787/api/*` - REST API endpoints
- **Scalar Docs**: `http://localhost:8787/api/scalar` - Beautiful API documentation powered by [Scalar](https://scalar.com)
- **Swagger UI**: `http://localhost:8787/api` - Interactive API documentation
- **OpenAPI Spec**: `http://localhost:8787/api/doc` - OpenAPI 3.0 JSON specification

### Web UI
- **Home**: `http://localhost:8787/` - Landing page with quick access links
- **Congresses**: `http://localhost:8787/view/congresses` - Browse all Philippine congresses with statistics
- **Congress Detail**: `http://localhost:8787/view/congresses/{congressNumber}` - View senators and representatives for a specific congress
- **Documents**: `http://localhost:8787/view/documents` - Browse and search legislative documents (House Bills and Senate Bills)
- **Document Detail**: `http://localhost:8787/view/documents/{documentId}` - View individual document details, authors, and metadata
- **People**: `http://localhost:8787/view/people` - Browse senators and representatives with filtering
- **Person Detail**: `http://localhost:8787/view/people/{personId}` - View individual legislator profiles, congress memberships, and authored bills

## Web UI Features

The application includes a modern web interface for browsing Philippine Congress data:

- **Responsive Design**: Built with Tailwind CSS, mobile-friendly layouts
- **Search & Filters**: Filter documents by congress, type, scope; filter people by congress, type, name
- **Sortable Tables**: Click column headers to sort data
- **Detailed Views**: Individual pages for each congress, document, and person with complete metadata
- **Congress Cards**: Visual representation of Senate vs House members and bills filed
- **Breadcrumb Navigation**: Easy navigation between related pages
- **Direct Links**: Copy IDs, view API data, access original source documents

## API Documentation

All API endpoints are **automatically documented** using [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi).

### Available Documentation Viewers

- **Scalar** (`/api/scalar`) - Modern, beautiful API documentation with:
  - Clean, responsive design
  - Dark mode support
  - Code examples in multiple languages
  - Interactive API testing
  - Superior UX for browsing large APIs

- **Swagger UI** (`/api`) - Classic API explorer with:
  - Interactive API explorer
  - Request/response schemas with examples
  - Type-safe request validation via Zod
  - Try-it-out functionality for testing endpoints

### Publishing to Scalar Galaxy

To publish your API to [Scalar Galaxy](https://galaxy.scalar.com/) (Scalar's API registry):

1. Visit https://galaxy.scalar.com/
2. Sign up or log in
3. Click "Add API" or "Import API"
4. Provide your OpenAPI spec URL: `https://your-domain.com/api/doc`
5. Configure API details (name, description, visibility)
6. Publish

Your API will be discoverable in Scalar's public registry and get a shareable documentation URL.

Each route file (`routes/*.ts`) includes comprehensive inline documentation of the Neo4j Cypher queries used:

```typescript
/**
 * GET /congresses
 *
 * Purpose: List all Philippine congresses with pagination
 *
 * Neo4j Query:
 * - Matches: All Congress nodes
 * - Filters: year (start_year/end_year range), ordinal
 * - Returns: Congress properties sorted by congress_number DESC
 * - Pagination: SKIP offset LIMIT limit
 *
 * Example: GET /api/congresses?year=2022&limit=10
 */
```

## Neo4j Graph Database

The API queries a Neo4j graph database with the following structure:

### Node Types
- **Congress** - Congressional sessions (e.g., 20th Congress)
- **Group** - Chambers (Senate or House of Representatives) within each congress
- **Person** - Senators and Representatives
- **Committee** - Congressional committees
- **Document** - Legislative bills (subtype: HB or SB)

### Relationships
- `(Person)-[:MEMBER_OF]->(Group)` - Person is a member of a chamber (Senate or House)
- `(Group)-[:BELONGS_TO]->(Congress)` - Chamber belongs to a congress
- `(Person)-[:AUTHORED]->(Document)` - Person authored a bill
- `(Committee)-[:BELONGS_TO]->(Congress)` - Committee belongs to a congress
- `(Document)-[:FILED_IN]->(Congress)` - Bill was filed in a congress

**Note**: There is no direct Person-to-Congress relationship. To find which congress a person served in, traverse through the Group (chamber) node: `Person → MEMBER_OF → Group → BELONGS_TO → Congress`

### Query Patterns

All Neo4j queries are documented in the route files:
- `routes/congresses.ts` - Congress-related queries
- `routes/people.ts` - Person-related queries
- `routes/bills.ts` - Bill-related queries
- `routes/stats.ts` - Statistics queries

### View Routes

Web UI routes are implemented using server-side rendering with Hono:
- `routes/view/congresses.tsx` - Congress list and detail pages
- `routes/view/documents.tsx` - Document list page
- `routes/view/document-detail.tsx` - Document detail page
- `routes/view/people.tsx` - People list page
- `routes/view/person-detail.tsx` - Person detail page
- `components/Layout.tsx` - Shared header and footer components
- `components/LandingPage.tsx` - Home page

## Impostor Syndrome Disclaimer

**We want your help. No, really.**

There may be a little voice inside your head that is telling you that you're not
ready to be an open source contributor; that your skills aren't nearly good
enough to contribute. What could you possibly offer a project like this one?

We assure you - the little voice in your head is wrong. If you can write code at
all, you can contribute code to open source. Contributing to open source
projects is a fantastic way to advance one's coding skills. Writing perfect code
isn't the measure of a good developer (that would disqualify all of us!); it's
trying to create something, making mistakes, and learning from those mistakes.
That's how we all improve, and we are happy to help others learn.

Being an open source contributor doesn't just mean writing code, either. You can
help out by writing documentation, tests, or even giving feedback about the
project (and yes - that includes giving feedback about the contribution
process). Some of these contributions may be the most valuable to the project as
a whole, because you're coming to the project with fresh eyes, so you can see
the errors and assumptions that seasoned contributors have glossed over.

**Remember:**

- No contribution is too small
- Everyone started somewhere
- Questions are welcome
- Mistakes are learning opportunities
- Your perspective is valuable

(Impostor syndrome disclaimer adapted from
[Adrienne Friend](https://github.com/adriennefriend/imposter-syndrome-disclaimer))

## License

This repository is dedicated to the public domain under **CC0 1.0 Universal (CC0
1.0) Public Domain Dedication**.

You can copy, modify, distribute and perform the work, even for commercial
purposes, all without asking permission.

- No Copyright
- No Rights Reserved
- No Attribution Required

For more information, see the
[CC0 1.0 Universal license](https://creativecommons.org/publicdomain/zero/1.0/).
