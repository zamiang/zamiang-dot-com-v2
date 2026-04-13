/**
 * Markdown endpoint for individual writing posts
 * Serves raw markdown content for AI agents and tools
 */
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

import { config } from '../../lib/config';
import { type MarkdownPostData, buildMarkdownResponse } from '../../lib/markdown-response';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  const vbcPosts = await getCollection('vbcPosts');
  const allPosts = [...posts, ...vbcPosts];

  return allPosts.map((post) => ({
    params: { slug: post.data.slug },
    props: { post: post.data },
  }));
}

export async function GET(context: APIContext) {
  const post = context.props.post as MarkdownPostData;
  return buildMarkdownResponse(post, 'writing', config.site.url);
}
