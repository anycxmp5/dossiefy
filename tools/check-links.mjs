// Проверка ссылок. Запуск: node tools/check-links.mjs [--external]
//   без флага: внутренние ссылки, якоря и ресурсы (img/css/js) в собранных HTML;
//   --external: дополнительно все внешние ссылки (кроме t.me-заглушки): открывается ли страница.
import { readdir, readFile, access } from 'node:fs/promises';
import { join, dirname, resolve, relative } from 'node:path';
import { root } from './lib.mjs';

const checkExternal = process.argv.includes('--external');
const SKIP_DIRS = new Set(['node_modules', 'vendor', 'templates', 'data', 'tools', 'tests', 'js', 'css', 'fonts', 'img', '.claude', '.git']);

async function* htmlFiles(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) yield* htmlFiles(join(dir, e.name)); }
    else if (e.name.endsWith('.html')) yield join(dir, e.name);
  }
}
const exists = (p) => access(p).then(() => true, () => false);

const pages = new Map(); // файл -> html
for await (const f of htmlFiles(root)) pages.set(f, await readFile(f, 'utf8'));

const internalErrors = []; const external = new Map(); let internalCount = 0;
const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

for (const [file, html] of pages) {
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(mailto:|tel:|javascript:|data:)/.test(ref)) continue;
    if (/^https?:\/\//.test(ref)) { (external.get(ref) ?? external.set(ref, new Set()).get(ref)).add(relative(root, file)); continue; }
    internalCount++;
    const [pathPart, frag] = ref.split('#');
    let target = pathPart ? (pathPart.startsWith('/') ? join(root, pathPart) : resolve(dirname(file), pathPart)) : file;
    if (pathPart.endsWith('/') || (!/\.[a-z0-9]+$/i.test(pathPart) && pathPart)) target = join(target, 'index.html');
    if (!(await exists(target))) { internalErrors.push(`${relative(root, file)} → ${ref}  (нет файла)`); continue; }
    if (frag && target.endsWith('.html')) {
      const html2 = pages.get(target) ?? await readFile(target, 'utf8');
      if (!ids(html2).has(frag)) internalErrors.push(`${relative(root, file)} → ${ref}  (нет якоря #${frag})`);
    }
  }
}
console.log(`HTML-страниц: ${pages.size}; внутренних ссылок и ресурсов проверено: ${internalCount}; ошибок: ${internalErrors.length}`);
internalErrors.forEach((e) => console.log(' - ' + e));

let externalBad = [];
if (checkExternal) {
  const urls = [...external.keys()].filter((u) => !u.includes('PLACEHOLDER_BOT') && !u.startsWith('https://dossiefy.com'));
  console.log(`Внешних уникальных ссылок: ${urls.length}`);
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
  const probe = async (url) => {
    for (const method of ['HEAD', 'GET']) {
      try {
        const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 20000);
        const res = await fetch(url, { method, redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,*/*' } });
        clearTimeout(timer);
        if (res.ok) return { url, ok: true, status: res.status };
        if (method === 'GET') return { url, ok: false, status: res.status };
      } catch (e) { if (method === 'GET') return { url, ok: false, status: String(e.cause?.code ?? e.name) }; }
    }
  };
  const results = []; const queue = [...urls];
  await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) results.push(await probe(queue.shift())); }));
  externalBad = results.filter((r) => !r.ok).sort((a, b) => a.url.localeCompare(b.url));
  console.log(`Открылось: ${results.length - externalBad.length} из ${results.length}`);
  for (const b of externalBad) console.log(` ✖ ${b.status}  ${b.url}  (на страницах: ${[...external.get(b.url)].slice(0, 3).join(', ')})`);
}
if (internalErrors.length || externalBad.length) process.exitCode = 1;
