// Site configuration
export const SITE_TITLE = 'ChakrirChain Magazine';
export const SITE_DESCRIPTION = 'Latest articles and updates from ChakrirChain';
export const SITE_URL = 'https://chakrirchain.com';

// SEO configuration
export const DEFAULT_OG_IMAGE = '/images/placeholder.svg';
export const TWITTER_HANDLE = '@chakrirchain';
export const TWITTER_CARD_TYPE = 'summary_large_image';

// Content configuration
export const ARTICLES_PER_PAGE = 10;
export const FEATURED_ARTICLES_COUNT = 5;

// Sitemap configuration
export const SITEMAP_CHANGEFREQ = {
  HOME: 'daily',
  ARTICLE: 'weekly',
  CATEGORY: 'weekly',
  PAGE: 'monthly'
};

export const SITEMAP_PRIORITY = {
  HOME: 1.0,
  ARTICLE: 0.7,
  CATEGORY: 0.8,
  PAGE: 0.5
};