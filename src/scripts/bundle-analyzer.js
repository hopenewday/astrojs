/**
 * Bundle Analyzer Script
 * 
 * This script analyzes the bundle sizes of the application and generates reports
 * to help identify large dependencies and track changes over time.
 * 
 * Features:
 * - Analyzes bundle sizes and composition
 * - Tracks changes over time
 * - Identifies large dependencies
 * - Generates HTML reports with visualizations
 * - Provides suggestions for optimization
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

// Configuration
const config = {
  // Directory containing the build output
  buildDir: path.resolve(process.cwd(), 'dist'),
  // Directory to store reports
  reportDir: path.resolve(process.cwd(), 'bundle-reports'),
  // History file to track changes over time
  historyFile: path.resolve(process.cwd(), 'bundle-reports', 'history.json'),
  // Maximum number of history entries to keep
  maxHistoryEntries: 10,
  // Size thresholds for warnings (in bytes)
  thresholds: {
    js: {
      warning: 100 * 1024, // 100KB
      error: 250 * 1024,   // 250KB
    },
    css: {
      warning: 50 * 1024,  // 50KB
      error: 100 * 1024,   // 100KB
    },
    image: {
      warning: 200 * 1024, // 200KB
      error: 500 * 1024,   // 500KB
    },
  },
};

/**
 * Get file size information including gzipped size
 * @param {string} filePath - Path to the file
 * @returns {Object} Size information
 */
function getFileSizeInfo(filePath) {
  const stats = fs.statSync(filePath);
  const fileContents = fs.readFileSync(filePath);
  const gzippedSize = zlib.gzipSync(fileContents).length;
  
  return {
    size: stats.size,
    gzippedSize,
    path: filePath,
  };
}

/**
 * Get file extension without the dot
 * @param {string} filePath - Path to the file
 * @returns {string} File extension
 */
function getFileExtension(filePath) {
  return path.extname(filePath).slice(1).toLowerCase();
}

/**
 * Group files by type based on extension
 * @param {Array} files - List of file paths
 * @returns {Object} Files grouped by type
 */
function groupFilesByType(files) {
  const groups = {
    js: [],
    css: [],
    html: [],
    image: [],
    font: [],
    other: [],
  };
  
  files.forEach(file => {
    const ext = getFileExtension(file);
    
    if (['js', 'mjs'].includes(ext)) {
      groups.js.push(file);
    } else if (ext === 'css') {
      groups.css.push(file);
    } else if (ext === 'html') {
      groups.html.push(file);
    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif'].includes(ext)) {
      groups.image.push(file);
    } else if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext)) {
      groups.font.push(file);
    } else {
      groups.other.push(file);
    }
  });
  
  return groups;
}

/**
 * Recursively get all files in a directory
 * @param {string} dir - Directory path
 * @returns {Array} List of file paths
 */
function getAllFiles(dir) {
  let results = [];
  
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath));
    } else {
      results.push(filePath);
    }
  });
  
  return results;
}

/**
 * Check if a file size exceeds thresholds
 * @param {string} type - File type
 * @param {number} size - File size in bytes
 * @returns {string|null} Warning level or null if within limits
 */
function checkSizeThreshold(type, size) {
  const thresholds = config.thresholds[type] || config.thresholds.other;
  
  if (size > thresholds.error) {
    return 'error';
  } else if (size > thresholds.warning) {
    return 'warning';
  }
  
  return null;
}

/**
 * Format bytes to a human-readable string
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generate a report of bundle sizes
 * @returns {Object} Report data
 */
