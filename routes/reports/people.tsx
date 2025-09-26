import { define } from "@/utils.ts";
import { runQuery } from "@/lib/neo4j.ts";
import type { Person } from "@/lib/types.ts";

export const handler = define.handlers({
  async GET(_ctx) {
    // Fetch all people with their congress history
    const query = `
      MATCH (p:Person)
      OPTIONAL MATCH (p)-[r:SERVED_IN]->(c:Congress)
      WITH p, COLLECT(DISTINCT {
        congress_id: c.id,
        congress_number: c.congress_number,
        congress_ordinal: c.ordinal,
        position: r.position,
        year_range: c.year_range
      }) as congresses_served
      RETURN DISTINCT
             p.id as id,
             p.first_name as first_name,
             p.last_name as last_name,
             p.middle_name as middle_name,
             p.name_prefix as name_prefix,
             p.name_suffix as name_suffix,
             p.first_name + ' ' +
               CASE WHEN p.middle_name IS NOT NULL THEN p.middle_name + ' ' ELSE '' END +
               p.last_name +
               CASE WHEN p.name_suffix IS NOT NULL THEN ' ' + p.name_suffix ELSE '' END as full_name,
             p.professional_designations as professional_designations,
             p.senate_website_keys as senate_website_keys,
             p.congress_website_primary_keys as congress_website_primary_keys,
             p.congress_website_author_keys as congress_website_author_keys,
             p.aliases as aliases,
             congresses_served
      ORDER BY p.last_name, p.first_name
    `;

    const people = (await runQuery(query) as unknown) as Person[];

    return { data: { people } };
  },
});

