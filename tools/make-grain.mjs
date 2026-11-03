// Генерирует плитку зерна бумаги 64x64 (серый + альфа, 8 бит) без внешних зависимостей.
// Запуск: node tools/make-grain.mjs  ->  img/own/grain.png
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const S = 64;
let seed = 7;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

// строки: байт фильтра 0 + (серый, альфа) на пиксель
const raw = Buffer.alloc(S * (1 + S * 2));
for (let y = 0; y < S; y++) {
  raw[y * (1 + S * 2)] = 0;
  for (let x = 0; x < S; x++) {
    const o = y * (1 + S * 2) + 1 + x * 2;
    raw[o] = 20 + Math.floor(rnd() * 40);          // тёмно-синеватый серый
    raw[o + 1] = Math.floor(rnd() * rnd() * 70);   // чаще почти прозрачный, изредка заметная крапинка
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 4; // 8 бит, серый + альфа
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
writeFileSync(join(root, 'img/own/grain.png'), png);
console.log('grain.png', png.length, 'байт');
