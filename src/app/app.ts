/* BACO Obra · entrada de la app.
   Flujo: mapa de Colombia con los hoteles Estelar → La Fontana (escena 3D de HLF) → tocar la torre →
   elegir especialidad → modelo 3D del Piso 2 → reportar novedades (también desde QR en obra). */
import './app.css';
import { ESPECIALIDADES, HOTELES, TIPOS, UBICACIONES, type Novedad } from './data';
import { S, save, reset, listaNovedades, cargarNovedades, agregarNovedad, actualizarNovedad, nuevoId, comprimirFoto } from './store';
import { countUp, esc, ic, toast } from './ui';
import { OBRA, cargarObra, marcar, porEsp } from './obra';
import { T, espDe, ubic, vAvance, vEntregables, vHonorarios, vNovedades, vPanel, vPlan, vProveedores, vQR } from './pages';
import type { Bim } from './bim';

interface HLFApi { entrar(): Promise<void>; vistaColombia(d?: number): void; volarA(lon: number, lat: number, alt?: number, dur?: number): void; viewer: { useDefaultRenderLoop: boolean }; readonly modo: 'pais' | 'sitio'; piso2(): void; completo(): void }
const W = window as unknown as { HLF?: HLFApi };

const app = document.getElementById('app')!;
app.innerHTML = `
  <nav class="rail" id="rail" aria-label="Secciones"></nav>
  <div class="topbar" id="topbar"></div>
  <div id="ov"></div>
  <div id="page"></div>
  <div id="bim" hidden></div>
  <div id="layer"></div>`;
const $ = (id: string) => document.getElementById(id)!;

const NAV: [string, string, string][] = [
  ['mapa', 'Hoteles en Colombia', 'globe'], ['obra', 'La Fontana 3D', 'obra'], ['panel', 'Panel', 'panel'], ['plan', 'Planeación', 'plan'],
  ['avance', 'Avance semanal', 'avance'], ['proveedores', 'Proveedores', 'proveedores'], ['novedades', 'Novedades y QR', 'novedades'],
  ['entregables', 'Entregables', 'entregables'], ['honorarios', 'Honorarios', 'honorarios'],
];
const PAGES = ['panel', 'plan', 'avance', 'proveedores', 'novedades', 'qr', 'entregables', 'honorarios'];
let route = ''; let anim = true;
const filtroNov = { esp: 'todas', est: 'abiertas' };
let hotelSel: string | null = null;
let mapOpen = false;

/* ---------------- tema ---------------- */
try { const t = localStorage.getItem('baco-obra-tema'); if (t) document.documentElement.dataset.theme = t; } catch { /* */ }
const oscuro = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);

/* ---------------- mapa (Cesium, carga diferida) ---------------- */
let mapa: Promise<HLFApi> | null = null;
let pines: { show(v: boolean): void } | null = null;
function cargarMapa(): Promise<HLFApi> {
  mapa ??= (async () => {
    $('ov').insertAdjacentHTML('beforeend', '<div class="hint" id="mapLoading" style="animation:none"><span class="pulse"></span>Cargando el mapa de Colombia…</div>');
    await import('../main');
    const [{ crearPinesEstelar }] = await Promise.all([import('../estelar')]);
    const hlf = W.HLF!;
    pines = crearPinesEstelar(hlf.viewer as never, (id) => seleccionarHotel(id));
    document.getElementById('mapLoading')?.remove();
    return hlf;
  })();
  return mapa;
}
function pausarMapa(p: boolean): void { if (W.HLF) W.HLF.viewer.useDefaultRenderLoop = !p; }

function seleccionarHotel(id: string): void {
  hotelSel = id;
  const h = HOTELES.find((x) => x.id === id)!;
  if (location.hash !== '#mapa' && location.hash !== '') { location.hash = 'mapa'; }
  void cargarMapa().then((hlf) => hlf.volarA(h.lon, h.lat, h.obra ? 3500 : 6000));
  renderOv();
}

