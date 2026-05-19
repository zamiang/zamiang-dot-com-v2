import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  env: {
    schema: {
      NOTION_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      NOTION_DATA_SOURCE_ID: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      NOTION_PHOTOS_DATA_SOURCE_ID: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      SITE_URL: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
        default: 'https://www.zamiang.com',
      }),
    },
  },

  site: 'https://www.zamiang.com',
  output: 'static',

  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/api/'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    css: {
      // Disable PostCSS config loading - Tailwind v4 uses Vite plugin instead
      postcss: {},
    },
  },

  redirects: {
    '/post/debugging-a-live-saturn-v': '/writing/debugging-a-live-saturn-v',
  },

  // Image optimization
  image: {
    domains: ['www.zamiang.com'],
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },

  // Security (Astro 6)
  security: {
    checkOrigin: true,
    // CSP is emitted as a <meta http-equiv> tag. Astro auto-generates SHA-256
    // hashes for every inline <script>/<style> it ships (island bootstrap,
    // hydration shim, etc.), so we don't need 'unsafe-inline' for scripts.
    // The matching Content-Security-Policy line in public/_headers has been
    // removed — if both header and meta CSP are set, browsers intersect them
    // and the header's missing hashes would still block hydration.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://static.cloudflareinsights.com",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://cloudflareinsights.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: {
        resources: ["'self'", 'https://static.cloudflareinsights.com'],
      },
      styleDirective: {
        // 'unsafe-inline' covers React-emitted <style> tags and inline
        // style="..." attributes that Astro's hasher doesn't see.
        resources: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      },
    },
  },
});
