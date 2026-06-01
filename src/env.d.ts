// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />

/**
 * Astro Environment Type Declarations
 * Provides types for import.meta.env and Astro virtual modules
 */

interface ImportMetaEnv {
  readonly NOTION_TOKEN?: string;
  readonly NOTION_DATA_SOURCE_ID?: string;
  readonly NOTION_PHOTOS_DATA_SOURCE_ID?: string;
  readonly SITE_URL?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
