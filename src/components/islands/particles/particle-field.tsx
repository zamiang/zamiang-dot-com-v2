import { useEffect, useRef } from 'react';

import { createRenderer } from './renderer/create-renderer';
import {
  DARK_PALETTE,
  FLOW_FIELD_GRID,
  LIGHT_PALETTE,
  WATCHDOG_FREEZE_THRESHOLD_MS,
  WATCHDOG_WINDOW_MS,
  detectTier,
  getMaxDpr,
  getParticleCount,
} from './renderer/config';
import { generateFlowFieldTexture } from './renderer/flow-field';
import { createParticlesMesh } from './renderer/particles-mesh';
import { useVisibility } from './hooks/use-visibility';

export default function ParticleField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const visibility = useVisibility();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
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

    // Cached viewport size — clientWidth/clientHeight reads can trigger forced
    // layout, so we sample them only on resize and read the cached values per frame.
    let cachedWidth = container.clientWidth;
    let cachedHeight = container.clientHeight;

    const setSize = () => {
      cachedWidth = container.clientWidth;
      cachedHeight = container.clientHeight;
      resize(cachedWidth, cachedHeight);
      mesh.uniforms.uViewHeight.value = cachedHeight;
      mesh.uniforms.uAspect.value = cachedWidth / Math.max(cachedHeight, 1);
      mesh.uniforms.uDPR.value = dpr;
    };

    // Flow field — generated once at mount. With the bounded-oscillation motion
    // model, the flow vector is a direction, not a velocity, so slow evolution
    // wouldn't be visible anyway. Regenerating every 500ms was a periodic CPU
    // spike (256 cells × 4 Perlin samples + texture upload) for no visual gain.
    const initialFlow = generateFlowFieldTexture(FLOW_FIELD_GRID, 0);
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
    let rafId = 0;
    let frozen = false;

    // FPS watchdog state. We track a running average of recent frame times
    // (cheap, no per-frame allocations) and only evaluate every WATCHDOG_WINDOW_MS.
    // Once we've passed a few evaluations cleanly the device is clearly capable,
    // so we disable the watchdog to avoid burning CPU on a check that won't fire.
    let lastFrameTime = startTime;
    let watchdogActive = true;
    let watchdogFrameSum = 0;
    let watchdogFrameCount = 0;
    let watchdogLastEval = startTime;
    let watchdogPasses = 0;
    const WATCHDOG_PASSES_TO_DISABLE = 5;

    const tick = () => {
      const now = performance.now();
      const dt = now - lastFrameTime;
      lastFrameTime = now;

      if (frozen) return;
      if (!visibility.isVisible.current) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      if (visibility.prefersReducedMotion.current) {
        // Render exactly one freeze frame at uTime=0, then stop ticking.
        mesh.uniforms.uTime.value = 0;
        renderer.render({ scene: mesh.scene });
        frozen = true;
        return;
      }

      // Watchdog: cheap running mean over each WATCHDOG_WINDOW_MS bucket. Skip
      // the first 500ms to avoid counting mount cost.
      if (watchdogActive && now - startTime > 500) {
        watchdogFrameSum += dt;
        watchdogFrameCount += 1;
        if (now - watchdogLastEval >= WATCHDOG_WINDOW_MS) {
          const mean = watchdogFrameSum / watchdogFrameCount;
          if (mean > WATCHDOG_FREEZE_THRESHOLD_MS) {
            if (import.meta.env.DEV) {
              console.warn(`[ParticleField] watchdog: mean frame ${mean.toFixed(1)}ms — freezing.`);
            }
            frozen = true;
            return;
          }
          watchdogPasses += 1;
          if (watchdogPasses >= WATCHDOG_PASSES_TO_DISABLE) {
            watchdogActive = false;
          }
          watchdogFrameSum = 0;
          watchdogFrameCount = 0;
          watchdogLastEval = now;
        }
      }

      // Per-frame uniforms
      const elapsed = now - startTime;
      mesh.uniforms.uTime.value = elapsed;

      renderer.render({ scene: mesh.scene });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      themeObserver.disconnect();
      ro.disconnect();
      clearTimeout(resizeTimeout);
      destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
