/**
 * Shared utility for building markdown responses from post data.
 * Used by the /writing/[slug].md and /photos/[slug].md endpoints.
 * Extracted here so vitest can test the real logic without astro:content.
 */

export interface MarkdownPostData {
  title: string;
  slug: string;
  date: string;
  excerpt?: string;
  content: string;
  author: string;
  section?: string;
}

/**
 * Escapes a string for use in a YAML double-quoted scalar.
 * Handles backslashes (must be first) and double quotes.
 */
function escapeYamlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Builds a markdown Response with YAML frontmatter for a given post.
 *
 * @param post - The post data to render as markdown
 * @param type - The content type path prefix ('writing' or 'photos')
 * @param siteUrl - The base site URL for canonical links
 */
export function buildMarkdownResponse(
  post: MarkdownPostData,
  type: 'writing' | 'photos',
  siteUrl: string,
): Response {
  const canonicalUrl = `${siteUrl}/${type}/${post.slug}`;

  const lines = [
    '---',
    `title: "${escapeYamlString(post.title)}"`,
    `date: "${post.date}"`,
    `author: "${escapeYamlString(post.author)}"`,
    `canonical_url: "${canonicalUrl}"`,
  ];

  if (post.excerpt) {
    lines.push(`excerpt: "${escapeYamlString(post.excerpt)}"`);
  }
  if (post.section) {
    lines.push(`section: "${escapeYamlString(post.section)}"`);
  }

  lines.push('---', '', `# ${post.title}`, '', post.content);

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
