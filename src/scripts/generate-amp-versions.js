/**
 * Generate AMP Versions Script
 * 
 * This script generates AMP versions of articles by transforming regular HTML content
 * to AMP-compatible format and ensuring all AMP requirements are met.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import AMP utilities
const ampUtils = require('../utils/ampUtils');

// Configuration
const config = {
  // Source directory for articles
  articlesDir: path.resolve(process.cwd(), 'content/articles'),
  // Output directory for AMP versions
  ampOutputDir: path.resolve(process.cwd(), 'src/pages/article/amp'),
  // Template for AMP articles
  ampTemplate: path.resolve(process.cwd(), 'src/templates/amp-article.template.astro'),
};

/**
 * Main function to generate AMP versions of articles
 */
async function generateAmpVersions() {
  console.log('Generating AMP versions of articles...');
  
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(config.ampOutputDir)) {
      fs.mkdirSync(config.ampOutputDir, { recursive: true });
    }
    
    // Get all article files
    const articleFiles = getAllFiles(config.articlesDir);
    
    // Process each article
    for (const articleFile of articleFiles) {
      await processArticle(articleFile);
    }
    
    console.log('AMP generation complete!');
  } catch (error) {
    console.error('Error generating AMP versions:', error);
    process.exit(1);
  }
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
      // Only include markdown files
      if (filePath.endsWith('.md')) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

/**
 * Process an article to create its AMP version
 * @param {string} articleFile - Path to the article file
 */
async function processArticle(articleFile) {
  console.log(`Processing: ${path.basename(articleFile)}`);
  
  // Read article content
  const content = fs.readFileSync(articleFile, 'utf8');
  
  // Parse frontmatter and content
  const { frontmatter, body } = parseFrontmatter(content);
  
  // Generate slug from filename if not in frontmatter
  const slug = frontmatter.slug || path.basename(articleFile, path.extname(articleFile));
  
  // Transform content to AMP-compatible HTML
  const ampContent = ampUtils.transformToAmpHtml(body);
  
  // Generate AMP file
  const ampFilePath = path.join(config.ampOutputDir, `${slug}.astro`);
  
  // Check if template exists
  if (!fs.existsSync(config.ampTemplate)) {
    // If template doesn't exist, create a basic AMP article file
    const ampFileContent = generateBasicAmpFile(frontmatter, ampContent, slug);
    fs.writeFileSync(ampFilePath, ampFileContent);
  } else {
    // Use template if available
    let templateContent = fs.readFileSync(config.ampTemplate, 'utf8');
    
    // Replace placeholders in template
    templateContent = templateContent
      .replace('{{title}}', frontmatter.title || 'Untitled Article')
      .replace('{{description}}', frontmatter.description || '')
      .replace('{{slug}}', slug)
      .replace('{{content}}', ampContent)
      .replace('{{publishDate}}', frontmatter.publishDate || new Date().toISOString())
      .replace('{{modifiedDate}}', frontmatter.modifiedDate || frontmatter.publishDate || new Date().toISOString())
      .replace('{{author}}', JSON.stringify(frontmatter.author || {}))
      .replace('{{category}}', JSON.stringify(frontmatter.category || {}))
      .replace('{{tags}}', JSON.stringify(frontmatter.tags || []));
    
    fs.writeFileSync(ampFilePath, templateContent);
  }
  
  console.log(`Created AMP version: ${ampFilePath}`);
}

/**
 * Parse frontmatter and content from a markdown file
 * @param {string} content - File content
 * @returns {Object} Parsed frontmatter and body
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {
      frontmatter: {},
      body: content
    };
  }
  
  try {
    // Simple YAML parsing (in a real implementation, use a proper YAML parser)
    const frontmatterLines = match[1].split('\n');
    const frontmatter = {};
    
    frontmatterLines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const key = line.slice(0, colonIndex).trim();
        let value = line.slice(colonIndex + 1).trim();
        
        // Handle quoted strings
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        frontmatter[key] = value;
      }
    });
    
    return {
      frontmatter,
      body: match[2]
    };
  } catch (error) {
    console.error('Error parsing frontmatter:', error);
    return {
      frontmatter: {},
      body: content
    };
  }
}

/**
 * Generate a basic AMP article file if no template is available
 * @param {Object} frontmatter - Article frontmatter
 * @param {string} content - AMP-compatible content
 * @param {string} slug - Article slug
 * @returns {string} AMP article file content
 */
function generateBasicAmpFile(frontmatter, content, slug) {
  return `---
import AmpArticleLayout from "../../../layouts/AmpArticleLayout.astro";

// Article data
const article = {
  slug: "${slug}",
  title: "${frontmatter.title || 'Untitled Article'}",
  description: "${frontmatter.description || ''}",
  image: "${frontmatter.image || '/images/placeholder.jpg'}",
  publishDate: new Date("${frontmatter.publishDate || new Date().toISOString()}"),
  modifiedDate: new Date("${frontmatter.modifiedDate || frontmatter.publishDate || new Date().toISOString()}"),
  author: ${JSON.stringify(frontmatter.author || { name: 'Anonymous' })},
  category: ${JSON.stringify(frontmatter.category || { name: 'Uncategorized', slug: 'uncategorized' })},
  tags: ${JSON.stringify(frontmatter.tags || [])},
  content: `${content}`
};

// Generate canonical URL
const canonicalUrl = new URL(`/article/${slug}`, Astro.site).toString();
---

<AmpArticleLayout
  title={article.title}
  description={article.description}
  image={article.image}
  canonicalURL={canonicalUrl}
  pubDate={article.publishDate}
  modDate={article.modifiedDate}
  author={article.author.name}
  category={article.category}
  tags={article.tags}
  content={article.content}
/>
`;
}

// Run the generator
generateAmpVersions();