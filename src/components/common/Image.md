# Image Component

A unified image component with CDN failover system that automatically switches between ImageKit and Tebi S3 storage based on service availability.

## Features

- **Responsive Images**: Automatically generates `srcset` and `sizes` attributes for optimal loading
- **CDN Failover**: Seamlessly switches between ImageKit and Tebi S3 when primary CDN is unavailable
- **Low-Quality Image Placeholders (LQIP)**: Implements blur-up loading technique for better UX
- **Art Direction**: Supports different image crops for different screen sizes
- **Lazy Loading**: Uses both native lazy loading and IntersectionObserver for enhanced performance
- **Error Handling**: Multiple fallback strategies when images fail to load
- **Accessibility**: Enforces alt text and provides proper image loading behavior

## Usage

### Basic Usage

```astro
<Image 
  src="/images/hero.jpg" 
  alt="Hero image" 
  width={800} 
  height={600} 
/>
```

### Responsive Images

```astro
<Image 
  src="/images/hero.jpg" 
  alt="Hero image" 
  widths={[400, 800, 1200, 1600]} 
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" 
/>
```

### Art Direction

```astro
<Image 
  src="/images/hero-desktop.jpg" 
  alt="Hero image" 
  artDirected={[
    {
      media: "(max-width: 640px)",
      src: "/images/hero-mobile.jpg",
      widths: [300, 600]
    }
  ]}
/>
```

### Error Handling

```astro
<Image 
  src="/images/hero.jpg" 
  alt="Hero image" 
  fallbackStrategy="placeholder" 
/>
```

### High Priority Images

```astro
<Image 
  src="/images/hero.jpg" 
  alt="Hero image" 
  loading="eager" 
  fetchpriority="high" 
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
| `className` | `string` | `''` | CSS class name |
| `style` | `string` | `''` | Inline CSS styles |
| `fetchpriority` | `'high' \| 'low' \| 'auto'` | `'auto'` | Fetch priority hint |
| `artDirected` | `Array<{media: string, src: string, widths?: number[]}>` | `[]` | Art-directed images for different screen sizes |
| `fallbackStrategy` | `'silent' \| 'placeholder' \| 'error'` | `'silent'` | Strategy for handling image loading errors |
| `objectFit` | `'contain' \| 'cover' \| 'fill' \| 'none' \| 'scale-down'` | `undefined` | Object-fit property |
| `objectPosition` | `string` | `undefined` | Object-position property |
| `draggable` | `boolean` | `false` | Whether the image is draggable |

## Fallback Strategies

- **silent**: Uses the original source as fallback (default)
- **placeholder**: Shows a placeholder image when loading fails
- **error**: Throws an error to be caught by an error boundary

## Performance Considerations

- Use appropriate `widths` and `sizes` attributes for responsive images
- Set `loading="eager"` and `fetchpriority="high"` for above-the-fold images
- Provide `width` and `height` attributes to prevent layout shifts
- Use WebP or AVIF formats for better compression
- Consider art direction for critical images on different devices