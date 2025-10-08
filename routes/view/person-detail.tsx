import { Hono } from "hono";
import { html } from "hono/html";
import { PageLayout } from "@/components/Layout.tsx";

export const viewPersonDetailRouter = new Hono();

viewPersonDetailRouter.get("/view/people/:id", async (c) => {
  const personId = c.req.param("id");

  const content = html`
    <div class="container mx-auto px-4 py-8">
      <div id="loadingState" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-4 text-gray-600">Loading person...</p>
      </div>

      <div id="errorState" class="hidden">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg class="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Person Not Found</h2>
          <p class="text-gray-600 mb-4">The person you're looking for doesn't exist or has been removed.</p>
          <a href="/view/people" class="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
            Back to People
          </a>
        </div>
      </div>

      <div id="contentState" class="hidden">
        <!-- Breadcrumb -->
        <nav class="mb-6 text-sm">
          <ol class="flex items-center space-x-2 text-gray-600">
            <li><a href="/" class="hover:text-primary-600">Home</a></li>
            <li><span class="mx-2">/</span></li>
            <li><a href="/view/people" class="hover:text-primary-600">People</a></li>
            <li><span class="mx-2">/</span></li>
            <li class="text-gray-900" id="breadcrumbName">Loading...</li>
          </ol>
        </nav>

        <!-- Person Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 id="personName" class="text-3xl font-bold text-gray-900 mb-6"></h1>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">First Name</dt>
              <dd id="firstName" class="mt-1 text-sm text-gray-900">—</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Middle Name</dt>
              <dd id="middleName" class="mt-1 text-sm text-gray-900">—</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Last Name</dt>
              <dd id="lastName" class="mt-1 text-sm text-gray-900">—</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Name Suffix</dt>
              <dd id="nameSuffix" class="mt-1 text-sm text-gray-900">—</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Aliases</dt>
              <dd id="aliases" class="mt-1 text-sm text-gray-900">—</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Professional Designations</dt>
              <dd id="professionalDesignations" class="mt-1 text-sm text-gray-900">—</dd>
            </div>
          </div>
        </div>

        <!-- Congresses Served -->
        <div id="congressesSection" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Congresses Served</h2>
          <div id="congressesList" class="flex flex-wrap gap-2">
            <p class="text-gray-500">Loading congresses...</p>
          </div>
        </div>

        <!-- Authored Documents -->
        <div id="documentsSection" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Authored Documents</h2>
          <div id="documentsContent">
            <p class="text-gray-500">Loading documents...</p>
          </div>
        </div>

        <!-- Groups/Memberships -->
        <div id="groupsSection" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Group Memberships</h2>
          <div id="groupsList">
            <p class="text-gray-500">Loading groups...</p>
          </div>
        </div>

        <!-- Links Section -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Links & Resources</h2>
          <div class="flex flex-wrap gap-3" id="linksList">
            <button
              id="copyIdBtn"
              onclick="navigator.clipboard.writeText('${personId}').then(() => { const btn = document.getElementById('copyIdBtn'); const originalText = btn.textContent; btn.textContent = 'Copied!'; btn.classList.add('bg-success-100', 'text-success-700', 'border-success-300'); setTimeout(() => { btn.textContent = originalText; btn.classList.remove('bg-success-100', 'text-success-700', 'border-success-300'); }, 1500); })"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              Copy ID
            </button>
            <a
              href="/api/people/${personId}"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
              View API Response
            </a>
            <a
              id="sourceLink"
              href="https://github.com/bettergovph/open-congress-data/blob/main/data/person/${personId}.toml"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
              </svg>
              View Source Data
            </a>
          </div>
        </div>

        <!-- Data Accuracy Warning -->
        <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <div>
              <h3 class="text-sm font-medium text-yellow-800">Data Accuracy Note</h3>
              <p class="mt-1 text-sm text-yellow-700">The data displayed here is manually encoded and may contain inaccuracies. We strive for accuracy but human error is possible. If you discover incorrect information, please help improve the data by submitting corrections to the <a href="https://github.com/bettergovph/open-congress-data/issues" target="_blank" rel="noopener noreferrer" class="underline font-medium hover:text-yellow-800">open-congress-data repository</a>.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      (async function() {
        const personId = '${personId}';

        try {
          // Fetch person details with congresses
          const response = await fetch(\`/api/people/\${personId}?include_congresses=true\`);
          const result = await response.json();

          if (!result.success || !result.data) {
            document.getElementById('loadingState').classList.add('hidden');
            document.getElementById('errorState').classList.remove('hidden');
            return;
          }

          const person = result.data;

          // Build full name
          const nameParts = [];
          if (person.first_name) nameParts.push(person.first_name);

          // Add aliases in double quotes after first name
          if (person.aliases && person.aliases.length > 0) {
            const aliasStr = Array.isArray(person.aliases) ? person.aliases.join('/') : person.aliases;
            nameParts.push(\`"\${aliasStr}"\`);
          }

          if (person.middle_name) nameParts.push(person.middle_name);
          if (person.last_name) nameParts.push(person.last_name);
          if (person.name_suffix) nameParts.push(person.name_suffix);
          const fullName = nameParts.join(' ') || 'Unknown Person';

          // Update breadcrumb (use same format as header with aliases)
          document.getElementById('breadcrumbName').textContent = fullName;

          // Update header
          document.getElementById('personName').textContent = fullName;

          // Aliases - show as text
          const aliasesEl = document.getElementById('aliases');
          if (person.aliases && person.aliases.length > 0) {
            aliasesEl.textContent = person.aliases.join(', ');
            aliasesEl.className = 'mt-1 text-sm text-gray-900';
          } else {
            aliasesEl.textContent = '—';
            aliasesEl.className = 'mt-1 text-sm text-gray-400';
          }

          // Professional designations - show as text
          const professionalDesignations = document.getElementById('professionalDesignations');
          if (person.professional_designations && person.professional_designations.length > 0) {
            professionalDesignations.textContent = person.professional_designations.join(', ');
            professionalDesignations.className = 'mt-1 text-sm text-gray-900';
          } else {
            professionalDesignations.textContent = '—';
            professionalDesignations.className = 'mt-1 text-sm text-gray-400';
          }

          // Update metadata
          document.getElementById('firstName').textContent = person.first_name || '—';
          document.getElementById('firstName').className = 'mt-1 text-sm ' + (person.first_name ? 'text-gray-900' : 'text-gray-400');

          document.getElementById('middleName').textContent = person.middle_name || '—';
          document.getElementById('middleName').className = 'mt-1 text-sm ' + (person.middle_name ? 'text-gray-900' : 'text-gray-400');

          document.getElementById('lastName').textContent = person.last_name || '—';
          document.getElementById('lastName').className = 'mt-1 text-sm ' + (person.last_name ? 'text-gray-900' : 'text-gray-400');

          document.getElementById('nameSuffix').textContent = person.name_suffix || '—';
          document.getElementById('nameSuffix').className = 'mt-1 text-sm ' + (person.name_suffix ? 'text-gray-900' : 'text-gray-400');

          // Congresses served
          const congressesList = document.getElementById('congressesList');
          if (person.congresses_served && person.congresses_served.length > 0) {
            congressesList.innerHTML = person.congresses_served.map(congress => {
              const isSenator = congress.position?.toLowerCase() === 'senator';
              const positionColor = isSenator ? 'bg-primary-100 text-primary-800' : 'bg-success-100 text-success-800';
              const positionLabel = isSenator ? 'S' : 'R';
              const positionName = isSenator ? 'Senate' : 'House of Representatives';
              return \`
                <span class="inline-block px-3 py-1.5 text-sm rounded-md \${positionColor} font-medium"
                      title="\${positionName} - \${congress.congress_ordinal} Congress">
                  \${congress.congress_number}\${positionLabel}
                </span>
              \`;
            }).join('');
          } else {
            congressesList.innerHTML = '<p class="text-gray-500">No congress memberships found</p>';
          }

          // Fetch authored documents
          const docsResponse = await fetch(\`/api/people/\${personId}/documents?limit=10\`);
          const docsResult = await docsResponse.json();

          const documentsContent = document.getElementById('documentsContent');
          if (docsResult.success && docsResult.data && docsResult.data.length > 0) {
            documentsContent.innerHTML = \`
              <div class="space-y-2">
                \${docsResult.data.map(doc => {
                  const typeColor = doc.subtype === 'HB' ? 'bg-success-100 text-success-800' : 'bg-primary-100 text-primary-800';
                  return \`
                    <a href="/view/documents/\${doc.id}" class="block p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-gray-50 transition-all">
                      <div class="flex items-start gap-3">
                        <div class="flex flex-col gap-1">
                          <span class="inline-block px-2 py-1 text-xs rounded-md font-mono font-medium \${typeColor}">
                            \${doc.name || doc.bill_number}
                          </span>
                          \${doc.congress ? \`<span class="inline-block px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 font-medium text-center">\${doc.congress}</span>\` : ''}
                        </div>
                        <div class="flex-1">
                          <div class="text-sm font-medium text-gray-900">\${doc.title || doc.congress_website_title || 'Untitled'}</div>
                          \${(doc.long_title || doc.congress_website_abstract) ? \`<div class="text-xs text-gray-600 mt-1 line-clamp-2">\${doc.long_title || doc.congress_website_abstract}</div>\` : ''}
                          \${doc.date_filed ? \`<div class="text-xs text-gray-500 mt-1">Filed: \${doc.date_filed}</div>\` : ''}
                        </div>
                      </div>
                    </a>
                  \`;
                }).join('')}
              </div>
              \${docsResult.pagination && docsResult.pagination.total > 10 ? \`
                <div class="mt-4 text-center">
                  <a href="/view/documents?author_id=\${personId}" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    View all \${docsResult.pagination.total} documents →
                  </a>
                </div>
              \` : ''}
            \`;
          } else {
            documentsContent.innerHTML = '<p class="text-gray-500">No authored documents found</p>';
          }

          // Fetch groups
          const groupsResponse = await fetch(\`/api/people/\${personId}/groups\`);
          const groupsResult = await groupsResponse.json();

          const groupsList = document.getElementById('groupsList');
          if (groupsResult.success && groupsResult.data && groupsResult.data.length > 0) {
            groupsList.innerHTML = \`
              <div class="space-y-2">
                \${groupsResult.data.map(group => \`
                  <div class="p-3 border border-gray-200 rounded-lg">
                    <div class="font-medium text-gray-900">\${group.name || 'Unnamed Group'}</div>
                    \${group.type ? \`<div class="text-xs text-gray-500 mt-1">Type: \${group.type}</div>\` : ''}
                  </div>
                \`).join('')}
              </div>
            \`;
          } else {
            groupsList.innerHTML = '<p class="text-gray-500">No group memberships found</p>';
          }

          // Show content
          document.getElementById('loadingState').classList.add('hidden');
          document.getElementById('contentState').classList.remove('hidden');

        } catch (error) {
          console.error('Error loading person:', error);
          document.getElementById('loadingState').classList.add('hidden');
          document.getElementById('errorState').classList.remove('hidden');
        }
      })();
    </script>
  `;

  return c.html(PageLayout({ title: "Person Details", children: content }));
});
