// Случайная (с фиксированным seed) выборка 20% значений каталога для повторной проверки. node tools/sample-values.mjs [seed]
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { root, readJson } from './lib.mjs';

let seed = Number(process.argv[2]) || 20261103;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const files = (await readdir(join(root, 'data/universities'))).filter((f) => f.endsWith('.json')).sort();
const all = [];
for (const f of files) {
  const u = await readJson(`data/universities/${f}`);
  for (const [k, v] of Object.entries(u.fields)) all.push({ id: u.id, field: k, status: v.status, source: v.source_url, value: JSON.stringify(v.value) });
}
const n = Math.round(all.length * 0.2);
const pick = [...all].sort(() => rnd() - 0.5).slice(0, n).sort((a, b) => (a.id + a.field).localeCompare(b.id + b.field));
console.log(`Всего значений: ${all.length}; выборка 20%: ${n}`);
pick.forEach((p, i) => console.log(`${String(i + 1).padStart(2)}. ${p.id}.${p.field} [${p.status}]\n    ${p.source}\n    ${p.value.slice(0, 200)}`));
