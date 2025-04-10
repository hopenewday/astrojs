import { makeExecutableSchema } from '@graphql-tools/schema';
import { getCollection } from 'astro:content';
import { z } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import path from 'path';
import { collections } from '../content/config';

// Define GraphQL mutation type definitions
const typeDefs = `
  type Mutation {
    # Article mutations
    createArticle(input: ArticleInput!): Article
    updateArticle(slug: String!, input: ArticleInput!): Article
    deleteArticle(slug: String!): Boolean
    
    # Author mutations
    createAuthor(input: AuthorInput!): Author
    updateAuthor(slug: String!, input: AuthorInput!): Author
    deleteAuthor(slug: String!): Boolean
    
    # Category mutations
    createCategory(input: CategoryInput!): Category
    updateCategory(slug: String!, input: CategoryInput!): Category
    deleteCategory(slug: String!): Boolean
    
    # Page mutations
    createPage(input: PageInput!): Page
    updatePage(slug: String!, input: PageInput!): Page
    deletePage(slug: String!): Boolean
  }
  
  input ArticleInput {
    title: String!
    description: String!
    publishDate: String!
    updatedDate: String
    author: String!
    category: String!
    featured: Boolean
    draft: Boolean
    image: ImageInput!
    tags: [String]
    readingTime: Int
    isAccessibleForFree: Boolean
    wordCount: Int
    relatedArticles: [String]
    content: String!
  }
  
  input AuthorInput {
    name: String!
    title: String
    bio: String!
    avatar: ImageInput!
    social: SocialInput
    featured: Boolean
    content: String
  }
  
  input SocialInput {
    twitter: String
    facebook: String
    instagram: String
    linkedin: String
    github: String
    website: String
  }
  
  input CategoryInput {
    name: String!
    description: String!
    color: String
    image: ImageInput
    featured: Boolean
    order: Int
    content: String
  }
  
  input PageInput {
    title: String!
    description: String!
    publishDate: String!
    updatedDate: String
    image: ImageInput
    draft: Boolean
    layout: String
    showToc: Boolean
    showComments: Boolean
    noindex: Boolean
    content: String!
  }
  
  input ImageInput {
    src: String!
    alt: String!
    caption: String
    credit: String
  }
`;

// Utility functions
const sanitizeContent = (content: string) => {
  return sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title']
    }
  });
};

const validateSlug = (slug: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Invalid slug format');
  }
  return slug;
};

