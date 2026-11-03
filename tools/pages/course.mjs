import { T, R, esc, rootFor, readJson } from '../lib.mjs';

const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

// Куда вести ссылки «По теме» из каждого модуля
const RELATED = {
  universities: [['catalog/', 'course.related.catalog']],
  deadlines: [['catalog/', 'course.related.catalog']],
  exams: [['catalog/', 'course.related.catalog']],
  documents: [['demo/', 'course.related.demo']],
  essays: [['essays/', 'course.related.essays'], ['demo/', 'course.related.demo']],
  'money-visa': [['catalog/', 'course.related.catalog']],
};

function blocks(list) {
  return list.map((b) => {
    if (b.t === 'p') return `<p>${b.text}</p>`;
    if (b.t === 'h') return `<h2>${b.text}</h2>`;
    if (b.t === 'ul') return `<ul>${b.items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
    if (b.t === 'ol') return `<ol>${b.items.map((i) => `<li>${i}</li>`).join('')}</ol>`;
    if (b.t === 'note') return `<aside class="notice notice--sky">${b.text}</aside>`;
    throw new Error(`Неизвестный блок урока: ${b.t}`);
  }).join('\n          ');
}

export default async function pages() {
  const { modules } = await readJson('data/course.json');
  const total = modules.reduce((n, m) => n + m.lessons.length, 0);
  const css = ['css/pages/inner.css', 'css/pages/course.css'];
  const out = [];

  // ---- Оглавление курса
  {
    const r = '../';
    const cards = modules.map((m) => `      <li class="mod" data-module="${m.id}" data-lessons="${m.lessons.map((l) => `${m.id}/${l.id}`).join(' ')}">
        <a class="mod__link" href="${m.id}/">
          <span class="mod__num" aria-hidden="true">${m.num}</span>
          <span class="mod__title">${esc(m.title)}</span>
          <span class="mod__intro" lang="ru">${esc(m.intro_ru.split('. ')[0])}.</span>
          <span class="mod__meta">${fill(T('course.lessons.count'), { n: m.lessons.length })}</span>
          <span class="bar" aria-hidden="true"><i data-bar></i></span>
          <span class="mod__open">${T('course.open')} <span aria-hidden="true">→</span></span>
        </a>
      </li>`).join('\n');
    out.push({
      out: 'course/index.html', id: 'course', nav: 'course', css, script: 'js/pages/course.js',
      title: T('course.meta.title'), description: R('course.meta.description'),
      body: `    <section class="page-head">
      <h1>${T('course.h1')}</h1>
      <p class="page-head__intro" lang="ru">${R('course.intro')}</p>
      <p><a class="btn" href="${modules[0].id}/${modules[0].lessons[0].id}/">${T('course.start')}</a></p>
    </section>
    <section class="progress card card--sky" data-progress-box data-total="${total}" data-tpl="${esc(T('course.progress'))}">
      <p class="progress__text" data-progress-text aria-live="polite">${fill(T('course.progress'), { done: 0, total })}</p>
      <span class="bar bar--big" aria-hidden="true"><i data-bar-all></i></span>
      <p class="progress__note" lang="ru">${R('course.progress.note')}</p>
      <button type="button" class="btn btn--ghost btn--small" data-clear hidden>${T('course.progress.clear')}</button>
    </section>
    <ol class="mods">
${cards}
    </ol>`,
    });
  }

  modules.forEach((m, mi) => {
    const prev = modules[mi - 1], next = modules[mi + 1];
    // ---- Страница модуля
    {
      const o = `course/${m.id}/index.html`; const r = rootFor(o);
      const lessons = m.lessons.map((l, li) => `        <li data-lesson="${m.id}/${l.id}"><a href="${l.id}/"><span class="lesson-n">${m.num.replace(/^0/, '')}.${li + 1}</span><span class="lesson-t">${esc(l.title)}</span><span class="lesson-m">${fill(T('course.minutes'), { n: l.minutes })}</span><span class="lesson-done" data-done-mark hidden>${T('course.done.on')}</span></a></li>`).join('\n');
      const terms = m.terms.map((t) => `        <div><dt>${esc(t.term)}</dt><dd lang="ru">${esc(t.ru)}</dd></div>`).join('\n');
      const checks = m.checklist.map((c, i) => `        <li><label><input type="checkbox" data-check="${m.id}:${i}"><span lang="ru">${esc(c)}</span></label></li>`).join('\n');
      const mistakes = m.mistakes.map((c) => `        <li lang="ru">${esc(c)}</li>`).join('\n');
      const related = (RELATED[m.id] ?? []).map(([href, key]) => `<a class="btn btn--ghost btn--small" href="${r}${href}">${T(key)}</a>`).join(' ');
      out.push({
        out: o, id: `course-${m.id}`, nav: 'course', css, script: 'js/pages/course.js',
        title: fill(T('course.module.meta.title'), { n: m.num.replace(/^0/, ''), title: m.title }),
        description: m.intro_ru,
        body: `    <article class="module" data-module-page="${m.id}">
      <header class="page-head">
        <p class="crumbs"><a href="${r}course/">${T('course.all')}</a></p>
        <p class="kicker label">${fill(T('course.module'), { n: m.num })}</p>
        <h1>${esc(m.title)}</h1>
        <p class="page-head__intro" lang="ru">${esc(m.intro_ru)}</p>
      </header>
      <section aria-labelledby="l"><h2 id="l">${T('course.lessons')}</h2>
      <ol class="lessons">
${lessons}
      </ol></section>
      <section aria-labelledby="t"><h2 id="t">${T('course.terms')}</h2>
      <dl class="terms">
${terms}
      </dl></section>
      <section class="card card--sky" aria-labelledby="c"><h2 id="c">${T('course.checklist')}</h2>
      <p class="hint" lang="ru">${R('course.checklist.hint')}</p>
      <ul class="checks">
${checks}
      </ul></section>
      <section class="card" aria-labelledby="m"><h2 id="m">${T('course.mistakes')}</h2>
      <ul class="mistakes">
${mistakes}
      </ul></section>
      ${related ? `<p class="related"><span class="label">${T('course.related')}:</span> ${related}</p>` : ''}
      <nav class="pager" aria-label="${T('course.all')}">
        ${prev ? `<a href="${r}course/${prev.id}/">← ${T('course.prev.module')}: ${esc(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a href="${r}course/${next.id}/">${T('course.next.module')}: ${esc(next.title)} →</a>` : `<a href="${r}demo/">${T('cat.u.plan.cta')} →</a>`}
      </nav>
    </article>`,
      });
    }
    // ---- Страницы уроков
    m.lessons.forEach((l, li) => {
      const o = `course/${m.id}/${l.id}/index.html`; const r = rootFor(o);
      const prevL = m.lessons[li - 1] ? { href: `${r}course/${m.id}/${m.lessons[li - 1].id}/`, title: m.lessons[li - 1].title }
        : (prev ? { href: `${r}course/${prev.id}/${prev.lessons.at(-1).id}/`, title: prev.lessons.at(-1).title } : null);
      const nextL = m.lessons[li + 1] ? { href: `${r}course/${m.id}/${m.lessons[li + 1].id}/`, title: m.lessons[li + 1].title }
        : (next ? { href: `${r}course/${next.id}/${next.lessons[0].id}/`, title: next.lessons[0].title } : null);
      const label = fill(T('course.lesson'), { m: m.num.replace(/^0/, ''), l: li + 1 });
      out.push({
        out: o, id: `lesson-${m.id}-${l.id}`, nav: 'course', css, script: 'js/pages/course.js',
        title: fill(T('course.lesson.meta.title'), { lesson: l.title, title: m.title }),
        description: m.intro_ru,
        body: `    <article class="lesson" data-lesson-page="${m.id}/${l.id}">
      <header class="page-head">
        <p class="crumbs"><a href="${r}course/${m.id}/">${esc(m.title)}</a></p>
        <p class="kicker label">${label} · ${fill(T('course.minutes'), { n: l.minutes })}</p>
        <h1>${esc(l.title)}</h1>
      </header>
      <div class="prose" lang="ru">
          ${blocks(l.body)}
      </div>
      <p class="lesson__done"><button type="button" class="btn btn--gold" data-mark aria-pressed="false" data-on="${esc(T('course.done.on'))}" data-off="${esc(T('course.done'))}">${T('course.done')}</button></p>
      <nav class="pager" aria-label="${esc(m.title)}">
        ${prevL ? `<a href="${prevL.href}">← ${T('course.prev.lesson')}: ${esc(prevL.title)}</a>` : '<span></span>'}
        ${nextL ? `<a href="${nextL.href}">${T('course.next.lesson')}: ${esc(nextL.title)} →</a>` : `<a href="${r}course/${m.id}/">${T('course.back')} →</a>`}
      </nav>
    </article>`,
      });
    });
  });
  return out;
}
