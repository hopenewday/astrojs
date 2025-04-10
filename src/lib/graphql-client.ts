import { GraphQLClient } from 'graphql-request';
import { print } from 'graphql';
import type { DocumentNode } from 'graphql';

// Create GraphQL client instance
const endpoint = '/api/graphql';
const client = new GraphQLClient(endpoint, {
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to execute GraphQL queries/mutations
export async function executeOperation<T = any, V = any>(
  document: DocumentNode,
  variables?: V
): Promise<T> {
  try {
    const query = print(document);
    const data = await client.request<T>(query, variables);
    return data;
  } catch (error) {
    console.error('GraphQL operation failed:', error);
    throw error;
  }
}

// Type definitions for content mutations
export interface CreateContentInput {
  title: string;
  description: string;
  publishDate: string;
  content: string;
  [key: string]: any; // Additional fields based on content type
}

export interface UpdateContentInput extends CreateContentInput {
  slug: string;
}

// Content type-specific mutation functions
export async function createArticle(input: CreateContentInput) {
  const mutation = `
    mutation CreateArticle($input: ArticleInput!) {
      createArticle(input: $input) {
        id
        slug
        title
      }
    }
  `;
  return executeOperation({ query: mutation, variables: { input } });
}

export async function updateArticle(input: UpdateContentInput) {
  const mutation = `
    mutation UpdateArticle($slug: String!, $input: ArticleInput!) {
      updateArticle(slug: $slug, input: $input) {
        id
        slug
        title
      }
    }
  `;
  return executeOperation({
    query: mutation,
    variables: { slug: input.slug, input },
  });
}

export async function createPage(input: CreateContentInput) {
  const mutation = `
    mutation CreatePage($input: PageInput!) {
      createPage(input: $input) {
        id
        slug
        title
      }
    }
  `;
  return executeOperation({ query: mutation, variables: { input } });
}

export async function updatePage(input: UpdateContentInput) {
  const mutation = `
    mutation UpdatePage($slug: String!, $input: PageInput!) {
      updatePage(slug: $slug, input: $input) {
        id
        slug
        title
      }
    }
  `;
  return executeOperation({
    query: mutation,
    variables: { slug: input.slug, input },
  });
}

export async function createCategory(input: CreateContentInput) {
  const mutation = `
    mutation CreateCategory($input: CategoryInput!) {
      createCategory(input: $input) {
        id
        slug
        name
      }
    }
  `;
  return executeOperation({ query: mutation, variables: { input } });
}

export async function updateCategory(input: UpdateContentInput) {
  const mutation = `
    mutation UpdateCategory($slug: String!, $input: CategoryInput!) {
      updateCategory(slug: $slug, input: $input) {
        id
        slug
        name
      }
    }
  `;
  return executeOperation({
    query: mutation,
    variables: { slug: input.slug, input },
  });
}