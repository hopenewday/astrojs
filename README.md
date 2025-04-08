# The modern magazine-Style Astro.js Theme - Complete 

## Overview
This prompt guides AI code generation for a modern-magazine-inspired publication theme using Astro.js, featuring enterprise-grade SEO, CDN integration, CMS capabilities, and modern security standards. Each component is structured with clear objectives, implementation guidelines, and validation criteria.

## 1. Project Initialization & Configuration

### Objective
Set up a professional Astro.js project with TypeScript, Tailwind CSS, and environment handling.

### Implementation Guidelines
- Initialize Astro.js v4.x with TypeScript and strict type checking
- Configure `package.json` with:
  - Dependencies: astro@^4.x, @astrojs/tailwind@^5.x, tailwindcss@^3.3.x, @astrojs/sitemap, sveltia-cms@^1.x, imagekit@^4.x, @aws-sdk/client-s3 (for Tebi integration)
  - Dev dependencies: typescript@^5.x, eslint, prettier, @typescript-eslint/parser
  - Scripts: dev, build, preview, lint, format, test
- Create `tsconfig.json` with:
  - Strict mode enabled
  - Path aliases for component directories
  - JSON imports enabled
- Configure `astro.config.mjs` with:
  - Tailwind integration
  - Sitemap integration
  - Image optimization
  - SSR mode for personalized content
- ## Environment Variables

Create `.env.example` with placeholders for:

### Schema Configuration
- `PUBLIC_SITE_URL`: Base URL for the website (required)
- `PUBLIC_PUBLISHER_NAME`: Organization name for schema markup (required)
- `PUBLIC_PUBLISHER_LOGO_URL`: Absolute URL to publisher logo (required)
- `PUBLIC_LICENSE_URL`: Content license URL (default: CC BY-SA 4.0)
  ```
  # CMS Configuration
  SVELTIA_CMS_REPO=github-username/repo-name
  SVELTIA_CMS_BRANCH=main
  SVELTIA_CMS_CLIENT_ID=your-oauth-client-id
  
  # Media CDN
  IMAGEKIT_PUBLIC_KEY=your-public-key
  IMAGEKIT_PRIVATE_KEY=your-private-key
  IMAGEKIT_URL=https://ik.imagekit.io/your-account
  
  # S3 Backup Storage
  TEBI_ACCESS_KEY=your-access-key
  TEBI_SECRET_KEY=your-secret-key
  TEBI_BUCKET=your-bucket-name
  TEBI_ENDPOINT=https://your-bucket.region.tebi.io
  
  # Comment System
  CUSDIS_APP_ID=your-cusdis-id
  CUSDIS_HOST=https://cusdis.com
  
  # CDN & Security
  CLOUDFLARE_API_TOKEN=your-token
  CLOUDFLARE_ZONE_ID=your-zone-id
  CSP_REPORT_URI=https://your-endpoint.report-uri.com/r/d/csp
  
  # Analytics
  UMAMI_WEBSITE_ID=your-umami-id
  UMAMI_HOST=https://analytics.yourdomain.com
  ```

### Validation Criteria
- `npm install` succeeds without dependency conflicts
- TypeScript compilation shows no errors
- Environment variables accessible via `import.meta.env.PUBLIC_*` and `import.meta.env.*`
- Project runs in dev mode with `npm run dev`

## 2. Layout Structure & Base Components

### Objective
Create a modular, accessible layout system with responsive behavior.

### Implementation Guidelines
- Create `src/layouts/BaseLayout.astro` with:
  - HTML5 doctype and semantic structure
  - Dynamic meta tags based on page content
  - Preconnect/DNS-prefetch for external resources
  - Critical CSS inlined in `<head>` for performance
  - Mobile-first viewport settings
- Implement `src/components/common/`:
  - `Head.astro`: SEO metadata, favicon, theme-color
  - `SkipToContent.astro`: Accessibility link that's visually hidden until focused
  - `Breadcrumbs.astro`: Schema-ready breadcrumb navigation
  - `ErrorBoundary.astro`: Component for handling runtime errors with fallbacks
