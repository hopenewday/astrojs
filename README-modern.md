# Modern Magazine-Style Astro.js Theme

A complete, modern magazine-style theme built with Astro.js, featuring a responsive design, optimized performance, and a rich set of components for content publishing.

## Features

- **Modern Tech Stack**: Built with Astro.js v5.x, TypeScript, and Tailwind CSS
- **Performance Optimized**: Implements best practices for Core Web Vitals
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Content Management**: Structured content collections with validation
- **SEO Ready**: Built-in SEO components and structured data
- **Progressive Web App**: Service worker, offline support, and installable
- **AMP Support**: Alternative AMP versions of pages
- **Image Optimization**: Automatic image optimization and lazy loading
- **Analytics**: Privacy-focused analytics integration
- **Dark Mode**: Automatic and manual theme switching
- **Animations**: GSAP-powered smooth animations and transitions

## Project Structure

```
├── .astro/               # Astro-generated types and schemas
├── content/              # Content collections (articles, authors, etc.)
├── public/               # Static assets
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── analytics/    # Analytics components
│   │   ├── common/       # Shared components
│   │   ├── header/       # Header components
│   │   ├── home/         # Homepage components
│   │   ├── pwa/          # Progressive Web App components
│   │   └── seo/          # SEO components
│   ├── config/           # Configuration files
│   ├── content/          # Content collection config
│   ├── graphql/          # GraphQL schemas and queries
│   ├── layouts/          # Page layouts
│   ├── lib/              # Shared libraries
│   ├── middleware/       # Astro middleware
│   ├── pages/            # Page routes
│   ├── scripts/          # Build and utility scripts
│   ├── styles/           # Global styles
│   ├── templates/        # Page templates
│   └── utils/            # Utility functions
└── .env.example          # Environment variables template
```

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and configure your environment variables

```bash
cp .env.example .env
```

4. Start the development server:

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

To build with AMP support:

```bash
npm run build:with-amp
```

## Environment Variables

This project uses various environment variables for configuration. See `.env.example` for all required variables.

## Content Management

Content is managed through Astro's content collections in the `content/` directory:

- `articles/`: Blog posts and articles
- `authors/`: Author profiles
- `categories/`: Content categories
- `pages/`: Static pages

## Customization

### Styling

The theme uses Tailwind CSS for styling. Customize the design by modifying:

- `tailwind.config.mjs`: Tailwind configuration
- `src/styles/theme.css`: CSS variables and global styles

### Components

All UI components are in the `src/components/` directory, organized by function.

## Performance

This theme is optimized for performance with:

- Optimized image loading and processing
- Critical CSS inlining
- Deferred non-critical JavaScript
- Service worker for offline support
- Preloading of critical assets

## License

MIT