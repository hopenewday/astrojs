# ThemeProvider Component

`ThemeProvider.astro` is a core component that manages theme detection, toggling, and persistence throughout the application.

## Features

- Detects and applies user's preferred theme (light/dark)
- Respects system theme preferences with `prefers-color-scheme` media query
- Persists theme choices in localStorage
- Prevents flash of incorrect theme on page load
- Provides global theme management through `window.themeManager`
- Dispatches theme change events for other components to listen to
- Zero impact on layout (uses `display: contents`)

## Usage

```astro
---
import ThemeProvider from '../components/common/ThemeProvider.astro';
---

<ThemeProvider initialTheme="system">
  <!-- Your app content here -->
</ThemeProvider>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialTheme` | `'light' \| 'dark' \| 'system'` | `'system'` | The initial theme to use if no preference is stored |

## Integration

The ThemeProvider component is typically added at the root level of your application, usually in `BaseLayout.astro`. It works with the theme system defined in `src/styles/theme.css` and provides theme context to all child components.

### Accessing the Theme Manager

The ThemeProvider exposes a global `themeManager` object that can be used to programmatically control the theme:

```js
// Toggle between light and dark themes
window.themeManager.toggleTheme();

// Set a specific theme
window.themeManager.setTheme('dark');

// Get the current theme preference
const currentTheme = window.themeManager.getThemePreference();
```

### Listening for Theme Changes

Components can listen for theme changes using the `theme-change` event:

```js
window.addEventListener('theme-change', (event) => {
  const { theme } = event.detail;
  console.log(`Theme changed to ${theme}`);
  // Update component based on new theme
});
```

## Example Implementation

```astro
---
import ThemeProvider from '../components/common/ThemeProvider.astro';
import Header from '../components/header/Header.astro';
import Footer from '../components/footer/Footer.astro';
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- Head content -->
  </head>
  <body>
    <ThemeProvider>
      <Header />
      <main>
        <slot />
      </main>
      <Footer />
    </ThemeProvider>
  </body>
</html>
```