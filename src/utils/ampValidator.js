/**
 * AMP Validator Utility
 * 
 * This utility provides functions for validating AMP HTML content against
 * the official AMP validator. It supports both local validation and
 * validation through the AMP validator API.
 */

const https = require('https');
const { JSDOM } = require('jsdom');
const amphtmlValidator = require('amphtml-validator');

/**
 * Validates AMP HTML content using the local amphtml-validator
 * 
 * @param {string} html - The HTML content to validate
 * @returns {Object} Validation result
 */
async function validateAmpHtmlLocally(html) {
  try {
    // Get validator instance
    const validator = await amphtmlValidator.getInstance();
    
    // Validate the HTML
    const result = validator.validateString(html);
    
    // Format the results
    return {
      valid: result.status === 'PASS',
      errors: result.errors.filter(error => error.severity === 'ERROR').map(formatError),
      warnings: result.errors.filter(error => error.severity === 'WARNING').map(formatError),
      raw: result
    };
  } catch (error) {
    console.error('Error during local AMP validation:', error);
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
      raw: null
    };
  }
}

/**
 * Validates AMP HTML content using the AMP Validator API
 * 
 * @param {string} html - The HTML content to validate
 * @returns {Promise<Object>} Validation result
 */
async function validateAmpHtml(html) {
  return new Promise((resolve, reject) => {
    try {
      // Prepare the request options
      const options = {
        hostname: 'amp.dev',
        port: 443,
        path: '/validator/validate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(html)
        }
      };
      
      // Make the request
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            // Parse the response
            const result = JSON.parse(data);
            
            // Format the results
            resolve({
              valid: result.status === 'PASS',
              errors: (result.errors || []).filter(error => error.severity === 'ERROR').map(formatError),
              warnings: (result.errors || []).filter(error => error.severity === 'WARNING').map(formatError),
              raw: result
            });
          } catch (error) {
            reject(new Error(`Failed to parse validation response: ${error.message}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`AMP validation request failed: ${error.message}`));
      });
      
      // Send the HTML content
      req.write(html);
      req.end();
    } catch (error) {
      reject(new Error(`Failed to initiate validation request: ${error.message}`));
    }
  });
}

/**
 * Validates an AMP URL using the AMP Validator API
 * 
 * @param {string} url - The URL to validate
 * @returns {Promise<Object>} Validation result
 */
async function validateAmpUrl(url) {
  return new Promise((resolve, reject) => {
    try {
      // Encode the URL
      const encodedUrl = encodeURIComponent(url);
      
      // Prepare the request options
      const options = {
        hostname: 'amp.dev',
        port: 443,
        path: `/validator/validate?url=${encodedUrl}`,
        method: 'GET'
      };
      
      // Make the request
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            // Parse the response
            const result = JSON.parse(data);
            
            // Format the results
            resolve({
              valid: result.status === 'PASS',
              errors: (result.errors || []).filter(error => error.severity === 'ERROR').map(formatError),
              warnings: (result.errors || []).filter(error => error.severity === 'WARNING').map(formatError),
              raw: result
            });
          } catch (error) {
            reject(new Error(`Failed to parse validation response: ${error.message}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`AMP validation request failed: ${error.message}`));
      });
      
      req.end();
    } catch (error) {
      reject(new Error(`Failed to initiate validation request: ${error.message}`));
    }
  });
}

/**
 * Formats an error object from the AMP validator
 * 
 * @param {Object} error - The error object from the validator
 * @returns {Object} Formatted error object
 */
function formatError(error) {
  return {
    severity: error.severity,
    line: error.line || 0,
    col: error.col || 0,
    message: error.message || 'Unknown error',
    category: error.category || 'UNKNOWN',
    code: error.code || 'UNKNOWN_ERROR',
    specUrl: error.specUrl || null
  };
}

/**
 * Generates a human-readable validation report
 * 
 * @param {Object} result - The validation result
 * @returns {string} Human-readable report
 */
function generateValidationReport(result) {
  let report = '';
  
  // Add header
  report += 'AMP Validation Report\n';
  report += '=====================\n\n';
  
  // Add status
  report += `Status: ${result.valid ? 'VALID' : 'INVALID'}\n\n`;
  
  // Add errors
  if (result.errors && result.errors.length > 0) {
    report += `Errors (${result.errors.length}):\n`;
    report += '-----------------\n';
    
    result.errors.forEach((error, index) => {
      report += `${index + 1}. ${error.message}\n`;
      report += `   Line ${error.line}, Column ${error.col}\n`;
      report += `   Category: ${error.category}\n`;
      
      if (error.specUrl) {
        report += `   More info: ${error.specUrl}\n`;
      }
      
      report += `   Recommendation: ${getErrorRecommendation(error)}\n\n`;
    });
  } else {
    report += 'No errors found.\n\n';
  }
  
  // Add warnings
  if (result.warnings && result.warnings.length > 0) {
    report += `Warnings (${result.warnings.length}):\n`;
    report += '-------------------\n';
    
    result.warnings.forEach((warning, index) => {
      report += `${index + 1}. ${warning.message}\n`;
      report += `   Line ${warning.line}, Column ${warning.col}\n`;
      report += `   Category: ${warning.category}\n\n`;
    });
  } else {
    report += 'No warnings found.\n';
  }
  
  return report;
}

/**
 * Gets a recommendation for fixing an AMP validation error
 * 
 * @param {Object} error - The error object
 * @returns {string} Recommendation for fixing the error
 */
function getErrorRecommendation(error) {
  // Common error types and recommendations
  const recommendations = {
    'MANDATORY_TAG_MISSING': 'Add the required AMP tag to your document.',
    'DISALLOWED_TAG': 'Remove this tag as it is not allowed in AMP.',
    'INVALID_ATTR_VALUE': 'Fix the attribute value to match AMP requirements.',
    'DISALLOWED_ATTR': 'Remove this attribute as it is not allowed in AMP.',
    'MANDATORY_ATTR_MISSING': 'Add the required attribute to this tag.',
    'INCORRECT_NUM_CHILD_TAGS': 'Fix the number of child tags to match AMP requirements.',
    'STYLESHEET_TOO_LONG': 'Reduce the size of your stylesheet or split it into multiple smaller ones.',
    'CSS_SYNTAX': 'Fix the CSS syntax error.',
    'MANDATORY_PROPERTY_MISSING_FROM_ATTR_VALUE': 'Add the required property to the attribute value.',
    'INVALID_URL_PROTOCOL': 'Use HTTPS protocol for all URLs in AMP documents.',
    'INVALID_URL': 'Fix the URL to be a valid URL.',
    'DISALLOWED_PROPERTY_IN_ATTR_VALUE': 'Remove the disallowed property from the attribute value.',
    'MUTUALLY_EXCLUSIVE_ATTRS': 'Remove one of the mutually exclusive attributes.',
    'DUPLICATE_UNIQUE_TAG': 'Remove duplicate tags that should only appear once.',
    'TEMPLATE_PARTIAL_MISSING': 'Add the missing template partial.',
    'TEMPLATE_SYNTAX_ERROR': 'Fix the template syntax error.'
  };
  
  // Return specific recommendation if available, otherwise a generic one
  return recommendations[error.code] || 
         'Review the AMP documentation for this error type and fix accordingly.';
}

module.exports = {
  validateAmpHtmlLocally,
  validateAmpHtml,
  validateAmpUrl,
  generateValidationReport,
  getErrorRecommendation
};