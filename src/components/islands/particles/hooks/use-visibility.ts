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
