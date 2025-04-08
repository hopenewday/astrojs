/**
 * AMP Validation Script
 * 
 * This script validates all AMP pages in the project against AMP validation standards.
 * It can be run as part of the build process or manually to ensure AMP compliance.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Try to use the amphtml-validator package if available
let amphtmlValidator;
try {
  amphtmlValidator = require('amphtml-validator');
} catch (error) {
  console.warn('amphtml-validator package not found. Will use simplified validation.');
  console.warn('For full validation, install with: npm install --save-dev amphtml-validator');
}

// Configuration
const config = {
  // Directories containing AMP pages
  ampDirs: [
    path.join(__dirname, '../dist/amp'),
    path.join(__dirname, '../dist/article/amp')
  ],
  // File extensions to validate
  extensions: ['.html'],
  // Whether to fail the build on validation errors
  failOnError: process.env.NODE_ENV === 'production',
};

/**
 * Finds all HTML files in the specified directories
 */
function findAmpFiles() {
  const ampFiles = [];
  
  for (const dir of config.ampDirs) {
    if (!fs.existsSync(dir)) {
      console.warn(`Directory not found: ${dir}`);
      continue;
    }
    
    const files = getAllFiles(dir);
    ampFiles.push(...files);
  }
  
  return ampFiles;
}

/**
 * Recursively gets all files in a directory
 */
function getAllFiles(dir) {
  const files = [];
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else if (item.isFile() && config.extensions.includes(path.extname(item.name))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Validates an AMP file using the amphtml-validator package
 */
async function validateAmpFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  
  if (amphtmlValidator) {
    // Use the official AMP validator if available
    const validator = await amphtmlValidator.getInstance();
    const result = validator.validateString(html);
    
    return {
      filePath,
      status: result.status,
      errors: result.errors.length,
      warnings: 0, // The official validator doesn't separate warnings
      issues: result.errors.map(error => ({
        severity: error.severity,
        message: error.message,
        line: error.line,
        column: error.col,
        specUrl: error.specUrl || ''
      }))
    };
  } else {
    // Use simplified validation
    return simplifiedValidation(html, filePath);
  }
}

/**
 * Simplified AMP validation for when the amphtml-validator package is not available
 */
function simplifiedValidation(html, filePath) {
  const issues = [];
  
  // Check for required AMP boilerplate
  if (!html.includes('<style amp-boilerplate>')) {
    issues.push({
      severity: 'ERROR',
      message: 'Missing required AMP boilerplate style',
      line: 0,
      column: 0,
      specUrl: 'https://amp.dev/documentation/guides-and-tutorials/learn/spec/amp-boilerplate/?format=websites'
    });
  }
  
  // Check for required AMP JS
  if (!html.includes('cdn.ampproject.org/v0.js')) {
    issues.push({
      severity: 'ERROR',
      message: 'Missing required AMP JS script',