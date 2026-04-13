/**
 * Markdown endpoint for individual photo posts
 * Serves raw markdown content for AI agents and tools
 */
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

import { config } from '../../lib/config';
import { type MarkdownPostData, buildMarkdownResponse } from '../../lib/markdown-response';

export async function getStaticPaths() {
  const photos = await getCollection('photos');

  return photos.map((photo) => ({
    params: { slug: photo.data.slug },
    props: { post: photo.data },
  }));
}

export async function GET(context: APIContext) {
  const post = context.props.post as MarkdownPostData;
  return buildMarkdownResponse(post, 'photos', config.site.url);
}
