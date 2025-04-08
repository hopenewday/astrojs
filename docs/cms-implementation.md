# Sveltia CMS Implementation Guide

This document provides a detailed explanation of how the Sveltia CMS integration is implemented in this Astro.js blog project.

## Architecture Overview

The CMS integration consists of several key components:

1. **Admin Interface**: Located at `/admin` route, built with Sveltia CMS
2. **Authentication API**: OAuth endpoint for Auth0 authentication
3. **Content Collections**: Schema definitions for articles, authors, categories, and pages
4. **Preview Templates**: Custom React components for accurate content previews
5. **Build Process**: Scripts to process environment variables during build

## Implementation Details

### Admin Interface

The admin interface is implemented as static HTML/JS files in the `public/admin` directory:

- `index.html`: The main CMS interface that loads the Sveltia CMS application
- `config.yml`: Configuration file defining backend, media settings, and content collections
- `preview.css`: Styles for the preview pane to match the frontend appearance
- `preview-templates.js`: Custom React components for content previews

The interface is configured to use GitHub as the backend, with an editorial workflow that supports draft, review, and publishing stages.

### Authentication API

The authentication endpoint is implemented in `src/pages/api/auth.js` and handles:

1. Receiving the OAuth code from Auth0
2. Exchanging the code for an access token
3. Verifying the user's identity
4. Checking user roles and permissions
5. Returning the token to the CMS

The implementation includes comprehensive security checks to ensure only authorized users can access the CMS.

### User Access Verification

User access is verified using Auth0's role-based access control:

1. User authentication via Auth0
2. Role verification using Auth0 Management API
3. Permission validation based on assigned roles
4. Access control based on required role configuration

This ensures that only authorized users with the appropriate roles can access the CMS.

### Content Collections

The CMS is configured with these content collections:

1. **Articles**: Blog posts with rich content, metadata, and relationships
2. **Authors**: Writer profiles with social links and avatars
3. **Categories**: Content organization with custom colors and descriptions
4. **Pages**: Static pages with flexible content

Each collection has a defined schema with required fields, validation rules, and relationships to other collections.

### Preview Templates

Custom preview templates are implemented using React components to provide an accurate representation of how content will appear on the frontend:

- `ArticlePreview`: Displays article title, featured image, content, and metadata
- `AuthorPreview`: Shows author profile with avatar and social links
- `CategoryPreview`: Renders category with custom color theme
- `PagePreview`: Displays page title and content

### Build Process

The build process includes a script (`scripts/build-cms-config.js`) that:

1. Reads the CMS configuration template
2. Replaces environment variable placeholders with actual values
3. Writes the processed configuration to the build output directory

This ensures that sensitive information like API keys is not committed to the repository.

## Security Considerations

1. **Environment Variables**: Sensitive information is stored in environment variables
2. **OAuth Flow**: Secure authentication flow with Auth0
3. **Role-Based Access Control**: Comprehensive role and permission checks
4. **Media Security**: Secure media handling with ImageKit

## Performance Optimizations

1. **Resource Loading**: Optimized loading of CMS resources with preconnect
2. **Preview Rendering**: Efficient React components for previews
3. **Media Handling**: Optimized image processing with ImageKit

## Usage Instructions

See the [sveltia-cms-setup.]