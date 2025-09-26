# Open Congress API

A modern REST API built with [Deno](https://deno.com/),
[TypeScript](https://www.typescriptlang.org/), and
[Fresh](https://fresh.deno.dev/) that serves Philippine Congress data from a
Neo4j graph database. Based on data from the
[open-congress-data](https://github.com/bettergovph/open-congress-data)
repository.

## Tech Stack

- **Runtime**: Deno 2.4
- **Framework**: Fresh 2.1
- **UI Library**: Preact 10.27
- **Styling**: Tailwind CSS 4.1
- **Build Tool**: Vite 7.1
- **Database**: Neo4j 5

## Prerequisites

- [Deno](https://deno.com/) 2.4 or higher installed
- Neo4j database instance (for data persistence)

## Development

Start the development server:

```bash
deno task dev
```

The API will be available at `http://localhost:5173`

## Available Scripts

- `deno task dev` - Start development server with hot reload
- `deno task build` - Build for production
- `deno task start` - Start production server
- `deno task check` - Run format check, linting, and type checking
- `deno task update` - Update Fresh framework

## Related Projects

- [open-congress-data](https://github.com/bettergovph/open-congress-data) - Data
  source repository
