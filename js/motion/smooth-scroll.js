import { headerOffset } from './env.js';

// Lenis + ScrollTrigger на одном rAF-цикле GSAP.
export function initSmoothScroll() {
  if (!window.Lenis) return null;
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Якорные ссылки идут через Lenis, иначе прыгают мимо pin-секции
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -headerOffset() });
    });
  });
  return lenis;
}
