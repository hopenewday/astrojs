/**
 * Facebook Instant Articles Feed Generator API Endpoint
 * 
 * This endpoint generates an RSS feed compatible with Facebook Instant Articles,
 * including references to AMP versions of content.
 * This helps distribute content across platforms while maintaining AMP references.
 */

import type { APIRoute } from 'astro';
import { generateFacebookInstantArticlesFeed } from '../../utils/ampSitemapGenerator';
import { transformToAmpHtml } from '../../utils/ampUtils';

export const GET: APIRoute = async ({ site }) => {
  // In a real application, this would fetch data from a CMS or database
  // For demo purposes, we'll use static data
  
  // Get all articles
  const articles = [
    {
      slug: 'future-of-ai-2023',
      title: 'The Future of Artificial Intelligence in 2023',
      description: 'Exploring the latest advancements in AI and what they mean for society, business, and everyday life.',
      content: `
        <h2>Introduction to AI in 2023</h2>
        <p>Artificial Intelligence has evolved dramatically over the past decade, but 2023 marks a pivotal moment in its development. With the emergence of more sophisticated large language models and multimodal AI systems, we're witnessing capabilities that were once confined to science fiction.</p>
        
        <p>The integration of AI into everyday applications has accelerated, creating both unprecedented opportunities and complex challenges for society. From healthcare diagnostics to creative content generation, AI is reshaping industries and redefining human-computer interaction.</p>
      `,
      publishDate: new Date('2023-06-15').toISOString(),
      modifiedDate: new Date('2023-06-20').toISOString(),
      author: {
        name: 'Alex Johnson',
        url: new URL('/author/alex-johnson', site).toString(),
      },
      image: new URL('/images/tech/ai-future.jpg', site).toString(),
    },
    // Additional articles would be defined here
  ];
  
  // Process articles for the feed
  const entries = articles.map(article => ({
    url: new URL(`/article/${article.slug}`, site).toString(),
    title: article.title,
    description: article.description,
    publishDate: article.publishDate,
    modifiedDate: article.modifiedDate,
    author: article.author,
    content: transformToAmpHtml(article.content), // Ensure content is AMP-compatible
    image: article.image,
  }));
  
  // Site information
  const siteInfo = {
    title: 'ChakrirChain',
    description: 'A modern magazine-style publication built with Astro.js',
    language: 'en',
    url: new URL('/', site).toString(),
  };
  
  // Generate the Facebook Instant Articles feed
  const feed = generateFacebookInstantArticlesFeed(entries, siteInfo);
  
  // Return the feed with appropriate headers
  return new Response(feed, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};