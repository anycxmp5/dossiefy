// Появление листов, папок и заголовков при скролле.
// Конечный поворот берётся из CSS (читаем до анимации), прозрачность задаём явно:
// в CSS элемент скрыт, поэтому gsap.from() анимировал бы 0 -> 0.

// Разбивает текстовые узлы заголовка на слова (вложенные теги вроде <mark> сохраняются)
function splitWords(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const words = [];
  nodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
      const w = document.createElement('span');
      w.className = 'w';
      const inner = document.createElement('span');
      inner.className = 'w-i';
      inner.textContent = part;
      w.appendChild(inner);
      frag.appendChild(w);
      words.push(inner);
    });
    node.replaceWith(frag);
  });
  return words;
}

export function initFolds() {
  // Кинетическая типографика заголовков
  const heads = gsap.utils.toArray('[data-words]');
  const headWords = new Map(heads.map((h) => [h, splitWords(h)]));
  // Начальное смещение задаём через GSAP, а не CSS: иначе GSAP переведёт CSS-проценты в пиксели
  // и оставит лишний сдвиг после анимации. Класс is-split снимает временное скрытие заголовка.
  heads.forEach((h) => {
    gsap.set(headWords.get(h), { yPercent: 115, rotation: 6 });
    h.classList.add('is-split');
  });
  const showHead = (batch) => {
    batch.forEach((h) => {
      if (h.dataset.shown) return;
      h.dataset.shown = '1';
      gsap.to(headWords.get(h), { yPercent: 0, rotation: 0, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.07 });
    });
  };
  if (heads.length) ScrollTrigger.batch(heads, { start: 'top 90%', onEnter: showHead, onLeave: showHead });

  // Папки и листы
  const items = gsap.utils.toArray('[data-fold]');
  if (!items.length) return;
  const restRotation = new Map(items.map((el) => [el, Number(gsap.getProperty(el, 'rotation')) || 0]));

  const show = (batch) => {
    const fresh = batch.filter((el) => !el.dataset.shown);
    fresh.forEach((el) => { el.dataset.shown = '1'; });
    fresh.forEach((el, i) => {
      const rest = restRotation.get(el);
      gsap.fromTo(el,
        { autoAlpha: 0, y: 70, rotation: rest + (i % 2 ? 9 : -9) },
        { autoAlpha: 1, y: 0, rotation: rest, duration: 0.9, ease: 'back.out(1.6)', delay: i * 0.14 });
    });
  };

  // onLeave нужен на случай, когда пользователь пролистал блок целиком мимо порога входа
  ScrollTrigger.batch(items, { start: 'top 88%', onEnter: show, onLeave: show });
}
