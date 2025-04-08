/**
 * Script to process CMS configuration during build
 * Replaces environment variable placeholders with actual values
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const rootDir = path.resolve(__dirname, '..');
const configSrc = path.join(rootDir, 'public', 'admin', 'config.yml');
const outputDir = path.join(rootDir, 'dist', 'admin');
const configDest = path.join(outputDir, 'config.yml');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read the config template
let configContent = fs.readFileSync(configSrc, 'utf8');

// Environment variables to replace
const envVars = {
  'SVELTIA_CMS_REPO': process.env.SVELTIA_CMS_REPO || 'username/repo',
  'SVELTIA_CMS_BRANCH': process.env.SVELTIA_CMS_BRANCH || 'main',
  'IMAGEKIT_PUBLIC_KEY': process.env.IMAGEKIT_PUBLIC_KEY || '',
  'IMAGEKIT_PRIVATE_KEY': process.env.IMAGEKIT_PRIVATE_KEY || '',
  'IMAGEKIT_URL': process.env.IMAGEKIT_URL || 'https://ik.imagekit.io/your-account',
};

// Replace placeholders with actual values
Object.entries(envVars).forEach(([key, value]) => {
  const placeholder = `\${${key}}`;
  configContent = configContent.replace(new RegExp(placeholder, 'g'), value);
});

// Write processed config to output directory
fs.writeFileSync(configDest, configContent, 'utf8');

console.log('CMS config processed and written to', configDest);

// Copy other admin files
const filesToCopy = ['index.html', 'preview.css', 'preview-templates.js'];

filesToCopy.forEach(file => {
  const srcPath = path.join(rootDir, 'public', 'admin', file);
  const destPath = path.join(outputDir, file);
  
  // Only copy if file exists
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file} to ${destPath}`);
  } else {
    console.log(`Warning: ${file} not found in source directory`);
  }
});