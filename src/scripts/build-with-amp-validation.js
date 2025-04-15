/**
 * Build With AMP Validation Script
 * 
 * This script runs the normal build process, generates AMP versions,
 * and validates all AMP pages against AMP standards.
 * 
 * It integrates AMP validation into the build pipeline to ensure
 * all AMP pages meet the required standards before deployment.
 * 
 * Usage:
 * - npm run build:amp            # Build with AMP validation
 * - npm run build:amp -- --fix   # Build and attempt to fix AMP issues
 * - npm run build:amp -- --verbose # Build with verbose output
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // Whether to run in verbose mode
  verbose: process.argv.includes('--verbose'),
  // Whether to fail the build on validation errors
  failOnError: process.env.NODE_ENV === 'production',
  // Whether to attempt fixing common issues
  fix: process.argv.includes('--fix'),
  // Output directory for validation reports
  reportsDir: path.resolve(process.cwd(), 'dist/amp-validation-reports'),
  // Whether to clean the output directory before building
  clean: process.argv.includes('--clean'),
};

/**
 * Main function to run the build with AMP generation and validation
 */
async function buildWithAmpValidation() {
  console.log('Starting build with AMP generation and validation...');
  
  try {
    // Step 1: Run the normal build process
    console.log('\n1. Running normal build process...');
    execSync('npm run build', { stdio: config.verbose ? 'inherit' : 'pipe' });
    console.log('Normal build completed successfully.');
    
    // Step 2: Generate AMP versions
    console.log('\n2. Generating AMP versions...');
    execSync('node src/scripts/generate-amp-versions.js', { stdio: config.verbose ? 'inherit' : 'pipe' });
    console.log('AMP generation completed successfully.');
    
    // Step 3: Validate AMP pages
    console.log('\n3. Validating AMP pages...');
    try {
      const validateCommand = `node src/scripts/validate-amp-pages.js${config.fix ? ' --fix' : ''}${config.verbose ? ' --verbose' : ''}`;
      execSync(validateCommand, { stdio: 'inherit' });
      console.log('AMP validation completed successfully.');
    } catch (validationError) {
      console.error('AMP validation found errors.');
      
      // If we're in production and configured to fail on errors, exit with error code
      if (config.failOnError) {
        console.error('Build failed due to AMP validation errors. Fix the issues before deploying.');
        process.exit(1);
      } else {
        console.warn('Continuing despite AMP validation errors. Fix these before production deployment.');
      }
    }
    
    // Step 4: Generate validation reports
    console.log('\n4. Generating validation reports...');
    
    // Ensure reports directory exists
    if (!fs.existsSync(config.reportsDir)) {
      fs.mkdirSync(config.reportsDir, { recursive: true });
    }
    
    // Generate summary report if it doesn't exist
    const summaryReportPath = path.join(config.reportsDir, 'summary.json');
    if (!fs.existsSync(summaryReportPath)) {
      const summaryReport = {
        timestamp: new Date().toISOString(),
        buildEnvironment: process.env.NODE_ENV || 'development',
        ampPagesProcessed: 0,
        validPages: 0,
        pagesWithErrors: 0,
        totalWarnings: 0,
        buildStatus: 'completed'
      };
      
      fs.writeFileSync(summaryReportPath, JSON.stringify(summaryReport, null, 2));
    }
    
    // Generate HTML index for reports
    generateHtmlReportIndex(config.reportsDir);
    
    console.log(`Validation reports available at: ${config.reportsDir}`);
    
    // If running in a CI environment, output a summary to the console
    if (process.env.CI) {
      try {
        const summary = JSON.parse(fs.readFileSync(summaryReportPath, 'utf8'));
        console.log('\nAMP Validation CI Summary:');
        console.log(`- Build Environment: ${summary.buildEnvironment}`);
        console.log(`- AMP Pages Processed: ${summary.ampPagesProcessed}`);
        console.log(`- Valid Pages: ${summary.validPages}`);
        console.log(`- Pages With Errors: ${summary.pagesWithErrors}`);
        console.log(`- Total Warnings: ${summary.totalWarnings}`);
        console.log(`- Build Status: ${summary.buildStatus}`);
      } catch (error) {
        console.warn('Could not read summary report:', error.message);
      }
    }
    
    console.log('\nBuild with AMP validation completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the validation reports in dist/amp-validation-reports');
    console.log('2. Fix any validation errors before deploying to production');
    console.log('3. Test the AMP pages on various devices and browsers');
  } catch (error) {
    console.error('Error during build process:', error);
    process.exit(1);
  }
}

/**
 * Generates an HTML index file for the validation reports
 * 
 * @param {string} reportsDir - Directory containing the reports
 */
function generateHtmlReportIndex(reportsDir) {
  try {
    // Get all report files
    const reportFiles = fs.readdirSync(reportsDir).filter(file => 
      file.endsWith('.json') || file.endsWith('.txt')
    );
    
    // Generate HTML content
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AMP Validation Reports</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
          h1 { color: #2a5885; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          tr:hover { background-color: #f5f5f5; }
          .valid { color: green; }
          .invalid { color: red; }
          .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>AMP Validation Reports</h1>
        <div class="summary">
          <h2>Summary</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>File</th>
              <th>Type</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Add rows for each report file
    reportFiles.forEach(file => {
      const fileType = file.endsWith('.json') ? 'JSON' : 'Text';
      const baseName = path.basename(file, path.extname(file));
      
      htmlContent += `
        <tr>
          <td>${baseName}</td>
          <td>${fileType}</td>
          <td>
            <a href="./${file}" target="_blank">View Report</a>
          </td>
        </tr>
      `;
    });
    
    // Close the HTML
    htmlContent += `
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    // Write the HTML file
    fs.writeFileSync(path.join(reportsDir, 'index.html'), htmlContent);
    console.log(`Generated HTML report index at: ${path.join(reportsDir, 'index.html')}`);
  } catch (error) {
    console.error('Error generating HTML report index:', error);
  }
}

// Run the build process
buildWithAmpValidation();