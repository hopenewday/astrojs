/**
 * Validate AMP Pages Script
 * 
 * This script validates all AMP pages in the project against AMP standards.
 * It can be run as part of the build process or independently for testing.
 * 
 * Usage:
 * - npm run validate:amp            # Validate all AMP pages
 * - npm run validate:amp -- --fix   # Attempt to fix common issues
 * - npm run validate:amp -- --url=https://example.com/amp/page  # Validate a specific URL
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { execSync } = require('child_process');
const { JSDOM } = require('jsdom');

// Import our AMP validator utilities
// Note: We need to use require here since this is a Node.js script
const ampValidator = require('../utils/ampValidator');

// Configuration
const config = {
  // Directory containing AMP pages
  ampPagesDir: path.resolve(process.cwd(), 'src/pages/article/amp'),
  // Output directory for validation reports
  reportsDir: path.resolve(process.cwd(), 'dist/amp-validation-reports'),
  // Whether to attempt fixing common issues
  fix: process.argv.includes('--fix'),
  // Specific URL to validate (optional)
  url: process.argv.find(arg => arg.startsWith('--url='))?.split('=')[1],
  // Whether to fail the build on validation errors
  failOnError: process.env.NODE_ENV === 'production',
  // Verbose output
  verbose: process.argv.includes('--verbose'),
};

/**
 * Main function to validate AMP pages
 */
async function validateAmpPages() {
  console.log('Starting AMP validation...');
  
  try {
    // Create reports directory if it doesn't exist
    if (!fs.existsSync(config.reportsDir)) {
      fs.mkdirSync(config.reportsDir, { recursive: true });
    }
    
    // If a specific URL is provided, validate only that URL
    if (config.url) {
      console.log(`Validating specific URL: ${config.url}`);
      await validateUrl(config.url);
      return;
    }
    
    // Find all AMP pages
    console.log(`Scanning for AMP pages in: ${config.ampPagesDir}`);
    const ampFiles = glob.sync(`${config.ampPagesDir}/**/*.astro`);
    console.log(`Found ${ampFiles.length} AMP page(s) to validate`);
    
    // Validate each AMP page
    let validCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    
    for (const file of ampFiles) {
      const result = await validateFile(file);
      
      if (result.valid) {
        validCount++;
      } else {
        errorCount++;
      }
      
      warningCount += result.warnings.length;
    }
    
    // Generate summary report
    const summaryReport = {
      timestamp: new Date().toISOString(),
      totalFiles: ampFiles.length,
      validFiles: validCount,
      filesWithErrors: errorCount,
      totalWarnings: warningCount,
    };
    
    fs.writeFileSync(
      path.join(config.reportsDir, 'summary.json'),
      JSON.stringify(summaryReport, null, 2)
    );
    
    // Generate HTML report
    generateHtmlReport(summaryReport, ampFiles);
    
    console.log('\nAMP validation summary:');
    console.log(`- Total AMP pages: ${ampFiles.length}`);
    console.log(`- Valid AMP pages: ${validCount}`);
    console.log(`- Pages with errors: ${errorCount}`);
    console.log(`- Total warnings: ${warningCount}`);
    console.log(`\nDetailed reports saved to: ${config.reportsDir}`);
    
    // Fail the build if there are errors and we're in production
    if (errorCount > 0 && config.failOnError) {
      console.error('\nAMP validation failed with errors. Fix the issues before deploying.');
      process.exit(1);
    }
    
    console.log('\nAMP validation complete!');
  } catch (error) {
    console.error('Error during AMP validation:', error);
    if (config.failOnError) {
      process.exit(1);
    }
  }
}

/**
 * Validates a single AMP file
 * 
 * @param {string} filePath - Path to the AMP file
 * @returns {Promise<object>} - Validation result
 */
