export const LandingPage = () => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Open Congress API</title>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.5;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #222;
          }

          h1 {
            font-size: 32px;
            margin-bottom: 8px;
            font-weight: 600;
          }

          h2 {
            font-size: 20px;
            margin: 40px 0 16px 0;
            font-weight: 600;
          }

          p {
            margin: 0 0 16px 0;
            color: #555;
          }

          a {
            color: #0066cc;
            text-decoration: none;
          }

          a:hover {
            text-decoration: underline;
          }

          ul {
            margin: 0;
            padding-left: 20px;
          }

          li {
            margin: 8px 0;
          }

          code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 14px;
          }

          .links {
            margin: 24px 0;
          }

          .links a {
            display: inline-block;
            margin-right: 16px;
            margin-bottom: 8px;
          }

          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 14px;
            color: #666;
          }
        `}</style>
      </head>
      <body>
        <h1>Open Congress API</h1>
        <p>REST API for Philippine congressional legislative data.</p>

        <div class="links">
          <a href="/api">API Documentation</a>
          <a href="/api/doc">OpenAPI Spec</a>
          <a href="/api/stats">Statistics</a>
        </div>

        <h2>Endpoints</h2>
        <ul>
          <li><code>GET /api/congresses</code> - List all congresses</li>
          <li><code>GET /api/congresses/:id</code> - Get congress details</li>
          <li><code>GET /api/congresses/:id/documents</code> - Get bills filed in congress</li>
          <li><code>GET /api/people</code> - List senators and representatives</li>
          <li><code>GET /api/people/:id</code> - Get person details</li>
          <li><code>GET /api/people/:id/documents</code> - Get bills authored by person</li>
          <li><code>GET /api/people/:id/groups</code> - Get groups person belongs to</li>
          <li><code>GET /api/search/people</code> - Search people with filters</li>
          <li><code>GET /api/documents</code> - List all bills with filtering</li>
          <li><code>GET /api/documents/:id</code> - Get bill details</li>
          <li><code>GET /api/documents/:id/authors</code> - Get bill authors</li>
          <li><code>GET /api/search/documents</code> - Search bills with filters</li>
          <li><code>GET /api/stats</code> - Database statistics</li>
        </ul>

        <h2>Tech Stack</h2>
        <p>Deno, Hono, Neo4j, Zod, OpenAPI 3.0</p>

        <h2>Features</h2>
        <ul>
          <li>Type-safe request/response validation</li>
          <li>Auto-generated OpenAPI documentation</li>
          <li>Pagination support on list endpoints</li>
          <li>Full-text search capabilities</li>
          <li>Graph database for relationship queries</li>
        </ul>

        <div class="footer">
          <p>
            <a href="https://github.com/bettergovph/open-congress-api">GitHub</a> •
            <a href="https://github.com/bettergovph/open-congress-data">Data Source</a>
          </p>
          <p>CC0 1.0 Universal - Public Domain</p>
        </div>
      </body>
    </html>
  );
};
