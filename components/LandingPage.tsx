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
              Access comprehensive congressional data including bills, senators, and representatives through our modern REST API
            </p>
            <div class="flex flex-wrap gap-4 justify-center">
              <a
                href="/api/scalar"
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

      <!-- Stats Section -->
      <div class="py-16 bg-white border-b border-gray-200">
        <div class="container mx-auto px-4">
          <div class="max-w-6xl mx-auto">
            <h3 class="text-2xl font-bold text-gray-900 mb-8 text-center">Database Statistics</h3>
            <div id="statsSection" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <!-- Loading state -->
              <div class="col-span-2 md:col-span-3 lg:col-span-6 text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p class="mt-4 text-gray-600">Loading statistics...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script>
        (async function loadStats() {
          try {
            const response = await fetch('/api/stats');
            const result = await response.json();

            if (result.success && result.data) {
              const stats = result.data;
              const statsSection = document.getElementById('statsSection');

              statsSection.innerHTML = \`
                <div class="text-center">
                  <div class="bg-primary-50 rounded-lg p-6">
                    <div class="text-3xl font-bold text-primary-600">\${stats.total_bills.toLocaleString()}</div>
                    <div class="text-sm text-gray-600 mt-2">Total Bills</div>
                  </div>
                </div>
                <div class="text-center">
                  <div class="bg-success-50 rounded-lg p-6">
                    <div class="text-3xl font-bold text-success-600">\${stats.total_house_bills.toLocaleString()}</div>
                    <div class="text-sm text-gray-600 mt-2">House Bills</div>
                  </div>
                </div>
                <div class="text-center">
                  <div class="bg-primary-50 rounded-lg p-6">
                    <div class="text-3xl font-bold text-primary-600">\${stats.total_senate_bills.toLocaleString()}</div>
                    <div class="text-sm text-gray-600 mt-2">Senate Bills</div>
                  </div>
                </div>
                <div class="text-center">
                  <div class="bg-secondary-50 rounded-lg p-6">
                    <div class="text-3xl font-bold text-secondary-600">\${stats.total_people.toLocaleString()}</div>
                    <div class="text-sm text-gray-600 mt-2">People</div>
                  </div>
                </div>
                <div class="text-center">
                  <div class="bg-gray-100 rounded-lg p-6">
                    <div class="text-3xl font-bold text-gray-700">\${stats.total_congresses}</div>
                    <div class="text-sm text-gray-600 mt-2">Congresses</div>
                  </div>
                </div>
                <div class="text-center">
                  <div class="bg-gray-100 rounded-lg p-6">
                    <div class="text-3xl font-bold text-gray-700">\${stats.total_committees.toLocaleString()}</div>
                    <div class="text-sm text-gray-600 mt-2">Committees</div>
                  </div>
                </div>
              \`;
            }
          } catch (error) {
            console.error('Error loading stats:', error);
            const statsSection = document.getElementById('statsSection');
            statsSection.innerHTML = '<div class="col-span-2 md:col-span-3 lg:col-span-6 text-center text-gray-500">Unable to load statistics</div>';
          }
        })();
      </script>

      <!-- Quick Access Section -->
      <div class="py-16 bg-gray-50">
        <div class="container mx-auto px-4">
          <div class="max-w-6xl mx-auto">
            <h3 class="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Access</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Congresses Card -->
            <a
              href="/view/congresses"
              class="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 transition-all duration-200"
            >
              <div class="flex items-center mb-4">
                <div class="bg-secondary-100 p-3 rounded-full">
                  <svg class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
                <h4 class="ml-3 text-lg font-semibold text-gray-900">Congresses</h4>
              </div>
              <p class="text-sm text-gray-600">
                View all congressional sessions with member counts and legislative statistics
              </p>
            </a>

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
              href="/api/scalar"
              class="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 transition-all duration-200"
            >
              <div class="flex items-center mb-4">
                <div class="bg-gray-100 p-3 rounded-full">
                  <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <!-- About Section -->
      <div class="py-16 bg-gray-50">
        <div class="container mx-auto px-4">
          <div class="max-w-6xl mx-auto">
            <!-- Data Accuracy Note -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div class="flex items-start">
                <svg class="w-6 h-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <div>
                  <h4 class="text-base font-semibold text-yellow-800 mb-2">Data Accuracy Note</h4>
                  <p class="text-sm text-yellow-700">
                    The data displayed in this API is manually encoded and may contain inaccuracies. We strive for accuracy but human error is possible. If you discover incorrect information, please help improve the data by submitting corrections to the <a href="https://github.com/bettergovph/open-congress-data/issues" target="_blank" rel="noopener noreferrer" class="underline font-medium hover:text-yellow-800">open-congress-data repository</a>. Your contributions help maintain data quality for everyone.
                  </p>
                </div>
              </div>
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
