/**
 * Google News Sitemap Generator API Endpoint
 * 
 * This endpoint generates a Google News XML sitemap for the website,
 * including references to AMP versions of content.
 * This helps Google News discover and index our news content properly.
 * 
 * Complies with Google News sitemap requirements:
 * - Articles must be published within the last 2 weeks
 * - Must include required tags: publication_name, publication_language, publication_date, title
 * - Should include optional tags: keywords, access, genres, stock_tickers
 * - Must use proper Google News category mapping
 */

import type { APIRoute } from 'astro';
import { generateNewsSitemap } from '../../utils/ampSitemapGenerator';

// Google News category mapping according to official Google News requirements
// Reference: https://support.google.com/news/publisher-center/answer/9606710
const GOOGLE_NEWS_CATEGORIES = {
  // Primary Google News categories
  'Tech': 'Technology',
  'Business': 'Business',
  'Health': 'Health',
  'Science': 'Science',
  'Sports': 'Sports',
  'Entertainment': 'Entertainment',
  'Politics': 'Politics',
  'World': 'World',
  'Nation': 'Nation',
  
  // Additional Google News categories
  'Environment': 'Environment',
  'Fashion': 'Fashion & Style',
  'Food': 'Food & Drink',
  'Travel': 'Travel',
  'Education': 'Education',
  'Culture': 'Arts & Culture',
  'Lifestyle': 'Lifestyle',
  'Opinion': 'Opinion',
  'Finance': 'Finance',
  'Economy': 'Economy',
  'Markets': 'Markets',
  'RealEstate': 'Real Estate',
  'Automotive': 'Automotive',
  'Jobs': 'Jobs',
  'Legal': 'Legal',
  'Crime': 'Crime & Justice',
  'Weather': 'Weather',
  'Disaster': 'Disasters',
  'Religion': 'Religion',
  'Military': 'Military',
  'Space': 'Space',
  'Medicine': 'Medicine',
  'Fitness': 'Fitness & Well-being'
};

// Genre mappings for Google News
const GOOGLE_NEWS_GENRES = [
  'Blog', 'PressRelease', 'Satire', 'OpEd', 'Opinion', 'UserGenerated'
];

export const GET: APIRoute = async ({ site }) => {
  // In a real application, this would fetch data from a CMS or database
  // For demo purposes, we'll use static data
  
  // Get all news articles (published within last 2 weeks for Google News)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); // Google News requires articles from last 2 weeks
  
  // Track validation errors for logging
  const validationErrors: Record<string, string[]> = {}
  
  const articles = [
    {
      slug: 'future-of-ai-2023',
      title: 'The Future of Artificial Intelligence in 2023',
      publishDate: new Date('2023-06-15'),
      modifiedDate: new Date('2023-06-20'),
      category: 'Tech',
      keywords: ['AI', 'Machine Learning', 'Technology'],
      access: 'Registration', // Optional: 'Subscription', 'Registration', or '' (free)
      stockTickers: ['GOOG', 'MSFT'], // Optional: relevant stock tickers
    },
    {
      slug: 'climate-change-impact',
      title: 'New Study Reveals Climate Change Impact on Global Agriculture',
      publishDate: new Date('2023-06-18'),
      modifiedDate: new Date('2023-06-19'),
      category: 'Science',
      keywords: ['Climate Change', 'Agriculture', 'Global Warming', 'Research'],
      access: '', // Free content
      stockTickers: [],
    },
    // Additional articles would be defined here
  ].filter(article => new Date(article.publishDate) >= twoWeeksAgo);
  
  // Generate news sitemap entries
  const entries = articles.map(article => {
    // Determine if article has a specific genre or use category mapping
    const category = GOOGLE_NEWS_CATEGORIES[article.category] || article.category;
    
    // Determine if the article has a specific genre (Blog, OpEd, etc.)
    let genres = [];
    if (article.genres && article.genres.length > 0) {
      // Use provided genres if available
      genres = article.genres.filter(genre => GOOGLE_NEWS_GENRES.includes(genre));
    }
    
    // Always include the category as a genre if no specific genres are provided
    if (genres.length === 0) {
      genres = [category];
    }
    
    // Format publication date according to Google News requirements (ISO 8601)
    const publicationDate = article.publishDate.toISOString();
    
    return {
      url: new URL(`/article/${article.slug}`, site).toString(),
      title: article.title,
      publicationDate: publicationDate,
      publicationName: 'ChakrirChain',
      keywords: article.keywords,
      genres: genres,
      access: article.access,
      stockTickers: article.stockTickers,
      lastmod: article.modifiedDate 
        ? article.modifiedDate.toISOString().split('T')[0]
        : article.publishDate.toISOString().split('T')[0],
    };
  });
  
  // Validate entries against Google News requirements
  entries.forEach(entry => {
    const slug = entry.url.split('/').pop();
    validationErrors[slug || entry.url] = [];
    
    // Check required fields
    if (!entry.title) validationErrors[slug || entry.url].push('Missing title');
    if (!entry.publicationDate) validationErrors[slug || entry.url].push('Missing publication date');
    
    // Check publication date is within last two weeks
    try {
      const pubDate = new Date(entry.publicationDate);
      if (pubDate < twoWeeksAgo) {
        validationErrors[slug || entry.url].push('Publication date older than two weeks');
      }
    } catch (e) {
      validationErrors[slug || entry.url].push('Invalid publication date format');
    }
    
    // Remove entries with empty error arrays
    if (validationErrors[slug || entry.url].length === 0) {
      delete validationErrors[slug || entry.url];
    }
  });
  
  // Generate the news sitemap XML
  const sitemap = generateNewsSitemap(entries, 'ChakrirChain');
  
  // Log validation summary
  const validationSummary = {
    totalEntries: entries.length,
    validEntries: entries.filter(entry => {
      try {
        const pubDate = new Date(entry.publicationDate);
        return pubDate >= twoWeeksAgo && entry.title && entry.url;
      } catch (e) {
        return false;
      }
    }).length,
    errors: validationErrors
  };
  
  console.info('Google News sitemap validation summary:', validationSummary);
  
  // Return the sitemap with appropriate headers
  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
      'X-Sitemap-Type': 'google-news',
      'X-Robots-Tag': 'noindex', // Prevent indexing of the sitemap itself
    },
  });
};