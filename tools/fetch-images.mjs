// Скачивает выбранные фото кампусов с Wikimedia Commons (только CC0 / CC BY / CC BY-SA / Public domain),
// сохраняет в img/campus/ и пишет data/images.json с автором, источником, лицензией и атрибуцией.
// Запуск: node tools/fetch-images.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from './lib.mjs';

const CHOSEN = {
  harvard: 'File:Harvard University main campus aerial.JPG',
  yale: 'File:2014-04-17-Yale-Old-Campus-Courtyard-Harkness-Tower.jpg',
  princeton: 'File:Cannon Green and Nassau Hall, Princeton University.jpg',
  brown: 'File:Brown University - Main Campus 02.jpg',
  duke: 'File:Duke Chapel, West Campus, Duke University, Durham, NC (48960880671).jpg',
  northwestern: 'File:Northwestern University Evanston.jpg',
  jhu: 'File:Gilman Hall and the Keyser Quad.jpg',
  rice: 'File:Rice University Sally Port.jpg',
  stanford: 'File:Stanford University Main Quad May 2011 001.jpg',
  amherst: 'File:War Memorial, Amherst College, Amherst MA.jpg',
  williams: 'File:Chapin Hall, 62 Chapin Hall Dr, Williams College.jpg',
};
const extra = process.argv.slice(2).map((a) => a.split('='));          // можно добавить: id="File:..."
if (extra.length) { for (const k of Object.keys(CHOSEN)) delete CHOSEN[k]; } // с аргументами обрабатываем только их
for (const [id, title] of extra) CHOSEN[id] = title.replace(/^"|"$/g, '');

const ALLOWED = /^(cc0|cc by 1|cc by 2|cc by 3|cc by 4|cc by-sa|public domain|pd)/i;
const UA = { 'User-Agent': 'DossiefyBuild/1.0 (educational project; contact via site owner)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (h) => String(h ?? '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

await mkdir(join(root, 'img/campus'), { recursive: true });
let existing = [];
try { existing = JSON.parse(await (await import('node:fs/promises')).readFile(join(root, 'data/images.json'), 'utf8')).images; } catch { /* первый запуск */ }
const out = existing.filter((i) => !(i.university_id in CHOSEN));

for (const [id, title] of Object.entries(CHOSEN)) {
  await sleep(2500);
  const q = new URLSearchParams({ action: 'query', format: 'json', titles: title, prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1400' });
  const r = await fetch(`https://commons.wikimedia.org/w/api.php?${q}`, { headers: UA });
  const txt = await r.text();
  let j; try { j = JSON.parse(txt); } catch { console.log(id, 'ОШИБКА API:', txt.slice(0, 80)); continue; }
  const page = Object.values(j.query.pages)[0];
  const ii = page.imageinfo?.[0];
  if (!ii) { console.log(id, 'нет файла', title); continue; }
  const m = ii.extmetadata;
  const license = m.LicenseShortName?.value ?? '';
  if (!ALLOWED.test(license)) { console.log(id, 'ЛИЦЕНЗИЯ НЕ ПОДХОДИТ:', license); continue; }
  const author = strip(m.Artist?.value) || 'Unknown author';
  const file = `img/campus/${id}.jpg`;
  await sleep(1500);
  const img = await fetch(ii.thumburl, { headers: UA });
  if (!img.ok) { console.log(id, 'не скачалось', img.status); continue; }
  await writeFile(join(root, file), Buffer.from(await img.arrayBuffer()));
  const licenseUrl = m.LicenseUrl?.value ?? (/public domain|cc0/i.test(license) ? 'https://creativecommons.org/publicdomain/zero/1.0/' : '');
  const sourceUrl = ii.descriptionurl;
  out.push({
    id: `${id}-campus`, university_id: id, file, author, source_url: sourceUrl, license, license_url: licenseUrl,
    attribution_text: `“${strip(title.replace(/^File:/, '').replace(/\.[a-z]+$/i, ''))}” by ${author}, ${license}`,
    changes_note: 'Resized and recompressed for the web; cropped by the page layout (object-fit).',
    original_title: title, checked_on: new Date().toISOString().slice(0, 10),
  });
  console.log(id.padEnd(13), license.padEnd(12), author.slice(0, 40));
}
await writeFile(join(root, 'data/images.json'), JSON.stringify({ images: out }, null, 2) + '\n');
