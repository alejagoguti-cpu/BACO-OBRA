// Hoteles: mapa real (Cesium) cinematográfico en vez del mapa plano SVG.
const fs = require('fs');
function edit(p, fn) { let s = fs.readFileSync(p, 'utf8'); const CR = s.includes('\r\n'); s = s.split('\r\n').join('\n'); s = fn(s); fs.writeFileSync(p, CR ? s.split('\n').join('\r\n') : s); }
function R(s, a, b) { if (!s.includes(a)) { console.error('NO ENCONTRADO:\n' + a.slice(0, 160)); process.exit(1); } return s.replace(a, () => b); }

edit('src/app/app.css', (s) => {
  s = R(s, 'body[data-modo="pais"] #cesiumContainer canvas{visibility:hidden}\n', '');
  s = R(s, 'body[data-modo="pais"] #cesiumContainer{background:radial-gradient(circle at 73% 42%,#fffefa,#e8e4dc 75%)}\n', '');
  return s + '\n/* mapa real de hoteles */\n#app .map-cine{position:fixed;z-index:31;left:50%;bottom:26px;transform:translateX(-50%);display:flex;gap:8px;align-items:center;padding:8px;border-radius:999px;background:rgba(14,48,100,.82);backdrop-filter:blur(14px);box-shadow:0 14px 30px -14px rgba(0,0,0,.5)}\n#app .map-cine button{border:0;border-radius:999px;padding:10px 16px;font:700 13px var(--f);cursor:pointer;background:rgba(255,255,255,.12);color:#fff;display:inline-flex;gap:8px;align-items:center}\n#app .map-cine button.on,#app .map-cine button:hover{background:#B79E66;color:#0E3064}\n#app .map-cine .ic{width:16px;height:16px}\n#app .map-ciudad{position:fixed;z-index:31;left:50%;top:96px;transform:translateX(-50%);font:300 clamp(30px,4vw,56px)/1 var(--f);color:#fff;letter-spacing:-.01em;text-shadow:0 4px 30px rgba(0,0,0,.55);pointer-events:none;animation:twIn .6s ease}\n#app .map-ciudad small{display:block;font:700 11px var(--f);letter-spacing:.2em;text-transform:uppercase;color:#E8C98A;margin-bottom:6px;text-align:center}\n';
});

edit('src/app/app.ts', (s) => {
  s = R(s, "let pines: { show(v: boolean): void } | null = null;", "let pines: { show(v: boolean): void } | null = null;\nlet est: typeof import('../estelar') | null = null;\nlet entradaHecha = false; let enRecorrido = false; let ciudadCine: string | null = null;");
  s = R(s, "    const [{ crearPinesEstelar }] = await Promise.all([import('../estelar')]);", "    est = await import('../estelar');\n    const { crearPinesEstelar } = est;");
  s = R(s, "  void cargarMapa().then((hlf) => hlf.volarA(h.lon, h.lat, h.obra ? 3500 : 6000));", "  void cargarMapa().then((hlf) => { est?.detenerCine(hlf.viewer as never); enRecorrido = false; hlf.volarA(h.lon, h.lat, h.obra ? 3500 : 6000); });");
  s = R(s, "    ov.innerHTML = `${renderMapVisual(true)}", "    ov.innerHTML = `${ciudadCine ? `<div class=\"map-ciudad\"><small>Hoteles Estelar</small>${esc(ciudadCine)}</div>` : ''}\n    <div class=\"map-cine\"><button data-act=\"mapTodos\" class=\"${enRecorrido ? '' : 'on'}\">${ic('globe', 1.8)} Ver todos</button><button data-act=\"mapRecorrido\" class=\"${enRecorrido ? 'on' : ''}\">${ic(enRecorrido ? 'pause' : 'play', 1.8)} ${enRecorrido ? 'Detener recorrido' : 'Recorrido por los hoteles'}</button><a href=\"#hoteles/la-fontana\"><button>${ic('build', 1.8)} La Fontana</button></a></div>");
  s = R(s, "  else { pines?.show(true); if (hlf.modo === 'sitio' && !hotelSel) hlf.vistaColombia(); }", "  else { pines?.show(true); if (!hotelSel && est) { hlf.vistaColombia(0); est.verTodos(hlf.viewer as never, !entradaHecha); entradaHecha = true; } }");
  s = R(s, "    case 'irRuta': location.hash = v; return;", "    case 'irRuta': location.hash = v; return;\n    case 'mapTodos': { const h = await cargarMapa(); enRecorrido = false; ciudadCine = null; hotelSel = null; h.vistaColombia(0); est?.verTodos(h.viewer as never); renderOv(); return; }\n    case 'mapRecorrido': { const h = await cargarMapa(); if (enRecorrido) { est?.detenerCine(h.viewer as never); enRecorrido = false; ciudadCine = null; renderOv(); return; } enRecorrido = true; hotelSel = null; h.vistaColombia(0); renderOv(); void est?.recorrido(h.viewer as never, (c) => { ciudadCine = c; if (!c) enRecorrido = false; if (route === 'mapa' || route === '') renderOv(); }); return; }");
  // al salir del mapa se detiene la cámara cinematográfica
  s = R(s, "  ocultarWorkspace();\n  if (h === 'hoteles/bogota'", "  ocultarWorkspace();\n  if (base !== 'mapa' && base !== '' && W.HLF && est) { est.detenerCine(W.HLF.viewer as never); enRecorrido = false; ciudadCine = null; }\n  if (h === 'hoteles/bogota'");
  return s;
});
console.log('ok');
