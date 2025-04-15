/**
 * SchemaOrg.tsx - React components for structured data using schema.org
 * 
 * This file provides reusable React components for generating JSON-LD structured data
 * using the react-schemaorg library. These components can be used in React-based pages
 * or imported into Astro components.
 */

import React from 'react';
import { JsonLd } from 'react-schemaorg';
import {
  Article,
  BlogPosting,
  BreadcrumbList,
  NewsArticle,
  Organization,
  Person,
  Product,
  WebPage,
  WithContext,
  FAQPage,
  Event,
  Recipe,
  VideoObject
} from 'schema-dts';

// Helper type for all schema types
type SchemaType = 
  | Article
  | BlogPosting
  | BreadcrumbList
  | NewsArticle
  | Organization
  | Person
  | Product
  | WebPage
  | FAQPage
  | Event
  | Recipe
  | VideoObject;

// Base component for all schema types
export const Schema = <T extends SchemaType>({
  type,
  data,
  space = 2
}: {
  type: string;
  data: T;
  space?: number;
}) => {
  return <JsonLd<WithContext<T>> item={{ '@context': 'https://schema.org', '@type': type, ...data }} />
};

// Article Schema
export const ArticleSchema = ({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author,
  publisher,
  url,
  isAccessibleForFree = true,
  keywords = [],
  articleSection,
  wordCount
}: {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: { name: string; url?: string; };
  publisher: { name: string; logo: string; };
  url: string;
  isAccessibleForFree?: boolean;
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
}) => {
  const articleData: Article = {
    headline,
    description,
    image,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author.name,
      url: author.url
    },
    publisher: {
      '@type': 'Organization',
      name: publisher.name,
      logo: {
        '@type': 'ImageObject',
        url: publisher.logo
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    isAccessibleForFree,
    keywords,
    articleSection,
    wordCount
  };

  return <Schema type="Article" data={articleData} />;
};

// NewsArticle Schema
export const NewsArticleSchema = (props: Parameters<typeof ArticleSchema>[0]) => {
  return <Schema type="NewsArticle" data={props} />;
};

// BlogPosting Schema
export const BlogPostingSchema = (props: Parameters<typeof ArticleSchema>[0]) => {
  return <Schema type="BlogPosting" data={props} />;
};

// Organization Schema
export const OrganizationSchema = ({
  name,
  url,
  logo,
  sameAs = [],
  description
}: {
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
  description?: string;
}) => {
  const orgData: Organization = {
    name,
    url,
    logo: {
      '@type': 'ImageObject',
      url: logo
    },
    sameAs,
    description
  };

  return <Schema type="Organization" data={orgData} />;
};

// Person Schema
export const PersonSchema = ({
  name,
  url,
  image,
  jobTitle,
  sameAs = [],
  description
}: {
  name: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  sameAs?: string[];
  description?: string;
}) => {
  const personData: Person = {
    name,
    url,
    image,
    jobTitle,
    sameAs,
    description
  };

  return <Schema type="Person" data={personData} />;
};

// BreadcrumbList Schema
export const BreadcrumbSchema = ({
  items
}: {
  items: { name: string; item: string; position: number; }[];
}) => {
  const breadcrumbData: BreadcrumbList = {
    itemListElement: items.map(item => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      item: item.item
    }))
  };

  return <Schema type="BreadcrumbList" data={breadcrumbData} />;
};

// WebPage Schema
export const WebPageSchema = ({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  breadcrumb
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumb?: { name: string; item: string; position: number; }[];
}) => {
  const webPageData: WebPage = {
    name: title,
    description,
    url,
    image,
    datePublished,
    dateModified
  };

  if (breadcrumb && breadcrumb.length > 0) {
    webPageData.breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumb.map(item => ({
        '@type': 'ListItem',
        position: item.position,
        name: item.name,
        item: item.item
      }))
    };
  }

  return <Schema type="WebPage" data={webPageData} />;
};

// FAQ Schema
export const FAQSchema = ({
  questions
}: {
  questions: { question: string; answer: string; }[];
}) => {
  const faqData: FAQPage = {
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer
      }
    }))
  };

  return <Schema type="FAQPage" data={faqData} />;
};

// Product Schema
export const ProductSchema = ({
  name,
  description,
  image,
  brand,
  offers,
  sku,
  gtin,
  category,
  aggregateRating
}: {
  name: string;
  description: string;
  image: string;
  brand: { name: string; url?: string; };
  offers?: { price: number; priceCurrency: string; availability: string; url: string; };
  sku?: string;
  gtin?: string;
  category?: string;
  aggregateRating?: { ratingValue: number; reviewCount: number; };
}) => {
  const productData: Product = {
    name,
    description,
    image,
    brand: {
      '@type': 'Brand',
      name: brand.name,
      url: brand.url
    },
    sku,
    gtin,
    category
  };

  if (offers) {
    productData.offers = {
      '@type': 'Offer',
      price: offers.price,
      priceCurrency: offers.priceCurrency,
      availability: `https://schema.org/${offers.availability}`,
      url: offers.url
    };
  }

  if (aggregateRating) {
    productData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount
    };
  }

  return <Schema type="Product" data={productData} />;
};

// Combined Schema component that can render multiple schemas
export const CombinedSchema = ({ schemas }: { schemas: React.ReactNode[] }) => {
  return <>{schemas}</>;
};