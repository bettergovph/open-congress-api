import { Hono } from "hono";
import { html } from "hono/html";
import { PageLayout } from "@/components/Layout.tsx";

export const viewPeopleRouter = new Hono();

viewPeopleRouter.get("/view/people", (c) => {
  const content = html`
    <div class="container mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <nav class="mb-6 text-sm">
        <ol class="flex items-center space-x-2 text-gray-600">
          <li><a href="/" class="hover:text-primary-600">Home</a></li>
          <li><span class="mx-2">/</span></li>
          <li class="text-gray-900">People</li>
        </ol>
      </nav>

      <!-- Filters Section -->
      <div class="bg-white rounded-lg shadow-xs border border-gray-200 p-4 md:p-6 mb-6">
        <div class="space-y-4">
          <!-- Search and Filter Controls -->
          <div class="flex gap-4 flex-wrap">
            <input
              type="text"
              id="searchInput"
              placeholder="Search by name or alias..."
              class="px-4 py-2 border border-gray-300 rounded-md flex-1 min-w-[300px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />

            <div class="relative">
              <select id="typeFilter" class="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">All Positions</option>
                <option value="senator">Senators</option>
                <option value="representative">Representatives</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>

            <div class="relative">
              <select id="congressFilter" class="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">All Congresses</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>

            <button
              type="button"
              id="searchButton"
              class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors shadow-xs"
            >
              Search
            </button>

            <button
              type="button"
              id="resetFilters"
              class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors shadow-xs"
            >
              Reset
            </button>
          </div>

          <!-- Results Summary -->
          <div class="text-sm text-gray-600">
            Showing: <span id="showingRange" class="font-medium">0</span> of <span id="filteredTotal" class="font-medium">0</span> results
          </div>

          <!-- Pagination Controls (Top) -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-gray-200">
            <div class="flex items-center gap-2">
              <button
                type="button"
                id="prevPage"
                disabled
                class="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span class="text-sm whitespace-nowrap">
                Page <span id="currentPage" class="font-medium">1</span> of <span id="totalPages" class="font-medium">1</span>
              </span>
              <button
                type="button"
                id="nextPage"
                disabled
                class="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm whitespace-nowrap">Items per page:</label>
              <div class="relative">
                <select id="limitSelect" class="appearance-none px-3 py-1 pr-8 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="20">20</option>
                  <option value="50" selected>50</option>
                  <option value="100">100</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
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
            <p class="mt-1 text-sm text-yellow-700">The data displayed here is manually encoded and may contain inaccuracies. We strive for accuracy but human error is possible. If you discover incorrect information, please help improve the data by submitting corrections to the <a href="https://github.com/bettergovph/open-congress-data/issues" target="_blank" rel="noopener noreferrer" class="underline font-medium hover:text-yellow-800">open-congress-data repository</a>. Your contributions help maintain data quality for everyone.</p>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-100">
              <tr>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors" data-sort="first_name">
                  <div class="flex items-center justify-between">
                    <span>First Name</span>
                    <span class="sort-icon text-gray-400">⇅</span>
                  </div>
                </th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors" data-sort="middle_name">
                  <div class="flex items-center justify-between">
                    <span>Middle Name</span>
                    <span class="sort-icon text-gray-400">⇅</span>
                  </div>
                </th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors" data-sort="last_name">
                  <div class="flex items-center justify-between">
                    <span>Last Name</span>
                    <span class="sort-icon text-gray-400">⇅</span>
                  </div>
                </th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors" data-sort="name_suffix">
                  <div class="flex items-center justify-between">
                    <span>Name Suffix</span>
                    <span class="sort-icon text-gray-400">⇅</span>
                  </div>
                </th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Aliases
                </th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Congresses Served
                </th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Links
                </th>
              </tr>
            </thead>
            <tbody id="peopleTableBody" class="bg-white divide-y divide-gray-200">
              <tr>
                <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                  Click "Search" to load people
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination Controls (Bottom) -->
      <div class="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            id="prevPageBottom"
            disabled
            class="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span class="text-sm whitespace-nowrap">
            Page <span id="currentPageBottom" class="font-medium">1</span> of <span id="totalPagesBottom" class="font-medium">1</span>
          </span>
          <button
            type="button"
            id="nextPageBottom"
            disabled
            class="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <label class="whitespace-nowrap">Jump to page:</label>
          <input
            type="number"
            id="pageJump"
            min="1"
            value="1"
            class="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="button"
            id="goToPage"
            class="px-3 py-1 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            Go
          </button>
        </div>
      </div>

      <!-- Usage Information -->
      <div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <div>
            <h3 class="text-sm font-medium text-primary-800">How to use this page</h3>
            <ul class="mt-1 text-sm text-primary-700 list-disc list-inside space-y-1">
              <li>Set your filters and click "Search" to load people from the database</li>
              <li>Use pagination controls to navigate through results</li>
              <li>Search by name or known aliases</li>
              <li>Filter by position (Senator/Representative) or Congress</li>
              <li>For API access, see the <a href="/api/scalar" class="underline font-medium hover:text-primary-800" target="_blank" rel="noopener noreferrer">API documentation</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>

  <script>
    (function() {
      let currentOffset = 0;
      let currentLimit = 50;
      let currentTotal = 0;
      let currentSort = 'last_name';
      let currentDir = 'asc';

      const searchInput = document.getElementById('searchInput');
      const typeFilter = document.getElementById('typeFilter');
      const congressFilter = document.getElementById('congressFilter');
      const limitSelect = document.getElementById('limitSelect');
      const searchButton = document.getElementById('searchButton');
      const resetButton = document.getElementById('resetFilters');
      const tbody = document.getElementById('peopleTableBody');

      // Pagination elements
      const prevPage = document.getElementById('prevPage');
      const nextPage = document.getElementById('nextPage');
      const prevPageBottom = document.getElementById('prevPageBottom');
      const nextPageBottom = document.getElementById('nextPageBottom');
      const currentPageEl = document.getElementById('currentPage');
      const totalPagesEl = document.getElementById('totalPages');
      const currentPageBottomEl = document.getElementById('currentPageBottom');
      const totalPagesBottomEl = document.getElementById('totalPagesBottom');
      const pageJump = document.getElementById('pageJump');
      const goToPage = document.getElementById('goToPage');

      // Get initial values from URL
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('search')) searchInput.value = urlParams.get('search');
      if (urlParams.get('type')) typeFilter.value = urlParams.get('type');
      if (urlParams.get('congress')) congressFilter.value = urlParams.get('congress');
      if (urlParams.get('limit')) {
        currentLimit = parseInt(urlParams.get('limit'));
        limitSelect.value = currentLimit;
      }
      if (urlParams.get('offset')) {
        currentOffset = parseInt(urlParams.get('offset'));
      }
      if (urlParams.get('sort')) {
        currentSort = urlParams.get('sort');
      }
      if (urlParams.get('dir')) {
        currentDir = urlParams.get('dir');
      }

      // Load congress options
      async function loadCongressOptions() {
        try {
          const response = await fetch('/api/congresses');
          const data = await response.json();
          if (data.success && data.data) {
            data.data.forEach(congress => {
              const option = document.createElement('option');
              option.value = congress.congress_number;
              option.textContent = \`Congress \${congress.congress_number}\`;
              congressFilter.appendChild(option);
            });
          }
        } catch (error) {
          console.error('Error loading congress options:', error);
        }
      }

      function updateURL() {
        const params = new URLSearchParams();
        if (searchInput.value) params.set('search', searchInput.value);
        if (typeFilter.value) params.set('type', typeFilter.value);
        if (congressFilter.value) params.set('congress', congressFilter.value);
        params.set('limit', currentLimit);
        if (currentOffset > 0) params.set('offset', currentOffset);
        params.set('sort', currentSort);
        params.set('dir', currentDir);

        const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newURL);
      }

      async function loadPeople() {
        // Build API URL
        const params = new URLSearchParams();
        if (searchInput.value) params.set('search', searchInput.value);
        if (typeFilter.value) params.set('type', typeFilter.value);
        if (congressFilter.value) params.set('congress', congressFilter.value);
        params.set('limit', currentLimit);
        params.set('offset', currentOffset);
        params.set('sort', currentSort);
        params.set('dir', currentDir);

        tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">Loading...</td></tr>';

        try {
          const response = await fetch('/api/people?' + params.toString());
          const data = await response.json();

          if (data.success) {
            currentTotal = data.pagination.total;
            renderPeople(data.data);
            updatePagination(data.pagination);
            updateURL();
          } else {
            tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-red-600">Error loading people</td></tr>';
          }
        } catch (error) {
          console.error('Error:', error);
          tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-red-600">Error loading people</td></tr>';
        }
      }

      async function fetchPersonCongresses(personId) {
        try {
          const response = await fetch(\`/api/people/\${personId}?include_congresses=true\`);
          const data = await response.json();
          if (data.success && data.data) {
            return data.data;
          }
          return null;
        } catch (error) {
          console.error('Error fetching person details:', error);
          return null;
        }
      }

      async function renderPeople(people) {
        if (people.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">No people found</td></tr>';
          return;
        }

        // Fetch detailed info for each person to get congress data
        const peopleWithDetails = await Promise.all(
          people.map(async person => {
            const details = await fetchPersonCongresses(person.id);
            return { ...person, details };
          })
        );

        tbody.innerHTML = peopleWithDetails.map(person => {
          // Get congresses served from the detailed data
          let congressesServed = [];
          if (person.details && person.details.congresses_served) {
            congressesServed = person.details.congresses_served;
          }

          return \`
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3">
                <a href="/view/people/\${person.id}" class="text-sm \${person.first_name ? 'text-gray-900 hover:text-primary-600' : 'text-gray-400'} transition-colors">\${person.first_name || '—'}</a>
              </td>
              <td class="px-4 py-3">
                <a href="/view/people/\${person.id}" class="text-sm \${person.middle_name ? 'text-gray-900 hover:text-primary-600' : 'text-gray-400'} transition-colors">\${person.middle_name || '—'}</a>
              </td>
              <td class="px-4 py-3">
                <a href="/view/people/\${person.id}" class="text-sm \${person.last_name ? 'text-gray-900 hover:text-primary-600' : 'text-gray-400'} transition-colors font-medium">\${person.last_name || '—'}</a>
              </td>
              <td class="px-4 py-3">
                <div class="text-sm \${person.name_suffix ? 'text-gray-900' : 'text-gray-400'}">\${person.name_suffix || '—'}</div>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  \${person.aliases && person.aliases.length > 0 ?
                    person.aliases.map(alias => \`
                      <span class="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-md">
                        \${alias}
                      </span>
                    \`).join('') :
                    '<span class="text-sm text-gray-400">—</span>'}
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  \${person.professional_designations && person.professional_designations.length > 0 ?
                    person.professional_designations.map(desig => \`
                      <span class="inline-block px-2 py-0.5 text-xs bg-primary-100 text-primary-800 rounded-md">
                        \${desig}
                      </span>
                    \`).join('') :
                    '<span class="text-sm text-gray-400">—</span>'}
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  \${congressesServed && congressesServed.length > 0 ?
                    congressesServed.map(congress => {
                      const isSenator = congress.position?.toLowerCase() === 'senator';
                      const positionColor = isSenator
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-success-100 text-success-800';
                      const positionLabel = isSenator ? 'S' : 'R';
                      const positionName = isSenator ? 'Senate' : 'House of Representatives';
                      return \`
                        <span class="inline-block px-2 py-0.5 text-xs rounded-md \${positionColor}" title="\${positionName} - \${congress.congress_ordinal} Congress">
                          \${congress.congress_number}\${positionLabel}
                        </span>
                      \`;
                    }).join('') :
                    '<span class="text-sm text-gray-400">—</span>'}
                </div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex gap-2 flex-wrap items-center">
                  <button
                    onclick="navigator.clipboard.writeText('\${person.id}').then(() => { const btn = event.target; const originalText = btn.textContent; btn.textContent = 'Copied!'; btn.classList.remove('text-primary-500', 'hover:text-primary-600'); btn.classList.add('text-success-600'); setTimeout(() => { btn.textContent = originalText; btn.classList.remove('text-success-600'); btn.classList.add('text-primary-500', 'hover:text-primary-600'); }, 1500); })"
                    class="text-primary-500 hover:text-primary-600 hover:underline text-xs font-medium cursor-pointer bg-transparent border-none p-0"
                    title="Copy ID"
                  >
                    Copy ID
                  </button>
                  <a
                    href="/api/people/\${person.id}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary-500 hover:text-primary-600 hover:underline text-xs font-medium"
                  >
                    API
                  </a>
                  <a
                    href="https://github.com/bettergovph/open-congress-data/blob/main/data/person/\${person.id}.toml"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary-500 hover:text-primary-600 hover:underline text-xs font-medium"
                  >
                    Source
                  </a>
                </div>
              </td>
            </tr>
          \`;
        }).join('');
      }

      function updatePagination(pagination) {
        const currentPage = Math.floor(currentOffset / currentLimit) + 1;
        const totalPages = Math.ceil(pagination.total / currentLimit);

        // Update display counts
        const startItem = pagination.total > 0 ? currentOffset + 1 : 0;
        const endItem = Math.min(currentOffset + currentLimit, pagination.total);
        const rangeText = pagination.total > 0 ? \`\${startItem}-\${endItem}\` : '0';
        document.getElementById('showingRange').textContent = rangeText;
        document.getElementById('filteredTotal').textContent = pagination.total.toLocaleString();

        // Update page numbers
        currentPageEl.textContent = currentPage.toLocaleString();
        totalPagesEl.textContent = totalPages.toLocaleString();
        currentPageBottomEl.textContent = currentPage.toLocaleString();
        totalPagesBottomEl.textContent = totalPages.toLocaleString();
        pageJump.value = currentPage;
        pageJump.max = totalPages;

        // Enable/disable pagination buttons
        prevPage.disabled = currentPage === 1;
        nextPage.disabled = !pagination.has_more;
        prevPageBottom.disabled = currentPage === 1;
        nextPageBottom.disabled = !pagination.has_more;
      }

      // Event listeners
      searchButton.addEventListener('click', () => {
        currentOffset = 0;
        loadPeople();
      });

      resetButton.addEventListener('click', () => {
        searchInput.value = '';
        typeFilter.value = '';
        congressFilter.value = '';
        currentOffset = 0;
        currentSort = 'last_name';
        currentDir = 'asc';
        loadPeople();
      });

      limitSelect.addEventListener('change', () => {
        currentLimit = parseInt(limitSelect.value);
        currentOffset = 0;
        loadPeople();
      });

      prevPage.addEventListener('click', () => {
        if (currentOffset >= currentLimit) {
          currentOffset -= currentLimit;
          loadPeople();
        }
      });

      nextPage.addEventListener('click', () => {
        currentOffset += currentLimit;
        loadPeople();
      });

      prevPageBottom.addEventListener('click', () => {
        if (currentOffset >= currentLimit) {
          currentOffset -= currentLimit;
          loadPeople();
        }
      });

      nextPageBottom.addEventListener('click', () => {
        currentOffset += currentLimit;
        loadPeople();
      });

      goToPage.addEventListener('click', () => {
        const targetPage = parseInt(pageJump.value);
        const totalPages = Math.ceil(currentTotal / currentLimit);
        if (targetPage >= 1 && targetPage <= totalPages) {
          currentOffset = (targetPage - 1) * currentLimit;
          loadPeople();
        }
      });

      // Enter key in search input
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          currentOffset = 0;
          loadPeople();
        }
      });

      // Add sorting click handlers
      document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
          const sortField = th.dataset.sort;
          if (currentSort === sortField) {
            // Toggle direction if clicking the same column
            currentDir = currentDir === 'asc' ? 'desc' : 'asc';
          } else {
            // New column, default to ascending
            currentSort = sortField;
            currentDir = 'asc';
          }

          // Update sort icons
          document.querySelectorAll('.sort-icon').forEach(icon => {
            icon.textContent = '⇅';
            icon.classList.add('text-gray-400');
            icon.classList.remove('text-primary-600');
          });

          const icon = th.querySelector('.sort-icon');
          if (icon) {
            icon.textContent = currentDir === 'asc' ? '↑' : '↓';
            icon.classList.remove('text-gray-400');
            icon.classList.add('text-primary-600');
          }

          currentOffset = 0;
          loadPeople();
        });
      });

      // Update sort icon on initial load
      const initialSortHeader = document.querySelector(\`th[data-sort="\${currentSort}"]\`);
      if (initialSortHeader) {
        const icon = initialSortHeader.querySelector('.sort-icon');
        if (icon) {
          icon.textContent = currentDir === 'asc' ? '↑' : '↓';
          icon.classList.remove('text-gray-400');
          icon.classList.add('text-primary-600');
        }
      }

      // Initialize on page load
      loadCongressOptions();
      loadPeople();
    })();
  </script>`;

  return c.html(PageLayout({ title: "Open Congress API", children: content }));
});