- Create utility folder with:
  - `src/utils/imageHelpers.ts`: Functions for responsive images and fallbacks
  - `src/utils/dateFormatters.ts`: Date formatting tools for articles
  - `src/utils/schemaGenerators.ts`: JSON-LD generators for different content types

### Validation Criteria
- HTML validates without errors
- Layout adapts to screen sizes from 320px to 1920px+
- No horizontal scrolling on mobile devices
- Skip-to-content link works with keyboard navigation

## 3. Header Component

### Objective
Create a sticky, responsive header with mega menu and search functionality.

### Implementation Guidelines
- Create `src/components/header/Header.astro` with:
  - Logo ("chakrirchain" text with blue-500 accent)
  - Multi-level navigation with:
    - Primary categories (Tech, Culture, Science, etc.)
    - Mega menu showing featured articles for each category
    - Hover and click interactions for desktop/mobile
  - Expandable search bar with:
    - Autocomplete functionality
    - Recent searches storage using localStorage
    - Search results preview
  - Mobile hamburger menu with:
    - Smooth animation
    - Swipe gesture support (close with right-to-left swipe)
    - Nested category expansion
  - Theme toggle switch (light/dark mode)
  - User account menu (if authenticated)
  - ARIA attributes and keyboard navigation support
- Implement responsive behavior with:
  - Sticky header on scroll with reduced height
  - Collapse to hamburger below md breakpoint
  - Progressively enhance functionality based on device capabilities

### Validation Criteria
- Keyboard navigation works through all menu items
- Focus states clearly visible
- WCAG 2.1 AA compliance for contrast
- Mega menu closes when clicking outside
- Smooth transitions between all states (no jarring layout shifts)
- Load time impact below 100ms

## 4. Main Content Grid

### Objective
Develop a dynamic, responsive article grid with category-specific styling.

### Implementation Guidelines
- Create `src/components/home/MainGrid.astro` with:
  - Responsive grid layout (1, 2, 3, or 4 columns based on viewport)
  - Hero section:
    - Featured article with overlay text
    - Gradient background matching category theme
    - Play button overlay for video content
  - Article cards with:
    - Responsive images via ImageKit with srcset/sizes
    - Low-quality image placeholders (LQIP)
    - Category indicators with distinct colors
    - Reading time and publication date
    - Trending indicator (🔥) for articles with high engagement
    - Save button with localStorage integration
  - "Load more" button with intersection observer
  - Skeleton loading states for progressive enhancement
- Implement ad slot components:
  - Leaderboard (728×90) after every 5 articles
  - Sidebar (300×600) on desktop layouts
  - Interstitial (320×480) on mobile only
- Add category-specific theming:
  - Tech: blue gradient
  - Culture: purple gradient
  - Science: green gradient

### Validation Criteria
- Zero layout shifts when content loads (CLS = 0)
- Images load progressively with blur-up effect
- Grid maintains spacing and alignment across all breakpoints
- Ads load without blocking main content

## 5. Article Layout

### Objective
Design a premium reading experience with structured content and engagement features.

### Implementation Guidelines
- Create `src/layouts/ArticleLayout.astro` with:
  - Responsive hero image with:
    - Art-directed image crops (portrait for mobile, landscape for desktop)
    - Category-themed gradient overlay
    - Caption and credit information
  - Article metadata section:
    - Author info with avatar and bio link
    - Publication date (absolute and relative)
    - Reading time calculation
    - Share buttons for major platforms
    - Save functionality
  - Content structure:
    - Typography system with optimal reading width
    - Drop caps for first paragraph
    - Pull quotes with category styling
    - Figure captions with proper attribution
    - Section headings with anchor links
    - Code blocks with syntax highlighting
    - Table of contents for longer articles
  - Rich content embeds:
    - YouTube/Vimeo with lazy loading
    - Twitter/Instagram with privacy-friendly loading
    - Interactive charts and data visualizations
  - Related articles section with algorithmic recommendations
  - Cusdis comments integration:
    - Lazy-loaded only when scrolled into view
    - GDPR-compliant with no-cookie mode until interaction
    - Moderation tools for administrators
  - Next article teaser with progress bar

