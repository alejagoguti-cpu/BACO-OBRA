// Habitaciones del PISO 2 (Rooms de HLF_P2-P6.rvt, export de solo lectura en build/habitaciones_raw.json)
// → public/twin/habitaciones_p2.json en ejes web del visor (mismo marco que public/twin/nivel_*.bin).
// Transformación idéntica a HLF-BIM/tools/build-niveles.mjs.
import fs from 'node:fs';
const A = JSON.parse(fs.readFileSync('C:/Users/aleja/HLF/build/revit/alineacion.json', 'utf8'));
const man = JSON.parse(fs.readFileSync('public/twin/manifest.json', 'utf8'));
const TH = (A.th * Math.PI) / 180, CT = Math.cos(TH), ST = Math.sin(TH);
const SC = 1.000614, AA = (0.0849 * Math.PI) / 180, CA = Math.cos(AA), SA = Math.sin(AA);
const toEnu = (rx, ry) => {
  const X = (rx - A.rx) * CT - (ry - A.ry) * ST, Y = (rx - A.rx) * ST + (ry - A.ry) * CT;
  const mx = X + A.cx, my = Y + A.cy;
  return [(mx * CA - my * SA) * SC, (mx * SA + my * CA) * SC];
};
const web = (x, y) => { const [e, n] = toEnu(x, y); return [+(e - man.enu.e).toFixed(3), +(-(n - man.enu.n)).toFixed(3)]; };
const raw = JSON.parse(fs.readFileSync('build/habitaciones_raw.json', 'utf8'));
const habitaciones = raw.rooms
  .filter((r) => !r.error && /^2\d\d$/.test(r.numero))
  .map((r) => ({ numero: r.numero, nombre: r.nombre, revitId: r.id, area_m2: r.area_m2, elev_m: r.elev_m, contorno: r.loops[0].map(([x, y]) => web(x, y)), huecos: r.loops.slice(1).map((l) => l.map(([x, y]) => web(x, y))) }))
  .sort((a, b) => a.numero.localeCompare(b.numero));
const otros = raw.rooms.filter((r) => !r.error && !/^2\d\d$/.test(r.numero) && r.area_m2 >= 2)
  .map((r) => ({ codigo: r.numero, nombre: r.nombre, revitId: r.id, area_m2: r.area_m2, contorno: r.loops[0].map(([x, y]) => web(x, y)) }));
fs.writeFileSync('public/twin/habitaciones_p2.json', JSON.stringify({ fuente: 'HLF_P2-P6.rvt · Rooms PISO 2 (límite en acabado)', exportado: new Date().toISOString().slice(0, 10), habitaciones, otros }));
console.log(habitaciones.length, 'habitaciones', otros.length, 'otros espacios');
const xs = habitaciones.flatMap((h) => h.contorno.map((p) => p[0])), zs = habitaciones.flatMap((h) => h.contorno.map((p) => p[1]));
console.log('x', Math.min(...xs), Math.max(...xs), 'z', Math.min(...zs), Math.max(...zs));