/* ---------------- visor BIM (three.js, carga diferida) ---------------- */
let bim: Bim | null = null;
let bimEsp = 'coo';
let corte = true, fantasma = true;
async function abrirBim(esp: string): Promise<void> {
  bimEsp = esp;
  if (!bim) {
    const { crearBim } = await import('./bim');
    bim = crearBim($('bim'));
    bim.onReportar = (pos) => { bim!.reportando = false; renderBimUi(); abrirForm({ esp: bimEsp === 'coo' ? 'arq' : bimEsp, pos }); };
    bim.onPin = (id) => abrirDetalle(id);
  }
  renderBimUi();
  await bim.abrir(esp);
  bim.setPins(listaNovedades());
  renderBimUi();
}
function renderBimUi(): void {
  const e = espDe(bimEsp);
  const grupos = e.grupos.includes('*') ? [...(bim?.grupos ?? [])] : e.grupos.filter((g) => bim?.grupos.has(g) ?? true);
  import('./bim').then(({ GRUPOS }) => {
    const host = $('bim');
    host.querySelectorAll('.bimui').forEach((n) => n.remove());
    host.insertAdjacentHTML('beforeend', `
    <div class="bimui bimbar">
      <div class="glass bimtitle" style="padding:10px 18px 10px 10px"><button class="circle" data-act="bimVolver" aria-label="Volver">${ic('back')}</button><div><h2>Piso 2 · ${e.corto}</h2><small>Torre Suites · ${e.desc}</small></div></div>
      <div class="glass espbar">${ESPECIALIDADES.map((x) => `<button data-act="bimEsp" data-v="${x.id}" aria-pressed="${x.id === bimEsp}"><i style="background:${x.c}"></i>${x.corto}</button>`).join('')}</div>
    </div>
    <div class="bimui glass legend"><b style="margin:0 0 2px;color:var(--ink);font-size:13px">Qué estás viendo</b>${grupos.filter((g) => GRUPOS[g]).map((g) => `<div><i style="background:${GRUPOS[g].c}"></i>${GRUPOS[g].n}</div>`).join('')}</div>
    <div class="bimui bimtools">
      <button class="glass tg" data-act="bimCorte" aria-pressed="${corte}"><span class="sw2"></span>Ver por dentro</button>
      <button class="glass tg" data-act="bimFantasma" aria-pressed="${fantasma}"><span class="sw2"></span>Otras especialidades</button>
      <button class="report" data-act="bimReportar" aria-pressed="${!!bim?.reportando}">${ic(bim?.reportando ? 'x' : 'pin', 2)} ${bim?.reportando ? 'Cancelar' : 'Reportar aquí'}</button>
    </div>
    ${bim?.reportando ? '<div class="bimui bimtip">Toca el punto del modelo donde está la novedad</div>' : ''}`);
  });
}

/* ---------------- rail + topbar ---------------- */
function renderChrome(): void {
  const base = route.split('-')[0];
  const ab = listaNovedades().filter((n) => n.estado !== 'Cerrada').length;
  $('rail').innerHTML = `<span class="logo" title="BACO Studio">BS</span>` + NAV.map(([k, l, i]) => `<a href="#${k}" ${base === k || (k === 'mapa' && base === '') || (k === 'novedades' && base === 'qr') ? 'aria-current="page"' : ''} aria-label="${l}">${ic(i)}<span class="lbl">${l}</span>${k === 'novedades' && ab ? `<span class="dot">${ab}</span>` : ''}</a>`).join('');
  $('topbar').innerHTML = `
    <form class="search" id="fBuscar" role="search">${ic('search')}<input id="q" list="sugerencias" placeholder="Buscar hotel o habitación…" aria-label="Buscar hotel o habitación"><datalist id="sugerencias">${HOTELES.map((h) => `<option value="${esc(h.nombre)}">`).join('')}${UBICACIONES.map(([, t]) => `<option value="${esc(t)}">`).join('')}</datalist><button class="circle" type="submit" aria-label="Buscar">${ic('filter')}</button></form>
    <div class="sp"></div>
    <button class="circle light" data-act="tema" aria-label="Cambiar tema">${ic(oscuro() ? 'sun' : 'moon')}</button>
    <a class="circle light" href="#novedades" aria-label="${ab} novedades abiertas" style="position:relative">${ic('bell')}${ab ? '<i style="position:absolute;top:9px;right:10px;width:8px;height:8px;border-radius:50%;background:var(--coral);border:2px solid var(--card)"></i>' : ''}</a>
    <div class="user"><span class="avatar" style="background:linear-gradient(135deg,#E8604F,#F2A07A)">GP</span><span class="t"><b>Gerencia del proyecto</b><small>Torre Suites · Piso 2</small></span></div>`;
}

