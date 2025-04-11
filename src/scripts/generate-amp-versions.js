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
      console.log(`Creating output directory: ${config.ampOutputDir}`);
      fs.mkdirSync(config.ampOutputDir, { recursive: true });
    }
    
    // Get all article files
    console.log(`Scanning for articles in: ${config.articlesDir}`);
    const articleFiles = getAllFiles(config.articlesDir);
    console.log(`Found ${articleFiles.length} article(s) to process`);
    
    // Process each article
    let successCount = 0;
    let errorCount = 0;
    
    for (const articleFile of articleFiles) {
      try {
        await processArticle(articleFile);
        successCount++;
      } catch (err) {
        console.error(`Error processing article ${articleFile}:`, err);
        errorCount++;
      }
    }
    
    console.log('\nAMP generation summary:');
    console.log(`- Total articles processed: ${articleFiles.length}`);
    console.log(`- Successfully generated: ${successCount}`);
    console.log(`- Failed to generate: ${errorCount}`);
    console.log('\nAMP generation complete!');
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
  
  // Skip if no title (likely not a valid article)
  if (!frontmatter.title) {
    console.warn(`Skipping ${path.basename(articleFile)}: No title found in frontmatter`);
    return;
  }
  
  // Generate slug from frontmatter or filename
  const slug = frontmatter.slug || path.basename(articleFile, path.extname(articleFile));
  console.log(`  - Slug: ${slug}`);
  
  // Transform content to AMP-compatible HTML
  console.log(`  - Transforming content to AMP format`);
  const ampContent = ampUtils.transformToAmpHtml(body);
  
  // Generate AMP file
  const ampFilePath = path.join(config.ampOutputDir, `${slug}.astro`);
  console.log(`  - Creating AMP file: ${path.basename(ampFilePath)}`);
  
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
    // More robust YAML parsing
    const frontmatterLines = match[1].split('\n');
    const frontmatter = {};
    
    // Process each line of the frontmatter
    let currentKey = null;
    let currentValue = null;
    let inArray = false;
    let arrayItems = [];
    
    frontmatterLines.forEach(line => {
      // Skip empty lines
      if (!line.trim()) return;
      
      // Check if we're in an array and this is an array item
      if (inArray && line.trim().startsWith('- ')) {
        arrayItems.push(line.trim().substring(2).trim());
        return;
      }
      
      // If we were in an array but this line is not an array item, save the array
      if (inArray && !line.trim().startsWith('- ')) {
        frontmatter[currentKey] = arrayItems;
        inArray = false;
        arrayItems = [];
      }
      
      // Check if this is a new key
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        // Save previous key-value if exists
        if (currentKey && !inArray) {
          frontmatter[currentKey] = currentValue;
        }
        
        currentKey = line.slice(0, colonIndex).trim();
        currentValue = line.slice(colonIndex + 1).trim();
        
        // Handle empty value (might be start of an array or object)
        if (!currentValue) {
          // Check if next line might be an array
          inArray = true;
          arrayItems = [];
          return;
        }
        
        // Handle quoted strings
        if (currentValue.startsWith('"') && currentValue.endsWith('"')) {
          currentValue = currentValue.slice(1, -1);
        }
        
        // Handle nested objects (basic support)
        if (currentKey.includes('.')) {
          const keyParts = currentKey.split('.');
          let obj = frontmatter;
          for (let i = 0; i < keyParts.length - 1; i++) {
            if (!obj[keyParts[i]]) obj[keyParts[i]] = {};
            obj = obj[keyParts[i]];
          }
          obj[keyParts[keyParts.length - 1]] = currentValue;
          currentKey = null;
          currentValue = null;
        }
      } else {
        // This is a continuation of the previous value
        if (currentValue) {
          currentValue += ' ' + line.trim();
        }
      }
    });
    
    // Save the last key-value pair if exists
    if (currentKey && !inArray) {
      frontmatter[currentKey] = currentValue;
    } else if (currentKey && inArray) {
      frontmatter[currentKey] = arrayItems;
    }
    
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