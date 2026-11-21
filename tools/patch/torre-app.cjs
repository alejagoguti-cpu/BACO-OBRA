// App: precarga del sitio 3D, tarjeta de La Fontana con la torre explotada y entrada directa a la planta del piso 2.
const fs = require('fs');
function edit(p, fn) { let s = fs.readFileSync(p, 'utf8'); const CR = s.includes('\r\n'); s = s.split('\r\n').join('\n'); s = fn(s); fs.writeFileSync(p, CR ? s.split('\n').join('\r\n') : s); }
function R(s, a, b) { if (!s.includes(a)) { console.error('NO ENCONTRADO:\n' + a.slice(0, 160)); process.exit(1); } return s.replace(a, () => b); }

edit('src/app/app.ts', (s) => {
  s = R(s, "interface HLFApi { entrar(): Promise<void>;", "interface HLFApi { precargar(): void; explotar(): void; recomponer(): void; readonly explotado: boolean; entrar(): Promise<void>;");
  // precarga: después de la entrada cinematográfica del mapa, el sitio y el Revit cargan en segundo plano
  s = R(s, "    document.getElementById('mapLoading')?.remove();\n    return hlf;", "    document.getElementById('mapLoading')?.remove();\n    setTimeout(() => hlf.precargar(), 5500);\n    return hlf;");
  // tarjeta de La Fontana
  const ini = s.indexOf("      : `<aside class=\"hcard glass fontana-card\">");
  const fin = s.indexOf("</aside>`;", ini) + "</aside>`;".length;
  if (ini < 0 || fin < ini) { console.error('no fontana card'); process.exit(1); }
  s = s.slice(0, ini) + "      : vFontanaCard();" + s.slice(fin);
  s = R(s, "/* ---------------- capa sobre el mapa", `/* ---------------- tarjeta de La Fontana (escena 3D del sitio) ---------------- */
let torreNiveles: { i: number; nombre: string }[] | null = null; let nivelSel = -1;
function vFontanaCard(): string {
  const fon = HOTELES.find((x) => x.id === 'fontana')!;
  if (torreNiveles) return \`<aside class="hcard glass fontana-card"><p class="map-eyebrow">TORRE SUITES · AXONOMETRÍA POR PISOS</p><h2 style="font-size:22px;font-weight:800;margin:2px 0">Torre en remodelación</h2>
    <p class="muted" style="font-size:12.5px">Pasa el cursor por cada piso para resaltarlo. El piso 2 tiene planta y habitaciones.</p>
    <div class="tp-niveles">\${[...torreNiveles].reverse().map((n) => \`<button class="tp-nivel \${n.i === 1 ? 'p2' : ''} \${n.i === nivelSel ? 'on' : ''}" data-act="torreNivel" data-v="\${n.i}"><b>\${esc(n.nombre)}</b><small>\${n.i === 1 ? 'Ver planta y habitaciones →' : 'Sin planta de detalle aún'}</small></button>\`).join('')}</div>
    <button class="btn block" data-act="torreRecomponer">\${ic('reset', 1.8)} Recomponer edificio</button></aside>\`;
  return \`<aside class="hcard glass fontana-card"><p class="map-eyebrow">BOGOTÁ · USAQUÉN</p><h2 style="font-size:24px;font-weight:800;margin:2px 0">Hotel Estelar La Fontana</h2><p class="muted" style="font-size:13.5px">\${esc(fon.dir)}</p>
    <p class="tp-hint">\${ic('tap', 1.8)} Pasa el cursor sobre la <b>Torre Suites</b>: se ilumina y el resto queda en segundo plano. Haz clic para separarla por pisos.</p>
    <button class="btn coral block cta" data-act="torreExplotar">\${ic('layers', 2)} Separar por pisos</button>
    <a class="btn block" href="#fontana">\${ic('cube', 2)} Explorar gemelo digital</a></aside>\`;
}
addEventListener('hlf:explotado', (e) => { torreNiveles = (e as CustomEvent).detail; nivelSel = -1; if (route === 'hoteles/la-fontana') renderOvFontana(); });
addEventListener('hlf:recompuesto', () => { torreNiveles = null; nivelSel = -1; if (route === 'hoteles/la-fontana') renderOvFontana(); });
addEventListener('hlf:nivel', (e) => { nivelSel = (e as CustomEvent).detail; document.querySelectorAll<HTMLElement>('.tp-nivel').forEach((b) => b.classList.toggle('on', +b.dataset.v! === nivelSel)); });
addEventListener('hlf:entrarNivel', (e) => entrarNivel((e as CustomEvent).detail));
function entrarNivel(i: number): void {
  if (i !== 1) { toast('Por ahora solo el piso 2 tiene planta y habitaciones en el gemelo'); return; }
  try { sessionStorage.setItem('twin-directo', '1'); } catch { /* */ }
  location.hash = 'fontana/piso-2';
}
function renderOvFontana(): void { const c = document.querySelector('.fontana-card'); if (c) c.outerHTML = vFontanaCard(); }

/* ---------------- capa sobre el mapa`);
  s = R(s, "    case 'irRuta': location.hash = v; return;", "    case 'irRuta': location.hash = v; return;\n    case 'torreExplotar': W.HLF?.explotar(); return;\n    case 'torreRecomponer': W.HLF?.recomponer(); return;\n    case 'torreNivel': entrarNivel(+v); return;");
  return s;
});

edit('src/twin/workspace.ts', (s) => R(s, "    if (s.modo === 'edificio') {\n      // llegada directa (recarga o enlace): se anima igual, no se salta la explosión\n      s.verBim();\n    }",
  "    let directo = false; try { directo = sessionStorage.getItem('twin-directo') === '1'; sessionStorage.removeItem('twin-directo'); } catch { /* */ }\n    if (s.modo === 'edificio') {\n      // desde la torre explotada en el sitio 3D se entra directo a la planta; si no, se anima la explosión\n      if (directo) s.irAPlantaDirecto(); else s.verBim();\n    }"));

edit('src/app/app.css', (s) => s + `
#app .fontana-card{width:min(360px,calc(100vw - 32px))}
#app .tp-hint{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;color:var(--ink2);background:rgba(183,158,102,.12);border-radius:10px;padding:9px 10px;margin:8px 0}
#app .tp-hint .ic{width:16px;height:16px;flex:none;margin-top:1px;color:#8C6F3A}
#app .tp-niveles{display:flex;flex-direction:column;gap:3px;margin:8px 0;max-height:46vh;overflow:auto}
#app .tp-nivel{all:unset;box-sizing:border-box;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 11px;border-radius:10px;border:1px solid var(--line)}
#app .tp-nivel b{font-size:13.5px}#app .tp-nivel small{font-size:11.5px;color:var(--muted)}
#app .tp-nivel.p2{border-color:#B79E66}#app .tp-nivel.p2 small{color:#8C6F3A;font-weight:700}
#app .tp-nivel.on,#app .tp-nivel:hover{background:rgba(232,180,74,.18);border-color:#E8B44A}
`);
console.log('ok');
