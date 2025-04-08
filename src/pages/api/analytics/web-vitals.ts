import type { APIRoute } from 'astro';

/**
 * API endpoint for receiving Web Vitals metrics
 * Processes and stores performance data sent by the WebVitals component
 */
export const post: APIRoute = async ({ request }) => {
  try {
    // Parse the incoming JSON data
    const data = await request.json();
    
    // Log the received metrics in development
    if (import.meta.env.DEV) {
      console.log('[API] Web Vitals metric received:', data);
    }
    
    // In a production environment, you would typically:
    // 1. Validate the data
    // 2. Store it in a database
    // 3. Forward it to an analytics service
    
    // Example validation
    if (!data.name || !data.value) {
      return new Response(JSON.stringify({ error: 'Invalid metric data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Here you would add code to store the metrics
    // For example, using a database client:
    // await db.insert('web_vitals', data);
    
    // Return success response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing Web Vitals data:', error);
    
    return new Response(JSON.stringify({ error: 'Failed to process metrics' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};