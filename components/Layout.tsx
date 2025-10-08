import { html } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";

export const Header = () => {
  return html`
    <header class="bg-white border-b border-gray-200">
      <div class="container mx-auto px-4 py-4">
        <a href="/" class="inline-block hover:opacity-80 transition-opacity">
          <h1 class="text-2xl font-bold text-gray-900">Open Congress API</h1>
        </a>
        <p class="text-sm text-gray-600 mt-1">Access Philippine legislative data through a modern REST API</p>
      </div>
    </header>
  `;
};

export const Footer = () => {
  return html`
    <footer class="bg-gray-900 text-white">
      <div class="container mx-auto px-4 pt-12 pb-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- About Section -->
          <div>
            <h3 class="text-lg font-semibold mb-4">Open Congress API</h3>
            <p class="text-gray-400 text-sm mb-4">
              A modern REST API for Philippine legislative data. Access bills, senators, and representatives through our comprehensive API.
            </p>
            <p class="text-gray-400 text-sm">
              Part of the <a href="https://bettergov.ph" class="text-white hover:text-gray-300 font-medium transition-colors">BetterGov.ph</a> initiative.
            </p>
          </div>

          <!-- Links Section with 2 sub-columns -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 md:text-right">
            <!-- Quick Links -->
            <div>
              <h3 class="text-lg font-semibold mb-4">Quick Links</h3>
              <ul class="space-y-2">
                <li><a class="text-gray-400 hover:text-white text-sm transition-colors" href="/api/scalar">API Documentation</a></li>
                <li><a class="text-gray-400 hover:text-white text-sm transition-colors" href="/view/congresses">Browse Congresses</a></li>
                <li><a class="text-gray-400 hover:text-white text-sm transition-colors" href="/view/documents">Browse Documents</a></li>
                <li><a class="text-gray-400 hover:text-white text-sm transition-colors" href="/view/people">Browse People</a></li>
                <li><a class="text-gray-400 hover:text-white text-sm transition-colors" href="/api/stats">Statistics</a></li>
              </ul>
            </div>

            <!-- Resources -->
            <div>
              <h3 class="text-lg font-semibold mb-4">Resources</h3>
              <ul class="space-y-2">
                <li><a class="text-gray-400 hover:text-white text-sm transition-colors" href="https://github.com/bettergovph/open-congress-api" target="_blank" rel="noopener noreferrer">API Repository</a></li>
                <li><a class="text-gray-400 hover:text-white text-sm transition-colors" href="https://github.com/bettergovph/open-congress-data" target="_blank" rel="noopener noreferrer">Data Repository</a></li>
                <li><a class="text-gray-400 hover:text-white text-sm transition-colors" href="https://bettergov.ph" target="_blank" rel="noopener noreferrer">BetterGov.ph Portal</a></li>
                <li><a class="text-gray-400 hover:text-white text-sm transition-colors" href="https://bettergov.ph/discord" target="_blank" rel="noopener noreferrer">Join Discord</a></li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Bottom Section -->
        <div class="border-t border-gray-800 mt-8 pt-8">
          <div class="flex flex-col md:flex-row justify-between items-center">
            <p class="text-gray-400 text-sm mb-4 md:mb-0">
              2025 Open Congress API - All data is public domain unless otherwise specified.
            </p>
            <div class="flex space-x-6">
              <a class="text-gray-400 hover:text-white text-sm transition-colors" href="https://github.com/bettergovph/open-congress-api" target="_blank" rel="noopener noreferrer">Contribute on GitHub</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `;
};

export const TailwindConfig = () => {
  return html`
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: {
                50: '#e6f0fd',
                100: '#cce0fb',
                200: '#99c2f7',
                300: '#66a3f3',
                400: '#3385ef',
                500: '#0066eb',
                600: '#0052bc',
                700: '#003d8d',
                800: '#00295e',
                900: '#00142f',
              },
              secondary: {
                50: '#ffede6',
                100: '#ffdbcc',
                200: '#ffb799',
                300: '#ff9466',
                400: '#ff7033',
                500: '#ff4d00',
                600: '#cc3e00',
                700: '#992e00',
                800: '#661f00',
                900: '#330f00',
              },
              success: {
                50: '#e6f7ef',
                100: '#ccefdf',
                200: '#99dfbf',
                300: '#66cf9f',
                400: '#33bf7f',
                500: '#00af5f',
                600: '#008c4c',
                700: '#006939',
                800: '#004626',
                900: '#002313',
              },
            }
          }
        }
      }
    </script>
  `;
};

interface PageLayoutProps {
  title: string;
  children: HtmlEscapedString | Promise<HtmlEscapedString>;
}

export const PageLayout = ({ title, children }: PageLayoutProps) => {
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${TailwindConfig()}
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex flex-col">
    ${Header()}
    <main class="flex-grow">
      ${children}
    </main>
    ${Footer()}
  </div>
</body>
</html>`;
};
