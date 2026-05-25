import { useEffect, useRef } from 'react';

import { SCROLL_INERTIA_DECAY } from '../renderer/config';

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

  const tick = () => {
    scrollInertia.current *= SCROLL_INERTIA_DECAY;
  };

  const reset = () => {
    scrollY.current = 0;
    scrollInertia.current = 0;
  };

  useEffect(() => {
    scrollY.current = window.scrollY;

    // No throttle: we're only writing to a ref. The render loop reads it once
    // per frame; throttling here just makes uScrollY update on a slower clock
    // than the frame loop, producing visible stepping during fast scrolls.
    const onScroll = () => {
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
