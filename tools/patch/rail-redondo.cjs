// Vuelve a la barra lateral flotante de iconos redondos (como estaba), conservando las secciones nuevas.
const fs = require('fs'); const p = 'src/app/app.ts';
let s = fs.readFileSync(p, 'utf8'); const CRLF = s.includes('\r\n'); s = s.split('\r\n').join('\n');
function R(a, b) { if (!s.includes(a)) { console.error('NO ENCONTRADO:\n' + a.slice(0, 160)); process.exit(1); } s = s.replace(a, () => b); }
R('<nav class="rail side" id="rail" aria-label="Secciones"></nav>', '<nav class="rail" id="rail" aria-label="Secciones"></nav>');
const ini = s.indexOf("  $('rail').innerHTML = `<div class=\"sb-brand\">");
const fin = s.indexOf("  const m = migasActuales();");
if (ini < 0 || fin < 0) { console.error('no rail block'); process.exit(1); }
s = s.slice(0, ini) + "  $('rail').innerHTML = `<button class=\"logo\" data-act=\"salir\" title=\"${esc(perfil?.nombre ?? '')} · Cerrar sesión\"><img src=\"logos/baco.png\" alt=\"BACO\"></button>`\n"
  + "    + NAV_SEC.flatMap(([, ks]) => ks).map((k) => { const n = NAV.find((x) => x[0] === k); if (!n) return ''; return `<a href=\"#${href(k)}\" ${sec === k ? 'aria-current=\"page\"' : ''} aria-label=\"${n[1]}\">${ic(n[2])}<span class=\"lbl\">${n[1]}</span><span class=\"rtx\">${n[1].split(' ')[0]}</span>${k === 'novedades' && ab ? `<span class=\"dot\">${ab}</span>` : ''}</a>`; }).join('');\n"
  + s.slice(fin);
R("    <button class=\"circle light as-btn\" data-act=\"asAbrir\"", "    <button class=\"circle light\" data-act=\"tema\" aria-label=\"Cambiar tema\" title=\"Modo claro / oscuro\">${ic(oscuro() ? 'sun' : 'moon')}</button>\n    <button class=\"circle light as-btn\" data-act=\"asAbrir\"");
fs.writeFileSync(p, CRLF ? s.split('\n').join('\r\n') : s); console.log('ok');
