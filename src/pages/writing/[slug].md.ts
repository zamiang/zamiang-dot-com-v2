/**
 * Markdown endpoint for individual writing posts
 * Serves raw markdown content for AI agents and tools
 */
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

import { config } from '../../lib/config';

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
  const post = context.props.post as {
    title: string;
    slug: string;
    date: string;
    excerpt?: string;
    content: string;
    author: string;
    section?: string;
  };

  const siteUrl = config.site.url;
  const canonicalUrl = `${siteUrl}/writing/${post.slug}`;

  // Build markdown with frontmatter
  const lines = [
    '---',
    `title: "${post.title.replace(/"/g, '\\"')}"`,
    `date: "${post.date}"`,
    `author: "${post.author}"`,
    `canonical_url: "${canonicalUrl}"`,
  ];

  if (post.excerpt) {
    lines.push(`excerpt: "${post.excerpt.replace(/"/g, '\\"')}"`);
  }
  if (post.section) {
    lines.push(`section: "${post.section}"`);
  }

  lines.push('---', '', `# ${post.title}`, '', post.content);

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
