import { T, R, en, ru, esc, readJson, rootFor } from '../lib.mjs';

const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
const host = (u) => new URL(u).hostname.replace(/^www\./, '');

function blocks(list) {
  return list.map((b) => {
    if (b.t === 'p') return `<p>${b.text}</p>`;
    if (b.t === 'h') return `<h2>${b.text}</h2>`;
    if (b.t === 'ul') return `<ul>${b.items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
    if (b.t === 'ol') return `<ol>${b.items.map((i) => `<li>${i}</li>`).join('')}</ol>`;
    if (b.t === 'note') return `<aside class="notice notice--sky">${b.text}</aside>`;
    if (b.t === 'table') return `<div class="table-wrap"><table lang="en"><thead><tr>${b.head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    throw new Error(`Неизвестный блок: ${b.t}`);
  }).join('\n          ');
}

export default async function pages() {
  const { lessons } = await readJson('data/essay_lessons.json');
  const prompts = await readJson('data/essay_prompts.json');
  const ex = await readJson('data/essay_examples.json');
  const css = ['css/pages/inner.css', 'css/pages/essays.css'];
  const out = [];

  // ---- Хаб
  {
    const r = '../';
    const promptList = prompts.prompts.map((p) => `        <li class="prompt"><span class="prompt__n" aria-hidden="true">${p.n}</span><div><p class="prompt__text" lang="en">${esc(p.text)}</p><p class="prompt__hint" lang="ru"><strong>${R('es.prompts.hint')}:</strong> ${esc(p.hint_ru)}</p></div></li>`).join('\n');
    const lessonList = lessons.map((l, i) => `        <li><a href="${l.id}/"><span class="lesson-n">${i + 1}</span><span class="lesson-t">${esc(l.title)}<small lang="ru">${esc(l.summary_ru)}</small></span><span class="lesson-m">${fill(T('es.lessons.min'), { n: l.minutes })}</span></a></li>`).join('\n');
    out.push({
      out: 'essays/index.html', id: 'essays', nav: 'essays', css,
      title: T('es.meta.title'), description: R('es.meta.description'),
      body: `    <section class="page-head">
      <h1>${T('es.h1')}</h1>
      <p class="page-head__intro" lang="ru">${R('es.intro')}</p>
      <p class="notice notice--gold" lang="ru"><strong>${R('chk.disclaimer')}</strong> ${R('chk.note.heuristic')}</p>
    </section>
    <section aria-labelledby="pr">
      <h2 id="pr">${fill(T('es.prompts'), { cycle: prompts.cycle })}</h2>
      <p class="src">${fill(T('es.prompts.source'), { date: `<time datetime="${prompts.verified_on}">${prompts.verified_on}</time>` })} · <a href="${esc(prompts.source_url)}" rel="noopener" target="_blank">${esc(host(prompts.source_url))}</a></p>
      <ol class="prompts">
${promptList}
      </ol>
      <div class="card card--sky length"><h3>${T('es.length')}</h3><p><strong>${esc(prompts.length.value)}</strong></p><p lang="ru">${esc(prompts.length.note_ru)}</p><p class="src">${T('es.length.source')}: <a href="${esc(prompts.length.source_url)}" rel="noopener" target="_blank">${esc(host(prompts.length.source_url))}</a> · ${prompts.length.verified_on}</p></div>
    </section>
    <section aria-labelledby="ls"><h2 id="ls">${T('es.lessons')}</h2>
      <ol class="lessons">
${lessonList}
      </ol>
    </section>
    <section class="grid grid--3">
      <div class="card"><h3>${T('es.examples')}</h3><p lang="ru">${R('es.examples.text')}</p><p><a class="btn btn--small" href="examples/">${T('es.examples.cta')}</a></p></div>
      <div class="card"><h3>${T('es.checker')}</h3><p lang="ru">${R('es.checker.text')}</p><p><a class="btn btn--small" href="checker/">${T('es.checker.cta')}</a></p></div>
      <div class="card card--gold"><h3>${T('es.review')}</h3><p lang="ru">${R('es.review.text')}</p><p><a class="btn btn--small btn--ghost" href="${r}review/">${T('es.review.cta')}</a></p></div>
    </section>`,
    });
  }

  // ---- Уроки
  lessons.forEach((l, i) => {
    const o = `essays/${l.id}/index.html`; const r = rootFor(o);
    const prev = lessons[i - 1], next = lessons[i + 1];
    out.push({
      out: o, id: `essay-lesson-${l.id}`, nav: 'essays', css,
      title: fill(T('es.lesson.meta.title'), { title: l.title }), description: l.summary_ru,
      body: `    <article class="lesson">
      <header class="page-head">
        <p class="crumbs"><a href="${r}essays/">${T('es.back')}</a></p>
        <p class="kicker label">${fill(T('es.lesson'), { n: i + 1 })} · ${fill(T('es.lessons.min'), { n: l.minutes })}</p>
        <h1>${esc(l.title)}</h1>
      </header>
      <div class="prose" lang="ru">
          ${blocks(l.body)}
      </div>
      <p class="related"><a class="btn btn--gold" href="${r}essays/checker/">${T('es.checker.cta')}</a> <a class="btn btn--ghost" href="${r}essays/examples/">${T('es.examples.cta')}</a></p>
      <nav class="pager" aria-label="${T('es.lessons')}">
        ${prev ? `<a href="${r}essays/${prev.id}/">← ${T('es.prev')}: ${esc(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a href="${r}essays/${next.id}/">${T('es.next')}: ${esc(next.title)} →</a>` : `<a href="${r}essays/examples/">${T('es.examples')} →</a>`}
      </nav>
    </article>`,
    });
  });

  // ---- Примеры
  {
    const items = ex.examples.map((e) => `      <article class="example" id="${e.id}">
        <h2 lang="en">${esc(e.title)}</h2>
        <p class="example__src" lang="en">${esc(e.university_or_author)}</p>
        <dl class="example__facts">
          <div><dt>${T('ex.why')}</dt><dd lang="ru">${esc(e.why_it_works)}</dd></div>
          <div><dt>${T('ex.structure')}</dt><dd lang="ru">${esc(e.structure_notes)}</dd></div>
          <div><dt>${T('ex.takeaway')}</dt><dd lang="ru">${esc(e.takeaway_ru)}</dd></div>
          <div><dt>${T('ex.length')}</dt><dd lang="ru">${esc(e.length_words)}</dd></div>
        </dl>
        <p class="example__links"><a class="btn btn--small" href="${esc(e.url)}" rel="noopener" target="_blank">${T('ex.read')}</a> <span class="src">${host(e.url)} · ${T('ex.checked')}: <time datetime="${e.link_checked_on}">${e.link_checked_on}</time></span></p>
      </article>`).join('\n');
    out.push({
      out: 'essays/examples/index.html', id: 'essay-examples', nav: 'essays', css,
      title: T('ex.meta.title'), description: R('ex.meta.description'),
      body: `    <section class="page-head">
      <p class="crumbs"><a href="../">${T('es.back')}</a></p>
      <h1>${T('ex.h1')}</h1>
      <p class="notice notice--gold" lang="ru">${esc(ex.note_ru)}</p>
    </section>
    <div class="examples">
${items}
    </div>`,
    });
  }

  // ---- Проверка эссе
  {
    const pick = (d) => Object.fromEntries(Object.entries(d).filter(([k]) => k.startsWith('chk.')));
    const i18n = JSON.stringify({ t: pick(en), r: pick(ru) }).replace(/</g, '\\u003c');
    out.push({
      out: 'essays/checker/index.html', id: 'essay-checker', nav: 'essays', css: [...css, 'css/pages/checker.css'], script: 'js/pages/checker.js',
      title: T('chk.meta.title'), description: R('chk.meta.description'),
      body: `    <section class="page-head">
      <p class="crumbs"><a href="../">${T('es.back')}</a></p>
      <h1>${T('chk.h1')}</h1>
      <p class="page-head__intro" lang="ru">${R('chk.intro')}</p>
      <p class="notice notice--gold" lang="ru"><strong>${R('chk.disclaimer')}</strong></p>
      <p class="notice notice--sky" lang="ru">${R('chk.privacy')}</p>
    </section>
    <section class="checker" data-checker>
      <div class="checker__input">
        <label for="essay" class="label">${T('chk.label')}</label>
        <textarea id="essay" rows="16" spellcheck="true" autocomplete="off" lang="en"></textarea>
        <p class="checker__count" data-counter aria-live="off"></p>
        <div class="checker__actions">
          <button type="button" class="btn" data-run>${T('chk.check')}</button>
          <button type="button" class="btn btn--ghost" data-clear>${T('chk.clear')}</button>
          <label class="keep"><input type="checkbox" data-keep> <span>${T('chk.keep')}</span></label>
        </div>
      </div>
      <div class="report" data-report aria-live="polite" tabindex="-1" hidden></div>
      <noscript><p class="notice notice--warn" lang="ru">${R('chk.nojs')}</p></noscript>
    </section>
    <p class="related"><span class="label">${T('chk.after')}</span> <a class="btn btn--gold btn--small" href="../../review/">${T('es.review.cta')}</a> <a class="btn btn--ghost btn--small" href="../examples/">${T('es.examples.cta')}</a></p>
    <script type="application/json" id="chk-i18n">${i18n}</script>`,
    });
  }
  return out;
}
