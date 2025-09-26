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
            <li><code>/api/people</code> - List all people</li>
            <li><code>/api/people/[id]</code> - Get person details</li>
            <li><code>/api/people/[id]/congresses</code> - Get congress history for a person</li>
          </ul>
        </div>
      </div>
    </div>
  );
});
