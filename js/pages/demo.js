// Демо-подача: имитация Common App. Все данные только в localStorage этого браузера, ничего не отправляется.
import { load, save, remove } from '../storage.js';

const KEY = 'dossiefy:demo:v1';
const root = document.querySelector('[data-demo]');
const ui = JSON.parse(document.getElementById('demo-i18n').textContent);
const fmt = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const t = (k, v) => fmt(ui.t[k], v);
const r = (k, v) => fmt(ui.r[k], v);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const words = (s) => (String(s || '').trim().match(/\S+/g) || []).length;
const reduced = document.documentElement.classList.contains('reduced');

const [{ steps }, { prompts }] = await Promise.all([
  fetch('../data/demo_steps.json').then((x) => x.json()),
  fetch('../data/essay_prompts.json').then((x) => x.json()),
]);

// ---------- состояние
const state = load(KEY, { values: {}, repeats: {}, done: {}, current: steps[0].id, finished: false });
const persist = () => { save(KEY, state); const s = root.querySelector('[data-saved]'); if (s) s.hidden = false; };
const stepIndex = (id) => steps.findIndex((s) => s.id === id);
const allFields = (step) => step.sections.flatMap((s) => (s.fields ?? []));
const groups = (step) => step.sections.map((s) => s.repeat).filter(Boolean);
const optionsOf = (f) => (f.optionsFrom === 'prompts'
  ? prompts.map((p) => ({ v: String(p.n), l: `${t('demo.prompt', { n: p.n })}: ${p.text.slice(0, 70)}…` }))
  : (f.options ?? []).map((o) => ({ v: o, l: o })));

const getVal = (id, g, i) => (g ? state.repeats[g]?.[i]?.[id] : state.values[id]) ?? '';
const setVal = (id, v, g, i) => {
  if (g) { (state.repeats[g] ??= [])[i] ??= {}; state.repeats[g][i][id] = v; }
  else state.values[id] = v;
};

// ---------- поля
function fieldHtml(f, g, i) {
  const fid = g ? `f-${g}-${i}-${f.id}` : `f-${f.id}`;
  const v = getVal(f.id, g, i);
  const attrs = `id="${fid}" name="${fid}" data-field="${f.id}"${g ? ` data-group="${g}" data-index="${i}"` : ''} aria-describedby="${fid}-h ${fid}-e"${f.req ? ' required' : ''}`;
  let ctrl;
  if (f.type === 'select') {
    ctrl = `<select ${attrs}><option value="">—</option>${optionsOf(f).map((o) => `<option value="${esc(o.v)}"${o.v === v ? ' selected' : ''}>${esc(o.l)}</option>`).join('')}</select>`;
  } else if (f.type === 'radio') {
    return `<fieldset class="fld fld--radio" id="${fid}" data-radio="${f.id}"${g ? ` data-group="${g}" data-index="${i}"` : ''}><legend>${esc(f.label)}${f.req ? ' <span class="req" aria-hidden="true">*</span>' : ''}</legend>
      <div class="radios">${f.options.map((o, k) => `<label class="opt"><input type="radio" name="${fid}" value="${esc(o)}" data-field="${f.id}"${g ? ` data-group="${g}" data-index="${i}"` : ''}${o === v ? ' checked' : ''}${k === 0 && f.req ? ' required' : ''}><span>${esc(o)}</span></label>`).join('')}</div>
      ${f.hint ? `<p class="hint" id="${fid}-h" lang="ru">${esc(f.hint)}</p>` : `<span id="${fid}-h"></span>`}<p class="err" id="${fid}-e" role="alert"></p></fieldset>`;
  } else if (f.type === 'textarea') {
    ctrl = `<textarea ${attrs} rows="${f.rows ?? 3}"${f.max ? ` maxlength="${f.max}"` : ''}>${esc(v)}</textarea>`;
  } else {
    ctrl = `<input ${attrs} type="${f.type}"${f.max && f.type === 'text' ? ` maxlength="${f.max}"` : ''}${f.min != null ? ` min="${f.min}"` : ''}${f.type === 'number' && f.max != null ? ` max="${f.max}"` : ''} value="${esc(v)}"${f.type === 'number' ? ' inputmode="numeric"' : ''}>`;
  }
  const counter = f.type === 'textarea' || (f.type === 'text' && f.max) ? `<p class="count" data-count="${fid}"></p>` : '';
  return `<div class="fld"><label for="${fid}">${esc(f.label)}${f.req ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>${ctrl}${counter}
    ${f.hint ? `<p class="hint" id="${fid}-h" lang="ru">${esc(f.hint)}</p>` : `<span id="${fid}-h"></span>`}<p class="err" id="${fid}-e" role="alert"></p></div>`;
}

