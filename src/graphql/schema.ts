import { makeExecutableSchema } from '@graphql-tools/schema';
import { getCollection } from 'astro:content';

// Define GraphQL type definitions
const typeDefs = `
  type Query {
    articles(limit: Int, offset: Int, category: String, tag: String, featured: Boolean): [Article!]!
    article(slug: String!): Article
    authors(limit: Int, offset: Int, featured: Boolean): [Author!]!
    author(slug: String!): Author
    categories(limit: Int, offset: Int, featured: Boolean): [Category!]!
    category(slug: String!): Category
    pages(limit: Int, offset: Int): [Page!]!
    page(slug: String!): Page
  }

  type Article {
    id: ID!
    title: String!
    slug: String!
    description: String!
    publishDate: String!
    updatedDate: String
    author: Author!
    category: Category!
    featured: Boolean
    draft: Boolean
    image: Image!
    tags: [String]
    readingTime: Int
    isAccessibleForFree: Boolean
    wordCount: Int
    relatedArticles: [Article]
    content: String!
  }

  type Author {
    id: ID!
    name: String!
    slug: String!
    title: String
    bio: String!
    avatar: Image!
    social: Social
    featured: Boolean
    articles: [Article]
  }

  type Social {
    twitter: String
    facebook: String
    instagram: String
    linkedin: String
    github: String
    website: String
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String!
    color: String
    image: Image
    featured: Boolean
    order: Int
    articles: [Article]
  }

  type Page {
    id: ID!
    title: String!
    slug: String!
    description: String!
    publishDate: String!
    updatedDate: String
    image: Image
    draft: Boolean
    layout: String
    showToc: Boolean
    showComments: Boolean
    noindex: Boolean
    content: String!
  }

  type Image {
    src: String!
    alt: String!
    caption: String
    credit: String
  }
`;

