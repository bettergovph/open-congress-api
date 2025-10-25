import { Hono } from "hono";
import { html } from "hono/html";
import { PageLayout } from "@/components/Layout.tsx";

export const viewDocumentDetailRouter = new Hono();

viewDocumentDetailRouter.get("/view/documents/:id", async (c) => {
  const documentId = c.req.param("id");

  const content = html`
    <div class="container mx-auto px-4 py-8">
      <div id="loadingState" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-4 text-gray-600">Loading document...</p>
      </div>

      <div id="errorState" class="hidden">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg class="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h2>
          <p class="text-gray-600 mb-4">The document you're looking for doesn't exist or has been removed.</p>
          <a href="/view/documents" class="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
            Back to Documents
          </a>
        </div>
      </div>

      <div id="contentState" class="hidden">
        <!-- Breadcrumb -->
        <nav class="mb-6 text-sm">
          <ol class="flex items-center space-x-2 text-gray-600">
            <li><a href="/" class="hover:text-primary-600">Home</a></li>
            <li><span class="mx-2">/</span></li>
            <li><a href="/view/documents" class="hover:text-primary-600">Documents</a></li>
            <li><span class="mx-2">/</span></li>
            <li class="text-gray-900" id="breadcrumbName">Loading...</li>
          </ol>
        </nav>

        <!-- Document Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-3">
                <span id="billBadge" class="inline-block px-3 py-1 text-sm rounded-md font-mono font-semibold"></span>
                <span id="congressBadge" class="inline-block px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700"></span>
                <span id="scopeBadge" class="hidden inline-block px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700"></span>
              </div>
              <h1 id="documentTitle" class="text-3xl font-bold text-gray-900 mb-2"></h1>
              <p id="documentLongTitle" class="text-gray-600 text-lg hidden"></p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <dt class="text-sm font-medium text-gray-500">Date Filed</dt>
              <dd id="dateFiled" class="mt-1 text-sm text-gray-900">—</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Scope</dt>
              <dd id="scope" class="mt-1 text-sm text-gray-900">—</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Number of Authors</dt>
              <dd id="authorsCount" class="mt-1 text-sm text-gray-900">—</dd>
            </div>
          </div>
        </div>

        <!-- Abstract/Description -->
        <div id="abstractSection" class="hidden bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">Abstract</h2>
          <div id="abstractContent" class="prose prose-sm max-w-none text-gray-700"></div>
        </div>

        <!-- Authors Section -->
        <div id="authorsSection" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Authors</h2>
          <div id="authorsList" class="flex flex-wrap gap-2">
            <p class="text-gray-500">Loading authors...</p>
          </div>
        </div>

        <!-- Subjects Section -->
        <div id="subjectsSection" class="hidden bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Subjects</h2>
          <div id="subjectsList" class="flex flex-wrap gap-2"></div>
        </div>

        <!-- Links Section -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Links & Resources</h2>
          <div class="flex flex-wrap gap-3" id="linksList">
            <button
              id="copyIdBtn"
              onclick="navigator.clipboard.writeText('${documentId}').then(() => { const btn = document.getElementById('copyIdBtn'); const originalText = btn.textContent; btn.textContent = 'Copied!'; btn.classList.add('bg-success-100', 'text-success-700', 'border-success-300'); setTimeout(() => { btn.textContent = originalText; btn.classList.remove('bg-success-100', 'text-success-700', 'border-success-300'); }, 1500); })"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              Copy ID
            </button>
            <a
              href="/api/documents/${documentId}"
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
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              class="hidden inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
              </svg>
              View Source Data
            </a>
            <a
              id="senateLink"
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              class="hidden inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
              Senate Website
            </a>
            <a
              id="congressLink"
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              class="hidden inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
              Congress Website
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
        const documentId = '${documentId}';

        try {
          const response = await fetch(\`/api/documents/\${documentId}\`);
          const result = await response.json();

          if (!result.success || !result.data) {
            document.getElementById('loadingState').classList.add('hidden');
            document.getElementById('errorState').classList.remove('hidden');
            return;
          }

          const doc = result.data;

          // Update breadcrumb
          document.getElementById('breadcrumbName').textContent = doc.name || doc.bill_number || 'Document';

          // Update header
          const billBadge = document.getElementById('billBadge');
          billBadge.textContent = doc.name || doc.bill_number || 'Unknown';
          billBadge.className = 'inline-block px-3 py-1 text-sm rounded-md font-mono font-semibold ' +
            (doc.subtype === 'HB' ? 'bg-success-100 text-success-800' : 'bg-primary-100 text-primary-800');

          document.getElementById('congressBadge').textContent = \`\${doc.congress}th Congress\`;

          if (doc.scope) {
            const scopeBadge = document.getElementById('scopeBadge');
            scopeBadge.textContent = doc.scope;
            scopeBadge.classList.remove('hidden');
          }

          document.getElementById('documentTitle').textContent = doc.title || doc.congress_website_title || 'Untitled';

          if (doc.long_title) {
            const longTitle = document.getElementById('documentLongTitle');
            longTitle.textContent = doc.long_title;
            longTitle.classList.remove('hidden');
          }

          // Update metadata
          document.getElementById('dateFiled').textContent = doc.date_filed || '—';
          document.getElementById('scope').textContent = doc.scope || '—';

          // Fetch authors
          const authorsResponse = await fetch(\`/api/documents/\${documentId}/authors\`);
          const authorsResult = await authorsResponse.json();

          if (authorsResult.success && authorsResult.data) {
            const authors = authorsResult.data;
            document.getElementById('authorsCount').textContent = authors.length;

            const authorsList = document.getElementById('authorsList');
            if (authors.length > 0) {
              authorsList.innerHTML = authors.map(author => {
                const parts = [];
                if (author.first_name) parts.push(author.first_name);
                if (author.aliases && author.aliases.length > 0) parts.push('"' + author.aliases[0] + '"');
                if (author.middle_name) parts.push(author.middle_name);
                if (author.last_name) parts.push(author.last_name);
                if (author.name_suffix) parts.push(author.name_suffix);

                const displayName = parts.join(' ');
                return \`
                  <a href="/view/people/\${author.id}"
                     class="inline-block px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                    \${displayName}
                  </a>
                \`;
              }).join('');
            } else {
              authorsList.innerHTML = '<p class="text-gray-500">No authors listed</p>';
            }
          }

          // Update abstract
          if (doc.congress_website_abstract) {
            document.getElementById('abstractSection').classList.remove('hidden');
            document.getElementById('abstractContent').textContent = doc.congress_website_abstract;
          }

          // Update subjects
          if (doc.subjects && doc.subjects.length > 0) {
            document.getElementById('subjectsSection').classList.remove('hidden');
            document.getElementById('subjectsList').innerHTML = doc.subjects.map(subject =>
              \`<span class="inline-block px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md">\${subject}</span>\`
            ).join('');
          }

          // Update links
          if (doc.subtype && doc.congress) {
            const sourceLink = document.getElementById('sourceLink');
            sourceLink.href = \`https://github.com/bettergovph/open-congress-data/blob/main/data/document/\${doc.subtype.toLowerCase()}/\${doc.congress}/\${documentId}.toml\`;
            sourceLink.classList.remove('hidden');
          }

          if (doc.senate_website_permalink) {
            const senateLink = document.getElementById('senateLink');
            senateLink.href = doc.senate_website_permalink;
            senateLink.classList.remove('hidden');
          }

          // Add PDF source links
          if (doc.download_url_sources && doc.download_url_sources.length > 0) {
            const linksList = document.getElementById('linksList');
            doc.download_url_sources.forEach((url, index) => {
              const pdfLink = document.createElement('a');
              pdfLink.href = url;
              pdfLink.target = '_blank';
              pdfLink.rel = 'noopener noreferrer';
              pdfLink.className = 'inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors';
              pdfLink.innerHTML = \`
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                PDF Source\${doc.download_url_sources.length > 1 ? \` \${index + 1}\` : ''}
              \`;
              linksList.appendChild(pdfLink);
            });
          }

          // Show content
          document.getElementById('loadingState').classList.add('hidden');
          document.getElementById('contentState').classList.remove('hidden');

        } catch (error) {
          console.error('Error loading document:', error);
          document.getElementById('loadingState').classList.add('hidden');
          document.getElementById('errorState').classList.remove('hidden');
        }
      })();
    </script>
  `;

  return c.html(PageLayout({ title: "Document Details", children: content }));
});
