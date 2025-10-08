import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { congressesRouter } from "./routes/congresses.ts";
import { peopleRouter } from "./routes/people.ts";
import { billsRouter } from "./routes/bills.ts";
import { statsRouter } from "./routes/stats.ts";
import { pingRouter } from "./routes/ping.ts";
import { viewDocumentsRouter } from "./routes/view/documents.tsx";
import { viewDocumentDetailRouter } from "./routes/view/document-detail.tsx";
import { viewPeopleRouter } from "./routes/view/people.tsx";
import { viewPersonDetailRouter } from "./routes/view/person-detail.tsx";
import { viewCongressesRouter } from "./routes/view/congresses.tsx";
import { viewCongressDetailRouter } from "./routes/view/congress-detail.tsx";
import { LandingPage } from "./components/LandingPage.tsx";
// import { viewBillsRouter } from "./routes/view-bills.tsx";

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

// Scalar UI at /api/scalar
app.get("/api/scalar", (c) => {
  return c.html(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Open Congress API - Scalar Documentation</title>
</head>
<body>
  <script
    id="api-reference"
    data-url="/api/doc"
    data-configuration='${JSON.stringify({
      theme: "purple",
      layout: "modern",
      showSidebar: true,
      darkMode: false,
      customCss: ""
    })}'></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`);
});

// Mount view/dashboard pages
app.route("/", viewDocumentsRouter);
app.route("/", viewDocumentDetailRouter);
app.route("/", viewPeopleRouter);
app.route("/", viewPersonDetailRouter);
app.route("/", viewCongressesRouter);
app.route("/", viewCongressDetailRouter);
// app.route("/", viewBillsRouter);

// Landing page at root
app.get("/", (c) => {
  return c.html(LandingPage());
});

Deno.serve(app.fetch);
