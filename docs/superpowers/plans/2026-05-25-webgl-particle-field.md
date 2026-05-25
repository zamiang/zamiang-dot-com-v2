# WebGL Particle Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 16-particle SVG/CPU background (`FloatingParticles`) with a WebGL2 volumetric particle field: ~500 instanced bokeh disks across three depth bands, curl-noise flow-field drift, scroll-reactive parallax + inertia, enabled on mobile via tiered particle counts.

**Architecture:** A single React island mounts an OGL WebGL2 renderer that draws one instanced quad N times with additive blending. Per-instance attributes set depth and starting position; a small CPU-updated curl-noise texture drives slow drift. All per-frame work after init is GPU.

**Tech Stack:** Astro 6, React 19, TypeScript (strict), OGL (~30KB), GLSL ES 3.0, Vitest + jsdom for unit tests.

**Design spec:** `docs/superpowers/specs/2026-05-25-webgl-particle-field-design.md`

---

## File Structure

**Create:**
- `src/components/islands/particles/particle-field.tsx` — React component: canvas mount, capability gate, lifecycle, FPS watchdog
- `src/components/islands/particles/renderer/config.ts` — particle-count tiers, depth-band split, palettes, motion constants, `detectTier()`
- `src/components/islands/particles/renderer/flow-field.ts` — curl-noise sampler, 16×16 RG texture data generator
- `src/components/islands/particles/renderer/create-renderer.ts` — OGL `Renderer` factory + resize helper
- `src/components/islands/particles/renderer/particles-mesh.ts` — instanced `Mesh` (geometry + program) factory
- `src/components/islands/particles/renderer/shaders/particles.vert.glsl` — vertex shader (imported via `?raw`)
- `src/components/islands/particles/renderer/shaders/particles.frag.glsl` — fragment shader (imported via `?raw`)
- `src/components/islands/particles/hooks/use-scroll-velocity.ts` — throttled scroll listener; exposes refs for scrollY + inertia
- `src/components/islands/particles/hooks/use-visibility.ts` — tab visibility + `prefers-reduced-motion`; exposes refs
- `src/types/glsl.d.ts` — module declaration for `*.glsl?raw` imports
- `__tests__/components/islands/particles/config.test.ts`
- `__tests__/components/islands/particles/flow-field.test.ts`
- `__tests__/components/islands/particles/particle-field.test.tsx`

**Modify:**
- `src/components/islands/FloatingParticles.tsx` — replace internals with `<ParticleField />`, drop `useIsMobile` gate
- `src/components/islands/particles/index.ts` — re-export new `ParticleField` (keep barrel)
- `package.json` — add `ogl` dependency

**Delete:**
- `src/components/islands/particles/particle-canvas.tsx`
- `src/components/islands/particles/particle-config.ts`
- `src/components/islands/particles/use-particles.ts`
- Any existing tests referencing the deleted modules

---

## Task 1: Install OGL and add GLSL type declaration

**Files:**
- Modify: `package.json`
- Create: `src/types/glsl.d.ts`

- [ ] **Step 1: Install OGL**

Run: `npm install ogl@1.0.11`
Expected: package.json gains `"ogl": "1.0.11"`; lockfile updated; no peer-dep warnings.

(OGL ships its own `.d.ts` files; no `@types/ogl` needed.)

- [ ] **Step 2: Add GLSL module declaration**

Create `src/types/glsl.d.ts`:

```typescript
declare module '*.glsl?raw' {
  const content: string;
  export default content;
}
```

- [ ] **Step 3: Verify Astro picks up the new type file**

