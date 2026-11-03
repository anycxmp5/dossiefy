// Базовая автоматическая проверка эссе. Работает целиком в браузере (и в Node для тестов), без ИИ и без сети.
// Это набор простых правил и эвристик. Он не заменяет человеческую оценку и может ошибаться.

export const DEFAULTS = { minWords: 250, maxWords: 650 };

const PAST_VERBS = /\b(was|were|had|went|came|saw|ran|took|felt|heard|stood|sat|walked|said|asked|looked|opened|carried|laughed|started|stopped|woke|found|turned|picked|wrote|read|built|made|held|left|knew|got|put|held|watched|waited|pulled|pushed|tried|called)\b|\b\w{3,}ed\b/gi;
const TIME_WORDS = /\b(a\.m\.|p\.m\.|am|pm|morning|midnight|noon|afternoon|evening|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday|summer|winter|spring|autumn|fall|yesterday|o'clock)\b/i;
const REFLECTION = /\b(realized|realised|learned|understood|now i|looking back|taught me|changed (how|the way)|i began to|i started to|i no longer|i now|since then|today i|made me (see|think|realize)|what i (learned|understood)|i came to)\b/gi;
const SENSORY = /\b(smell(ed|s)?|taste(d|s)?|sound(ed|s)?|loud|quiet|bright|dark|warm|cold|hot|rough|smooth|sticky|bitter|sweet|salty|cracked|humming|buzzing|whisper(ed)?|echo(ed)?|dust(y)?|rust(y)?|glow(ed|ing)?)\b/gi;
const FIRST_PERSON = /\b(i|my|me|we|our|mine|myself|i'm|i've|i'd|i'll)\b/i;
const BE = '(?:am|is|are|was|were|be|been|being)';
const IRREGULAR = 'known|made|done|given|taken|seen|written|chosen|found|built|told|shown|set|put|read|held|left|brought|caught|taught|bought|sold|sent|spent|lost|won|kept|heard|born|driven|broken|spoken|stolen|grown|drawn|worn|torn|hidden|forgotten|begun';
const NOT_PASSIVE = new Set(['excited', 'tired', 'worried', 'scared', 'surprised', 'interested', 'bored', 'confused', 'pleased', 'amazed', 'thrilled', 'determined', 'motivated', 'inspired', 'concerned', 'prepared', 'used', 'supposed', 'allowed', 'embarrassed', 'frightened', 'exhausted', 'disappointed', 'satisfied', 'married', 'excited']);
const PASSIVE_RE = new RegExp(`\\b${BE}\\s+(?:(?:not|never|also|always|often|still|just|really|very|\\w+ly)\\s+)?(\\w+ed|${IRREGULAR})\\b`, 'gi');

/** Число слов: так же, как считают поля ввода, по пробельным разделителям. */
export const countWords = (text) => (String(text ?? '').trim().match(/\S+/g) || []).length;

/** Слова в нижнем регистре для частотного анализа. */
export const tokenize = (text) => (String(text ?? '').toLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) || []);

/** Разбивка на предложения. Сокращения вроде «a.m.», «Mr.», «U.S.» не считаются концом. */
export function splitSentences(text) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return [];
  const protectedText = t.replace(/\b(Mr|Mrs|Ms|Dr|St|vs|etc|a\.m|p\.m|U\.S|e\.g|i\.e)\./gi, (m) => m.replace(/\./g, '\u0000'));
  return protectedText
    .split(/(?<=[.!?…]["”’)]?)\s+(?=["“‘(]?[\p{Lu}\p{N}])/u)
    .map((s) => s.replace(/\u0000/g, '.').trim())
    .filter(Boolean);
}

