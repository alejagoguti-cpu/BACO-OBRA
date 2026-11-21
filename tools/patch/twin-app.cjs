// Parche de src/app/app.ts para el rediseño del gemelo: auth real, sidebar fija, rutas #hoteles/… y #fontana/…
// Falla sin escribir si algún fragmento no coincide.
const fs = require('fs'); const p = 'src/app/app.ts'; let s = fs.readFileSync(p, 'utf8'); const CRLF = s.includes(String.fromCharCode(13, 10)); s = s.split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
function rep(a, b) { if (!s.includes(a)) { console.error('NO ENCONTRADO:\n' + a.slice(0, 240)); process.exit(1); } s = s.replace(a, () => b); }
const bloque = (re) => { const m = re.exec(s); if (!m) { console.error('NO ENCONTRADO regex ' + re); process.exit(1); } return m[0]; };

rep(`import type { Bim } from './bim';`, `import type { Bim } from './bim';
import './shell.css';
import { iniciarAuth, perfil, salir, alCambiarSesion, ROL_TXT } from './auth';
import { mostrarAcceso, cerrarAcceso, mostrarAprobacion, mostrarNuevaClave } from './login';
import { conectarPresencia, desconectarPresencia, alCambiarPresencia, informarUbicacion, type Presente } from './presence';
import { montarWorkspace, abrirWorkspace, ocultarWorkspace, parseRuta, migas } from '../twin/workspace';`);

rep(`  <nav class="rail" id="rail" aria-label="Secciones"></nav>`, `  <nav class="rail side" id="rail" aria-label="Secciones"></nav>`);
rep("  <div id=\"prototype\"></div>\n  <div id=\"layer\"></div>`;", "  <div id=\"prototype\"></div>\n  <div id=\"twin\" hidden></div>\n  <div id=\"layer\"></div>`;");

rep(`const NAV: [string, string, string][] = [
  ['mapa', 'Hoteles Colombia', 'globe'], ['plan', 'Planeación', 'plan'], ['bim', 'Modelo BIM', 'obra'],`, `const NAV: [string, string, string][] = [
  ['mapa', 'Hoteles Colombia', 'globe'], ['fontana', 'Gemelo La Fontana', 'cube'], ['plan', 'Planeación', 'plan'], ['bim', 'Modelo BIM', 'obra'],`);
rep(`const PAGES = [`, `const NAV_SEC: [string, string[]][] = [['Exploración espacial', ['mapa', 'fontana', 'bim', 'habitacion-216']], ['Gestión de obra', ['plan', 'novedades', 'panel', 'ia']]];
let compacta = false; try { compacta = localStorage.getItem('baco-side') === 'compacta'; } catch { /* */ }
document.body.classList.toggle('side-compact', compacta);
let presentes: Presente[] = [];
const PAGES = [`);

// el chat de ejemplo traía cifras escritas a mano (26 %, 34 %, 52 %, 22 %): se quita
rep(bloque(/const aiChat: \{ q: string; resp: string; fuente: string; accion\?: \[string, string, string\] \}\[\] = \[[\s\S]*?\n\];/),
  `const aiChat: { q: string; resp: string; fuente: string; accion?: [string, string, string] }[] = [];`);

rep(`          <span style="flex:1.2;background:#E8604F">Arquitectura 34%</span>
          <span style="flex:1;background:#1FA58C">Hidro 22%</span>
          <span style="flex:0.9;background:#F2C94C;color:#141A21">Eléctrica 18%</span>`,
  "          ${OBRA ? [['arq', 'Arquitectura', '#E8604F'], ['hid', 'Hidro', '#1FA58C'], ['ele', 'Eléctrica', '#F2C94C']].map(([k, n, c]) => `<span style=\"flex:1;background:${c}\">${n} ${Math.round(porEsp(k).real * 100)}%</span>`).join('') : '<span style=\"flex:1;background:#6F7C8A\">Sin datos de avance</span>'}");

rep(bloque(/function renderLogin\(\): void \{[\s\S]*?\n\}\n\n\/\* ---------------- rail \+ topbar/), fs.readFileSync('tools/patch/frag-login.ts', 'utf8') + `\n/* ---------------- rail + topbar`);
rep(bloque(/function renderChrome\(\): void \{[\s\S]*?\n\}\n\n\/\* ---------------- capa sobre el mapa/), fs.readFileSync('tools/patch/frag-chrome.ts', 'utf8') + `\n/* ---------------- capa sobre el mapa`);

rep(`function seleccionarHotel(id: string): void {
  hotelSel = id;`, `function seleccionarHotel(id: string): void {
  if (id === 'fontana') { location.hash = 'hoteles/la-fontana'; return; }
  hotelSel = id;`);

rep(`  const base = h.split('-')[0];
  app.dataset.view = base || 'mapa';`, `  const base = h.split('-')[0];
  app.dataset.view = base || 'mapa';
` + fs.readFileSync('tools/patch/frag-go.ts', 'utf8'));

rep(`  if (!S.rol) {
    $('rail').hidden = true; $('topbar').hidden = true; $('page').innerHTML = ''; $('page').className = ''; $('ov').innerHTML = '';
    bim?.cerrar(); $('bim').hidden = true;
    renderLogin();
    void cargarMapa().then((hlf) => {
      pausarMapa(false);
      pines?.show(true);
      hlf.vistaColombia();
    });
    return;
  }
`, '');

// la sidebar NO se oculta en el visor BIM ni en el prototipo 216
rep(`$('topbar').hidden = true; $('rail').hidden = true;
    bim?.cerrar(); $('bim').hidden = true; pausarMapa(true); cerrarHoja();`, `$('topbar').hidden = true; $('rail').hidden = false;
    bim?.cerrar(); $('bim').hidden = true; pausarMapa(true); cerrarHoja();`);
rep(`$('topbar').hidden = true; $('rail').hidden = true;
    pausarMapa(true);
    await abrirBim(`, `$('topbar').hidden = true; $('rail').hidden = false;
    pausarMapa(true);
    await abrirBim(`);

rep(`    case 'cambiarRol': {
      loginChoice = S.rol ?? 'estelar';
      loginEsp = S.espUser || 'arq';
      loginNombre = S.nombreUser || '';
      renderLogin();
      return;
    }`, `    case 'cambiarRol': case 'salir': {
      await desconectarPresencia(); await salir(); S.rol = null; save();
      document.body.classList.remove('con-sesion'); location.hash = 'mapa'; void go();
      return;
    }
    case 'compacta': compacta = !compacta; document.body.classList.toggle('side-compact', compacta); try { localStorage.setItem('baco-side', compacta ? 'compacta' : 'expandida'); } catch { /* */ } renderChrome(); return;`);

const fin = s.lastIndexOf('void go();');
if (fin < 0) { console.error('sin void go final'); process.exit(1); }
s = s.slice(0, fin) + `montarWorkspace($('twin'));
addEventListener('twin:ruta', () => { route = decodeURIComponent(location.hash.slice(1)); renderChrome(); });
alCambiarPresencia((l) => { presentes = l; pintarWho(); });
alCambiarSesion((ev) => { if (ev === 'PASSWORD_RECOVERY') location.hash = 'nueva-clave'; });
void iniciarAuth().then((p) => { if (p) { sincronizarPerfil(); conectarPresencia(p); } void go(); });
` + s.slice(fin + 'void go();'.length);
fs.writeFileSync(p, CRLF ? s.split(String.fromCharCode(10)).join(String.fromCharCode(13, 10)) : s); console.log('ok');
