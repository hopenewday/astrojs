/**
 * AMP Middleware
 * 
 * This middleware handles routing between AMP and non-AMP versions of pages
 * based on device detection and browser capabilities.
 * 
 * Features:
 * - Automatic device detection and redirection
 * - Performance optimization for mobile devices
 * - Error handling and logging
 * - Support for user preferences (noamp parameter)
 */

import { defineMiddleware } from 'astro:middleware';
import { isAmpUrl, getCanonicalUrl, getAmpUrl } from '../utils/ampUtils';
import { shouldServeAmp } from '../utils/ampDetection';

// Logger for AMP-related events
const logAmpEvent = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[AMP Middleware] ${timestamp} - ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

export const ampMiddleware = defineMiddleware(async (context, next) => {
  const { request } = context;
  const url = new URL(request.url);
  
  try {
    // Only process article pages
    if (!url.pathname.includes('/article/')) {
      return next();
    }
    
    const isAmp = isAmpUrl(url.toString());
    const canonicalUrl = isAmp ? getCanonicalUrl(url.toString()) : url.toString();
    const ampUrl = isAmp ? url.toString() : getAmpUrl(url.toString());
    
    // Store these values in context for use in components
    context.locals.isAmp = isAmp;
    context.locals.canonicalUrl = canonicalUrl;
    context.locals.ampUrl = ampUrl;
    
    // Log request information in development mode
    if (import.meta.env.DEV) {
      logAmpEvent('Processing request', {
        url: url.toString(),
        isAmp,
        canonicalUrl,
        ampUrl,
        userAgent: request.headers.get('user-agent')
      });
    }
    
    // Determine if we should serve AMP content based on the request
    const shouldUseAmp = shouldServeAmp(request, ampUrl, canonicalUrl);
    
    // If we're on an AMP page but shouldn't serve AMP, redirect to canonical
    if (isAmp && !shouldUseAmp) {
      logAmpEvent('Redirecting from AMP to canonical', { from: url.toString(), to: canonicalUrl });
      return new Response(null, {
        status: 302,
        headers: {
          'Location': canonicalUrl,
          'Cache-Control': 'no-cache',
          'Vary': 'User-Agent'
        }
      });
    }
    
    // If we're on a canonical page but should serve AMP, redirect to AMP
    if (!isAmp && shouldUseAmp && !url.searchParams.has('noamp')) {
      logAmpEvent('Redirecting from canonical to AMP', { from: url.toString(), to: ampUrl });
      return new Response(null, {
        status: 302,
        headers: {
          'Location': ampUrl,
          'Cache-Control': 'no-cache',
          'Vary': 'User-Agent'
        }
      });
    }
    
    // Otherwise, continue with the request
    return next();
  } catch (error) {
    // Log the error
    logAmpEvent('Error in AMP middleware', { 
      url: url.toString(), 
      error: error.message,
      stack: error.stack
    });
    
    // Continue with the request despite the error
    // This ensures users still get a response even if AMP detection fails
    return next();
  }
});