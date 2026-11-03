// Рекламные блоки с ссылками на учебные сайты SAT Boot Camp и IELTS Boot Camp (данные в data/promos.json).
import { T, R, esc, readJson } from './lib.mjs';

export const promos = (await readJson('data/promos.json')).items;

const card = (p, fold) => `      <a class="promo__card promo__card--${p.tone}" href="${esc(p.url)}" target="_blank" rel="noopener"${fold ? ' data-fold' : ''}>
        <span class="promo__badge" aria-hidden="true">${esc(p.badge)}</span>
        <span class="promo__name">${esc(p.name)}</span>
        <span class="promo__headline">${esc(p.headline)}</span>
        <span class="promo__text" lang="ru">${esc(p.text_ru)}</span>
        <span class="promo__cta">${esc(p.cta)} <span aria-hidden="true">↗</span><span class="sr-only"> (${T('promo.newtab')})</span></span>
      </a>`;

/**
 * Рекламный блок.
 * ids: какие сайты показывать; variant 'home' — крупный блок с анимацией, 'inline' — компактный внутри курса.
 */
export function promoHtml(ids = ['sat', 'ielts'], variant = 'inline') {
  const items = ids.map((id) => promos.find((p) => p.id === id)).filter(Boolean);
  const home = variant === 'home';
  return `    <section class="promo promo--${variant}" aria-labelledby="promo-title-${variant}">
      <p class="label promo__kicker">${T('promo.kicker')}</p>
      <h2 id="promo-title-${variant}" class="promo__title"${home ? ' data-words' : ''}>${home ? T('promo.title') : T('promo.title.plain')}</h2>
      <p class="promo__lead" lang="ru">${R(items.length === 1 ? 'promo.text.one' : 'promo.text')}</p>
      <div class="promo__grid promo__grid--${items.length}">
${items.map((p) => card(p, home)).join('\n')}
      </div>
      <p class="promo__note" lang="ru">${items.length === 1 ? esc(items[0].note_ru) : R('promo.note')}</p>
    </section>`;
}
