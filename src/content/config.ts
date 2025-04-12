import { defineCollection, z } from 'astro:content';

// Define schema for articles collection
const articlesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(5).max(100),
    description: z.string().min(10).max(200),
    publishDate: z.date(),
    updatedDate: z.date().optional(),
    author: z.string(), // Reference to author ID
    category: z.string(), // Reference to category ID
    featured: z.boolean().default(false),
    draft: z.boolean().default(true),
    image: z.object({
      src: z.string(),
      alt: z.string(),
      caption: z.string().optional(),
      credit: z.string().optional(),
    }),
    tags: z.array(z.string()).optional(),
    readingTime: z.number().optional(),
    isAccessibleForFree: z.boolean().default(true),
    wordCount: z.number().optional(),
    relatedArticles: z.array(z.string()).optional(), // Array of article IDs
  }),
});

// Define schema for authors collection
const authorsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    title: z.string().optional(),
    bio: z.string(),
    avatar: z.object({
      src: z.string(),
      alt: z.string().default('Author avatar'),
    }),
    social: z.object({
      twitter: z.string().url().optional(),
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
      website: z.string().url().optional(),
    }).optional(),
    featured: z.boolean().default(false),
  }),
});

// Collections for CMS integration
const cmsCollections = {
  articles: articlesCollection,
  authors: authorsCollection,
  categories: defineCollection({
    type: 'data',
    schema: z.object({
      name: z.string(),
      description: z.string(),
      slug: z.string(),
    }),
  }),
  pages: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      metaDescription: z.string(),
      template: z.enum(['default', 'home', 'contact']),
    }),
  })
};

// Define schema for categories collection
const categoriesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3b82f6'), // Default to blue-500
    image: z.object({
      src: z.string(),
      alt: z.string().default('Category image'),
    }).optional(),
    featured: z.boolean().default(false),
    order: z.number().default(999), // For sorting categories
  }),
});

// Define schema for pages collection
const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    updatedDate: z.date().optional(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }).optional(),
    draft: z.boolean().default(false),
    layout: z.enum(['default', 'wide', 'full']).default('default'),
    showToc: z.boolean().default(false),
    showComments: z.boolean().default(false),
    noindex: z.boolean().default(false),
  }),
});

// Export collections to register them
export const collections = {
  'articles': articlesCollection,
  'authors': authorsCollection,
  'categories': categoriesCollection,
  'pages': pagesCollection,
};