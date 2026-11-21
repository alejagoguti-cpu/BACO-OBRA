// Novedades: sin vista 3D; personas sobre la planta (foto, especialidad, check-in/asignación) y equipo por habitación.
const fs = require('fs');
function edit(p, fn) { let s = fs.readFileSync(p, 'utf8'); const CR = s.includes('\r\n'); s = s.split('\r\n').join('\n'); s = fn(s); fs.writeFileSync(p, CR ? s.split('\n').join('\r\n') : s); }
function R(s, a, b) { if (!s.includes(a)) { console.error('NO ENCONTRADO:\n' + a.slice(0, 160)); process.exit(1); } return s.replace(a, () => b); }
const F = (n) => fs.readFileSync('tools/patch/' + n, 'utf8');

edit('src/twin/nov-ui.ts', (s) => {
  s = R(s, "import { esc, ic, toast } from '../app/ui';", "import { esc, ic, toast } from '../app/ui';\nimport { listaPersonal, enHabitacion, fotoDe, alCambiarPersonal, asignar, quitarAsignacion, dentroAhora, habitacionesDe, sinUbicar, iniciales, type Persona } from '../app/personal';");
  s = R(s, "    quitarSub = alCambiarNovedades(() => { if (activo) render(); });", "    const q1 = alCambiarNovedades(() => { if (activo) render(); });\n    const q2 = alCambiarPersonal(() => { firmaGente = ''; if (activo) render(); });\n    quitarSub = () => { q1(); q2(); };");
  s = R(s, "  pins?.remove(); pins = null;", "  pins?.remove(); pins = null; gente?.remove(); gente = null; firmaGente = ''; personaSel = null;");
  // capa de personas en el bucle de dibujo
  s = R(s, "function loop(): void {", F('frag-gente.ts') + "\nfunction loop(): void {");
  s = R(s, "  if (!pins || !pins.isConnected) {", "  dibujarGente();\n  if (!pins || !pins.isConnected) {");
  // sin vista 3D
  s = R(s, /    <div class="tw-seg nv-vista">[^\n]*\n/.exec(s)[0], '');
  // equipo de la habitación / resumen del equipo en el panel izquierdo
  s = R(s, "    <div class=\"nv-list\">", "    ${uiEquipo()}\n    <div class=\"nv-list\">");
  s = R(s, "  ${creando ? uiCrear() : `<aside class=\"tw-card tw-panel nv-det\" id=\"nvDet\" ${sel ? '' : 'hidden'}></aside>`}", "  ${personaSel ? uiPersona() : creando ? uiCrear() : `<aside class=\"tw-card tw-panel nv-det\" id=\"nvDet\" ${sel ? '' : 'hidden'}></aside>`}");
  s = R(s, "    case 'vista': await stage?.setVista3D(v === '3d'); render(); break;", "    case 'persona': personaSel = v; sel = null; render(); break;\n    case 'cerrarPersona': personaSel = null; render(); break;\n    case 'quitarAsig': { const [pid, hab] = v.split('|'); toast((await quitarAsignacion(pid, hab)) ?? 'Asignación retirada'); break; }");
  s = R(s, "  else if (k === 'resp') filtro.resp = t.value;", "  else if (k === 'resp') filtro.resp = t.value;\n  else if (k === 'asignar' && t.value) { const hab = t.dataset.hab || filtro.hab; const pid = t.dataset.pid || t.value; const h2 = t.dataset.pid ? t.value : hab; toast((await asignar(pid, h2)) ?? 'Persona asignada a la habitación ' + h2); return true; }");
  return s;
});

edit('src/twin/twin.css', (s) => s + `
/* personas sobre la planta */
#twin .nv-gente{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden}
.nv-per{position:absolute;left:0;top:0;pointer-events:auto;cursor:pointer;border:0;padding:0;background:none;will-change:transform}
.nv-per .av{position:absolute;left:-17px;top:-17px;width:34px;height:34px;border-radius:50%;background:#dfe3e8 center/cover no-repeat;display:grid;place-items:center;font:800 11px var(--f,sans-serif);color:#0E3064;box-shadow:0 0 0 2.5px var(--ring),0 6px 14px -6px rgba(0,0,0,.5);transition:transform .15s}
.nv-per.asignado .av{filter:grayscale(.85);opacity:.85}
.nv-per .es{position:absolute;left:8px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--c);box-shadow:0 0 0 2px #fff}
.nv-per:hover .av,.nv-per.on .av{transform:scale(1.18)}
.nv-per .nm{position:absolute;left:50%;top:19px;transform:translateX(-50%);white-space:nowrap;font:700 10px var(--f,sans-serif);background:rgba(255,255,255,.92);border-radius:5px;padding:1px 5px;opacity:0;pointer-events:none;transition:opacity .15s}
.nv-per:hover .nm,.nv-per.on .nm{opacity:1}
.nv-mas{position:absolute;left:-13px;top:-13px;width:26px;height:26px;border-radius:50%;background:#0E3064;color:#fff;font:800 10.5px var(--f,sans-serif);display:grid;place-items:center;box-shadow:0 0 0 2px #fff}
.nv-equipo{border:1px solid var(--tw-line);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px}
.nv-equipo .tw-lbl{display:flex;justify-content:space-between;align-items:center}
.nv-caras{display:flex;flex-wrap:wrap;gap:6px}
.nv-cara{all:unset;cursor:pointer;display:flex;align-items:center;gap:7px;padding:4px 8px 4px 4px;border-radius:999px;border:1px solid var(--tw-line);font-size:12px;font-weight:600}
.nv-cara i{width:26px;height:26px;border-radius:50%;background:#dfe3e8 center/cover no-repeat;display:grid;place-items:center;font:800 10px var(--f,sans-serif);color:#0E3064;box-shadow:0 0 0 2px var(--ring);font-style:normal}
.nv-cara.asignado i{filter:grayscale(.85)}
.nv-cara small{color:var(--tw-muted);font-weight:500}
.nv-equipo select{font:600 12px var(--f,sans-serif);color:var(--tw-ink);background:rgba(255,255,255,.55);border:1px solid var(--tw-line);border-radius:8px;padding:7px 8px}
.nv-leyenda{display:flex;flex-wrap:wrap;gap:8px;font-size:11px;color:var(--tw-muted)}
.nv-leyenda span{display:inline-flex;align-items:center;gap:4px}.nv-leyenda i{width:9px;height:9px;border-radius:50%;display:inline-block}
.nv-perfil{display:flex;gap:14px;align-items:center}
.nv-perfil .foto{width:84px;height:84px;border-radius:18px;background:#dfe3e8 center/cover no-repeat;display:grid;place-items:center;font:800 24px var(--f,sans-serif);color:#0E3064;flex:none}
`);
console.log('ok');
