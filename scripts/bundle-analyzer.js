/**
 * Bundle Size Analyzer
 * 
 * This script analyzes the size of JavaScript and CSS bundles after the build process.
 * It provides insights into bundle sizes, helps identify large dependencies,
 * and tracks size changes over time.
 * 
 * Usage:
 * - Run after build: `node scripts/bundle-analyzer.js`
 * - Can be integrated into CI/CD pipelines
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const chalk = require('chalk'); // For colorful console output

// Configuration
const config = {
  // Directory containing the built assets
  distDir: path.join(process.cwd(), 'dist'),
  
  // Output file for the report
  reportFile: path.join(process.cwd(), 'bundle-stats.json'),
  
  // History file to track changes over time
  historyFile: path.join(process.cwd(), '.bundle-history.json'),
  
  // Size thresholds in bytes
  thresholds: {
    js: {
      warning: 100 * 1024, // 100 KB
      error: 250 * 1024,   // 250 KB
    },
    css: {
      warning: 50 * 1024,  // 50 KB
      error: 100 * 1024,   // 100 KB
    },
  },
  
  // Maximum number of history entries to keep
  maxHistoryEntries: 10,
};

/**
 * Get the size of a file in various formats
 * @param {string} filePath - Path to the file
 * @returns {Object} - Object containing size information
 */
function getFileSize(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = zlib.gzipSync(content);
  const brotli = zlib.brotliCompressSync(content);
  
  return {
    raw: content.length,
    gzip: gzipped.length,
    brotli: brotli.length,
  };
}

/**
 * Format a size in bytes to a human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Get the type of a file based on its extension
 * @param {string} filePath - Path to the file
 * @returns {string} - File type
 */
function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.js' || ext === '.mjs') return 'js';
  if (ext === '.css') return 'css';
  if (ext === '.html') return 'html';
  if (ext === '.svg') return 'svg';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'].includes(ext)) return 'image';
  if (['.woff', '.woff2', '.ttf', '.otf'].includes(ext)) return 'font';
  return 'other';
}

/**
 * Check if a file exceeds the size threshold
 * @param {string} type - File type
 * @param {number} size - File size in bytes
 * @returns {string|null} - Status if threshold is exceeded, null otherwise
 */
function checkThreshold(type, size) {
  if (!config.thresholds[type]) return null;
  
  if (size > config.thresholds[type].error) return 'error';
  if (size > config.thresholds[type].warning) return 'warning';
  return null;
}

/**
 * Recursively scan a directory for files
 * @param {string} dir - Directory to scan
 * @param {Array} result - Array to store results
 * @returns {Array} - Array of file paths
 */
function scanDirectory(dir, result = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath, result);
    } else {
      result.push(filePath);
    }
  }
  
  return result;
}

/**
 * Analyze the bundle sizes
 * @returns {Object} - Analysis results
 */
function analyzeBundles() {
  console.log(chalk.blue('\n📦 Analyzing bundle sizes...'));
  
  // Check if the dist directory exists
  if (!fs.existsSync(config.distDir)) {
    console.error(chalk.red(`Error: Directory '${config.distDir}' does not exist. Run the build first.`));
    process.exit(1);
  }
  
  // Scan the directory for files
  const files = scanDirectory(config.distDir);
  
  // Group files by type
  const filesByType = {};
  let totalSize = 0;
  let totalGzipSize = 0;
  let totalBrotliSize = 0;
  
  for (const file of files) {
    const relativePath = path.relative(config.distDir, file);
    const type = getFileType(file);
    const sizes = getFileSize(file);
    const thresholdStatus = checkThreshold(type, sizes.raw);
    
    filesByType[type] = filesByType[type] || [];
    filesByType[type].push({
      path: relativePath,
      sizes,
      thresholdStatus,
    });
    
    totalSize += sizes.raw;
    totalGzipSize += sizes.gzip;
    totalBrotliSize += sizes.brotli;
  }
  
  // Sort files by size within each type
  for (const type in filesByType) {
    filesByType[type].sort((a, b) => b.sizes.raw - a.sizes.raw);
  }
  
  // Generate the report
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    totalFiles: files.length,
    totalSize,
    totalGzipSize,
    totalBrotliSize,
    filesByType,
  };
  
  // Save the report
  fs.writeFileSync(config.reportFile, JSON.stringify(report, null, 2));
  
  // Update history
  updateHistory(report);
  
  return report;
}

/**
 * Update the bundle size history
 * @param {Object} report - Current report
 */
