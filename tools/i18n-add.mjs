// Добавляет ключи в оба словаря сразу: node tools/i18n-add.mjs <batch.json>
// batch.json: { "ключ": ["English", "Русский"], ... }. Существующие ключи перезаписываются.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './lib.mjs';

const batch = JSON.parse(readFileSync(process.argv[2], 'utf8').replace(/^﻿/, ''));
const files = { en: join(root, 'data/i18n/en.json'), ru: join(root, 'data/i18n/ru.json') };
const dict = { en: JSON.parse(readFileSync(files.en, 'utf8')), ru: JSON.parse(readFileSync(files.ru, 'utf8')) };
let n = 0;
for (const [key, [e, r]] of Object.entries(batch)) {
  if (typeof e !== 'string' || typeof r !== 'string') throw new Error(`Ключ ${key}: нужны две строки [en, ru]`);
  dict.en[key] = e; dict.ru[key] = r; n++;
}
for (const l of ['en', 'ru']) writeFileSync(files[l], JSON.stringify(dict[l], null, 2) + '\n');
console.log(`Добавлено/обновлено ключей: ${n}. Всего: ${Object.keys(dict.en).length}`);