export default define.page<{ people: Person[] }>(function PeopleReportPage({ data }) {
  const people = data.people;
  return (
    <>
      <div class="px-4 py-8 mx-auto">
        <h1 class="text-3xl font-bold mb-6">People Report</h1>

        <div class="mb-6 space-y-4">
          <div class="flex gap-4 flex-wrap">
            <input
              type="text"
              id="searchInput"
              placeholder="Search by name, alias, or ID..."
              class="px-4 py-2 border rounded-lg flex-1 min-w-[300px]"
            />

            <div class="relative">
              <select id="positionFilter" class="appearance-none px-4 py-2 pr-10 border rounded-lg bg-white">
                <option value="">All Positions</option>
                <option value="senator">Senators</option>
                <option value="representative">Representatives</option>
                <option value="none">No Position</option>
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
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>

            <button
              type="button"
              id="resetFilters"
              class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Reset
            </button>
          </div>

          <div class="text-sm text-gray-600">
            Total: <span id="totalCount">{people.length}</span> people
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse border border-gray-300">
            <thead class="bg-gray-100">
              <tr>
                <th class="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-200" data-sort="id">
                  <div class="flex items-center justify-between">
                    <span>ID</span>
                    <svg class="sort-indicator w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 10l5-5 5 5H7zM7 10l5 5 5-5H7z" opacity="0.5"/>
                    </svg>
                  </div>
                </th>
                <th class="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-200" data-sort="last_name">
                  <div class="flex items-center justify-between">
                    <span>Last Name</span>
                    <svg class="sort-indicator w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 10l5-5 5 5H7zM7 10l5 5 5-5H7z" opacity="0.5"/>
                    </svg>
                  </div>
                </th>
                <th class="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-200" data-sort="first_name">
                  <div class="flex items-center justify-between">
                    <span>First Name</span>
                    <svg class="sort-indicator w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 10l5-5 5 5H7zM7 10l5 5 5-5H7z" opacity="0.5"/>
                    </svg>
                  </div>
                </th>
                <th class="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-200" data-sort="middle_name">
                  <div class="flex items-center justify-between">
                    <span>Middle Name</span>
                    <svg class="sort-indicator w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 10l5-5 5 5H7zM7 10l5 5 5-5H7z" opacity="0.5"/>
                    </svg>
                  </div>
                </th>
                <th class="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-200" data-sort="name_suffix">
                  <div class="flex items-center justify-between">
                    <span>Suffix</span>
                    <svg class="sort-indicator w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 10l5-5 5 5H7zM7 10l5 5 5-5H7z" opacity="0.5"/>
                    </svg>
                  </div>
                </th>
                <th class="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-200" data-sort="positions">
                  <div class="flex items-center justify-between">
                    <span>Positions</span>
                    <svg class="sort-indicator w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 10l5-5 5 5H7zM7 10l5 5 5-5H7z" opacity="0.5"/>
                    </svg>
                  </div>
                </th>
                <th class="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-200" data-sort="congresses">
                  <div class="flex items-center justify-between">
                    <span>Congresses</span>
                    <svg class="sort-indicator w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 10l5-5 5 5H7zM7 10l5 5 5-5H7z" opacity="0.5"/>
                    </svg>
                  </div>
                </th>
                <th class="border border-gray-300 px-4 py-2 text-left cursor-pointer hover:bg-gray-200" data-sort="aliases">
                  <div class="flex items-center justify-between">
                    <span>Aliases</span>
                    <svg class="sort-indicator w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 10l5-5 5 5H7zM7 10l5 5 5-5H7z" opacity="0.5"/>
                    </svg>
                  </div>
                </th>
                <th class="border border-gray-300 px-4 py-2 text-left">
                  Missing Data
                </th>
              </tr>
            </thead>
            <tbody id="peopleTableBody">
              {people.map((person: Person) => {
                interface CongressServed {
                  congress_id?: string;
                  congress_number?: number;
                  congress_ordinal?: string;
                  position?: string;
                  year_range?: string;
                }
                const positions = new Set(person.congresses_served?.map((c: CongressServed) => c.position).filter(Boolean));
                const congressNumbers = person.congresses_served?.map((c: CongressServed) => c.congress_number).filter(Boolean).sort((a, b) => (b || 0) - (a || 0)) || [];
                const missingFields = [];

                if (!person.middle_name || person.middle_name.length === 1) missingFields.push("Middle");
                if (!person.congresses_served || person.congresses_served.length === 0) missingFields.push("Congress");

                return (
                  <tr class="hover:bg-gray-50 person-row" data-person={JSON.stringify(person)}>
                    <td class="border border-gray-300 px-4 py-2">
                      <a
                        href={`https://github.com/bettergovph/open-congress-data/blob/main/data/person/${person.id}.toml`}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-blue-600 hover:underline font-mono text-sm"
                      >
                        {person.id}
                      </a>
                    </td>
                    <td class="border border-gray-300 px-4 py-2">
                      {person.last_name || ""}
                    </td>
                    <td class="border border-gray-300 px-4 py-2">
                      {person.first_name || ""}
                    </td>
                    <td class="border border-gray-300 px-4 py-2">
                      {person.middle_name || ""}
                    </td>
                    <td class="border border-gray-300 px-4 py-2">
                      {person.name_suffix || ""}
                    </td>
                    <td class="border border-gray-300 px-4 py-2">
                      {positions.size > 0 ? (
                        <div class="flex gap-1 flex-wrap">
                          {Array.from(positions).map((pos) => (
                            <span class={`inline-block px-2 py-1 text-xs rounded ${
                              pos === 'senator' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {String(pos)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span class="text-gray-400 italic">none</span>
                      )}
                    </td>
                    <td class="border border-gray-300 px-4 py-2">
                      {congressNumbers.length > 0 ? (
                        <span class="text-sm">
                          {congressNumbers.join(", ")}
                        </span>
                      ) : (
                        <span class="text-gray-400 italic">none</span>
                      )}
                    </td>
                    <td class="border border-gray-300 px-4 py-2">
                      {person.aliases && person.aliases.length > 0 ? (
                        <span class="text-sm">
                          {person.aliases.join(", ")}
                        </span>
                      ) : null}
                    </td>
                    <td class="border border-gray-300 px-4 py-2">
                      {missingFields.length > 0 ? (
                        <div class="flex gap-1 flex-wrap">
                          {missingFields.map(field => (
                            <span class="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                              {field}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <div>
              <h3 class="text-sm font-medium text-yellow-800">Data Accuracy Note</h3>
              <p class="mt-1 text-sm text-yellow-700">
                The data displayed here is manually encoded and may contain inaccuracies. We strive for accuracy but human error is possible.
                If you discover incorrect information, please help improve the data by submitting corrections to the{" "}
                <a href="https://github.com/bettergovph/open-congress-data/issues" target="_blank" rel="noopener noreferrer" class="underline font-medium">
                  open-congress-data repository
                </a>.
                Your contributions help maintain data quality for everyone.
              </p>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
        (function() {
          const allPeople = ${JSON.stringify(people)};
          let filteredPeople = [...allPeople];
          let currentSort = { field: null, direction: 'asc' };

          // Populate congress filter
          const congressNumbers = new Set();
          allPeople.forEach(person => {
            if (person.congresses_served) {
              person.congresses_served.forEach(c => {
                if (c.congress_number) congressNumbers.add(c.congress_number);
              });
            }
          });

          const congressFilter = document.getElementById('congressFilter');
          Array.from(congressNumbers).sort((a, b) => b - a).forEach(num => {
            const option = document.createElement('option');
            option.value = num;
            option.textContent = 'Congress ' + num;
            congressFilter.appendChild(option);
          });

          function renderTable() {
            const tbody = document.getElementById('peopleTableBody');
            const totalCount = document.getElementById('totalCount');

            totalCount.textContent = filteredPeople.length;

            tbody.innerHTML = filteredPeople.map(person => {
              const positions = new Set(person.congresses_served?.map(c => c.position).filter(Boolean));
              const congressNumbers = person.congresses_served?.map(c => c.congress_number).filter(Boolean).sort((a, b) => b - a) || [];
              const missingFields = [];

              if (!person.middle_name || person.middle_name.length === 1) missingFields.push("Middle");
              if (!person.congresses_served || person.congresses_served.length === 0) missingFields.push("Congress");

              return \`
                <tr class="hover:bg-gray-50 person-row">
                  <td class="border border-gray-300 px-4 py-2">
                    <a
                      href="https://github.com/bettergovph/open-congress-data/blob/main/data/person/\${person.id}.toml"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-blue-600 hover:underline font-mono text-sm"
                    >
                      \${person.id}
                    </a>
                  </td>
                  <td class="border border-gray-300 px-4 py-2">
                    \${person.last_name}
                  </td>
                  <td class="border border-gray-300 px-4 py-2">
                    \${person.first_name}
                  </td>
                  <td class="border border-gray-300 px-4 py-2">
                    \${person.middle_name || ''}
                  </td>
                  <td class="border border-gray-300 px-4 py-2">
                    \${person.name_suffix || ''}
                  </td>
                  <td class="border border-gray-300 px-4 py-2">
                    \${positions.size > 0 ?
                      '<div class="flex gap-1 flex-wrap">' +
                      Array.from(positions).map(pos =>
                        '<span class="inline-block px-2 py-1 text-xs rounded ' +
                        (pos === 'senator' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800') +
                        '">' + pos + '</span>'
                      ).join('') + '</div>'
                      : '<span class="text-gray-400 italic">none</span>'}
                  </td>
                  <td class="border border-gray-300 px-4 py-2">
                    \${congressNumbers.length > 0 ?
                      '<span class="text-sm">' + congressNumbers.join(", ") + '</span>'
                      : '<span class="text-gray-400 italic">none</span>'}
                  </td>
                  <td class="border border-gray-300 px-4 py-2">
                    \${person.aliases && person.aliases.length > 0 ?
                      '<span class="text-sm">' + (person.aliases || []).join(", ") + '</span>'
                      : ''}
                  </td>
                  <td class="border border-gray-300 px-4 py-2">
                    \${missingFields.length > 0 ?
                      '<div class="flex gap-1 flex-wrap">' +
                      missingFields.map(field =>
                        '<span class="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded">' +
                        field + '</span>'
                      ).join('') + '</div>'
                      : ''}
                  </td>
                </tr>
              \`;
            }).join('');
          }

          function applyFilters() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const positionFilter = document.getElementById('positionFilter').value;
            const congressFilter = document.getElementById('congressFilter').value;

            filteredPeople = allPeople.filter(person => {
              // Search filter
              if (searchTerm) {
                const searchMatch =
                  person.id.toLowerCase().includes(searchTerm) ||
                  person.first_name?.toLowerCase().includes(searchTerm) ||
                  person.last_name?.toLowerCase().includes(searchTerm) ||
                  person.middle_name?.toLowerCase().includes(searchTerm) ||
                  person.full_name?.toLowerCase().includes(searchTerm) ||
                  (person.aliases && person.aliases.some(a => a.toLowerCase().includes(searchTerm)));

                if (!searchMatch) return false;
              }

              // Position filter
              if (positionFilter) {
                if (positionFilter === 'none') {
                  if (person.congresses_served && person.congresses_served.length > 0) return false;
                } else {
                  const hasPosition = person.congresses_served?.some(c => c.position === positionFilter);
                  if (!hasPosition) return false;
                }
              }

              // Congress filter
              if (congressFilter) {
                const inCongress = person.congresses_served?.some(c => c.congress_number == congressFilter);
                if (!inCongress) return false;
              }

              return true;
            });

            // Apply current sort
            if (currentSort.field) {
              sortTable(currentSort.field, currentSort.direction);
            } else {
              renderTable();
            }
          }

          function sortTable(field, direction = null) {
            if (direction === null) {
              direction = currentSort.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc';
            }

            currentSort = { field, direction };

            filteredPeople.sort((a, b) => {
              let aVal, bVal;

              // Special handling for complex columns
              if (field === 'positions') {
                const aPositions = a.congresses_served?.map(c => c.position).filter(Boolean) || [];
                const bPositions = b.congresses_served?.map(c => c.position).filter(Boolean) || [];
                aVal = aPositions.join(',');
                bVal = bPositions.join(',');
              } else if (field === 'congresses') {
                const aCongress = a.congresses_served?.map(c => c.congress_number).filter(Boolean) || [];
                const bCongress = b.congresses_served?.map(c => c.congress_number).filter(Boolean) || [];
                aVal = Math.max(...aCongress, 0);
                bVal = Math.max(...bCongress, 0);
              } else if (field === 'aliases') {
                aVal = (a.aliases?.length || 0);
                bVal = (b.aliases?.length || 0);
              } else {
                aVal = a[field] || '';
                bVal = b[field] || '';
              }

              if (typeof aVal === 'string') aVal = aVal.toLowerCase();
              if (typeof bVal === 'string') bVal = bVal.toLowerCase();

              if (aVal < bVal) return direction === 'asc' ? -1 : 1;
              if (aVal > bVal) return direction === 'asc' ? 1 : -1;
              return 0;
            });

            // Update sort indicators
            document.querySelectorAll('.sort-indicator').forEach(el => {
              el.innerHTML = '<path d=\"M7 10l5-5 5 5H7zM7 10l5 5 5-5H7z\" opacity=\"0.5\"/>';
            });

            const header = document.querySelector('[data-sort="' + field + '"] .sort-indicator');
            if (header) {
              if (direction === 'asc') {
                header.innerHTML = '<path d=\"M10 3L5 8h10L10 3z\" />';
              } else {
                header.innerHTML = '<path d=\"M10 17l5-5H5l5 5z\" />';
              }
            }

            renderTable();
          }

          // Event listeners
          document.getElementById('searchInput').addEventListener('input', applyFilters);
          document.getElementById('positionFilter').addEventListener('change', applyFilters);
          document.getElementById('congressFilter').addEventListener('change', applyFilters);

          document.getElementById('resetFilters').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            document.getElementById('positionFilter').value = '';
            document.getElementById('congressFilter').value = '';
            filteredPeople = [...allPeople];
            currentSort = { field: null, direction: 'asc' };
            document.querySelectorAll('.sort-indicator').forEach(el => {
              el.innerHTML = '<path d=\"M7 10l5-5 5 5H7zM7 10l5 5 5-5H7z\" opacity=\"0.5\"/>';
            });
            renderTable();
          });

          // Sort headers
          document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
              sortTable(th.dataset.sort);
            });
          });
        })();
        `
      }} />
    </>
  );
});