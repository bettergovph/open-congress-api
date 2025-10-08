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
import { PageLayout } from "./components/Layout.tsx";
import { html } from "hono/html";
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

// 404 handler - must be last
app.notFound((c) => {
  const content = html`
    <div class="bg-gradient-to-r from-primary-600 to-primary-700 py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto">
        <!-- Error Message Card -->
        <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-8 mb-6 text-center">
          <div class="mb-6">
            <svg class="w-32 h-32 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>

          <h1 class="text-6xl font-bold text-gray-900 mb-3">404</h1>
          <h2 class="text-2xl font-semibold text-gray-800 mb-3">Page Not Found</h2>
          <p class="text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/"
              class="inline-block bg-primary-600 text-white hover:bg-primary-700 font-semibold py-3 px-6 rounded-lg shadow transition-all duration-200"
            >
              Go Home
            </a>
            <a
              href="/view/congresses"
              class="inline-block bg-white text-primary-600 hover:bg-gray-50 border border-primary-600 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Browse Congresses
            </a>
          </div>
        </div>

        <!-- Helpful Links Card -->
        <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">You might be looking for:</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a href="/view/documents" class="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-gray-50 transition-all duration-200">
              <div class="font-medium text-gray-900">Legislative Documents</div>
              <div class="text-sm text-gray-600 mt-1">Browse bills and documents</div>
            </a>
            <a href="/view/people" class="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-gray-50 transition-all duration-200">
              <div class="font-medium text-gray-900">Senators & Representatives</div>
              <div class="text-sm text-gray-600 mt-1">View legislators' profiles</div>
            </a>
            <a href="/api/scalar" class="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-gray-50 transition-all duration-200">
              <div class="font-medium text-gray-900">API Documentation</div>
              <div class="text-sm text-gray-600 mt-1">Explore our REST API</div>
            </a>
            <a href="/api/stats" class="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-gray-50 transition-all duration-200">
              <div class="font-medium text-gray-900">Database Statistics</div>
              <div class="text-sm text-gray-600 mt-1">View data summary</div>
            </a>
          </div>
        </div>
        </div>
      </div>
    </div>
  `;

  return c.html(PageLayout({ title: "404 Not Found - Open Congress API", children: content }));
});

Deno.serve(app.fetch);