### Validation Criteria
- Reading experience optimized across devices
- Typography meets WCAG standards for readability
- JSON-LD structured data validates in Google Rich Results Test
- Social sharing includes proper OG/Twitter card metadata
- Comments load without impacting performance score

## 6. Sveltia CMS Integration

### Objective
Implement a GitHub-backed content management system with editorial workflow.

### Implementation Guidelines
- Create `public/admin/` directory with:
  - `index.html` for Sveltia CMS interface
  - `config.yml` with:
    - GitHub backend configuration
    - Media library connected to ImageKit
    - Editorial workflow (draft → review → ready → published)
    - Custom previews for different content types
- Configure content collections:

## Features

### Flash Feed (Mobile-Only)
- A vibrant, mobile-exclusive feature that displays posts in a full-screen, one-by-one scrolling experience
- Accessible via a gradient glow "Flash" button on the homepage (only visible on mobile devices)
- Features bold typography, background images, and smooth animations
- Optimized for mobile performance with the CDN failover system for image loading

To test the Flash feature:
1. View the site on a mobile device or use browser dev tools to simulate a mobile viewport (width ≤ 768px)
2. Look for the bouncing "Flash" button with gradient glow in the bottom-right corner of the homepage
3. Tap the button to enter the Flash feed experience
4. Swipe up to scroll through posts one at a time with smooth transitions
  - Articles:
    - Required fields: title, description, author, category
    - Optional fields: featured image, tags, series
    - Rich text editor with custom components
    - SEO section with custom metadata
  - Authors:
    - Profile information and biography
    - Social media links
    - Profile image
  - Pages:
    - About, Contact, Privacy Policy templates
    - Custom layouts with component selection
- Implement content modeling with:
  - Relationships between collections
  - Validation rules for required fields
  - Custom widgets for specific inputs

### Validation Criteria
- CMS loads successfully at `/admin` route
- GitHub authentication works for editors
- Media uploads store correctly in ImageKit
- Editorial workflow transitions function properly
- Content previews accurately reflect front-end rendering

## 7. ImageKit + Tebi CDN Failover System

### Objective
Implement a resilient image delivery system with automated failover.

### Implementation Guidelines
- Create `src/lib/media.ts` utility with:
  - ImageKit URL generation function with:
    - Responsive transformations (width, quality)
    - Format negotiation (WebP, AVIF support)
    - Blurhash placeholder generation
  - Tebi S3 client setup for failover:
    - AWS SDK configuration for Tebi endpoint
    - Bucket access for backup retrieval
  - Health check implementation:
    - Periodic ping to ImageKit status endpoint
    - Memory cache for status results (5 minute TTL)
    - Automatic routing to Tebi on failure
  - Image component with:
    - Smart source selection based on availability
    - Lazy loading with IntersectionObserver
    - Art direction support with different crops
    - Blur-up loading technique

### Validation Criteria
- Images load from ImageKit in normal operation
- Seamless fallback to Tebi when ImageKit unavailable
- No visual difference in failover scenario
- Cache headers properly set for both sources
- Performance metrics maintained in both scenarios

## 8. Advanced SEO Implementation

### Objective
Implement enterprise-grade SEO features for maximum visibility and rich results.

### Implementation Guidelines
- Create `src/components/seo/` directory with:
  - `MetaTags.astro`: Dynamic meta generation
  - `JsonLd.astro`: Structured data component
  - `SocialMeta.astro`: OG and Twitter cards
  - `CanonicalUrl.astro`: URL normalization
- Implement schema.org structured data for:
  - NewsArticle with all required properties
  - BreadcrumbList for navigation paths
  - Organization with logo and social profiles
  - WebSite with siteNavigationElement
  - Person schema for authors
- Create XML resources:
  - Dynamic `sitemap.xml` with priority settings
  - RSS feed with full content for readers
  - Facebook Instant Articles feed with:
    - Required FBIA markup and styling
    - Article analytics integration
    - Ad placement configuration
  - Google News sitemap with news-specific tags
