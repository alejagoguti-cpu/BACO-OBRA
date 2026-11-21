// App: página Equipo, check-in público por QR, personal en tiempo real y cierre del acceso abierto.
const fs = require('fs');
function edit(p, fn) { let s = fs.readFileSync(p, 'utf8'); const CR = s.includes('\r\n'); s = s.split('\r\n').join('\n'); s = fn(s); fs.writeFileSync(p, CR ? s.split('\n').join('\r\n') : s); }
function R(s, a, b) { if (!s.includes(a)) { console.error('NO ENCONTRADO:\n' + a.slice(0, 160)); process.exit(1); } return s.replace(a, () => b); }

edit('src/app/login.ts', (s) => R(s, '<button type="button" data-acc="tab" data-v="registro">Solicitar cuenta</button>', '<span class="acc-muted">¿Sin cuenta? Pídela a administración</span>'));

edit('src/app/app.ts', (s) => {
  s = R(s, "import { vChat, preguntar, alCambiarChat } from './asistente';", "import { vChat, preguntar, alCambiarChat } from './asistente';\nimport { iniciarPersonal, alCambiarPersonal } from './personal';\nimport { vEquipo, cargarEquipo, pintarQrsEquipo, eventoEquipo, crearCuenta, mostrarCheckin } from './equipo';");
  s = R(s, "['asistente', 'Asistente', 'spark'],", "['asistente', 'Asistente', 'spark'], ['equipo', 'Equipo', 'user'],");
  s = R(s, "['novedades', 'resumen', 'asistente', 'plan', 'qr']", "['novedades', 'resumen', 'asistente', 'plan', 'equipo', 'qr']");
  s = R(s, "const PAGES = ['asistente',", "const PAGES = ['equipo', 'asistente',");
  s = R(s, "  const html = base === 'asistente' ?", "  const html = base === 'equipo' ? vEquipo() : base === 'asistente' ?");
  s = R(s, "  if (base === 'resumen') montarResumen();", "  if (base === 'resumen') montarResumen();\n  if (base === 'equipo') void pintarQrsEquipo();");
  s = R(s, "  if (h === 'nueva-clave') {", "  if (h.startsWith('checkin/')) { const [, hab, tok] = h.split('/'); $('rail').hidden = true; $('topbar').hidden = true; ocultarWorkspace(); $('page').innerHTML = ''; $('ov').innerHTML = ''; await mostrarCheckin($('layer'), hab, tok ?? ''); return; }\n  if (h === 'nueva-clave') {");
  s = R(s, "void iniciarNovedades(); void iniciarAvance(); } void go(); });", "void iniciarNovedades(); void iniciarAvance(); void iniciarPersonal(); void cargarEquipo(); } void go(); });\nalCambiarPersonal(() => { if (route === 'equipo') renderPage(); });");
  s = R(s, "conectarPresencia(perfil); void iniciarNovedades(); void iniciarAvance(); toast(", "conectarPresencia(perfil); void iniciarNovedades(); void iniciarAvance(); void iniciarPersonal(); void cargarEquipo().then(() => { if (route === 'equipo') renderPage(); }); toast(");
  s = R(s, "  if (t.dataset.rsf) {", "  if (t.dataset.eq && await eventoEquipo(t)) return;\n  if (t.dataset.rsf) {");
  s = R(s, "  if (f.id === 'fAs' || f.id === 'fAsP')", "  if (f.id === 'fEqCuenta') { await crearCuenta(f); renderPage(); return; }\n  if (f.id === 'fAs' || f.id === 'fAsP')");
  return s;
});

edit('src/app/shell.css', (s) => s + `
/* ---------- Equipo ---------- */
#app .eq-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:14px;align-items:start}
#app .eq-col{display:flex;flex-direction:column;gap:14px}
#app .eq-per{display:flex;flex-direction:column;gap:2px;max-height:70vh;overflow:auto}
#app .eq-row{display:flex;align-items:center;gap:10px;padding:7px 4px;border-top:1px solid var(--line)}
#app .eq-av{width:40px;height:40px;border-radius:50%;flex:none;background:#dfe3e8 center/cover no-repeat;display:grid;place-items:center;font:800 12px var(--f);color:#0E3064}
#app .eq-n{flex:1;min-width:0}#app .eq-n b{display:block;font-size:13.5px}#app .eq-n small{font-size:11.5px;color:var(--muted)}
#app .eq-row select,#app .eq-form input,#app .eq-form select{font:600 12.5px var(--f);color:var(--ink);background:var(--soft);border:1px solid var(--line);border-radius:9px;padding:8px 9px}
#app .eq-form{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#app .eq-form .btn{grid-column:1/-1}
#app .eq-cuentas{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--muted);margin-top:6px}
#app .eq-cuentas b{color:var(--ink)}
#app .eq-qrs{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
#app .eq-qrs figure{margin:0;border:1px solid var(--line);border-radius:12px;padding:8px;text-align:center;break-inside:avoid}
#app .eq-qrs img{width:100%;aspect-ratio:1;display:block}
#app .eq-qrs figcaption{font-size:12.5px}#app .eq-qrs figcaption small{display:block;color:var(--muted);font-size:10.5px}
@media (max-width:1100px){#app .eq-grid{grid-template-columns:1fr}}
/* check-in público */
.ck-lista{display:flex;flex-direction:column;gap:6px;max-height:42vh;overflow:auto}
.ck-p{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;padding:12px 14px;border:1px solid #DAD5CB;border-radius:12px;background:#fff}
.ck-p b{font-size:15px;color:#1B232C}.ck-p small{font-size:12px;color:#6C7680}
.ck-p.in{border-color:#1E9A62;background:#E8F6EF}.ck-p.in small{color:#16774B;font-weight:700}
`);
console.log('ok');