/* ---------------- capa sobre el mapa ---------------- */
function renderOv(): void {
  const ov = $('ov');
  const loading = document.getElementById('mapLoading');
  if (route === 'mapa' || route === '') {
    const ciudades = [...new Set(HOTELES.map((h) => h.ciudad))];
    const sel = hotelSel ? HOTELES.find((h) => h.id === hotelSel)! : null;
    ov.innerHTML = `
    <aside class="mapcard ${mapOpen ? 'open' : ''}">
      <div class="glass"><h1>Hoteles <b>Estelar</b> en Colombia</h1>
        <div class="kchips"><div><b>${HOTELES.length}</b><small>hoteles</small></div><div><b>${ciudades.length}</b><small>ciudades</small></div><div><b style="color:var(--coral)">1</b><small>en remodelación</small></div></div></div>
      <div class="glass feature"><div class="ph"><img src="img/suite.webp" alt="Render de una suite remodelada"><span class="tag"><i>${ic('build', 2)}</i>Remodelación Torre Suites</span></div>
        <div class="body"><div><b style="font-size:17px">Estelar La Fontana · Bogotá</b><p class="muted" style="font-size:13.5px">Av. Calle 127 No. 15A-10 · piso 2 prototipo</p></div>
        <a class="btn coral block" href="#obra">${ic('obra')} Entrar a La Fontana</a>
        <button class="chip" data-act="toggleLista" style="align-self:center">${mapOpen ? 'Ocultar' : 'Ver'} todos los hoteles</button></div></div>
      <div class="glass hlist">${ciudades.map((c) => `<span class="city">${c}</span>` + HOTELES.filter((h) => h.ciudad === c).map((h) => `<button class="hrow ${h.obra ? 'obra' : ''}" data-act="hotel" data-v="${h.id}" aria-pressed="${hotelSel === h.id}"><span class="pin">${ic(h.obra ? 'build' : 'pin', 2)}</span><span><b>${esc(h.nombre)}</b><small>${esc(h.dir)}</small></span></button>`).join('')).join('')}</div>
    </aside>
    ${sel ? `<aside class="hcard glass"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><p class="muted" style="font-size:12.5px;font-weight:800">${esc(sel.ciudad)}</p><h2 style="font-size:20px;font-weight:800">${esc(sel.nombre)}</h2><p class="muted" style="font-size:13.5px">${esc(sel.dir)}</p></div><button class="circle sm light" data-act="cerrarHotel" aria-label="Cerrar">${ic('x')}</button></div>
      ${sel.obra ? `<span class="pill crit">Remodelación en curso</span><a class="btn coral block" href="#obra">${ic('obra')} Entrar al hotel</a>` : `<span class="pill neu">Sin obra activa</span><p class="muted" style="font-size:13px">Ubicación aproximada por dirección. Solo La Fontana tiene modelo 3D en esta etapa.</p><button class="btn block" data-act="colombia">${ic('globe')} Ver toda Colombia</button>`}</aside>` : ''}`;
  } else if (route === 'obra') {
    ov.innerHTML = `<div class="hint" style="display:flex;gap:12px;align-items:center;white-space:normal;max-width:calc(100vw - 28px)"><span class="pulse"></span><span>Toca la torre que se está remodelando</span>
      <button class="chip" data-act="elegirEsp" style="background:var(--coral);color:#fff">Elegir especialidad</button>
      <button class="chip" data-act="piso2">Piso 2</button><a class="chip" href="#mapa">Colombia</a></div>`;
  } else ov.innerHTML = '';
  if (loading) ov.appendChild(loading);
}

/* ---------------- hojas: especialidad, formulario, detalle ---------------- */
function cerrarHoja(): void { $('layer').innerHTML = ''; }
function hojaEspecialidad(): void {
  $('layer').innerHTML = `<div class="sheetbg" data-act="cerrarHojaFondo"><div class="sheet" role="dialog" aria-label="Elegir especialidad">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><h2>¿Qué especialidad vas a trabajar?</h2><p class="sub">Se abre el modelo 3D del piso 2 con esa especialidad resaltada</p></div><button class="circle light" data-act="cerrarHoja" aria-label="Cerrar">${ic('x')}</button></div>
    <div class="esps">${ESPECIALIDADES.map((e) => `<button class="esp" data-act="irBim" data-v="${e.id}"><span class="eic" style="background:${e.c};${e.id === 'coo' ? 'color:var(--onBlack);background:var(--black)' : ''}">${ic(e.ic, 2)}</span><b>${e.corto}</b><small>${e.desc}</small><span class="pct">${OBRA && e.id !== 'est' && e.id !== 'rci' ? Math.round(porEsp(e.id).real * 100) + '%' : ''}</span></button>`).join('')}</div></div></div>`;
}

