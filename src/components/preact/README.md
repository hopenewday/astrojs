# Preact Components

This directory contains Preact components that are used in the Astro project. These components were converted from React components to improve performance and reduce bundle size while maintaining the same functionality.

## Component List

- ThemeToggle - A component for toggling between light and dark themes
- InteractiveArticleCard - A component for displaying article cards with interactive features
- MagazineLayout - A component for rendering a complete magazine layout
- ScrollAnimation - A component for scroll-triggered animations
- OptimizedImage - A component for optimized image loading
- LazyMagazineGrid - A component for displaying articles in a magazine-style grid

## Usage with Astro

These components are designed to work with Astro's hybrid rendering approach and use client directives for hydration.

Example:
```astro
---
import ThemeToggle from "../components/preact/ThemeToggle";
---

<ThemeToggle client:load initialTheme="system" />
```