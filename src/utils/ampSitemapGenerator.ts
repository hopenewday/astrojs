/**
 * AMP Sitemap Generator
 * 
 * This utility generates XML sitemaps specifically for AMP pages,
 * helping search engines discover and index AMP content properly.
 */

import { isAmpUrl, getAmpUrl, getCanonicalUrl } from './ampUtils';

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  ampUrl?: string;
}

/**
 * Generates a standard XML sitemap with AMP references
 * @param entries Array of sitemap entries
 * @returns XML string of the sitemap
 */
export function generateSitemap(entries: SitemapEntry[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${entries.map(entry => generateSitemapEntry(entry)).join('')}
</urlset>`;
  
  return xml;
}

/**
 * Generates a Google News sitemap with AMP references
 * @param entries Array of sitemap entries with news-specific properties
 * @param publication The publication name
 * @returns XML string of the Google News sitemap
 */
export function generateNewsSitemap(entries: (SitemapEntry & {
  title: string;
  publicationDate: string;
  publicationName?: string;
  keywords?: string[];
  genres?: string[];
})[], publication: string): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(entry => generateNewsSitemapEntry(entry, publication)).join('')}
</urlset>`;
  
  return xml;
}

/**
 * Generates a Facebook Instant Articles feed with AMP references
 * @param entries Array of article entries
 * @param siteInfo Site information
 * @returns XML string of the Facebook Instant Articles feed
 */
export function generateFacebookInstantArticlesFeed(entries: {
  url: string;
  title: string;
  description: string;
  publishDate: string;
  modifiedDate?: string;
  author: {
    name: string;
    url?: string;
  };
  content: string;
  image?: string;
}[], siteInfo: {
  title: string;
  description: string;
  language: string;
  url: string;
}): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"
                   xmlns:dc="http://purl.org/dc/elements/1.1/"
                   xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteInfo.title)}</title>
    <link>${escapeXml(siteInfo.url)}</link>
    <description>${escapeXml(siteInfo.description)}</description>
    <language>${escapeXml(siteInfo.language)}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${entries.map(entry => generateFacebookInstantArticleItem(entry)).join('')}
  </channel>
</rss>`;
  
  return xml;
}

/**
 * Generates a single sitemap entry with AMP reference
 * @param entry Sitemap entry data
 * @returns XML string for the entry
 */
function generateSitemapEntry(entry: SitemapEntry): string {
  const { url, lastmod, changefreq, priority } = entry;
  
  // Determine if this is an AMP URL or a canonical URL
  const isAmp = isAmpUrl(url);
  const ampUrl = isAmp ? url : getAmpUrl(url);
  const canonicalUrl = isAmp ? getCanonicalUrl(url) : url;
  
  return `  <url>
    <loc>${escapeXml(canonicalUrl)}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    ${changefreq ? `<changefreq>${changefreq}</changefreq>` : ''}
    ${priority !== undefined ? `<priority>${priority.toFixed(1)}</priority>` : ''}
    <xhtml:link rel="alternate" media="only screen and (max-width: 640px)" href="${escapeXml(ampUrl)}" />
  </url>
`;
}

/**
 * Generates a Google News sitemap entry with AMP reference
 * @param entry News sitemap entry data
 * @param defaultPublication Default publication name
 * @returns XML string for the news entry
 */
function generateNewsSitemapEntry(entry: SitemapEntry & {
  title: string;
  publicationDate: string;
  publicationName?: string;
  keywords?: string[];
  genres?: string[];
}, defaultPublication: string): string {
  const { 
    url, 
    title, 
    publicationDate, 
    publicationName = defaultPublication,
    keywords = [],
    genres = []
  } = entry;
  
  // Determine if this is an AMP URL or a canonical URL
  const isAmp = isAmpUrl(url);
  const ampUrl = isAmp ? url : getAmpUrl(url);
  const canonicalUrl = isAmp ? getCanonicalUrl(url) : url;
  
  return `  <url>
    <loc>${escapeXml(canonicalUrl)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(publicationName)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${publicationDate}</news:publication_date>
      <news:title>${escapeXml(title)}</news:title>
      ${keywords.length > 0 ? `<news:keywords>${escapeXml(keywords.join(','))}</news:keywords>` : ''}
      ${genres.length > 0 ? `<news:genres>${escapeXml(genres.join(','))}</news:genres>` : ''}
    </news:news>
    <xhtml:link rel="alternate" media="only screen and (max-width: 640px)" href="${escapeXml(ampUrl)}" />
  </url>
`;
}

/**
 * Generates a Facebook Instant Article RSS item
 * @param entry Article entry data
 * @returns XML string for the article item
 */
function generateFacebookInstantArticleItem(entry: {
  url: string;
  title: string;
  description: string;
  publishDate: string;
  modifiedDate?: string;
  author: {
    name: string;
    url?: string;
  };
  content: string;
  image?: string;
}): string {
  const { 
    url, 
    title, 
    description, 
    publishDate, 
    modifiedDate, 
    author,
    content,
    image
  } = entry;
  
  // Get AMP URL for reference
  const ampUrl = getAmpUrl(url);
  
  return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(url)}</link>
      <guid>${escapeXml(url)}</guid>
      <pubDate>${new Date(publishDate).toUTCString()}</pubDate>
      ${modifiedDate ? `<atom:modified>${new Date(modifiedDate).toUTCString()}</atom:modified>` : ''}
      <author>${escapeXml(author.name)}</author>
      <description>${escapeXml(description)}</description>
      <content:encoded>
        <![CDATA[
        <!doctype html>
        <html lang="en" prefix="op: http://media.facebook.com/op#">
          <head>
            <meta charset="utf-8">
            <link rel="canonical" href="${escapeXml(url)}">
            <link rel="amphtml" href="${escapeXml(ampUrl)}">
            <meta property="op:markup_version" content="v1.0">
          </head>
          <body>
            <article>
              <header>
                <h1>${escapeXml(title)}</h1>
                ${image ? `<figure>
                  <img src="${escapeXml(image)}" />
                </figure>` : ''}
                <time class="op-published" datetime="${new Date(publishDate).toISOString()}">${new Date(publishDate).toUTCString()}</time>
                ${modifiedDate ? `<time class="op-modified" datetime="${new Date(modifiedDate).toISOString()}">${new Date(modifiedDate).toUTCString()}</time>` : ''}
                <address>
                  <a${author.url ? ` href="${escapeXml(author.url)}"` : ''}>${escapeXml(author.name)}</a>
                </address>
              </header>
              ${content}
            </article>
          </body>
        </html>
        ]]>
      </content:encoded>
    </item>
`;
}

/**
 * Escapes XML special characters
 * @param str String to escape
 * @returns Escaped string
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}