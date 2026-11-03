// Тесты базового анализатора эссе. Запуск: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze, countWords, splitSentences, tokenize } from '../js/essay-check/analyzer.js';

const data = JSON.parse(readFileSync(new URL('../data/cliches.json', import.meta.url), 'utf8'));
const opts = { cliches: data.items, stopwords: data.stopwords_en };

const GOOD = `At 4:15 a.m. my alarm went off, and the garage smelled of cold coffee and solder. I carried the robot to the table and watched it drive straight off the edge. "Again," said Marta, our captain. We rebuilt the sensor mount three times that week. By Friday, the third version finally held the line. The failure was never the sensor; it was the lighting in our school lab. Since then I write down one assumption before every build, and I test it first. Looking back, that habit changed how I work with people too.`;

const WEAK = `Since the dawn of time, humans have wanted to change the world. I have always been passionate about helping people. It is a journey that has taught me the value of hard work. In conclusion, I am a better person.`;

test('countWords считает слова по пробелам', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('  one two\nthree  '), 3);
  assert.equal(countWords("don't stop-me now"), 3);
});

test('tokenize оставляет слова с апострофами и числа', () => {
  assert.deepEqual(tokenize("I don't know 12 things."), ['i', "don't", 'know', '12', 'things']);
});

test('splitSentences не режет по сокращениям', () => {
  const s = splitSentences('We met at 4 a.m. in the U.S. lab. Mr. Lee waved. Then we left!');
  assert.equal(s.length, 3);
});

test('пустой текст не ломает анализатор', () => {
  const r = analyze('', opts);
  assert.equal(r.words, 0);
  assert.equal(r.length.status, 'empty');
  assert.equal(r.cliches.length, 0);
  assert.equal(r.sentences.count, 0);
});

test('длина: короче и длиннее диапазона', () => {
  assert.equal(analyze('word '.repeat(100), opts).length.status, 'short');
  assert.equal(analyze('word '.repeat(300), opts).length.status, 'ok');
  assert.equal(analyze('word '.repeat(700), opts).length.status, 'long');
  assert.equal(analyze('word '.repeat(700), opts).tips[0].code, 'tip.long');
});

test('клише находятся с позицией и подсказкой', () => {
  const r = analyze(WEAK, opts);
  const ids = r.cliches.map((c) => c.id);
  for (const id of ['cl-001', 'cl-010', 'cl-005', 'cl-023', 'cl-015', 'cl-026', 'cl-024']) assert.ok(ids.includes(id), `нет ${id}`);
  assert.ok(r.cliches.every((c) => c.hint_ru && c.end > c.index));
  assert.ok(r.tips.some((t) => t.code === 'tip.cliches'));
});

test('хороший пример не содержит клише и проходит структуру', () => {
  const r = analyze(GOOD, opts);
  assert.equal(r.cliches.length, 0);
  const byId = Object.fromEntries(r.structure.map((s) => [s.id, s.status]));
  assert.equal(byId.scene, 'pass');
  assert.equal(byId.reflection, 'pass');
  assert.equal(byId.voice, 'pass');
  assert.notEqual(byId.details, 'fail');
});

test('слабый текст: начало с клише считается провалом сцены', () => {
  const byId = Object.fromEntries(analyze(WEAK, opts).structure.map((s) => [s.id, s.status]));
  assert.equal(byId.scene, 'fail');
  assert.notEqual(byId.reflection, 'pass'); // в тексте одно «taught me»: этого мало для зачёта
});

test('пассивные конструкции находятся, прилагательные-причастия нет', () => {
  const r = analyze('The robot was built by our team. The report was written last night. I was excited and tired.', opts);
  assert.equal(r.passive.count, 2);
  assert.ok(r.passive.share > 0.5);
});

test('повторы слов и одинаковые начала предложений', () => {
  const text = 'I built robots. I built robots again. I built robots at school. I built robots at home. Robots matter. Robots matter to me. Robots change plans.';
  const r = analyze(text, opts);
  assert.ok(r.repetition.words.some((w) => w.word === 'robots' && w.count >= 4));
  assert.ok(r.repetition.starters.some((s) => s.word === 'i' && s.count === 4));
  assert.ok(r.tips.some((t) => t.code === 'tip.repeat'));
});

test('длинные предложения отмечаются', () => {
  const longSentence = `Word ${'word '.repeat(44)}end.`;
  const r = analyze(`Short one. ${longSentence}`, opts);
  assert.equal(r.sentences.count, 2);
  assert.equal(r.sentences.long.length, 1);
  assert.ok(r.sentences.longest >= 45);
  assert.ok(r.tips.some((t) => t.code === 'tip.sentences'));
});

test('русское клише тоже находится', () => {
  const r = analyze('С детства я мечтал изменить мир.', opts);
  assert.ok(r.cliches.some((c) => c.id === 'cl-ru-01'));
  assert.ok(r.cliches.some((c) => c.id === 'cl-ru-03'));
});

test('результаты детерминированы', () => {
  assert.deepEqual(analyze(GOOD, opts), analyze(GOOD, opts));
});
