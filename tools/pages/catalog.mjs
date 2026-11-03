import { T, R, esc, rootFor } from '../lib.mjs';
import { loadUniversities, FIELD_ORDER, firstRound, needsVerification } from '../data.mjs';

const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

/** Политика тестов для фильтра: выводится из текста значения (см. data/universities/*.json). */
function testTag(u) {
  const v = u.fields.tests.value;
  if (/test-optional/i.test(v)) return 'optional';
  if (/required/i.test(v)) return 'required';
  return 'unknown';
}
const earlyTags = (u) => {
  const rounds = u.fields.deadlines.value.map((d) => d.round).join(' ');
  return [/Early Decision/i.test(rounds) ? 'ed' : '', /Early Action/i.test(rounds) ? 'ea' : ''].filter(Boolean).join(' ');
};
const typeTag = (u) => (/College$/.test(u.name) ? 'college' : 'university');
const host = (url) => new URL(url).hostname.replace(/^www\./, '');

function photo(u, size, r) {
  if (u.image) {
    const file = size === 'sm' ? u.image.file_small : u.image.file;
    return `<img src="${r}${file}" alt="${esc(`Campus view of ${u.name}`)}" loading="${size === 'sm' ? 'lazy' : 'eager'}" decoding="async" width="${size === 'sm' ? 640 : 1200}" height="${size === 'sm' ? 400 : 750}">`;
  }
  // нет свободного фото: типографическая карточка
  return `<div class="typo-card" role="img" aria-label="${esc(u.name)}"><span>${esc(u.name)}</span><small>${esc(u.membership.city)}, ${esc(u.membership.state)}</small></div>`;
}

function card(u, r) {
  const f = firstRound(u);
  const todo = needsVerification(u).length;
  return `      <li class="school" data-tests="${testTag(u)}" data-early="${earlyTags(u)}" data-type="${typeTag(u)}" data-name="${esc(u.name.toLowerCase())}">
        <a class="school__link" href="${u.id}/">
          <span class="school__photo">${photo(u, 'sm', r)}</span>
          <span class="school__body">
            <span class="school__name">${esc(u.name)}</span>
            <span class="school__place">${esc(u.membership.city)}, ${esc(u.membership.state)}</span>
            <span class="chips"><span class="chip chip--${testTag(u)}">${T(`cat.tag.${testTag(u)}`)}</span></span>
            <span class="school__next"><b>${T('cat.card.first')}</b> ${esc(f.round.replace(/ \(.*\)/, ''))}: ${esc(f.date)}</span>
            <span class="school__status${todo ? ' school__status--warn' : ''}">${todo ? fill(T('cat.card.todo'), { n: todo }) : T('cat.card.allok')}</span>
          </span>
        </a>
      </li>`;
}

function filters() {
  const radio = (name, value, label, checked = false) =>
    `<label class="pill"><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''}><span>${label}</span></label>`;
  return `    <form class="filters" data-filters hidden aria-label="${T('cat.filter.label')}" onsubmit="return false">
      <div class="filters__search"><label for="q" class="label">${T('cat.filter.search')}</label><input id="q" type="search" name="q" autocomplete="off"></div>
      <fieldset><legend class="label">${T('cat.filter.tests')}</legend>
        ${radio('tests', '', T('cat.filter.all'), true)}${radio('tests', 'required', T('cat.filter.required'))}${radio('tests', 'optional', T('cat.filter.optional'))}
      </fieldset>
      <fieldset><legend class="label">${T('cat.filter.early')}</legend>
        ${radio('early', '', T('cat.filter.all'), true)}${radio('early', 'ed', T('cat.filter.ed'))}${radio('early', 'ea', T('cat.filter.ea'))}
      </fieldset>
      <fieldset><legend class="label">${T('cat.filter.type')}</legend>
        ${radio('type', '', T('cat.filter.all'), true)}${radio('type', 'university', T('cat.filter.university'))}${radio('type', 'college', T('cat.filter.college'))}
      </fieldset>
      <div class="filters__foot"><p class="filters__count" aria-live="polite" data-count data-tpl="${esc(T('cat.filter.count'))}"></p><button type="reset" class="btn btn--ghost btn--small" data-reset>${T('cat.filter.reset')}</button></div>
    </form>`;
}

function fieldRow(u, key, r) {
  const f = u.fields[key];
  const nv = f.status === 'needs_verification';
  const value = key === 'deadlines'
    ? `<ul class="rounds">${f.value.map((d) => `<li><span class="rounds__name">${esc(d.round)}</span><span class="rounds__date">${esc(d.date)}</span></li>`).join('')}</ul>`
    : `<p class="field__value">${esc(f.value)}</p>`;
  const cycle = f.cycle === 'not stated' ? T('cat.u.cycle.none') : esc(f.cycle);
  return `      <div class="field${nv ? ' field--nv' : ''}" id="${key}">
        <dt class="field__label">${T(`cat.u.${key}`)}${nv ? ` <span class="badge badge--warn">${T('cat.u.nv')}</span>` : ` <span class="badge badge--ok"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5l2.6 2.6L10 3.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>${T('cat.u.ok')}</span>`}</dt>
        <dd class="field__body">
          ${value}
          <p class="field__note" lang="ru">${esc(f.note_ru)}</p>
          <p class="field__meta"><span>${T('cat.u.cycle')}: ${cycle}</span><span>${T('cat.u.checked')}: <time datetime="${f.verified_on}">${f.verified_on}</time></span><span>${T('cat.u.source')}: <a href="${esc(f.source_url)}" rel="noopener" target="_blank">${esc(host(f.source_url))}</a></span></p>
        </dd>
      </div>`;
}

