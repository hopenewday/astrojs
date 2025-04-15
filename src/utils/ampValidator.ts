/**
 * AMP Validator Utility
 * 
 * This module provides utilities for validating AMP pages against the official AMP validation rules.
 * It integrates with the AMP validator API and provides detailed error reporting and recommendations.
 */

// Import required dependencies
import { DOMParser } from '@xmldom/xmldom';
import fetch from 'node-fetch';

/**
 * Interface for AMP validation error
 */
interface AmpValidationError {
  severity: 'ERROR' | 'WARNING';
  line: number;
  col: number;
  message: string;
  specUrl?: string;
  category: string;
  code: string;
  params?: string[];
}

/**
 * Interface for AMP validation result
 */
interface AmpValidationResult {
  valid: boolean;
  errors: AmpValidationError[];
  warnings: AmpValidationError[];
  status: 'PASS' | 'FAIL' | 'UNKNOWN';
  url?: string;
}

/**
 * Validates an AMP HTML string using the AMP validator API
 * 
 * @param html The AMP HTML content to validate
 * @param url Optional URL of the page being validated (for reporting)
 * @returns Promise with validation result
 */
export async function validateAmpHtml(html: string, url?: string): Promise<AmpValidationResult> {
  try {
    // Use the AMP validator API
    const response = await fetch('https://amp.dev/validator/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        'html': html
      })
    });

    if (!response.ok) {
      throw new Error(`AMP validation API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Process and categorize errors and warnings
    const errors: AmpValidationError[] = [];
    const warnings: AmpValidationError[] = [];
    
    if (result.errors) {
      result.errors.forEach((error: any) => {
        const validationError: AmpValidationError = {
          severity: error.severity,
          line: error.line || 0,
          col: error.col || 0,
          message: error.message || 'Unknown error',
          specUrl: error.specUrl,
          category: error.category || 'UNKNOWN',
          code: error.code || 'UNKNOWN_ERROR',
          params: error.params
        };
        
        if (error.severity === 'ERROR') {
          errors.push(validationError);
        } else {
          warnings.push(validationError);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      status: errors.length === 0 ? 'PASS' : 'FAIL',
      url
    };
  } catch (error) {
    console.error('Error validating AMP HTML:', error);
    return {
      valid: false,
      errors: [{
        severity: 'ERROR',
        line: 0,
        col: 0,
        message: `Validation failed: ${error.message}`,
        category: 'VALIDATOR_ERROR',
        code: 'VALIDATOR_ERROR'
      }],
      warnings: [],
      status: 'UNKNOWN',
      url
    };
  }
}

/**
 * Performs local validation checks on AMP HTML
 * This provides a faster alternative to the API for basic checks
 * 
 * @param html The AMP HTML content to validate
 * @returns Validation result with basic checks
 */
export function validateAmpHtmlLocally(html: string): AmpValidationResult {
  const errors: AmpValidationError[] = [];
  const warnings: AmpValidationError[] = [];
  
  try {
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Check for required AMP elements
    if (!html.includes('<!doctype html>')) {
      errors.push({
        severity: 'ERROR',
        line: 1,
        col: 1,
        message: 'Missing doctype declaration. Should be <!doctype html>',
        category: 'MANDATORY_AMP_TAG_MISSING',
        code: 'MANDATORY_DOCTYPE'
      });
    }
    
    if (!html.includes('<html ⚡') && !html.includes('<html amp')) {
      errors.push({
        severity: 'ERROR',
        line: 1,
        col: 1,
        message: 'Missing AMP attribute in <html> tag. Should be <html ⚡> or <html amp>',
        category: 'MANDATORY_AMP_ATTR_MISSING',
        code: 'MANDATORY_AMP_ATTR'
      });
    }
    
    // Check for canonical link
    if (!html.includes('<link rel="canonical"')) {
      errors.push({
        severity: 'ERROR',
        line: 0,
        col: 0,
        message: 'Missing canonical link. All AMP documents must have a <link rel="canonical"> tag.',
        category: 'MANDATORY_TAG_MISSING',
        code: 'MANDATORY_CANONICAL'
      });
    }
    
    // Check for AMP boilerplate
    if (!html.includes('style amp-boilerplate')) {
      errors.push({
        severity: 'ERROR',
        line: 0,
        col: 0,
        message: 'Missing AMP boilerplate CSS. The AMP boilerplate code is required.',
        category: 'MANDATORY_TAG_MISSING',
        code: 'MANDATORY_BOILERPLATE'
      });
    }
    
    // Check for AMP runtime script
    if (!html.includes('cdn.ampproject.org/v0.js')) {
      errors.push({
        severity: 'ERROR',
        line: 0,
        col: 0,
        message: 'Missing AMP runtime script. The AMP runtime script is required.',
        category: 'MANDATORY_TAG_MISSING',
        code: 'MANDATORY_AMP_RUNTIME'
      });
    }
    
    // Check for disallowed elements
    if (html.includes('<img')) {
      errors.push({
        severity: 'ERROR',
        line: 0,
        col: 0,
        message: 'The tag <img> is disallowed. Use <amp-img> instead.',
        category: 'DISALLOWED_HTML_TAG',
        code: 'DISALLOWED_TAG'
      });
    }
    
    if (html.includes('<video')) {
      errors.push({
        severity: 'ERROR',
        line: 0,
        col: 0,
        message: 'The tag <video> is disallowed. Use <amp-video> instead.',
        category: 'DISALLOWED_HTML_TAG',
        code: 'DISALLOWED_TAG'
      });
    }
    
    if (html.includes('<iframe') && !html.includes('<amp-iframe')) {
      errors.push({
        severity: 'ERROR',
        line: 0,
        col: 0,
        message: 'The tag <iframe> is disallowed. Use <amp-iframe> instead.',
        category: 'DISALLOWED_HTML_TAG',
        code: 'DISALLOWED_TAG'
      });
    }
    
    // Check for inline styles (not allowed in AMP)
    if (html.includes('style="')) {
      errors.push({
        severity: 'ERROR',
        line: 0,
        col: 0,
        message: 'Inline styles are not allowed in AMP pages. Use amp-custom styles instead.',
        category: 'DISALLOWED_INLINE_STYLE',
        code: 'INLINE_STYLE'
      });
    }
    
    // Check for inline scripts (not allowed in AMP)
    if (html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) && 
        !html.match(/<script[^>]*src="https:\/\/cdn\.ampproject\.org\/[^"]*\.js"[^>]*><\/script>/gi)) {
      errors.push({
        severity: 'ERROR',
        line: 0,
        col: 0,
        message: 'Custom JavaScript is not allowed in AMP pages.',
        category: 'DISALLOWED_SCRIPT',
        code: 'CUSTOM_JAVASCRIPT'
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      status: errors.length === 0 ? 'PASS' : 'FAIL'
    };
  } catch (error) {
    console.error('Error in local AMP validation:', error);
    return {
      valid: false,
      errors: [{
        severity: 'ERROR',
        line: 0,
        col: 0,
        message: `Local validation failed: ${error.message}`,
        category: 'VALIDATOR_ERROR',
        code: 'VALIDATOR_ERROR'
      }],
      warnings: [],
      status: 'UNKNOWN'
    };
  }
}

/**
 * Generates a human-readable validation report
 * 
 * @param result The validation result
 * @returns Formatted validation report
 */
export function generateValidationReport(result: AmpValidationResult): string {
  let report = `AMP Validation Report\n`;
  report += `Status: ${result.status}\n`;
  report += `Valid: ${result.valid ? 'Yes' : 'No'}\n`;
  
  if (result.url) {
    report += `URL: ${result.url}\n`;
  }
  
  report += `\nErrors (${result.errors.length}):\n`;
  if (result.errors.length === 0) {
    report += 'No errors found.\n';
  } else {
    result.errors.forEach((error, index) => {
      report += `\n${index + 1}. ${error.message}\n`;
      report += `   Line ${error.line}, Column ${error.col}\n`;
      report += `   Category: ${error.category}\n`;
      if (error.specUrl) {
        report += `   More info: ${error.specUrl}\n`;
      }
    });
  }
  
  report += `\nWarnings (${result.warnings.length}):\n`;
  if (result.warnings.length === 0) {
    report += 'No warnings found.\n';
  } else {
    result.warnings.forEach((warning, index) => {
      report += `\n${index + 1}. ${warning.message}\n`;
      report += `   Line ${warning.line}, Column ${warning.col}\n`;
      report += `   Category: ${warning.category}\n`;
      if (warning.specUrl) {
        report += `   More info: ${warning.specUrl}\n`;
      }
    });
  }
  
  return report;
}

/**
 * Validates an AMP page by URL
 * 
 * @param url The URL of the AMP page to validate
 * @returns Promise with validation result
 */
export async function validateAmpUrl(url: string): Promise<AmpValidationResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    return validateAmpHtml(html, url);
  } catch (error) {
    console.error(`Error validating URL ${url}:`, error);
    return {
      valid: false,
      errors: [{
        severity: 'ERROR',
        line: 0,
        col: 0,
        message: `Failed to validate URL: ${error.message}`,
        category: 'URL_FETCH_ERROR',
        code: 'URL_FETCH_ERROR'
      }],
      warnings: [],
      status: 'UNKNOWN',
      url
    };
  }
}

/**
 * Provides recommendations for fixing AMP validation errors
 * 
 * @param error The validation error
 * @returns Recommendation for fixing the error
 */
export function getErrorRecommendation(error: AmpValidationError): string {
  const recommendations: Record<string, string> = {
    'MANDATORY_DOCTYPE': 'Add <!doctype html> to the beginning of your document.',
    'MANDATORY_AMP_ATTR': 'Add the ⚡ attribute to your <html> tag: <html ⚡>',
    'MANDATORY_CANONICAL': 'Add a canonical link: <link rel="canonical" href="[canonical URL]">',
    'MANDATORY_BOILERPLATE': 'Add the required AMP boilerplate code to your document.',
    'MANDATORY_AMP_RUNTIME': 'Add the AMP runtime script: <script async src="https://cdn.ampproject.org/v0.js"></script>',
    'DISALLOWED_TAG': 'Replace this tag with its AMP equivalent (e.g., <img> → <amp-img>).',
    'INLINE_STYLE': 'Move inline styles to a <style amp-custom> section in the head.',
    'CUSTOM_JAVASCRIPT': 'Remove custom JavaScript. AMP doesn\'t allow custom JS.',
    'INVALID_ATTR_VALUE': 'Fix the attribute value according to AMP specifications.',
    'DISALLOWED_ATTR': 'Remove this attribute as it\'s not allowed in AMP.',
    'INVALID_URL': 'Fix the URL to be HTTPS and properly formatted.',
    'GENERAL_DISALLOWED_TAG': 'This HTML tag is not allowed in AMP. Remove it or replace with an allowed alternative.',
    'INVALID_URL_PROTOCOL': 'Change the URL protocol to HTTPS.',
    'INVALID_ATTR_VALUE.INVALID_URL_PROTOCOL': 'Change all URLs to use HTTPS protocol.',
    'INVALID_ATTR_VALUE.INVALID_URL': 'Fix the URL format according to AMP requirements.',
    'DUPLICATE_UNIQUE_TAG': 'Remove duplicate instances of this tag. It must appear only once.',
    'CSS_SYNTAX_INVALID_AT_RULE': 'Remove or fix this CSS at-rule as it\'s not allowed in AMP.',
    'CSS_SYNTAX': 'Fix the CSS syntax error.',
    'MANDATORY_PROPERTY_MISSING': 'Add the required property to this element.',
    'DISALLOWED_PROPERTY_IN_ATTR_VALUE': 'Remove the disallowed property from this attribute.',
    'MISSING_LAYOUT_ATTRIBUTES': 'Add width and height attributes to this element.',
    'INCONSISTENT_UNITS_FOR_WIDTH_AND_HEIGHT': 'Use consistent units for width and height attributes.',
  };
  
  // Return specific recommendation if available, otherwise a generic one
  return recommendations[error.code] || 
         'Review the AMP documentation for this error type and make the necessary corrections.';
}

/**
 * Batch validates multiple AMP pages
 * 
 * @param urls Array of URLs to validate
 * @returns Promise with array of validation results
 */
export async function batchValidateAmpUrls(urls: string[]): Promise<AmpValidationResult[]> {
  const results: AmpValidationResult[] = [];
  
  for (const url of urls) {
    try {
      const result = await validateAmpUrl(url);
      results.push(result);
    } catch (error) {
      console.error(`Error validating ${url}:`, error);
      results.push({
        valid: false,
        errors: [{
          severity: 'ERROR',
          line: 0,
          col: 0,
          message: `Validation failed: ${error.message}`,
          category: 'VALIDATOR_ERROR',
          code: 'VALIDATOR_ERROR'
        }],
        warnings: [],
        status: 'UNKNOWN',
        url
      });
    }
  }
  
  return results;
}