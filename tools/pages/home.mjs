import { T, R, en, ru, esc, readJson, readText, render } from '../lib.mjs';
import { loadUniversities, firstRound } from '../data.mjs';
import { stampSvg } from '../stamp.mjs';

// Заголовок hero: буквы разбиваются при сборке, анимация идёт на чистом CSS (виден сразу, без ожидания JS)
function heroTitleLines() {
  let i = 0;
  const line = (text, extra = '') =>
    `<span class="line${extra}" aria-hidden="true">${[...text].map((c) => `<span class="char" style="--i:${i++}">${c}</span>`).join('')}</span>`;
  return line(T('hero.title.line1')) + line(T('hero.title.line2'), ' line--mark');
}

export default async function pages() {
  const steps = (await readJson('data/process.json')).steps;
  const processSteps = steps.map((s) => `          <li class="step" data-step id="step-${s.id}">
            <span class="step__num" aria-hidden="true">${s.num}</span>
            <h3 class="step__title">${en[s.title_key]}</h3>
            <p class="step__text" lang="ru">${ru[s.text_key]}</p>
            <a class="step__link" href="course/${s.id}/">${T('home.step.open')} <span aria-hidden="true">→</span></a>
          </li>`).join('\n');

  const unis = await loadUniversities();
  const featured = ['harvard', 'duke', 'northwestern'].map((id) => unis.find((u) => u.id === id));
  const mods = ['a', 'b', 'c'];
  const catalogPreview = featured.map((u, i) => {
    const r = firstRound(u);
    return `        <a class="mini-folder mini-folder--${mods[i]}" href="catalog/${u.id}/" data-fold>
          <span class="mini-folder__name">${esc(u.name)}</span>
          <span class="mini-folder__meta">${esc(u.membership.city)}, ${esc(u.membership.state)}</span>
          <span class="mini-folder__next"><b>${T('catalog.preview.next')}</b> ${esc(r.round.replace(/ \(.*\)/, ''))}: ${esc(r.date)}</span>
        </a>`;
  }).join('\n');

  const body = render(await readText('templates/home.html'), {
    root: '',
    heroTitleLines: heroTitleLines(),
    stampMarkup: stampSvg(T('hero.stamp'), T('hero.stamp.sub')),
    processSteps,
    catalogPreview,
  });

  return [{
    out: 'index.html', id: 'home', bodyClass: 'page-home', nav: null, motion: true, script: 'js/main.js',
    title: T('site.title'), description: R('site.description'), ogTitle: T('og.title'), ogDescription: T('og.description'),
    css: ['css/pages/home.css'], body,
  }];
}