function universityPage(u, i, all) {
  const out = `catalog/${u.id}/index.html`;
  const r = rootFor(out);
  const m = u.membership;
  const prev = all[(i + all.length - 1) % all.length], next = all[(i + 1) % all.length];
  const img = u.image;
  const credit = img
    ? `<p class="photo-credit">${T('cat.u.photo')}: ${esc(img.attribution_text)} · <a href="${esc(img.license_url)}" rel="noopener" target="_blank">${esc(img.license)}</a> · <a href="${esc(img.source_url)}" rel="noopener" target="_blank">Wikimedia Commons</a> · <a href="${r}credits/">${T('footer.credits')}</a></p>`
    : '';
  const anyNv = needsVerification(u).length > 0;
  const body = `    <article class="uni">
      <header class="uni__hero">
        <div class="uni__photo">${photo(u, 'big', r)}</div>
        <div class="uni__head">
          <p class="crumbs"><a href="${r}catalog/">${T('cat.u.back')}</a></p>
          <h1>${esc(u.name)}</h1>
          <p class="uni__place">${esc(m.city)}, ${esc(m.state)} · ${esc(m.region)}</p>
          <p class="chips"><span class="chip chip--ok">${T('cat.u.member')}</span><span class="chip chip--${testTag(u)}">${T(`cat.tag.${testTag(u)}`)}</span></p>
          <p><a class="btn" href="${esc(u.official_admissions_url)}" rel="noopener" target="_blank">${T('cat.u.site')}</a></p>
        </div>
      </header>
      ${credit}
      <aside class="notice notice--gold" lang="ru"><strong>${R('cat.verify')}.</strong> ${R('cat.verify.text')}</aside>
      <section class="uni__summary" aria-labelledby="sum">
        <h2 id="sum" class="sr-only">${T('cat.u.summary').replace(' {date}.', '')}</h2>
        <p><strong>${fill(T('cat.u.summary'), { date: `<time datetime="${u.fields.deadlines.verified_on}">${u.fields.deadlines.verified_on}</time>` })}</strong> <span lang="ru">${R('cat.u.summary.text')}</span></p>
        <p class="uni__member" lang="ru">${fill(R('cat.u.member.note'), { year: m.membership_year })} <a href="${esc(m.source_url)}" rel="noopener" target="_blank">commonapp.org</a></p>
        ${anyNv ? `<p class="notice notice--warn" lang="ru">${R('cat.u.warn')}</p>` : ''}
      </section>
      <dl class="fields">
${FIELD_ORDER.map((k) => fieldRow(u, k, r)).join('\n')}
      </dl>
      <section class="uni__plan">
        <h2>${T('cat.u.plan')}</h2>
        <p lang="ru">${R('cat.u.plan.text')}</p>
        <p><a class="btn btn--gold" href="${r}demo/">${T('cat.u.plan.cta')}</a></p>
      </section>
      <nav class="uni__nav" aria-label="${T('cat.u.back')}">
        <a href="${r}catalog/${prev.id}/">← ${T('cat.u.prev')}: ${esc(prev.name)}</a>
        <a href="${r}catalog/${next.id}/">${T('cat.u.next')}: ${esc(next.name)} →</a>
      </nav>
    </article>`;
  return {
    out, id: `uni-${u.id}`, nav: 'catalog', css: ['css/pages/inner.css', 'css/pages/catalog.css'], body,
    title: fill(T('cat.u.meta.title'), { name: u.name }), description: fill(R('cat.u.meta.description'), { name: u.name }),
  };
}

export default async function pages() {
  const all = await loadUniversities();
  const r = '../';
  const body = `    <section class="page-head">
      <h1>${T('cat.h1')}</h1>
      <p class="page-head__intro" lang="ru">${R('cat.intro')}</p>
      <aside class="notice notice--gold" lang="ru"><strong>${R('cat.verify')}.</strong> ${R('cat.verify.text')}</aside>
    </section>
    <section class="catalog" aria-label="${T('cat.h1')}">
${filters()}
      <ul class="schools" data-schools>
${all.map((u) => card(u, r)).join('\n')}
      </ul>
      <p class="schools__empty" data-empty hidden>${T('cat.filter.none')}</p>
    </section>`;
  return [
    { out: 'catalog/index.html', id: 'catalog', nav: 'catalog', css: ['css/pages/inner.css', 'css/pages/catalog.css'], script: 'js/pages/catalog.js', body,
      title: T('cat.meta.title'), description: R('cat.meta.description') },
    ...all.map((u, i) => universityPage(u, i, all)),
  ];
}
