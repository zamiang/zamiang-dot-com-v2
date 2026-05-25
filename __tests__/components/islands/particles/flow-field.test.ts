import { describe, expect, it } from 'vitest';

import {
  generateFlowFieldTexture,
  sampleCurl,
} from '../../../../src/components/islands/particles/renderer/flow-field';

describe('sampleCurl', () => {
  it('returns bounded values', () => {
    for (let i = 0; i < 100; i++) {
      const [x, y] = sampleCurl(Math.random() * 10, Math.random() * 10, Math.random() * 10);
      expect(x).toBeGreaterThanOrEqual(-1);
      expect(x).toBeLessThanOrEqual(1);
      expect(y).toBeGreaterThanOrEqual(-1);
      expect(y).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic for the same inputs', () => {
    const a = sampleCurl(1.5, 2.5, 0.7);
    const b = sampleCurl(1.5, 2.5, 0.7);
    expect(a[0]).toBe(b[0]);
    expect(a[1]).toBe(b[1]);
  });
});

describe('generateFlowFieldTexture', () => {
  it('returns a Uint8Array of length grid*grid*2 (RG)', () => {
    const data = generateFlowFieldTexture(16, 0);
    expect(data).toBeInstanceOf(Uint8Array);
    expect(data.length).toBe(16 * 16 * 2);
  });

  it('encodes signed [-1,1] curl into unsigned [0,255]', () => {
    const data = generateFlowFieldTexture(16, 0);
    for (let i = 0; i < data.length; i++) {
      expect(data[i]).toBeGreaterThanOrEqual(0);
      expect(data[i]).toBeLessThanOrEqual(255);
    }
  });

  it('produces different output for different time inputs', () => {
    const a = generateFlowFieldTexture(16, 0);
    const b = generateFlowFieldTexture(16, 10);
    let differs = false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });
});