function updateHistory(report) {
  let history = [];
  
  // Load existing history if available
  if (fs.existsSync(config.historyFile)) {
    try {
      history = JSON.parse(fs.readFileSync(config.historyFile, 'utf8'));
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not parse history file: ${error.message}`));
    }
  }
  
  // Add the new entry
  const historyEntry = {
    timestamp: report.timestamp,
    totalSize: report.totalSize,
    totalGzipSize: report.totalGzipSize,
    totalBrotliSize: report.totalBrotliSize,
    fileCountByType: {},
  };
  
  // Count files by type
  for (const type in report.filesByType) {
    historyEntry.fileCountByType[type] = report.filesByType[type].length;
  }
  
  // Add to history and limit the number of entries
  history.unshift(historyEntry);
  if (history.length > config.maxHistoryEntries) {
    history = history.slice(0, config.maxHistoryEntries);
  }
  
  // Save the updated history
  fs.writeFileSync(config.historyFile, JSON.stringify(history, null, 2));
}

/**
 * Print the analysis report to the console
 * @param {Object} report - Analysis report
 */
function printReport(report) {
  console.log(chalk.green('\n✅ Bundle analysis complete!'));
  console.log(chalk.blue(`\nTotal Files: ${report.totalFiles}`));
  console.log(chalk.blue(`Total Size: ${formatSize(report.totalSize)} (Gzip: ${formatSize(report.totalGzipSize)}, Brotli: ${formatSize(report.totalBrotliSize)})`));
  
  // Print files by type
  for (const type in report.filesByType) {
    const files = report.filesByType[type];
    console.log(chalk.yellow(`\n${type.toUpperCase()} (${files.length} files):`));
    
    // Print the top 5 largest files of each type
    const topFiles = files.slice(0, 5);
    for (const file of topFiles) {
      const sizeStr = formatSize(file.sizes.raw);
      const gzipStr = formatSize(file.sizes.gzip);
      const brotliStr = formatSize(file.sizes.brotli);
      
      let output = `  ${file.path}: ${sizeStr} (Gzip: ${gzipStr}, Brotli: ${brotliStr})`;
      
      if (file.thresholdStatus === 'warning') {
        output = chalk.yellow(output);
      } else if (file.thresholdStatus === 'error') {
        output = chalk.red(output);
      }
      
      console.log(output);
    }
    
    // If there are more files, show a summary
    if (files.length > 5) {
      console.log(chalk.gray(`  ... and ${files.length - 5} more`));
    }
  }
  
  console.log(chalk.blue(`\nDetailed report saved to: ${config.reportFile}`));
}

/**
 * Compare with the previous build if available
 * @param {Object} report - Current report
 */
function compareWithPrevious(report) {
  if (!fs.existsSync(config.historyFile)) return;
  
  try {
    const history = JSON.parse(fs.readFileSync(config.historyFile, 'utf8'));
    
    if (history.length < 2) return;
    
    const current = history[0];
    const previous = history[1];
    
    const sizeDiff = current.totalSize - previous.totalSize;
    const gzipDiff = current.totalGzipSize - previous.totalGzipSize;
    const brotliDiff = current.totalBrotliSize - previous.totalBrotliSize;
    
    console.log(chalk.blue('\nComparison with previous build:'));
    
    // Total size difference
    if (sizeDiff > 0) {
      console.log(chalk.red(`Total Size: +${formatSize(sizeDiff)}`));
    } else if (sizeDiff < 0) {
      console.log(chalk.green(`Total Size: -${formatSize(Math.abs(sizeDiff))}`));
    } else {
      console.log(chalk.gray('Total Size: No change'));
    }
    
    // Gzip size difference
    if (gzipDiff > 0) {
      console.log(chalk.red(`Gzip Size: +${formatSize(gzipDiff)}`));
    } else if (gzipDiff < 0) {
      console.log(chalk.green(`Gzip Size: -${formatSize(Math.abs(gzipDiff))}`));
    } else {
      console.log(chalk.gray('Gzip Size: No change'));
    }
    
    // Brotli size difference
    if (brotliDiff > 0) {
      console.log(chalk.red(`Brotli Size: +${formatSize(brotliDiff)}`));
    } else if (brotliDiff < 0) {
      console.log(chalk.green(`Brotli Size: -${formatSize(Math.abs(brotliDiff))}`));
    } else {
      console.log(chalk.gray('Brotli Size: No change'));
    }
  } catch (error) {
    console.warn(chalk.yellow(`Warning: Could not compare with previous build: ${error.message}`));
  }
}

// Main execution
try {
  const report = analyzeBundles();
  printReport(report);
  compareWithPrevious(report);
} catch (error) {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
}