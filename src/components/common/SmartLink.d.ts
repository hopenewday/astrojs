/**
 * Type definitions for SmartLink component
 */

export interface SmartLinkProps {
  /** URL to link to (required) */
  href: string;
  
  /** Link text content (optional, will generate semantic text if not provided) */
  text?: string;
  
  /** Alternative text for screen readers (optional) */
  ariaLabel?: string;
  
  /** Whether this link points to trending or featured content */
  trending?: boolean;
  
  /** Whether this link points to featured content */
  featured?: boolean;
  
  /** Custom CSS class to apply to the link */
  class?: string;
  
  /** Whether to open link in a new tab */
  newTab?: boolean;
  
  /** Whether to add nofollow attribute */
  nofollow?: boolean;
  
  /** Whether to add sponsored attribute */
  sponsored?: boolean;
  
  /** Whether to add ugc (user-generated content) attribute */
  ugc?: boolean;
  
  /** Whether to enable lazy loading of the link */
  lazyLoad?: boolean;
  
  /** Threshold for lazy loading (0-1, percentage of viewport) */
  lazyThreshold?: number;
  
  /** Custom data to include in analytics events */
  analyticsData?: Record<string, any>;
  
  /** Custom event name for analytics tracking */
  analyticsEvent?: string;
  
  /** Custom color scheme (primary, secondary, accent, etc.) */
  colorScheme?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'success' | 'warning' | 'error' | 'info';
  
  /** Custom hover effect */
  hoverEffect?: 'underline' | 'highlight' | 'scale' | 'glow' | 'none';
  
  /** Current language code for i18n support */
  lang?: string;
  
  /** Supported languages for i18n */
  supportedLanguages?: string[];
  
  /** Default language */
  defaultLang?: string;
  
  /** Fallback text if link data is unavailable */
  fallbackText?: string;
  
  /** Whether to disable the link */
  disabled?: boolean;
  
  /** Whether to show an icon */
  showIcon?: boolean;
  
  /** Icon name or URL */
  icon?: string;
  
  /** Icon position (before or after text) */
  iconPosition?: 'before' | 'after';
}

// Declare global window interface extensions for analytics
declare global {
  interface Window {
    trackEvent?: (eventName: string, eventData: Record<string, any>) => void;
    umami?: {
      track: (eventName: string, eventData: Record<string, any>) => void;
    };
    userId?: string;
    hasAnalyticsConsent?: () => boolean;
    enableAnalytics?: () => void;
    disableAnalytics?: () => void;
  }
}