# Common Components

This directory contains reusable components that are used throughout the application. These components are designed to be modular, accessible, and follow best practices for web development.

## Components Overview

### Head.astro
A component for managing SEO metadata, favicon, and theme-color in the document head.

**Features:**
- Dynamic meta tag generation
- Open Graph and Twitter card support
- Favicon and theme color management
- Preconnect to external domains for performance

### SkipToContent.astro
An accessibility component that allows keyboard users to skip navigation and jump directly to the main content.

**Features:**
- Visually hidden until focused
- Customizable target and text
- Styled with appropriate contrast

### Breadcrumbs.astro
A navigation component that shows the current page location within the site hierarchy.

**Features:**
- Schema-ready breadcrumb navigation with JSON-LD
- Responsive design
- Accessible with proper ARIA attributes

### ErrorBoundary.astro
A component for handling runtime errors with fallbacks to prevent the entire application from crashing.

**Features:**
- Client-side error catching
- Customizable fallback UI
- Retry functionality
- Error logging

### Image.astro
A unified image component with CDN failover system.

**Features:**
- Responsive images with srcset and sizes
- Automatic CDN failover between ImageKit and Tebi
- Low-quality image placeholders (LQIP) with blur-up effect
- Art direction support with different crops
- Lazy loading with IntersectionObserver

### ResponsiveImage.astro
A specialized image component focused on responsive image delivery.

**Features:**
- Responsive images with srcset and sizes attributes
- Automatic CDN failover
- Optimized image loading

### SmartImage.astro
An enhanced image component with additional features for advanced use cases.

**Features:**
- Responsive images with srcset and sizes
- Lazy loading with IntersectionObserver
- Blur-up loading technique with blurhash placeholders
- Art direction support with different crops
- Error handling with multiple fallback strategies

## Usage Guidelines

1. Always provide alt text for images for accessibility
2. Use ErrorBoundary for components that fetch external data
3. Include SkipToContent at the top of your layout for keyboard accessibility
4. Use the appropriate image component based on your specific needs:
   - Image.astro: For general use cases with full feature set
   - ResponsiveImage.astro: For simpler responsive image needs
   - SmartImage.astro: For advanced use cases with blurhash and art direction

## Examples

```astro
<!-- Basic Head usage -->
<Head 
  title="Article Title" 
  description="Article description" 
  image="/path/to/image.jpg" 
/>

<!-- Skip to content -->
<SkipToContent href="#main-content" />

<!-- Breadcrumbs -->
<Breadcrumbs 
  items={[
    { text: 'Home', href: '/' },
    { text: 'Category', href: '/category' },
    { text: 'Current Page', href: '/category/page' }
  ]} 
/>

<!-- Error Boundary -->
<ErrorBoundary fallback="Something went wrong loading this component.">
  <DynamicComponent />
</ErrorBoundary>

<!-- Image with CDN failover -->
<Image 
  src="/images/article.jpg" 
  alt="Article featured image" 
  widths={[400, 800, 1200]} 
  sizes="(max-width: 768px) 100vw, 50vw" 
/>
```