function generateReport() {
  // Create report directory if it doesn't exist
  if (!fs.existsSync(config.reportDir)) {
    fs.mkdirSync(config.reportDir, { recursive: true });
  }
  
  // Get all files in the build directory
  const allFiles = getAllFiles(config.buildDir);
  
  // Group files by type
  const fileGroups = groupFilesByType(allFiles);
  
  // Calculate size information for each file
  const sizeData = {};
  let totalSize = 0;
  let totalGzippedSize = 0;
  
  // Analyze dependencies for optimization opportunities
const dependencyAnalysis = analyzeDependencies(config.buildDir);
const optimizationSuggestions = generateOptimizationSuggestions({
  sizeData,
  dependencies: dependencyAnalysis,
  thresholds: config.thresholds
});

Object.entries(fileGroups).forEach(([type, files]) => {
  // Analyze dependencies for optimization opportunities
  const dependencyAnalysis = analyzeDependencies(config.buildDir);
  const optimizationSuggestions = generateOptimizationSuggestions({
    sizeData,
    dependencies: dependencyAnalysis,
    thresholds: config.thresholds
  });
    sizeData[type] = {
      files: [],
      totalSize: 0,
      totalGzippedSize: 0,
    };
    
    files.forEach(file => {
      const sizeInfo = getFileSizeInfo(file);
      const relativePath = path.relative(config.buildDir, file);
      const warningLevel = checkSizeThreshold(type, sizeInfo.size);
      
      sizeData[type].files.push({
        path: relativePath,
        size: sizeInfo.size,
        gzippedSize: sizeInfo.gzippedSize,
        formattedSize: formatBytes(sizeInfo.size),
        formattedGzippedSize: formatBytes(sizeInfo.gzippedSize),
        warningLevel,
      });
      
      sizeData[type].totalSize += sizeInfo.size;
      sizeData[type].totalGzippedSize += sizeInfo.gzippedSize;
      totalSize += sizeInfo.size;
      totalGzippedSize += sizeInfo.gzippedSize;
    });
    
    // Sort files by size (largest first)
    sizeData[type].files.sort((a, b) => b.size - a.size);
    
    // Add formatted total sizes
    sizeData[type].formattedTotalSize = formatBytes(sizeData[type].totalSize);
    sizeData[type].formattedTotalGzippedSize = formatBytes(sizeData[type].totalGzippedSize);
  });
  
  // Add overall totals
  sizeData.total = {
    size: totalSize,
    gzippedSize: totalGzippedSize,
    formattedSize: formatBytes(totalSize),
    formattedGzippedSize: formatBytes(totalGzippedSize),
  };
  
  return {
    timestamp: new Date().toISOString(),
    data: sizeData,
  };
}

/**
 * Update the history file with the latest report
 * @param {Object} report - The current report
 */
function updateHistory(report) {
  let history = [];
  
  // Load existing history if available
  if (fs.existsSync(config.historyFile)) {
    try {
      history = JSON.parse(fs.readFileSync(config.historyFile, 'utf8'));
    } catch (error) {
      console.error('Error reading history file:', error);
    }
  }
  
  // Add new entry
  history.push({
    timestamp: report.timestamp,
    total: report.data.total,
    js: {
      totalSize: report.data.js.totalSize,
      totalGzippedSize: report.data.js.totalGzippedSize,
    },
    css: {
      totalSize: report.data.css.totalSize,
      totalGzippedSize: report.data.css.totalGzippedSize,
    },
  });
  
  // Limit history entries
  if (history.length > config.maxHistoryEntries) {
    history = history.slice(history.length - config.maxHistoryEntries);
  }
  
  // Save updated history
  fs.writeFileSync(config.historyFile, JSON.stringify(history, null, 2));
}

/**
 * Generate an HTML report
 * @param {Object} report - The bundle report
 */
