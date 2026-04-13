import { config } from '@/lib/config';
import { type MarkdownPostData, buildMarkdownResponse } from '@/lib/markdown-response';
import { describe, expect, it } from 'vitest';

function createMockPhoto(overrides: Partial<MarkdownPostData> = {}): MarkdownPostData {
  return {
    title: 'Sunset in Brooklyn',
    slug: 'sunset-in-brooklyn',
    date: '2025-03-10',
    author: 'Brennan Moore',
    content: 'A beautiful sunset over the Brooklyn Bridge.',
    excerpt: 'Sunset photography',
    ...overrides,
  };
}

function buildPhotoResponse(post: MarkdownPostData): Response {
  return buildMarkdownResponse(post, 'photos', config.site.url);
}

describe('Photos Markdown Endpoint', () => {
  describe('response headers', () => {
    it('should return text/markdown content type', async () => {
      const response = buildPhotoResponse(createMockPhoto());

      expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    });

    it('should include cache-control headers', async () => {
      const response = buildPhotoResponse(createMockPhoto());

      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=3600, stale-while-revalidate=86400',
      );
    });
  });

  describe('frontmatter', () => {
    it('should include required fields', async () => {
      const response = buildPhotoResponse(createMockPhoto());
      const body = await response.text();

      expect(body).toMatch(/^---\n/);
      expect(body).toContain('title: "Sunset in Brooklyn"');
      expect(body).toContain('date: "2025-03-10"');
      expect(body).toContain('author: "Brennan Moore"');
    });

    it('should include excerpt when present', async () => {
      const response = buildPhotoResponse(createMockPhoto({ excerpt: 'Photo description' }));
      const body = await response.text();

      expect(body).toContain('excerpt: "Photo description"');
    });

    it('should omit excerpt when not present', async () => {
      const response = buildPhotoResponse(createMockPhoto({ excerpt: undefined }));
      const body = await response.text();

      expect(body).not.toContain('excerpt:');
    });

    it('should escape double quotes in title', async () => {
      const response = buildPhotoResponse(createMockPhoto({ title: 'The "Golden" Hour' }));
      const body = await response.text();

      expect(body).toContain('title: "The \\"Golden\\" Hour"');
    });

    it('should escape double quotes in excerpt', async () => {
      const response = buildPhotoResponse(createMockPhoto({ excerpt: 'A "dreamy" scene' }));
      const body = await response.text();

      expect(body).toContain('excerpt: "A \\"dreamy\\" scene"');
    });

    it('should escape backslashes in title', async () => {
      const response = buildPhotoResponse(createMockPhoto({ title: 'Path\\to\\photo' }));
      const body = await response.text();

      expect(body).toContain('title: "Path\\\\to\\\\photo"');
    });

    it('should escape newlines in excerpt', async () => {
      const response = buildPhotoResponse(createMockPhoto({ excerpt: 'Line one\nLine two' }));
      const body = await response.text();

      expect(body).toContain('excerpt: "Line one\\nLine two"');
    });
  });

  describe('canonical URL', () => {
    it('should use /photos/ path prefix', async () => {
      const response = buildPhotoResponse(createMockPhoto({ slug: 'my-photo' }));
      const body = await response.text();

      expect(body).toContain('canonical_url: "https://www.zamiang.com/photos/my-photo"');
    });
  });

  describe('body content', () => {
    it('should include the photo title as an h1 heading', async () => {
      const response = buildPhotoResponse(createMockPhoto({ title: 'NYC at Dusk' }));
      const body = await response.text();

      expect(body).toContain('\n# NYC at Dusk\n');
    });

    it('should include the full markdown content', async () => {
      const content = 'Shot on a Fujifilm X-T5 with the 23mm f/1.4.\n\nGolden hour light.';
      const response = buildPhotoResponse(createMockPhoto({ content }));
      const body = await response.text();

      expect(body).toContain(content);
    });

    it('should structure output as frontmatter → heading → content', async () => {
      const response = buildPhotoResponse(
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
