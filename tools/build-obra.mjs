// Convierte la programación real de obra (Videos\Hotel\02_OBRA\01_Programacion\*.xlsx) a public/data/obra.json.
// Solo datos operativos (habitaciones, frentes, fases, fechas, especialidad, estado). Sin nombres de personas ni precios.
import fs from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';

const SRC = process.argv[2] || 'C:/Users/aleja/Videos/Hotel/02_OBRA/01_Programacion/Programacion_Obra_Habitaciones_HE_La_Fontana.xlsx';
const z = unzipSync(new Uint8Array(fs.readFileSync(SRC)));
const txt = (p) => (z[p] ? strFromU8(z[p]) : '');
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
const ss = [...txt('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => dec([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
const wb = txt('xl/workbook.xml'), rels = txt('xl/_rels/workbook.xml.rels');
function hoja(nombre) {
  const m = new RegExp(`<sheet [^>]*name="${nombre}"[^>]*r:id="([^"]+)"`).exec(wb);
  const t = new RegExp(`Id="${m[1]}"[^>]*Target="([^"]+)"`).exec(rels) || new RegExp(`Target="([^"]+)"[^>]*Id="${m[1]}"`).exec(rels);
  const x = txt('xl/' + t[1].replace(/^\/?xl\//, ''));
  return [...x.matchAll(/<row [^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)].map((r) => {
    const o = {};
    for (const c of r[2].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ty = /t="(\w+)"/.exec(c[2])?.[1], v = /<v>([\s\S]*?)<\/v>/.exec(c[3] || '')?.[1];
      if (v === undefined) continue;
      o[c[1]] = ty === 's' ? ss[+v] : ty === 'str' ? dec(v) : isNaN(+v) ? dec(v) : +v;
    }
    return o;
  });
}
const fecha = (n) => new Date(Math.round((n - 25569) * 864e5)).toISOString().slice(0, 10);

/* habitaciones (Gantt Ejecutivo) */
const habitaciones = hoja('Gantt Ejecutivo').filter((r) => typeof r.A === 'number' && r.C).map((r) => ({
  hab: String(r.C), frente: r.B, tipo: r.D, area: +(+r.E).toFixed(2), ini: fecha(r.F), fin: fecha(r.G), dias: r.H,
}));
/* actividades (Cronograma Detallado) */
const espDe = (s) => {
  s = String(s).toLowerCase();
  if (s.includes('plomero') && s.includes('electricista')) return 'coo';
  if (s.includes('plomero')) return 'hid';
  if (s.includes('electric')) return 'ele';
  if (s.includes('mep')) return 'hid';
  if (s.includes('residente')) return 'coo';
  return 'arq';
};
const actividades = hoja('Cronograma Detallado').filter((r) => /^F\d-/.test(String(r.A))).map((r) => ({
  id: r.A, frente: r.B, hab: String(r.C), tipo: r.D, fase: r.E, desc: String(r.F || '').replace(/\s+/g, ' ').slice(0, 260),
  ini: fecha(r.G), fin: fecha(r.H), dias: r.I, rel: r.J || '', quien: r.K || '', esp: espDe(r.K || ''), estado: r.M || 'No iniciado',
  real: typeof r.N === 'number' ? r.N : 0, obs: String(r.O || '').replace(/\s+/g, ' ').slice(0, 220),
}));
/* hitos (Resumen Comité) */
const res = hoja('Resumen Comité');
const hitos = res.filter((r) => typeof r.A === 'number' && r.B && r.C && r.G).map((r) => ({ fecha: fecha(r.A), hito: r.B, resultado: r.C, quien: r.F, tipo: r.G, decision: r.H }));
const frentes = res.filter((r) => /^Frente \d$/.test(String(r.A)) && r.B).map((r) => ({ frente: r.A, secuencia: r.B, n: r.C, comp: r.D, area: +r.E, ini: fecha(r.F), fin: fecha(r.G), criterio: r.H }));
const head = res.find((r) => String(r.A).startsWith('Hotel'))?.A || '';
/* actividades detectadas en inspección */
const insp = hoja('Actividades Inspección').filter((r) => typeof r.A === 'number' && r.B).map((r) => ({ hab: String(r.B), act: r.E, fase: r.F, cob: r.G }));

const out = {
  fuente: SRC.split(/[\\/]/).pop(), generado: new Date().toISOString().slice(0, 10), resumen: head,
  inicio: '2026-09-01', entrega: fecha(res.find((r) => r.M && typeof r.M === 'number')?.M ?? 46328), finProduccion: fecha(res.find((r) => r.I && typeof r.I === 'number')?.I ?? 46324),
  habitaciones, frentes, hitos, actividades, inspeccion: insp,
};
fs.mkdirSync('public/data', { recursive: true });
fs.writeFileSync('public/data/obra.json', JSON.stringify(out));
const est = {}; actividades.forEach((a) => { est[a.estado] = (est[a.estado] || 0) + 1; });
console.log('habitaciones', habitaciones.length, 'frentes', frentes.length, 'hitos', hitos.length, 'actividades', actividades.length, 'inspección', insp.length);
console.log('estados', est, 'fases', [...new Set(actividades.map((a) => a.fase))].length, 'entrega', out.entrega);
console.log('esp', actividades.reduce((o, a) => ((o[a.esp] = (o[a.esp] || 0) + 1), o), {}));
