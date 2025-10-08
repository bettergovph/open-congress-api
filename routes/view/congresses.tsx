import { OpenAPIHono } from "@hono/zod-openapi";
import { PageLayout } from "@/components/Layout.tsx";
import { html } from "hono/html";

export const viewCongressesRouter = new OpenAPIHono();

viewCongressesRouter.get("/view/congresses", async (c) => {
  const content = html`
    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <!-- Breadcrumb -->
      <nav class="mb-6" aria-label="Breadcrumb">
        <ol class="flex items-center space-x-2 text-sm text-gray-600">
          <li><a href="/" class="hover:text-primary-600">Home</a></li>
          <li><span class="mx-2">/</span></li>
          <li class="text-gray-900 font-medium">Congresses</li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Philippine Congresses</h2>
        <p class="text-gray-600">Browse all congressional sessions and their legislative records</p>
      </div>

      <!-- Content -->
      <div id="congressesContent">
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p class="mt-4 text-gray-600">Loading congresses...</p>
        </div>
      </div>
    </div>

    <script>
      (async function loadCongresses() {
        try {
          // Fetch congresses with stats
          const congressesResponse = await fetch('/api/congresses?limit=100&include_stats=true');
          const congressesResult = await congressesResponse.json();

          if (!congressesResult.success || !congressesResult.data) {
            throw new Error('Failed to load congresses');
          }

          const congresses = congressesResult.data;

          const content = document.getElementById('congressesContent');

          if (congresses.length === 0) {
            content.innerHTML = \`
              <div class="text-center py-12">
                <p class="text-gray-500">No congresses found</p>
              </div>
            \`;
            return;
          }

          content.innerHTML = \`
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              \${congresses.map(congress => {
                return \`
                  <a href="/view/congresses/\${congress.congress_number}"
                     class="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all duration-200 overflow-hidden">
                    <!-- Header -->
                    <div class="p-6 pb-4">
                      <div class="flex items-start justify-between mb-2">
                        <div>
                          <h3 class="text-xl font-bold text-gray-900">\${congress.ordinal} Congress</h3>
                          <p class="text-sm text-gray-600 mt-1">\${congress.year_range}</p>
                        </div>
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                          #\${congress.congress_number}
                        </span>
                      </div>
                      <div class="mt-3 pt-3 border-t border-gray-100">
                        <div class="flex items-center justify-between">
                          <span class="text-sm text-gray-600">Total Bills</span>
                          <span class="text-lg font-bold text-gray-900">\${(congress.total_bills || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Two Column Layout -->
                    <div class="grid grid-cols-2 divide-x divide-gray-200">
                      <!-- Senate (Left) -->
                      <div class="bg-primary-50/30 p-4">
                        <div class="flex items-center gap-2 mb-3">
                          <div class="w-1 h-5 bg-primary-600 rounded"></div>
                          <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Senate</h4>
                        </div>
                        <div class="space-y-2">
                          <div class="bg-white rounded-lg p-3 border border-primary-100">
                            <div class="text-2xl font-bold text-primary-700">\${(congress.total_senators || 0).toLocaleString()}</div>
                            <div class="text-xs text-gray-600 mt-1">Members</div>
                          </div>
                          <div class="bg-white rounded-lg p-3 border border-primary-100">
                            <div class="text-2xl font-bold text-primary-700">\${(congress.total_senate_bills || 0).toLocaleString()}</div>
                            <div class="text-xs text-gray-600 mt-1">Bills Filed</div>
                          </div>
                        </div>
                      </div>

                      <!-- House (Right) -->
                      <div class="bg-success-50/30 p-4">
                        <div class="flex items-center gap-2 mb-3">
                          <div class="w-1 h-5 bg-success-600 rounded"></div>
                          <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide">House</h4>
                        </div>
                        <div class="space-y-2">
                          <div class="bg-white rounded-lg p-3 border border-success-100">
                            <div class="text-2xl font-bold text-success-700">\${(congress.total_representatives || 0).toLocaleString()}</div>
                            <div class="text-xs text-gray-600 mt-1">Members</div>
                          </div>
                          <div class="bg-white rounded-lg p-3 border border-success-100">
                            <div class="text-2xl font-bold text-success-700">\${(congress.total_house_bills || 0).toLocaleString()}</div>
                            <div class="text-xs text-gray-600 mt-1">Bills Filed</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Footer -->
                    <div class="p-4 bg-gray-50 border-t border-gray-200">
                      <span class="text-sm text-primary-600 font-medium">
                        View all members →
                      </span>
                    </div>
                  </a>
                \`;
              }).join('')}
            </div>
          \`;
        } catch (error) {
          console.error('Error loading congresses:', error);
          document.getElementById('congressesContent').innerHTML = \`
            <div class="text-center py-12">
              <p class="text-red-600">Error loading congresses. Please try again later.</p>
            </div>
          \`;
        }
      })();
    </script>
  `;

  return c.html(PageLayout({ title: "Philippine Congresses - Open Congress API", children: content }));
});
