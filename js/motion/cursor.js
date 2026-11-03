// Кастомный курсор: только мышь (hover + fine pointer), без reduced-motion.
export function initCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const dot = document.createElement('div');
  dot.className = 'cursor';
  dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);
  document.documentElement.classList.add('has-cursor');

  const x = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3' });
  const y = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    dot.classList.toggle('is-hover', !!e.target.closest('a, button'));
  });
}
