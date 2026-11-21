// Parche de src/app/app.ts: Asistente BIM (página #asistente + panel lateral desde cualquier módulo).
const fs = require('fs'); const p = 'src/app/app.ts';
let s = fs.readFileSync(p, 'utf8'); const CRLF = s.includes('\r\n'); s = s.split('\r\n').join('\n');
function R(a, b) { if (!s.includes(a)) { console.error('NO ENCONTRADO:\n' + a.slice(0, 160)); process.exit(1); } s = s.replace(a, () => b); }

R("import { vResumen,", "import { vChat, preguntar, alCambiarChat } from './asistente';\nimport { vResumen,");
R("['ia', 'Asistente', 'spark']", "['asistente', 'Asistente', 'spark']");
R("['novedades', 'resumen', 'plan', 'ia', 'qr']", "['novedades', 'resumen', 'asistente', 'plan', 'qr']");
R("const PAGES = ['resumen',", "const PAGES = ['asistente', 'resumen',");
R("  const html = base === 'resumen' ? vResumen()",
  "  const html = base === 'asistente' ? `<header class=\"rs-head\"><div><p class=\"eyebrow\">ASISTENTE BIM · SOLO CONSULTA</p><h1>Pregúntale <b>a la obra.</b></h1><p class=\"sub\">Responde con novedades, cronograma, avances validados y responsables registrados, y cita cada registro. No modifica datos.</p></div><a class=\"btn\" href=\"#ia\">${ic('wa')} Bitácora WhatsApp y 360° (demo anterior)</a></header>${vChat(false)}` : base === 'resumen' ? vResumen()");
R("  <div id=\"layer\"></div>`;", "  <div id=\"asisPanel\" hidden></div>\n  <div id=\"layer\"></div>`;");
R("    <div class=\"who\" id=\"who\" aria-label=\"Personas conectadas\"></div>`;",
  "    <button class=\"circle light as-btn\" data-act=\"asAbrir\" title=\"Asistente BIM\" aria-label=\"Abrir asistente\">${ic('spark')}</button>\n    <div class=\"who\" id=\"who\" aria-label=\"Personas conectadas\"></div>`;");
R("    case 'irRuta': location.hash = v; return;",
  "    case 'irRuta': location.hash = v; return;\n    case 'asAbrir': { const pa = $('asisPanel'); pa.hidden = !pa.hidden; pintarPanelAs(); return; }\n    case 'asCerrar': $('asisPanel').hidden = true; return;\n    case 'asSug': void preguntar(v); return;");
R("  if (f.id === 'fRsAvance')",
  "  if (f.id === 'fAs' || f.id === 'fAsP') { const q = String(new FormData(f).get('q') ?? '').trim(); if (q) { f.reset(); void preguntar(q); } return; }\n  if (f.id === 'fRsAvance')");
R("alCambiarAvance(() =>",
  "function pintarPanelAs(): void { const pa = $('asisPanel'); if (pa.hidden) return; pa.innerHTML = vChat(true); const l = document.getElementById('asLogP'); if (l) l.scrollTop = l.scrollHeight; }\nalCambiarChat(() => { pintarPanelAs(); if (route === 'asistente') { renderPage(); const l = document.getElementById('asLog'); if (l) l.scrollTop = l.scrollHeight; } });\nalCambiarAvance(() =>");
fs.writeFileSync(p, CRLF ? s.split('\n').join('\r\n') : s); console.log('ok');