function sectionHtml(sec) {
  if (sec.repeat) {
    const g = sec.repeat; const items = state.repeats[g.id] ?? (state.repeats[g.id] = [{}]);
    return `<fieldset class="sec"><legend>${esc(sec.title)}</legend>
      ${items.map((_, i) => `<div class="item" data-item="${g.id}:${i}"><div class="item__head"><strong>${esc(g.itemLabel)} ${i + 1}</strong>${items.length > 1 ? `<button type="button" class="link" data-remove="${g.id}:${i}">${t('demo.remove')}</button>` : ''}</div><div class="grid-f">${g.fields.map((f) => fieldHtml(f, g.id, i)).join('')}</div></div>`).join('')}
      ${items.length < g.max ? `<button type="button" class="btn btn--ghost btn--small" data-add="${g.id}">+ ${t('demo.add', { item: g.itemLabel })}</button>` : ''}</fieldset>`;
  }
  return `<fieldset class="sec"><legend>${esc(sec.title)}</legend><div class="grid-f">${sec.fields.map((f) => fieldHtml(f)).join('')}</div></fieldset>`;
}

// ---------- проверка
function validateStep(step) {
  const errs = [];
  const check = (f, v, id) => {
    const s = String(v ?? '').trim();
    if (f.req && !s) return errs.push({ id, msg: t('demo.err.required') });
    if (!s) return;
    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return errs.push({ id, msg: t('demo.err.email') });
    if (f.type === 'number') {
      const n = Number(s);
      if (Number.isNaN(n) || (f.min != null && n < f.min) || (f.max != null && n > f.max)) return errs.push({ id, msg: t('demo.err.number', { min: f.min ?? '-∞', max: f.max ?? '∞' }) });
    }
    if (f.words) {
      const n = words(s);
      if (n < f.words[0]) return errs.push({ id, msg: t('demo.err.wordsmin', { min: f.words[0], n }) });
      if (n > f.words[1]) return errs.push({ id, msg: t('demo.err.wordsmax', { max: f.words[1], n }) });
    }
  };
  for (const f of allFields(step)) check(f, getVal(f.id), `f-${f.id}`);
  for (const g of groups(step)) {
    const items = state.repeats[g.id] ?? [];
    const complete = items.filter((it) => g.fields.filter((f) => f.req).every((f) => String(it?.[f.id] ?? '').trim())).length;
    items.forEach((it, i) => g.fields.forEach((f) => check(f, it?.[f.id], `f-${g.id}-${i}-${f.id}`)));
    if (g.min && complete < g.min) errs.push({ id: `f-${g.id}-0-${g.fields[0].id}`, msg: t('demo.err.items', { n: g.min, item: g.itemLabel.toLowerCase() }) });
  }
  return errs;
}

function showErrors(step, errs) {
  root.querySelectorAll('.err').forEach((e) => { e.textContent = ''; });
  root.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
  const box = root.querySelector('[data-errbox]');
  if (!errs.length) { box.hidden = true; box.innerHTML = ''; return; }
  for (const e of errs) {
    const out = document.getElementById(`${e.id}-e`); if (out) out.textContent = e.msg;
    document.getElementById(e.id)?.setAttribute('aria-invalid', 'true');
  }
  box.hidden = false;
  box.innerHTML = `<strong>${esc(t('demo.err.title', { n: errs.length }))}</strong> <span lang="ru">${esc(r('demo.err.title', { n: errs.length }))}</span><ul>${errs.map((e) => `<li><a href="#${e.id}">${esc(document.querySelector(`label[for="${e.id}"]`)?.textContent.replace('*', '').trim() || document.querySelector(`#${e.id} legend`)?.textContent.replace('*', '').trim() || e.id)}</a>: ${esc(e.msg)}</li>`).join('')}</ul>`;
  box.focus();
  document.getElementById(errs[0].id)?.focus({ preventScroll: false });
}

