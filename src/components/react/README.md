# React Components for Astro Integration

**Note: All React components have been converted to Preact components and moved to the `../preact` directory.**

This directory previously contained React components designed to work with Astro's hybrid rendering approach. These components have been converted to Preact for better performance and smaller bundle sizes while maintaining the same functionality.

## Component Design Principles

1. **Island Architecture**: Components are designed as isolated islands of interactivity that can be independently hydrated.
2. **Progressive Enhancement**: All components work without JavaScript first, then enhance with interactivity when hydrated.
3. **Minimal Client JS**: Components are optimized to ship minimal JavaScript to the client.
4. **TypeScript Integration**: All components use TypeScript for type safety and better developer experience.
5. **Performance First**: Components are designed with Core Web Vitals in mind.

## Using These Components

When using these React components in Astro files, use the appropriate client directive to control hydration:

```astro
---
import InteractiveArticleCard from '../components/react/InteractiveArticleCard';
---

<!-- Hydrate when component becomes visible -->
<InteractiveArticleCard client:visible />

<!-- Hydrate immediately on page load -->
<InteractiveArticleCard client:load />

<!-- Hydrate when browser is idle -->
<InteractiveArticleCard client:idle />

<!-- Only hydrate on specific media query -->
<InteractiveArticleCard client:media="(max-width: 768px)" />

<!-- Only render on the client (SPA mode) -->
<InteractiveArticleCard client:only="react" />
```