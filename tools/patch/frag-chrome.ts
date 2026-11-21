function seccionDe(r: string): string {
  if (r.startsWith('fontana') || r.startsWith('hoteles/la-fontana')) return 'fontana';
  if (r.startsWith('hoteles') || r === '') return 'mapa';
  if (r === 'habitacion-216') return 'habitacion-216';
  const base = r.split('-')[0];
  if (base === 'qr') return 'novedades';
  return base;
}
function migasActuales(): [string, string][] {
  if (route.startsWith('fontana')) return migas();
  if (route === 'hoteles/bogota') return [['Hoteles', '#mapa'], ['Bogotá', '#hoteles/bogota']];
  if (route === 'hoteles/la-fontana') return [['Hoteles', '#mapa'], ['Bogotá', '#hoteles/bogota'], ['La Fontana', '#hoteles/la-fontana']];
  const n = NAV.find(([k]) => k === seccionDe(route));
  if (!n || n[0] === 'mapa') return [['Hoteles', '#mapa']];
  return [['La Fontana', '#hoteles/la-fontana'], [n[1], '#' + route]];
}
function iniciales(n: string): string { return n.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase() || '·'; }
const COL_AV = ['#0E3064', '#8C6F3A', '#2A9D8F', '#9A6BDB', '#C3532D', '#4F6EF0'];
function pintarWho(): void {
  const w = document.getElementById('who'); if (!w) return;
  if (!presentes.length) { w.innerHTML = '<small>Conectando presencia…</small>'; return; }
  const otros = presentes.filter((p) => p.uid !== perfil?.id);
  const lista = [...presentes].sort((a, b) => Number(b.activo) - Number(a.activo));
  w.innerHTML = lista.slice(0, 5).map((p, i) => `<span class="av ${p.activo ? '' : 'inact'}" style="background:${COL_AV[i % COL_AV.length]}" title="${esc(p.nombre)}">${esc(iniciales(p.nombre))}<i></i></span>`).join('')
    + `<small>${otros.length ? otros.length + (otros.length === 1 ? ' persona más' : ' personas más') : 'Solo tú en línea'}</small>
    <div class="pop" role="dialog" aria-label="Personas conectadas"><ul>${lista.map((p) => `<li><b>${esc(p.nombre)}${p.uid === perfil?.id ? ' (tú)' : ''}</b><span>${p.activo ? 'Activo' : 'Inactivo'}</span><small>${esc(ROL_TXT[p.rol as keyof typeof ROL_TXT] ?? p.rol)} · ${p.metodo === 'qr' ? 'QR' : 'cuenta'} · ${esc(p.proyecto)} · ${esc(p.vista || '—')}${p.lugar ? ' · ' + esc(p.lugar) : ''}${p.elemento ? ' · ' + esc(p.elemento) : ''} · última actividad ${new Date(p.ultima).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</small></li>`).join('')}</ul>
    <p class="note">Presencia en tiempo real: solo quien tiene la plataforma abierta ahora. El historial de ingresos es aparte.</p></div>`;
  w.tabIndex = 0;
}
function renderChrome(): void {
  const sec = seccionDe(route);
  const ab = listaNovedades().filter((n) => n.estado !== 'Cerrada').length;
  const href = (k: string) => k === 'bim' ? 'bim-' + (S.espUser || 'arq') : k;
  const item = (k: string) => { const n = NAV.find((x) => x[0] === k); if (!n) return ''; return `<a href="#${href(k)}" ${sec === k ? 'aria-current="page"' : ''} title="${n[1]}">${ic(n[2])}<span class="lbl">${n[1]}</span>${k === 'novedades' && ab ? `<span class="dot">${ab}</span>` : ''}</a>`; };
  $('rail').innerHTML = `<div class="sb-brand"><img src="logos/estelar.png" alt="Hoteles Estelar"><span>Gemelo<br>digital</span></div>`
    + NAV_SEC.map(([t, ks]) => `<div class="sb-sec">${t}</div>` + ks.map(item).join('')).join('')
    + `<div class="sb-foot">
        <div class="sb-user"><span class="av">${esc(iniciales(perfil?.nombre ?? ''))}</span><span class="t"><b>${esc(perfil?.nombre ?? 'Sin sesión')}</b><small>${perfil ? esc(ROL_TXT[perfil.rol]) + ' · ' + (perfil.metodo === 'qr' ? 'QR' : 'cuenta') : ''}</small></span></div>
        <button class="sb-btn" data-act="tema" title="Cambiar tema">${ic(oscuro() ? 'sun' : 'moon')}<span>${oscuro() ? 'Modo claro' : 'Modo oscuro'}</span></button>
        <button class="sb-btn" data-act="compacta" title="${compacta ? 'Expandir' : 'Compactar'} barra">${ic('side')}<span>${compacta ? 'Expandir' : 'Compactar'}</span></button>
        <button class="sb-btn" data-act="salir" title="Cerrar sesión">${ic('logout')}<span>Cerrar sesión</span></button>
      </div>`;
  const m = migasActuales();
  const atras = m.length > 1 ? m[m.length - 2][1] : '';
  $('topbar').innerHTML = `
    <nav class="crumbs" aria-label="Ruta">${atras ? `<a class="bk" href="${atras}" aria-label="Regresar">${ic('back')}</a>` : ''}${m.map(([t, h], i) => (i ? '<span class="sep">/</span>' : '') + `<a href="${h}">${esc(t)}</a>`).join('')}</nav>
    <form class="search" id="fBuscar" role="search">${ic('search')}<input id="q" list="sugerencias" placeholder="Buscar hotel, habitación o novedad…" aria-label="Buscar hotel o habitación"><datalist id="sugerencias">${HOTELES.map((h) => `<option value="${esc(h.nombre)}">`).join('')}${UBICACIONES.map(([, t]) => `<option value="${esc(t)}">`).join('')}</datalist></form>
    <a class="circle light" href="#novedades" aria-label="${ab} novedades abiertas" style="position:relative">${ic('bell')}${ab ? '<i style="position:absolute;top:9px;right:10px;width:8px;height:8px;border-radius:50%;background:var(--coral);border:2px solid var(--card)"></i>' : ''}</a>
    <div class="who" id="who" aria-label="Personas conectadas"></div>`;
  pintarWho();
  if (!route.startsWith('fontana')) informarUbicacion({ vista: NAV.find((x) => x[0] === sec)?.[1] ?? 'Hoteles', lugar: '', elemento: '' });
}
