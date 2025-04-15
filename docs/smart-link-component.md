# SmartLink Component Documentation

## Overview

The `SmartLink` component is a versatile and reusable link component for Astro.js projects that enhances standard HTML anchor tags with additional functionality:

- **Semantic Anchor Text**: Automatically generates meaningful link text based on URL structure
- **Visual Distinction**: Highlights trending or featured content with customizable styles
- **Analytics Integration**: Tracks clicks with detailed metadata for user interaction analysis
- **Accessibility**: Ensures WCAG compliance with proper ARIA attributes and keyboard navigation
- **Performance**: Supports lazy loading for improved page performance
- **Internationalization**: Seamlessly integrates with the site's i18n system
- **Customization**: Offers extensive styling options including color schemes and hover effects
- **Fallback Mechanisms**: Provides graceful degradation when link data is unavailable

## Installation

The SmartLink component is already included in your project's component library. No additional installation is required.

## Basic Usage

```astro
---
import { SmartLink } from '../components/common';
---

<!-- Basic usage with automatic semantic text generation -->
<SmartLink href="/article/my-article-slug" />

<!-- With custom text -->
<SmartLink href="/about" text="About Us" />

<!-- External link that opens in a new tab -->
<SmartLink 
  href="https://example.com" 
  text="Visit Example" 
  newTab={true} 
/>
```

## Features

### Semantic Text Generation

When no text is provided, SmartLink automatically generates meaningful text based on the URL:

```astro
<!-- Will display "Article: My Article Slug" -->
<SmartLink href="/article/my-article-slug" />

<!-- Will display "Category: Technology" -->
<SmartLink href="/category/technology" />
```

### Visual Distinction

Highlight trending or featured content:

```astro
<!-- Trending content with special styling -->
<SmartLink 
  href="/article/trending-news" 
  text="Breaking News" 
  trending={true} 
/>

<!-- Featured content with enhanced visibility -->
<SmartLink 
  href="/special-offer" 
  text="Limited Time Offer" 
  featured={true} 
/>
```

### Analytics Tracking

Track user interactions with detailed metadata:

```astro
<SmartLink 
  href="/premium-content" 
  text="Access Premium Content" 
  analyticsEvent="premium_content_click"
  analyticsData={{
    source: 'homepage',
    campaign: 'summer_promotion',
    section: 'featured'
  }}
/>
```

The component automatically tracks:
- Click timestamp
- User ID (if available)
- URL and link text
- Custom data provided in `analyticsData`

### Accessibility Features

Ensure your links are accessible to all users:

```astro
<SmartLink 
  href="/contact" 
  text="Contact Us" 
  ariaLabel="Navigate to our contact page for support"
/>
```

### Lazy Loading

Improve performance with lazy-loaded links:

```astro
<SmartLink 
  href="/large-gallery" 
  text="View Image Gallery" 
  lazyLoad={true}
  lazyThreshold={0.2} <!-- Visible at 20% of viewport -->
/>
```

### Internationalization Support

Seamlessly integrate with your site's i18n system:

```astro
<SmartLink 
  href="/es/about" 
  lang="es"
  supportedLanguages={['en', 'es', 'fr', 'de']}
  defaultLang="en"
/>
```

### Customization Options

Extensive styling options to match your site's design:

```astro
<!-- Color schemes -->
<SmartLink href="/path" text="Primary Link" colorScheme="primary" />
<SmartLink href="/path" text="Accent Link" colorScheme="accent" />

<!-- Hover effects -->
<SmartLink href="/path" text="Highlight Effect" hoverEffect="highlight" />
<SmartLink href="/path" text="Glow Effect" hoverEffect="glow" />

<!-- With icons -->
<SmartLink 
  href="/download" 
  text="Download PDF" 
  showIcon={true} 
  icon="/icons/download.svg" 
  iconPosition="before" 
/>
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | (required) | URL to link to |
| `text` | `string` | (auto-generated) | Link text content |
| `ariaLabel` | `string` | `undefined` | Alternative text for screen readers |
| `trending` | `boolean` | `false` | Whether this link points to trending content |
| `featured` | `boolean` | `false` | Whether this link points to featured content |
| `class` | `string` | `''` | Custom CSS class to apply to the link |
| `newTab` | `boolean` | `false` | Whether to open link in a new tab |
| `nofollow` | `boolean` | `false` | Whether to add nofollow attribute |
| `sponsored` | `boolean` | `false` | Whether to add sponsored attribute |
| `ugc` | `boolean` | `false` | Whether to add ugc attribute |
| `lazyLoad` | `boolean` | `false` | Whether to enable lazy loading of the link |
| `lazyThreshold` | `number` | `0.1` | Threshold for lazy loading (0-1) |
| `analyticsData` | `object` | `{}` | Custom data to include in analytics events |
| `analyticsEvent` | `string` | `'link_click'` | Custom event name for analytics tracking |
| `colorScheme` | `string` | `'primary'` | Color scheme (primary, secondary, accent, etc.) |
| `hoverEffect` | `string` | `'underline'` | Hover effect (underline, highlight, scale, glow, none) |
| `lang` | `string` | `'en'` | Current language code for i18n support |
| `supportedLanguages` | `string[]` | `['en']` | Supported languages for i18n |
| `defaultLang` | `string` | `'en'` | Default language |
| `fallbackText` | `string` | `'Read more'` | Fallback text if link data is unavailable |
| `disabled` | `boolean` | `false` | Whether to disable the link |
| `showIcon` | `boolean` | `false` | Whether to show an icon |
| `icon` | `string` | `''` | Icon name or URL |
| `iconPosition` | `string` | `'after'` | Icon position (before or after text) |

## Examples

See the demo page at `/examples/smart-link-demo` for interactive examples of all features.

## Integration with Analytics

The SmartLink component automatically integrates with the site's analytics system. It works with:

1. The built-in Umami analytics (if enabled)
2. The custom `trackEvent` function (if available)

No additional configuration is needed if these systems are already set up.

## Best Practices

1. **Semantic Text**: Let SmartLink generate text when appropriate, but provide explicit text for important calls-to-action
2. **Accessibility**: Always provide `ariaLabel` for links with non-descriptive text
3. **Analytics**: Use custom `analyticsEvent` names for important links to make data analysis easier
4. **Performance**: Enable `lazyLoad` for links below the fold, especially on pages with many links
5. **Visual Distinction**: Use `trending` and `featured` sparingly to maintain their impact

## Troubleshooting

### Link text is not what I expected

The automatic text generation relies on URL structure. If the generated text is not appropriate, explicitly provide the `text` prop.

### Analytics events are not being tracked

Ensure that:
1. The Umami analytics component is included in your layout
2. User has given consent for analytics (if consent is required)
3. The browser is not blocking analytics scripts

### Icons are not displaying

Verify that:
1. The icon path is correct
2. The icon file exists in the specified location
3. Both `showIcon` and `icon` props are provided

## Contributing

To enhance the SmartLink component:

1. Update the component in `src/components/common/SmartLink.astro`
2. Update type definitions in `src/components/common/SmartLink.d.ts` if adding new props
3. Test thoroughly with different configurations
4. Update this documentation with any new features or changes