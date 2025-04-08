\n/**
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
 * Validates an AMP file using the Google AMP validator service
 */
async function validateAmpFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'text/html',
        'Content-Length': Buffer.byteLength(html)
      }
    };
    
    const req = https.request(config.validatorUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          resolve({
            filePath,
            status: result.status,
            errors: result.errors?.length || 0,
            warnings: result.warnings?.length || 0,
            issues: result.errors?.map(error => ({
              severity: error.severity,
              message: error.message,
              line: error.line,
              column: error.col,
              specUrl: error.specUrl || ''
            })) || []
          });
        } catch (error) {
          reject(new Error(`Failed to parse validator response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Failed to validate AMP file: ${error.message}`));
    });
    
    req.write(html);
    req.end();
  });
}

/**
 * Main function to validate all AMP files
 */
async function validateAmpFiles() {
  const ampFiles = findAmpFiles();
  
  if (ampFiles.length === 0) {
    console.warn('No AMP files found to validate.');
    return;
  }
  
  console.log(`Found ${ampFiles.length} AMP files to validate.`);
  
  let hasErrors = false;
  
  for (const filePath of ampFiles) {
    try {
      const result = await validateAmpFile(filePath);
      const relativePath = path.relative(process.cwd(), filePath);
      
      if (result.status === 'PASS') {
        console.log(`✅ ${relativePath}: Valid AMP`);
      } else {
        hasErrors = true;
        console.error(`❌ ${relativePath}: Invalid AMP (${result.errors} errors, ${result.warnings} warnings)`);
        
        for (const issue of result.issues) {
          console.error(`   - ${issue.severity}: ${issue.message} (line ${issue.line}, col ${issue.column})`);
          if (issue.specUrl) {
            console.error(`     See: ${issue.specUrl}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error validating ${filePath}: ${error.message}`);
      hasErrors = true;
    }
  }
  
  if (hasErrors && config.failOnError) {
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateAmpFiles().catch(error => {
    console.error(`Validation failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  validateAmpFiles,
  validateAmpFile
};