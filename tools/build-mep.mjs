// Convierte build/mep_p2.json (exportado de Revit con tools/revit_mep_p2.py) al binario del visor.
// Mismo marco que public/bim/piso2.json: ejes web (x, z, -y) centrados en "origen".
// Suelda vértices repetidos (Revit triangula cara por cara) para bajar el peso.
import fs from 'node:fs';

const src = JSON.parse(fs.readFileSync('build/mep_p2.json', 'utf8'));
const arq = JSON.parse(fs.readFileSync('public/bim/piso2.json', 'utf8'));
const [cx, cy] = arq.origen;
const parts = []; const cats = []; let off = 0; let tris = 0;
const orden = ['af', 'acs', 'san', 'otras', 'sanitarios', 'rci', 'conduit', 'aparatos', 'luminarias', 'ductos'];
for (const nombre of orden) {
  const g = src.grupos[nombre];
  if (!g || !g.T.length) continue;
  const map = new Map(); const V = []; const T = new Uint32Array(g.T.length);
  const idx = (i) => {
    const x = g.V[i * 3], y = g.V[i * 3 + 1], z = g.V[i * 3 + 2];
    const k = `${Math.round(x * 500)},${Math.round(y * 500)},${Math.round(z * 500)}`;
    let v = map.get(k);
    if (v === undefined) { v = V.length / 3; map.set(k, v); V.push(x - cx, z, -(y - cy)); }
    return v;
  };
  let n = 0;
  for (let t = 0; t < g.T.length; t += 3) {
    const a = idx(g.T[t]), b = idx(g.T[t + 1]), c = idx(g.T[t + 2]);
    if (a === b || b === c || a === c) continue;
    T[n++] = a; T[n++] = b; T[n++] = c;
  }
  const Vf = new Float32Array(V); const Tt = T.slice(0, n);
  cats.push({ nombre, vOff: off, vLen: Vf.length, tOff: off + Vf.byteLength, tLen: Tt.length, elementos: g.n });
  parts.push(Buffer.from(Vf.buffer), Buffer.from(Tt.buffer));
  off += Vf.byteLength + Tt.byteLength; tris += n / 3;
  console.log(nombre.padEnd(11), String(g.n).padStart(5), 'elem', String(n / 3).padStart(8), 'tris', (Vf.byteLength + Tt.byteLength) / 1e6 + ' MB');
}
fs.writeFileSync('public/bim/mep.bin', Buffer.concat(parts));
fs.writeFileSync('public/bim/mep.json', JSON.stringify({ fuente: src.fuente, archivo: 'mep.bin', cats }));
console.log('total', tris, 'tris', (off / 1e6).toFixed(1), 'MB');
