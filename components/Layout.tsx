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
    <footer class="bg-white border-t border-gray-200">
      <div class="container mx-auto px-4 py-6">
        <div class="text-center text-sm text-gray-600">
          <p>Part of the <a href="https://bettergov.ph" class="text-primary-500 hover:text-primary-600 font-medium">BetterGov.ph</a> initiative</p>
          <p class="mt-2">Data from <a href="https://github.com/bettergovph/open-congress-data" class="text-primary-500 hover:text-primary-600 font-medium" target="_blank" rel="noopener noreferrer">Open Congress Data</a></p>
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
