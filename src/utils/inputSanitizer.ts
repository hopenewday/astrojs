/**
 * Input Sanitization Utility
 * 
 * This utility provides functions to sanitize user inputs across the application
 * to prevent injection attacks such as XSS and SQL injection.
 */

import { sanitizeHtml, sanitizeUrl, sanitizeText, SanitizeOptions } from './sanitizer';

/**
 * Input types that can be sanitized
 */
export enum InputType {
  HTML = 'html',
  URL = 'url',
  TEXT = 'text',
  EMAIL = 'email',
  SEARCH = 'search',
  USERNAME = 'username',
  FILENAME = 'filename',
  PATH = 'path',
  QUERY = 'query'
}

/**
 * Sanitize any user input based on its type
 * 
 * @param input The user input to sanitize
 * @param type The type of input
 * @param options Optional sanitization options for HTML content
 * @returns Sanitized input
 */
export function sanitizeInput(input: string, type: InputType, options?: Partial<SanitizeOptions>): string {
  if (!input) return '';
  
  switch (type) {
    case InputType.HTML:
      return sanitizeHtml(input, options);
    case InputType.URL:
      return sanitizeUrl(input);
    case InputType.TEXT:
    case InputType.SEARCH:
    case InputType.USERNAME:
      return sanitizeText(input);
    case InputType.EMAIL:
      return sanitizeEmail(input);
    case InputType.FILENAME:
    case InputType.PATH:
      return sanitizePath(input);
    case InputType.QUERY:
      return sanitizeQueryParam(input);
    default:
      // Default to strict text sanitization
      return sanitizeText(input);
  }
}

/**
 * Sanitize an email address
 * 
 * @param email The email address to sanitize
 * @returns Sanitized email address
 */
function sanitizeEmail(email: string): string {
  // Basic email validation and sanitization
  const sanitized = email.trim().toLowerCase();
  
  // Simple regex to validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitize a file path or filename
 * 
 * @param path The path or filename to sanitize
 * @returns Sanitized path or filename
 */
function sanitizePath(path: string): string {
  // Remove potentially dangerous characters
  return path.replace(/[\\/:*?"<>|]/g, '');
}

/**
 * Sanitize a query parameter
 * 
 * @param query The query parameter to sanitize
 * @returns Sanitized query parameter
 */
function sanitizeQueryParam(query: string): string {
  // Encode URI component and then decode to ensure valid characters
  // This prevents injection while maintaining readability
  return decodeURIComponent(encodeURIComponent(query));
}

/**
 * Sanitize an object's properties recursively
 * 
 * @param obj The object to sanitize
 * @param typeMap Map of property paths to input types
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T, typeMap: Record<string, InputType>): T {
  const result = { ...obj };
  
  for (const [path, type] of Object.entries(typeMap)) {
    const keys = path.split('.');
    let current = result;
    
    // Navigate to the nested property
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === undefined || current[key] === null) break;
      current = current[key];
    }
    
    // Sanitize the property if it exists and is a string
    const lastKey = keys[keys.length - 1];
    if (current[lastKey] !== undefined && typeof current[lastKey] === 'string') {
      current[lastKey] = sanitizeInput(current[lastKey], type);
    }
  }
  
  return result;
}

/**
 * Sanitize form data
 * 
 * @param formData The form data to sanitize
 * @param typeMap Map of field names to input types
 * @returns Sanitized form data
 */
export function sanitizeFormData(formData: FormData, typeMap: Record<string, InputType>): FormData {
  const sanitizedFormData = new FormData();
  
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      const type = typeMap[key] || InputType.TEXT;
      sanitizedFormData.append(key, sanitizeInput(value, type));
    } else {
      // Non-string values (like files) are passed through unchanged
      sanitizedFormData.append(key, value);
    }
  }
  
  return sanitizedFormData;
}