function findCliches(text, items) {
  const found = [];
  for (const c of items) {
    let re; try { re = new RegExp(c.pattern, 'giu'); } catch { continue; }
    let m;
    while ((m = re.exec(text)) && m[0].length) {
      found.push({ id: c.id, text: m[0], index: m.index, end: m.index + m[0].length, category: c.category, hint_ru: c.hint_ru });
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

function repetition(text, stopwords, wordCount) {
  const stop = new Set(stopwords);
  const counts = new Map();
  for (const w of tokenize(text)) if (w.length >= 4 && !stop.has(w)) counts.set(w, (counts.get(w) || 0) + 1);
  const threshold = Math.max(4, Math.ceil(wordCount * 0.012));
  const words = [...counts].filter(([, n]) => n >= threshold).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([word, count]) => ({ word, count }));
  return words;
}

function starters(sentences) {
  const counts = new Map();
  for (const s of sentences) {
    const w = (s.match(/[\p{L}']+/u) || [''])[0].toLowerCase();
    if (w) counts.set(w, (counts.get(w) || 0) + 1);
  }
  const threshold = Math.max(4, Math.ceil(sentences.length * 0.25));
  return [...counts].filter(([, n]) => n >= threshold).sort((a, b) => b[1] - a[1]).map(([word, count]) => ({ word, count }));
}

function passiveInfo(sentences) {
  let count = 0; const examples = [];
  for (const s of sentences) {
    PASSIVE_RE.lastIndex = 0;
    let m, hit = false;
    while ((m = PASSIVE_RE.exec(s))) {
      if (NOT_PASSIVE.has(m[1].toLowerCase())) continue;
      count++; hit = true;
    }
    if (hit && examples.length < 3) examples.push(s.length > 140 ? `${s.slice(0, 137)}…` : s);
  }
  return { count, share: sentences.length ? count / sentences.length : 0, examples };
}

const status = (ok, warn) => (ok ? 'pass' : warn ? 'warn' : 'fail');

function structure(text, sentences, wordCount, cliches) {
  const opening = sentences.slice(0, 2).join(' ');
  const openingCliche = cliches.some((c) => c.category === 'opening' && c.index < 140);
  const markers = [/\d/.test(opening), /["“”]/.test(opening), TIME_WORDS.test(opening), (opening.match(PAST_VERBS) || []).length >= 2,
    /(?<![.!?]\s)(?<!^)\b[A-Z][a-z]{2,}/.test(opening.replace(/^\S+\s/, ''))].filter(Boolean).length;
  const mid = text.replace(/(^|[.!?]\s+)[A-Z][a-z]+/g, '$1');
  const proper = (mid.match(/\b[A-Z][a-z]{2,}\b/g) || []).length;
  const digits = (text.match(/\b\d[\d:.,]*\b/g) || []).length;
  const quotes = (text.match(/["“][^"”]{2,}["”]/g) || []).length;
  const sensory = (text.match(SENSORY) || []).length;
  const details = digits + proper + quotes + sensory;
  const detailTarget = Math.max(3, Math.round(wordCount / 60));
  const tail = text.slice(Math.floor(text.length * 0.55));
  const reflect = (tail.match(REFLECTION) || []).length;
  const firstPerson = sentences.filter((s) => FIRST_PERSON.test(s)).length;
  const ratio = sentences.length ? firstPerson / sentences.length : 0;

  return [
    { id: 'scene', status: openingCliche ? 'fail' : status(markers >= 2, markers === 1), markers, openingCliche },
    { id: 'details', status: status(details >= detailTarget, details >= 1), count: details, target: detailTarget },
    { id: 'reflection', status: status(reflect >= 2, reflect === 1), count: reflect },
    { id: 'voice', status: ratio === 0 ? 'fail' : status(ratio >= 0.35 && ratio <= 0.92, ratio > 0.15 && ratio < 0.98), ratio: +ratio.toFixed(2) },
  ];
}

/**
 * Анализ эссе.
 * @param {string} text
 * @param {{cliches?: Array, stopwords?: string[], minWords?: number, maxWords?: number}} opts
 */
export function analyze(text, opts = {}) {
  const { cliches: items = [], stopwords = [], minWords = DEFAULTS.minWords, maxWords = DEFAULTS.maxWords } = opts;
  const clean = String(text ?? '');
  const words = countWords(clean);
  const chars = clean.length;
  const sentences = splitSentences(clean);
  const lengths = sentences.map((s) => countWords(s));
  const avg = lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  const longest = lengths.length ? Math.max(...lengths) : 0;
  const long = sentences.map((s, i) => ({ index: i + 1, words: lengths[i], text: s })).filter((x) => x.words > 30);
  const cliches = findCliches(clean, items);
  const rep = { words: repetition(clean, stopwords, words), starters: starters(sentences) };
  const passive = passiveInfo(sentences);
  const struct = structure(clean, sentences, words, cliches);

  const lengthStatus = words === 0 ? 'empty' : words < minWords ? 'short' : words > maxWords ? 'long' : 'ok';
  const tips = [];
  if (lengthStatus === 'short') tips.push({ code: 'tip.short', params: { need: minWords - words } });
  if (lengthStatus === 'long') tips.push({ code: 'tip.long', params: { over: words - maxWords } });
  if (cliches.length) tips.push({ code: 'tip.cliches', params: { n: cliches.length } });
  for (const s of struct) if (s.status !== 'pass' && words > 0) tips.push({ code: `tip.${s.id}.${s.status}`, params: {} });
  if (avg > 24 || long.length) tips.push({ code: 'tip.sentences', params: { avg: +avg.toFixed(1), n: long.length } });
  if (passive.share > 0.2) tips.push({ code: 'tip.passive', params: { n: passive.count } });
  if (rep.words.length) tips.push({ code: 'tip.repeat', params: { word: rep.words[0].word } });
  if (rep.starters.length) tips.push({ code: 'tip.starters', params: { word: rep.starters[0].word, n: rep.starters[0].count } });

  return {
    words, chars,
    length: { status: lengthStatus, min: minWords, max: maxWords },
    sentences: { count: sentences.length, avg: +avg.toFixed(1), longest, long },
    cliches, repetition: rep, passive, structure: struct, tips,
  };
}
