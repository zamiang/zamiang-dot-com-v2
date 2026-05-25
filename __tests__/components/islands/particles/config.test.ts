import { describe, expect, it } from 'vitest';

import {
  detectTier,
  getMaxDpr,
  getParticleCount,
} from '../../../../src/components/islands/particles/renderer/config';

describe('detectTier', () => {
  it('returns "desktop" when not coarse pointer', () => {
    expect(detectTier({ isMobile: false, hardwareConcurrency: 4, deviceMemory: 2 })).toBe(
      'desktop',
    );
  });

  it('returns "mobile-high" on mobile with >=6 cores', () => {
    expect(detectTier({ isMobile: true, hardwareConcurrency: 6, deviceMemory: undefined })).toBe(
      'mobile-high',
    );
  });

  it('returns "mobile-high" on mobile with >=4GB memory', () => {
    expect(detectTier({ isMobile: true, hardwareConcurrency: 4, deviceMemory: 4 })).toBe(
      'mobile-high',
    );
  });

  it('returns "mobile-low" on mobile with weak signals', () => {
    expect(detectTier({ isMobile: true, hardwareConcurrency: 4, deviceMemory: 2 })).toBe(
      'mobile-low',
    );
  });

  it('returns "mobile-low" on mobile when both signals missing', () => {
    expect(
      detectTier({ isMobile: true, hardwareConcurrency: undefined, deviceMemory: undefined }),
    ).toBe('mobile-low');
  });
});

describe('getParticleCount', () => {
  it('returns 500 for desktop', () => {
    expect(getParticleCount('desktop')).toBe(500);
  });

  it('returns 300 for mobile-high', () => {
    expect(getParticleCount('mobile-high')).toBe(300);
  });

  it('returns 150 for mobile-low', () => {
    expect(getParticleCount('mobile-low')).toBe(150);
  });
});

describe('getMaxDpr', () => {
  it('returns 2 for desktop', () => {
    expect(getMaxDpr('desktop')).toBe(2);
  });

  it('returns 1.5 for mobile tiers', () => {
    expect(getMaxDpr('mobile-high')).toBe(1.5);
    expect(getMaxDpr('mobile-low')).toBe(1.5);
  });
});
