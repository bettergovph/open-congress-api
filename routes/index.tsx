import { define } from "../utils.ts";

export default define.page(function Home() {
  return (
    <div class="px-4 py-8 mx-auto min-h-screen">
      <h1 class="text-4xl font-bold mb-8">Open Congress API</h1>
      <p class="mb-4">Welcome to the Philippine Congress API</p>

      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-semibold mb-3">Reports</h2>
          <ul class="list-disc list-inside space-y-1">
            <li>
              <a href="/reports/people" class="text-blue-600 hover:underline">
                People Report
              </a> - Interactive table of all people with filtering and GitHub links
            </li>
            <li>
              <a href="/reports/bills" class="text-blue-600 hover:underline">
                Bills Report
              </a> - Interactive table of all bills with search, filtering, and pagination
            </li>
          </ul>
        </div>

        <div>
          <h2 class="text-2xl font-semibold mb-3">API Endpoints</h2>
          <ul class="list-disc list-inside space-y-1">
            <li><code>/api/congresses</code> - List all congresses</li>
            <li><code>/api/congresses/[id]</code> - Get congress details</li>
            <li><code>/api/congresses/[id]/senators</code> - Get senators in a congress</li>
            <li><code>/api/congresses/[id]/representatives</code> - Get representatives in a congress</li>
            <li><code>/api/congresses/[id]/committees</code> - Get committees in a congress</li>
            <li><code>/api/congresses/[id]/bills</code> - Get bills filed in a congress</li>
            <li><code>/api/people</code> - List all people</li>
            <li><code>/api/people/[id]</code> - Get person details</li>
            <li><code>/api/people/[id]/congresses</code> - Get congress history for a person</li>
            <li><code>/api/people/[id]/bills</code> - Get bills authored by a person</li>
            <li><code>/api/bills</code> - List all bills with filtering</li>
            <li><code>/api/bills/[id]</code> - Get bill details</li>
            <li><code>/api/bills/[id]/authors</code> - Get authors of a bill</li>
            <li><code>/api/stats</code> - Get database statistics</li>
          </ul>
        </div>
      </div>
    </div>
  );
});
