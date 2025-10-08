import { html } from "hono/html";
import { Header, Footer, TailwindConfig } from "./Layout.tsx";

export const LandingPage = () => {
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Open Congress API - Philippine Legislative Data</title>
  ${TailwindConfig()}
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex flex-col">
    ${Header()}
    <main class="flex-grow">
      <!-- Hero Section -->
      <div class="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16 md:py-24">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Philippine Legislative Data API
            </h2>
            <p class="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
              Access comprehensive congressional data including bills, senators, representatives, and legislative history through our modern REST API
            </p>
            <div class="flex flex-wrap gap-4 justify-center">
              <a
                href="/api"
                class="inline-block bg-white text-primary-600 hover:bg-blue-50 font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200"
              >
                View API Documentation
              </a>
              <a
                href="/view/documents"
                class="inline-block bg-white/10 text-white hover:bg-white/20 font-semibold py-3 px-6 rounded-lg border border-white/20 transition-all duration-200"
              >
                Browse Documents
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Access Section -->
      <div class="py-16 bg-gray-50">
        <div class="container mx-auto px-4">
          <div class="max-w-6xl mx-auto">
            <h3 class="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Access</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Documents Card -->
            <a
              href="/view/documents"
              class="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 transition-all duration-200"
            >
              <div class="flex items-center mb-4">
                <div class="bg-primary-100 p-3 rounded-full">
                  <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <h4 class="ml-3 text-lg font-semibold text-gray-900">Legislative Documents</h4>
              </div>
              <p class="text-sm text-gray-600">
                Browse and search House Bills and Senate Bills from multiple congresses with advanced filtering
              </p>
            </a>

            <!-- People Card -->
            <a
              href="/view/people"
              class="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 transition-all duration-200"
            >
              <div class="flex items-center mb-4">
                <div class="bg-success-100 p-3 rounded-full">
                  <svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <h4 class="ml-3 text-lg font-semibold text-gray-900">Senators & Representatives</h4>
              </div>
              <p class="text-sm text-gray-600">
                Explore legislators' profiles, congress memberships, and legislative authorship records
              </p>
            </a>

            <!-- API Card -->
            <a
              href="/api"
              class="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 transition-all duration-200"
            >
              <div class="flex items-center mb-4">
                <div class="bg-secondary-100 p-3 rounded-full">
                  <svg class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                  </svg>
                </div>
                <h4 class="ml-3 text-lg font-semibold text-gray-900">API Documentation</h4>
              </div>
              <p class="text-sm text-gray-600">
                Interactive OpenAPI documentation with all endpoints, parameters, and response schemas
              </p>
            </a>
          </div>
        </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <div class="max-w-6xl mx-auto">
            <h3 class="text-2xl font-bold text-gray-900 mb-8 text-center">Features</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="text-center">
                <div class="bg-primary-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h5 class="font-semibold text-gray-900 mb-2">Type-Safe</h5>
                <p class="text-sm text-gray-600">Zod validation on all requests and responses</p>
              </div>
              <div class="text-center">
                <div class="bg-success-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <h5 class="font-semibold text-gray-900 mb-2">Fast</h5>
                <p class="text-sm text-gray-600">Built on Deno and Neo4j graph database</p>
              </div>
              <div class="text-center">
                <div class="bg-secondary-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <h5 class="font-semibold text-gray-900 mb-2">Searchable</h5>
                <p class="text-sm text-gray-600">Full-text search and advanced filtering</p>
              </div>
              <div class="text-center">
                <div class="bg-primary-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <h5 class="font-semibold text-gray-900 mb-2">Well-Documented</h5>
                <p class="text-sm text-gray-600">OpenAPI 3.0 spec with Swagger UI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- API Endpoints Section -->
      <div class="py-16 bg-gray-50">
        <div class="container mx-auto px-4">
          <div class="max-w-6xl mx-auto">
            <h3 class="text-2xl font-bold text-gray-900 mb-8">API Endpoints</h3>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="divide-y divide-gray-200">
              <div class="p-4 hover:bg-gray-50">
                <code class="text-sm font-mono text-primary-600">GET /api/congresses</code>
                <p class="text-sm text-gray-600 mt-1">List all congresses</p>
              </div>
              <div class="p-4 hover:bg-gray-50">
                <code class="text-sm font-mono text-primary-600">GET /api/people</code>
                <p class="text-sm text-gray-600 mt-1">List senators and representatives with filtering</p>
              </div>
              <div class="p-4 hover:bg-gray-50">
                <code class="text-sm font-mono text-primary-600">GET /api/documents</code>
                <p class="text-sm text-gray-600 mt-1">List all bills with filtering and search</p>
              </div>
              <div class="p-4 hover:bg-gray-50">
                <code class="text-sm font-mono text-primary-600">GET /api/stats</code>
                <p class="text-sm text-gray-600 mt-1">Database statistics and metrics</p>
              </div>
            </div>
            <div class="p-4 bg-gray-50 border-t border-gray-200">
              <a href="/api" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View all endpoints →
              </a>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- About Section -->
      <div class="py-16 bg-blue-50">
        <div class="container mx-auto px-4">
          <div class="max-w-6xl mx-auto">
            <h3 class="text-2xl font-bold text-gray-900 mb-4">About This Project</h3>
            <p class="text-gray-700 mb-4">
              The Open Congress API provides programmatic access to Philippine legislative data, making it easier for developers, researchers, and citizens to build applications that promote government transparency and civic engagement.
            </p>
            <p class="text-gray-700 mb-6">
              All data is sourced from the <a href="https://github.com/bettergovph/open-congress-data" class="text-primary-600 hover:text-primary-700 font-medium underline" target="_blank" rel="noopener noreferrer">Open Congress Data</a> repository, which is continuously updated and maintained by the community.
            </p>
            <div class="flex flex-wrap gap-4">
              <a
                href="https://github.com/bettergovph/open-congress-api"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center text-gray-700 hover:text-gray-900 font-medium"
              >
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                </svg>
                GitHub Repository
              </a>
              <a
                href="https://github.com/bettergovph/open-congress-data"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center text-gray-700 hover:text-gray-900 font-medium"
              >
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                </svg>
                Data Repository
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
    ${Footer()}
  </div>
</body>
</html>`;
};
