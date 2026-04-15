/**
 * Centralized configuration with environment variable validation
 */

/**
 * Validates and retrieves a required environment variable
 * @throws Error if the environment variable is not set
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Retrieves an optional environment variable with a default value
 */
function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Application configuration
 * Validates environment variables on import
 */
/** Title for the Value-Based Care series, used on homepage and writing index */
export const VBC_TITLE = 'Why Value-Based Care is Harder Than Rocket Science';

export const config = {
  /**
   * Site configuration
   */
  site: {
    url: getEnv('SITE_URL', 'https://www.zamiang.com'),
    title: 'Brennan Moore - Blog',
    description: 'Writing and photos by Brennan Moore',
    author: 'Brennan Moore',
  },

  /**
   * Notion API configuration
   * Required for Astro content collections to load data from Notion
   */
  notion: {
    token: process.env.NOTION_TOKEN || '',
    dataSourceId: process.env.NOTION_DATA_SOURCE_ID || '',
    photosDataSourceId: process.env.NOTION_PHOTOS_DATA_SOURCE_ID || '',
  },

  /**
   * Image configuration
   */
  images: {
    minimumCacheTTL: 2678400, // 30 days in seconds
  },
} as const;

/**
 * Validates required Notion environment variables
 * Call this when you need to access Notion API (e.g., in cache script)
 */
export function validateNotionConfig() {
  requireEnv('NOTION_TOKEN');
  requireEnv('NOTION_DATA_SOURCE_ID');
  requireEnv('NOTION_PHOTOS_DATA_SOURCE_ID');
}
