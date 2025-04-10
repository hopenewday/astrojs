import type { APIRoute } from 'astro';
import { schema as querySchema } from '../../graphql/schema';
import { mutationSchema } from '../../graphql/mutations';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql } from 'graphql';

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

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse the incoming request body
    const body = await request.json();
    const { query, variables } = body;
    
    // Execute the GraphQL query
    const result = await graphql({
      schema,
      source: query,
      variableValues: variables,
    });
    
    // Return the result
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
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
    
    // Return the result
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
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
};