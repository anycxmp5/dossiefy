import { headerOffset } from './env.js';

// Обзор процесса: под pin листы шагов по очереди ложатся стопкой.
const TILTS = [-1.2, 1, -0.6, 1.4, -1, 0.6];

export function initProcess() {
  const root = document.querySelector('[data-process]');
  if (!root) return;
  const steps = [...root.querySelectorAll('[data-step]')];
  const counter = root.querySelector('[data-counter]');
  const tpl = counter?.dataset.tpl || '';
  const mobile = matchMedia('(max-width: 899px)').matches;

  steps.forEach((s, i) => gsap.set(s, { rotation: TILTS[i % TILTS.length], zIndex: i + 1, yPercent: i ? 120 : 0, autoAlpha: i ? 0 : 1 }));

  const setCounter = (i) => { if (counter) counter.textContent = tpl.replace('{n}', String(i + 1).padStart(2, '0')); };
  setCounter(0);

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root,
      start: `top ${headerOffset()}px`,
      end: () => `+=${(steps.length - 1) * (mobile ? 70 : 85)}%`,
      pin: root.querySelector('[data-process-pin]'),
      scrub: mobile ? 0.4 : 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => setCounter(Math.min(steps.length - 1, Math.round(self.progress * (steps.length - 1)))),
    },
  });

  steps.forEach((s, i) => {
    if (!i) return;
    const at = i - 1;
    tl.to(s, { yPercent: 0, duration: 1, ease: 'back.out(1.15)' }, at)
      .to(s, { autoAlpha: 1, duration: 0.25 }, at);
    // предыдущие листы уходят глубже: чуть выше, меньше и темнее
    steps.slice(0, i).forEach((prev, k) => {
      const depth = i - k;
      tl.to(prev, { y: -10 * depth, scale: 1 - 0.035 * depth, opacity: Math.max(0.35, 1 - 0.22 * depth), duration: 1 }, at);
    });
  });
}
