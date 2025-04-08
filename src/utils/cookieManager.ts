/**
 * Cookie Manager Utility
 * 
 * This utility provides secure cookie management functions with best practices:
 * - HttpOnly flag for authentication cookies
 * - SameSite=Strict requirement
 * - Secure flag for HTTPS-only
 * - Prefix naming for security
 */

import { getSecureCookieOptions } from '../config/security.config';

interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  domain?: string;
  path?: string;
  sameSite?: 'Strict' | 'Lax' | 'None';
  prefix?: '__Host-' | '__Secure-' | '';
}

/**
 * Set a secure cookie with appropriate security flags
 * 
 * @param response The Response object to set the cookie on
 * @param name Cookie name
 * @param value Cookie value
 * @param options Additional cookie options
 */
export function setSecureCookie(
  response: Response,
  name: string,
  value: string,
  options: Partial<CookieOptions> = {}
): Response {
  const { name: securedName, options: secureOptions } = getSecureCookieOptions(name, options);
  
  // Build cookie string
  let cookie = `${securedName}=${encodeURIComponent(value)}`;
  
  // Add expiration
  if (secureOptions.maxAge) {
    cookie += `; Max-Age=${secureOptions.maxAge}`;
  }
  
  // Add security flags
  if (secureOptions.httpOnly) {
    cookie += '; HttpOnly';
  }
  
  if (secureOptions.secure) {
    cookie += '; Secure';
  }
  
  // Add SameSite
  cookie += `; SameSite=${secureOptions.sameSite}`;
  
  // Add path
  cookie += `; Path=${secureOptions.path}`;
  
  // Add domain if specified
  if (secureOptions.domain) {
    cookie += `; Domain=${secureOptions.domain}`;
  }
  
  // Set the cookie header
  const newHeaders = new Headers(response.headers);
  newHeaders.append('Set-Cookie', cookie);
  
  // Return a new response with the cookie header
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

/**
 * Parse cookies from a request
 * 
 * @param request The Request object to parse cookies from
 * @returns An object containing all cookies
 */
export function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('Cookie') || '';
  return parseCookieString(cookieHeader);
}

/**
 * Parse a cookie string into an object
 * 
 * @param cookieString The cookie string to parse
 * @returns An object containing all cookies
 */
export function parseCookieString(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  if (!cookieString) {
    return cookies;
  }
  
  cookieString.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    const value = parts.length > 1 ? decodeURIComponent(parts[1].trim()) : '';
    
    if (name) {
      cookies[name] = value;
    }
  });
  
  return cookies;
}

/**
 * Delete a cookie by setting its expiration in the past
 * 
 * @param response The Response object to set the cookie on
 * @param name Cookie name
 * @param options Additional cookie options
 */
export function deleteSecureCookie(
  response: Response,
  name: string,
  options: Partial<CookieOptions> = {}
): Response {
  const { name: securedName, options: secureOptions } = getSecureCookieOptions(name, options);
  
  // Build cookie string with expiration in the past
  let cookie = `${securedName}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  
  // Add security flags
  if (secureOptions.httpOnly) {
    cookie += '; HttpOnly';
  }
  
  if (secureOptions.secure) {
    cookie += '; Secure';
  }
  
  // Add SameSite
  cookie += `; SameSite=${secureOptions.sameSite}`;
  
  // Add path
  cookie += `; Path=${secureOptions.path}`;
  
  // Add domain if specified
  if (secureOptions.domain) {
    cookie += `; Domain=${secureOptions.domain}`;
  }
  
  // Set the cookie header
  const newHeaders = new Headers(response.headers);
  newHeaders.append('Set-Cookie', cookie);
  
  // Return a new response with the cookie header
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}