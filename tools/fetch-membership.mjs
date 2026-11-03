// Забирает с официальных страниц Common App (commonapp.org/explore/<slug>) данные о членстве и расположении вуза
// и сохраняет их в data/membership.json. Запуск: node tools/fetch-membership.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'data/universities');
const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
const today = new Date().toISOString().slice(0, 10);
const out = {};

for (const f of files) {
  const u = JSON.parse(await readFile(join(dir, f), 'utf8'));
  const url = `https://www.commonapp.org/explore/${u.common_app_slug}/`;
  const res = await fetch(`https://www.commonapp.org/page-data/explore/${u.common_app_slug}/page-data.json`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) { console.log('НЕТ', u.id, res.status); out[u.id] = { status: 'needs_verification', source_url: url, verified_on: today }; continue; }
  const s = (await res.json()).result.data.nodeSchool;
  const su = s.relationships?.field_site_update ?? {};
  out[u.id] = {
    first_year_participation: s.field_acc_md_fy_participation === 'Yes',
    membership_year: s.relationships?.field_membership_profile?.field_mp_membership_year ?? null,
    city: su.field_su_addr_city ?? null,
    state: su.field_su_addr_state ?? null,
    region: s.field_acc_region ?? null,
    source_url: url,
    verified_on: today,
    status: s.field_acc_md_fy_participation === 'Yes' ? 'verified' : 'needs_verification',
  };
  console.log(u.id.padEnd(13), JSON.stringify(out[u.id]));
}
await writeFile(join(root, 'data/membership.json'), JSON.stringify(out, null, 2) + '\n');
