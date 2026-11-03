// Высота липкой шапки (CSS-переменная --hh): закреплённые сцены стартуют под ней.
export function headerOffset() {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hh'));
  return Number.isFinite(v) ? v : 0;
}
