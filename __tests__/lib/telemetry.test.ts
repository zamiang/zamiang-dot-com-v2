import { describe, expect, it } from 'vitest';

import { photoFileId } from '../../src/lib/telemetry';

describe('photoFileId', () => {
  it('formats as IMG_NNNN with four digits', () => {
    expect(photoFileId('a')).toMatch(/^IMG_\d{4}$/);
    expect(photoFileId('long-slug-with-many-characters-1234')).toMatch(/^IMG_\d{4}$/);
  });

  it('is deterministic', () => {
    expect(photoFileId('rotterdam')).toBe(photoFileId('rotterdam'));
  });

  it('produces values in the 0000–9999 range', () => {
    const samples = ['', 'a', 'rotterdam', 'IMG_0000.jpg', '🦊', 'x'.repeat(1000)];
    for (const s of samples) {
      const id = photoFileId(s);
      const n = Number(id.slice(4));
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(9999);
    }
  });

  it('handles the empty string', () => {
    expect(photoFileId('')).toBe('IMG_0000');
  });
});
