// Валидатор данных. Запуск: node tools/check-data.mjs  (код выхода 1, если есть ошибки)
import { readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { root, readJson } from './lib.mjs';

const errors = []; const warnings = [];
const err = (m) => errors.push(m); const warn = (m) => warnings.push(m);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = new Set(['verified', 'needs_verification']);
const FIELDS = ['deadlines', 'tests', 'english', 'essays', 'international', 'aid', 'aid_forms'];
const exists = (p) => access(join(root, p)).then(() => true, () => false);
const isHttps = (u) => { try { return new URL(u).protocol === 'https:'; } catch { return false; } };

// ---- вузы
const membership = await readJson('data/membership.json');
const files = (await readdir(join(root, 'data/universities'))).filter((f) => f.endsWith('.json'));
if (files.length < 12) err(`В каталоге ${files.length} вузов, нужно минимум 12`);
let valuesTotal = 0, nvTotal = 0;
for (const f of files) {
  const u = await readJson(`data/universities/${f}`);
  const id = u.id ?? f;
  for (const k of ['id', 'name', 'common_app_slug', 'official_admissions_url']) if (!u[k]) err(`${id}: нет поля ${k}`);
  if (f !== `${u.id}.json`) err(`${id}: имя файла ${f} не совпадает с id`);
  if (!isHttps(u.official_admissions_url)) err(`${id}: official_admissions_url не https`);
  const mem = membership[u.id];
  if (!mem || mem.first_year_participation !== true || mem.status !== 'verified') err(`${id}: нет подтверждённого членства в Common App (data/membership.json)`);
  else if (!isHttps(mem.source_url) || !DATE.test(mem.verified_on)) err(`${id}: у членства нет source_url или даты`);
  for (const k of FIELDS) {
    const v = u.fields?.[k];
    if (!v) { err(`${id}.${k}: поле отсутствует`); continue; }
    valuesTotal++;
    if (!STATUSES.has(v.status)) err(`${id}.${k}: недопустимый status "${v.status}"`);
    if (v.status === 'needs_verification') nvTotal++;
    if (!isHttps(v.source_url)) err(`${id}.${k}: source_url не https`);
    if (!DATE.test(v.verified_on ?? '')) err(`${id}.${k}: verified_on не в формате YYYY-MM-DD`);
    if (!v.cycle) err(`${id}.${k}: нет cycle (используйте "not stated", если страница цикл не называет)`);
    if (!v.note_ru) err(`${id}.${k}: нет note_ru`);
    if (k === 'deadlines') {
      if (!Array.isArray(v.value) || !v.value.length) err(`${id}.deadlines: value должен быть непустым массивом`);
      else v.value.forEach((d, i) => { if (!d.round || !d.date) err(`${id}.deadlines[${i}]: нужны round и date`); });
    } else if (typeof v.value !== 'string' || !v.value) err(`${id}.${k}: value должен быть непустой строкой`);
  }
}
console.log(`Вузы: ${files.length}; значений: ${valuesTotal}; needs_verification: ${nvTotal}`);

// ---- изображения
const imgs = (await readJson('data/images.json')).images;
const LICENSE_OK = /^(cc0|cc by \d|cc by-sa|public domain)/i;
const universityIds = new Set(files.map((f) => f.replace('.json', '')));
for (const i of imgs) {
  for (const k of ['id', 'university_id', 'file', 'author', 'source_url', 'license', 'license_url', 'original_title', 'changes_note']) if (!i[k]) err(`image ${i.id ?? '?'}: нет поля ${k}`);
  if (!LICENSE_OK.test(i.license ?? '')) err(`image ${i.id}: лицензия "${i.license}" не входит в разрешённые`);
  if (!universityIds.has(i.university_id)) err(`image ${i.id}: неизвестный university_id`);
  for (const k of ['file', 'file_small']) if (i[k] && !(await exists(i[k]))) err(`image ${i.id}: нет файла ${i[k]}`);
}
const withoutImage = [...universityIds].filter((id) => !imgs.some((i) => i.university_id === id));
if (withoutImage.length) warn(`Нет фото (будет типографическая карточка): ${withoutImage.join(', ')}`);
console.log(`Изображения: ${imgs.length}`);

// ---- prompts
const pr = await readJson('data/essay_prompts.json');
if (pr.prompts.length !== 7) err(`prompts: ожидалось 7, найдено ${pr.prompts.length}`);
if (!isHttps(pr.source_url) || !DATE.test(pr.verified_on) || !pr.cycle) err('prompts: нужны source_url, verified_on, cycle');
if (!isHttps(pr.length?.source_url)) err('prompts.length: нужен source_url');

// ---- примеры эссе
const ex = (await readJson('data/essay_examples.json')).examples;
if (ex.length < 8 || ex.length > 10) err(`Примеров эссе ${ex.length}, нужно 8–10`);
for (const e of ex) {
  for (const k of ['title', 'university_or_author', 'url', 'why_it_works', 'structure_notes']) if (!e[k]) err(`example ${e.id}: нет ${k}`);
  if (!isHttps(e.url)) err(`example ${e.id}: url не https`);
  if (e.short_quote && e.short_quote.split(/\s+/).length > 25) err(`example ${e.id}: цитата длиннее одного предложения`);
}
console.log(`Примеры эссе: ${ex.length}`);

// ---- клише
const cl = await readJson('data/cliches.json');
const ids = new Set();
for (const c of cl.items) {
  if (ids.has(c.id)) err(`cliche ${c.id}: дубль id`); ids.add(c.id);
  try { new RegExp(c.pattern, 'giu'); } catch { err(`cliche ${c.id}: некорректный шаблон`); }
  if (!c.hint_ru) err(`cliche ${c.id}: нет hint_ru`);
}
console.log(`Клише: ${cl.items.length}`);

// ---- курс
const course = (await readJson('data/course.json')).modules;
if (course.length !== 6) err(`Модулей курса ${course.length}, нужно 6`);
for (const m of course) {
  if (!m.lessons.length || !m.terms.length || !m.checklist.length || !m.mistakes.length) err(`module ${m.id}: пустой раздел`);
  const lid = new Set(); for (const l of m.lessons) { if (lid.has(l.id)) err(`${m.id}: дубль урока ${l.id}`); lid.add(l.id); if (!l.body?.length) err(`${m.id}/${l.id}: пустой урок`); }
}
const processSteps = (await readJson('data/process.json')).steps;
for (const s of processSteps) if (!course.some((m) => m.id === s.id)) err(`process.json: шаг ${s.id} не ведёт ни в один модуль курса`);
console.log(`Курс: ${course.length} модулей, ${course.reduce((n, m) => n + m.lessons.length, 0)} уроков`);

// ---- демо
const demo = (await readJson('data/demo_steps.json')).steps;
if (demo.length !== 8) err(`Шагов демо ${demo.length}, нужно 8`);
for (const s of demo) {
  const fields = s.sections.flatMap((x) => [...(x.fields ?? []), ...(x.repeat?.fields ?? [])]);
  for (const f of fields) {
    if (f.options && f.sample && !f.options.includes(f.sample)) err(`demo ${s.id}.${f.id}: sample не из options`);
    if (f.req && f.sample === '' ) err(`demo ${s.id}.${f.id}: обязательное поле без sample`);
  }
}
console.log(`Демо: ${demo.length} шагов`);

for (const w of warnings) console.log(`ВНИМАНИЕ: ${w}`);
if (errors.length) { console.log(`\nОШИБОК: ${errors.length}`); errors.forEach((e) => console.log(' - ' + e)); process.exitCode = 1; }
else console.log('\nOK: ошибок нет');
