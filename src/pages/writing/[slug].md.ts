/**
 * Markdown endpoint for individual writing posts
 * Serves raw markdown content for AI agents and tools
 */
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

import { config } from '../../lib/config';
import { buildMarkdownResponse, toMarkdownPostData } from '../../lib/markdown-response';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  const vbcPosts = await getCollection('vbcPosts');

  // Deduplicate by slug — if both collections contain the same slug,
  // the first entry wins (matches posts before vbcPosts).
  const seen = new Map<string, (typeof posts)[number]>();
  for (const post of [...posts, ...vbcPosts]) {
    if (!seen.has(post.data.slug)) {
      seen.set(post.data.slug, post);
    }
  }

  return Array.from(seen.values()).map((post) => ({
    params: { slug: post.data.slug },
    props: { post: post.data },
  }));
}

export async function GET(context: APIContext) {
  const post = toMarkdownPostData(context.props.post as Record<string, unknown>);
  return buildMarkdownResponse(post, 'writing', config.site.url);
}
