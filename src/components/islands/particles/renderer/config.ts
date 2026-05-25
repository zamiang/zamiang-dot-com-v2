export type Tier = 'desktop' | 'mobile-high' | 'mobile-low';

export interface TierSignals {
  isMobile: boolean;
  hardwareConcurrency: number | undefined;
  deviceMemory: number | undefined;
}

export function detectTier(signals: TierSignals): Tier {
  if (!signals.isMobile) return 'desktop';
  const cores = signals.hardwareConcurrency ?? 0;
  const memory = signals.deviceMemory ?? 0;
  if (cores >= 6 || memory >= 4) return 'mobile-high';
  return 'mobile-low';
}

const PARTICLE_COUNT_BY_TIER: Record<Tier, number> = {
  desktop: 500,
  'mobile-high': 300,
  'mobile-low': 150,
};

export function getParticleCount(tier: Tier): number {
  return PARTICLE_COUNT_BY_TIER[tier];
}

export function getMaxDpr(tier: Tier): number {
  return tier === 'desktop' ? 2 : 1.5;
}

// Depth-band split — fraction of total particles per band.
export const DEPTH_BAND_SPLIT = {
  far: 0.6,
  mid: 0.3,
  near: 0.1,
} as const;

export const DEPTH_BAND_RANGES = {
  far: [0.0, 0.33] as const,
  mid: [0.33, 0.66] as const,
  near: [0.66, 1.0] as const,
};

// Motion constants
export const SCROLL_INERTIA_DECAY = 0.95;
export const SCROLL_THROTTLE_MS = 33; // ~30Hz
export const FLOW_FIELD_GRID = 16; // 16x16 RG texture
export const FLOW_FIELD_UPDATE_HZ = 2; // regenerate twice per second
export const WATCHDOG_WINDOW_MS = 2000;
export const WATCHDOG_FREEZE_THRESHOLD_MS = 25; // median frame time → freeze

// Palettes — 6 swatches each, condensed from the previous design.
// RGB values are normalized [0..1] for direct use as shader uniforms.
export const LIGHT_PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [0.227, 0.271, 0.333], // #3a4555 deep slate
  [0.353, 0.420, 0.541], // #5a6b8a medium blue
  [0.239, 0.353, 0.420], // #3d5a6b deep teal
  [0.353, 0.502, 0.565], // #5a8090 light teal
  [0.420, 0.353, 0.541], // #6b5a8a muted violet
  [0.518, 0.565, 0.659], // #8490a8 pale blue
];

export const DARK_PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [1.000, 0.561, 0.000], // #ff8f00 deep orange
  [1.000, 0.702, 0.302], // #ffb34d light orange
  [1.000, 0.482, 0.420], // #ff7b6b coral
  [1.000, 0.604, 0.541], // #ff9a8a light coral
  [1.000, 0.757, 0.027], // #ffc107 gold
  [0.792, 0.816, 0.859], // #cad0db bright white
];
