// Tarjeta flotante del mapa: ciudades → hoteles de la ciudad → La Fontana abre la vista 3D del sitio (Unicentro).
const fs = require('fs');
function edit(p, fn) { let s = fs.readFileSync(p, 'utf8'); const CR = s.includes('\r\n'); s = s.split('\r\n').join('\n'); s = fn(s); fs.writeFileSync(p, CR ? s.split('\n').join('\r\n') : s); }
function R(s, a, b) { if (!s.includes(a)) { console.error('NO ENCONTRADO:\n' + a.slice(0, 160)); process.exit(1); } return s.replace(a, () => b); }

edit('src/app/app.ts', (s) => {
  const ini = s.indexOf('    <aside class="mapcard ${mapOpen ? \'open\' : \'\'}">');
  const fin = s.indexOf('    </aside>\n', ini) + '    </aside>\n'.length;
  if (ini < 0 || fin < ini) { console.error('no mapcard'); process.exit(1); }
  s = s.slice(0, ini) + fs.readFileSync('tools/patch/frag-mapcard.txt', 'utf8') + s.slice(fin);
  s = R(s, "let entradaHecha = false;", "let ciudadSel: string | null = null;\nlet entradaHecha = false;");
  s = R(s, "    case 'mapTodos': { const h = await cargarMapa(); enRecorrido = false;", "    case 'mapCiudad': { const h = await cargarMapa(); enRecorrido = false; ciudadCine = null; hotelSel = null; ciudadSel = v || null; h.vistaColombia(0); if (v) est?.volarCiudad(h.viewer as never, v); else est?.verTodos(h.viewer as never); renderOv(); return; }\n    case 'mapHotel': { if (v === 'fontana') { location.hash = 'hoteles/la-fontana'; return; } const h = await cargarMapa(); est?.detenerCine(h.viewer as never); hotelSel = v; const x = HOTELES.find((q) => q.id === v)!; h.volarA(x.lon, x.lat, 5000); renderOv(); return; }\n    case 'mapTodos': { const h = await cargarMapa(); ciudadSel = null; enRecorrido = false;");
  return s;
});

edit('src/estelar.ts', (s) => s + `
/** vuelo cinematográfico a una ciudad encuadrando todos sus hoteles */
export function volarCiudad(viewer: Cesium.Viewer, ciudad: string): void {
  detenerCine(viewer);
  const hs = HOTELES.filter((h) => h.ciudad === ciudad); if (!hs.length) return;
  const lon = hs.reduce((a, h) => a + h.lon, 0) / hs.length, lat = hs.reduce((a, h) => a + h.lat, 0) / hs.length;
  const ext = Math.max(0.01, ...hs.map((h) => Math.hypot(h.lon - lon, h.lat - lat)));
  const alt = Math.min(60000, Math.max(9000, ext * 220000));
  viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat - alt / 85000, alt), orientation: { heading: 0, pitch: Cesium.Math.toRadians(-42), roll: 0 }, duration: 3.2, easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT });
}
`);

edit('src/app/app.css', (s) => s + `
#app .mapcard.cities{width:min(340px,calc(100vw - 120px));max-height:calc(100vh - 190px)}
#app .mapcard.cities .glass{display:flex;flex-direction:column;max-height:calc(100vh - 190px)}
#app .mapcard.cities h1{margin:2px 0 0;font-size:28px}
#app .cc-list{display:flex;flex-direction:column;gap:4px;overflow:auto;margin:0 -6px;padding:0 6px}
#app .cc-city,#app .cc-hotel,#app .cc-back{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:10px;padding:10px 10px;border-radius:12px;color:var(--ink)}
#app .cc-city:hover,#app .cc-hotel:hover{background:var(--soft)}
#app .cc-city span,#app .cc-hotel span:not(.pin){flex:1;min-width:0}
#app .cc-city b,#app .cc-hotel b{display:block;font-size:14.5px}
#app .cc-city small,#app .cc-hotel small{display:block;font-size:12px;color:var(--muted)}
#app .cc-city.obra b,#app .cc-hotel.obra b{color:#8C6F3A}
#app .cc-city .ic,#app .cc-hotel>.ic{width:16px;height:16px;color:var(--muted)}
#app .cc-hotel .pin{width:34px;height:34px;flex:none;border-radius:50%;display:grid;place-items:center;background:#0E3064;color:#fff}
#app .cc-hotel.obra .pin{background:#B79E66}
#app .cc-hotel .pin .ic{width:16px;height:16px;color:#fff}
#app .cc-hotel[aria-pressed="true"]{background:rgba(14,48,100,.08)}
#app .cc-back{padding:6px 8px;font-size:12.5px;font-weight:700;color:var(--muted);align-self:flex-start;margin-bottom:4px}
#app .cc-back .ic{width:15px;height:15px}
`);
console.log('ok');
