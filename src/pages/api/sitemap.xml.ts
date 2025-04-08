/**
 * Sitemap Generator API Endpoint
 * 
 * This endpoint generates XML sitemaps for the website,
 * including references to AMP versions of content.
 */

import type { APIRoute } from 'astro';
import { generateSitemap } from '../../utils/ampSitemapGenerator';

export const GET: APIRoute = async ({ site }) => {
  // In a real application, this would fetch data from a CMS or database
  // For demo purposes, we'll use static data
  
  // Get all articles
  const articles = [
    {
      slug: 'future-of-ai-2023',
      title: 'The Future of Artificial Intelligence in 2023',
      publishDate: new Date('2023-06-15'),
      modifiedDate: new Date('2023-06-20'),
    },
    // Additional articles would be defined here
  ];
  
  // Generate sitemap entries
  const entries = [
    // Home page
    {
      url: new URL('/', site).toString(),
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily' as const,
      priority: 1.0,
    },
    
    // Article pages with AMP alternatives
    ...articles.map(article => ({
      url: new URL(`/article/${article.slug}`, site).toString(),
      lastmod: article.modifiedDate 
        ? article.modifiedDate.toISOString().split('T')[0]
        : article.publishDate.toISOString().split('T')[0],
      changefreq: 'weekly' as const,
      priority: 0.8,
      ampUrl: new URL(`/article/amp/${article.slug}`, site).toString(),
    })),
    
    // Category pages
    {
      url: new URL('/category/tech', site).toString(),
      changefreq: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: new URL('/category/science', site).toString(),
      changefreq: 'weekly' as const,
      priority: 0.7,
    },
    
    // Other pages
    {
      url: new URL('/about', site).toString(),
      changefreq: 'monthly' as const,
      priority: 0.5,
    },
  ];
  
  // Generate the sitemap XML
  const sitemap = generateSitemap(entries);
  
  // Return the sitemap with appropriate headers
  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};