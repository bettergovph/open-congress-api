# Open Congress API

A modern REST API built with [Deno](https://deno.com/),
[TypeScript](https://www.typescriptlang.org/), and
[Hono](https://hono.dev/) that serves Philippine Congress data from a
Neo4j graph database. Features auto-generated OpenAPI documentation via Swagger UI. Based on data from the
[bettergovph/open-congress-data](https://github.com/bettergovph/open-congress-data)
repository.

## Tech Stack

- **Runtime**: Deno 2.x
- **Framework**: Hono 4.x
- **API Docs**: @hono/zod-openapi + Swagger UI
- **Validation**: Zod
- **Database**: Neo4j 5.x

## Prerequisites

- [Deno](https://docs.deno.com/runtime/getting_started/installation/)
- [Neo4j](https://neo4j.com/download/) with [bettergovph/open-congress-data](https://github.com/bettergovph/open-congress-data/blob/main/DEVELOPMENT.md) set up

## Development

Start the development server:

```bash
deno task start
```

The API will be available at `http://localhost:8000`

## Available Endpoints

- **API**: `http://localhost:8000/api/*` - REST API endpoints
- **Swagger UI**: `http://localhost:8000/api` - Interactive API documentation
- **OpenAPI Spec**: `http://localhost:8000/api/doc` - OpenAPI 3.0 JSON specification

## API Documentation

All API endpoints are **automatically documented** using [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi). The Swagger UI at `/api` provides:

- Interactive API explorer
- Request/response schemas with examples
- Type-safe request validation via Zod
- Try-it-out functionality for testing endpoints

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
- **Person** - Senators and Representatives
- **Committee** - Congressional committees
- **Document** - Legislative bills (subtype: HB or SB)

### Relationships
- `(Person)-[:SERVED_IN]->(Congress)` - Person served in a congress (with position: senator/representative)
- `(Person)-[:AUTHORED]->(Document)` - Person authored a bill
- `(Committee)-[:BELONGS_TO]->(Congress)` - Committee belongs to a congress
- `(Document)-[:FILED_IN]->(Congress)` - Bill was filed in a congress

### Query Patterns

All Neo4j queries are documented in the route files:
- `routes/congresses.ts` - Congress-related queries
- `routes/people.ts` - Person-related queries
- `routes/bills.ts` - Bill-related queries
- `routes/stats.ts` - Statistics queries

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