function generateHtmlReport(report) {
  const reportPath = path.join(config.reportDir, `report-${Date.now()}.html`);
  
  // Load history for trends
  let history = [];
  if (fs.existsSync(config.historyFile)) {
    try {
      history = JSON.parse(fs.readFileSync(config.historyFile, 'utf8'));
    } catch (error) {
      console.error('Error reading history file:', error);
    }
  }
  
  // Generate HTML content
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bundle Size Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      margin-top: 0;
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 15px;
      flex: 1;
      min-width: 200px;
    }
    .summary-card h3 {
      margin-top: 0;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
    .file-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .file-table th {
      text-align: left;
      padding: 10px;
      background: #f5f5f5;
      border-bottom: 2px solid #ddd;
    }
    .file-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #eee;
    }
    .file-table tr:hover {
      background: #f9f9f9;
    }
    .warning {
      color: #f39c12;
    }
    .error {
      color: #e74c3c;
    }
    .chart-container {
      height: 300px;
      margin-bottom: 30px;
    }
    .suggestions {
      background: #f8f9fa;
      border-left: 4px solid #3498db;
      padding: 15px;
      margin-bottom: 30px;
    }
    .suggestions h3 {
      margin-top: 0;
    }
    .suggestion {
      margin-bottom: 20px;
      padding: 15px;
      border-radius: 8px;
    }
    .suggestion.critical {
      background-color: #fdedec;
      border-left: 4px solid #e74c3c;
    }
    .suggestion.warning {
      background-color: #fef9e7;
      border-left: 4px solid #f39c12;
    }
    .suggestion.info {
      background-color: #eaf2f8;
      border-left: 4px solid #3498db;
    }
    .suggestion h4 {
      margin-top: 0;
      display: flex;
      align-items: center;
    }
    .suggestion h4 span {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 10px;
    }
    .suggestion.critical h4 span {
      background-color: #e74c3c;
      color: white;
    }
    .suggestion.warning h4 span {
      background-color: #f39c12;
      color: white;
    }
    .suggestion.info h4 span {
      background-color: #3498db;
      color: white;
    }
    .actions {
      margin-top: 10px;
    }
    .actions h5 {
      margin-bottom: 5px;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>Bundle Size Report</h1>
  <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
  
  <div class="summary">
    <div class="summary-card">
      <h3>Total Bundle Size</h3>
      <p>Raw: ${report.data.total.formattedSize}</p>
      <p>Gzipped: ${report.data.total.formattedGzippedSize}</p>
    </div>
    <div class="summary-card">
      <h3>JavaScript</h3>
      <p>Files: ${report.data.js.files.length}</p>
      <p>Size: ${report.data.js.formattedTotalSize}</p>
      <p>Gzipped: ${report.data.js.formattedTotalGzippedSize}</p>
    </div>
    <div class="summary-card">
      <h3>CSS</h3>
      <p>Files: ${report.data.css.files.length}</p>
      <p>Size: ${report.data.css.formattedTotalSize}</p>
      <p>Gzipped: ${report.data.css.formattedTotalGzippedSize}</p>
    </div>
    <div class="summary-card">
      <h3>Images</h3>
      <p>Files: ${report.data.image.files.length}</p>
      <p>Size: ${report.data.image.formattedTotalSize}</p>
    </div>
  </div>
  
  ${history.length > 1 ? `
  <h2>Size Trends</h2>
  <div class="chart-container">
    <canvas id="trendsChart"></canvas>
  </div>
  ` : ''}
  
  <h2>Optimization Suggestions</h2>
  <div class="suggestions">
    ${report.suggestions.map(suggestion => `
      <div class="suggestion ${suggestion.type}">
        <h4>${suggestion.title} <span>${suggestion.area}</span></h4>
        <p>${suggestion.description}</p>
        <div class="actions">
          <h5>Recommended Actions:</h5>
          <ul>
            ${suggestion.actions.map(action => `<li>${action}</li>`).join('')}
          </ul>
        </div>
      </div>
    `).join('')}
  </div>
  
  <h2>JavaScript Files</h2>
  <table class="file-table">
    <thead>
      <tr>
        <th>File</th>
        <th>Size</th>
        <th>Gzipped</th>
      </tr>
    </thead>
    <tbody>
      ${report.data.js.files.map(file => `
        <tr class="${file.warningLevel ? file.warningLevel : ''}">
          <td>${file.path}</td>
          <td>${file.formattedSize}</td>
          <td>${file.formattedGzippedSize}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>CSS Files</h2>
  <table class="file-table">
    <thead>
      <tr>
        <th>File</th>
        <th>Size</th>
        <th>Gzipped</th>
      </tr>
    </thead>
    <tbody>
      ${report.data.css.files.map(file => `
        <tr class="${file.warningLevel ? file.warningLevel : ''}">
          <td>${file.path}</td>
          <td>${file.formattedSize}</td>
          <td>${file.formattedGzippedSize}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <script>
    ${history.length > 1 ? `
    // Render trends chart
    const ctx = document.getElementById('trendsChart').getContext('2d');
    const historyData = ${JSON.stringify(history)};
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: historyData.map(entry => new Date(entry.timestamp).toLocaleDateString()),
        datasets: [
          {
            label: 'Total Size',
            data: historyData.map(entry => entry.total.size / 1024),
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderWidth: 2,
            fill: true
          },
          {
            label: 'JS Size',
            data: historyData.map(entry => entry.js.totalSize / 1024),
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            borderWidth: 2,
            fill: true
          },
          {
            label: 'CSS Size',
            data: historyData.map(entry => entry.css.totalSize / 1024),
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            borderWidth: 2,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            title: {
              display: true,
              text: 'Size (KB)'
            }
          }
        }
      }
    });
    ` : ''}
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync(reportPath, html);
  console.log(`HTML report generated: ${reportPath}`);
}

/**
 * Main function to run the bundle analyzer
 */
function run() {
  console.log('Analyzing bundle sizes...');
  
  try {
    // Generate the report
    const report = generateReport();
    
    // Update history
    updateHistory(report);
    
    // Generate HTML report
    generateHtmlReport(report);
    
    console.log('Bundle analysis complete!');
    console.log(`Total bundle size: ${report.data.total.formattedSize} (${report.data.total.formattedGzippedSize} gzipped)`);
    
    // Log warnings for large files
    let hasWarnings = false;
    
    Object.entries(report.data).forEach(([type, data]) => {
      if (type !== 'total' && data.files) {
        const largeFiles = data.files.filter(file => file.warningLevel);
        
        if (largeFiles.length > 0) {
          hasWarnings = true;
          console.log(`\nLarge ${type} files:`);
          
          largeFiles.forEach(file => {
            console.log(`- ${file.path}: ${file.formattedSize} (${file.warningLevel})`);
          });
        }
      }
    });
    
    if (!hasWarnings) {
      console.log('\nNo size warnings detected. Good job!');
    }
  } catch (error) {
    console.error('Error analyzing bundle:', error);
    process.exit(1);
  }
}

// Run the analyzer
run();

/**
 * Analyze project dependencies for optimization opportunities
 * @param {string} buildDir - Build directory path
 * @returns {Object} Analysis results
 */
function analyzeDependencies(buildDir) {
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return {
        duplicateDependencies: [],
        unusedDependencies: [],
        largePackages: []
      };
    }
    
    const packageJson = require(packageJsonPath);
    const dependencies = {
      prod: Object.keys(packageJson.dependencies || {}),
      dev: Object.keys(packageJson.devDependencies || {})
    };

    return {
      duplicateDependencies: findDuplicatePackages(buildDir),
      unusedDependencies: findUnusedDependencies(dependencies, buildDir),
      largePackages: findLargePackages(dependencies.prod)
    };
  } catch (error) {
    console.error('Error analyzing dependencies:', error);
    return {
      duplicateDependencies: [],
      unusedDependencies: [],
      largePackages: []
    };
  }
}