async function validateFile(filePath) {
  console.log(`Validating: ${path.relative(process.cwd(), filePath)}`);
  
  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract HTML content from Astro file
    const htmlContent = extractHtmlFromAstro(fileContent);
    
    // Perform local validation first (faster)
    const localResult = ampValidator.validateAmpHtmlLocally(htmlContent);
    
    // If local validation passes or we're in verbose mode, validate with the AMP validator API
    let apiResult = null;
    if (localResult.valid || config.verbose) {
      try {
        apiResult = await ampValidator.validateAmpHtml(htmlContent);
      } catch (error) {
        console.warn(`Warning: API validation failed for ${filePath}:`, error.message);
      }
    }
    
    // Use API result if available, otherwise use local result
    const result = apiResult || localResult;
    
    // Save the validation report
    const reportFileName = path.basename(filePath, '.astro') + '.json';
    fs.writeFileSync(
      path.join(config.reportsDir, reportFileName),
      JSON.stringify(result, null, 2)
    );
    
    // Generate human-readable report
    const textReport = ampValidator.generateValidationReport(result);
    fs.writeFileSync(
      path.join(config.reportsDir, path.basename(filePath, '.astro') + '.txt'),
      textReport
    );
    
    // Log results
    if (result.valid) {
      console.log(`  ✓ Valid AMP page`);
      if (result.warnings.length > 0) {
        console.log(`  ⚠ ${result.warnings.length} warning(s)`);
      }
    } else {
      console.error(`  ✗ Invalid AMP page - ${result.errors.length} error(s)`);
      
      // Show errors in console
      result.errors.forEach((error, index) => {
        console.error(`    ${index + 1}. ${error.message}`);
        
        // Show recommendation
        const recommendation = ampValidator.getErrorRecommendation(error);
        console.error(`       Recommendation: ${recommendation}`);
        
        // Try to fix the error if --fix flag is provided
        if (config.fix) {
          tryToFixError(filePath, error, htmlContent);
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error(`Error validating ${filePath}:`, error);
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
      status: 'UNKNOWN'
    };
  }
}

/**
 * Validates a specific URL
 * 
 * @param {string} url - URL to validate
 * @returns {Promise<void>}
 */
async function validateUrl(url) {
  try {
    console.log(`Fetching and validating URL: ${url}`);
    const result = await ampValidator.validateAmpUrl(url);
    
    // Save the validation report
    const reportFileName = 'url-' + url.replace(/[^a-z0-9]/gi, '_') + '.json';
    fs.writeFileSync(
      path.join(config.reportsDir, reportFileName),
      JSON.stringify(result, null, 2)
    );
    
    // Generate human-readable report
    const textReport = ampValidator.generateValidationReport(result);
    fs.writeFileSync(
      path.join(config.reportsDir, 'url-' + url.replace(/[^a-z0-9]/gi, '_') + '.txt'),
      textReport
    );
    
    // Log results
    if (result.valid) {
      console.log(`✓ Valid AMP page`);
      if (result.warnings.length > 0) {
        console.log(`⚠ ${result.warnings.length} warning(s)`);
      }
    } else {
      console.error(`✗ Invalid AMP page - ${result.errors.length} error(s)`);
      
      // Show errors in console
      result.errors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error.message}`);
        
        // Show recommendation
        const recommendation = ampValidator.getErrorRecommendation(error);
        console.error(`     Recommendation: ${recommendation}`);
      });
    }
  } catch (error) {
    console.error(`Error validating URL ${url}:`, error);
  }
}

/**
 * Extracts HTML content from an Astro file
 * 
 * @param {string} astroContent - Content of the Astro file
 * @returns {string} - Extracted HTML content
 */
function extractHtmlFromAstro(astroContent) {
  // Simple extraction - in a real implementation, this would be more robust
  // For now, we'll just assume everything after the frontmatter is HTML
  const frontmatterMatch = astroContent.match(/---\n([\s\S]*?)\n---/);
  
  if (frontmatterMatch) {
    // Remove the frontmatter
    const contentWithoutFrontmatter = astroContent.replace(/---\n[\s\S]*?\n---/, '');
    
    // Extract the HTML part (everything between the component tags)
    const htmlMatch = contentWithoutFrontmatter.match(/<AmpArticleLayout[\s\S]*?>(([\s\S]*?))<\/AmpArticleLayout>/);
    
    if (htmlMatch && htmlMatch[1]) {
      return `<!doctype html>
<html ⚡>
<head>
  <meta charset="utf-8">
  <title>AMP Page</title>
  <link rel="canonical" href="https://example.com">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <script async src="https://cdn.ampproject.org/v0.js"></script>
</head>
<body>
  ${htmlMatch[1]}
</body>
</html>`;
    }
  }
  
  // If we can't extract properly, return a placeholder
  return `<!doctype html>
<html ⚡>
<head>
  <meta charset="utf-8">
  <title>AMP Page</title>
  <link rel="canonical" href="https://example.com">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <script async src="https://cdn.ampproject.org/v0.js"></script>
</head>
<body>
  <!-- Could not extract content properly -->
</body>
</html>`;
}

/**
 * Attempts to fix common AMP validation errors
 * 
 * @param {string} filePath - Path to the file with errors
 * @param {object} error - The validation error
 * @param {string} htmlContent - The HTML content
 */
function tryToFixError(filePath, error, htmlContent) {
  console.log(`  Attempting to fix error: ${error.code}`);
  
  // Read the original file
  const originalContent = fs.readFileSync(filePath, 'utf8');
  let newContent = originalContent;
  
  switch (error.code) {
    case 'DISALLOWED_TAG':
      if (error.message.includes('<img>')) {
        // Try to replace <img> with <amp-img>
        newContent = newContent.replace(
          /<img([^>]*)src="([^"]+)"([^>]*)>/gi,
          (match, before, src, after) => {
            // Extract width and height if present
            const widthMatch = match.match(/width="([^"]+)"/i);
            const heightMatch = match.match(/height="([^"]+)"/i);
            const altMatch = match.match(/alt="([^"]+)"/i);
            
            const width = widthMatch ? widthMatch[1] : '640';
            const height = heightMatch ? heightMatch[1] : '360';
            const alt = altMatch ? altMatch[1] : '';
            
            return `<amp-img src="${src}" width="${width}" height="${height}" alt="${alt}" layout="responsive"></amp-img>`;
          }
        );
      }
      break;
      
    case 'INLINE_STYLE':
      // Remove inline styles
      newContent = newContent.replace(/style="[^"]*"/gi, '');
      break;
      
    case 'CUSTOM_JAVASCRIPT':
      // Remove inline scripts
      newContent = newContent.replace(/<script[\s\S]*?<\/script>/gi, '');
      break;
      
    // Add more cases for other common errors
  }
  
  // If content was modified, save the changes
  if (newContent !== originalContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`  ✓ Fixed issue in ${path.basename(filePath)}`);
  } else {
    console.log(`  ✗ Could not automatically fix this issue`);
  }
}

/**
 * Generates an HTML report of validation results
 * 
 * @param {object} summary - Summary of validation results
 * @param {string[]} files - List of validated files
 */
function generateHtmlReport(summary, files) {
  const reportPath = path.join(config.reportsDir, 'index.html');
  
  const fileReports = files.map(file => {
    const reportFileName = path.basename(file, '.astro') + '.json';
    const reportPath = path.join(config.reportsDir, reportFileName);
    
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      return {
        file: path.relative(process.cwd(), file),
        valid: report.valid,
        errors: report.errors.length,
        warnings: report.warnings.length,
        reportFile: reportFileName
      };
    }
    
    return {
      file: path.relative(process.cwd(), file),
      valid: false,
      errors: 0,
      warnings: 0,
      reportFile: null
    };
  });
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AMP Validation Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2 {
      color: #2a5885;
    }
    .summary {
      background-color: #f5f5f5;
      border-radius: 5px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .summary-item {
      background-color: white;
      border-radius: 5px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .summary-item h3 {
      margin-top: 0;
      font-size: 16px;
      color: #666;
    }
    .summary-item p {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0 0;
    }
    .files-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .files-table th, .files-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #ddd;
      text-align: left;
    }
    .files-table th {
      background-color: #f8f8f8;
      font-weight: 600;
    }
    .files-table tr:hover {
      background-color: #f5f5f5;
    }
    .status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
    }
    .status-valid {
      background-color: #e6f4ea;
      color: #137333;
    }
    .status-invalid {
      background-color: #fce8e6;
      color: #c5221f;
    }
    .timestamp {
      color: #666;
      font-size: 14px;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <h1>AMP Validation Report</h1>
  <p class="timestamp">Generated on ${new Date(summary.timestamp).toLocaleString()}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <h3>Total Pages</h3>
        <p>${summary.totalFiles}</p>
      </div>
      <div class="summary-item">
        <h3>Valid Pages</h3>
        <p>${summary.validFiles}</p>
      </div>
      <div class="summary-item">
        <h3>Pages with Errors</h3>
        <p>${summary.filesWithErrors}</p>
      </div>
      <div class="summary-item">
        <h3>Total Warnings</h3>
        <p>${summary.totalWarnings}</p>
      </div>
    </div>
  </div>
  
  <h2>Files</h2>
  <table class="files-table">
    <thead>
      <tr>
        <th>File</th>
        <th>Status</th>
        <th>Errors</th>
        <th>Warnings</th>
        <th>Report</th>
      </tr>
    </thead>
    <tbody>
      ${fileReports.map(report => `
        <tr>
          <td>${report.file}</td>
          <td>
            <span class="status ${report.valid ? 'status-valid' : 'status-invalid'}">
              ${report.valid ? 'Valid' : 'Invalid'}
            </span>
          </td>
          <td>${report.errors}</td>
          <td>${report.warnings}</td>
          <td>
            ${report.reportFile ? `
              <a href="./${report.reportFile}">JSON</a> | 
              <a href="./${report.reportFile.replace('.json', '.txt')}">Text</a>
            ` : 'N/A'}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
  
  fs.writeFileSync(reportPath, html);
  console.log(`HTML report generated: ${reportPath}`);
}

// Run the validation
validateAmpPages();