/**
 * Utility functions for generating JSON-LD structured data
 */

interface Organization {
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
  description?: string;
}

interface Person {
  name: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  sameAs?: string[];
  description?: string;
}

interface Article {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: Person;
  publisher: Organization;
  url: string;
  isAccessibleForFree?: boolean;
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
}

interface WebPage {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumb?: BreadcrumbItem[];
}

interface BreadcrumbItem {
  name: string;
  item: string;
  position: number;
}

interface WebSite {
  name: string;
  url: string;
  description?: string;
  publisher?: Organization;
  potentialAction?: SearchAction;
}

interface SearchAction {
  target: string;
  'query-input': string;
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(org: Organization) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    url: org.url,
    logo: {
      '@type': 'ImageObject',
      url: org.logo
    },
    sameAs: org.sameAs || [],
    description: org.description
  };
}

/**
 * Generate Person schema
 */
export function generatePersonSchema(person: Person) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    url: person.url,
    image: person.image,
    jobTitle: person.jobTitle,
    sameAs: person.sameAs || [],
    description: person.description
  };
}

/**
 * Generate NewsArticle schema
 */
export function generateArticleSchema(article: Article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.headline,
    description: article.description,
    image: {
      '@type': 'ImageObject',
      url: article.image
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Person',
      name: article.author.name,
      url: article.author.url
    },
    publisher: {
      '@type': 'Organization',
      name: article.publisher.name,
      logo: {
        '@type': 'ImageObject',
        url: article.publisher.logo
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url
    },
    isAccessibleForFree: article.isAccessibleForFree !== undefined ? article.isAccessibleForFree : true,
    keywords: article.keywords,
    articleSection: article.articleSection,
    wordCount: article.wordCount
  };
}

/**
 * Generate WebPage schema
 */
export function generateWebPageSchema(page: WebPage) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    url: page.url
  };

  if (page.image) {
    schema.image = page.image;
  }

  if (page.datePublished) {
    schema.datePublished = page.datePublished;
  }

  if (page.dateModified) {
    schema.dateModified = page.dateModified;
  }

  if (page.breadcrumb && page.breadcrumb.length > 0) {
    schema.breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: page.breadcrumb.map(item => ({
        '@type': 'ListItem',
        position: item.position,
        name: item.name,
        item: item.item
      }))
    };
  }

  return schema;
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(item => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      item: item.item
    }))
  };
}

/**
 * Generate WebSite schema
 */
export function generateWebSiteSchema(site: WebSite) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url
  };

  if (site.description) {
    schema.description = site.description;
  }

  if (site.publisher) {
    schema.publisher = {
      '@type': 'Organization',
      name: site.publisher.name,
      logo: {
        '@type': 'ImageObject',
        url: site.publisher.logo
      }
    };
  }

  if (site.potentialAction) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: site.potentialAction.target,
      'query-input': site.potentialAction['query-input']
    };
  }

  return schema;
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(questions: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer
      }
    }))
  };
}

/**
 * Generate combined schema for a page
 */
type Schema = object & { '@type': string };

export function generateCombinedSchema(...schemas: Schema[]) {
  if (schemas.some(s => !s['@type'])) {
    throw new Error('All schemas must have @type property');
  }

  const SITE_URL = import.meta.env.PUBLIC_SITE_URL;
  const PUBLISHER_NAME = import.meta.env.PUBLIC_PUBLISHER_NAME;
  const PUBLISHER_LOGO = import.meta.env.PUBLIC_PUBLISHER_LOGO_URL;
  const LICENSE_URL = import.meta.env.PUBLIC_LICENSE_URL;

  if (!SITE_URL || !PUBLISHER_NAME || !PUBLISHER_LOGO || !LICENSE_URL) {
    throw new Error('Missing required environment variables for schema configuration');
  }

  return {
    '@context': 'https://schema.org',
    '@graph': schemas.map(schema => ({
      ...schema,
      '@context': undefined
    })),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': SITE_URL
    },
    license: LICENSE_URL || 'https://creativecommons.org/licenses/by-sa/4.0/',
    publisher: {
      '@type': 'Organization',
      name: PUBLISHER_NAME,
      logo: {
        '@type': 'ImageObject',
        url: PUBLISHER_LOGO
      }
    }
  };
}

/**
 * Schema validation utility
 * Validates schema data against required fields for the given schema type
 * 
 * @param type - The schema type to validate
 * @param data - The schema data to validate
 * @returns Validation result with missing fields
 */
export function validateSchema(type: string, data: any): { valid: boolean; missing: string[] } {
  // Define required fields for each schema type
  const SCHEMA_REQUIREMENTS: Record<string, string[]> = {
    Organization: ['name', 'url', 'logo'],
    Person: ['name'],
    NewsArticle: ['headline', 'description', 'image', 'datePublished', 'author', 'publisher', 'url'],
    WebPage: ['title', 'description', 'url'],
    BreadcrumbList: ['itemListElement'],
    WebSite: ['name', 'url'],
    FAQPage: ['mainEntity']
  };

  const requirements = SCHEMA_REQUIREMENTS[type];
  
  if (!requirements) {
    return { valid: false, missing: [`Unknown schema type: ${type}`] };
  }
  
  // Handle case where data is null or undefined
  if (data === null || data === undefined) {
    return { valid: false, missing: requirements };
  }
  
  const missing = requirements.filter(field => {
    // Handle nested properties with dot notation (e.g., 'author.name')
    const fieldParts = field.split('.');
    let value = data;
    
    for (const part of fieldParts) {
      if (value === undefined || value === null) return true;
      value = value[part];
    }
    
    // Check if the final value exists and is not empty string
    return value === undefined || value === null || 
           (typeof value === 'string' && value.trim() === '');
  });
  
  return {
    valid: missing.length === 0,
    missing
  };
}