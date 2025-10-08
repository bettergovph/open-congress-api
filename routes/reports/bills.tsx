import { define } from "@/utils.ts";
import { runQuery } from "@/lib/neo4j.ts";

export const handler = define.handlers({
  async GET(_ctx) {
    // Fetch statistics and available congresses
    const statsQuery = `
      MATCH (d:Document {type: 'bill'})
      RETURN COUNT(d) as total_bills,
             SUM(CASE WHEN d.subtype = 'HB' THEN 1 ELSE 0 END) as total_house_bills,
             SUM(CASE WHEN d.subtype = 'SB' THEN 1 ELSE 0 END) as total_senate_bills
    `;

    const congressListQuery = `
      MATCH (d:Document {type: 'bill'})
      WHERE d.congress IS NOT NULL
      RETURN DISTINCT d.congress as congress
      ORDER BY congress DESC
    `;

    const toNumber = (val: unknown) => {
      if (typeof val === 'object' && val !== null && 'low' in val) {
        return (val as { low: number }).low;
      }
      return Number(val) || 0;
    };

    const statsResult = await runQuery(statsQuery);
    const stats = statsResult[0] || { total_bills: 0, total_house_bills: 0, total_senate_bills: 0 };

    const congressListResult = await runQuery(congressListQuery);
    const allCongressNumbers = congressListResult.map((row: { congress: unknown }) =>
      toNumber(row.congress)
    ).filter((n: number) => n > 0);

    const totalBills = toNumber(stats.total_bills);
    const totalHouseBills = toNumber(stats.total_house_bills);
    const totalSenateBills = toNumber(stats.total_senate_bills);

    return {
      data: {
        stats: {
          total_bills: totalBills,
          total_house_bills: totalHouseBills,
          total_senate_bills: totalSenateBills
        },
        allCongressNumbers
      }
    };
  },
});

interface PageData {
  stats: {
    total_bills: number;
    total_house_bills: number;
    total_senate_bills: number;
  };
  allCongressNumbers: number[];
}

