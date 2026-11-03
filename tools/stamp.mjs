// Штамп: заранее «нарисованный» неровный край (статичный SVG), без feTurbulence-фильтра на анимируемом элементе.
// Неровности, разрывы краски и крапинки считаются при сборке по фиксированному seed, поэтому результат всегда одинаков.
export function stampSvg(main, sub, seed0 = 11) {
  let seed = seed0;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const W = 230, H = 104;
  const jit = (v, a) => +(v + (rnd() - 0.5) * a).toFixed(1);
  const ring = (inset, step, amp) => {
    const x0 = inset, y0 = inset, x1 = W - inset, y1 = H - inset, p = [];
    for (let x = x0; x < x1; x += step) p.push([jit(x, amp), jit(y0, amp)]);
    for (let y = y0; y < y1; y += step) p.push([jit(x1, amp), jit(y, amp)]);
    for (let x = x1; x > x0; x -= step) p.push([jit(x, amp), jit(y1, amp)]);
    for (let y = y1; y > y0; y -= step) p.push([jit(x0, amp), jit(y, amp)]);
    return 'M' + p.map((q) => q.join(' ')).join('L') + 'Z';
  };
  const dash = []; let sum = 0;
  while (sum < 760) { const a = 60 + Math.floor(rnd() * 120), g = 1 + Math.floor(rnd() * 4); dash.push(a, g); sum += a + g; }
  // мелкие и редкие крапинки: слишком крупные «съедают» буквы
  const specks = Array.from({ length: 14 }, () => `<circle cx="${(20 + rnd() * 190).toFixed(1)}" cy="${(14 + rnd() * 78).toFixed(1)}" r="${(0.35 + rnd() * 0.5).toFixed(2)}"/>`).join('');
  return `<svg class="stamp__svg" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">`
    + `<path d="${ring(5, 14, 2.4)}" fill="rgba(255,253,247,.78)" stroke="var(--red)" stroke-width="4.5" stroke-linejoin="round" stroke-dasharray="${dash.join(' ')}"/>`
    + `<path d="${ring(12, 18, 1.6)}" fill="none" stroke="var(--red)" stroke-width="1.8" stroke-linejoin="round"/>`
    + `<text x="115" y="58" text-anchor="middle" class="stamp__main">${main.toUpperCase()}</text>`
    + `<path d="M34 ${jit(67, 1.2)}L196 ${jit(67, 1.2)}" stroke="var(--red)" stroke-width="2.4" fill="none"/>`
    + `<text x="115" y="88" text-anchor="middle" class="stamp__sub">${sub.toUpperCase()}</text>`
    + `<g fill="#fffdf7">${specks}</g></svg>`;
}
