# AMP Implementation Guide

This document provides a comprehensive guide to the Accelerated Mobile Pages (AMP) implementation in this project. AMP is a web component framework that enables the creation of fast-loading, mobile-optimized web pages.

## Overview

The AMP implementation in this project includes:

1. **AMP Versions for All Articles**: Every article has an AMP-compatible version that follows AMP HTML specifications.
2. **Automatic Device Detection**: Mobile users are automatically redirected to AMP versions for better performance.
3. **Fallback Mechanism**: Browsers that don't support AMP are redirected to standard versions.
4. **Build Integration**: AMP generation is integrated into the build process.
5. **SEO Optimization**: Proper canonical and amphtml links for search engine optimization.

## Directory Structure

```
src/
  ├── layouts/
  │   ├── AmpBaseLayout.astro     # Base layout for all AMP pages
  │   └── AmpArticleLayout.astro   # Specific layout for AMP article pages
  ├── middleware/
  │   └── ampMiddleware.ts        # Handles AMP/non-AMP routing based on device
  ├── pages/
  │   ├── article/
  │   │   └── amp/                # AMP versions of articles
  │   └── amp/                    # Other AMP pages (categories, tags, etc.)
  ├── scripts/
  │   ├── generate-amp-versions.js # Generates AMP versions of all articles
  │   └── build-with-amp.js        # Integrates AMP generation into build
  ├── templates/
  │   └── amp-article.template.astro # Template for generating AMP articles
  └── utils/
      ├── ampUtils.ts             # Core AMP transformation utilities
      ├── ampDetection.ts         # Browser/device detection for AMP
      └── ampSitemapGenerator.ts  # Generates sitemaps with AMP references
```

## How It Works

### 1. Content Transformation

The `ampUtils.ts` utility transforms regular HTML content into AMP-compatible format:

- Replaces `<img>` with `<amp-img>`
- Replaces `<iframe>` with `<amp-iframe>` or `<amp-youtube>`
- Replaces `<video>` with `<amp-video>`
- Replaces `<audio>` with `<amp-audio>`
- Removes disallowed elements and attributes

### 2. Device Detection & Routing

The `ampMiddleware.ts` middleware handles routing between AMP and non-AMP versions:

- Detects mobile devices and redirects them to AMP versions
- Identifies browsers that don't support AMP and redirects them to standard versions
- Respects user preferences (e.g., `?noamp=1` parameter to force standard version)

### 3. Fallback Mechanism

A client-side fallback script is included in all AMP pages to handle edge cases:

- Detects browsers with known AMP compatibility issues
- Automatically redirects to the canonical (non-AMP) version when necessary
- Ensures users always get a functional experience

### 4. AMP Generation Process

The `generate-amp-versions.js` script:

1. Scans the content directory for articles
2. Transforms each article's content to AMP format
3. Creates AMP versions in the appropriate directory
4. Also processes articles from the CMS/API if available

## Usage

### Generating AMP Versions

To generate AMP versions of all articles:

```bash
npm run generate:amp
```

To include AMP generation in the build process:

```bash
npm run build:amp
```

### Testing AMP Pages

1. Open any article page on a mobile device or mobile emulator
2. You should be automatically redirected to the AMP version
3. To force the standard version, add `?noamp=1` to the URL
4. To test the fallback mechanism, add `?amp=0` to the URL

### Validating AMP Pages

To validate your AMP pages:

1. Open an AMP page in Chrome
2. Add `#development=1` to the URL
3. Open Chrome DevTools to see validation results
4. Or use the [AMP Validator](https://validator.ampproject.org/)

## Customization

### Modifying AMP Templates

To customize the appearance of AMP pages:

1. Edit `src/layouts/AmpBaseLayout.astro` for global changes
2. Edit `src/layouts/AmpArticleLayout.astro` for article-specific changes
3. Update the styles in the `<style amp-custom>` section

### Adjusting Device Detection

To modify when users are redirected to AMP versions:

1. Edit `src/utils/ampDetection.ts`
2. Adjust the `shouldServeAmp` function to change the detection logic

## SEO Considerations

The implementation includes proper SEO optimizations:

- Each AMP page includes a `<link rel="canonical">` pointing to the standard version
- Each standard page includes a `<link rel="amphtml">` pointing to the AMP version
- Sitemaps include references to both versions with appropriate annotations

## Troubleshooting

### Common Issues

1. **AMP Validation Errors**: Check the browser console or use the AMP validator to identify specific issues
2. **Redirect Loops**: Ensure the middleware detection logic doesn't create infinite redirects
3. **Missing AMP Versions**: Run `npm run generate:amp` to ensure all articles have AMP versions

### Debugging

To debug AMP-related issues:

1. Add `?debug=1` to the URL to enable additional logging
2. Check the browser console for AMP-specific messages
3. Inspect the network tab to verify redirects are working correctly

## Performance Monitoring

The AMP implementation includes performance monitoring:

- Web Vitals tracking is integrated into AMP pages
- Performance metrics are collected and can be analyzed
- Compare AMP vs non-AMP performance to verify improvements

## Future Enhancements

Potential improvements to consider:

1. Add support for AMP-specific analytics
2. Implement AMP cache preconnect for faster loading
3. Enhance AMP styles for better visual consistency with standard pages
4. Add more advanced AMP components like `amp-list` for dynamic content