// Загрузка данных каталога: data/universities/*.json + data/membership.json + data/images.json.
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { root, readJson } from './lib.mjs';

export async function loadUniversities() {
  const dir = join(root, 'data/universities');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  const membership = await readJson('data/membership.json');
  let images = { images: [] };
  try { images = await readJson('data/images.json'); } catch { /* фото ещё не добавлены */ }
  // Подпись-атрибуция всегда собирается из исходных полей, а не хранится готовой строкой
  for (const i of images.images) {
    i.attribution_text = `“${i.original_title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '')}” by ${i.author}, ${i.license}`;
  }
  const byUniversity = new Map(images.images.filter((i) => i.university_id).map((i) => [i.university_id, i]));
  const list = [];
  for (const f of files) {
    const u = await readJson(`data/universities/${f}`);
    u.membership = membership[u.id];
    u.image = byUniversity.get(u.id) ?? null;
    list.push(u);
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export const FIELD_ORDER = ['deadlines', 'tests', 'english', 'essays', 'international', 'aid', 'aid_forms'];

/** Ближайший по порядку раунд для превью: первый в списке дедлайнов. */
export const firstRound = (u) => u.fields.deadlines.value[0];

/** Сколько значений в вузе не подтверждено. */
export const needsVerification = (u) => FIELD_ORDER.filter((k) => u.fields[k]?.status === 'needs_verification');
