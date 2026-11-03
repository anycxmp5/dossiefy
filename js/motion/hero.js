import { headerOffset } from './env.js';

// Hero: закрытая папка -> камера опускается -> обложка открывается -> лист с текстом -> штамп с тряской.
// Десктоп: обложка открывается вокруг левого края. Мобильный: вокруг верхнего края,
// меньше слоёв parallax, без 3D-наклона всей сцены.
export function initHero() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const q = (s) => hero.querySelector(s);
  // Вступительная анимация букв заголовка и маркера идёт на CSS (см. home.css), здесь только сцена по скроллу.

  const mm = gsap.matchMedia();

  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, (ctx) => {
    const { desktop } = ctx.conditions;
    const folder = q('[data-folder]');
    const cover = q('[data-cover]');
    const inside = q('.cover__face--inside');
    const sheet = q('[data-sheet]');
    const stamp = q('[data-stamp]');
    const reveals = hero.querySelectorAll('[data-reveal]');
    const deskLayer = q('[data-layer="desk"]');
    const foreLayer = q('[data-layer="fore"]');
    const hint = q('[data-hint]');

    gsap.set(reveals, { autoAlpha: 0, y: 18 });
    gsap.set(stamp, { autoAlpha: 0, scale: 2.4, rotation: -24, transformOrigin: '50% 50%' });
    gsap.set(folder, { rotationX: desktop ? 28 : 0, scale: desktop ? 0.9 : 0.94, yPercent: desktop ? 4 : 0 });
    if (!desktop) {
      cover.style.transformOrigin = '50% 0';
      inside.style.transform = 'rotateX(180deg)';
    }

    const open = desktop ? { rotationY: -172 } : { rotationX: 172 };
    const shift = desktop ? { xPercent: 50 } : { yPercent: 8 };

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: `top ${headerOffset()}px`,
        end: desktop ? '+=300%' : '+=240%',
        pin: q('[data-pin]'),
        scrub: desktop ? 0.6 : 0.4,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // 1) камера: сцена приближается, слои движутся с разной скоростью
    tl.to(folder, { rotationX: 0, scale: 1, yPercent: 0, duration: 3, ease: 'back.out(1.2)' }, 0)
      .to(hint, { autoAlpha: 0, duration: 0.6 }, 0)
      .to(deskLayer, { yPercent: -5, duration: 10 }, 0)
      .to(foreLayer, { yPercent: desktop ? -42 : -28, duration: 10 }, 0)
      // 2) обложка открывается, папка смещается, чтобы раскрытая композиция осталась по центру
      .to(cover, { ...open, duration: 4, ease: 'power2.inOut' }, 1.5)
      .to(folder, { ...shift, duration: 4, ease: 'power2.inOut' }, 1.5)
      // 3) лист «выпрыгивает» из папки, текст проявляется пружинно
      .to(sheet, { yPercent: -3, scale: 1.03, duration: 2, ease: 'back.out(2)' }, 4.6)
      .to(reveals, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.35, ease: 'back.out(1.5)' }, 4.8)
      // 4) штамп: резкий «шлёпок», затем короткая тряска папки
      .to(stamp, { autoAlpha: 1, scale: 1, rotation: -9, duration: 0.45, ease: 'power4.in' }, 7.6)
      .to(folder, { y: 6, duration: 0.1, ease: 'power1.out' }, 8.05)
      .to(folder, { x: -6, rotation: -0.7, duration: 0.08 }, 8.15)
      .to(folder, { x: 5, rotation: 0.6, duration: 0.08 }, 8.23)
      .to(folder, { x: -2, rotation: -0.2, duration: 0.07 }, 8.31)
      .to(folder, { x: 0, y: 0, rotation: 0, duration: 0.4, ease: 'elastic.out(1, .45)' }, 8.38);

    tl.to({}, { duration: 1.4 }); // пауза в конце, чтобы сцену успевали прочитать

    return () => {
      cover.style.transformOrigin = '';
      inside.style.transform = '';
    };
  });
}
