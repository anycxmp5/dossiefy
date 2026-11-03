// Ищет на Wikimedia Commons кандидатов-фото для вуза и печатает лицензию и автора.
// Допускаются только CC0, CC BY, CC BY-SA, Public domain. Запуск: node tools/find-images.mjs "<запрос>" [...ещё запросы]
const ALLOWED = /^(cc0|cc by(?!-nc)(?!-nd)|cc-by(?!-nc)(?!-nd)|cc by-sa|cc-by-sa|public domain|pd)/i;
const queries = process.argv.slice(2);
const api = 'https://commons.wikimedia.org/w/api.php';

for (const q of queries) {
  await new Promise((r) => setTimeout(r, 2500)); // пауза: API Commons ограничивает частоту запросов
  const params = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '14',
    prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiextmetadatafilter: 'LicenseShortName|Artist|LicenseUrl|ImageDescription', iiurlwidth: '640',
  });
  const res = await fetch(`${api}?${params}`, { headers: { 'User-Agent': 'DossiefyBuild/1.0 (educational project; image license check)' } });
  const j = await res.json();
  const pages = Object.values(j.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  console.log(`\n=== ${q}`);
  for (const p of pages) {
    const ii = p.imageinfo?.[0]; if (!ii) continue;
    const m = ii.extmetadata ?? {};
    const lic = m.LicenseShortName?.value ?? '';
    const ok = ALLOWED.test(lic) && ii.width >= 1600;
    if (!ok) continue;
    const artist = (m.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim().slice(0, 50);
    console.log(`${p.title} | ${ii.width}x${ii.height} | ${lic} | ${artist}`);
  }
}
