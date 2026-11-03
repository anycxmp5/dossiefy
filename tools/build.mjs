// Генератор статических страниц: data/*.json + tools/pages/*.mjs + templates/layout.html -> HTML.
// Без зависимостей и сборщика. Запуск: node tools/build.mjs [--indexable]
//   --indexable: собрать без noindex (только для аудита Lighthouse SEO; в репозитории остаётся значение из settings.json)
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { root, settings, T, R, esc, render, inlineCss, rootFor, NAV, readText } from './lib.mjs';

const indexable = settings.indexable || process.argv.includes('--indexable');
const robots = indexable ? '' : '<meta name="robots" content="noindex, nofollow">';
const layout = await readText('templates/layout.html');

const pageModules = ['home', 'catalog', 'course', 'demo', 'essays', 'review', 'static'];
const pages = [];
for (const name of pageModules) {
  const mod = await import(`./pages/${name}.mjs`).catch((e) => { if (e.code === 'ERR_MODULE_NOT_FOUND' && String(e.message).includes(`${name}.mjs`)) return null; throw e; });
  if (mod) pages.push(...(await mod.default()));
}

const motionScripts = (r) => `  <script src="${r}vendor/gsap/gsap.min.js" defer></script>
  <script src="${r}vendor/gsap/ScrollTrigger.min.js" defer></script>
  <script src="${r}vendor/lenis/lenis.min.js" defer></script>`;

const outPaths = new Set();
for (const p of pages) {
  if (outPaths.has(p.out)) throw new Error(`Дубликат страницы: ${p.out}`);
  outPaths.add(p.out);
  const r = p.rootOverride ?? rootFor(p.out);
  const nav = NAV.map((n) => `        <a href="${r}${n.href}"${p.nav === n.id ? ' aria-current="page"' : ''}>${T(n.key)}</a>`).join('\n');
  const scripts = [
    p.motion ? motionScripts(r) : '',
    p.script ? `  <script type="module" src="${r}${p.script}"></script>` : '',
  ].filter(Boolean).join('\n');
  const canonicalPath = '/' + p.out.replace(/index\.html$/, '');
  const html = render(layout, {
    root: r,
    title: esc(p.title),
    description: esc(p.description),
    ogTitle: esc(p.ogTitle ?? p.title),
    ogDescription: esc(p.ogDescription ?? p.description),
    canonicalPath: p.out === '404.html' ? '/' : canonicalPath,
    robots: p.out === '404.html' ? '<meta name="robots" content="noindex">' : robots,
    css: await inlineCss(r, p.css ?? []),
    bodyClass: p.bodyClass ?? '',
    pageId: p.id,
    nav,
    body: p.body,
    scripts,
  });
  const target = join(root, p.out);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html, 'utf8');
}
// Для GitHub Pages: .nojekyll всегда; robots.txt и sitemap.xml только когда в settings.json включена индексация
import { rm } from 'node:fs/promises';
await writeFile(join(root, '.nojekyll'), '');
if (settings.indexable) {
  const base = settings.brand.site_url;
  const urls = pages.filter((p) => p.out !== '404.html').map((p) => `${base}/${p.out.replace(/index\.html$/, '')}`);
  await writeFile(join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  await writeFile(join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
} else {
  await rm(join(root, 'sitemap.xml'), { force: true });
  await rm(join(root, 'robots.txt'), { force: true });
}
console.log(`OK: ${pages.length} страниц${indexable ? ' (indexable)' : ''}`);
