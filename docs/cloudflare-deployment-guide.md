# Cloudflare Deployment Guide for Astro Projects

This guide provides comprehensive instructions for deploying an Astro project to Cloudflare, covering both Cloudflare Pages and Workers integration. It includes prerequisites, configuration steps, continuous deployment setup, and troubleshooting tips.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Understanding the Current Configuration](#understanding-the-current-configuration)
- [Deploying to Cloudflare Pages](#deploying-to-cloudflare-pages)
- [Configuring Cloudflare Workers](#configuring-cloudflare-workers)
- [Setting Up Continuous Deployment](#setting-up-continuous-deployment)
- [Environment Variables](#environment-variables)
- [Image Optimization with Cloudflare](#image-optimization-with-cloudflare)
- [Performance Monitoring](#performance-monitoring)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

## Prerequisites

Before deploying your Astro project to Cloudflare, ensure you have the following:

1. **Cloudflare Account**: Create a free account at [Cloudflare](https://dash.cloudflare.com/sign-up)
2. **GitHub/GitLab Repository**: Your project should be hosted in a Git repository
3. **Node.js**: Version 16.x or higher installed locally
4. **Wrangler CLI**: Install globally with `npm install -g wrangler`
5. **Cloudflare API Token**: Generate from the Cloudflare dashboard

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

## Understanding the Current Configuration

This project is already configured with Cloudflare integration in `astro.config.mjs`:

```javascript
adapter: cloudflare({
  // Cloudflare Pages specific options
  mode: 'directory', // 'directory' is recommended for most projects
  functionPerRoute: true, // Creates a separate Worker for each route for better performance
  imageService: 'cloudflare', // Use Cloudflare's image optimization service
  runtime: {
    mode: process.env.NODE_ENV === 'production' ? 'off' : 'local', // Use 'local' for development, 'off' for production
    persistTo: '.cloudflare/wrangler-local-state', // Directory to persist local state
  },
  // Optimize for production performance
  routes: [
    {
      pattern: '^/assets/.*', // Static assets
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    },
    {
      pattern: '^/api/.*', // API routes
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  ],
}),
```

This configuration:
- Uses the `directory` mode for Cloudflare Pages
- Creates separate Workers for each route
- Utilizes Cloudflare's image optimization service
- Sets up caching rules for static assets and API routes

## Deploying to Cloudflare Pages

### Manual Deployment

1. **Build your project locally**:

```bash
npm run build
```

2. **Create a new Cloudflare Pages project**:
   - Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Pages** > **Create a project** > **Connect to Git**
   - Select your repository and configure the following settings:

```
Production branch: main (or your default branch)
Build command: npm run build
Build output directory: dist
```

3. **Configure environment variables**:
   - Add the required environment variables in the Cloudflare Pages dashboard
   - Include all variables prefixed with `PUBLIC_`, `IMAGEKIT_`, `TEBI_`, `CUSDIS_`, `CLOUDFLARE_`, and `UMAMI_` as specified in your `astro.config.mjs`

4. **Deploy your site**:
   - Click **Save and Deploy**
   - Cloudflare will build and deploy your site

### Direct Git Integration

1. **Connect your Git repository**:
   - In the Cloudflare Dashboard, go to **Pages** > **Create a project**
   - Select your Git provider (GitHub, GitLab, etc.)
   - Authorize Cloudflare and select your repository

2. **Configure build settings**:

```
Production branch: main (or your default branch)
Build command: npm run build
Build output directory: dist
Root directory: / (or your project root)
```

3. **Set up environment variables**:
   - Add all required environment variables
   - Make sure to include `NODE_VERSION: 16` (or your preferred Node.js version)

4. **Deploy**:
   - Click **Save and Deploy**
   - Cloudflare will automatically build and deploy your site

## Configuring Cloudflare Workers

This project uses Cloudflare Workers for server-side rendering and API functionality.

### Local Development with Workers

1. **Configure wrangler.toml**:
   - Create a `wrangler.toml` file in your project root if it doesn't exist:

```toml
name = "your-project-name"
type = "javascript"
account_id = "your-account-id"
workers_dev = true
route = ""  # Leave empty for local development
zone_id = ""  # Leave empty for local development
compatibility_date = "2023-06-28"

[site]
bucket = "./dist"
entry-point = "."

[build]
command = "npm run build"

[build.upload]
format = "service-worker"
```

2. **Local development with Wrangler**:

```bash
wrangler dev
```

### Deploying Workers

1. **Update wrangler.toml for production**:

```toml
name = "your-project-name"
type = "javascript"
account_id = "your-account-id"
workers_dev = true
route = "https://your-domain.com/*"  # Your domain
zone_id = "your-zone-id"  # Your Cloudflare zone ID
compatibility_date = "2023-06-28"

[site]
bucket = "./dist"
entry-point = "."

[build]
command = "npm run build"

[build.upload]
format = "service-worker"
```

2. **Deploy to Cloudflare Workers**:

```bash
wrangler publish
```

## Setting Up Continuous Deployment

### GitHub Actions Integration

1. **Create a GitHub Actions workflow file**:
   - Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]  # or your default branch

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 16
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          # Add your environment variables here
          PUBLIC_SITE_URL: ${{ secrets.PUBLIC_SITE_URL }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ZONE_ID: ${{ secrets.CLOUDFLARE_ZONE_ID }}
          
      - name: Publish to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: your-project-name  # Your Cloudflare Pages project name
          directory: dist  # The directory with your built assets
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

2. **Add secrets to your GitHub repository**:
   - Go to your repository settings > Secrets > Actions
   - Add the following secrets:
     - `CLOUDFLARE_API_TOKEN`
     - `CLOUDFLARE_ACCOUNT_ID`
     - `CLOUDFLARE_ZONE_ID`
     - Any other environment variables needed

### Automatic Preview Deployments

Cloudflare Pages automatically creates preview deployments for pull requests when connected to your Git repository.

1. **Configure preview settings**:
   - In the Cloudflare Pages dashboard, go to your project settings
   - Under **Builds & deployments** > **Preview deployments**
   - Enable **Preview deployments for pull requests**

2. **Custom preview settings** (optional):
   - Set different environment variables for preview deployments
   - Configure branch-specific build commands

## Environment Variables

Manage environment variables for different deployment environments:

### Production Variables

In the Cloudflare Pages dashboard:
1. Go to your project > **Settings** > **Environment variables**
2. Add the following variables:

```
NODE_VERSION: 16 (or your preferred version)
PUBLIC_SITE_URL: https://your-domain.com
CLOUDFLARE_API_TOKEN: your-api-token
CLOUDFLARE_ZONE_ID: your-zone-id
# Add other variables as needed
```

### Preview/Development Variables

You can set different variables for preview deployments:

1. In the same environment variables section, click on **Preview**
2. Add variables specific to preview environments:

```
PUBLIC_SITE_URL: https://preview.your-domain.com
# Other preview-specific variables
```

## Image Optimization with Cloudflare

This project is configured to use Cloudflare's image optimization service:

```javascript
imageService: 'cloudflare',
```

### Configuring Image Optimization

1. **Update image URLs**:
   - Ensure your image URLs are properly formatted for Cloudflare optimization
   - Use the `getCloudflareOptimizedImage()` function from `imageOptimizer.ts`

2. **Custom domains for images** (optional):
   - Configure a custom domain for your images in the Cloudflare dashboard
   - Update the `CLOUDFLARE_IMAGE_URL` environment variable

3. **Image transformation parameters**:
   - Width and height: `?width=800&height=600`
   - Format conversion: `?format=webp` or `?format=avif`
   - Quality adjustment: `?quality=80`

## Performance Monitoring

Monitor your deployed application's performance:

1. **Cloudflare Analytics**:
   - Access analytics in the Cloudflare dashboard
   - Monitor traffic, cache performance, and security events

2. **Web Vitals Monitoring**:
   - Use the built-in Web Vitals tracking in your application
   - Configure alerts for performance degradation

3. **Error Tracking**:
   - Set up error logging to monitor production issues
   - Configure Cloudflare Workers to log errors to your preferred service

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**:
   - Check build logs in the Cloudflare Pages dashboard
   - Ensure all dependencies are properly installed
   - Verify Node.js version compatibility

2. **Environment Variable Issues**:
   - Confirm all required environment variables are set
   - Check for typos in variable names
   - Ensure sensitive values are properly escaped

3. **Routing Problems**:
   - Verify your `_routes.json` file is correctly configured
   - Check for conflicts between static routes and dynamic routes
   - Ensure your Cloudflare Workers are properly handling routes

4. **Image Optimization Issues**:
   - Verify Cloudflare account permissions for image optimization
   - Check image URL formatting
   - Ensure image domains are properly configured

### Debugging Workers

1. **Local debugging**:

```bash
wrangler dev --local
```

2. **Logging in production**:
   - Use `console.log()` statements in your Workers
   - View logs in the Cloudflare dashboard under **Workers** > **your-worker** > **Logs**

3. **Testing specific routes**:

```bash
curl -H "Host: your-domain.com" http://localhost:8787/your-route
```

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/)
- [Astro + Cloudflare Integration](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

---

## Maintenance and Updates

### Updating the Cloudflare Integration

To update the Cloudflare adapter:

```bash
npm install @astrojs/cloudflare@latest
```

After updating, check for any breaking changes in the [changelog](https://github.com/withastro/astro/blob/main/packages/integrations/cloudflare/CHANGELOG.md).

### Regular Maintenance Tasks

1. **Monitor performance metrics**:
   - Review Web Vitals regularly
   - Check Cloudflare Analytics for traffic patterns

2. **Update dependencies**:
   - Regularly update Astro and its integrations
   - Keep Cloudflare-related packages up to date

3. **Review security settings**:
   - Update Content Security Policy as needed
   - Review Cloudflare security settings

4. **Optimize caching strategies**:
   - Adjust cache settings based on traffic patterns
   - Review cache hit rates in Cloudflare Analytics