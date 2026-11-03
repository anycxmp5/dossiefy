// Прогресс курса: пройденные уроки и отметки чек-листов. Только локально в браузере.
import { load, save, remove } from '../storage.js';

const KEY = 'dossiefy:course:v1';
const state = load(KEY, { done: {}, checks: {} });
const persist = () => save(KEY, state);

// ---- Оглавление: общий прогресс и по модулям
const box = document.querySelector('[data-progress-box]');
if (box) {
  const total = Number(box.dataset.total);
  const text = box.querySelector('[data-progress-text]');
  const bar = box.querySelector('[data-bar-all]');
  const clear = box.querySelector('[data-clear]');
  const render = () => {
    const done = Object.values(state.done).filter(Boolean).length;
    text.textContent = box.dataset.tpl.replace('{done}', done).replace('{total}', total);
    bar.style.width = `${(done / total) * 100}%`;
    clear.hidden = done === 0 && !Object.keys(state.checks).length;
    document.querySelectorAll('.mod').forEach((m) => {
      const ids = m.dataset.lessons.split(' ');
      m.querySelector('[data-bar]').style.width = `${(ids.filter((id) => state.done[id]).length / ids.length) * 100}%`;
    });
  };
  clear.addEventListener('click', () => { state.done = {}; state.checks = {}; remove(KEY); render(); });
  render();
}

// ---- Модуль: отметки у уроков и чек-лист
const modPage = document.querySelector('[data-module-page]');
if (modPage) {
  modPage.querySelectorAll('.lessons li').forEach((li) => {
    const done = !!state.done[li.dataset.lesson];
    li.classList.toggle('is-done', done);
    li.querySelector('[data-done-mark]').hidden = !done;
  });
  modPage.querySelectorAll('[data-check]').forEach((input) => {
    input.checked = !!state.checks[input.dataset.check];
    input.addEventListener('change', () => { state.checks[input.dataset.check] = input.checked; persist(); });
  });
}

// ---- Урок: кнопка «пройден»
const lessonPage = document.querySelector('[data-lesson-page]');
if (lessonPage) {
  const id = lessonPage.dataset.lessonPage;
  const btn = lessonPage.querySelector('[data-mark]');
  const paint = () => {
    const on = !!state.done[id];
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? `✓ ${btn.dataset.on}` : btn.dataset.off;
  };
  btn.addEventListener('click', () => { state.done[id] = !state.done[id]; persist(); paint(); });
  paint();
}
