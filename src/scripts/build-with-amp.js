/**
 * Build With AMP Script
 * 
 * This script runs the normal build process and then generates AMP versions
 * of all articles to ensure they're included in the build.
 */

const { execSync } = require('child_process');
const path = require('path');

// Configuration
const config = {
  // Whether to run the full build or just generate AMP versions
  fullBuild: process.argv.includes('--full'),
  // Whether to run in verbose mode
  verbose: process.argv.includes('--verbose')
};

/**
 * Main function to run the build with AMP generation
 */
async function buildWithAmp() {
  console.log('Starting build with AMP generation...');
  
  try {
    // Run the normal build process if requested
    if (config.fullBuild) {
      console.log('\nRunning full build...');
      execSync('npm run build', { stdio: config.verbose ? 'inherit' : 'pipe' });
      console.log('Build completed successfully.');
    }
    
    // Generate AMP versions
    console.log('\nGenerating AMP versions...');
    execSync('node src/scripts/generate-amp-versions.js', { stdio: config.verbose ? 'inherit' : 'pipe' });
    console.log('AMP generation completed successfully.');
    
    console.log('\nBuild with AMP completed successfully!');
  } catch (error) {
    console.error('Error in build process:', error.message);
    process.exit(1);
  }
}

// Run the script
buildWithAmp();