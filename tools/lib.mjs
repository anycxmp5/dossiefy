// Общие функции сборки: словари, подстановки, минификация CSS, оболочка страницы.
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const readJson = async (p) => JSON.parse(await readFile(join(root, p), 'utf8'));
export const readText = (p) => readFile(join(root, p), 'utf8');

export const settings = await readJson('data/settings.json');
export const en = await readJson('data/i18n/en.json');
export const ru = await readJson('data/i18n/ru.json');

// Оба словаря обязаны иметь одинаковые ключи (чтобы позже включить переключатель RU/EN без правок страниц)
{
  const missing = [
    ...Object.keys(en).filter((k) => !(k in ru)).map((k) => `ru: ${k}`),
    ...Object.keys(ru).filter((k) => !(k in en)).map((k) => `en: ${k}`),
  ];
  if (missing.length) throw new Error(`Ключи i18n не совпадают: ${missing.join(', ')}`);
}

/** Английская строка интерфейса. */
export const T = (key) => { if (!(key in en)) throw new Error(`Нет ключа en: ${key}`); return en[key]; };
/** Русская строка (пояснения). В разметке её нужно оборачивать в элемент с lang="ru". */
export const R = (key) => { if (!(key in ru)) throw new Error(`Нет ключа ru: ${key}`); return ru[key]; };
/** Русский фрагмент одной строкой: <span lang="ru">…</span>. */
export const RS = (key) => `<span lang="ru">${R(key)}</span>`;

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Подстановки в шаблонах {{t:key}}, {{r:key}}, {{s:path}}, {{c:name}}
export function render(tpl, ctx = {}) {
  return tpl
    .replace(/\{\{t:([\w.]+)\}\}/g, (_, k) => T(k))
    .replace(/\{\{r:([\w.]+)\}\}/g, (_, k) => R(k))
    .replace(/\{\{s:([\w.]+)\}\}/g, (_, path) => {
      const v = path.split('.').reduce((o, k) => o?.[k], settings);
      if (v === undefined) throw new Error(`Нет настройки: ${path}`);
      return v === null ? '' : String(v);
    })
    .replace(/\{\{c:(\w+)\}\}/g, (_, k) => {
      if (!(k in ctx)) throw new Error(`Нет значения страницы: ${k}`);
      return ctx[k];
    });
}

export const minifyCss = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,])\s*/g, '$1')
  .replace(/:\s+/g, ':')
  .replace(/;}/g, '}')
  .trim();

const baseCss = ['css/tokens.css', 'css/base.css', 'css/paper.css'];
export async function inlineCss(rootPath, pageCss = []) {
  const parts = await Promise.all([...baseCss, ...pageCss].map(readText));
  return minifyCss(parts.join('\n')).replace(/url\("\.\.\//g, `url("${rootPath}`);
}

/** Путь к корню сайта из страницы по её out-пути: "course/x/index.html" -> "../../". */
export const rootFor = (out) => '../'.repeat(out.split('/').length - 1);

export const NAV = [
  { id: 'course', href: 'course/', key: 'nav.course' },
  { id: 'catalog', href: 'catalog/', key: 'nav.catalog' },
  { id: 'demo', href: 'demo/', key: 'nav.demo' },
  { id: 'essays', href: 'essays/', key: 'nav.essays' },
  { id: 'review', href: 'review/', key: 'nav.review' },
];
