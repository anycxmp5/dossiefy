// Фильтры каталога. Без JS форма скрыта и показаны все вузы (прогрессивное улучшение).
const form = document.querySelector('[data-filters]');
const items = [...document.querySelectorAll('[data-schools] .school')];
const empty = document.querySelector('[data-empty]');
const count = form?.querySelector('[data-count]');

if (form && items.length) {
  form.hidden = false;
  const apply = () => {
    const f = new FormData(form);
    const q = String(f.get('q') || '').trim().toLowerCase();
    const tests = f.get('tests'), early = f.get('early'), type = f.get('type');
    let shown = 0;
    for (const li of items) {
      const ok = (!q || li.dataset.name.includes(q))
        && (!tests || li.dataset.tests === tests)
        && (!early || li.dataset.early.split(' ').includes(early))
        && (!type || li.dataset.type === type);
      li.hidden = !ok;
      if (ok) shown++;
    }
    empty.hidden = shown > 0;
    count.textContent = count.dataset.tpl.replace('{shown}', shown).replace('{total}', items.length);
  };
  form.addEventListener('input', apply);
  form.addEventListener('reset', () => setTimeout(apply, 0));
  apply();
}
