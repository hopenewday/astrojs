# Sveltia CMS Setup Guide

This guide provides comprehensive instructions for setting up and configuring the Sveltia CMS integration for your Astro.js blog.

## Prerequisites

1. A GitHub repository for content storage
2. An Auth0 account for authentication and authorization
3. Auth0 application credentials (Domain, Client ID, Client Secret)
4. ImageKit account for media management
5. Tebi S3 account for backup storage (optional but recommended)

## Environment Variables

Copy the variables from `.env.example` to a new `.env` file and fill in the values:

```
# CMS Configuration - GitHub Backend
SVELTIA_CMS_REPO=github-username/repo-name
SVELTIA_CMS_BRANCH=main
SVELTIA_CMS_CLIENT_ID=your-oauth-client-id

# CMS Configuration - Auth0
AUTH0_DOMAIN=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/
AUTH0_REQUIRED_ROLE=cms-admin

# Media CDN
IMAGEKIT_PUBLIC_KEY=your-public-key
IMAGEKIT_PRIVATE_KEY=your-private-key
IMAGEKIT_URL=https://ik.imagekit.io/your-account
```

## Auth0 Setup

1. Create an Auth0 account if you don't have one: https://auth0.com/signup
2. Go to the Auth0 Dashboard and create a new application
3. Select "Regular Web Application" as the application type
4. Configure the application settings:
   - Name: Your Blog CMS
   - Allowed Callback URLs: `https://your-site.com/admin`
   - Allowed Logout URLs: `https://your-site.com/admin`
   - Allowed Web Origins: `https://your-site.com`
5. Note the Domain, Client ID, and Client Secret
6. Go to "APIs" section and create a new API or use the default Management API
7. Note the API Audience value
8. Create a role named "cms-admin" in the "Roles" section
9. Assign this role to users who should have access to the CMS
10. Add all these credentials to your environment variables

## Authentication Flow

The CMS uses Auth0 for authentication with these security measures:

1. User clicks "Login with Auth0" in the CMS
2. Auth0 OAuth flow redirects to our authentication endpoint
3. The endpoint exchanges the code for an access token
4. User identity is verified via Auth0 API
5. User roles and permissions are checked to ensure proper access rights
6. If authorized, the user is granted access to the CMS

## Content Collections

The CMS is configured with these content collections:

1. **Articles**: Blog posts with rich content
2. **Authors**: Writer profiles with social links
3. **Categories**: Content organization with custom colors
4. **Pages**: Static pages like About, Contact, etc.

## Differences from Decap CMS

Sveltia CMS offers several advantages over Decap CMS:

1. **Modern UI**: A more intuitive and responsive user interface
2. **Better Performance**: Faster loading and editing experience
3. **Enhanced Previews**: More accurate content previews
4. **Improved Media Management**: Better handling of images and media files
5. **Simplified Configuration**: More straightforward setup and configuration

## Using React Components

This project is configured to use React components within Astro.js pages:

### Basic Usage

1. Components are located in `src/components` with `.jsx` or `.tsx` extensions
2. Import React components in Astro pages with:
   ```astro
   ---
   import ReactComponent from '../components/ReactComponent.jsx';
   ---
   <ReactComponent client:load />
   ```
3. Use the `client:` directive to hydrate the component on the client side

### TypeScript Support

For better type safety and developer experience, you can use TypeScript with React components:

1. Create components with `.tsx` extension
2. Define prop interfaces for better type checking:
   ```tsx
   interface MyComponentProps {
     title: string;
     count?: number;
   }
   
   export default function MyComponent({ title, count = 0 }: MyComponentProps) {
     // Component implementation
   }
   ```
3. Import TypeScript components in Astro pages:
   ```astro
   ---
   import MyComponent from '../components/MyComponent.tsx';
   ---
   <MyComponent title="Hello" count={5} client:load />
   ```

### Client Directives

Astro provides several client directives to control when React components are hydrated:

- `client:load` - Hydrate as soon as the page loads
- `client:idle` - Hydrate when the browser is idle
- `client:visible` - Hydrate when the component is visible in viewport
- `client:media="(query)"` - Hydrate when a media query is matched
- `client:only="react"` - Skip server rendering, render only on client

### State Management

For complex applications, you can use React's Context API or state management libraries:

