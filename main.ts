import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { congressesRouter } from "./routes/congresses.ts";
import { peopleRouter } from "./routes/people.ts";
import { billsRouter } from "./routes/bills.ts";
import { statsRouter } from "./routes/stats.ts";
import { pingRouter } from "./routes/ping.ts";
import { LandingPage } from "./components/LandingPage.tsx";
// import { viewBillsRouter } from "./routes/view-bills.tsx";
// import { viewPeopleRouter } from "./routes/view-people.tsx";

const app = new Hono({ strict: false });
const apiApp = new OpenAPIHono({ strict: false });

// Register API routes
apiApp.route("/", congressesRouter);
apiApp.route("/", peopleRouter);
apiApp.route("/", billsRouter);
apiApp.route("/", statsRouter);
apiApp.route("/", pingRouter);

// The OpenAPI documentation will be available at /api/doc
apiApp.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Open Congress API",
    description:
      "A modern REST API for Philippine Congress data powered by Neo4j graph database.",
  },
  servers: [
    {
      url: "/api",
      description: "API server",
    },
  ],
});

// Mount the API app under /api
app.route("/api", apiApp);

// Swagger UI at /api
app.get("/api", swaggerUI({ url: "/api/doc", title: "Open Congress API" }));

// Mount view/dashboard pages (will be implemented later)
// app.route("/", viewBillsRouter);
// app.route("/", viewPeopleRouter);

// Landing page at root
app.get("/", (c) => {
  return c.html(LandingPage());
});

Deno.serve(app.fetch);
