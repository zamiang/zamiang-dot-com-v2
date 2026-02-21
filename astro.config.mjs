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
  },
});
