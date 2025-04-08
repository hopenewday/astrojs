# AVIF Image Format Support

## Overview

This document describes the implementation of AVIF image format support in the project. AVIF (AV1 Image File Format) is a modern image format that offers significant file size reduction compared to JPEG and WebP while maintaining high visual quality.

## Implementation Details

The AVIF support has been implemented with the following components:

### 1. Browser Support Detection

The system uses a client-side detection mechanism to determine if a browser supports AVIF:

- `detectAvifSupport()` function in `imageOptimizer.ts` tests browser support by loading a tiny AVIF image
- Results are cached in localStorage to avoid repeated detection
- A data attribute is added to the document root for easy access to support status

### 2. Image Component Integration

All image components have been updated to use AVIF when supported:

- `Image.astro`: Main image component with full AVIF support
- `SmartImage.astro`: Enhanced image component with AVIF support
- `ResponsiveImage.astro`: Responsive image component with AVIF support

Each component checks for AVIF support and dynamically selects the appropriate format:

```javascript
// Example of format selection logic
let requestedFormat = format;
if (format === 'auto' && typeof window !== 'undefined') {
  const avifSupported = await detectAvifSupport();
  requestedFormat = avifSupported ? 'avif' : 'webp';
}
```

### 3. Client-Side Format Optimization

Two client-side scripts enhance the AVIF support:

- `avif-format-loader.js`: Automatically applies AVIF format to images when supported
- `image-format-loader.js`: Handles format selection for images with data attributes

### 4. CDN Integration

The CDN failover system has been updated to support AVIF format:

- ImageKit transformations include AVIF format option
- Format parameter is included in image URLs when AVIF is supported

## Usage

### Basic Usage

To use AVIF format with automatic fallback:

```astro
<Image
  src="/images/example.jpg"
  alt="Example image"
  format="auto"
  width={800}
  height={600}
/>
```

With `format="auto"`, the system will:
1. Detect if the browser supports AVIF
2. Use AVIF if supported
3. Fall back to WebP if AVIF is not supported
4. Fall back to JPEG if neither is supported

### Manual Format Selection

You can also explicitly specify the format:

```astro
<Image
  src="/images/example.jpg"
  alt="Example image"
  format="avif"
  width={800}
  height={600}
/>
```

Note that explicitly specifying `format="avif"` will attempt to serve AVIF regardless of browser support, which may cause images to not display in non-supporting browsers unless proper fallbacks are provided.

### Picture Element with Multiple Sources

For more control, you can use the HTML `<picture>` element with multiple sources:

```html
<picture>
  <source srcset="/images/example.avif" type="image/avif">
  <source srcset="/images/example.webp" type="image/webp">
  <img src="/images/example.jpg" alt="Example image">
</picture>
```

## Performance Benefits

AVIF typically provides:

- 50-90% smaller file sizes compared to JPEG
- 30-50% smaller file sizes compared to WebP
- Better quality-to-size ratio than other formats

This results in faster page loads, reduced bandwidth usage, and improved Core Web Vitals metrics.

## Browser Compatibility

As of the implementation date, AVIF is supported in:

- Chrome (since version 85)
- Firefox (since version 93)
- Opera (since version 71)

Not supported in:
- Safari (as of version 16)
- Internet Explorer

The implementation automatically falls back to WebP or JPEG for browsers that don't support AVIF.

## Future Improvements

Potential future enhancements:

1. Server-side detection of AVIF support via Accept headers
2. Integration with image optimization build process
3. Automated conversion of existing images to AVIF format
4. Quality/size optimization settings specific to AVIF