'use client';

import { useEffect, useRef } from 'react';

import { useIsMobile } from '../../../hooks/use-mobile';
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
        // Render exactly one freeze frame at uTime=0, then stop ticking.
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
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
