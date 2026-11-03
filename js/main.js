import { initSmoothScroll } from './motion/smooth-scroll.js';
import { initHero } from './motion/hero.js';
import { initCursor } from './motion/cursor.js';
import { initProcess } from './motion/process.js';
import { initFolds } from './motion/reveal.js';

const root = document.documentElement;
const reduced = root.classList.contains('reduced');

function start() {
  if (reduced || !window.gsap || !window.ScrollTrigger) {
    // Упрощённый режим: без pin, parallax и плавного скролла
    root.classList.add('reduced');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  initSmoothScroll();
  initHero();
  initProcess();
  initFolds();
  initCursor();
}

try {
  start();
} catch (err) {
  console.error(err);
  root.classList.add('reduced');
}
