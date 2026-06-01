# WebGL Particle Field — Design

**Date**: 2026-05-25
**Author**: Brennan + Claude
**Status**: Approved — ready for implementation plan
**Replaces**: `src/components/islands/FloatingParticles.tsx` and the `src/components/islands/particles/` SVG implementation

---

## Goal

Replace the existing 16-particle SVG/CPU background with a WebGL2-rendered volumetric particle field that is both **more performant** (cheap enough to enable on mobile, scale to ~500 particles) and a **visual upgrade** (true depth, bokeh-style falloff, slow flow-field motion). The field continues to live site-wide and remains scroll-reactive only — no pointer interactivity.

## Non-goals

- No post-process bloom/glow.
- No pointer interactivity (parallax, cursor influence, or click).
- No A/B between old and new — straight replacement.
- No visual regression / snapshot testing of the canvas.
- No analytics or perf telemetry beyond a dev-only watchdog log.

## Context

The current `FloatingParticles` is 16 SVG circles with a Gaussian blur filter, animated via rAF, with scroll-velocity inertia and size-based parallax. It is disabled on mobile. The May 17 design critique (`.impeccable/critique/2026-05-17T21-54-05Z__src-pages-index-astro.md`) flagged it as P0 ("three decorative systems compete — kill or scope to hero only"). This work overrides that critique: the answer to "competing systems" is to make the background more cohesive and intentional, not to remove it.

---

## Visual system

### Depth bands

Three logical depth bands drive size, brightness, scroll-parallax strength, and flow-field speed:

| Band | Depth range | Particle share | Size   | Parallax | Intensity |
| ---- | ----------- | -------------- | ------ | -------- | --------- |
| Far  | 0.00–0.33   | ~60%           | small  | weak     | dim       |
| Mid  | 0.33–0.66   | ~30%           | medium | medium   | medium    |
| Near | 0.66–1.00   | ~10%           | large  | strong   | brightest |

Depth is a per-instance attribute. All depth-derived properties are computed in the vertex shader via `mix(farValue, nearValue, aDepth)`.

### Rendering

- **Geometry**: one instanced quad (2 triangles, 4 verts), instanced N times.
- **Per-instance attributes**: `aSeed: vec4` (random), `aDepth: float`, `aBaseOffset: vec2` (normalized 0–1 viewport position).
- **Vertex shader** computes position:
  - Start at `aBaseOffset`.
  - Add flow-field displacement: bilinear sample of `uFlowField` (16×16 RG texture, regenerated 2×/sec from curl noise on CPU) at current position. Flow strength = `mix(0.3, 1.0, aDepth)`.
  - Add scroll offset: `-uScrollY * mix(0.02, 0.18, aDepth)`.
  - Add scroll inertia kick: `+uScrollInertia * mix(0.05, 0.35, aDepth)`.
  - Wrap vertically: `y = fract(y)`.
  - Project to clip space.
  - Size: `mix(8.0, 48.0, aDepth) * uDPR / uViewHeight`.
- **Fragment shader** = bokeh disk:
  - `d = length(vUv - 0.5) * 2.0`
  - `alpha = smoothstep(1.0, 1.0 - mix(0.7, 0.15, vDepth), d)` (far = very soft edge; near = slightly crisper).
  - `gl_FragColor = vec4(vColor * vIntensity, alpha)` with `vIntensity = mix(0.12, 0.35, vDepth)`.
- **Blend mode**: additive (`gl.ONE, gl.ONE`) over transparent canvas. In light mode this reads as cool atmospheric haze; in dark mode as warm bioluminescent dust.

### Color

- `uColors[6]` uniform array; each particle picks one via `aSeed.x` modulo 6.
- Light palette: 6 swatches condensed from the existing slate/teal/purple set in `particle-config.ts`.
- Dark palette: 6 swatches condensed from the existing orange/coral/gold set.
- Theme swap: MutationObserver on `<html>` class change → set `uColors` and `uColorCount` uniforms in one call.

### What is deliberately not in the shader

- No post-process Gaussian blur (the disk falloff does the work).
- No bloom/glow pass.
- No real depth buffer or sorting (additive blending is order-independent).
- No CPU-side per-frame particle updates; everything per-frame is GPU.

---

## Motion

Per-frame CPU work, target <0.2ms:

1. Increment `uTime`.
2. Apply scroll-velocity decay: `scrollInertia *= 0.95`; write to `uScrollInertia`.
3. Update `uScrollY` from a ref written by the throttled scroll listener (~30Hz).
4. Twice per second: regenerate the 16×16 RG curl-noise texture (256 cells × 2 floats) and `texSubImage2D` upload.

Per-frame GPU work: one instanced draw call, no render targets.

Scroll feel matches today's: near band scrolls fastest; far band barely moves; scroll velocity adds a transient kick that decays over ~1 second.

Particles wrap vertically (`fract()` in the vertex shader), so the field is infinite without redistribution.

### Pause logic

- `document.hidden` → skip rAF tick (no draw, no update).
- `prefers-reduced-motion: reduce` → render one frame at `uTime=0`, then freeze. Do not blank — the field is part of the design.

