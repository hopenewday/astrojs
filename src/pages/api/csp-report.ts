/**
 * CSP Violation Report Endpoint
 * 
 * This API endpoint receives and processes Content Security Policy violation reports
 * sent by browsers when a CSP violation occurs. It logs the violations and can
 * optionally forward them to an external monitoring service.
 */

import type { APIRoute } from 'astro';

export const post: APIRoute = async ({ request }) => {
  try {
    // Parse the CSP violation report
    const report = await request.json();
    
    // Log the violation
    console.error('CSP Violation:', JSON.stringify({
      'csp-report': report['csp-report'],
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('User-Agent'),
      ip: request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')
    }, null, 2));
    
    // Sanitize the report data to remove any PII before storing or forwarding
    const sanitizedReport = sanitizeReport(report['csp-report']);
    
    // Forward to external monitoring service if configured
    if (import.meta.env.CSP_MONITORING_ENDPOINT) {
      await forwardToMonitoring(sanitizedReport);
    }
    
    // Return success response
    return new Response(JSON.stringify({ success: true }), {
      status: 204, // No content
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error processing CSP report:', error);
    
    // Return error response
    return new Response(JSON.stringify({ error: 'Failed to process CSP report' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

/**
 * Sanitize CSP report to remove any PII
 */
function sanitizeReport(report: any) {
  // Create a copy of the report
  const sanitized = { ...report };
  
  // Remove potentially sensitive information
  if (sanitized.source_file) {
    // Remove query parameters from URLs that might contain session tokens
    sanitized.source_file = sanitized.source_file.split('?')[0];
  }
  
  // Remove any other fields that might contain PII
  delete sanitized.referrer;
  
  return sanitized;
}

/**
 * Forward CSP violation report to external monitoring service
 */
async function forwardToMonitoring(report: any) {
  try {
    const response = await fetch(import.meta.env.CSP_MONITORING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.CSP_MONITORING_TOKEN || ''}`
      },
      body: JSON.stringify({
        report,
        application: 'chakrirchain',
        environment: import.meta.env.PUBLIC_ENVIRONMENT || 'production',
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to forward CSP report: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to forward CSP report to monitoring service:', error);
  }
}