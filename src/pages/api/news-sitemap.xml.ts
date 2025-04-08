/**
 * Google News Sitemap Generator API Endpoint
 * 
 * This endpoint generates a Google News XML sitemap for the website,
 * including references to AMP versions of content.
 * This helps Google News discover and index our news content properly.
 */

import type { APIRoute } from 'astro';
import { generateNewsSitemap } from '../../utils/ampSitemapGenerator';

export const GET: APIRoute = async ({ site }) => {
  // In a real application, this would fetch data from a CMS or database
  // For demo purposes, we'll use static data
  
  // Get all news articles (published within last 2 days for Google News)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); // Google News requires articles from last 2 weeks
  
  const articles = [
    {
      slug: 'future-of-ai-2023',
      title: 'The Future of Artificial Intelligence in 2023',
      publishDate: new Date('2023-06-15'),
      modifiedDate: new Date('2023-06-20'),
      category: 'Tech',
      keywords: ['AI', 'Machine Learning', 'Technology'],
    },
    // Additional articles would be defined here
  ].filter(article => new Date(article.publishDate) >= twoWeeksAgo);
  
  // Generate news sitemap entries
  const entries = articles.map(article => ({
    url: new URL(`/article/${article.slug}`, site).toString(),
    title: article.title,
    publicationDate: article.publishDate.toISOString(),
    publicationName: 'ChakrirChain',
    keywords: article.keywords,
    genres: ['Blog', article.category],
    lastmod: article.modifiedDate 
      ? article.modifiedDate.toISOString().split('T')[0]
      : article.publishDate.toISOString().split('T')[0],
  }));
  
  // Generate the news sitemap XML
  const sitemap = generateNewsSitemap(entries, 'ChakrirChain');
  
  // Return the sitemap with appropriate headers
  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};