// ---------- счётчики
function updateCounts(scope = root) {
  scope.querySelectorAll('[data-count]').forEach((c) => {
    const el = document.getElementById(c.dataset.count); if (!el) return;
    const f = findField(el.dataset.field);
    if (f?.words) c.textContent = f.words[1] >= 300 || f.words[0] > 0 ? t('demo.words.range', { n: words(el.value), min: f.words[0], max: f.words[1] }) : t('demo.words', { n: words(el.value) });
    else if (el.maxLength > 0) c.textContent = t('demo.chars', { n: el.value.length, max: el.maxLength });
    else c.textContent = t('demo.words', { n: words(el.value) });
  });
}
function findField(id) {
  for (const s of steps) {
    for (const f of allFields(s)) if (f.id === id) return f;
    for (const g of groups(s)) for (const f of g.fields) if (f.id === id) return f;
  }
}

// ---------- тестовые данные
function fillSample(step) {
  for (const f of allFields(step)) setVal(f.id, f.sample ?? '');
  for (const g of groups(step)) {
    const list = g.samples ?? [Object.fromEntries(g.fields.map((f) => [f.id, f.sample ?? '']))];
    state.repeats[g.id] = list.slice(0, g.max).map((x) => ({ ...x }));
  }
}

// ---------- сводка
function valueOf(f, step) { const v = getVal(f.id); return String(v).trim() ? esc(v) : `<em>${t('demo.empty')}</em>`; }
function summaryHtml(step) {
  const rows = allFields(step).map((f) => `<div><dt>${esc(f.label)}</dt><dd>${valueOf(f)}</dd></div>`).join('');
  const rep = groups(step).map((g) => (state.repeats[g.id] ?? []).map((it, i) => `<div class="sum-item"><strong>${esc(g.itemLabel)} ${i + 1}</strong><dl>${g.fields.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${String(it?.[f.id] ?? '').trim() ? esc(it[f.id]) : `<em>${t('demo.empty')}</em>`}</dd></div>`).join('')}</dl></div>`).join('')).join('');
  return `<dl class="sum">${rows}</dl>${rep}`;
}

// ---------- отрисовка
// Заголовок блока уже говорит «На настоящей подаче», поэтому повтор в начале текста убираем
const realText = (s) => { const x = s.replace(/^На настоящей подаче\s*/, ''); return x.charAt(0).toUpperCase() + x.slice(1); };
const stampTpl = (id) => document.getElementById(id).innerHTML;
function render({ animateStamp = false } = {}) {
  const step = steps.find((s) => s.id === state.current) ?? steps[0];
  const idx = stepIndex(step.id);
  const doneCount = steps.filter((s) => state.done[s.id]).length;
  const isReview = step.id === 'review';
  const tabs = steps.map((s, i) => `<li><button type="button" data-go="${s.id}"${s.id === step.id ? ' aria-current="step"' : ''} class="tab${state.done[s.id] ? ' tab--done' : ''}"><span class="tab__n">${state.done[s.id] ? '✓' : i + 1}</span><span class="tab__t">${esc(s.title)}</span></button></li>`).join('');

  let main;
  if (isReview) {
    const others = steps.filter((s) => s.id !== 'review');
    const ready = others.every((s) => state.done[s.id]);
    main = `<h3>${t('demo.summary')}</h3>
      <ul class="status">${others.map((s) => `<li><span class="dot${state.done[s.id] ? ' dot--ok' : ''}" aria-hidden="true"></span><strong>${esc(s.title)}</strong> — ${state.done[s.id] ? t('demo.status.done') : t('demo.status.todo')} <button type="button" class="link" data-go="${s.id}">${t('demo.summary.open')}</button></li>`).join('')}</ul>
      ${others.map((s) => `<details class="sumbox"><summary>${esc(s.title)}</summary>${summaryHtml(s)}</details>`).join('')}
      <div class="final">${state.finished
        ? `<div class="notice notice--gold"><h3>${t('demo.final.title')}</h3><p lang="ru">${r('demo.final.text')}</p><p><a class="btn" href="../course/">${t('course.start')}</a> <a class="btn btn--ghost" href="../catalog/">${t('nav.catalog')}</a> <a class="btn btn--ghost" href="../essays/checker/">${t('essay.cta.check')}</a></p></div>`
        : `<button type="button" class="btn" data-finish${ready ? '' : ' disabled'}>${t('demo.final')}</button>${ready ? '' : `<p class="hint">${t('demo.final.blocked')} <span lang="ru">${r('demo.final.blocked')}</span></p>`}`}</div>`;
  } else {
    main = `<div class="errbox" data-errbox tabindex="-1" hidden role="alert"></div>
      <form class="form" novalidate onsubmit="return false">${step.sections.map(sectionHtml).join('')}</form>
      <div class="actions">
        <button type="button" class="btn btn--ghost" data-fill>${t('demo.fill')}</button>
        <button type="button" class="btn" data-check>${t('demo.check')}</button>
        ${idx < steps.length - 1 ? `<button type="button" class="btn btn--gold" data-next>${t('demo.next')} →</button>` : ''}
      </div>`;
  }

  const stamp = state.done[step.id] && !isReview ? `<div class="demo-stamp${animateStamp ? ' demo-stamp--in' : ''}" aria-hidden="true">${stampTpl('tpl-stamp-done')}</div>`
    : (isReview && state.finished ? `<div class="demo-stamp demo-stamp--final${animateStamp ? ' demo-stamp--in' : ''}" aria-hidden="true">${stampTpl('tpl-stamp-final')}</div>` : '');

  root.innerHTML = `
    <div class="demo__top">
      <p class="demo__progress"><strong>${doneCount}</strong> / ${steps.length - 1} <span class="saved" data-saved hidden>· ${t('demo.saved')}</span></p>
      <div class="demo__tools"><button type="button" class="btn btn--ghost btn--small" data-fillall>${t('demo.fillall')}</button><button type="button" class="btn btn--ghost btn--small" data-clear>${t('demo.clear')}</button></div>
    </div>
    <div class="demo__layout">
      <nav class="steps" aria-label="${t('demo.steps')}"><ol>${tabs}</ol></nav>
      <section class="panel card" aria-labelledby="step-title" id="panel">
        ${stamp}
        <p class="label panel__kicker">${t('demo.step', { n: idx + 1, total: steps.length })}</p>
        <h2 id="step-title" tabindex="-1">${esc(step.title)}</h2>
        <div class="why notice notice--sky" lang="ru"><strong>${r('demo.why')}.</strong> ${esc(step.why_ru)}</div>
        <div class="real notice notice--gold" lang="ru"><strong>${r('demo.real')}:</strong> ${esc(realText(step.real_ru))}</div>
        ${main}
        <details class="mist"><summary>${t('demo.mistakes')}</summary><ul lang="ru">${step.mistakes_ru.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></details>
      </section>
    </div>`;
  root.hidden = false;
  updateCounts();
}

function go(id, { focus = true } = {}) {
  state.current = id; persist(); render();
  if (focus) { const h = document.getElementById('step-title'); h?.focus({ preventScroll: true }); document.getElementById('panel')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }
}

// ---------- события (делегирование)
root.addEventListener('input', (e) => {
  const el = e.target; if (!el.dataset?.field) return;
  setVal(el.dataset.field, el.value, el.dataset.group, el.dataset.index != null ? Number(el.dataset.index) : undefined);
  if (state.done[state.current]) { state.done[state.current] = false; }  // правка снимает отметку «заполнено»
  persist(); updateCounts();
});
root.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const step = steps.find((s) => s.id === state.current);
  if (b.dataset.go) return go(b.dataset.go);
  if (b.dataset.next) return go(steps[stepIndex(step.id) + 1].id);
  if (b.hasAttribute('data-fill')) { fillSample(step); persist(); return render(); }
  if (b.hasAttribute('data-fillall')) { steps.forEach(fillSample); persist(); return render(); }
  if (b.hasAttribute('data-check')) {
    const errs = validateStep(step); showErrors(step, errs);
    if (!errs.length) { state.done[step.id] = true; persist(); render({ animateStamp: true }); const p = document.getElementById('panel'); if (!reduced) { p.classList.add('shake'); setTimeout(() => p.classList.remove('shake'), 600); } }
    return;
  }
  if (b.dataset.add) { const g = b.dataset.add; (state.repeats[g] ??= [{}]).push({}); persist(); return render(); }
  if (b.dataset.remove) { const [g, i] = b.dataset.remove.split(':'); state.repeats[g].splice(Number(i), 1); persist(); return render(); }
  if (b.hasAttribute('data-finish')) { state.finished = true; persist(); return render({ animateStamp: true }); }
  if (b.hasAttribute('data-clear')) {
    if (!confirm(`${t('demo.clear.confirm')}\n${r('demo.clear.confirm')}`)) return;
    remove(KEY); Object.assign(state, { values: {}, repeats: {}, done: {}, current: steps[0].id, finished: false });
    render(); const live = root.querySelector('.demo__progress'); live.insertAdjacentHTML('beforeend', ` <span class="saved" role="status">${t('demo.cleared')}</span>`);
  }
});

render();