Run: `npm run check`
Expected: no errors. (Astro's `tsconfig.json` includes `src/**/*` by default; if it doesn't, the next task that imports a `.glsl?raw` file will fail and we'll add the include explicitly then.)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/types/glsl.d.ts
git commit -m "Add OGL dependency and GLSL ?raw type declaration"
```

---

## Task 2: Renderer config — constants and tier detection

**Files:**
- Create: `src/components/islands/particles/renderer/config.ts`
- Test: `__tests__/components/islands/particles/config.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/islands/particles/config.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { detectTier, getParticleCount } from '../../../../src/components/islands/particles/renderer/config';

describe('detectTier', () => {
  it('returns "desktop" when not coarse pointer', () => {
    expect(detectTier({ isMobile: false, hardwareConcurrency: 4, deviceMemory: 2 })).toBe('desktop');
  });

  it('returns "mobile-high" on mobile with >=6 cores', () => {
    expect(detectTier({ isMobile: true, hardwareConcurrency: 6, deviceMemory: undefined })).toBe('mobile-high');
  });

  it('returns "mobile-high" on mobile with >=4GB memory', () => {
    expect(detectTier({ isMobile: true, hardwareConcurrency: 4, deviceMemory: 4 })).toBe('mobile-high');
  });

  it('returns "mobile-low" on mobile with weak signals', () => {
    expect(detectTier({ isMobile: true, hardwareConcurrency: 4, deviceMemory: 2 })).toBe('mobile-low');
  });

  it('returns "mobile-low" on mobile when both signals missing', () => {
    expect(detectTier({ isMobile: true, hardwareConcurrency: undefined, deviceMemory: undefined })).toBe('mobile-low');
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/islands/particles/config.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/components/islands/particles/renderer/config.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/components/islands/particles/config.test.ts`
Expected: PASS, 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/islands/particles/renderer/config.ts __tests__/components/islands/particles/config.test.ts
git commit -m "Add particle renderer config with tier detection"
```

---

## Task 3: Flow-field — curl noise + texture data generator

**Files:**
- Create: `src/components/islands/particles/renderer/flow-field.ts`
- Test: `__tests__/components/islands/particles/flow-field.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/islands/particles/flow-field.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { generateFlowFieldTexture, sampleCurl } from '../../../../src/components/islands/particles/renderer/flow-field';

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
      if (a[i] !== b[i]) { differs = true; break; }
    }
    expect(differs).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/islands/particles/flow-field.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/components/islands/particles/renderer/flow-field.ts`:

```typescript
// Classic 3D Perlin gradient noise with curl derivation.
// Self-contained: no deps. Output is bounded to [-1, 1] (empirically tighter
// than the theoretical bound but we clamp to be safe).

const PERM: number[] = (() => {
  const p = new Array<number>(512);
  const source = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
    140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
    247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
    57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
    74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
    60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
    65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
    200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
    52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
    207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
    119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
    218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
    81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
    184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
    222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
  ];
  for (let i = 0; i < 256; i++) {
    p[i] = source[i];
    p[i + 256] = source[i];
  }
  return p;
})();

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlin(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const zf = z - Math.floor(z);
  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);
  const A = PERM[X] + Y;
  const AA = PERM[A] + Z;
  const AB = PERM[A + 1] + Z;
  const B = PERM[X + 1] + Y;
  const BA = PERM[B] + Z;
  const BB = PERM[B + 1] + Z;
  return lerp(
    lerp(
      lerp(grad(PERM[AA], xf, yf, zf), grad(PERM[BA], xf - 1, yf, zf), u),
      lerp(grad(PERM[AB], xf, yf - 1, zf), grad(PERM[BB], xf - 1, yf - 1, zf), u),
      v,
    ),
    lerp(
      lerp(grad(PERM[AA + 1], xf, yf, zf - 1), grad(PERM[BA + 1], xf - 1, yf, zf - 1), u),
      lerp(grad(PERM[AB + 1], xf, yf - 1, zf - 1), grad(PERM[BB + 1], xf - 1, yf - 1, zf - 1), u),
      v,
    ),
    w,
  );
}

// Curl of a 2D vector field derived from two perlin samples.
// Returns [dx, dy] in approximately [-1, 1] after clamping.
const EPS = 0.01;
export function sampleCurl(x: number, y: number, z: number): [number, number] {
  const n1 = perlin(x, y + EPS, z);
  const n2 = perlin(x, y - EPS, z);
  const n3 = perlin(x + EPS, y, z);
  const n4 = perlin(x - EPS, y, z);
  const dx = (n1 - n2) / (2 * EPS);
  const dy = -(n3 - n4) / (2 * EPS);
  // Empirical magnitude is small; scale and clamp to [-1, 1].
  const scale = 0.5;
  return [
    Math.max(-1, Math.min(1, dx * scale)),
    Math.max(-1, Math.min(1, dy * scale)),
  ];
}

// Generates a grid×grid RG texture (Uint8Array of length grid*grid*2).
// Each cell encodes a curl vector with x in byte 0 and y in byte 1, mapping
// signed [-1, 1] to unsigned [0, 255] (vector = byte/127.5 - 1 in the shader).
export function generateFlowFieldTexture(grid: number, time: number): Uint8Array {
  const data = new Uint8Array(grid * grid * 2);
  const noiseScale = 1.5; // controls spatial frequency
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const nx = (x / grid) * noiseScale;
      const ny = (y / grid) * noiseScale;
      const [vx, vy] = sampleCurl(nx, ny, time * 0.1);
      const idx = (y * grid + x) * 2;
      data[idx] = Math.round((vx + 1) * 127.5);
      data[idx + 1] = Math.round((vy + 1) * 127.5);
    }
  }
  return data;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/components/islands/particles/flow-field.test.ts`
Expected: PASS, 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/islands/particles/renderer/flow-field.ts __tests__/components/islands/particles/flow-field.test.ts
git commit -m "Add curl-noise flow-field sampler and texture generator"
```

---

## Task 4: `useVisibility` hook — tab visibility + reduced motion

**Files:**
- Create: `src/components/islands/particles/hooks/use-visibility.ts`

This hook returns refs (not state) so the render loop can read them without re-rendering. No standalone unit tests; behavior is covered by the component test in Task 9.

- [ ] **Step 1: Write the implementation**

Create `src/components/islands/particles/hooks/use-visibility.ts`:

```typescript
import { useEffect, useRef } from 'react';

export interface VisibilityRefs {
  isVisible: React.MutableRefObject<boolean>;
  prefersReducedMotion: React.MutableRefObject<boolean>;
}

export function useVisibility(): VisibilityRefs {
  const isVisible = useRef(true);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    isVisible.current = !document.hidden;
    const onVisibility = () => {
      isVisible.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibility);

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = motionQuery.matches;
    const onMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
    };
    motionQuery.addEventListener('change', onMotionChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery.removeEventListener('change', onMotionChange);
    };
  }, []);

  return { isVisible, prefersReducedMotion };
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/islands/particles/hooks/use-visibility.ts
git commit -m "Add useVisibility hook for tab + reduced-motion refs"
```

---

## Task 5: `useScrollVelocity` hook — throttled scroll + inertia state

**Files:**
- Create: `src/components/islands/particles/hooks/use-scroll-velocity.ts`

Like `useVisibility`, this exposes refs only.

- [ ] **Step 1: Write the implementation**

Create `src/components/islands/particles/hooks/use-scroll-velocity.ts`:

```typescript
import { useEffect, useRef } from 'react';

import { SCROLL_INERTIA_DECAY, SCROLL_THROTTLE_MS } from '../renderer/config';

export interface ScrollRefs {
  scrollY: React.MutableRefObject<number>;
  scrollInertia: React.MutableRefObject<number>;
  /** Called once per frame by the render loop to decay inertia. */
  tick: () => void;
  /** Called on route changes to zero everything. */
  reset: () => void;
}

export function useScrollVelocity(): ScrollRefs {
  const scrollY = useRef(0);
  const scrollInertia = useRef(0);
  const lastScrollTime = useRef(0);

  const tick = () => {
    scrollInertia.current *= SCROLL_INERTIA_DECAY;
  };

  const reset = () => {
    scrollY.current = 0;
    scrollInertia.current = 0;
  };

  useEffect(() => {
    scrollY.current = window.scrollY;

    const onScroll = () => {
      const now = performance.now();
      if (now - lastScrollTime.current < SCROLL_THROTTLE_MS) return;
      lastScrollTime.current = now;
      const next = window.scrollY;
      scrollInertia.current += next - scrollY.current;
      scrollY.current = next;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const onSwap = () => reset();
    document.addEventListener('astro:after-swap', onSwap);
    window.addEventListener('popstate', onSwap);

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('astro:after-swap', onSwap);
      window.removeEventListener('popstate', onSwap);
    };
  }, []);

  return { scrollY, scrollInertia, tick, reset };
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/islands/particles/hooks/use-scroll-velocity.ts
git commit -m "Add useScrollVelocity hook with throttled scroll + inertia"
```

---

## Task 6: Write the GLSL shaders

**Files:**
- Create: `src/components/islands/particles/renderer/shaders/particles.vert.glsl`
- Create: `src/components/islands/particles/renderer/shaders/particles.frag.glsl`

Targeting WebGL2 / GLSL ES 3.0 (`#version 300 es`). OGL's `Program` will pass them through verbatim.

- [ ] **Step 1: Write the vertex shader**

Create `src/components/islands/particles/renderer/shaders/particles.vert.glsl`:

```glsl
#version 300 es
precision highp float;

// Quad vertex attribute (2 triangles, [-0.5..0.5] in both axes)
in vec2 position;
in vec2 uv;

// Per-instance attributes
in vec4 aSeed;          // random seed values [0..1]
in float aDepth;        // 0 = far, 1 = near
in vec2 aBaseOffset;    // normalized starting position [0..1]

uniform float uTime;
uniform float uScrollY;        // normalized: pixels / viewportHeight
uniform float uScrollInertia;  // normalized
uniform float uDPR;
uniform float uViewHeight;     // CSS pixels
uniform float uAspect;         // width / height
uniform sampler2D uFlowField;  // 16x16 RG, encodes curl vector

out vec2 vUv;
out vec3 vColor;
out float vDepth;
out float vIntensity;

uniform vec3 uColors[6];

void main() {
  // 1. Start from per-instance base offset (normalized 0..1)
  vec2 pos = aBaseOffset;

  // 2. Sample flow field at current position. Texture is RG, [-1,1] after decode.
  vec2 flowSample = texture(uFlowField, pos).rg * 2.0 - 1.0;
  float flowStrength = mix(0.3, 1.0, aDepth) * 0.04;
  pos += flowSample * flowStrength * (uTime - aSeed.w * 1000.0) * 0.001;

  // 3. Scroll parallax (per-band)
  float parallax = mix(0.02, 0.18, aDepth);
  pos.y -= uScrollY * parallax;

  // 4. Scroll inertia kick (decays in JS each frame)
  float inertiaFactor = mix(0.05, 0.35, aDepth);
  pos.y -= uScrollInertia * inertiaFactor * 0.002;

  // 5. Wrap vertically to keep field infinite
  pos.y = fract(pos.y);

  // 6. Convert from [0,1] normalized to clip space [-1,1]
  vec2 clipPos = pos * 2.0 - 1.0;

  // 7. Quad sizing — point size in CSS pixels → clip-space scale
  float pointSizePx = mix(8.0, 48.0, aDepth) * uDPR;
  vec2 quadScale = vec2(pointSizePx / (uViewHeight * uAspect), pointSizePx / uViewHeight);

  gl_Position = vec4(clipPos + position * quadScale, 0.0, 1.0);

  // Varyings
  vUv = uv;
  int colorIdx = int(mod(aSeed.x * 100.0, 6.0));
  vColor = uColors[colorIdx];
  vDepth = aDepth;
  vIntensity = mix(0.12, 0.35, aDepth);
}
```

- [ ] **Step 2: Write the fragment shader**

Create `src/components/islands/particles/renderer/shaders/particles.frag.glsl`:

```glsl
#version 300 es
precision highp float;

in vec2 vUv;
in vec3 vColor;
in float vDepth;
in float vIntensity;

out vec4 fragColor;

void main() {
  // Distance from quad center, normalized to [0, 1] at the edge.
  float d = length(vUv - 0.5) * 2.0;

  // Bokeh disk: far particles have very soft edges, near ones slightly crisper.
  float edgeStart = 1.0 - mix(0.7, 0.15, vDepth);
  float alpha = 1.0 - smoothstep(edgeStart, 1.0, d);

  // Premultiplied additive — color carries intensity, alpha gates fragment.
  fragColor = vec4(vColor * vIntensity * alpha, alpha);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/islands/particles/renderer/shaders/
git commit -m "Add WebGL2 vertex + fragment shaders for bokeh particles"
```

---

## Task 7: Create the OGL renderer factory and instanced mesh

**Files:**
- Create: `src/components/islands/particles/renderer/create-renderer.ts`
- Create: `src/components/islands/particles/renderer/particles-mesh.ts`

These are integration glue; no unit tests (jsdom has no real WebGL). Verified by the component test in Task 9 and manual QA.

- [ ] **Step 1: Write `create-renderer.ts`**

Create `src/components/islands/particles/renderer/create-renderer.ts`:

```typescript
import { Renderer } from 'ogl';

export interface RendererBundle {
  renderer: Renderer;
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  resize: (width: number, height: number) => void;
  destroy: () => void;
}

export function createRenderer(parent: HTMLElement, dpr: number): RendererBundle | null {
  const renderer = new Renderer({
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
    webgl: 2,
    dpr,
  });

  const gl = renderer.gl as WebGL2RenderingContext;
  if (!gl || typeof gl.createVertexArray !== 'function') {
    return null;
  }

  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // additive

  const canvas = gl.canvas as HTMLCanvasElement;
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  parent.appendChild(canvas);

  const resize = (width: number, height: number) => {
    renderer.setSize(width, height);
  };

  const destroy = () => {
    if (canvas.parentElement === parent) parent.removeChild(canvas);
    const loseCtx = gl.getExtension('WEBGL_lose_context');
    loseCtx?.loseContext();
  };

  return { renderer, gl, canvas, resize, destroy };
}
```

- [ ] **Step 2: Write `particles-mesh.ts`**

Create `src/components/islands/particles/renderer/particles-mesh.ts`:

```typescript
import { Geometry, Mesh, Program, Texture, Transform } from 'ogl';

import vertexShader from './shaders/particles.vert.glsl?raw';
import fragmentShader from './shaders/particles.frag.glsl?raw';
import { DEPTH_BAND_RANGES, DEPTH_BAND_SPLIT, FLOW_FIELD_GRID } from './config';

export interface ParticlesMeshBundle {
  mesh: Mesh;
  scene: Transform;
  uniforms: {
    uTime: { value: number };
    uScrollY: { value: number };
    uScrollInertia: { value: number };
    uDPR: { value: number };
    uViewHeight: { value: number };
    uAspect: { value: number };
    uFlowField: { value: Texture };
    uColors: { value: number[] }; // flat array of 18 floats (6 vec3s)
  };
  setColors: (palette: ReadonlyArray<readonly [number, number, number]>) => void;
  setFlowFieldData: (data: Uint8Array) => void;
}

export function createParticlesMesh(
  gl: WebGL2RenderingContext,
  count: number,
  dpr: number,
  initialPalette: ReadonlyArray<readonly [number, number, number]>,
  initialFlowField: Uint8Array,
): ParticlesMeshBundle {
  // Quad geometry: two triangles in [-0.5, 0.5]
  const quadPos = new Float32Array([
    -0.5, -0.5,
     0.5, -0.5,
    -0.5,  0.5,
     0.5,  0.5,
  ]);
  const quadUv = new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    1, 1,
  ]);
  const quadIdx = new Uint16Array([0, 1, 2, 1, 3, 2]);

  // Per-instance buffers
  const seeds = new Float32Array(count * 4);
  const depths = new Float32Array(count);
  const baseOffsets = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    seeds[i * 4 + 0] = Math.random();
    seeds[i * 4 + 1] = Math.random();
    seeds[i * 4 + 2] = Math.random();
    seeds[i * 4 + 3] = Math.random();

    // Assign depth based on band split
    const r = Math.random();
    let depth: number;
    if (r < DEPTH_BAND_SPLIT.far) {
      depth = lerpDepth(DEPTH_BAND_RANGES.far, Math.random());
    } else if (r < DEPTH_BAND_SPLIT.far + DEPTH_BAND_SPLIT.mid) {
      depth = lerpDepth(DEPTH_BAND_RANGES.mid, Math.random());
    } else {
      depth = lerpDepth(DEPTH_BAND_RANGES.near, Math.random());
    }
    depths[i] = depth;

    baseOffsets[i * 2 + 0] = Math.random();
    baseOffsets[i * 2 + 1] = Math.random();
  }

  const geometry = new Geometry(gl, {
    position: { size: 2, data: quadPos },
    uv: { size: 2, data: quadUv },
    index: { data: quadIdx },
    aSeed: { size: 4, data: seeds, instanced: 1 },
    aDepth: { size: 1, data: depths, instanced: 1 },
    aBaseOffset: { size: 2, data: baseOffsets, instanced: 1 },
  });

  const flowTexture = new Texture(gl, {
    image: initialFlowField,
    width: FLOW_FIELD_GRID,
    height: FLOW_FIELD_GRID,
    format: gl.RG,
    internalFormat: gl.RG8,
    type: gl.UNSIGNED_BYTE,
    magFilter: gl.LINEAR,
    minFilter: gl.LINEAR,
    wrapS: gl.REPEAT,
    wrapT: gl.REPEAT,
    generateMipmaps: false,
  });

  const colors = new Float32Array(6 * 3);
  packPalette(colors, initialPalette);

  const uniforms = {
    uTime: { value: 0 },
    uScrollY: { value: 0 },
    uScrollInertia: { value: 0 },
    uDPR: { value: dpr },
    uViewHeight: { value: 1 },
    uAspect: { value: 1 },
    uFlowField: { value: flowTexture },
    uColors: { value: Array.from(colors) },
  };

  const program = new Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const mesh = new Mesh(gl, { geometry, program });
  const scene = new Transform();
  mesh.setParent(scene);

  return {
    mesh,
    scene,
    uniforms,
    setColors(palette) {
      const next = new Float32Array(6 * 3);
      packPalette(next, palette);
      uniforms.uColors.value = Array.from(next);
    },
    setFlowFieldData(data) {
      flowTexture.image = data;
      flowTexture.needsUpdate = true;
    },
  };
}

function lerpDepth(range: readonly [number, number], t: number): number {
  return range[0] + (range[1] - range[0]) * t;
}

function packPalette(
  out: Float32Array,
  palette: ReadonlyArray<readonly [number, number, number]>,
): void {
  for (let i = 0; i < 6; i++) {
    const c = palette[i];
    out[i * 3 + 0] = c[0];
    out[i * 3 + 1] = c[1];
    out[i * 3 + 2] = c[2];
  }
}
```

- [ ] **Step 3: Verify type-check**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/islands/particles/renderer/create-renderer.ts src/components/islands/particles/renderer/particles-mesh.ts
git commit -m "Add OGL renderer factory and instanced particles mesh"
```

---

## Task 8: Build the `ParticleField` React component

**Files:**
- Create: `src/components/islands/particles/particle-field.tsx`

This is the only file that touches React. It owns: capability gate, mount/unmount, animation loop, watchdog, theme observer, flow-field regeneration, scroll/visibility ref wiring.

- [ ] **Step 1: Write the implementation**

Create `src/components/islands/particles/particle-field.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';

import { useIsMobile } from '../../hooks/use-mobile';
import { createRenderer } from './renderer/create-renderer';
import {
  DARK_PALETTE,
  FLOW_FIELD_GRID,
  FLOW_FIELD_UPDATE_HZ,
  LIGHT_PALETTE,
  WATCHDOG_FREEZE_THRESHOLD_MS,
  WATCHDOG_WINDOW_MS,
  detectTier,
  getMaxDpr,
  getParticleCount,
} from './renderer/config';
import { generateFlowFieldTexture } from './renderer/flow-field';
import { createParticlesMesh } from './renderer/particles-mesh';
import { useScrollVelocity } from './hooks/use-scroll-velocity';
import { useVisibility } from './hooks/use-visibility';

export default function ParticleField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const scroll = useScrollVelocity();
  const visibility = useVisibility();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tier = detectTier({
      isMobile,
      hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined,
      deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    });
    const count = getParticleCount(tier);
    const dpr = Math.min(window.devicePixelRatio || 1, getMaxDpr(tier));

    const bundle = createRenderer(container, dpr);
    if (!bundle) return; // WebGL2 not supported

    const { renderer, gl, resize, destroy } = bundle;

    // Initial size
    const setSize = () => {
      resize(container.clientWidth, container.clientHeight);
      mesh.uniforms.uViewHeight.value = container.clientHeight;
      mesh.uniforms.uAspect.value = container.clientWidth / Math.max(container.clientHeight, 1);
      mesh.uniforms.uDPR.value = dpr;
    };

    // Initial flow field
    let flowTime = 0;
    const initialFlow = generateFlowFieldTexture(FLOW_FIELD_GRID, flowTime);
    const isDark = document.documentElement.classList.contains('dark');
    const mesh = createParticlesMesh(gl, count, dpr, isDark ? DARK_PALETTE : LIGHT_PALETTE, initialFlow);
    setSize();

    // Theme observer
    const themeObserver = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark');
      mesh.setColors(dark ? DARK_PALETTE : LIGHT_PALETTE);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Resize observer (debounced)
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(setSize, 250);
    });
    ro.observe(container);

    // Animation loop
    const startTime = performance.now();
    let lastFlowUpdate = 0;
    let rafId = 0;
    let frozen = false;

    // FPS watchdog state
    const frameTimes: number[] = [];
    let lastFrameTime = startTime;
    let watchdogTripped = false;

    const tick = () => {
      const now = performance.now();
      const dt = now - lastFrameTime;
      lastFrameTime = now;
      rafId = requestAnimationFrame(tick);

      if (frozen) return;
      if (!visibility.isVisible.current) return;
      if (visibility.prefersReducedMotion.current) {
        // Render exactly one freeze frame, then stop ticking.
        if (mesh.uniforms.uTime.value !== 0) return;
        mesh.uniforms.uTime.value = 0;
        renderer.render({ scene: mesh.scene });
        frozen = true;
        return;
      }

      // Watchdog: keep a sliding window of recent frame durations (cap at
      // ~120 entries ≈ 2s @ 60fps). Skip the first 500ms to avoid mount cost.
      if (!watchdogTripped && now - startTime > 500) {
        frameTimes.push(dt);
        const maxSamples = Math.ceil(WATCHDOG_WINDOW_MS / 16);
        if (frameTimes.length > maxSamples) frameTimes.shift();
        if (frameTimes.length >= maxSamples) {
          const sorted = [...frameTimes].sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          if (median > WATCHDOG_FREEZE_THRESHOLD_MS) {
            if (import.meta.env.DEV) {
              console.warn(`[ParticleField] watchdog: median frame ${median.toFixed(1)}ms — freezing.`);
            }
            frozen = true;
            watchdogTripped = true;
            return;
          }
        }
      }

      // Per-frame uniforms
      const elapsed = now - startTime;
      mesh.uniforms.uTime.value = elapsed;
      scroll.tick();
      mesh.uniforms.uScrollY.value = scroll.scrollY.current / Math.max(container.clientHeight, 1);
      mesh.uniforms.uScrollInertia.value = scroll.scrollInertia.current;

      // Flow-field regeneration (twice per second)
      const flowInterval = 1000 / FLOW_FIELD_UPDATE_HZ;
      if (now - lastFlowUpdate > flowInterval) {
        flowTime = elapsed * 0.001;
        mesh.setFlowFieldData(generateFlowFieldTexture(FLOW_FIELD_GRID, flowTime));
        lastFlowUpdate = now;
      }

      renderer.render({ scene: mesh.scene });
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      themeObserver.disconnect();
      ro.disconnect();
      clearTimeout(resizeTimeout);
      destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run typecheck && npm run check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/islands/particles/particle-field.tsx
git commit -m "Add ParticleField component with capability gate and watchdog"
```

---

## Task 9: Component test for `ParticleField`

**Files:**
- Create: `__tests__/components/islands/particles/particle-field.test.tsx`

- [ ] **Step 1: Write the test**

Create `__tests__/components/islands/particles/particle-field.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ParticleField from '../../../../src/components/islands/particles/particle-field';

// jsdom does not provide a real WebGL2 context; we mock getContext to return null
// to exercise the capability-gate path. The renderer-active path is verified by
// manual QA (see plan Task 11).

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ParticleField', () => {
  it('renders the canvas wrapper with correct ARIA + class', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { container } = render(<ParticleField />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.getAttribute('aria-hidden')).toBe('true');
    expect(wrapper.className).toContain('pointer-events-none');
    expect(wrapper.className).toContain('fixed');
  });

  it('does not throw when WebGL2 is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(() => render(<ParticleField />)).not.toThrow();
  });

  it('unmounts cleanly without leaked listeners', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ParticleField />);
    unmount();
    // Every scroll/popstate listener added during mount should be removed on unmount.
    const added = addSpy.mock.calls.filter(([type]) => type === 'scroll' || type === 'popstate').length;
    const removed = removeSpy.mock.calls.filter(([type]) => type === 'scroll' || type === 'popstate').length;
    expect(removed).toBe(added);
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run __tests__/components/islands/particles/particle-field.test.tsx`
Expected: PASS, 3 tests passing.

- [ ] **Step 3: Commit**

```bash
git add __tests__/components/islands/particles/particle-field.test.tsx
git commit -m "Add ParticleField component test for capability gate + cleanup"
```

---

## Task 10: Wire `FloatingParticles` to `ParticleField`; delete old code

**Files:**
- Modify: `src/components/islands/FloatingParticles.tsx`
- Modify: `src/components/islands/particles/index.ts`
- Delete: `src/components/islands/particles/particle-canvas.tsx`
- Delete: `src/components/islands/particles/particle-config.ts`
- Delete: `src/components/islands/particles/use-particles.ts`
- Delete any test file under `__tests__/` that imports the deleted modules.

- [ ] **Step 1: Find tests that reference the old modules**

Run:
```bash
grep -rl "particle-canvas\|particle-config\|use-particles\|useParticles\|ParticleCanvas" __tests__/ || true
```
Expected: a list of test files (possibly empty). Delete each listed file.

- [ ] **Step 2: Replace `FloatingParticles.tsx` internals**

Overwrite `src/components/islands/FloatingParticles.tsx`:

```tsx
import ParticleField from './particles/particle-field';

export default function FloatingParticles() {
  return <ParticleField />;
}
```

- [ ] **Step 3: Update barrel `index.ts`**

Overwrite `src/components/islands/particles/index.ts`:

```typescript
export { default as ParticleField } from './particle-field';
```

- [ ] **Step 4: Delete old files**

```bash
rm src/components/islands/particles/particle-canvas.tsx
rm src/components/islands/particles/particle-config.ts
rm src/components/islands/particles/use-particles.ts
```

- [ ] **Step 5: Verify the project still builds, lints, types, and tests**

Run: `npm run check && npm run typecheck && npm run lint && npm test`
Expected: all green. If the lint catches an unused import in `FloatingParticles.tsx` (e.g. an old `useIsMobile` import), remove it.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Replace SVG particle implementation with WebGL ParticleField"
```

---

## Task 11: Manual QA + PR screenshots

This is a hand-driven QA pass — no code changes. Goal: confirm the visual, the perf, and the graceful degradation.

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Open `http://localhost:4321` (or whatever port Astro picks).

- [ ] **Step 2: Visual checks (desktop, light mode)**

- Particles visible site-wide, layered into clearly different sizes/brightnesses (depth bands).
- Slow ambient drift; no jitter or popping.
- Scroll the page: near particles move faster than far; the field wraps without seams.
- Stop scrolling: residual inertia decays smoothly over ~1s.

- [ ] **Step 3: Visual checks (dark mode)**

- Toggle dark mode (whatever existing UI does this; otherwise add `dark` to `<html>` via devtools).
- Particles re-color to warm orange/coral palette within one frame.
- Additive blending reads as glowing dust over the dark background.

- [ ] **Step 4: Mobile checks**

- DevTools device emulation (iPhone 14, Pixel 7). Confirm particles appear (previously disabled).
- No layout shift; canvas covers viewport; particles don't block touch.
- On a real device if available: confirm 60fps via Safari Web Inspector → Timelines.

- [ ] **Step 5: Reduced-motion check**

- DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`.
- Reload. Particles render frozen (one frame), no animation, no rAF burn.

- [ ] **Step 6: Capability-gate check**

- DevTools → Rendering → Disable WebGL (or run in a browser without WebGL2).
- Reload. No canvas mounted, no errors in console, page renders normally.

- [ ] **Step 7: Watchdog check (optional)**

- Temporarily edit `WATCHDOG_FREEZE_THRESHOLD_MS` in `config.ts` to `1` and reload.
- After ~2 seconds, console should warn `[ParticleField] watchdog: median frame Xms — freezing.` and the field should stop animating.
- Revert the change before committing anything else.

- [ ] **Step 8: Build check**

Run: `npm run build && npm run preview`
Expected: build succeeds; preview shows the same particle behavior as dev.

- [ ] **Step 9: Capture before/after screenshots for the PR**

- Light mode: hero + scroll-mid + footer.
- Dark mode: same three.
- Mobile: hero only.

Save in a temp location and attach to the PR description. Do not commit screenshots.

- [ ] **Step 10: Open PR**

Push the branch and open a PR titled `Replace SVG particle background with WebGL field`. PR body should include:
- Link to the design spec (`docs/superpowers/specs/2026-05-25-webgl-particle-field-design.md`).
- Before/after screenshots.
- A note that this overrides the May 17 critique recommendation to scope/kill the particles.