interface FormState { loc: string; esp: string; tipo: string; prio: 'Alta' | 'Media' | 'Baja'; txt: string; quien: string; foto?: string; pos?: [number, number, number] }
let form: FormState | null = null; let formSolo = false;
function abrirForm(p: Partial<FormState> = {}, solo = false): void {
  let quien = ''; try { quien = localStorage.getItem('baco-obra-quien') || ''; } catch { /* */ }
  form = { loc: 'HAB-216', esp: 'arq', tipo: 'Avance', prio: 'Media', txt: '', quien, ...p };
  formSolo = solo;
  renderForm();
}
function renderForm(): void {
  if (!form) return;
  const f = form;
  const html = `<form class="sheet" id="fNov" role="dialog" aria-label="Reportar novedad">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><h2>Reportar novedad</h2><p class="sub">${f.pos ? 'Punto marcado en el modelo 3D' : 'Piso 2 · Torre Suites'}</p></div>${formSolo ? `<a class="circle light" href="#panel" aria-label="Abrir la app">${ic('panel')}</a>` : `<button type="button" class="circle light" data-act="cerrarHoja" aria-label="Cerrar">${ic('x')}</button>`}</div>
    <div><label class="label" for="nLoc">Ubicación</label><select class="field" id="nLoc">${UBICACIONES.map(([k, t]) => `<option value="${k}" ${k === f.loc ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
    <div><span class="label">Especialidad</span><div class="chiprow">${ESPECIALIDADES.filter((e) => e.id !== 'coo').map((e) => `<button type="button" class="chip" data-act="fv" data-k="esp" data-v="${e.id}" aria-pressed="${f.esp === e.id}"><span class="sw" style="background:${e.c}"></span>${e.corto}</button>`).join('')}</div></div>
    <div><span class="label">Tipo</span><div class="chiprow">${TIPOS.map((t) => `<button type="button" class="chip" data-act="fv" data-k="tipo" data-v="${t}" aria-pressed="${f.tipo === t}">${t}</button>`).join('')}</div></div>
    <div><label class="label" for="nTxt">¿Qué pasa?</label><textarea class="field" id="nTxt" placeholder="Ej.: El desagüe del lavamanos choca con la viga">${esc(f.txt)}</textarea></div>
    <label class="photo-in" for="nFoto">${f.foto ? `<img src="${f.foto}" alt="Foto adjunta">` : ic('camera', 1.8)}<span><b>${f.foto ? 'Cambiar foto' : 'Tomar o subir foto'}</b><br><small class="muted">Se reduce a 1280 px antes de guardarse</small></span><input id="nFoto" type="file" accept="image/*" capture="environment" hidden></label>
    <div><span class="label">Prioridad</span><div class="chiprow">${(['Alta', 'Media', 'Baja'] as const).map((p) => `<button type="button" class="chip" data-act="fv" data-k="prio" data-v="${p}" aria-pressed="${f.prio === p}">${p}</button>`).join('')}</div></div>
    <div><label class="label" for="nQuien">Quién reporta</label><input class="field" id="nQuien" value="${esc(f.quien)}" placeholder="Nombre o empresa"></div>
    <button class="btn teal block" type="submit" style="padding:15px">${ic('check', 2.4)} Enviar novedad</button>
  </form>`;
  $('layer').innerHTML = formSolo ? `<div class="solo">${html}</div>` : `<div class="sheetbg" data-act="cerrarHojaFondo">${html}</div>`;
}
function leerForm(): void {
  if (!form) return;
  const g = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';
  form.loc = g('nLoc') || form.loc; form.txt = g('nTxt'); form.quien = g('nQuien');
}
function abrirDetalle(id: string): void {
  const n = listaNovedades().find((x) => x.id === id); if (!n) return;
  const e = espDe(n.esp);
  $('layer').innerHTML = `<div class="sheetbg" data-act="cerrarHojaFondo"><div class="sheet" role="dialog" aria-label="Novedad ${esc(n.id)}">
    <div style="display:flex;justify-content:space-between;gap:10px"><div><p class="muted" style="font-weight:800;font-size:13px">${esc(n.id)} · ${esc(ubic(n.loc))}</p><h2>${esc(n.txt)}</h2></div><button class="circle light" data-act="cerrarHoja" aria-label="Cerrar">${ic('x')}</button></div>
    ${n.foto ? `<img src="${n.foto}" alt="Foto de la novedad" style="width:100%;border-radius:18px;max-height:340px;object-fit:cover">` : ''}
    <div class="chiprow"><span class="pill neu" style="background:${e.c};color:#fff">${e.corto}</span><span class="pill neu">${esc(n.tipo)}</span><span class="pill ${{ Alta: 'crit', Media: 'warn', Baja: 'ok' }[n.prio]}">${n.prio}</span><span class="pill neu">${esc(n.quien)}</span><span class="pill neu">${new Date(n.ts).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</span>${n.ej ? '<span class="pill ex">ejemplo</span>' : ''}</div>
    <div><span class="label">Estado</span><div class="seg">${(['Abierta', 'En revisión', 'Cerrada'] as const).map((s) => `<button data-act="setEstado" data-id="${esc(n.id)}" data-v="${s}" aria-pressed="${n.estado === s}">${s}</button>`).join('')}</div></div></div></div>`;
}

/* ---------------- render de rutas ---------------- */
function renderPage(): void {
  const page = $('page');
  const base = route.split('-')[0];
  if (!PAGES.includes(base)) { page.innerHTML = ''; page.className = ''; return; }
  const html = base === 'panel' ? vPanel() : base === 'plan' ? vPlan() : base === 'avance' ? vAvance() : base === 'proveedores' ? vProveedores()
    : base === 'novedades' ? vNovedades(filtroNov) : base === 'qr' ? vQR() : base === 'entregables' ? vEntregables() : vHonorarios();
  const y = page.scrollTop;
  page.className = 'page';
  page.innerHTML = `<div class="wrap ${anim ? 'anim' : ''}">${html}</div>`;
  if (anim) { countUp(page); page.scrollTop = 0; } else page.scrollTop = y;
  anim = false;
  if (base === 'qr') void pintarQR();
  if (route.startsWith('plan-')) document.getElementById(route)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
async function pintarQR(): Promise<void> {
  const QR = (await import('qrcode')).default;
  const base = location.origin + location.pathname;
  document.querySelectorAll<HTMLImageElement>('img[data-qr]').forEach(async (img) => {
    img.src = await QR.toDataURL(`${base}#reportar-${img.dataset.qr}`, { margin: 1, width: 260, color: { dark: '#16202B', light: '#FFFFFF' } });
  });
}

