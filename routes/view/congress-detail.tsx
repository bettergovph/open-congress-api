import { OpenAPIHono } from "@hono/zod-openapi";
import { PageLayout } from "@/components/Layout.tsx";
import { html } from "hono/html";

export const viewCongressDetailRouter = new OpenAPIHono();

viewCongressDetailRouter.get("/view/congresses/:congressNumber", async (c) => {
  const congressNumber = c.req.param("congressNumber");

  const content = html`
    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <!-- Breadcrumb -->
      <nav class="mb-6" aria-label="Breadcrumb">
        <ol class="flex items-center space-x-2 text-sm text-gray-600">
          <li><a href="/" class="hover:text-primary-600">Home</a></li>
          <li><span class="mx-2">/</span></li>
          <li><a href="/view/congresses" class="hover:text-primary-600">Congresses</a></li>
          <li><span class="mx-2">/</span></li>
          <li class="text-gray-900 font-medium" id="breadcrumb-congress">Loading...</li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="mb-8" id="congressHeader">
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>

      <!-- Content -->
      <div id="congressContent">
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p class="mt-4 text-gray-600">Loading congress members...</p>
        </div>
      </div>
    </div>

    <script>
      (async function loadCongressDetail() {
        const congressNumber = '${congressNumber}';

        try {
          // Fetch congress details and members in parallel
          const [congressResponse, senatorsResponse, representativesResponse] = await Promise.all([
            fetch(\`/api/congresses/\${congressNumber}\`),
            fetch(\`/api/people?congress=\${congressNumber}&type=senator&limit=100&include_congresses=true\`),
            fetch(\`/api/people?congress=\${congressNumber}&type=representative&limit=500&include_congresses=true\`)
          ]);

          const congressResult = await congressResponse.json();
          const senatorsResult = await senatorsResponse.json();
          const representativesResult = await representativesResponse.json();

          if (!congressResult.success || !congressResult.data) {
            throw new Error('Failed to load congress details');
          }

          const congress = congressResult.data;
          const senators = senatorsResult.success ? senatorsResult.data : [];
          const representatives = representativesResult.success ? representativesResult.data : [];

          // Update breadcrumb
          document.getElementById('breadcrumb-congress').textContent = \`\${congress.ordinal} Congress\`;

          // Update header
          document.getElementById('congressHeader').innerHTML = \`
            <div class="flex items-start justify-between">
              <div>
                <h2 class="text-3xl font-bold text-gray-900">\${congress.ordinal} Congress</h2>
                <p class="text-gray-600 mt-2">\${congress.year_range}</p>
              </div>
              <span class="inline-flex items-center px-4 py-2 rounded-lg text-lg font-semibold bg-primary-50 text-primary-700">
                #\${congress.congress_number}
              </span>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div class="bg-primary-50 rounded-lg p-4">
                <div class="text-2xl font-bold text-primary-700">\${senators.length}</div>
                <div class="text-sm text-gray-600 mt-1">Senators</div>
              </div>
              <div class="bg-success-50 rounded-lg p-4">
                <div class="text-2xl font-bold text-success-700">\${representatives.length}</div>
                <div class="text-sm text-gray-600 mt-1">Representatives</div>
              </div>
              <div class="bg-secondary-50 rounded-lg p-4">
                <div class="text-2xl font-bold text-secondary-700">\${senators.length + representatives.length}</div>
                <div class="text-sm text-gray-600 mt-1">Total Members</div>
              </div>
              <div class="bg-gray-100 rounded-lg p-4">
                <div class="text-2xl font-bold text-gray-700">\${congress.total_committees || 0}</div>
                <div class="text-sm text-gray-600 mt-1">Committees</div>
              </div>
            </div>
          \`;

          // Helper function to format name
          const formatName = (person) => {
            const parts = [];
            if (person.first_name) parts.push(person.first_name);

            // Add aliases in double quotes after first name with line break
            if (person.aliases && person.aliases.length > 0) {
              const aliasStr = Array.isArray(person.aliases) ? person.aliases.join('/') : person.aliases;
              parts.push(\`<br>"\${aliasStr}"\`);
            }

            if (person.middle_name) parts.push(\`<br>\${person.middle_name}\`);
            if (person.last_name) parts.push(person.last_name);
            if (person.name_suffix) parts.push(person.name_suffix);
            return parts.join(' ');
          };

          // Helper function to get initials
          const getInitials = (person) => {
            const first = person.first_name ? person.first_name[0] : '';
            const last = person.last_name ? person.last_name[0] : '';
            return (first + last).toUpperCase() || '?';
          };

          // Helper function to create person card
          const createPersonCard = (person, type) => {
            const name = formatName(person);
            const initials = getInitials(person);
            const bgColor = type === 'senator' ? 'bg-primary-600' : 'bg-success-600';
            const hoverBorder = type === 'senator' ? 'hover:border-primary-400' : 'hover:border-success-400';

            return \`
              <a href="/view/people/\${person.id}"
                 class="block bg-white rounded-lg border-2 border-gray-200 \${hoverBorder} p-4 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                <div class="flex flex-col items-center text-center">
                  <div class="\${bgColor} text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold mb-3">
                    \${initials}
                  </div>
                  <div class="font-semibold text-gray-900 text-sm leading-tight break-words w-full">
                    \${name}
                  </div>
                  \${person.professional_designations ? \`
                    <p class="text-xs text-gray-500 mt-1 break-words">\${person.professional_designations}</p>
                  \` : ''}
                </div>
              </a>
            \`;
          };

          // Render content
          document.getElementById('congressContent').innerHTML = \`
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Senators Section -->
              <div class="bg-primary-50/30 rounded-lg p-6">
                <div class="flex items-center mb-6">
                  <div class="bg-primary-600 w-1 h-8 mr-3 rounded"></div>
                  <h3 class="text-2xl font-bold text-gray-900">Senate</h3>
                  <span class="ml-auto bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    \${senators.length}
                  </span>
                </div>

                \${senators.length > 0 ? \`
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    \${senators.map(senator => createPersonCard(senator, 'senator')).join('')}
                  </div>
                \` : \`
                  <p class="text-gray-500 text-center py-8">No senators found</p>
                \`}
              </div>

              <!-- Representatives Section -->
              <div class="bg-success-50/30 rounded-lg p-6">
                <div class="flex items-center mb-6">
                  <div class="bg-success-600 w-1 h-8 mr-3 rounded"></div>
                  <h3 class="text-2xl font-bold text-gray-900">House of Representatives</h3>
                  <span class="ml-auto bg-success-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    \${representatives.length}
                  </span>
                </div>

                \${representatives.length > 0 ? \`
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    \${representatives.map(rep => createPersonCard(rep, 'representative')).join('')}
                  </div>
                \` : \`
                  <p class="text-gray-500 text-center py-8">No representatives found</p>
                \`}
              </div>
            </div>

            <!-- Additional Links Section -->
            <div class="mt-8 bg-white rounded-lg border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Explore More</h3>
              <div class="flex flex-wrap gap-3">
                <a href="/view/documents?congress=\${congress.congress_number}"
                   class="inline-flex items-center px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  View All Documents
                </a>
                <a href="/api/congresses/\${congress.congress_number}"
                   class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                  </svg>
                  API Data
                </a>
              </div>
            </div>
          \`;
        } catch (error) {
          console.error('Error loading congress detail:', error);
          document.getElementById('congressHeader').innerHTML = \`
            <h2 class="text-3xl font-bold text-gray-900">Error Loading Congress</h2>
            <p class="text-red-600 mt-2">Failed to load congress details. Please try again later.</p>
          \`;
          document.getElementById('congressContent').innerHTML = '';
        }
      })();
    </script>
  `;

  return c.html(PageLayout({ title: `Congress ${congressNumber} - Open Congress API`, children: content }));
});