- Implement multiregional/multilingual support:
  - Hreflang tags for language variants
  - x-default for language selection page

### Validation Criteria
- 100/100 SEO score in Lighthouse
- Valid structured data in Schema Validator
- Valid XML in all feed formats
- Facebook Instant Articles validator passes
- OG/Twitter previews show correctly in sharing debuggers

## 9. Cloudflare CDN & Security Integration

### Objective
Optimize website delivery and security through Cloudflare integration.

### Implementation Guidelines
- Create configuration files for:
  - `_redirects`: HTTP redirects for legacy URLs
  - `_headers`: Security and cache headers
  - `robots.txt`: Crawler directives
- DNS configuration instructions:
  - CNAME records for www subdomain
  - ALIAS/ANAME for apex domain
  - MX records for email services
- Performance settings:
  - Enable Brotli compression
  - Auto-minify HTML, CSS, JS
  - Configure Rocket Loader
  - Enable HTTP/3 and QUIC
  - Set Browser Cache TTL (7 days)
- Security implementation:
  - WAF rules for common attacks
  - Rate limiting for sensitive endpoints
  - Bot management for comment system
  - DDoS protection settings
- Worker script for:
  - Dynamic security headers
  - Edge caching customization
  - A/B testing capabilities
  - Mobile detection and optimization

### Validation Criteria
- securityheaders.com scan achieves A+ rating
- WebPageTest shows reduced TTFB via CDN
- All assets served with correct cache headers
- Security headers present in browser developer tools
- No mixed content warnings

## 10. Strict Security Policy Implementation

### Objective
Implement comprehensive security policies to prevent common vulnerabilities.

### Implementation Guidelines
- Create `src/middleware.ts` with:
  - Content Security Policy (CSP) implementation:
    - Nonce-based inline script protection
    - Strict source directives for all content types
    - frame-ancestors restriction
    - report-uri for violation monitoring
  - Permissions Policy configuration:
    - Restrict sensitive API access
    - Disable unneeded browser features
  - Cookie security:
    - HttpOnly flag for authentication cookies
    - SameSite=Strict requirement
    - Secure flag for HTTPS-only
    - Prefix naming for security
  - Cross-Origin policies:
    - CORS headers for API endpoints
    - CORP/COEP settings for isolation
  - Input sanitization:
    - XSS protection for user inputs
    - Content validation middleware
    - SQL injection prevention
  - Security monitoring:
    - CSP violation reporting
    - Error logging with sanitization
    - Rate limiting for login attempts

### Validation Criteria
- SecurityHeaders.com scan score of A+
- No console errors from CSP violations
- OWASP ZAP scanner finds no critical issues
- All user inputs properly sanitized
- No client-side data leakage in source

## 11. Mobile Optimization & Performance

### Objective
Ensure excellent mobile experience with progressive enhancement.

### Implementation Guidelines
- Create responsive foundations:
  - Mobile-first CSS approach
  - Touch-friendly targets (min 44×44px)
  - Viewport-relative typography
  - No horizontal scrolling
- Implement performance optimizations:
  - Critical CSS inlining
  - Font loading strategy with fallbacks
  - Component-level code splitting
  - Resource hints (preconnect, preload)
- Add progressive enhancement:
  - Core functionality without JS
  - Enhanced interactions with JS
  - Offline support with service worker
  - Install prompts for PWA
- Create AMP versions for articles:
  - Separate `src/layouts/AmpArticle.astro`
  - AMP-compatible components
  - Structured data duplication
  - AMP cache compatibility

### Validation Criteria
- Google Mobile-Friendly Test passes
- PageSpeed Insights mobile score 90+
- Core Web Vitals all passing
- No CLS issues on dynamic content
- PWA installable on mobile devices

## 12. Ad Management System

### Objective
Implement performant, privacy-respecting ad integration.

### Implementation Guidelines
- Create `src/components/ads/` directory with:
  - `AdSlot.astro`: Configurable ad container
  - `LeaderboardAd.astro`: 728×90 format
  - `RectangleAd.astro`: 300×250 format
  - `SidebarAd.astro`: 300×600 format
  - `MobileAd.astro`: 320×50 format