/**
 * Find duplicate packages in the build
 * @param {string} buildDir - Build directory path
 * @returns {Array} List of duplicate packages with versions
 */
function findDuplicatePackages(buildDir) {
  const duplicates = [];
  const packageVersions = {};
  
  try {
    // Get all JS files
    const jsFiles = getAllFiles(buildDir).filter(file => 
      getFileExtension(file) === 'js' || getFileExtension(file) === 'mjs'
    );
    
    // Simple regex to find import statements and package names
    const importRegex = /from\s+['"]([\w\-@][\w\-\/@\.]+)[\'"]/g;
    const requireRegex = /require\(['"]([\w\-@][\w\-\/@\.]+)[\'"]/g;
    
    // Scan files for imports
    jsFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      let match;
      
      // Check import statements
      while ((match = importRegex.exec(content)) !== null) {
        const packageName = match[1].split('/')[0];
        if (!packageName.startsWith('.')) {
          if (!packageVersions[packageName]) {
            packageVersions[packageName] = new Set();
          }
          packageVersions[packageName].add(file);
        }
      }
      
      // Check require statements
      while ((match = requireRegex.exec(content)) !== null) {
        const packageName = match[1].split('/')[0];
        if (!packageName.startsWith('.')) {
          if (!packageVersions[packageName]) {
            packageVersions[packageName] = new Set();
          }
          packageVersions[packageName].add(file);
        }
      }
    });
    
    // Find packages with multiple versions
    for (const [pkg, files] of Object.entries(packageVersions)) {
      if (files.size > 1) {
        duplicates.push({
          package: pkg,
          count: files.size,
          files: Array.from(files).map(f => path.relative(buildDir, f))
        });
      }
    }
    
    return duplicates;
  } catch (error) {
    console.error('Error finding duplicate packages:', error);
    return [];
  }
}

/**
 * Find unused dependencies in the project
 * @param {Object} dependencies - Project dependencies
 * @param {string} buildDir - Build directory path
 * @returns {Array} List of potentially unused dependencies
 */
function findUnusedDependencies(dependencies, buildDir) {
  const unused = [];
  const allJsContent = [];
  
  try {
    // Get all JS files
    const jsFiles = getAllFiles(buildDir).filter(file => 
      getFileExtension(file) === 'js' || getFileExtension(file) === 'mjs'
    );
    
    // Combine all JS content
    jsFiles.forEach(file => {
      allJsContent.push(fs.readFileSync(file, 'utf8'));
    });
    
    const combinedContent = allJsContent.join('\n');
    
    // Check each production dependency
    dependencies.prod.forEach(pkg => {
      // Skip common packages that might be used indirectly
      if (['react', 'react-dom', 'vue', 'astro'].includes(pkg)) {
        return;
      }
      
      // Create regex patterns to match imports
      const patterns = [
        new RegExp(`from\\s+['\"]${pkg}[\\'\"]`),
        new RegExp(`from\\s+['\"]${pkg}/`),
        new RegExp(`require\\(['\"]${pkg}[\\'\"]`),
        new RegExp(`require\\(['\"]${pkg}/`),
        new RegExp(`import\\s+['\"]${pkg}[\\'\"]`),
        new RegExp(`import\\s+['\"]${pkg}/`)
      ];
      
      // Check if any pattern matches
      const isUsed = patterns.some(pattern => pattern.test(combinedContent));
      
      if (!isUsed) {
        unused.push(pkg);
      }
    });
    
    return unused;
  } catch (error) {
    console.error('Error finding unused dependencies:', error);
    return [];
  }
}

/**
 * Find large packages in node_modules
 * @param {Array} dependencies - List of production dependencies
 * @returns {Array} List of large packages with sizes
 */
function findLargePackages(dependencies) {
  const large = [];
  const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
  
  try {
    dependencies.forEach(pkg => {
      const pkgPath = path.join(nodeModulesPath, pkg);
      
      if (fs.existsSync(pkgPath) && fs.statSync(pkgPath).isDirectory()) {
        // Get all files in the package
        const files = getAllFiles(pkgPath);
        
        // Calculate total size
        let totalSize = 0;
        files.forEach(file => {
          totalSize += fs.statSync(file).size;
        });
        
        // Check if it's a large package (> 1MB)
        if (totalSize > 1024 * 1024) {
          large.push({
            package: pkg,
            size: totalSize,
            formattedSize: formatBytes(totalSize)
          });
        }
      }
    });
    
    // Sort by size (largest first)
    large.sort((a, b) => b.size - a.size);
    
    return large;
  } catch (error) {
    console.error('Error finding large packages:', error);
    return [];
  }
}

/**
 * Generate optimization suggestions based on analysis
 * @param {Object} params - Analysis parameters
 * @returns {Array} List of optimization suggestions
 */
function generateOptimizationSuggestions({ sizeData, dependencies, thresholds }) {
  const suggestions = [];

  // Check for large JavaScript bundles
  if (sizeData.js?.totalSize > thresholds.js.warning * 2) {
    suggestions.push({
      type: 'critical',
      area: 'JavaScript',
      title: 'Large JavaScript bundles detected',
      description: 'Your JavaScript bundles exceed recommended size limits. Consider code splitting to improve initial load time.',
      actions: [
        'Implement dynamic imports for route-based code splitting',
        'Use React.lazy() or Vue's defineAsyncComponent() for component-level code splitting',
        'Consider using a lighter alternative for large dependencies'
      ]
    });
  }

  // Check for duplicate dependencies
  if (dependencies.duplicateDependencies.length > 0) {
    const duplicates = dependencies.duplicateDependencies.slice(0, 3).map(d => d.package).join(', ');
    suggestions.push({
      type: 'warning',
      area: 'Dependencies',
      title: 'Duplicate dependencies detected',
      description: `Multiple versions of the same package found (${duplicates}${dependencies.duplicateDependencies.length > 3 ? ', and more' : ''}). This increases bundle size unnecessarily.`,
      actions: [
        'Update package.json to use consistent versions',
        'Consider using npm dedupe or yarn dedupe',
        'Add resolutions field to package.json to force specific versions'
      ]
    });
  }

  // Check for unused dependencies
  if (dependencies.unusedDependencies.length > 0) {
    const unused = dependencies.unusedDependencies.slice(0, 3).join(', ');
    suggestions.push({
      type: 'info',
      area: 'Dependencies',
      title: 'Potentially unused dependencies',
      description: `Some dependencies may not be used directly (${unused}${dependencies.unusedDependencies.length > 3 ? ', and more' : ''}).`,
      actions: [
        'Review and remove unnecessary dependencies',
        'Consider using bundle analyzer to verify usage'
      ]
    });
  }

  // Check for large dependencies
  if (dependencies.largePackages.length > 0) {
    const largePackages = dependencies.largePackages.slice(0, 3).map(p => `${p.package} (${p.formattedSize})`).join(', ');
    suggestions.push({
      type: 'warning',
      area: 'Dependencies',
      title: 'Large dependencies detected',
      description: `Some dependencies are very large: ${largePackages}${dependencies.largePackages.length > 3 ? ', and more' : ''}.`,
      actions: [
        'Consider lighter alternatives where possible',
        'Import only needed components instead of the entire library',
        'Use tree-shaking compatible imports (e.g., import { x } from "y" instead of import x from "y/x")'
      ]
    });
  }

  // Check for large images
  if (sizeData.image?.files.filter(f => f.warningLevel).length > 0) {
    suggestions.push({
      type: 'warning',
      area: 'Images',
      title: 'Large images detected',
      description: 'Some images exceed recommended size limits. This can slow down page loading.',
      actions: [
        'Use responsive images with appropriate sizes for different devices',
        'Consider using modern formats like WebP or AVIF',
        'Implement proper image compression',
        'Use lazy loading for below-the-fold images'
      ]
    });
  }

  // Check for CSS size
  if (sizeData.css?.totalSize > thresholds.css.warning * 2) {
    suggestions.push({
      type: 'warning',
      area: 'CSS',
      title: 'Large CSS bundles',
      description: 'Your CSS exceeds recommended size limits.',
      actions: [
        'Consider using CSS-in-JS or CSS Modules to avoid unused styles',
        'Split CSS by route or component',
        'Remove unused CSS with tools like PurgeCSS'
      ]
    });
  }

  // Add general performance suggestions
  suggestions.push({
    type: 'info',
    area: 'Performance',
    title: 'General performance optimizations',
    description: 'Consider these general optimizations to improve performance:',
    actions: [
      'Enable tree-shaking by using ES modules and proper import syntax',
      'Implement code splitting for routes and large components',
      'Use preload for critical resources',
      'Implement proper caching strategies',
      'Consider server-side rendering or static generation for improved First Contentful Paint'
    ]
  });

  return suggestions;
}