export default define.page<PageData>(function BillsReportPage({ data }) {
  const { stats, allCongressNumbers } = data;

  return (
    <>
      <div class="px-4 py-8 mx-auto">
        <div class="mb-4 space-y-4">
          <div class="flex gap-4 flex-wrap">
            <input
              type="text"
              id="searchInput"
              placeholder="Search by bill number, title, or author..."
              class="px-4 py-2 border rounded-lg flex-1 min-w-[300px]"
            />

            <div class="relative">
              <select id="typeFilter" class="appearance-none px-4 py-2 pr-10 border rounded-lg bg-white">
                <option value="">All Types</option>
                <option value="HB">House Bills</option>
                <option value="SB">Senate Bills</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>

            <div class="relative">
              <select id="congressFilter" class="appearance-none px-4 py-2 pr-10 border rounded-lg bg-white">
                <option value="">All Congresses</option>
                {allCongressNumbers.map(num => (
                  <option value={num}>Congress {num}</option>
                ))}
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>

            <div class="relative">
              <select id="scopeFilter" class="appearance-none px-4 py-2 pr-10 border rounded-lg bg-white">
                <option value="">All Scopes</option>
                <option value="National">National</option>
                <option value="Local">Local</option>
                <option value="Both">Both</option>
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
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>

            <button
              type="button"
              id="resetFilters"
              class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Reset
            </button>
          </div>

          <div class="text-sm text-gray-600">
            Database totals: {stats.total_bills.toLocaleString()} bills
            ({stats.total_house_bills.toLocaleString()} HB, {stats.total_senate_bills.toLocaleString()} SB) |
            Showing: <span id="showingRange">0</span> of <span id="filteredTotal">0</span> results
          </div>

          {/* Pagination controls at top */}
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <button
                type="button"
                id="prevPage"
                disabled
                class="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span class="text-sm whitespace-nowrap">
                Page <span id="currentPage">1</span> of <span id="totalPages">1</span>
              </span>
              <button
                type="button"
                id="nextPage"
                disabled
                class="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm whitespace-nowrap">Items per page:</label>
              <div class="relative">
                <select id="limitSelect" class="appearance-none px-3 py-1 pr-8 border rounded bg-white">
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

          <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
              <div>
                <h3 class="text-sm font-medium text-yellow-800">Data Accuracy Note</h3>
                <p class="mt-1 text-sm text-yellow-700">The data displayed here is manually encoded and may contain inaccuracies. We strive for accuracy but human error is possible. If you discover incorrect information, please help improve the data by submitting corrections to the <a href="https://github.com/bettergovph/open-congress-data/issues" target="_blank" rel="noopener noreferrer" class="underline font-medium">open-congress-data repository</a>. Your contributions help maintain data quality for everyone.</p>
              </div>
            </div>
          </div>

        <div class="overflow-x-auto">
          
          <table class="min-w-full border-collapse border border-gray-300">
            <thead class="bg-gray-100">
              <tr>
                <th class="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-200" data-sort="congress">
                  <div class="flex items-center justify-between">
                    <span>Congress</span>
                    <span class="sort-icon text-gray-400">⇅</span>
                  </div>
                </th>
                <th class="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-200" data-sort="bill_number">
                  <div class="flex items-center justify-between">
                    <span>Bill Number</span>
                    <span class="sort-icon text-gray-400">⇅</span>
                  </div>
                </th>
                <th class="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-200" data-sort="date_filed">
                  <div class="flex items-center justify-between">
                    <span>Date Filed</span>
                    <span class="sort-icon text-gray-400">⇅</span>
                  </div>
                </th>
                <th class="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-200" data-sort="title">
                  <div class="flex items-center justify-between">
                    <span>Title</span>
                    <span class="sort-icon text-gray-400">⇅</span>
                  </div>
                </th>
                <th class="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-200" data-sort="authors_count">
                  <div class="flex items-center justify-between">
                    <span>Authors</span>
                    <span class="sort-icon text-gray-400">⇅</span>
                  </div>
                </th>
                <th class="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-200" data-sort="scope">
                  <div class="flex items-center justify-between">
                    <span>Scope</span>
                    <span class="sort-icon text-gray-400">⇅</span>
                  </div>
                </th>
                <th class="border border-gray-300 px-4 py-2 text-left">Links</th>
              </tr>
            </thead>
            <tbody id="billsTableBody">
              <tr>
                <td colspan={7} class="border border-gray-300 px-4 py-8 text-center text-gray-500">
                  Click "Search" to load bills
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination controls at bottom */}
        <div class="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button
              type="button"
              id="prevPageBottom"
              disabled
              class="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span class="text-sm whitespace-nowrap">
              Page <span id="currentPageBottom">1</span> of <span id="totalPagesBottom">1</span>
            </span>
            <button
              type="button"
              id="nextPageBottom"
              disabled
              class="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
              defaultValue="1"
              class="w-16 px-2 py-1 border rounded"
            />
            <button
              type="button"
              id="goToPage"
              class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go
            </button>
          </div>
        </div>

        <div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <div>
              <h3 class="text-sm font-medium text-blue-800">How to use this page</h3>
              <ul class="mt-1 text-sm text-blue-700 list-disc list-inside">
                <li>Set your filters and click "Search" to load bills from the database</li>
                <li>Use pagination controls to navigate through results</li>
                <li>Most House Bills do not have filing dates in the source data</li>
                <li>For API access, see the <a href="https://github.com/bettergovph/open-congress-api/blob/main/API.md" class="underline" target="_blank" rel="noopener noreferrer">API documentation</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
        (function() {
          let currentOffset = 0;
          let currentLimit = 50;
          let currentTotal = 0;
          let currentFilters = {};
          let currentSort = 'date_filed';
          let currentDir = 'desc';

          const searchInput = document.getElementById('searchInput');
          const typeFilter = document.getElementById('typeFilter');
          const congressFilter = document.getElementById('congressFilter');
          const scopeFilter = document.getElementById('scopeFilter');
          const limitSelect = document.getElementById('limitSelect');
          const searchButton = document.getElementById('searchButton');
          const resetButton = document.getElementById('resetFilters');
          const tbody = document.getElementById('billsTableBody');

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
          if (urlParams.get('scope')) scopeFilter.value = urlParams.get('scope');
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

          function updateURL() {
            const params = new URLSearchParams();
            if (searchInput.value) params.set('search', searchInput.value);
            if (typeFilter.value) params.set('type', typeFilter.value);
            if (congressFilter.value) params.set('congress', congressFilter.value);
            if (scopeFilter.value) params.set('scope', scopeFilter.value);
            params.set('limit', currentLimit);
            if (currentOffset > 0) params.set('offset', currentOffset);
            params.set('sort', currentSort);
            params.set('dir', currentDir);

            const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
            window.history.replaceState({}, '', newURL);
          }

          async function loadBills() {
            // Build API URL
            const params = new URLSearchParams();
            if (searchInput.value) params.set('search', searchInput.value);
            if (typeFilter.value) params.set('type', typeFilter.value);
            if (congressFilter.value) params.set('congress', congressFilter.value);
            if (scopeFilter.value) params.set('scope', scopeFilter.value);
            params.set('limit', currentLimit);
            params.set('offset', currentOffset);
            params.set('sort', currentSort);
            params.set('dir', currentDir);

            tbody.innerHTML = '<tr><td colspan="7" class="border border-gray-300 px-4 py-8 text-center text-gray-500">Loading...</td></tr>';

            try {
              const response = await fetch('/api/bills?' + params.toString());
              const data = await response.json();

              if (data.success) {
                currentTotal = data.pagination.total;
                renderBills(data.data);
                updatePagination(data.pagination);
                updateURL();
              } else {
                tbody.innerHTML = '<tr><td colspan="7" class="border border-gray-300 px-4 py-8 text-center text-red-500">Error loading bills</td></tr>';
              }
            } catch (error) {
              console.error('Error:', error);
              tbody.innerHTML = '<tr><td colspan="7" class="border border-gray-300 px-4 py-8 text-center text-red-500">Error loading bills</td></tr>';
            }
          }

          function renderBills(bills) {
            if (bills.length === 0) {
              tbody.innerHTML = '<tr><td colspan="7" class="border border-gray-300 px-4 py-8 text-center text-gray-500">No bills found</td></tr>';
              return;
            }

            tbody.innerHTML = bills.map(bill => {
              const typeColor = bill.subtype === 'HB' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';

              return \`
                <tr class="hover:bg-gray-50">
                  <td class="border border-gray-300 px-4 py-2 text-center">
                    <span class="inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                      \${bill.congress || '—'}
                    </span>
                  </td>
                  <td class="border border-gray-300 px-4 py-2">
                    <span class="inline-block px-2 py-1 text-xs rounded font-mono \${typeColor}">
                      \${bill.name || bill.bill_number || '—'}
                    </span>
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-sm">
                    \${bill.date_filed || "—"}
                  </td>
                  <td class="border border-gray-300 px-4 py-2">
                    <div class="space-y-1">
                      \${(bill.title || bill.congress_website_title) ? \`<div class="text-sm font-medium">\${bill.title || bill.congress_website_title}</div>\` : ''}
                      \${(bill.long_title || bill.congress_website_abstract) ? \`<div class="text-xs text-gray-600">\${bill.long_title || bill.congress_website_abstract}</div>\` : ''}
                      \${!bill.title && !bill.long_title && !bill.congress_website_title && !bill.congress_website_abstract ? '<div class="text-sm text-gray-400">Untitled</div>' : ''}
                    </div>
                  </td>
                  <td class="border border-gray-300 px-4 py-2">
                    <div class="flex flex-wrap gap-1">
                      \${bill.authors && bill.authors.length > 0 ?
                        bill.authors.map(a => {
                          // Build the full name with aliases
                          const parts = [];
                          if (a.first_name) parts.push(a.first_name);
                          if (a.aliases && a.aliases.length > 0) {
                            parts.push('"' + a.aliases[0] + '"');
                          }
                          if (a.middle_name) parts.push(a.middle_name);
                          if (a.last_name) parts.push(a.last_name);
                          if (a.name_suffix) parts.push(a.name_suffix);

                          const displayName = parts.join(' ');
                          const hasMultipleAliases = a.aliases && a.aliases.length > 1;

                          return \`
                            <span class="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                                  \${hasMultipleAliases ? \`title="Also known as: \${a.aliases.slice(1).join(', ')}"\` : ''}>
                              \${displayName}
                            </span>
                          \`;
                        }).join('') :
                        '<span class="text-sm text-gray-400">—</span>'}
                    </div>
                  </td>
                  <td class="border border-gray-300 px-4 py-2">
                    \${bill.scope ? \`
                      <span class="inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                        \${bill.scope}
                      </span>
                    \` : '<span class="text-gray-400 text-sm">—</span>'}
                  </td>
                  <td class="border border-gray-300 px-4 py-2">
                    <div class="flex gap-2 flex-wrap">
                      <a
                        href="/api/bills/\${bill.id}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-blue-600 hover:underline text-xs"
                      >
                        API
                      </a>
                      <a
                        href="https://github.com/bettergovph/open-congress-data/blob/main/data/document/\${bill.subtype.toLowerCase()}/\${bill.congress}/\${bill.id}.toml"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-blue-600 hover:underline text-xs"
                      >
                        Source
                      </a>
                      \${bill.senate_website_permalink ? \`
                        <a
                          href="\${bill.senate_website_permalink}"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-blue-600 hover:underline text-xs"
                        >
                          Senate
                        </a>
                      \` : ''}
                      \${bill.download_url_sources && bill.download_url_sources.length > 0 ?
                        bill.download_url_sources.map((url, idx) => \`
                          <a
                            href="\${url}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-blue-600 hover:underline text-xs"
                          >
                            PDF\${bill.download_url_sources.length > 1 ? ' ' + (idx + 1) : ''}
                          </a>
                        \`).join('') : ''}
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
            loadBills();
          });

          resetButton.addEventListener('click', () => {
            searchInput.value = '';
            typeFilter.value = '';
            congressFilter.value = '';
            scopeFilter.value = '';
            currentOffset = 0;
            loadBills();
          });

          limitSelect.addEventListener('change', () => {
            currentLimit = parseInt(limitSelect.value);
            currentOffset = 0;
            loadBills();
          });

          prevPage.addEventListener('click', () => {
            if (currentOffset >= currentLimit) {
              currentOffset -= currentLimit;
              loadBills();
            }
          });

          nextPage.addEventListener('click', () => {
            currentOffset += currentLimit;
            loadBills();
          });

          prevPageBottom.addEventListener('click', () => {
            if (currentOffset >= currentLimit) {
              currentOffset -= currentLimit;
              loadBills();
            }
          });

          nextPageBottom.addEventListener('click', () => {
            currentOffset += currentLimit;
            loadBills();
          });

          goToPage.addEventListener('click', () => {
            const targetPage = parseInt(pageJump.value);
            const totalPages = Math.ceil(currentTotal / currentLimit);
            if (targetPage >= 1 && targetPage <= totalPages) {
              currentOffset = (targetPage - 1) * currentLimit;
              loadBills();
            }
          });

          // Enter key in search input
          searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              currentOffset = 0;
              loadBills();
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
                // New column, default to descending
                currentSort = sortField;
                currentDir = 'desc';
              }

              // Update sort icons
              document.querySelectorAll('.sort-icon').forEach(icon => {
                icon.textContent = '⇅';
                icon.classList.add('text-gray-400');
                icon.classList.remove('text-blue-600');
              });

              const icon = th.querySelector('.sort-icon');
              if (icon) {
                icon.textContent = currentDir === 'asc' ? '↑' : '↓';
                icon.classList.remove('text-gray-400');
                icon.classList.add('text-blue-600');
              }

              currentOffset = 0; // Reset to first page when sorting changes
              loadBills();
            });
          });

          // Update sort icon on initial load
          const initialSortHeader = document.querySelector(\`th[data-sort="\${currentSort}"]\`);
          if (initialSortHeader) {
            const icon = initialSortHeader.querySelector('.sort-icon');
            if (icon) {
              icon.textContent = currentDir === 'asc' ? '↑' : '↓';
              icon.classList.remove('text-gray-400');
              icon.classList.add('text-blue-600');
            }
          }

          // Load initial data on page load
          loadBills();
        })();
        `
      }} />
    </>
  );
});