- Implement advanced features:
  - Lazy loading based on viewport proximity
  - Placeholder with exact dimensions to prevent CLS
  - Rotation logic for multiple creatives
  - Frequency capping with localStorage
- Add privacy enhancements:
  - No ads until cookie consent
  - Local targeting without 3rd-party cookies
  - Limited data collection
- Configure responsive behavior:
  - Hide certain formats on mobile
  - Adjust sizes based on container width
  - Fallback options for blocked ads

### Validation Criteria
- Ads load without causing layout shifts
- Performance impact under 200ms
- Different formats display correctly
- Ad blockers don't break layout
- GDPR/CCPA compliant behavior

## 13. Performance Optimization Strategy

### Objective
Achieve and maintain excellent performance metrics across devices.

### Implementation Guidelines
- Image optimization:
  - Configure AVIF and WebP generation
  - Responsive image sets with appropriate sizes
  - Lazy loading with IntersectionObserver
  - Low-quality image placeholders
- JavaScript optimization:
  - Route-based code splitting
  - Dynamic imports for non-critical code
  - Web worker for intensive operations
  - Bundle size monitoring
- CSS optimization:
  - Purge unused styles in production
  - Critical CSS extraction
  - Deferred loading of non-critical CSS
  - Container queries for component-level responsiveness
- Asset delivery:
  - Self-hosted fonts with preload
  - SVG icon system with sprites
  - Resource hints for third-party resources
  - Efficient cache policies

### Validation Criteria
- Lighthouse performance score ≥95
- Web Vitals all in "good" range
- TTI under 3.5 seconds on 4G
- First Contentful Paint under 1.5s
- No render-blocking resources

## 14. Theme System & Dark Mode

### Objective
Create a flexible theming system with user preference support.

### Implementation Guidelines
- Create `src/styles/` directory with:
  - `themes.css`: CSS custom properties for theming
  - `typography.css`: Type scale and text styles
  - `animations.css`: Reusable animations
  - `utilities.css`: Helper classes
- Implement theme components:
  - `ThemeProvider.astro`: Theme context provider
  - `ThemeToggle.astro`: User control for theme switching
  - `CategoryTheme.astro`: Category-specific overrides
- Set up CSS variables for:
  - Color scheme (light/dark base)
  - Primary/secondary accent colors
  - Typography settings
  - Animation durations
  - Category-specific theming
- Add preference detection:
  - `prefers-color-scheme` media query
  - Local storage for user choices
  - System preference sync option

### Validation Criteria
- Theme toggle works without page reload
- Dark mode meets WCAG contrast requirements
- Category theming applies consistently
- User preferences persist between sessions
- No flash of incorrect theme on load

## 15. User Experience Enhancements

### Objective
Add subtle animations and microinteractions to improve engagement.

### Implementation Guidelines
- Create animation system:
  - CSS transitions for UI state changes
  - CSS keyframe animations for attention
  - GSAP for complex sequences
  - Lottie for rich animations
- Implement microinteractions:
  - Button hover/focus states
  - Page transition effects
  - Scroll-triggered animations
  - Progress indicators
  - Success/error feedback
- Add accessibility considerations:
  - `prefers-reduced-motion` support
  - Animation pause/disable option
  - No purely animation-based information
  - Focus management for modals
- Optimize performance:
  - Use `will-change` sparingly
  - Limit to transform/opacity properties
  - Request animation frame for JS animations
  - GPU acceleration for smooth performance

### Validation Criteria
- Animations are subtle and purposeful
- No animation causes layout shifts
- Respects `prefers-reduced-motion`
- Performance impact under 50ms
- Enhances rather than distracts

## 16. Analytics & Monitoring

### Objective
Implement privacy-focused analytics with error tracking.

### Implementation Guidelines
- Set up Umami analytics:
  - Self-hosted or cloud version
  - Custom event tracking
  - Goal conversion setup
  - Custom dimensions for categories
- Implement error monitoring:
  - Client-side error boundary
  - Global error handler
  - Network error detection
  - User feedback mechanism
