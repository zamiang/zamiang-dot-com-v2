/**
 * Astro Content Collections Configuration
 *
 * Defines the schema for posts, VBC posts, and photos loaded from Notion.
 * Env vars are declared in astro.config.mjs env schema and imported from astro:env/server.
 */
import { defineCollection, z } from 'astro:content';
import { NOTION_DATA_SOURCE_ID, NOTION_PHOTOS_DATA_SOURCE_ID } from 'astro:env/server';

import { notionLoader } from '../lib/notion-loader';

// Schema shared by all content types
const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  coverImage: z.string(),
  date: z.string(),
  dateModified: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string(),
  author: z.string(),
  section: z.string().optional(),
  showToc: z.boolean().optional(),
});

// All section posts (general blog posts)
const posts = defineCollection({
  loader: notionLoader({
    dataSourceId: NOTION_DATA_SOURCE_ID || '',
    filter: {
      property: 'Section',
      select: { equals: 'All' },
    },
  }),
  schema: postSchema,
});

// VBC (Value-Based Care) series posts
const vbcPosts = defineCollection({
  loader: notionLoader({
    dataSourceId: NOTION_DATA_SOURCE_ID || '',
    filter: {
      property: 'Section',
      select: { equals: 'VBC' },
    },
  }),
  schema: postSchema,
});

// Photo posts
const photos = defineCollection({
  loader: notionLoader({
    dataSourceId: NOTION_PHOTOS_DATA_SOURCE_ID || '',
  }),
  schema: postSchema,
});

export const collections = {
  posts,
  vbcPosts,
  photos,
};
