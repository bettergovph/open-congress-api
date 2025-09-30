# Open Congress API

A modern REST API built with [Deno](https://deno.com/),
[TypeScript](https://www.typescriptlang.org/), and
[Fresh](https://fresh.deno.dev/) that serves Philippine Congress data from a
Neo4j graph database. Based on data from the
[bettergovph/open-congress-data](https://github.com/bettergovph/open-congress-data)
repository.

## Tech Stack

- **Runtime**: Deno 2.4
- **Framework**: Fresh 2.1
- **UI Library**: Preact 10.27
- **Styling**: Tailwind CSS 4.1
- **Build Tool**: Vite 7.1
- **Database**: Neo4j 5

## Prerequisites

- [Deno](https://docs.deno.com/runtime/getting_started/installation/)
- [Neo4j](https://neo4j.com/download/) with [bettergovph/open-congress-data](https://github.com/bettergovph/open-congress-data/blob/main/DEVELOPMENT.md) set up

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
