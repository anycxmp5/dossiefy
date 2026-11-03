// Страница проверки эссе: всё считается в браузере, текст никуда не отправляется.
import { analyze } from '../essay-check/analyzer.js';
import { message } from '../essay-check/messages.js';
import { load, save, remove } from '../storage.js';

const root = document.querySelector('[data-checker]');
const ui = JSON.parse(document.getElementById('chk-i18n').textContent);
const fmt = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const T = (k, v) => fmt(ui.t[k], v);
const R = (k, v) => fmt(ui.r[k], v);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const m = (k, p) => message(k, p, 'ru');

const area = document.getElementById('essay');
const counter = root.querySelector('[data-counter]');
const report = root.querySelector('[data-report]');
const keep = root.querySelector('[data-keep]');
const DRAFT = 'dossiefy:essay-draft:v1';

const { items, stopwords_en: stopwords } = await fetch('../../data/cliches.json').then((r) => r.json());

const wordsOf = (s) => (s.trim().match(/\S+/g) || []).length;
const paintCount = () => { counter.textContent = T('chk.counter', { words: wordsOf(area.value), chars: area.value.length }); };

// черновик сохраняется только по явному согласию пользователя
const saved = load(DRAFT, { on: false, text: '' });
if (saved.on) { keep.checked = true; area.value = saved.text; }
area.addEventListener('input', () => { paintCount(); if (keep.checked) save(DRAFT, { on: true, text: area.value }); });
keep.addEventListener('change', () => { if (keep.checked) save(DRAFT, { on: true, text: area.value }); else remove(DRAFT); });
paintCount();

const badge = (s) => `<span class="st st--${s}">${esc(m(`status.${s}`))}</span>`;

function highlight(text, found) {
  let out = '', pos = 0;
  for (const c of found) {
    if (c.index < pos) continue;
    out += esc(text.slice(pos, c.index)) + `<mark title="${esc(c.hint_ru)}">${esc(text.slice(c.index, c.end))}</mark>`;
    pos = c.end;
  }
  return out + esc(text.slice(pos));
}

function render(r, text) {
  const lenKey = `len.${r.length.status}`;
  const lenParams = { words: r.words, min: r.length.min, max: r.length.max, need: r.length.min - r.words, over: r.words - r.length.max };
  const lenStatus = r.length.status === 'ok' ? 'pass' : r.length.status === 'empty' ? 'fail' : 'warn';
  const structure = r.structure.map((s) => {
    const base = `struct.${s.id}`;
    const params = { count: s.count, pct: Math.round((s.ratio ?? 0) * 100) };
    return `<li class="st-row">${badge(s.status)}<div><strong>${esc(m(`${base}.title`))}</strong><p>${esc(m(`${base}.${s.status}`, params))}</p></div></li>`;
  }).join('');
  const cliches = r.cliches.length
    ? `<ul class="cl">${r.cliches.map((c) => `<li><mark>${esc(c.text)}</mark> <span>${esc(c.hint_ru)}</span></li>`).join('')}</ul>`
    : `<p>${esc(R('chk.report.cliches.none'))}</p>`;
  const rep = r.repetition.words.length
    ? `<ul class="tags">${r.repetition.words.map((w) => `<li>${esc(w.word)} <b>×${w.count}</b></li>`).join('')}</ul>` : `<p>${esc(R('chk.report.repeat.none'))}</p>`;
  const starters = r.repetition.starters.length
    ? `<h4>${esc(R('chk.report.starters'))}</h4><ul class="tags">${r.repetition.starters.map((w) => `<li>${esc(w.word)} <b>×${w.count}</b></li>`).join('')}</ul>` : '';
  const longList = r.sentences.long.length
    ? `<ol class="long">${r.sentences.long.slice(0, 4).map((l) => `<li><b>${l.words}</b> ${esc(l.text.length > 160 ? `${l.text.slice(0, 157)}…` : l.text)}</li>`).join('')}</ol>` : '';
  const passive = `<p>${esc(R('chk.passive.stats', { n: r.passive.count, pct: Math.round(r.passive.share * 100) }))}</p>${r.passive.examples.length ? `<ul class="long">${r.passive.examples.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}`;
  const tips = (r.tips.length ? r.tips : [{ code: 'tip.none', params: {} }]).map((t) => `<li>${esc(m(t.code, t.params))}</li>`).join('');

  report.innerHTML = `
    <h2>${esc(R('chk.report'))}</h2>
    <p class="notice notice--gold"><strong>${esc(R('chk.disclaimer'))}</strong> ${esc(R('chk.note.heuristic'))}</p>
    <section><h3>${esc(R('chk.report.length'))}</h3><p class="len">${badge(lenStatus)} ${esc(m(lenKey, lenParams))}</p></section>
    <section><h3>${esc(R('chk.report.structure'))}</h3><ul class="st-list">${structure}</ul></section>
    <section><h3>${esc(R('chk.report.cliches'))}</h3>${cliches}</section>
    <section><h3>${esc(R('chk.report.sentences'))}</h3><p>${esc(R('chk.sentences.stats', r.sentences))}</p>${longList}</section>
    <section><h3>${esc(R('chk.report.repeat'))}</h3>${rep}${starters}</section>
    <section><h3>${esc(R('chk.report.passive'))}</h3>${passive}</section>
    <section><h3>${esc(R('chk.report.tips'))}</h3><ul class="tips">${tips}</ul></section>
    <section><h3>${esc(R('chk.report.text'))}</h3><div class="marked" lang="en">${highlight(text, r.cliches)}</div></section>`;
  report.hidden = false;
}

root.querySelector('[data-run]').addEventListener('click', () => {
  const text = area.value;
  if (!text.trim()) { report.innerHTML = `<p class="notice notice--warn">${esc(m('len.empty'))}</p>`; report.hidden = false; return; }
  render(analyze(text, { cliches: items, stopwords }), text);
  report.focus();
  report.scrollIntoView({ behavior: document.documentElement.classList.contains('reduced') ? 'auto' : 'smooth', block: 'start' });
});
root.querySelector('[data-clear]').addEventListener('click', () => {
  area.value = ''; report.hidden = true; report.innerHTML = ''; remove(DRAFT); keep.checked = false; paintCount(); area.focus();
});
