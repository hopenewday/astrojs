# Ad Management System

This directory contains components for managing advertisements throughout the application. The system provides standardized ad containers with features like lazy loading, placeholders, and responsive behavior.

## Features

- **Standardized Ad Formats**: Pre-configured components for common ad sizes
- **Lazy Loading**: Ads load only when they're about to enter the viewport
- **Placeholders**: Prevent layout shifts with properly sized placeholders
- **Frequency Capping**: Limit how often users see specific ads
- **Privacy Enhancements**: Only show ads after consent is given
- **Responsive Behavior**: Adapt to different screen sizes

## Components

### AdSlot.astro

Base component that handles the core ad functionality.

```astro
<AdSlot
  id="unique-ad-id"
  format="leaderboard"
  lazyLoad={true}
  showPlaceholder={true}
  requireConsent={true}
>
  <!-- Ad content goes here -->
</AdSlot>
```

### Format-Specific Components

- **LeaderboardAd.astro**: 728×90 format (horizontal banner)
- **RectangleAd.astro**: 300×250 format (medium rectangle)
- **SidebarAd.astro**: 300×600 format (half page)
- **MobileAd.astro**: 320×50 format (mobile banner)

## Usage Examples

### Basic Usage

```astro
---
import { LeaderboardAd } from '../components/ads';
---

<LeaderboardAd id="header-ad" />
```

### With Custom Content

```astro
---
import { RectangleAd } from '../components/ads';
---

<RectangleAd id="in-content-ad">
  <!-- Custom ad implementation -->
  <div class="custom-ad-content">
    <img src="/ads/example.jpg" alt="Advertisement" width="300" height="250" />
  </div>
</RectangleAd>
```

### Mobile-Only Ad

```astro
---
import { MobileAd } from '../components/ads';
---

<MobileAd id="mobile-sticky" class="mobile-only-ad" />
```

## Integration with Ad Providers

To integrate with ad providers like Google Ad Manager or AdSense, you can add the provider's script to the ad slot:

```astro
---
import { LeaderboardAd } from '../components/ads';
---

<LeaderboardAd id="gam-leaderboard">
  <script>
    // Google Ad Manager example
    googletag.cmd.push(function() {
      googletag.display('gam-leaderboard');
    });
  </script>
</LeaderboardAd>
```

## Frequency Capping

The ad system includes built-in frequency capping to limit how often users see specific ads. This is managed through localStorage and can be configured in the AdSlot component.

## Consent Management

Ads can be configured to only display after the user has given consent. This is managed through the `requireConsent` prop and localStorage.

## Styling

Ad components use CSS variables from the theme system and adapt to both light and dark modes. You can customize the appearance by overriding these variables or adding additional styles.