### Resize

- Debounced 250ms.
- Update canvas size, `uDPR`, `uViewHeight`.
- Particle positions are normalized; no redistribution.

### Astro view-transitions

- On `astro:after-swap` and `popstate`: reset `uScrollY` and `uScrollInertia` to 0.

---

## Architecture

```
src/components/islands/particles/
  index.ts                       # re-export FloatingParticles
  particle-field.tsx             # React component: canvas mount, lifecycle, props
  renderer/
    create-renderer.ts           # OGL Renderer + camera + scene setup
    particles-mesh.ts            # instanced geometry + program
    shaders/
      particles.vert.glsl        # imported via ?raw
      particles.frag.glsl        # imported via ?raw
    flow-field.ts                # 3D curl-noise sampler, texture generator
    config.ts                    # PARTICLE_COUNT tiers, depth-band split, palettes, motion constants
  hooks/
    use-scroll-velocity.ts       # throttled scroll listener + inertia decay state
    use-visibility.ts            # tab visibility + reduced-motion preference
```

Files to delete:

- `src/components/islands/particles/particle-canvas.tsx`
- `src/components/islands/particles/particle-config.ts` (palette migrates into new `renderer/config.ts`)
- `src/components/islands/particles/use-particles.ts`

The outer `FloatingParticles` wrapper in `src/components/islands/FloatingParticles.tsx` remains the React island hydrated `client:visible` from `BaseLayout`. Its internals are replaced; the `useIsMobile` gate is removed (mobile is now in scope).

The split between `particle-field.tsx` and `renderer/` exists so the React layer owns lifecycle, props, and cleanup, and `renderer/` is a pure WebGL module with no React dependency.

---

## Performance, devices, capability gates

### Particle count by tier (detected once at mount)

| Tier                                                                  | Count |
| --------------------------------------------------------------------- | ----- |
| Desktop                                                               | 500   |
| Mobile with `navigator.hardwareConcurrency ≥ 6` or `deviceMemory ≥ 4` | 300   |
| Mobile (low-end)                                                      | 150   |

### DPR

- Desktop: `Math.min(devicePixelRatio, 2)`.
- Mobile: `Math.min(devicePixelRatio, 1.5)`.

### WebGL context options

```js
{ alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' }
```

### Capability gate

If `canvas.getContext('webgl2')` returns null → unmount the canvas, render nothing. No SVG fallback.

### FPS watchdog

- Track frame time over a rolling 2-second window after mount.
- If median frame time > 25ms (sustained < 40fps) → freeze the animation (render last frame, cancel rAF).
- Log once to console in development; silent in production.

### Targets

| Device                                        | Target                                  |
| --------------------------------------------- | --------------------------------------- |
| Desktop (M-series Mac, mid-range Windows)     | 60fps locked, <1% main-thread, <3% GPU  |
| Mobile (iPhone 12 era and newer, mid-Android) | 60fps, <2% main-thread                  |
| Older mobile                                  | 30fps acceptable; else watchdog freezes |

### Bundle impact

- OGL: ~30KB gzipped (tree-shaken — Renderer, Camera, Geometry, Program, Mesh, Texture).
- Our code: ~3–4KB gzipped including shaders.
- Net add vs. today: ~30KB. Loaded lazily via `client:visible`; does not block first paint.

---

## Accessibility

- Canvas wrapper: `aria-hidden="true"`, `pointer-events: none`, `position: fixed inset-0`, `z-0`.
- `prefers-reduced-motion: reduce`: render one frame frozen at `uTime=0`. Do not unmount or blank.
- No keyboard interaction, no focus surface, no contrast requirement (decorative).

---

## Testing

- **Unit**:
  - `flow-field.test.ts`: curl-noise output is bounded to expected range and deterministic for a fixed seed.
  - `config.test.ts`: tier-detection picks the correct particle count for given `hardwareConcurrency` / `deviceMemory` values.
- **Component**:
  - `particle-field.test.tsx`: mounts without throwing; renders nothing when `getContext('webgl2')` returns null (mocked); unmounts cleanly with no leaked rAF or event listeners.
- **No visual regression / snapshot tests** for the canvas — bokeh + flow is inherently non-deterministic. Manual QA + screenshots for the PR.
- Existing tests referencing `FloatingParticles`, `useParticles`, or `ParticleCanvas` are updated or deleted as part of the implementation.

---

## Open implementation choices (defer to plan)

- Whether the OGL `Renderer` should be created once and shared, or re-created on canvas size change. (Likely shared; OGL handles resize via `renderer.setSize()`.)
- Exact curl-noise implementation (simplex 3D vs. classic Perlin gradient curl). Visual difference is negligible at 16×16; pick whichever has the cleaner small dep or inline implementation.
- Whether tier detection lives in `config.ts` or is computed at mount inside `particle-field.tsx`. Leaning toward `config.ts` exporting a `detectTier()` function called once at mount.

These are implementation-plan concerns, not design concerns.
