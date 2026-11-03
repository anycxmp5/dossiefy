// Список значений каталога со статусом needs_verification. node tools/list-nv.mjs [--write]
// С флагом --write подставляет список в README.md между маркерами NV:START и NV:END.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { root, readJson } from './lib.mjs';

const LABEL = { deadlines: 'Deadlines', tests: 'Tests', english: 'English proficiency', essays: 'Essays', international: 'International applicants', aid: 'Aid for internationals', aid_forms: 'Aid forms' };
const files = (await readdir(join(root, 'data/universities'))).filter((f) => f.endsWith('.json')).sort();
const lines = [];
let n = 0;
for (const f of files) {
  const u = await readJson(`data/universities/${f}`);
  for (const [k, v] of Object.entries(u.fields)) {
    if (v.status !== 'needs_verification') continue;
    n++;
    lines.push(`- **${u.name}**, ${LABEL[k]} (\`${u.id}.${k}\`): ${v.value.length ? (typeof v.value === 'string' ? v.value : '') : ''} Источник: ${v.source_url}`.replace(/\s+Источник/, ' Источник'));
  }
}
const md = `Значений со статусом \`needs_verification\`: **${n}**.\n\n${lines.join('\n')}\n`;
if (process.argv.includes('--write')) {
  const p = join(root, 'README.md');
  const text = await readFile(p, 'utf8');
  const next = text.replace(/<!-- NV:START -->[\s\S]*?<!-- NV:END -->/, `<!-- NV:START -->\n${md}<!-- NV:END -->`);
  await writeFile(p, next, 'utf8');
  console.log(`README обновлён: ${n} значений`);
} else console.log(md);