- Add performance monitoring:
  - Web Vitals tracking
  - Custom timing measurements
  - Resource load timing
  - Long task detection
- Configure data collection:
  - GDPR-compliant consent system
  - Data anonymization where possible
  - Data retention policies
  - Export/cleanup capabilities

### Validation Criteria
- No PII collected without consent
- Performance impact under 50ms
- Error reports include context without PII
- Real user metrics accurately collected
- Dashboard shows meaningful insights

## 17. Footer Component

### Objective
Design a comprehensive, accessible footer with newsletter integration.

### Implementation Guidelines
- Create `src/components/footer/Footer.astro` with:
  - Multi-column layout (4 columns on desktop, stacks on mobile)
  - Section organization:
    - About: Logo, tagline, social links
    - Sections: Category navigation
    - Legal: Terms, Privacy, Cookie Policy
    - Subscribe: Newsletter form
  - Newsletter component with:
    - Form validation (client + server)
    - Success/error states
    - Privacy notice and GDPR compliance
  - Additional elements:
    - Back-to-top button with scroll progress
    - Language/region selector
    - Accessibility statement link
    - "Made with Astro" credit
  - Semantic markup:
    - Proper heading structure
    - ARIA roles where needed
    - Keyboard navigation support

### Validation Criteria
- Footer maintains design integrity across breakpoints
- Newsletter form validates inputs
- Back-to-top button appears after scrolling
- All links are keyboard-accessible
- Submitting form shows appropriate feedback

## 18. Testing & Quality Assurance

### Objective
Ensure consistent quality across browsers and devices.

### Implementation Guidelines
- Set up testing infrastructure:
  - Jest for unit testing
  - Playwright for end-to-end testing
  - Axe for accessibility testing
  - Storybook for component documentation
- Create test cases for:
  - Component rendering
  - Interactive elements
  - Form submission
  - Responsive layouts
  - Theme switching
- Implement CI/CD:
  - GitHub Actions workflow
  - Pre-commit hooks
  - Automated testing on PR
  - Build size monitoring
- Ensure browser compatibility:
  - Test matrix for modern browsers
  - Fallbacks for older browsers
  - Mobile device testing

### Validation Criteria
- All tests pass in CI pipeline
- Accessibility tests show no violations
- Components render consistently
- Forms submit correctly
- Interactive elements work as expected

## 19. Deployment & DevOps

### Objective
Configure reliable deployment with performance monitoring.

### Implementation Guidelines
- Set up build pipeline:
  - Optimize assets for production
  - Generate static files where possible
  - Create dynamic routes with SSR
  - Prerender high-traffic pages
- Configure hosting:
  - Cloudflare Pages deployment
  - Environment variable management
  - Preview deployments for branches
  - Custom domain configuration
- Implement monitoring:
  - Uptime checks
  - Performance monitoring
  - Error alerting
  - Usage analytics
- Security measures:
  - Dependency scanning
  - Automated updates
  - Secret management
  - Audit logging

### Validation Criteria
- Successful builds on main branch
- Preview environments work correctly
- Production deployment optimized
- Monitoring alerts configured
- Performance baseline established

## Final Validation Checklist

- **Security**:
  - SecurityHeaders.com score of A+
  - OWASP Top 10 vulnerabilities addressed
  - No sensitive data exposed in source
  - Proper authentication/authorization

- **Performance**:
  - Lighthouse score ≥90 on all categories
  - Core Web Vitals all passing
  - Time to Interactive < 3.5s on mobile
  - First Contentful Paint < 1.5s

- **Accessibility**:
  - WCAG 2.1 AA compliance
  - Screen reader compatibility
  - Keyboard navigation throughout
  - Color contrast requirements met

- **SEO**:
  - Structured data validation
  - Mobile-friendly test passing
  - XML sitemaps properly formatted
  - Meta tags complete for all pages

- **Browser Compatibility**:
  - Works in latest 2 versions of major browsers
  - Graceful degradation for older browsers
  - Mobile responsiveness on iOS/Android
  - Print stylesheet provided