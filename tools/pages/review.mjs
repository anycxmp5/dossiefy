import { T, R, esc, settings } from '../lib.mjs';

// Страница платной проверки. Блок «Как проходит проверка» (disclosure_text из data/settings.json) стоит в основном потоке,
// это обычный видимый блок: без выделения особым цветом, но и без сворачивания.
export default async function pages() {
  const rs = settings.review_service;
  const value = (v) => (v ? esc(v) : `${T('rv.details')} <span class="sr-only"> — </span><span lang="ru" class="fact__ru">${R('rv.details')}</span>`);
  const body = `    <section class="page-head">
      <h1>${T('rv.h1')}</h1>
      <p class="page-head__intro" lang="ru">${R('rv.lead')}</p>
    </section>
    <section class="prose" aria-labelledby="what">
      <h2 id="what">${T('rv.what.title')}</h2>
      <p lang="ru">${R('rv.what.text')}</p>
    </section>
    <section class="prose how" aria-labelledby="how">
      <h2 id="how">${T('rv.how.title')}</h2>
      <p lang="ru">${esc(rs.disclosure_text)}.</p>
    </section>
    <section aria-labelledby="facts">
      <h2 id="facts" class="sr-only">${T('rv.facts.price')}, ${T('rv.facts.turnaround')}</h2>
      <dl class="facts">
        <div><dt>${T('rv.facts.price')}</dt><dd>${value(rs.price)}</dd></div>
        <div><dt>${T('rv.facts.turnaround')}</dt><dd>${value(rs.turnaround)}</dd></div>
        <div><dt>${T('rv.facts.where')}</dt><dd>${T('rv.facts.where.value')}</dd></div>
      </dl>
    </section>
    <section class="prose" aria-labelledby="steps">
      <h2 id="steps">${T('rv.steps.title')}</h2>
      <ol lang="ru"><li>${R('rv.step1')}</li><li>${R('rv.step2')}</li><li>${R('rv.step3')}</li></ol>
      <p><a class="btn" href="${esc(settings.telegram_url)}" rel="noopener" target="_blank">${T('rv.cta')}</a></p>
      <p class="hint" lang="ru">${R('rv.cta.note')}</p>
    </section>
    <section class="grid grid--2">
      <div class="card card--gold"><h2>${T('rv.privacy.title')}</h2><p lang="ru">${R('rv.privacy.text')}</p><p><a href="../privacy/">${T('footer.privacy')}</a></p></div>
      <div class="card"><h2>${T('rv.noguarantee.title')}</h2><p lang="ru">${R('rv.noguarantee.text')}</p></div>
    </section>
    <section class="card card--sky free"><h2>${T('rv.free.title')}</h2><p lang="ru">${R('rv.free.text')}</p><p><a class="btn btn--ghost btn--small" href="../essays/checker/">${T('rv.free.cta')}</a></p></section>`;
  return [{
    out: 'review/index.html', id: 'review', nav: 'review', css: ['css/pages/inner.css', 'css/pages/static.css'], body,
    title: T('rv.meta.title'), description: R('rv.meta.description'),
  }];
}
