import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../config';

export async function GET(context) {
  // Get all published articles
  const articles = await getCollection('articles', ({ data }) => {
    return !data.draft;
  });

  // Sort articles by publish date (newest first)
  const sortedArticles = articles.sort((a, b) => {
    return new Date(b.data.publishDate).valueOf() - new Date(a.data.publishDate).valueOf();
  });

  // Create the RSS feed
  return rss({
    // The RSS feed title, description, and custom metadata
    title: SITE_TITLE || 'ChakrirChain Magazine',
    description: SITE_DESCRIPTION || 'Latest articles and updates from ChakrirChain',
    site: context.site || 'https://chakrirchain.com',
    // The list of items for the RSS feed
    items: sortedArticles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.publishDate,
      link: `/article/${article.slug}/`,
      // Optional: include categories as RSS categories
      categories: article.data.tags || [],
      // Optional: include author information
      author: article.data.author,
      // Optional: custom data for each item
      customData: article.data.image ? `<enclosure url="${article.data.image.src}" type="image/jpeg" />` : '',
    })),
    // Optional: customize the XML output
    customData: `<language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <managingEditor>editor@chakrirchain.com</managingEditor>
    <webMaster>webmaster@chakrirchain.com</webMaster>
    <image>
      <url>https://chakrirchain.com/icons/icon-512x512.svg</url>
      <title>${SITE_TITLE || 'ChakrirChain Magazine'}</title>
      <link>https://chakrirchain.com</link>
    </image>`,
  });
}