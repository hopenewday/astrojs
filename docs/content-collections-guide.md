# Content Collections Guide

This guide explains how to work with the content collections in the ChakrirChain Astro.js project. Content collections provide a type-safe way to work with Markdown or MDX content in your Astro project.

## Overview

The project uses Astro's content collections feature to organize and validate content. The following collections are available:

- **Articles**: Blog posts and feature articles
- **Authors**: Writer profiles with biographical information
- **Categories**: Content organization with custom theming
- **Pages**: Static pages like About, Contact, etc.

## Collection Schema

Each collection has a defined schema that validates the frontmatter of your Markdown files. The schemas are defined in `src/content/config.ts`.

### Articles Collection

Articles represent blog posts and feature content. They include metadata like title, description, author, category, and featured image.

```typescript
// Example article frontmatter
---
title: "The Future of Web Development"
description: "Exploring emerging trends in web development"
publishDate: 2024-06-15
author: alex-johnson
category: technology
featured: true
draft: false
image:
  src: "/images/web-dev-future.jpg"
  alt: "Futuristic web development concept"
  caption: "The evolving landscape of web development"
  credit: "ChakrirChain Design Team"
tags:
  - web development
  - technology
  - trends
readingTime: 8
wordCount: 1500
---
```

### Authors Collection

Authors represent content creators with biographical information and social links.

```typescript
// Example author frontmatter
---
name: "Alex Johnson"
title: "Senior Web Developer"
bio: "Alex is a senior web developer with 10 years of experience."
avatar:
  src: "/images/alex-johnson.jpg"
  alt: "Alex Johnson"
social:
  twitter: "https://twitter.com/alexjohnson"
  github: "https://github.com/alexjohnson"
  linkedin: "https://linkedin.com/in/alexjohnson"
  website: "https://alexjohnson.dev"
featured: true
---
```

### Categories Collection

Categories organize content and provide custom theming options.

```typescript
// Example category frontmatter
---
name: "Technology"
description: "Explore the latest in tech innovations"
color: "#3b82f6"
image:
  src: "/images/technology.jpg"
  alt: "Technology category image"
featured: true
order: 1
---
```

### Pages Collection

Pages represent static content like About, Contact, etc.

```typescript
// Example page frontmatter
---
title: "About Us"
description: "Learn about our mission and team"
publishDate: 2024-06-01
updatedDate: 2024-06-10
image:
  src: "/images/about-us.jpg"
  alt: "Our team"
draft: false
layout: "wide"
showToc: true
showComments: false
noindex: false
---
```

## Working with Collections

### Querying Collections

You can query collections in your Astro components using the `getCollection` and `getEntry` functions:

```astro
---
import { getCollection, getEntry } from 'astro:content';

// Get all published articles
const publishedArticles = await getCollection('articles', ({ data }) => {
  return !data.draft;
});

// Get a specific article by slug
const article = await getEntry('articles', 'my-article-slug');

// Get all featured authors
const featuredAuthors = await getCollection('authors', ({ data }) => {
  return data.featured;
});

// Get a specific category
const category = await getEntry('categories', 'technology');
---
```

### Rendering Content

To render the content of a collection entry, you need to use the `render()` method:

```astro
---
import { getEntry } from 'astro:content';

const article = await getEntry('articles', 'my-article-slug');
const { Content } = await article.render();
---

<h1>{article.data.title}</h1>
<p>{article.data.description}</p>
<Content />
```

### Relationships Between Collections

Collections can reference each other. For example, an article references an author and a category:

```astro
---
import { getEntry } from 'astro:content';

const article = await getEntry('articles', 'my-article-slug');

// Get the author of the article
const author = await getEntry('authors', article.data.author);

// Get the category of the article
const category = await getEntry('categories', article.data.category);
---

<h1>{article.data.title}</h1>
<p>Written by: {author.data.name}</p>
<p>Category: {category.data.name}</p>
```

## CMS Integration

The content collections are integrated with Sveltia CMS, allowing editors to manage content through a user-friendly interface at `/admin`.

The CMS configuration in `public/admin/config.yml` defines the fields and validation rules for each collection, matching the schema defined in `src/content/config.ts`.

### Adding New Content

To add new content:

1. Navigate to `/admin` in your browser
2. Log in with your credentials
3. Select the collection you want to add to (Articles, Authors, Categories, or Pages)
4. Click the "New [Collection]" button
5. Fill in the required fields
6. Click "Save" to save as a draft or "Publish" to publish immediately

### Editorial Workflow

The CMS uses an editorial workflow with these stages:

1. **Draft**: Initial content creation
2. **Review**: Content ready for editorial review
3. **Ready**: Approved and ready to publish
4. **Published**: Live on the site

## Best Practices

1. **Use Slugs Consistently**: Slugs should be lowercase, use hyphens instead of spaces, and be descriptive but concise.
2. **Optimize Images**: Compress images before uploading to improve performance.
3. **Link Related Content**: Use the `relatedArticles` field to connect articles on similar topics.
4. **Keep Categories Focused**: Create categories that are specific enough to be meaningful but broad enough to contain multiple articles.
5. **Update Content Regularly**: Use the `updatedDate` field to indicate when content has been significantly revised.

## Troubleshooting

### Schema Validation Errors

If you encounter schema validation errors when building the site, check that your content frontmatter matches the required schema. Common issues include:

- Missing required fields
- Incorrect data types
- Invalid date formats
- Missing nested properties

### CMS Preview Issues

If the CMS preview doesn't match the frontend appearance:

1. Check that the preview templates in `public/admin/preview-templates.js` are up to date
2. Verify that the preview styles in `public/admin/preview.css` match your site's styling
3. Ensure that any custom components used in the preview are properly registered

## Further Resources

- [Astro Content Collections Documentation](https://docs.astro.build/en/guides/content-collections/)
- [Sveltia CMS Documentation](https://sveltia.io/docs/)
- [Markdown Guide](https://www.markdownguide.org/)