// Define resolvers
const resolvers = {
  Query: {
    // Article resolvers
    articles: async (_, { limit, offset, category, tag, featured }) => {
      const articles = await getCollection('articles');
      let filteredArticles = articles;
      
      // Apply filters
      if (category) {
        filteredArticles = filteredArticles.filter(article => article.data.category === category);
      }
      
      if (tag) {
        filteredArticles = filteredArticles.filter(article => 
          article.data.tags && article.data.tags.includes(tag)
        );
      }
      
      if (featured !== undefined) {
        filteredArticles = filteredArticles.filter(article => article.data.featured === featured);
      }
      
      // Sort by publish date (newest first)
      filteredArticles.sort((a, b) => 
        new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime()
      );
      
      // Apply pagination
      if (offset !== undefined && limit !== undefined) {
        filteredArticles = filteredArticles.slice(offset, offset + limit);
      } else if (limit !== undefined) {
        filteredArticles = filteredArticles.slice(0, limit);
      }
      
      // Transform to match GraphQL schema
      return filteredArticles.map(article => ({
        id: article.id,
        slug: article.slug,
        ...article.data,
        publishDate: article.data.publishDate.toISOString(),
        updatedDate: article.data.updatedDate?.toISOString(),
        content: article.body
      }));
    },
    
    article: async (_, { slug }) => {
      const articles = await getCollection('articles');
      const article = articles.find(a => a.slug === slug);
      
      if (!article) return null;
      
      return {
        id: article.id,
        slug: article.slug,
        ...article.data,
        publishDate: article.data.publishDate.toISOString(),
        updatedDate: article.data.updatedDate?.toISOString(),
        content: article.body
      };
    },
    
    // Author resolvers
    authors: async (_, { limit, offset, featured }) => {
      const authors = await getCollection('authors');
      let filteredAuthors = authors;
      
      if (featured !== undefined) {
        filteredAuthors = filteredAuthors.filter(author => author.data.featured === featured);
      }
      
      // Apply pagination
      if (offset !== undefined && limit !== undefined) {
        filteredAuthors = filteredAuthors.slice(offset, offset + limit);
      } else if (limit !== undefined) {
        filteredAuthors = filteredAuthors.slice(0, limit);
      }
      
      return filteredAuthors.map(author => ({
        id: author.id,
        slug: author.slug,
        ...author.data,
        content: author.body
      }));
    },
    
    author: async (_, { slug }) => {
      const authors = await getCollection('authors');
      const author = authors.find(a => a.slug === slug);
      
      if (!author) return null;
      
      return {
        id: author.id,
        slug: author.slug,
        ...author.data,
        content: author.body
      };
    },
    
    // Category resolvers
    categories: async (_, { limit, offset, featured }) => {
      const categories = await getCollection('categories');
      let filteredCategories = categories;
      
      if (featured !== undefined) {
        filteredCategories = filteredCategories.filter(category => category.data.featured === featured);
      }
      
      // Sort by order field
      filteredCategories.sort((a, b) => a.data.order - b.data.order);
      
      // Apply pagination
      if (offset !== undefined && limit !== undefined) {
        filteredCategories = filteredCategories.slice(offset, offset + limit);
      } else if (limit !== undefined) {
        filteredCategories = filteredCategories.slice(0, limit);
      }
      
      return filteredCategories.map(category => ({
        id: category.id,
        slug: category.slug,
        ...category.data,
        content: category.body
      }));
    },
    
    category: async (_, { slug }) => {
      const categories = await getCollection('categories');
      const category = categories.find(c => c.slug === slug);
      
      if (!category) return null;
      
      return {
        id: category.id,
        slug: category.slug,
        ...category.data,
        content: category.body
      };
    },
    
    // Page resolvers
    pages: async (_, { limit, offset }) => {
      const pages = await getCollection('pages');
      let filteredPages = pages;
      
      // Apply pagination
      if (offset !== undefined && limit !== undefined) {
        filteredPages = filteredPages.slice(offset, offset + limit);
      } else if (limit !== undefined) {
        filteredPages = filteredPages.slice(0, limit);
      }
      
      return filteredPages.map(page => ({
        id: page.id,
        slug: page.slug,
        ...page.data,
        publishDate: page.data.publishDate.toISOString(),
        updatedDate: page.data.updatedDate?.toISOString(),
        content: page.body
      }));
    },
    
    page: async (_, { slug }) => {
      const pages = await getCollection('pages');
      const page = pages.find(p => p.slug === slug);
      
      if (!page) return null;
      
      return {
        id: page.id,
        slug: page.slug,
        ...page.data,
        publishDate: page.data.publishDate.toISOString(),
        updatedDate: page.data.updatedDate?.toISOString(),
        content: page.body
      };
    }
  },
  
  // Relationship resolvers
  Article: {
    author: async (parent) => {
      const authors = await getCollection('authors');
      const author = authors.find(a => a.slug === parent.author);
      
      if (!author) return null;
      
      return {
        id: author.id,
        slug: author.slug,
        ...author.data
      };
    },
    
    category: async (parent) => {
      const categories = await getCollection('categories');
      const category = categories.find(c => c.slug === parent.category);
      
      if (!category) return null;
      
      return {
        id: category.id,
        slug: category.slug,
        ...category.data
      };
    },
    
    relatedArticles: async (parent) => {
      if (!parent.relatedArticles || parent.relatedArticles.length === 0) return [];
      
      const articles = await getCollection('articles');
      const relatedArticles = articles.filter(article => 
        parent.relatedArticles.includes(article.slug)
      );
      
      return relatedArticles.map(article => ({
        id: article.id,
        slug: article.slug,
        ...article.data,
        publishDate: article.data.publishDate.toISOString(),
        updatedDate: article.data.updatedDate?.toISOString()
      }));
    }
  },
  
  Author: {
    articles: async (parent) => {
      const articles = await getCollection('articles');
      const authorArticles = articles.filter(article => article.data.author === parent.slug);
      
      return authorArticles.map(article => ({
        id: article.id,
        slug: article.slug,
        ...article.data,
        publishDate: article.data.publishDate.toISOString(),
        updatedDate: article.data.updatedDate?.toISOString()
      }));
    }
  },
  
  Category: {
    articles: async (parent) => {
      const articles = await getCollection('articles');
      const categoryArticles = articles.filter(article => article.data.category === parent.slug);
      
      return categoryArticles.map(article => ({
        id: article.id,
        slug: article.slug,
        ...article.data,
        publishDate: article.data.publishDate.toISOString(),
        updatedDate: article.data.updatedDate?.toISOString()
      }));
    }
  }
};

// Create executable schema
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});