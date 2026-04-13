import { describe, expect, it } from 'vitest';

import { config } from '@/lib/config';

/**
 * Tests for the photos markdown endpoint.
 *
 * Since the endpoint uses astro:content (a virtual module), we can't import
 * it directly in vitest. Instead, we test the response-building logic directly.
 */

interface PhotoData {
  title: string;
  slug: string;
  date: string;
  excerpt?: string;
  content: string;
  author: string;
  coverImage: string;
}

/**
 * Mirrors the GET handler logic from src/pages/photos/[slug].md.ts
 */
function buildMarkdownResponse(post: PhotoData): Response {
  const siteUrl = config.site.url;
  const canonicalUrl = `${siteUrl}/photos/${post.slug}`;

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

  lines.push('---', '', `# ${post.title}`, '', post.content);

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}

function createMockPhoto(overrides: Partial<PhotoData> = {}): PhotoData {
  return {
    title: 'Sunset in Brooklyn',
    slug: 'sunset-in-brooklyn',
    date: '2025-03-10',
    author: 'Brennan Moore',
    content: 'A beautiful sunset over the Brooklyn Bridge.',
    excerpt: 'Sunset photography',
    coverImage: 'sunset.jpg',
    ...overrides,
  };
}

describe('Photos Markdown Endpoint', () => {
  describe('response headers', () => {
    it('should return text/markdown content type', async () => {
      const response = buildMarkdownResponse(createMockPhoto());

      expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    });

    it('should include cache-control headers', async () => {
      const response = buildMarkdownResponse(createMockPhoto());

      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=3600, stale-while-revalidate=86400',
      );
    });
  });

  describe('frontmatter', () => {
    it('should include required fields', async () => {
      const response = buildMarkdownResponse(createMockPhoto());
      const body = await response.text();

      expect(body).toMatch(/^---\n/);
      expect(body).toContain('title: "Sunset in Brooklyn"');
      expect(body).toContain('date: "2025-03-10"');
      expect(body).toContain('author: "Brennan Moore"');
    });

    it('should include excerpt when present', async () => {
      const response = buildMarkdownResponse(createMockPhoto({ excerpt: 'Photo description' }));
      const body = await response.text();

      expect(body).toContain('excerpt: "Photo description"');
    });

    it('should omit excerpt when not present', async () => {
      const response = buildMarkdownResponse(createMockPhoto({ excerpt: undefined }));
      const body = await response.text();

      expect(body).not.toContain('excerpt:');
    });

    it('should escape double quotes in title', async () => {
      const response = buildMarkdownResponse(
        createMockPhoto({ title: 'The "Golden" Hour' }),
      );
      const body = await response.text();

      expect(body).toContain('title: "The \\"Golden\\" Hour"');
    });

    it('should escape double quotes in excerpt', async () => {
      const response = buildMarkdownResponse(
        createMockPhoto({ excerpt: 'A "dreamy" scene' }),
      );
      const body = await response.text();

      expect(body).toContain('excerpt: "A \\"dreamy\\" scene"');
    });
  });

  describe('canonical URL', () => {
    it('should use /photos/ path prefix', async () => {
      const response = buildMarkdownResponse(createMockPhoto({ slug: 'my-photo' }));
      const body = await response.text();

      expect(body).toContain('canonical_url: "https://www.zamiang.com/photos/my-photo"');
    });
  });

  describe('body content', () => {
    it('should include the photo title as an h1 heading', async () => {
      const response = buildMarkdownResponse(createMockPhoto({ title: 'NYC at Dusk' }));
      const body = await response.text();

      expect(body).toContain('\n# NYC at Dusk\n');
    });

    it('should include the full markdown content', async () => {
      const content = 'Shot on a Fujifilm X-T5 with the 23mm f/1.4.\n\nGolden hour light.';
      const response = buildMarkdownResponse(createMockPhoto({ content }));
      const body = await response.text();

      expect(body).toContain(content);
    });

    it('should structure output as frontmatter → heading → content', async () => {
      const response = buildMarkdownResponse(
        createMockPhoto({
          title: 'My Photo',
          content: 'Photo description here.',
        }),
      );
      const body = await response.text();

      const parts = body.split('---');
      expect(parts).toHaveLength(3);

      const afterFrontmatter = parts[2];
      expect(afterFrontmatter).toMatch(/\n\n# My Photo\n\nPhoto description here\./);
    });
  });
});
