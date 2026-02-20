import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
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
