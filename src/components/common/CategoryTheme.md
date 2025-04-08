# CategoryTheme Component

`CategoryTheme.astro` is a utility component that applies category-specific theming to its children based on the provided category slug.

## Features

- Applies category-specific theme classes to wrapped content
- Works with the site's theme system (including dark mode)
- Zero impact on layout (uses `display: contents`)
- Supports all defined category themes (tech, culture, science, business, politics)

## Usage

```astro
---
import CategoryTheme from '../components/common/CategoryTheme.astro';
---

<CategoryTheme category="tech">
  <h1>Tech Article Title</h1>
  <p>This content will inherit tech-themed styling</p>
</CategoryTheme>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `category` | `string` | Yes | The category slug (e.g., 'tech', 'culture', 'science') |
| `class` | `string` | No | Optional additional class names |

## Integration

This component works with the theme system defined in `src/styles/theme.css` and applies the appropriate theme class which is used by other components throughout the application.

The theme classes applied by this component (e.g., `theme-tech`, `theme-culture`) are referenced in various stylesheets to provide category-specific styling for elements such as:

- Gradient overlays
- Link colors
- Accent elements
- Typography treatments

## Example Implementation

```astro
---
import CategoryTheme from '../components/common/CategoryTheme.astro';
import { getCollection } from 'astro:content';

// Get the article data
const { slug } = Astro.params;
const article = await getCollection('articles', ({ slug: articleSlug }) => articleSlug === slug);
const category = article.data.category;
---

<CategoryTheme category={category}>
  <article>
    <h1>{article.data.title}</h1>
    <div class="content">
      <slot />
    </div>
  </article>
</CategoryTheme>
```