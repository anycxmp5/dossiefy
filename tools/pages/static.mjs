import { T, R, esc, readJson, rootFor } from '../lib.mjs';
import { loadUniversities } from '../data.mjs';

const css = ['css/pages/inner.css', 'css/pages/static.css'];
const host = (u) => new URL(u).hostname.replace(/^www\./, '');

// Шрифты и библиотеки: лицензии и авторы (подробности в vendor/VERSIONS.md)
const FONTS = [
  ['Alfa Slab One', 'JM Solé', 'SIL Open Font License 1.1', 'https://fonts.google.com/specimen/Alfa+Slab+One'],
  ['Barlow Condensed', 'Jeremy Tribby', 'SIL Open Font License 1.1', 'https://fonts.google.com/specimen/Barlow+Condensed'],
  ['Source Sans 3', 'Paul D. Hunt, Adobe', 'SIL Open Font License 1.1', 'https://fonts.google.com/specimen/Source+Sans+3'],
  ['Bitter', 'Sol Matas (Huerta Tipográfica)', 'SIL Open Font License 1.1', 'https://fonts.google.com/specimen/Bitter'],
  ['Roboto Condensed', 'Christian Robertson', 'SIL Open Font License 1.1', 'https://fonts.google.com/specimen/Roboto+Condensed'],
];
const LIBS = [
  ['GSAP 3.12.5 + ScrollTrigger', 'GreenSock', 'GSAP Standard License', 'https://gsap.com/standard-license'],
  ['Lenis 1.1.18', 'Darkroom Engineering', 'MIT License', 'https://github.com/darkroomengineering/lenis'],
];

export default async function pages() {
  const out = [];

  // ---- Privacy
  out.push({
    out: 'privacy/index.html', id: 'privacy', nav: null, css,
    title: T('pv.meta.title'), description: R('pv.meta.description'),
    body: `    <article class="prose">
      <h1>${T('pv.h1')}</h1>
      <p lang="ru">${R('pv.p1')}</p>
      <h2>${T('pv.store.title')}</h2>
      <p lang="ru">${R('pv.p2')}</p>
      <h3>${T('pv.keys')}</h3>
      <ul lang="ru"><li><code>${esc(R('pv.k.course').split(':')[0])}</code>${esc(R('pv.k.course').slice(R('pv.k.course').indexOf(':')))}</li><li><code>${esc(R('pv.k.demo').split(':')[0])}</code>${esc(R('pv.k.demo').slice(R('pv.k.demo').indexOf(':')))}</li><li><code>${esc(R('pv.k.essay').split(':')[0])}</code>${esc(R('pv.k.essay').slice(R('pv.k.essay').indexOf(':')))}</li></ul>
      <h2>${T('pv.delete.title')}</h2>
      <p lang="ru">${R('pv.delete.text')}</p>
      <p lang="ru">${R('pv.p3')}</p>
      <p lang="ru">${R('pv.p4')}</p>
      <p lang="ru">${R('pv.p5')}</p>
      <p lang="ru">${R('pv.p6')}</p>
      <p lang="ru">${R('pv.p7')}</p>
    </article>`,
  });

  // ---- About / Disclaimer
  out.push({
    out: 'about/index.html', id: 'about', nav: null, css,
    title: T('ab.meta.title'), description: R('ab.meta.description'),
    body: `    <article class="prose">
      <h1>${T('ab.h1')}</h1>
      <h2>${T('ab.what.title')}</h2>
      <p lang="ru">${R('ab.what.text')}</p>
      <h2>${T('ab.disc.title')}</h2>
      <p class="notice notice--gold" lang="ru"><strong>${R('footer.disclaimer')}</strong></p>
      <p lang="ru">${R('ab.disc.extra')}</p>
      <h2>${T('ab.method.title')}</h2>
      <ol lang="ru"><li>${R('ab.m1')}</li><li>${R('ab.m2')}</li><li>${R('ab.m3')}</li><li>${R('ab.m4')}</li><li>${R('ab.m5')}</li></ol>
      <h2>${T('ab.links')}</h2>
      <p><a href="../catalog/">${T('nav.catalog')}</a> · <a href="../privacy/">${T('footer.privacy')}</a> · <a href="../credits/">${T('footer.credits')}</a> · <a href="../review/">${T('nav.review')}</a></p>
    </article>`,
  });

  // ---- Credits: генерируется из data/images.json
  {
    const { images } = await readJson('data/images.json');
    const unis = await loadUniversities();
    const names = Object.fromEntries(unis.map((u) => [u.id, u.name]));
    const rows = images.map((i) => {
      const title = i.original_title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '');
      return `        <tr><th scope="row">${esc(names[i.university_id] ?? i.university_id)}</th><td>“${esc(title)}”<br><span class="muted">${T('cr.author')}: ${esc(i.author)}</span></td><td><a href="${esc(i.license_url)}" rel="noopener" target="_blank">${esc(i.license)}</a></td><td><a href="${esc(i.source_url)}" rel="noopener" target="_blank">Wikimedia Commons</a></td></tr>`;
    }).join('\n');
    const list = (items) => items.map(([n, a, l, u]) => `        <li><strong>${esc(n)}</strong> — ${esc(a)} · <a href="${esc(u)}" rel="noopener" target="_blank">${esc(l)}</a></li>`).join('\n');
    out.push({
      out: 'credits/index.html', id: 'credits', nav: null, css,
      title: T('cr.meta.title'), description: R('cr.meta.description'),
      body: `    <article class="prose wide">
      <h1>${T('cr.h1')}</h1>
      <p lang="ru">${R('cr.intro')}</p>
      <p class="notice notice--sky" lang="ru">${R('cr.share')}</p>
      <h2>${T('cr.photos')}</h2>
      <div class="table-wrap"><table>
        <thead><tr><th scope="col">${T('cr.for')}</th><th scope="col">${T('cr.photos')}</th><th scope="col">${T('cr.license')}</th><th scope="col">${T('cr.source')}</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table></div>
      <p class="muted">${T('cr.changes')}: ${esc(images[0].changes_note)}</p>
      <h2>${T('cr.fonts')}</h2>
      <ul>
${list(FONTS)}
      </ul>
      <h2>${T('cr.libs')}</h2>
      <ul>
${list(LIBS)}
      </ul>
      <h2>${T('cr.own')}</h2>
      <p lang="ru">${R('cr.own.text')}</p>
    </article>`,
    });
  }

  // ---- 404 (ссылки абсолютные от корня сайта: страницу отдают по любому несуществующему адресу)
  out.push({
    out: '404.html', id: 'not-found', nav: null, css, rootOverride: '/',
    title: T('nf.meta.title'), description: R('nf.meta.description'),
    body: `    <section class="page-head">
      <h1>${T('nf.h1')}</h1>
      <p class="page-head__intro" lang="ru">${R('nf.text')}</p>
      <p class="links404"><a class="btn" href="/">${T('nf.home')}</a> <a class="btn btn--ghost" href="/course/">${T('nav.course')}</a> <a class="btn btn--ghost" href="/catalog/">${T('nav.catalog')}</a> <a class="btn btn--ghost" href="/demo/">${T('nav.demo')}</a> <a class="btn btn--ghost" href="/essays/">${T('nav.essays')}</a></p>
    </section>`,
  });
  return out;
}