async function go(): Promise<void> {
  const h = decodeURIComponent(location.hash.slice(1));
  route = h; anim = true;
  const base = h.split('-')[0];
  // formulario abierto desde un QR: solo el formulario, sin cargar el mapa
  if (base === 'reportar') {
    const loc = h.slice(9);
    $('rail').hidden = true; $('topbar').hidden = true; $('page').innerHTML = ''; $('ov').innerHTML = '';
    abrirForm({ loc: UBICACIONES.some((u) => u[0] === loc) ? loc : 'COR' }, true);
    return;
  }
  $('rail').hidden = false; $('topbar').hidden = false;
  if (formSolo) { formSolo = false; form = null; cerrarHoja(); }
  renderChrome();
  if (base === 'bim') {
    $('page').innerHTML = ''; $('page').className = ''; $('ov').innerHTML = ''; $('topbar').hidden = true; $('rail').hidden = true;
    pausarMapa(true);
    await abrirBim(h.slice(4) || 'coo');
    return;
  }
  bim?.cerrar(); $('bim').hidden = true;
  if (PAGES.includes(base)) { pausarMapa(true); renderOv(); renderPage(); return; }
  $('page').innerHTML = ''; $('page').className = '';
  pausarMapa(false);
  renderOv();
  const hlf = await cargarMapa();
  pausarMapa(false);
  if (base === 'obra') { pines?.show(false); void hlf.entrar(); }
  else { pines?.show(true); if (hlf.modo === 'sitio' && !hotelSel) hlf.vistaColombia(); }
}

