import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

let globalLenis = null;

export function useLenis() {
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
    });

    globalLenis = lenis;
    lenisRef.current = lenis;

    // Sync lenis with framer-motion scroll
    lenis.on('scroll', () => {
      // dispatch a native scroll event so framer-motion useScroll stays in sync
      window.dispatchEvent(new Event('scroll', { bubbles: true }));
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      globalLenis = null;
    };
  }, []);

  return lenisRef;
}

// Utility — scroll to a selector or element from anywhere
export function scrollTo(target, options = {}) {
  if (globalLenis) {
    globalLenis.scrollTo(target, { duration: 1.2, ...options });
  }
}
