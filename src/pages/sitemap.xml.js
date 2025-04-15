import { getCollection } from 'astro:content';
import { SITE_URL, SITEMAP_CHANGEFREQ, SITEMAP_PRIORITY } from '../config';

export async function GET(context) {
  // Get all published articles
  const articles = await getCollection('articles', ({ data }) => {
    return !data.draft;
  });

  // Get all categories
  const categories = await getCollection('categories');

  // Get all pages
  const pages = await getCollection('pages', ({ data }) => {
    return !data.draft;
  });

  // Format date for sitemap
  const formatDate = (date) => {
    return date ? new Date(date).toISOString() : new Date().toISOString();
  };

  // Generate sitemap entries
  const entries = [
    // Home page
    {
      url: SITE_URL || context.site || 'https://chakrirchain.com',
      lastmod: formatDate(new Date()),
      changefreq: SITEMAP_CHANGEFREQ.HOME,
      priority: SITEMAP_PRIORITY.HOME
    },
    // Article pages
    ...articles.map((article) => ({
      url: `${SITE_URL || context.site || 'https://chakrirchain.com'}/article/${article.slug}/`,
      lastmod: formatDate(article.data.updatedDate || article.data.publishDate),
      changefreq: SITEMAP_CHANGEFREQ.ARTICLE,
      priority: article.data.featured ? SITEMAP_PRIORITY.ARTICLE + 0.1 : SITEMAP_PRIORITY.ARTICLE
    })),
    // Category pages
    ...categories.map((category) => ({
      url: `${SITE_URL || context.site || 'https://chakrirchain.com'}/category/${category.slug}/`,
      lastmod: formatDate(new Date()),
      changefreq: SITEMAP_CHANGEFREQ.CATEGORY,
      priority: category.data.featured ? SITEMAP_PRIORITY.CATEGORY + 0.1 : SITEMAP_PRIORITY.CATEGORY
    })),
    // Static pages
    ...pages.map((page) => ({
      url: `${SITE_URL || context.site || 'https://chakrirchain.com'}/${page.slug}/`,
      lastmod: formatDate(page.data.updatedDate || page.data.publishDate),
      changefreq: SITEMAP_CHANGEFREQ.PAGE,
      priority: SITEMAP_PRIORITY.PAGE
    }))
  ];

  // Generate sitemap XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Return the sitemap with appropriate headers
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600'
    }
  });
}