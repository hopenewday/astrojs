#!/usr/bin/env node

/**
 * AMP Validation Script Runner
 * 
 * This script runs the AMP validator on all AMP pages in the project.
 * It can be used as part of the build process or manually to ensure AMP compliance.
 */

const { validateAmpFiles } = require('./amp-validator');

console.log('Starting AMP validation...');

validateAmpFiles()
  .then(() => {
    console.log('AMP validation completed successfully.');
  })
  .catch(error => {
    console.error(`AMP validation failed: ${error.message}`);
    process.exit(1);
  });