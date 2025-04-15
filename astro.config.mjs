import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import cloudflare from '@astrojs/cloudflare';
import image from '@astrojs/image';

// https://astro.build/config
export default defineConfig({
  site: 'https://chakrirchain.com',
  output: 'server', // Enable SSR for personalized content
  adapter: cloudflare({
    // Cloudflare Pages specific options
    mode: 'directory', // 'directory' is recommended for most projects
    functionPerRoute: true, // Creates a separate Worker for each route for better performance
    imageService: 'cloudflare', // Use Cloudflare's image optimization service
    runtime: {
      mode: process.env.NODE_ENV === 'production' ? 'off' : 'local', // Use 'local' for development, 'off' for production
      persistTo: '.cloudflare/wrangler-local-state', // Directory to persist local state
    },
    // Optimize for production performance
    routes: [
      {
        pattern: '^/assets/.*', // Static assets
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      },
      {
        pattern: '^/api/.*', // API routes
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    ],
  }),
  integrations: [
    tailwind(),
    preact(),
    image({
      serviceEntryPoint: '@astrojs/image/sharp',
      cacheDir: './.astro/image',
      logLevel: 'info',
    }),
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