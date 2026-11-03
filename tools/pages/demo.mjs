import { T, R, en, ru, esc, readJson } from '../lib.mjs';
import { stampSvg } from '../stamp.mjs';

const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

function countFields(step) {
  return step.sections.reduce((n, s) => n + (s.fields?.length ?? 0) + (s.repeat ? s.repeat.fields.length : 0), 0);
}

export default async function pages() {
  const { steps } = await readJson('data/demo_steps.json');
  // Строки интерфейса для скрипта: только ключи demo.* (оба языка), без лишнего
  const EXTRA = ['course.start', 'nav.catalog', 'essay.cta.check']; // ключи, нужные на финальном экране
  const pick = (d) => Object.fromEntries(Object.entries(d).filter(([k]) => k.startsWith('demo.') || EXTRA.includes(k)));
  const i18n = JSON.stringify({ t: pick(en), r: pick(ru) }).replace(/</g, '\\u003c');

  const overview = steps.map((s, i) => `        <li><span class="ov__n" aria-hidden="true">${i + 1}</span><span class="ov__t">${esc(s.title)}</span><span class="ov__c">${fill(T('demo.overview.fields'), { n: countFields(s) || '—' })}</span></li>`).join('\n');

  const body = `    <section class="page-head">
      <h1>${T('demo.h1')}</h1>
      <p class="page-head__intro" lang="ru">${R('demo.intro')}</p>
      <aside class="notice notice--gold" lang="ru"><strong>${R('demo.disclaimer')}</strong></aside>
      <aside class="notice notice--sky" lang="ru">${R('demo.privacy')}</aside>
    </section>
    <section aria-labelledby="ov"><h2 id="ov">${T('demo.overview')}</h2>
      <ol class="overview">
${overview}
      </ol>
      <noscript><p class="notice notice--warn" lang="ru">${R('demo.nojs')}</p></noscript>
    </section>
    <section id="demo-app" class="demo" data-demo hidden aria-label="${T('demo.h1')}"></section>
    <script type="application/json" id="demo-i18n">${i18n}</script>
    <template id="tpl-stamp-done">${stampSvg(T('demo.stamp.done'), T('demo.stamp.done.sub'), 21)}</template>
    <template id="tpl-stamp-final">${stampSvg(T('demo.stamp.final'), T('demo.stamp.final.sub'), 31)}</template>`;

  return [{
    out: 'demo/index.html', id: 'demo', nav: 'demo', css: ['css/pages/inner.css', 'css/pages/demo.css'], script: 'js/pages/demo.js', body,
    title: T('demo.meta.title'), description: R('demo.meta.description'),
  }];
}
