// Vuelca hojas de un .xlsx a texto (solo lectura). Uso: node tools/xlsx-dump.mjs <archivo> [maxFilas]
import fs from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';

const [file, maxArg] = process.argv.slice(2);
const max = +maxArg || 60;
const z = unzipSync(new Uint8Array(fs.readFileSync(file)));
const txt = (p) => (z[p] ? strFromU8(z[p]) : '');
const ss = [...txt('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''));
const wb = txt('xl/workbook.xml');
const rels = txt('xl/_rels/workbook.xml.rels');
const sheets = [...wb.matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)].map((m) => {
  const target = new RegExp(`Id="${m[2]}"[^>]*Target="([^"]+)"`).exec(rels) || new RegExp(`Target="([^"]+)"[^>]*Id="${m[2]}"`).exec(rels);
  return { name: m[1], path: 'xl/' + target[1].replace(/^\/?xl\//, '') };
});
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
for (const sh of sheets) {
  const x = txt(sh.path);
  const rows = [...x.matchAll(/<row [^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)];
  console.log(`\n=== HOJA: ${sh.name} (${rows.length} filas) ===`);
  let n = 0;
  for (const r of rows) {
    const cells = [...r[2].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)].map((c) => {
      const t = /t="(\w+)"/.exec(c[2])?.[1]; const v = /<v>([\s\S]*?)<\/v>/.exec(c[3] || '')?.[1];
      const is = /<t[^>]*>([\s\S]*?)<\/t>/.exec(c[3] || '')?.[1];
      let val = t === 's' ? ss[+v] : t === 'inlineStr' ? is : v;
      if (val === undefined || val === '') return null;
      if (!t && /^-?\d+\.\d{4,}$/.test(val)) val = (+val).toFixed(2);
      return `${c[1]}:${dec(String(val)).replace(/\s+/g, ' ').trim()}`;
    }).filter(Boolean);
    if (!cells.length) continue;
    console.log(r[1].padStart(4), cells.join(' | '));
    if (++n >= max) { console.log('   …'); break; }
  }
}
