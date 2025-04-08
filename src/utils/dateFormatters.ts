/**
 * Utility functions for formatting dates in articles
 */

type DateInput = Date | string | number;

/**
 * Format a date in a localized format (e.g., "January 1, 2023")
 */
export function formatDate(date: DateInput, locale = 'en-US'): string {
  const dateObj = new Date(date);
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);
}

/**
 * Format a date in ISO 8601 format (e.g., "2023-01-01T12:00:00Z")
 */
export function formatISODate(date: DateInput): string {
  const dateObj = new Date(date);
  return dateObj.toISOString();
}

/**
 * Format a date in a short format (e.g., "Jan 1, 2023")
 */
export function formatShortDate(date: DateInput, locale = 'en-US'): string {
  const dateObj = new Date(date);
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj);
}

/**
 * Format a date with time (e.g., "January 1, 2023 at 12:00 PM")
 */
export function formatDateTime(date: DateInput, locale = 'en-US'): string {
  const dateObj = new Date(date);
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short'
  }).format(dateObj);
}

/**
 * Get a relative time string (e.g., "2 days ago", "just now")
 */
export function getRelativeTimeString(date: DateInput, locale = 'en-US'): string {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  
  // Convert to seconds
  const diffInSecs = Math.floor(diffInMs / 1000);
  
  // Less than a minute
  if (diffInSecs < 60) {
    return 'just now';
  }
  
  // Convert to minutes
  const diffInMins = Math.floor(diffInSecs / 60);
  
  // Less than an hour
  if (diffInMins < 60) {
    return formatRelativeTime(diffInMins, 'minute', locale);
  }
  
  // Convert to hours
  const diffInHours = Math.floor(diffInMins / 60);
  
  // Less than a day
  if (diffInHours < 24) {
    return formatRelativeTime(diffInHours, 'hour', locale);
  }
  
  // Convert to days
  const diffInDays = Math.floor(diffInHours / 24);
  
  // Less than a week
  if (diffInDays < 7) {
    return formatRelativeTime(diffInDays, 'day', locale);
  }
  
  // Convert to weeks
  const diffInWeeks = Math.floor(diffInDays / 7);
  
  // Less than a month (approximated as 4 weeks)
  if (diffInWeeks < 4) {
    return formatRelativeTime(diffInWeeks, 'week', locale);
  }
  
  // Convert to months
  const diffInMonths = Math.floor(diffInDays / 30);
  
  // Less than a year
  if (diffInMonths < 12) {
    return formatRelativeTime(diffInMonths, 'month', locale);
  }
  
  // Convert to years
  const diffInYears = Math.floor(diffInDays / 365);
  return formatRelativeTime(diffInYears, 'year', locale);
}

/**
 * Helper function to format relative time with Intl.RelativeTimeFormat
 */
function formatRelativeTime(
  value: number,
  unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second',
  locale = 'en-US'
): string {
  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto'
  });
  
  return formatter.format(-value, unit);
}

/**
 * Calculate reading time for an article
 * @param text The article text content
 * @param wordsPerMinute Average reading speed (default: 200 words per minute)
 * @returns Reading time in minutes
 */
export function calculateReadingTime(text: string, wordsPerMinute = 200): number {
  // Remove HTML tags if present
  const plainText = text.replace(/<[^>]*>/g, '');
  
  // Count words by splitting on whitespace
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  
  // Calculate reading time in minutes
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  
  // Return at least 1 minute
  return Math.max(1, readingTime);
}

/**
 * Format reading time with proper pluralization
 */
export function formatReadingTime(minutes: number): string {
  return `${minutes} min${minutes !== 1 ? 's' : ''} read`;
}