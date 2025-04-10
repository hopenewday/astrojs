import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://chakrirchain.com',
  output: 'server', // Enable SSR for personalized content
  integrations: [
    tailwind(),
    react(),
    sitemap({
      changefreq: 'weekly',
      lastmod: new Date(),
      priority: 0.7,
      serialize: (item) => {
        // Customize priority based on path
        if (item.url === 'https://chakrirchain.com/') {
          return { ...item, priority: 1.0 };
        }
        if (item.url.includes('/category/')) {
          return { ...item, priority: 0.8 };
        }
        return item;
      },
    }),
  ],
  image: {
    // Image optimization settings
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
    domains: ['ik.imagekit.io'],
    remotePatterns: [{ protocol: 'https' }],
  },
  vite: {
    // Vite configuration
    // Environment variable handling
    envPrefix: ['PUBLIC_', 'IMAGEKIT_', 'TEBI_', 'CUSDIS_', 'CLOUDFLARE_', 'UMAMI_'],
  },
});