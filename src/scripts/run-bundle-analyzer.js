/**
 * Run Bundle Analyzer Script
 * 
 * This script integrates the bundle-analyzer.js into the build process.
 * It should be run after the build is complete to generate reports on bundle sizes.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  // Path to the bundle analyzer script
  analyzerScript: path.resolve(__dirname, 'bundle-analyzer.js'),
  // Directory to store reports
  reportDir: path.resolve(process.cwd(), 'bundle-reports'),
};

/**
 * Main function to run the bundle analyzer
 */
function runBundleAnalyzer() {
  console.log('\n🔍 Running bundle analyzer...');
  
  try {
    // Create report directory if it doesn't exist
    if (!fs.existsSync(config.reportDir)) {
      fs.mkdirSync(config.reportDir, { recursive: true });
    }
    
    // Run the bundle analyzer
    execSync(`node ${config.analyzerScript}`, { stdio: 'inherit' });
    
    console.log('✅ Bundle analysis complete!');
    console.log(`📊 Reports saved to: ${config.reportDir}`);
    
    // Open the latest report if on a system with a browser
    const reportFiles = fs.readdirSync(config.reportDir)
      .filter(file => file.startsWith('report-') && file.endsWith('.html'))
      .sort()
      .reverse();
    
    if (reportFiles.length > 0) {
      const latestReport = path.join(config.reportDir, reportFiles[0]);
      console.log(`🌐 Latest report: ${latestReport}`);
      
      // Try to open the report in the default browser
      try {
        const openCommand = process.platform === 'win32' ? 'start' : 
                           process.platform === 'darwin' ? 'open' : 'xdg-open';
        execSync(`${openCommand} ${latestReport}`, { stdio: 'ignore' });
      } catch (error) {
        // Silently fail if we can't open the browser
      }
    }
  } catch (error) {
    console.error('❌ Error running bundle analyzer:', error);
    process.exit(1);
  }
}

// Run the analyzer
runBundleAnalyzer();