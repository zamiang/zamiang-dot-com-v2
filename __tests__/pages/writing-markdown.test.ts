import { config } from '@/lib/config';
import {
  type MarkdownPostData,
  buildMarkdownResponse,
  escapeYamlString,
  toMarkdownPostData,
} from '@/lib/markdown-response';
import { describe, expect, it } from 'vitest';

function createMockPost(overrides: Partial<MarkdownPostData> = {}): MarkdownPostData {
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

function buildWritingResponse(post: MarkdownPostData): Response {
  return buildMarkdownResponse(post, 'writing', config.site.url);
}

describe('Writing Markdown Endpoint', () => {
  describe('response headers', () => {
    it('should return text/markdown content type', async () => {
      const response = buildWritingResponse(createMockPost());

      expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    });

    it('should include cache-control headers', async () => {
      const response = buildWritingResponse(createMockPost());

      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=3600, stale-while-revalidate=86400',
      );
    });
  });

  describe('frontmatter', () => {
    it('should start and end with YAML delimiters', async () => {
      const response = buildWritingResponse(createMockPost());
      const body = await response.text();

      expect(body).toMatch(/^---\n/);
      const delimiterCount = (body.match(/^---$/gm) || []).length;
      expect(delimiterCount).toBe(2);
    });

    it('should include title, date, author, and canonical_url', async () => {
      const response = buildWritingResponse(createMockPost());
      const body = await response.text();

      expect(body).toContain('title: "Test Post Title"');
      expect(body).toContain('date: "2025-06-15"');
      expect(body).toContain('author: "Brennan Moore"');
      expect(body).toContain('canonical_url: "https://www.zamiang.com/writing/test-post-title"');
    });

    it('should include excerpt when present', async () => {
      const response = buildWritingResponse(createMockPost({ excerpt: 'A short summary' }));
      const body = await response.text();

      expect(body).toContain('excerpt: "A short summary"');
    });

    it('should omit excerpt when not present', async () => {
      const response = buildWritingResponse(createMockPost({ excerpt: undefined }));
      const body = await response.text();

      expect(body).not.toContain('excerpt:');
    });

    it('should include section when present', async () => {
      const response = buildWritingResponse(createMockPost({ section: 'VBC' }));
      const body = await response.text();

      expect(body).toContain('section: "VBC"');
    });

    it('should omit section when not present', async () => {
      const response = buildWritingResponse(createMockPost({ section: undefined }));
      const body = await response.text();

      expect(body).not.toContain('section:');
    });

    it('should escape double quotes in title', async () => {
      const response = buildWritingResponse(
        createMockPost({ title: 'Post with "Quotes" in Title' }),
      );
      const body = await response.text();

      expect(body).toContain('title: "Post with \\"Quotes\\" in Title"');
    });

    it('should escape double quotes in excerpt', async () => {
      const response = buildWritingResponse(
        createMockPost({ excerpt: 'An excerpt with "quotes"' }),
      );
      const body = await response.text();

      expect(body).toContain('excerpt: "An excerpt with \\"quotes\\""');
    });

    it('should escape backslashes in title', async () => {
      const response = buildWritingResponse(createMockPost({ title: 'The \\n (newline)' }));
      const body = await response.text();

      expect(body).toContain('title: "The \\\\n (newline)"');
    });

    it('should escape the date field', async () => {
      const response = buildWritingResponse(createMockPost({ date: '2025-06-15' }));
      const body = await response.text();

      expect(body).toContain('date: "2025-06-15"');
    });

    it('should escape backslashes before quotes', async () => {
      const response = buildWritingResponse(createMockPost({ title: 'path\\to\\"file"' }));
      const body = await response.text();

      expect(body).toContain('title: "path\\\\to\\\\\\"file\\""');
    });
  });

  describe('body content', () => {
    it('should include the post title as an h1 heading after frontmatter', async () => {
      const response = buildWritingResponse(createMockPost({ title: 'My Great Post' }));
      const body = await response.text();

      expect(body).toContain('\n# My Great Post\n');
    });

    it('should escape markdown syntax in the h1 title', async () => {
      const response = buildWritingResponse(
        createMockPost({ title: 'Lessons from "The **Hard** Way"' }),
      );
      const body = await response.text();

      // Bold markers should be escaped so they render literally
      expect(body).toContain('# Lessons from "The \\*\\*Hard\\*\\* Way"');
    });

    it('should include the full markdown content', async () => {
      const content = '## Section One\n\nSome paragraph text.\n\n```js\nconsole.log("hello");\n```';
      const response = buildWritingResponse(createMockPost({ content }));
      const body = await response.text();

      expect(body).toContain(content);
    });

    it('should structure output as frontmatter → heading → content', async () => {
      const response = buildWritingResponse(
        createMockPost({
          title: 'Structured Post',
          content: 'Body content here.',
        }),
      );
      const body = await response.text();

      const parts = body.split('---');
      expect(parts).toHaveLength(3);

      const afterFrontmatter = parts[2];
      expect(afterFrontmatter).toMatch(/\n\n# Structured Post\n\nBody content here\./);
    });
  });

  describe('canonical URL', () => {
    it('should use /writing/ path prefix', async () => {
      const response = buildWritingResponse(createMockPost({ slug: 'my-slug' }));
      const body = await response.text();

      expect(body).toContain('canonical_url: "https://www.zamiang.com/writing/my-slug"');
    });

    it('should use the configured site URL', async () => {
      const response = buildWritingResponse(createMockPost());
      const body = await response.text();

      expect(body).toContain(`canonical_url: "${config.site.url}/writing/`);
    });
  });
});

describe('escapeYamlString', () => {
  it('should escape backslashes', () => {
    expect(escapeYamlString('a\\b')).toBe('a\\\\b');
  });

  it('should escape double quotes', () => {
    expect(escapeYamlString('say "hello"')).toBe('say \\"hello\\"');
  });

  it('should escape newlines', () => {
    expect(escapeYamlString('line1\nline2')).toBe('line1\\nline2');
  });

  it('should escape carriage returns', () => {
    expect(escapeYamlString('line1\rline2')).toBe('line1\\rline2');
  });

  it('should escape tabs', () => {
    expect(escapeYamlString('col1\tcol2')).toBe('col1\\tcol2');
  });

  it('should escape backslashes before other characters', () => {
    // Backslash followed by quote: \ then " → \\ then \"
    expect(escapeYamlString('\\"')).toBe('\\\\\\"');
  });

  it('should handle strings with no special characters', () => {
    expect(escapeYamlString('plain text')).toBe('plain text');
  });
});

describe('toMarkdownPostData', () => {
  it('should map all fields from raw data', () => {
    const raw = {
      title: 'My Post',
      slug: 'my-post',
      date: '2025-01-01',
      author: 'Author',
      content: 'Content here',
      excerpt: 'Excerpt',
      section: 'VBC',
    };
    const result = toMarkdownPostData(raw);

    expect(result).toEqual(raw);
  });

  it('should default title to "Untitled" when missing', () => {
    const result = toMarkdownPostData({});
    expect(result.title).toBe('Untitled');
  });

  it('should default string fields to empty string when missing', () => {
    const result = toMarkdownPostData({});
    expect(result.slug).toBe('');
    expect(result.date).toBe('');
    expect(result.author).toBe('');
    expect(result.content).toBe('');
  });

  it('should set optional fields to undefined when missing', () => {
    const result = toMarkdownPostData({ title: 'Test' });
    expect(result.excerpt).toBeUndefined();
    expect(result.section).toBeUndefined();
  });

  it('should coerce null values to defaults', () => {
    const result = toMarkdownPostData({ title: null, slug: null, excerpt: null });
    expect(result.title).toBe('Untitled');
    expect(result.slug).toBe('');
    expect(result.excerpt).toBeUndefined();
  });

  it('should coerce numeric values to strings', () => {
    const result = toMarkdownPostData({ title: 42, slug: 123 });
    expect(result.title).toBe('42');
    expect(result.slug).toBe('123');
  });
});
