import { useCallback, useEffect, useRef, useState } from 'react';

import {
  INERTIA_MULTIPLIER,
  MAX_INERTIA_FACTOR,
  MAX_PARTICLE_SIZE,
  MAX_SCROLL_FACTOR,
  MIN_INERTIA_FACTOR,
  MIN_SCROLL_FACTOR,
  PARTICLE_VELOCITY_DECAY,
  Particle,
  SCROLL_VELOCITY_DECAY,
  initializeParticles,
} from './particle-config';

export interface UseParticlesResult {
  particles: Particle[];
  particlesRef: React.MutableRefObject<Particle[]>;
  circlesRef: React.MutableRefObject<SVGCircleElement[]>;
}

export function useParticles(): UseParticlesResult {
  const [particles, setParticles] = useState<Particle[]>([]);
  const particlesRef = useRef<Particle[]>(particles);
  const circlesRef = useRef<SVGCircleElement[]>([]);
  const animationFrameRef = useRef<number>(0);
  const scrollYRef = useRef(0);
  const scrollVelocityRef = useRef(0);
  const isVisibleRef = useRef(true);
  const prefersReducedMotionRef = useRef(false);
  const lastScrollTimeRef = useRef(0);
  const frameCountRef = useRef(0);

  // Keep particlesRef in sync with state
  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  // Reset scroll position and velocity when route changes (Astro navigation)
  useEffect(() => {
    const resetParticles = () => {
      scrollYRef.current = 0;
      scrollVelocityRef.current = 0;
      particlesRef.current.forEach((particle) => {
        particle.velocityY = 0;
      });
    };

    // Listen for Astro's view transitions or popstate
    document.addEventListener('astro:after-swap', resetParticles);
    window.addEventListener('popstate', resetParticles);

    return () => {
      document.removeEventListener('astro:after-swap', resetParticles);
      window.removeEventListener('popstate', resetParticles);
    };
  }, []);

  // Redistribute particles on resize
  const handleResize = useCallback(() => {
    const newParticles = initializeParticles(window.innerWidth, window.innerHeight);
    setParticles(newParticles);
  }, []);

  // Populate particles after mount so SSR and first client render match (avoids
  // a hydration mismatch that left the SVG empty in production).
  useEffect(() => {
    handleResize();
  }, [handleResize]);

  useEffect(() => {
    // Check for reduced motion preference
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotionRef.current = motionMediaQuery.matches;

    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = event.matches;
    };
    motionMediaQuery.addEventListener('change', handleMotionPreferenceChange);

    // Page visibility handler - pause animation when tab is hidden
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Resize handler with debounce
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 250);
    };
    window.addEventListener('resize', debouncedResize);

    // Theme change handler - update particle colors based on dark mode
    const updateParticleColors = () => {
      const circles = circlesRef.current;
      if (circles.length === 0) return;

      const isDark = document.documentElement.classList.contains('dark');

      circles.forEach((circle) => {
        if (!circle) return;
        const lightColor = circle.getAttribute('data-light-color');
        const darkColor = circle.getAttribute('data-dark-color');
        if (lightColor && darkColor) {
          circle.setAttribute('fill', isDark ? darkColor : lightColor);
        }
      });
    };

    // Update colors on mount (after circles are rendered)
    requestAnimationFrame(updateParticleColors);

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateParticleColors();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Throttled scroll handler - calculate scroll velocity for inertia
    const handleScroll = () => {
      const now = performance.now();
      // Throttle to ~30fps for scroll updates
      if (now - lastScrollTimeRef.current < 33) return;
      lastScrollTimeRef.current = now;

      const currentScrollY = window.scrollY;
      scrollVelocityRef.current = currentScrollY - scrollYRef.current;
      scrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Animation loop - optimized for performance
    const animate = () => {
      // Skip animation if tab is hidden or user prefers reduced motion
      if (!isVisibleRef.current || prefersReducedMotionRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const circles = circlesRef.current;
      if (circles.length === 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Increment frame counter and skip every other frame for DOM updates
      frameCountRef.current++;
      const shouldUpdateDOM = frameCountRef.current % 2 === 0;

      // Apply inertia decay to scroll velocity (smooth deceleration)
      scrollVelocityRef.current *= SCROLL_VELOCITY_DECAY;

      const viewportHeight = window.innerHeight;

      particlesRef.current.forEach((particle, index) => {
        // Each particle independently updates its angle
        particle.angleX += particle.speedX;
        particle.angleY += particle.speedY;

        // Calculate position based on particle's own angle and radius
        const oscillationX = Math.sin(particle.angleX) * particle.radiusX;
        const oscillationY = Math.cos(particle.angleY) * particle.radiusY;

        // Add scroll velocity to particle's own velocity with inertia
        // Different particles respond differently based on size (larger = more responsive)
        const sizeNormalized = particle.size / MAX_PARTICLE_SIZE;
        const inertiaRange = MAX_INERTIA_FACTOR - MIN_INERTIA_FACTOR;
        const inertiaFactor = MIN_INERTIA_FACTOR + sizeNormalized * inertiaRange;
        particle.velocityY += scrollVelocityRef.current * inertiaFactor * INERTIA_MULTIPLIER;
        particle.velocityY *= PARTICLE_VELOCITY_DECAY;

        // Parallax effect - larger particles (closer) move more than smaller ones
        const scrollRange = MAX_SCROLL_FACTOR - MIN_SCROLL_FACTOR;
        const scrollFactor = MIN_SCROLL_FACTOR + sizeNormalized * scrollRange;
        const scrollOffset = -scrollYRef.current * scrollFactor;

        // Wrap particles vertically to keep them visible
        let finalY = particle.baseY + oscillationY + scrollOffset + particle.velocityY;
        finalY = ((finalY % viewportHeight) + viewportHeight) % viewportHeight;

        particle.x = particle.baseX + oscillationX;
        particle.y = finalY;

        // Only update DOM every other frame for better performance
        if (shouldUpdateDOM) {
          const circle = circles[index];
          if (circle) {
            circle.style.transform = `translate(${particle.x}px, ${particle.y}px)`;
          }
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      motionMediaQuery.removeEventListener('change', handleMotionPreferenceChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleResize]);

  return { particles, particlesRef, circlesRef };
}
