import type { APIRoute } from 'astro';
import { schema as querySchema } from '../../graphql/schema';
import { mutationSchema } from '../../graphql/mutations';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql } from 'graphql';
import { withAuth } from '../../utils/authMiddleware';
import { corsMiddleware } from '../../middleware/corsMiddleware';
import { sanitizeInput, InputType, sanitizeObject } from '../../utils/inputSanitizer';

// Define protected mutations that require authentication
const protectedMutations = [
  'createArticle',
  'updateArticle',
  'deleteArticle',
  'createAuthor',
  'updateAuthor',
  'deleteAuthor',
  'createCategory',
  'updateCategory',
  'deleteCategory',
  'createPage',
  'updatePage',
  'deletePage'
];

// Helper to check if operation is a protected mutation
function isProtectedOperation(query: string): boolean {
  return protectedMutations.some(mutation => 
    query.includes(`mutation`) && query.includes(mutation)
  );
}

// Merge query and mutation schemas
const schema = makeExecutableSchema({
  typeDefs: [
    querySchema.typeDefs,
    mutationSchema.typeDefs
  ],
  resolvers: [
    querySchema.resolvers,
    mutationSchema.resolvers
  ]
});

// Apply CORS middleware to the GraphQL endpoint
export const POST: APIRoute = async (context) => {
  return corsMiddleware(context, async () => {
    const { request } = context;
  try {
    // Parse and sanitize the incoming request body
    const body = await request.json();
    
    // Sanitize GraphQL query and variables
    const query = sanitizeInput(body.query, InputType.TEXT);
    const variables = body.variables ? sanitizeObject(body.variables, {
      // Map variable paths to appropriate input types
      // For example: 'title': InputType.TEXT, 'content': InputType.HTML
      // This should be expanded based on your schema
      'id': InputType.TEXT,
      'slug': InputType.TEXT,
      'title': InputType.TEXT,
      'content': InputType.HTML,
      'excerpt': InputType.TEXT,
      'author': InputType.TEXT,
      'category': InputType.TEXT,
      'tags': InputType.TEXT,
      'url': InputType.URL,
      'email': InputType.EMAIL,
      'search': InputType.SEARCH
    }) : {};
    
    // Check if this is a protected operation
    if (isProtectedOperation(query)) {
      // Apply authentication middleware for protected operations
      return withGraphQLAuth(handleGraphQL, {
        requiredPermissions: ['content:write'],
        requiredScopes: ['api:access']
      })({ request, query, variables });
    }
    
    // For non-protected operations, process directly
    return handleGraphQL({ request, query, variables });
  } catch (error) {
    console.error('GraphQL API error:', error);
    
    return new Response(JSON.stringify({
      errors: [{ message: error.message || 'An error occurred while processing the request' }]
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  });
};

// GraphQL request handler
async function handleGraphQL({ request, query, variables, user }) {
  try {
    // Execute the GraphQL query
    const result = await graphql({
      schema,
      source: query,
      variableValues: variables,
      contextValue: {
        // Add any context values needed by resolvers
        timestamp: new Date().toISOString(),
        user: user || null // Pass authenticated user to resolvers
      }
    });
    
    // Return the result with security headers
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block'
      }
    });
  } catch (error) {
    console.error('GraphQL API error:', error);
    
    return new Response(JSON.stringify({
      errors: [{ message: error.message || 'An error occurred while processing the request' }]
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  });
};

// Also handle GET requests for GraphQL playground or simple queries
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query');
    const variablesParam = url.searchParams.get('variables');
    
    if (!query) {
      return new Response(JSON.stringify({
        errors: [{ message: 'Query parameter is required' }]
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    let variables = {};
    if (variablesParam) {
      try {
        variables = JSON.parse(variablesParam);
      } catch (e) {
        return new Response(JSON.stringify({
          errors: [{ message: 'Invalid variables format' }]
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    // Execute the GraphQL query
    const result = await graphql({
      schema,
      source: query,
      variableValues: variables,
    });
    
    // Return the result with security headers
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block'
      }
    });
  } catch (error) {
    console.error('GraphQL API error:', error);
    
    return new Response(JSON.stringify({
      errors: [{ message: error.message || 'An error occurred while processing the request' }]
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  });
};