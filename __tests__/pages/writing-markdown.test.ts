import { describe, expect, it } from 'vitest';

import { config } from '@/lib/config';

/**
 * Tests for the writing markdown endpoint.
 *
 * Since the endpoint uses astro:content (a virtual module), we can't import
 * it directly in vitest. Instead, we extract and test the response-building
 * logic directly, which is the core of the GET handler.
 */

interface PostData {
  title: string;
  slug: string;
  date: string;
  excerpt?: string;
  content: string;
  author: string;
  section?: string;
}

/**
 * Mirrors the GET handler logic from src/pages/writing/[slug].md.ts
 * so we can test the markdown output without Astro's virtual modules.
 */
function buildMarkdownResponse(post: PostData): Response {
  const siteUrl = config.site.url;
  const canonicalUrl = `${siteUrl}/writing/${post.slug}`;

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

function createMockPost(overrides: Partial<PostData> = {}): PostData {
  return {
    title: 'Test Post Title',
    slug: 'test-post-title',
    date: '2025-06-15',
    author: 'Brennan Moore',
    content: '## Hello World\n\nThis is a test post.',
    excerpt: 'A test post excerpt',
    section: undefined,
    ...overrides,
  };
}

describe('Writing Markdown Endpoint', () => {
  describe('response headers', () => {
    it('should return text/markdown content type', async () => {
      const response = buildMarkdownResponse(createMockPost());

      expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    });

    it('should include cache-control headers', async () => {
      const response = buildMarkdownResponse(createMockPost());

      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=3600, stale-while-revalidate=86400',
      );
    });
  });

  describe('frontmatter', () => {
    it('should start and end with YAML delimiters', async () => {
      const response = buildMarkdownResponse(createMockPost());
      const body = await response.text();

      expect(body).toMatch(/^---\n/);
      // Should have exactly two --- delimiters (start and end of frontmatter)
      const delimiterCount = (body.match(/^---$/gm) || []).length;
      expect(delimiterCount).toBe(2);
    });

    it('should include title, date, author, and canonical_url', async () => {
      const response = buildMarkdownResponse(createMockPost());
      const body = await response.text();

      expect(body).toContain('title: "Test Post Title"');
      expect(body).toContain('date: "2025-06-15"');
      expect(body).toContain('author: "Brennan Moore"');
      expect(body).toContain(
        'canonical_url: "https://www.zamiang.com/writing/test-post-title"',
      );
    });

    it('should include excerpt when present', async () => {
      const response = buildMarkdownResponse(createMockPost({ excerpt: 'A short summary' }));
      const body = await response.text();

      expect(body).toContain('excerpt: "A short summary"');
    });

    it('should omit excerpt when not present', async () => {
      const response = buildMarkdownResponse(createMockPost({ excerpt: undefined }));
      const body = await response.text();

      expect(body).not.toContain('excerpt:');
    });

    it('should include section when present', async () => {
      const response = buildMarkdownResponse(createMockPost({ section: 'VBC' }));
      const body = await response.text();

      expect(body).toContain('section: "VBC"');
    });

    it('should omit section when not present', async () => {
      const response = buildMarkdownResponse(createMockPost({ section: undefined }));
      const body = await response.text();

      expect(body).not.toContain('section:');
    });

    it('should escape double quotes in title', async () => {
      const response = buildMarkdownResponse(
        createMockPost({ title: 'Post with "Quotes" in Title' }),
      );
      const body = await response.text();

      expect(body).toContain('title: "Post with \\"Quotes\\" in Title"');
    });

    it('should escape double quotes in excerpt', async () => {
      const response = buildMarkdownResponse(
        createMockPost({ excerpt: 'An excerpt with "quotes"' }),
      );
      const body = await response.text();

      expect(body).toContain('excerpt: "An excerpt with \\"quotes\\""');
    });
  });

  describe('body content', () => {
    it('should include the post title as an h1 heading after frontmatter', async () => {
      const response = buildMarkdownResponse(createMockPost({ title: 'My Great Post' }));
      const body = await response.text();

      expect(body).toContain('\n# My Great Post\n');
    });

    it('should include the full markdown content', async () => {
      const content =
        '## Section One\n\nSome paragraph text.\n\n```js\nconsole.log("hello");\n```';
      const response = buildMarkdownResponse(createMockPost({ content }));
      const body = await response.text();

      expect(body).toContain(content);
    });

    it('should structure output as frontmatter → heading → content', async () => {
      const response = buildMarkdownResponse(
        createMockPost({
          title: 'Structured Post',
          content: 'Body content here.',
        }),
      );
      const body = await response.text();

      // Split on frontmatter delimiters
      const parts = body.split('---');
      expect(parts).toHaveLength(3);

      const afterFrontmatter = parts[2];
      expect(afterFrontmatter).toMatch(/\n\n# Structured Post\n\nBody content here\./);
    });
  });

  describe('canonical URL', () => {
    it('should use /writing/ path prefix', async () => {
      const response = buildMarkdownResponse(createMockPost({ slug: 'my-slug' }));
      const body = await response.text();

      expect(body).toContain('canonical_url: "https://www.zamiang.com/writing/my-slug"');
    });

    it('should use the configured site URL', async () => {
      const response = buildMarkdownResponse(createMockPost());
      const body = await response.text();

      expect(body).toContain(`canonical_url: "${config.site.url}/writing/`);
    });
  });
});
