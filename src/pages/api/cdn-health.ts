/**
 * CDN Health Status API Endpoint
 * 
 * This API endpoint provides information about the CDN failover system's health status.
 * It returns metrics about ImageKit and Tebi availability, response times, and failover events.
 * This endpoint is protected and requires authentication to access.
 */

import type { APIRoute } from 'astro';
import { getHealthMetrics } from '../../utils/cdnHealthMonitor';
import { getFailoverMetrics } from '../../utils/cdnFailover';

export const get: APIRoute = async ({ request }) => {
  // Check for authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  // Simple token validation (in production, use a proper auth system)
  const token = authHeader.split(' ')[1];
  if (token !== import.meta.env.CDN_MONITOR_API_KEY) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  try {
    // Get health metrics from both monitoring systems
    const healthMetrics = getHealthMetrics();
    const failoverMetrics = getFailoverMetrics();
    
    // Combine metrics
    const combinedMetrics = {
      timestamp: new Date().toISOString(),
      health: healthMetrics,
      failover: failoverMetrics,
      status: {
        imageKit: failoverMetrics.imageKitAvailable,
        tebi: true, // Tebi is assumed to be always available as the fallback
        currentProvider: failoverMetrics.imageKitAvailable ? 'imagekit' : 'tebi',
        healthMonitorRunning: healthMetrics.isRunning
      }
    };
    
    return new Response(JSON.stringify(combinedMetrics), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error retrieving CDN health metrics:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to retrieve CDN health metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};