1. Create a context provider component:
   ```tsx
   // AppContext.tsx
   import { createContext, useState, ReactNode } from 'react';
   
   export const AppContext = createContext(null);
   
   export function AppProvider({ children }: { children: ReactNode }) {
     const [state, setState] = useState({});
     return (
       <AppContext.Provider value={{ state, setState }}>
         {children}
       </AppContext.Provider>
     );
   }
   ```

2. Wrap your components with the provider in your Astro page:
   ```astro
   ---
   import { AppProvider } from '../components/AppContext.tsx';
   import Dashboard from '../components/Dashboard.tsx';
   ---
   <AppProvider client:load>
     <Dashboard client:load />
   </AppProvider>
   ```

## Troubleshooting

- **Authentication Issues**: Verify your Auth0 credentials and callback URL settings
- **Media Upload Problems**: Check ImageKit credentials and permissions
- **Access Denied**: Ensure the user has the required role (cms-admin) assigned in Auth0
- **Preview Not Working**: Check browser console for errors
- **React Component Issues**: Ensure the component is properly imported and has the correct client directive

## Complete Configuration Example

Here's a complete example of the `config.yml` file with all available options:

```yaml
# Sveltia CMS Configuration
backend:
  name: github
  repo: username/repo-name
  branch: main
  auth_scope: repo
  commit_messages:
    create: "Create {{collection}} \"{{slug}}\""
    update: "Update {{collection}} \"{{slug}}\""
    delete: "Delete {{collection}} \"{{slug}}\""
    uploadMedia: "[media] Upload \"{{path}}\""
    deleteMedia: "[media] Delete \"{{path}}\""

# Enable editorial workflow (draft, review, ready, published)
local_backend: true
publish_mode: editorial_workflow

# Media settings
media_folder: "public/images"
public_folder: "/images"
media_library:
  name: imagekit
  config:
    publicKey: your-imagekit-public-key
    privateKey: your-imagekit-private-key
    urlEndpoint: https://ik.imagekit.io/your-account
    uploadFolder: "cms-uploads"

# Content Collections
collections:
  # Articles Collection
  - name: "articles"
    label: "Articles"
    folder: "content/articles"
    create: true
    slug: "{{slug}}"
    extension: "md"
    format: "frontmatter"
    editor:
      preview: true
    fields:
      - { label: "Title", name: "title", widget: "string", required: true }
      - { label: "Description", name: "description", widget: "text", required: true }
      - { label: "Publish Date", name: "publishDate", widget: "datetime", required: true }
      - { label: "Author", name: "author", widget: "relation", collection: "authors", value_field: "{{slug}}", search_fields: ["name"], display_fields: ["name"], required: true }
      - { label: "Category", name: "category", widget: "relation", collection: "categories", value_field: "{{slug}}", search_fields: ["name"], display_fields: ["name"], required: true }
      - { label: "Featured Image", name: "image", widget: "object", fields: [{label: "Image", name: "src", widget: "image"}, {label: "Alt Text", name: "alt", widget: "string"}] }
      - { label: "Tags", name: "tags", widget: "list" }
      - { label: "Content", name: "body", widget: "markdown" }
```

## Implementation Details

### Authentication Flow

The authentication flow between Sveltia CMS and Auth0 works as follows:

1. User clicks "Login" in the CMS interface
2. Auth0 login page appears and handles authentication
3. Upon successful login, Auth0 redirects back to the CMS with an authorization code
4. The CMS exchanges this code for an access token via the authentication endpoint
5. The token is verified and the user's roles are checked
6. If the user has the required role, they are granted access to the CMS

### Custom Preview Templates

To create custom preview templates for your content types:

1. Create a file at `public/admin/preview-templates.js`
2. Define React components for each content type:

```js
// Article Preview Template
const ArticlePreview = createClass({
  render: function() {
    const entry = this.props.entry;
    const title = entry.getIn(['data', 'title']);
    const content = this.props.widgetFor('body');
    
    return h('div', { className: 'article-preview' },
      h('h1', {}, title),
      h('div', { className: 'content' }, content)
    );
  }
});

// Register the preview template
CMS.registerPreviewTemplate('articles', ArticlePreview);
```

### Build Process Integration

To integrate the CMS with your build process:

1. Create a script to process environment variables during build
2. Add the script to your build command in package.json

```json
{
  "scripts": {
    "build": "node scripts/build-cms-config.js && astro build"
  }
}
```

This ensures that your CMS configuration is properly processed before the build runs.