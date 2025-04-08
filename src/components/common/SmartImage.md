# SmartImage Component

A unified image component with CDN failover system that automatically switches between ImageKit and Tebi S3 storage based on service availability.

## Features

- **Responsive Images**: Automatically generates `srcset` and `sizes` attributes for optimal loading
- **CDN Failover**: Seamlessly switches between ImageKit and Tebi S3 when primary CDN is unavailable
- **Lazy Loading**: Uses both native lazy loading and IntersectionObserver for enhanced performance
- **Blur-up Effect**: Implements low-quality image placeholders (LQIP) with smooth transition
- **Error Handling**: Multiple fallback strategies when images fail to load
- **Accessibility**: Proper alt text handling, screen reader support, and ARIA attributes
- **Art Direction**: Support for different image crops based on viewport size

## Usage

```astro
<SmartImage 
  src="/images/hero.jpg" 
  alt="Hero image with mountain landscape" 
  widths={[400, 800, 1200, 1600]} 
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" 
  loading="eager"
  fetchpriority="high"
  lqip={true}
  fallbackStrategy="placeholder"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | **Required** | Image source URL |
| `alt` | `string` | **Required** | Alternative text for the image |
| `widths` | `number[]` | `[400, 800, 1200, 1600]` | Array of widths for responsive images |
| `sizes` | `string` | `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw` | Sizes attribute for responsive images |
| `width` | `number` | `undefined` | Image width |
| `height` | `number` | `undefined` | Image height |
| `loading` | `'lazy' \| 'eager'` | `'lazy'` | Image loading strategy |
| `decoding` | `'async' \| 'sync' \| 'auto'` | `'async'` | Image decoding strategy |
| `quality` | `number` | `80` | Image quality (1-100) |
| `format` | `'auto' \| 'webp' \| 'avif' \| 'jpg' \| 'png'` | `'auto'` | Image format |
| `aspectRatio` | `string` | `undefined` | Aspect ratio (e.g., '16:9') |
| `crop` | `'maintain_ratio' \| 'force' \| 'at_least' \| 'at_max'` | `'maintain_ratio'` | Cropping strategy |
| `focus` | `'center' \| 'top' \| 'left' \| 'bottom' \| 'right' \| 'top_left' \| 'top_right' \| 'bottom_left' \| 'bottom_right'` | `'center'` | Focus point for cropping |
| `lqip` | `boolean` | `true` | Enable low-quality image placeholder |
| `className` | `string` | `''` | CSS class for the image |
| `style` | `string` | `''` | Inline styles for the image |
| `fetchpriority` | `'high' \| 'low' \| 'auto'` | `'auto'` | Fetch priority hint |
| `fallbackStrategy` | `'silent' \| 'placeholder' \| 'error'` | `'silent'` | Strategy for handling image loading errors |
| `objectFit` | `'contain' \| 'cover' \| 'fill' \| 'none' \| 'scale-down'` | `undefined` | Object-fit property |
| `objectPosition` | `string` | `undefined` | Object-position property |
| `draggable` | `boolean` | `false` | Whether the image is draggable |

## Fallback Strategies

- **silent**: Uses the original source as fallback (default)
- **placeholder**: Shows a placeholder image when loading fails
- **error**: Throws an error to be caught by an error boundary

## Examples

### Basic Usage

```astro
<SmartImage 
  src="/images/product.jpg" 
  alt="Product image" 
  width={800} 
  height={600} 
/>
```

### With Error Handling

```astro
<SmartImage 
  src="/images/hero.jpg" 
  alt="Hero image" 
  fallbackStrategy="placeholder" 
/>
```

### High Priority Hero Image

```astro
<SmartImage 
  src="/images/hero.jpg" 
  alt="Hero image" 
  loading="eager" 
  fetchpriority="high" 
  lqip={true} 
/>
```

### With Object Fit

```astro
<SmartImage 
  src="/images/profile.jpg" 
  alt="Profile picture" 
  width={300} 
  height={300} 
  objectFit="cover" 
  objectPosition="center" 
/>
```