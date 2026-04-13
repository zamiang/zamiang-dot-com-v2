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
 * Handles backslashes (must be first), then double quotes and control characters.
 */
export function escapeYamlString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Safely maps raw post data to MarkdownPostData, providing defaults
 * for missing fields instead of silently passing through nulls.
 */
export function toMarkdownPostData(raw: Record<string, unknown>): MarkdownPostData {
  return {
    title: String(raw.title ?? 'Untitled'),
    slug: String(raw.slug ?? ''),
    date: String(raw.date ?? ''),
    author: String(raw.author ?? ''),
    content: String(raw.content ?? ''),
    excerpt: raw.excerpt ? String(raw.excerpt) : undefined,
    section: raw.section ? String(raw.section) : undefined,
  };
}

/**
 * Escapes markdown formatting characters so text renders literally.
 * Used for the H1 title in the body to prevent unintended bold/italic/etc.
 */
function escapeMarkdown(value: string): string {
  return value.replace(/([*_`~\[\]#|\\>])/g, '\\$1');
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

  // All string values are escaped for YAML double-quoted scalars,
  // even date and canonical_url, for consistency.
  const lines = [
    '---',
    `title: "${escapeYamlString(post.title)}"`,
    `date: "${escapeYamlString(post.date)}"`,
    `author: "${escapeYamlString(post.author)}"`,
    `canonical_url: "${escapeYamlString(canonicalUrl)}"`,
  ];

  if (post.excerpt) {
    lines.push(`excerpt: "${escapeYamlString(post.excerpt)}"`);
  }
  if (post.section) {
    lines.push(`section: "${escapeYamlString(post.section)}"`);
  }

  lines.push('---', '', `# ${escapeMarkdown(post.title)}`, '', post.content);

  // Headers are set here for `astro preview` (local dev). In production,
  // Cloudflare Pages serves these as static files and public/_headers
  // is the authoritative source for Content-Type and Cache-Control.
  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
