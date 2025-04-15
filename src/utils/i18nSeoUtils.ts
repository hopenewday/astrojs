/**
 * i18nSeoUtils.ts - Utilities for localized SEO
 * 
 * This file provides utilities for managing localized SEO content such as
 * keywords, descriptions, and other metadata across different languages.
 */

/**
 * Interface for localized SEO metadata
 */
export interface LocalizedSeoData {
  title: string;
  description: string;
  keywords: string[];
  imageAlt?: string;
}

/**
 * Type for a collection of localized SEO data by language code
 */
export type LocalizedSeoDataMap = Record<string, LocalizedSeoData>;

/**
 * Get localized SEO data for a specific language
 * @param dataMap Map of localized SEO data by language code
 * @param lang Language code to retrieve data for
 * @param defaultLang Fallback language code if requested language is not available
 * @returns Localized SEO data for the requested language or fallback
 */
export function getLocalizedSeoData(
  dataMap: LocalizedSeoDataMap,
  lang: string,
  defaultLang: string = 'en'
): LocalizedSeoData {
  // Return requested language data if available
  if (dataMap[lang]) {
    return dataMap[lang];
  }
  
  // Fall back to default language
  if (dataMap[defaultLang]) {
    return dataMap[defaultLang];
  }
  
  // If no data is available, throw an error
  throw new Error(`No SEO data available for language '${lang}' or default '${defaultLang}'`);
}

/**
 * Generate language-region code mapping (e.g., 'en' to 'en-US')
 * @param languages List of language codes
 * @param regionMap Custom mapping of language to region
 * @returns Record mapping language codes to language-region codes
 */
export function generateLangRegionMap(
  languages: string[],
  regionMap: Record<string, string> = {}
): Record<string, string> {
  const defaultRegions: Record<string, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-BR',
    ja: 'ja-JP',
    zh: 'zh-CN',
    ru: 'ru-RU',
    ar: 'ar-SA',
    hi: 'hi-IN',
    bn: 'bn-BD',
  };

  const result: Record<string, string> = {};
  
  // Generate mapping for each language
  for (const lang of languages) {
    // Use custom mapping if available, otherwise use default or just the language code
    result[lang] = regionMap[lang] || defaultRegions[lang] || lang;
  }
  
  return result;
}

/**
 * Extract language from URL path
 * @param path URL path that may contain language prefix
 * @param supportedLanguages List of supported language codes
 * @param defaultLang Default language to return if no language is found in path
 * @returns The detected language code and the path without language prefix
 */
export function extractLanguageFromPath(
  path: string,
  supportedLanguages: string[],
  defaultLang: string = 'en'
): { lang: string; path: string } {
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Check if path starts with a supported language code
  for (const lang of supportedLanguages) {
    if (
      normalizedPath === `/${lang}` ||
      normalizedPath === `/${lang}/` ||
      normalizedPath.startsWith(`/${lang}/`)
    ) {
      // Remove language prefix from path
      const pathWithoutLang = normalizedPath.replace(`/${lang}`, '') || '/';
      return { lang, path: pathWithoutLang };
    }
  }
  
  // No language found in path, return default
  return { lang: defaultLang, path: normalizedPath };
}