/* ---------------- eventos ---------------- */
app.addEventListener('click', async (ev) => {
  const t = ev.target as HTMLElement;
  const b = t.closest<HTMLElement>('[data-act]'); if (!b) return;
  const a = b.dataset.act!, v = b.dataset.v ?? '';
  if (b.tagName === 'INPUT') return;
  switch (a) {
    case 'cerrarHojaFondo': if (t === b) { cerrarHoja(); form = null; } return;
    case 'cerrarHoja': cerrarHoja(); form = null; return;
    case 'hotel': seleccionarHotel(v); return;
    case 'cerrarHotel': hotelSel = null; renderOv(); return;
    case 'colombia': hotelSel = null; renderOv(); (await cargarMapa()).vistaColombia(); return;
    case 'toggleLista': mapOpen = !mapOpen; renderOv(); return;
    case 'elegirEsp': hojaEspecialidad(); return;
    case 'piso2': W.HLF?.piso2(); return;
    case 'irBim': cerrarHoja(); location.hash = 'bim-' + v; return;
    case 'abrirBim': location.hash = 'bim-' + v; return;
    case 'bimEsp': bimEsp = v; history.replaceState(null, '', '#bim-' + v); route = 'bim-' + v; void bim?.abrir(v).then(renderBimUi); renderBimUi(); return;
    case 'bimVolver': location.hash = W.HLF ? 'obra' : 'panel'; return;
    case 'bimCorte': corte = !corte; bim?.setCorte(corte); renderBimUi(); return;
    case 'bimFantasma': fantasma = !fantasma; bim?.setFantasma(fantasma); renderBimUi(); return;
    case 'bimReportar': if (bim) { bim.reportando = !bim.reportando; renderBimUi(); } return;
    case 'tema': { const d = oscuro() ? 'light' : 'dark'; document.documentElement.dataset.theme = d; try { localStorage.setItem('baco-obra-tema', d); } catch { /* */ } renderChrome(); return; }
    case 'reportar': abrirForm(); return;
    case 'qrProbar': abrirForm({ loc: v }); return;
    case 'imprimir': window.print(); return;
    case 'fv': if (form) { leerForm(); (form as unknown as Record<string, string>)[b.dataset.k!] = v; renderForm(); } return;
    case 'novEstado': case 'setEstado': {
      const n = listaNovedades().find((x) => x.id === (b.dataset.id ?? v)); if (!n) return;
      const seq = ['Abierta', 'En revisión', 'Cerrada'] as const;
      const nuevo = a === 'setEstado' ? (v as Novedad['estado']) : seq[(seq.indexOf(n.estado) + 1) % 3];
      await actualizarNovedad(n.id, { estado: nuevo }); toast(`${n.id} → ${nuevo}`);
      if (a === 'setEstado') abrirDetalle(n.id);
      bim?.setPins(listaNovedades()); renderChrome(); renderPage(); return;
    }
    case 'novVer3d': { const n = listaNovedades().find((x) => x.id === v); if (n) location.hash = 'bim-' + n.esp; return; }
    case 'verFoto': { const n = listaNovedades().find((x) => x.id === v); if (n) abrirDetalle(n.id); return; }
    case 'fEsp': filtroNov.esp = v; renderPage(); return;
    case 'fEst': filtroNov.est = v; renderPage(); return;
    case 'lightbox': $('layer').innerHTML = `<div class="lightbox" data-act="cerrarHoja"><img src="${['img/suite.webp', 'img/bano.webp', 'img/axo.webp'][S.img]}" alt="Render"><button class="circle light" aria-label="Cerrar">${ic('x')}</button></div>`; return;
  }
  // acciones que cambian el estado y vuelven a pintar la página
  if (a === 'mes') S.mes = Math.max(1, Math.min(T(), S.mes + +v));
  else if (a === 'obra') { S.obra = +v; if (S.mes > T()) S.mes = T(); }
  else if (a === 'modo') S.modo = v as 'solo' | 'integrado';
  else if (a === 'iva') S.iva = v === '1';
  else if (a === 'chart') S.chart = v as 'bar' | 'line';
  else if (a === 'img') S.img = +v;
  else if (a === 'semana') S.semana = +v;
  else if (a === 'provEstado') { const p = S.prov[+v]; const seq = ['Por contratar', 'En evaluación', 'Contratado'] as const; p.estado = seq[(seq.indexOf(p.estado) + 1) % 3]; toast(`${p.nombre}: ${p.estado}`); }
  else if (a === 'provAvance') { const p = S.prov[+v]; p.avance = Math.min(100, p.avance + 10); }
  else if (a === 'reset') { reset(); toast('Datos de ejemplo restablecidos'); }
  else return;
  save(); anim = ['mes', 'obra', 'modo', 'chart', 'semana'].includes(a); renderPage();
});
app.addEventListener('change', async (ev) => {
  const t = ev.target as HTMLInputElement;
  if (t.id === 'nFoto' && t.files?.[0] && form) {
    leerForm();
    try { form.foto = await comprimirFoto(t.files[0]); } catch { toast('No se pudo leer la foto. Prueba con otra.'); }
    renderForm(); return;
  }
  const a = t.dataset.act;
  if (a === 'ent') S.ent[t.dataset.v!] = t.checked ? 1 : 0;
  else if (a === 'act') S.act[+t.dataset.v!] = t.checked ? 1 : 0;
  else if (a === 'hecho') { marcar(t.dataset.v!, t.checked); toast(t.checked ? 'Actividad marcada como terminada' : 'Actividad reabierta'); }
  else return;
  save(); renderPage();
});
app.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const f = ev.target as HTMLFormElement;
  if (f.id === 'fBuscar') {
    const q = (document.getElementById('q') as HTMLInputElement).value.trim().toLowerCase(); if (!q) return;
    const h = HOTELES.find((x) => x.nombre.toLowerCase().includes(q) || x.ciudad.toLowerCase().includes(q));
    if (h) { seleccionarHotel(h.id); return; }
    const u = UBICACIONES.find(([k, t]) => t.toLowerCase().includes(q) || k.toLowerCase().includes(q));
    if (u) { abrirForm({ loc: u[0] }); return; }
    toast('No encontré ese hotel ni esa habitación'); return;
  }
  if (f.id === 'fNov' && form) {
    leerForm();
    if (!form.txt.trim()) { toast('Escribe qué pasa para enviar la novedad'); document.getElementById('nTxt')?.focus(); return; }
    try { localStorage.setItem('baco-obra-quien', form.quien); } catch { /* */ }
    const n: Novedad = { id: nuevoId(), ts: Date.now(), loc: form.loc, esp: form.esp, tipo: form.tipo, prio: form.prio, txt: form.txt.trim(), quien: form.quien.trim() || 'Sin nombre', estado: 'Abierta', foto: form.foto, pos: form.pos };
    await agregarNovedad(n);
    const solo = formSolo;
    form = null;
    if (solo) {
      $('layer').innerHTML = `<div class="solo"><div class="sheet" style="align-items:center;text-align:center;gap:14px"><span class="badge" style="width:72px;height:72px;background:var(--teal)">${ic('check', 3)}</span><h2>Novedad ${esc(n.id)} enviada</h2><p class="sub">${esc(ubic(n.loc))} · ${esc(espDe(n.esp).corto)}</p><button class="btn teal block" data-act="otraVez">Reportar otra</button><a class="btn block" href="#panel">Abrir la app</a></div></div>`;
      formSolo = true;
    } else { cerrarHoja(); toast(`Novedad ${n.id} registrada`); }
    bim?.setPins(listaNovedades()); renderChrome(); renderPage();
  }
});
$('layer').addEventListener('click', (ev) => {
  // la capa de hojas está dentro de #app, pero "otraVez" necesita la ubicación del QR
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-act="otraVez"]');
  if (b) { ev.stopPropagation(); void go(); }
});
addEventListener('hlf:hotel', () => { if (route === 'obra') hojaEspecialidad(); });
addEventListener('hashchange', () => void go());
addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('layer').innerHTML && !formSolo) { cerrarHoja(); form = null; } });

void cargarObra().then(() => { if (PAGES.includes(route.split('-')[0])) { anim = true; renderPage(); } });
void cargarNovedades().then(() => { renderChrome(); if (PAGES.includes(route.split('-')[0])) renderPage(); });
void go();
