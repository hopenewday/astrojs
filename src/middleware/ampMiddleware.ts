/**
 * AMP Middleware
 * 
 * This middleware handles routing between AMP and non-AMP versions of pages
 * based on device detection and browser capabilities.
 */

import { defineMiddleware } from 'astro:middleware';
import { isAmpUrl, getCanonicalUrl, getAmpUrl } from '../utils/ampUtils';
import { shouldServeAmp } from '../utils/ampDetection';

export const ampMiddleware = defineMiddleware(async (context, next) => {
  const { request } = context;
  const url = new URL(request.url);
  
  // Only process article pages
  if (!url.pathname.includes('/article/')) {
    return next();
  }
  
  const isAmp = isAmpUrl(url.toString());
  const canonicalUrl = isAmp ? getCanonicalUrl(url.toString()) : url.toString();
  const ampUrl = isAmp ? url.toString() : getAmpUrl(url.toString());
  
  // Determine if we should serve AMP content based on the request
  const shouldUseAmp = shouldServeAmp(request, ampUrl, canonicalUrl);
  
  // If we're on an AMP page but shouldn't serve AMP, redirect to canonical
  if (isAmp && !shouldUseAmp) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': canonicalUrl,
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  // If we're on a canonical page but should serve AMP, redirect to AMP
  if (!isAmp && shouldUseAmp && !url.searchParams.has('noamp')) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': ampUrl,
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  // Otherwise, continue with the request
  return next();
});