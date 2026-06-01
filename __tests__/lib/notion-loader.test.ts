import { buildImageFigure, escapeHtml, queryAllPages } from '@/lib/notion-loader';
import type { Client } from '@notionhq/client';
import { describe, expect, it, vi } from 'vitest';

describe('notion-loader.ts - Unit Tests', () => {
  describe('escapeHtml', () => {
    it('escapes the minimal XSS-relevant character set', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('say "hi"')).toBe('say &quot;hi&quot;');
    });

    it('escapes ampersands before other entities (no double-escaping)', () => {
      expect(escapeHtml('a < b & c')).toBe('a &lt; b &amp; c');
    });
  });

  describe('buildImageFigure', () => {
    it('returns an empty string when the filename is undefined', () => {
      // Critical bug: a missing filename must NOT produce <img src="/images/undefined">
      expect(buildImageFigure(undefined, 'a caption')).toBe('');
    });

    it('returns an empty string when the filename is empty', () => {
      expect(buildImageFigure('', '')).toBe('');
    });

    it('builds a figure with an escaped alt attribute and no caption when caption is empty', () => {
      expect(buildImageFigure('photo.jpg', '')).toBe(
        '<figure><img src="/images/photo.jpg" alt="" /></figure>',
      );
    });

    it('includes a figcaption and escapes caption text in both alt and figcaption', () => {
      expect(buildImageFigure('photo.jpg', 'Me & "you" <here>')).toBe(
        '<figure><img src="/images/photo.jpg" alt="Me &amp; &quot;you&quot; &lt;here&gt;" />' +
          '<figcaption>Me &amp; &quot;you&quot; &lt;here&gt;</figcaption></figure>',
      );
    });
  });

  describe('queryAllPages', () => {
    it('returns the single page of results when has_more is false', async () => {
      const query = vi.fn().mockResolvedValue({
        results: [{ id: '1' }, { id: '2' }],
        has_more: false,
        next_cursor: null,
      });
      const notion = { dataSources: { query } } as unknown as Client;

      const pages = await queryAllPages(notion, { data_source_id: 'db' });

      expect(pages).toEqual([{ id: '1' }, { id: '2' }]);
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('follows next_cursor and concatenates every page', async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce({
          results: [{ id: '1' }],
          has_more: true,
          next_cursor: 'cursor-1',
        })
        .mockResolvedValueOnce({
          results: [{ id: '2' }],
          has_more: true,
          next_cursor: 'cursor-2',
        })
        .mockResolvedValueOnce({
          results: [{ id: '3' }],
          has_more: false,
          next_cursor: null,
        });
      const notion = { dataSources: { query } } as unknown as Client;

      const pages = await queryAllPages(notion, { data_source_id: 'db' });

      expect(pages).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
      expect(query).toHaveBeenCalledTimes(3);
      // First call must not pass a cursor; later calls must forward the previous cursor.
      expect(query.mock.calls[0][0]).not.toHaveProperty('start_cursor');
      expect(query.mock.calls[1][0]).toMatchObject({ start_cursor: 'cursor-1' });
      expect(query.mock.calls[2][0]).toMatchObject({ start_cursor: 'cursor-2' });
    });
  });
});