const generateSlug = (title: string) => {
  return validateSlug(title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'));
};

const resolvers = {
  Mutation: {
    // Article mutations
    createArticle: async (_, { input }, context) => {
      try {
        // Validate input against schema
        const validatedInput = collections.articles.schema.parse({
          ...input,
          publishDate: new Date(input.publishDate),
          updatedDate: input.updatedDate ? new Date(input.updatedDate) : undefined
        });

        const slug = generateSlug(input.title);
        const filePath = path.join('content', 'articles', `${slug}.md`);

        // Check if article already exists
        const articles = await getCollection('articles');
        if (articles.find(a => a.slug === slug)) {
          throw new Error(`Article with slug ${slug} already exists`);
        }

        // Sanitize content
        const sanitizedContent = sanitizeContent(input.content);

        // Create frontmatter
        const frontmatter = {
          ...validatedInput,
          content: undefined
        };

        // Write to file system
        await Astro.fs.writeFile(
          filePath,
          `---\n${JSON.stringify(frontmatter, null, 2)}\n---\n\n${sanitizedContent}`
        );

        return {
          id: slug,
          slug,
          ...validatedInput,
          content: sanitizedContent
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    updateArticle: async (_, { slug, input }, context) => {
      try {
        validateSlug(slug);
        const filePath = path.join('content', 'articles', `${slug}.md`);

        // Check if article exists
        const articles = await getCollection('articles');
        const article = articles.find(a => a.slug === slug);
        if (!article) {
          throw new Error(`Article with slug ${slug} not found`);
        }

        // Validate input
        const validatedInput = collections.articles.schema.parse({
          ...input,
          publishDate: new Date(input.publishDate),
          updatedDate: new Date()
        });

        // Sanitize content
        const sanitizedContent = sanitizeContent(input.content);

        // Create frontmatter
        const frontmatter = {
          ...validatedInput,
          content: undefined
        };

        // Write updated content
        await Astro.fs.writeFile(
          filePath,
          `---\n${JSON.stringify(frontmatter, null, 2)}\n---\n\n${sanitizedContent}`
        );

        return {
          id: slug,
          slug,
          ...validatedInput,
          content: sanitizedContent
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    deleteArticle: async (_, { slug }, context) => {
      try {
        validateSlug(slug);
        const filePath = path.join('content', 'articles', `${slug}.md`);

        // Check if article exists
        const articles = await getCollection('articles');
        const article = articles.find(a => a.slug === slug);
        if (!article) {
          throw new Error(`Article with slug ${slug} not found`);
        }

        // Delete the file
        await Astro.fs.unlink(filePath);
        return true;
      } catch (error) {
        throw error;
      }
    },

    // Author mutations
    createAuthor: async (_, { input }) => {
      try {
        const validatedInput = collections.authors.schema.parse({
          ...input,
          content: undefined
        });

        const slug = generateSlug(input.name);
        const filePath = path.join('content', 'authors', `${slug}.md`);

        // Check if author exists
        const authors = await getCollection('authors');
        if (authors.find(a => a.slug === slug)) {
          throw new Error(`Author with slug ${slug} already exists`);
        }

        const sanitizedContent = input.content ? sanitizeContent(input.content) : '';

        // Write to file system
        await Astro.fs.writeFile(
          filePath,
          `---\n${JSON.stringify(validatedInput, null, 2)}\n---\n\n${sanitizedContent}`
        );

        return {
          id: slug,
          slug,
          ...validatedInput,
          content: sanitizedContent
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    updateAuthor: async (_, { slug, input }) => {
      try {
        validateSlug(slug);
        const filePath = path.join('content', 'authors', `${slug}.md`);

        // Check if author exists
        const authors = await getCollection('authors');
        const author = authors.find(a => a.slug === slug);
        if (!author) {
          throw new Error(`Author with slug ${slug} not found`);
        }

        const validatedInput = collections.authors.schema.parse({
          ...input,
          content: undefined
        });

        const sanitizedContent = input.content ? sanitizeContent(input.content) : '';

        // Write to file system
        await Astro.fs.writeFile(
          filePath,
          `---\n${JSON.stringify(validatedInput, null, 2)}\n---\n\n${sanitizedContent}`
        );

        return {
          id: slug,
          slug,
          ...validatedInput,
          content: sanitizedContent
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    deleteAuthor: async (_, { slug }) => {
      try {
        validateSlug(slug);
        const filePath = path.join('content', 'authors', `${slug}.md`);

        // Check if author exists
        const authors = await getCollection('authors');
        const author = authors.find(a => a.slug === slug);
        if (!author) {
          throw new Error(`Author with slug ${slug} not found`);
        }

        // Delete the file
        await Astro.fs.unlink(filePath);
        return true;
      } catch (error) {
        throw error;
      }
    },

    // Category mutations
    createCategory: async (_, { input }) => {
      try {
        const validatedInput = collections.categories.schema.parse({
          ...input,
          content: undefined
        });

        const slug = generateSlug(input.name);
        const filePath = path.join('content', 'categories', `${slug}.md`);

        // Check if category exists
        const categories = await getCollection('categories');
        if (categories.find(c => c.slug === slug)) {
          throw new Error(`Category with slug ${slug} already exists`);
        }

        const sanitizedContent = input.content ? sanitizeContent(input.content) : '';

        // Write to file system
        await Astro.fs.writeFile(
          filePath,
          `---\n${JSON.stringify(validatedInput, null, 2)}\n---\n\n${sanitizedContent}`
        );

        return {
          id: slug,
          slug,
          ...validatedInput,
          content: sanitizedContent
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    updateCategory: async (_, { slug, input }) => {
      try {
        validateSlug(slug);
        const filePath = path.join('content', 'categories', `${slug}.md`);

        // Check if category exists
        const categories = await getCollection('categories');
        const category = categories.find(c => c.slug === slug);
        if (!category) {
          throw new Error(`Category with slug ${slug} not found`);
        }

        const validatedInput = collections.categories.schema.parse({
          ...input,
          content: undefined
        });

        const sanitizedContent = input.content ? sanitizeContent(input.content) : '';

        // Write to file system
        await Astro.fs.writeFile(
          filePath,
          `---\n${JSON.stringify(validatedInput, null, 2)}\n---\n\n${sanitizedContent}`
        );

        return {
          id: slug,
          slug,
          ...validatedInput,
          content: sanitizedContent
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    deleteCategory: async (_, { slug }) => {
      try {
        validateSlug(slug);
        const filePath = path.join('content', 'categories', `${slug}.md`);

        // Check if category exists
        const categories = await getCollection('categories');
        const category = categories.find(c => c.slug === slug);
        if (!category) {
          throw new Error(`Category with slug ${slug} not found`);
        }

        // Delete the file
        await Astro.fs.unlink(filePath);
        return true;
      } catch (error) {
        throw error;
      }
    },

    // Page mutations
    createPage: async (_, { input }) => {
      try {
        const validatedInput = collections.pages.schema.parse({
          ...input,
          publishDate: new Date(input.publishDate),
          updatedDate: input.updatedDate ? new Date(input.updatedDate) : undefined,
          content: undefined
        });

        const slug = generateSlug(input.title);
        const filePath = path.join('content', 'pages', `${slug}.md`);

        // Check if page exists
        const pages = await getCollection('pages');
        if (pages.find(p => p.slug === slug)) {
          throw new Error(`Page with slug ${slug} already exists`);
        }

        const sanitizedContent = sanitizeContent(input.content);

        // Write to file system
        await Astro.fs.writeFile(
          filePath,
          `---\n${JSON.stringify(validatedInput, null, 2)}\n---\n\n${sanitizedContent}`
        );

        return {
          id: slug,
          slug,
          ...validatedInput,
          content: sanitizedContent
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    updatePage: async (_, { slug, input }) => {
      try {
        validateSlug(slug);
        const filePath = path.join('content', 'pages', `${slug}.md`);

        // Check if page exists
        const pages = await getCollection('pages');
        const page = pages.find(p => p.slug === slug);
        if (!page) {
          throw new Error(`Page with slug ${slug} not found`);
        }

        const validatedInput = collections.pages.schema.parse({
          ...input,
          publishDate: new Date(input.publishDate),
          updatedDate: new Date(),
          content: undefined
        });

        const sanitizedContent = sanitizeContent(input.content);

        // Write to file system
        await Astro.fs.writeFile(
          filePath,
          `---\n${JSON.stringify(validatedInput, null, 2)}\n---\n\n${sanitizedContent}`
        );

        return {
          id: slug,
          slug,
          ...validatedInput,
          content: sanitizedContent
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    deletePage: async (_, { slug }) => {
      try {
        validateSlug(slug);
        const filePath = path.join('content', 'pages', `${slug}.md`);

        // Check if page exists
        const pages = await getCollection('pages');
        const page = pages.find(p => p.slug === slug);
        if (!page) {
          throw new Error(`Page with slug ${slug} not found`);
        }

        // Delete the file
        await Astro.fs.unlink(filePath);
        return true;
      } catch (error) {
        throw error;
      }
    }
  }
};

// Export the mutation schema and resolvers
export const mutationSchema = makeExecutableSchema({
  typeDefs,
  resolvers
});