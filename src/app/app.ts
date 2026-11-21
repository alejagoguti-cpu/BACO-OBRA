/* BACO Obra · entrada de la app.
   Flujo: mapa de Colombia con los hoteles Estelar → La Fontana (escena 3D de HLF) → tocar la torre →
   elegir especialidad → modelo 3D del Piso 2 → reportar novedades (también desde QR en obra). */
import './app.css';
import { ESPECIALIDADES, HOTELES, TIPOS, UBICACIONES, type Novedad } from './data';
import { S, save, reset, compartido, listaNovedades, cargarNovedades, agregarNovedad, actualizarNovedad, nuevoId, comprimirFoto } from './store';
import { countUp, esc, ic, toast } from './ui';
import { OBRA, cargarObra, marcar, porEsp, porHab, porFrente, realAct, fechaCorta, total as totalObra } from './obra';
import { T, espDe, ubic, vAvance, vEntregables, vHonorarios, vPanel, vProveedores, vQR, vAsistente, responderIA, WA_LOG_SEED, type WaEntry, rowNov } from './pages';
import type { Bim } from './bim';
import './shell.css';
import { iniciarAuth, perfil, salir, alCambiarSesion, ROL_TXT } from './auth';
import { mostrarAcceso, cerrarAcceso, mostrarAprobacion, mostrarNuevaClave } from './login';
import { conectarPresencia, desconectarPresencia, alCambiarPresencia, informarUbicacion, type Presente } from './presence';
import { vChat, preguntar, alCambiarChat } from './asistente';
import { iniciarPersonal, alCambiarPersonal } from './personal';
import { vEquipo, cargarEquipo, pintarQrsEquipo, eventoEquipo, crearCuenta, mostrarCheckin } from './equipo';
import { vResumen, montarResumen, detalleKpi, enviarAvance, validar, F as FR } from './resumen';
import { iniciarAvance, alCambiarAvance } from './avance';
import { filtro as filtroNovUI } from '../twin/nov-ui';
import { iniciarNovedades, alCambiarNovedades, detenerNovedades } from './novedades';
import { parseRuta } from '../twin/rutas';
// el visor three.js del gemelo (planta, novedades, interior) se descarga solo al entrar a esas vistas
type WS = typeof import('../twin/workspace');
let ws: WS | null = null;
let wsCargando: Promise<WS> | null = null;
function cargarWS(): Promise<WS> { wsCargando ??= import('../twin/workspace').then((m) => { ws = m; m.montarWorkspace(document.getElementById('twin')!); return m; }); return wsCargando; }
const ocultarWorkspace = () => ws?.ocultarWorkspace();
const migas = (): [string, string][] => ws?.migas() ?? [['Hoteles', '#mapa']];

interface HLFApi { precargar(): void; explotar(): void; recomponer(): void; readonly explotado: boolean; entrar(): Promise<void>; vistaColombia(d?: number): void; volarA(lon: number, lat: number, alt?: number, dur?: number): void; viewer: { useDefaultRenderLoop: boolean }; readonly modo: 'pais' | 'sitio'; piso2(): void; completo(): void }
const W = window as unknown as { HLF?: HLFApi };

const app = document.getElementById('app')!;
app.innerHTML = `
  <nav class="rail" id="rail" aria-label="Secciones"></nav>
  <div class="topbar" id="topbar"></div>
  <div id="ov"></div>
  <div id="page"></div>
  <div id="bim" hidden></div>
  <div id="prototype"></div>
  <div id="twin" hidden></div>
  <div id="asisPanel" hidden></div>
  <div id="layer"></div>`;
const $ = (id: string) => document.getElementById(id)!;

const NAV: [string, string, string][] = [
  ['mapa', 'Hoteles Colombia', 'globe'], ['fontana', 'Gemelo La Fontana', 'cube'], ['plan', 'Planeación', 'plan'], ['bim', 'Modelo BIM', 'obra'],
  ['novedades', 'Novedades', 'pin'], ['qr', 'Códigos QR', 'qr'], ['habitacion-216', 'Habitación 216', 'eye'],
  ['resumen', 'Resumen', 'panel'], ['asistente', 'Asistente', 'spark'], ['equipo', 'Equipo', 'user'],
];
const NAV_SEC: [string, string[]][] = [['Exploración espacial', ['mapa', 'fontana', 'bim', 'habitacion-216']], ['Gestión de obra', ['novedades', 'resumen', 'asistente', 'plan', 'equipo', 'qr']]];
let compacta = false; try { compacta = localStorage.getItem('baco-side') === 'compacta'; } catch { /* */ }
document.body.classList.toggle('side-compact', compacta);
let presentes: Presente[] = [];
const PAGES = ['equipo', 'asistente', 'resumen', 'panel', 'ia', 'plan', 'avance', 'proveedores', 'novedades', 'qr', 'entregables', 'honorarios'];
let route = ''; let anim = true;
let disposePrototype: (() => void) | null = null;
const filtroNov = { esp: 'todas', est: 'abiertas', q: '' };
let habFiltro = '';
let hotelSel: string | null = null;
let mapOpen = false;
let corteH = 6.15;
let bimLayersOpen = false;
let pendingPinFocus: [number, number, number] | null = null;
let piso2Open = false;
let modo360 = false;
const waLog: WaEntry[] = WA_LOG_SEED.map((w) => ({ ...w }));
const aiChat: { q: string; resp: string; fuente: string; accion?: [string, string, string] }[] = [];

/* ---------------- tema ---------------- */
try { const t = localStorage.getItem('baco-obra-tema'); if (t) document.documentElement.dataset.theme = t; } catch { /* */ }
const oscuro = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);

/* ---------------- mapa (Cesium, carga diferida) ---------------- */
let mapa: Promise<HLFApi> | null = null;
let pines: { show(v: boolean): void } | null = null;
let est: typeof import('../estelar') | null = null;
let ciudadSel: string | null = null;
let entradaHecha = false; let enRecorrido = false; let ciudadCine: string | null = null;
function cargarMapa(): Promise<HLFApi> {
  mapa ??= (async () => {
    $('ov').insertAdjacentHTML('beforeend', '<div class="map-cloud map-load" id="mapLoading" role="status"><div class="ml-box"><img src="logos/estelar.png" alt=""><b>Hoteles Estelar en Colombia</b><i class="ml-bar"><i></i></i><small>Cargando mapa satelital…</small></div></div>');
    await import('../main');
    est = await import('../estelar');
    const { crearPinesEstelar } = est;
    const hlf = W.HLF!;
    pines = crearPinesEstelar(hlf.viewer as never, (id) => seleccionarHotel(id));
    // la pantalla de carga se queda hasta que el globo tenga sus imágenes (sin parpadeo negro)
    await new Promise<void>((res) => {
      const g = (hlf.viewer as unknown as { scene: { globe: { tilesLoaded: boolean; tileLoadProgressEvent: { addEventListener(f: (n: number) => void): () => void } } } }).scene.globe;
      let quitar: (() => void) | null = null; const fin = () => { quitar?.(); clearTimeout(t); res(); };
      const t = setTimeout(fin, 9000);
      quitar = g.tileLoadProgressEvent.addEventListener((n) => { if (n === 0 && g.tilesLoaded) setTimeout(fin, 600); });
    });
    const ld = document.getElementById('mapLoading'); if (ld) { ld.style.transition = 'opacity .7s ease'; ld.style.opacity = '0'; setTimeout(() => ld.remove(), 750); }
    setTimeout(() => hlf.precargar(), 5500);
    return hlf;
  })();
  return mapa;
}
function pausarMapa(p: boolean): void { if (W.HLF) W.HLF.viewer.useDefaultRenderLoop = !p; }

function seleccionarHotel(id: string): void {
  if (id === 'fontana') { location.hash = 'hoteles/la-fontana'; return; }
  hotelSel = id;
  const h = HOTELES.find((x) => x.id === id)!;
  ciudadSel = h.ciudad;
  if (location.hash !== '#mapa' && location.hash !== '') { location.hash = 'mapa'; }
  void cargarMapa().then((hlf) => { est?.detenerCine(hlf.viewer as never); enRecorrido = false; hlf.volarA(h.lon, h.lat, h.obra ? 3500 : 6000); });
  renderOv();
}

/* ---------------- visor BIM (three.js, carga diferida) ---------------- */
let bim: Bim | null = null;
let bimEsp = 'coo';
let corte = true, fantasma = false;
let guiaVista = true;

/* ---------------- guía de pasos con flechas ---------------- */
const PASOS: [string, string][] = [['Hoteles', 'mapa'], ['Planeación', 'plan'], ['Modelo BIM', `bim-${S.espUser || 'arq'}`], ['Novedades', 'novedades'], ['Habitaciones', 'habitacion-216']];
function pasos(n: number, extra = ''): string {
  return `<nav class="pasos glass ${extra}" aria-label="Pasos">${PASOS.map(([t, h], k) => {
    const cls = `paso ${k < n ? 'hecho' : k === n ? 'actual' : ''}`;
    const inner = `<span class="pnum">${k < n ? ic('check', 3) : k + 1}</span><span class="ptx">${t}</span>`;
    return (k ? `<span class="pchev">${ic('chev', 2.4)}</span>` : '') + (h ? `<a href="#${h}" class="${cls}">${inner}</a>` : `<span class="${cls}">${inner}</span>`);
  }).join('')}</nav>`;
}
async function abrirBim(esp: string): Promise<void> {
  bimEsp = esp;
  if (!bim) {
    const { crearBim, GRUPOS } = await import('./bim');
    bim = crearBim($('bim'));
    bim.onReportar = (pos, g) => {
      bim!.reportando = false; renderBimUi();
      const espSugerida = bimEsp !== 'coo' ? bimEsp : (ESPECIALIDADES.find((x) => x.id !== 'coo' && x.grupos.includes(g))?.id ?? 'arq');
      abrirForm({ esp: espSugerida, pos, txt: GRUPOS[g] ? `${GRUPOS[g].n}: ` : '' });
    };
    bim.onPin = (id) => abrirDetalle(id);
    bim.onHover = (g) => {
      const el = document.getElementById('bimHoverBadge');
      if (el) {
        el.textContent = g && GRUPOS[g] ? `Elemento: ${GRUPOS[g].n}` : '';
        el.hidden = !g;
      }
      document.querySelectorAll<HTMLElement>('.legend button[data-g]').forEach((b) => {
        b.classList.toggle('hov', b.dataset.g === g);
      });
    };
  }
  renderBimUi();
  await bim.abrir(esp);
  bim.setPins(listaNovedades());
  if (pendingPinFocus) {
    bim.enfocar(pendingPinFocus);
    pendingPinFocus = null;
  }
  renderBimUi();
}
function renderBimUi(): void {
  const e = espDe(bimEsp);
  const grupos = e.grupos.includes('*') ? [...(bim?.grupos ?? [])] : e.grupos.filter((g) => bim?.grupos.has(g) ?? true);
  const pinsVis = listaNovedades().filter((n) => n.pos).length;
  import('./bim').then(({ GRUPOS }) => {
    const host = $('bim');
    host.querySelectorAll('.bimui').forEach((n) => n.remove());
    const hayOcultos = (bim?.ocultos.size ?? 0) > 0;
    host.insertAdjacentHTML('beforeend', `
    <div class="bimui bimbar">
      <div class="glass bimtitle" style="padding:10px 18px 10px 10px"><button class="bim-back" data-act="bimVolver" aria-label="Volver a planeación">${ic('back')}<span>Planeación</span></button><div><h2>Piso 2 · ${e.corto}</h2><small>Torre Suites · ${e.desc}</small></div><img class="bim-logo" src="logos/estelar.png" alt="Hoteles Estelar"></div>
      ${pasos(bim?.reportando ? 3 : 2, 'bimpasos')}
      <div class="glass espbar">${ESPECIALIDADES.map((x) => `<button data-act="bimEsp" data-v="${x.id}" aria-pressed="${x.id === bimEsp}"><i style="background:${x.c}"></i>${x.corto}</button>`).join('')}</div>
    </div>
    <div class="bimui glass legend ${bimLayersOpen ? 'expanded' : ''}">
      <button class="bim-legend-toggle" data-act="toggleBimLayers" aria-expanded="${bimLayersOpen}">${ic('layers')} Capas del modelo <span>${grupos.length} grupos</span>${ic('down')}</button>
      <div class="legend-body"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:2px"><b style="margin:0;color:var(--ink);font-size:13px">Toca para aislar</b>${hayOcultos ? `<button class="chip" data-act="bimResetGrupos" style="padding:3px 9px;font-size:11.5px">Ver todas</button>` : ''}</div>
      ${grupos.filter((g) => GRUPOS[g]).map((g) => {
        const oc = bim?.ocultos.has(g) ?? false;
        return `<button type="button" class="leg-btn ${oc ? 'off' : ''}" data-act="bimToggleGrupo" data-v="${g}" data-g="${g}" aria-pressed="${!oc}"><i style="background:${GRUPOS[g].c}"></i><span>${GRUPOS[g].n}</span></button>`;
      }).join('')}
      ${pinsVis ? `<div style="border-top:1px solid var(--line);padding-top:6px;margin-top:2px;font-size:12px;color:var(--muted)">${ic('pin', 1.8)} ${pinsVis} ${pinsVis === 1 ? 'novedad ubicada' : 'novedades ubicadas'} en 3D</div>` : ''}</div>
    </div>
    <div id="bimHoverBadge" class="bimui glass bimhover" hidden></div>
    <div class="bimui bimtools">
      <div style="display:flex;gap:8px">
        <button class="circle light" data-act="bimResetCam" title="Centrar cámara" aria-label="Centrar cámara">${ic('area')}</button>
        <button class="circle light" data-act="guiaToggle" title="Ayuda del visor 3D" aria-label="Ayuda del visor 3D">${ic('help')}</button>
      </div>
      ${corte ? `<label class="glass tg" style="padding:8px 14px;gap:8px;font-size:12.5px"><span>Altura corte</span><input type="range" id="rCorteH" min="3.1" max="6.6" step="0.05" value="${corteH}" style="width:90px;accent-color:var(--teal)"></label>` : ''}
      <button class="glass tg" data-act="bimCorte" aria-pressed="${corte}"><span class="sw2"></span>Ver por dentro</button>
      <button class="glass tg" data-act="bimFantasma" aria-pressed="${fantasma}"><span class="sw2"></span>Otras especialidades</button>
      <button class="report" data-act="bimReportar" aria-pressed="${!!bim?.reportando}">${ic(bim?.reportando ? 'x' : 'pin', 2)} ${bim?.reportando ? 'Cancelar' : 'Reportar aquí'}</button>
    </div>
    ${!guiaVista ? `<div class="bimui coach">
      <div class="cm cm1"><span class="cmar up">${ic('down', 2.6)}</span><b>1 · Cambia de especialidad</b><small>Arriba eliges qué red quieres ver y abajo a la izquierda puedes encender o apagar capas</small></div>
      <div class="cm cm2"><span class="cmic">${ic('tap', 2)}</span><b>2 · Gira y acerca</b><small>Arrastra para girar · rueda o pellizco para acercar</small></div>
      <div class="cm cm3"><b>3 · Reporta una novedad</b><small>Toca el botón rojo y luego el punto exacto del modelo</small><span class="cmar">${ic('down', 2.6)}</span></div>
      <button class="btn pri" data-act="guiaOk">Entendido ${ic('check', 2.6)}</button></div>` : ''}
    ${bim?.reportando ? `<div class="bimui bimtip">${ic('tap', 2)} Toca el punto del modelo donde está la novedad (Esc para cancelar)</div>` : ''}`);
  });
}

/* ---------------- portal de acceso (login Estelar vs. Contratistas) ---------------- */
let loginChoice: 'estelar' | 'contratista' = S.rol ?? 'estelar';
let loginEsp = S.espUser || 'arq';


function renderLogin(): void {
  mostrarAcceso($('layer'), () => { void trasLogin(); });
}
async function trasLogin(): Promise<void> {
  cerrarAcceso();
  sincronizarPerfil();
  if (perfil) { conectarPresencia(perfil); void iniciarNovedades(); void iniciarAvance(); void iniciarPersonal(); void cargarEquipo().then(() => { if (route === 'equipo') renderPage(); }); toast(`Sesión iniciada · ${perfil.nombre}`); }
  $('layer').innerHTML = '';
  let pend = ''; try { pend = sessionStorage.getItem('baco-qr-pendiente') || ''; sessionStorage.removeItem('baco-qr-pendiente'); } catch { /* */ }
  const actual = location.hash.slice(1);
  const destino = pend ? 'qr-aprobar/' + pend : actual && !actual.startsWith('qr-') && actual !== 'nueva-clave' ? actual : 'mapa';
  if (location.hash === '#' + destino) void go(); else location.hash = destino;
}
function sincronizarPerfil(): void {
  if (!perfil) { S.rol = null; return; }
  S.rol = perfil.rol === 'contratista' ? 'contratista' : 'estelar';
  S.nombreUser = perfil.nombre;
  save();
}

/* ---------------- rail + topbar ---------------- */

function seccionDe(r: string): string {
  if (/^fontana\/\d{3}\/gemelo/.test(r)) return 'habitacion-216';
  if (r.startsWith('fontana') || r.startsWith('hoteles/la-fontana')) return 'fontana';
  if (r.startsWith('hoteles') || r === '') return 'mapa';
  if (r === 'habitacion-216') return 'habitacion-216';
  const base = r.split('-')[0];
  if (base === 'qr') return 'qr';
  if (r.startsWith('novedades')) return 'novedades';
  return base;
}
function migasActuales(): [string, string][] {
  if (parseRuta(route)) return migas();
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
  const href = (k: string) => k === 'bim' ? 'bim-' + (S.espUser || 'arq') : k === 'fontana' ? 'hoteles/la-fontana' : k === 'habitacion-216' ? 'fontana/216/gemelo' : k;
  $('rail').innerHTML = `<button class="logo" data-act="salir" title="${esc(perfil?.nombre ?? '')} · Cerrar sesión"><img src="logos/baco.png" alt="BACO"></button>`
    + NAV_SEC.flatMap(([, ks]) => ks).map((k) => { const n = NAV.find((x) => x[0] === k); if (!n) return ''; return `<a href="#${href(k)}" ${sec === k ? 'aria-current="page"' : ''} aria-label="${n[1]}">${ic(n[2])}<span class="lbl">${n[1]}</span><span class="rtx">${n[1].split(' ')[0]}</span>${k === 'novedades' && ab ? `<span class="dot">${ab}</span>` : ''}</a>`; }).join('');
  const m = migasActuales();
  const atras = m.length > 1 ? m[m.length - 2][1] : '';
  $('topbar').innerHTML = `
    <nav class="crumbs" aria-label="Ruta">${atras ? `<a class="bk" href="${atras}" aria-label="Regresar">${ic('back')}</a>` : ''}${m.map(([t, h], i) => (i ? '<span class="sep">/</span>' : '') + `<a href="${h}">${esc(t)}</a>`).join('')}</nav>
    <form class="search" id="fBuscar" role="search">${ic('search')}<input id="q" list="sugerencias" placeholder="Buscar hotel, habitación o novedad…" aria-label="Buscar hotel o habitación"><datalist id="sugerencias">${HOTELES.map((h) => `<option value="${esc(h.nombre)}">`).join('')}${UBICACIONES.map(([, t]) => `<option value="${esc(t)}">`).join('')}</datalist></form>
    <a class="circle light" href="#novedades" aria-label="${ab} novedades abiertas" style="position:relative">${ic('bell')}${ab ? '<i style="position:absolute;top:9px;right:10px;width:8px;height:8px;border-radius:50%;background:var(--coral);border:2px solid var(--card)"></i>' : ''}</a>
    <button class="circle light" data-act="tema" aria-label="Cambiar tema" title="Modo claro / oscuro">${ic(oscuro() ? 'sun' : 'moon')}</button>
    <button class="circle light as-btn" data-act="asAbrir" title="Asistente BIM" aria-label="Abrir asistente">${ic('spark')}</button>
    <div class="who" id="who" aria-label="Personas conectadas"></div>`;
  pintarWho();
  if (!parseRuta(route)) informarUbicacion({ vista: NAV.find((x) => x[0] === sec)?.[1] ?? 'Hoteles', lugar: '', elemento: '' });
}

/* ---------------- tarjeta de La Fontana (escena 3D del sitio) ---------------- */
let torreNiveles: { i: number; nombre: string }[] | null = null; let nivelSel = -1;
function vFontanaCard(): string {
  const fon = HOTELES.find((x) => x.id === 'fontana')!;
  if (torreNiveles) return `<aside class="hcard glass fontana-card"><p class="map-eyebrow">TORRE SUITES · AXONOMETRÍA POR PISOS</p><h2 style="font-size:22px;font-weight:800;margin:2px 0">Torre en remodelación</h2>
    <p class="muted" style="font-size:12.5px">Pasa el cursor por cada piso para resaltarlo. El piso 2 tiene planta y habitaciones.</p>
    <div class="tp-niveles">${[...torreNiveles].reverse().map((n) => `<button class="tp-nivel ${n.i === 1 ? 'p2' : ''} ${n.i === nivelSel ? 'on' : ''}" data-act="torreNivel" data-v="${n.i}"><b>${esc(n.nombre)}</b><small>${n.i === 1 ? 'Ver planta y habitaciones →' : 'Sin planta de detalle aún'}</small></button>`).join('')}</div>
    <button class="btn block" data-act="torreRecomponer">${ic('reset', 1.8)} Recomponer edificio</button></aside>`;
  return `<aside class="hcard glass fontana-card"><p class="map-eyebrow">BOGOTÁ · USAQUÉN</p><h2 style="font-size:24px;font-weight:800;margin:2px 0">Hotel Estelar La Fontana</h2><p class="muted" style="font-size:13.5px">${esc(fon.dir)}</p>
    <p class="tp-hint">${ic('tap', 1.8)}<span>Pasa el cursor sobre la <b>Torre Suites</b>: se ilumina y el resto queda en segundo plano. Haz clic para separarla por pisos.</span></p>
    <button class="btn coral block cta" data-act="torreExplotar">${ic('layers', 2)} Separar por pisos</button>
    <button class="btn block" data-act="torreNivel" data-v="1">${ic('plan', 2)} Planta del piso 2 y habitaciones</button></aside>`;
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

/* ---------------- capa sobre el mapa ---------------- */
function renderOv(): void {
  const ov = $('ov');
  const loading = document.getElementById('mapLoading');
  if (route === 'mapa' || route === '') {
    const ciudades = [...new Set(HOTELES.map((h) => h.ciudad))];
    const sel = hotelSel ? HOTELES.find((h) => h.id === hotelSel)! : null;
    ov.innerHTML = `${ciudadCine ? `<div class="map-ciudad"><small>Hoteles Estelar</small>${esc(ciudadCine)}</div>` : ''}
    <div class="map-cine"><button data-act="mapTodos" class="${enRecorrido ? '' : 'on'}">${ic('globe', 1.8)} Ver todos</button><button data-act="mapRecorrido" class="${enRecorrido ? 'on' : ''}">${ic(enRecorrido ? 'pause' : 'play', 1.8)} ${enRecorrido ? 'Detener recorrido' : 'Recorrido por los hoteles'}</button><a href="#hoteles/la-fontana"><button>${ic('build', 1.8)} La Fontana</button></a></div>
    <aside class="mapcard cities">
      <div class="glass">
        ${ciudadSel ? `<button class="cc-back" data-act="mapCiudad" data-v="">${ic('back', 2)} Todas las ciudades</button>
          <p class="map-eyebrow">HOTELES ESTELAR · ${esc(ciudadSel.toUpperCase())}</p><h1>${esc(ciudadSel)}</h1>
          <p class="muted" style="font-size:13px;margin:2px 0 10px">${HOTELES.filter((h) => h.ciudad === ciudadSel).length} ${HOTELES.filter((h) => h.ciudad === ciudadSel).length === 1 ? 'hotel' : 'hoteles'}</p>
          <div class="cc-list">${HOTELES.filter((h) => h.ciudad === ciudadSel).map((h) => `<button class="cc-hotel ${h.obra ? 'obra' : ''}" data-act="mapHotel" data-v="${h.id}" aria-pressed="${hotelSel === h.id}"><span class="pin">${ic(h.obra ? 'build' : 'pin', 2)}</span><span><b>${esc(h.obra ? 'Hotel Estelar La Fontana' : h.nombre)}</b><small>${esc(h.dir)}${h.obra ? ' · remodelación Torre Suites · ver en 3D' : ''}</small></span>${ic('arrowR', 1.8)}</button>`).join('')}</div>`
        : `<p class="map-eyebrow">PORTAFOLIO · COLOMBIA</p><h1>Hoteles <b>Estelar</b></h1>
          <p class="muted" style="font-size:13px;margin:2px 0 10px">${HOTELES.length} hoteles en ${ciudades.length} ciudades · elige una ciudad</p>
          <div class="cc-list">${[...ciudades].sort((a, b) => HOTELES.filter((h) => h.ciudad === b).length - HOTELES.filter((h) => h.ciudad === a).length || a.localeCompare(b)).map((c) => { const n = HOTELES.filter((h) => h.ciudad === c).length; const obra = HOTELES.some((h) => h.ciudad === c && h.obra); return `<button class="cc-city ${obra ? 'obra' : ''}" data-act="mapCiudad" data-v="${esc(c)}"><span><b>${esc(c)}</b><small>${n} ${n === 1 ? 'hotel' : 'hoteles'}${obra ? ' · La Fontana en obra' : ''}</small></span>${ic('chev', 2)}</button>`; }).join('')}</div>`}
      </div>
    </aside>
    ${sel ? `<aside class="hcard glass"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><p class="muted" style="font-size:12.5px;font-weight:800">${esc(sel.ciudad)}</p><h2 style="font-size:20px;font-weight:800">${esc(sel.nombre)}</h2><p class="muted" style="font-size:13.5px">${esc(sel.dir)}</p></div><button class="circle sm light" data-act="cerrarHotel" aria-label="Cerrar">${ic('x')}</button></div>
      ${sel.obra ? `<span class="pill crit">Remodelación en curso</span><a class="btn coral block" href="#plan">Abrir planeación ${ic('arrowR')}</a>` : `<span class="pill neu">Sin obra activa</span><p class="muted" style="font-size:13px">Ubicación aproximada por dirección. El prototipo interactivo está en La Fontana.</p><button class="btn block" data-act="colombia">${ic('globe')} Ver toda Colombia</button>`}</aside>` : ''}`;
  } else if (route === 'obra') {
    const ob = OBRA ? totalObra() : { prog: 0.30, real: 0.26, n: 120, hechas: 31 };
    const novs = listaNovedades();
    const ab = novs.filter((n) => n.estado !== 'Cerrada');
    const crit = ab.filter((n) => n.prio === 'Alta');
    const pctStr = (ob.real * 100).toFixed(1).split('.');
    const ticks = Array.from({ length: 24 }, (_, i) => {
      const h = 22 + Math.round(Math.pow((i + 1) / 24, 1.35) * 78);
      const act = i / 24 <= ob.real ? 'done' : i / 24 <= ob.prog ? 'prog' : '';
      return `<i class="${act}" style="height:${h}%"></i>`;
    }).join('');
    ov.innerHTML = `
    <div class="scene-heading">
      <div><span class="scene-kicker">HOTEL LA FONTANA / TORRE SUITES</span><h1>Explora la obra</h1><p>Selecciona el piso o una especialidad para inspeccionar el modelo BIM.</p></div>
    </div>
    <aside class="scene-panel" aria-label="Estado del piso 2">
      <div class="scene-panel-top"><span class="scene-kicker">PISO 02 · PROTOTIPO</span><span class="scene-live"><i></i> En obra</span></div>
      <h2>Torre Suites</h2>
      <p>12 habitaciones · 432 m²</p>
      <div class="scene-progress"><span><strong>${(ob.real * 100).toFixed(1)}%</strong><small>avance real</small></span><span><strong>${Math.round(ob.prog * 100)}%</strong><small>programado</small></span></div>
      <div class="scene-track"><i style="width:${Math.min(100, Math.max(0, ob.real * 100))}%"></i></div>
      <div class="scene-alert"><a href="#novedades"><b>${ab.length}</b> novedades abiertas ${ic('arrowR')}</a><a href="#novedades"><b>${crit.length}</b> de alta prioridad ${ic('arrowR')}</a></div>
      <div class="scene-actions"><a class="scene-primary" href="#habitacion-216">Explorar habitación 216 ${ic('arrowR')}</a><button type="button" class="scene-secondary" data-act="elegirEsp">Inspeccionar modelo BIM</button><button type="button" class="scene-secondary" data-act="${piso2Open ? 'completo' : 'piso2'}">${piso2Open ? 'Ver torre completa' : 'Separar piso 2'}</button></div>
    </aside>
    <!-- Tarjeta izquierda estilo Formify (Construction SaaS Dashboard sobre el modelo 3D) -->
    <aside class="fm-left glass">
      <div class="fm-head">
        <div><small class="muted">Avance total · Piso 2</small><div class="fm-big"><b>${pctStr[0]}</b><span>.${pctStr[1]}%</span></div></div>
        <span class="pill warn" style="align-self:flex-start">${Math.round(ob.prog * 100)}% prog.</span>
      </div>
      <div class="fm-ticks" aria-label="Curva de progreso">${ticks}</div>
      <div class="fm-alerts">
        <a href="#novedades" class="fm-al warn"><div><span class="dot-w">●</span><b>${ab.length}</b></div><small>POR REVISAR →</small></a>
        <a href="#novedades" class="fm-al crit"><div><span class="dot-c">▲</span><b>0${crit.length}</b></div><small>ALTO RIESGO →</small></a>
      </div>
      <div class="fm-trades">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b style="font-size:13px">Redes & Especialidades (Revit + MEP)</b><small class="muted">Abrir 3D</small></div>
        ${ESPECIALIDADES.map((e) => {
          const a = OBRA && e.id !== 'est' && e.id !== 'rci' ? Math.round(porEsp(e.id).real * 100) : e.id === 'est' ? 52 : 18;
          return `<button type="button" class="fm-trow" data-act="irBim" data-v="${e.id}"><span class="sw" style="background:${e.c}"></span><span style="flex:1">${e.corto}</span><b>${a}%</b>${ic('arrowR', 1.8)}</button>`;
        }).join('')}
      </div>
    </aside>

    <!-- Cabecera flotante estilo "Building Plan" -->
    <div class="fm-title">
      <h2>Building Plan · Torre Suites</h2>
      <div class="fm-pills">
        <span class="glass">${ic('obra', 1.7)} Hotel La Fontana · P2</span>
        <span class="glass">${ic('layers', 1.7)} Revit + 3ds Max + MEP</span>
        <a href="#ia" class="glass" style="text-decoration:none;color:var(--teal);font-weight:800">${ic('spark', 1.7)} Preguntar a la IA</a>
      </div>
    </div>

    <!-- Tarjeta flotante derecha estilo Formify (Callout sobre la torre + miniatura 360) -->
    <div class="fm-callout glass">
      <div class="fm-360" data-act="irRuta" data-v="ia" title="Ver recorrido 360° y bitácora WhatsApp">
        <img src="img/suite.webp" alt="Vista 360 Suite">
        <span>${ic('vr', 1.6)} 360°</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><b>Piso 2 · Prototipo</b><small class="muted" style="display:block">12 Suites · 3 Frentes</small></div>
        <button class="circle sm" style="background:var(--coral);color:#fff" data-act="elegirEsp" aria-label="Abrir redes 3D">${ic('arrowR', 2)}</button>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px">
        <span class="fm-dot"><i></i> En obra</span>
        <strong style="font-size:24px;font-weight:800">${Math.round(ob.real * 100)}<span style="font-weight:500;color:var(--muted)">%</span></strong>
      </div>
    </div>

    <!-- Botón central sobre la torre -->
    <button class="tapme" data-act="elegirEsp" aria-label="Tocar la torre en remodelación"><span class="tapbub">${ic('tap', 2)} Toca la torre · Ver redes BIM</span><span class="taparrow">${ic('down', 2.8)}</span><span class="tapring"></span></button>

    <!-- Dock inferior estilo Formify: Selector de Nivel + Barra oscura de progreso por frentes -->
    <div class="fm-bottom">
      <div class="fm-level glass">
        <div class="fm-lvl-step">
          <button type="button" data-act="piso2" title="Abrir planta Piso 2" aria-pressed="${piso2Open}">▲</button>
          <b>02</b>
          <button type="button" data-act="completo" title="Ver edificio completo" aria-pressed="${!piso2Open}">▼</button>
        </div>
        <div class="fm-lvl-info">
          <b>${piso2Open ? 'Nivel 2 (Planta abierta)' : 'Torre completa'}</b>
          <small class="muted">Toca para separar pisos en Revit</small>
        </div>
        <button type="button" class="chip" style="background:${piso2Open ? 'var(--black)' : 'var(--coral)'};color:#fff" data-act="${piso2Open ? 'completo' : 'piso2'}">${piso2Open ? 'Cerrar pisos' : 'Cortar Piso 2'}</button>
      </div>

      <div class="fm-darkbar">
        <div class="fm-db-top">
          <span><b>Torre Suites · 432 m²</b> <small style="opacity:.65">· 12 habitaciones</small></span>
          <button type="button" class="chip" style="background:rgba(255,255,255,.14);color:#fff;padding:4px 10px;font-size:12px" data-act="elegirEsp">Inspeccionar MEP 3D →</button>
        </div>
        <div class="fm-db-bars">
          ${OBRA ? [['arq', 'Arquitectura', '#E8604F'], ['hid', 'Hidro', '#1FA58C'], ['ele', 'Eléctrica', '#F2C94C']].map(([k, n, c]) => `<span style="flex:1;background:${c}">${n} ${Math.round(porEsp(k).real * 100)}%</span>`).join('') : '<span style="flex:1;background:#6F7C8A">Sin datos de avance</span>'}
        </div>
      </div>
    </div>`;
  } else ov.innerHTML = '';
  if (loading) ov.appendChild(loading);
}

/* ---------------- hojas: especialidad, formulario, detalle ---------------- */
function cerrarHoja(): void { $('layer').innerHTML = ''; }
function hojaEspecialidad(): void {
  $('layer').innerHTML = `<div class="sheetbg" data-act="cerrarHojaFondo"><div class="sheet" role="dialog" aria-label="Elegir especialidad">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><h2>¿Qué especialidad vas a trabajar?</h2><p class="sub">Se abre el modelo 3D del piso 2 con esa especialidad resaltada</p></div><button class="circle light" data-act="cerrarHoja" aria-label="Cerrar">${ic('x')}</button></div>
    <div class="esps">${ESPECIALIDADES.map((e) => `<button class="esp" data-act="irBim" data-v="${e.id}"><span class="eic" style="background:${e.c};${e.id === 'coo' ? 'color:var(--onBlack);background:var(--black)' : ''}">${ic(e.ic, 2)}</span><b>${e.corto}</b><small>${e.desc}</small><span class="eabre">Abrir 3D ${ic('arrowR', 2.4)}</span><span class="pct">${OBRA && e.id !== 'est' && e.id !== 'rci' ? Math.round(porEsp(e.id).real * 100) + '%' : ''}</span></button>`).join('')}</div></div></div>`;
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
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><div><span class="label">Estado</span><div class="seg">${(['Abierta', 'En revisión', 'Cerrada'] as const).map((s) => `<button data-act="setEstado" data-id="${esc(n.id)}" data-v="${s}" aria-pressed="${n.estado === s}">${s}</button>`).join('')}</div></div>
    ${n.pos ? `<button class="btn pri" data-act="novVer3d" data-v="${esc(n.id)}">${ic('pin')} Ver punto en 3D</button>` : ''}</div></div></div>`;
}

let habAbierta = '';
function abrirHabDetalle(h: string): void {
  if (!OBRA) return;
  habAbierta = h;
  const hb = OBRA.habitaciones.find((q) => q.hab === h);
  const a = porHab(h);
  const acts = OBRA.actividades.filter((x) => x.hab === h);
  const novs = listaNovedades().filter((x) => x.loc === 'HAB-' + h);
  const fd = (s: string) => fechaCorta(new Date(s + 'T12:00').getTime());
  $('layer').innerHTML = `<div class="sheetbg" data-act="cerrarHojaFondo"><div class="sheet" role="dialog" aria-label="Habitación ${esc(h)}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
      <div><p class="muted" style="font-weight:800;font-size:13px">${esc(hb?.frente ?? 'Piso 2')} · ${hb?.area ?? 36} m² · ${hb ? fd(hb.ini) + ' – ' + fd(hb.fin) : ''}</p>
      <h2>Habitación ${esc(h)} · ${esc(hb?.tipo ?? '')}</h2></div>
      <button class="circle light" data-act="cerrarHoja" aria-label="Cerrar">${ic('x')}</button>
    </div>
    <div class="minis" style="margin:0">
      <div class="mini"><small>Avance real</small><b style="color:var(--teal);font-size:18px">${Math.round(a.real * 100)}%</b></div>
      <div class="mini"><small>Programado a hoy</small><b style="font-size:18px">${Math.round(a.prog * 100)}%</b></div>
      <div class="mini"><small>Actividades</small><b style="font-size:18px">${a.hechas} / ${a.n}</b></div>
    </div>
    <div class="pbar"><i style="width:${a.real * 100}%"></i></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn coral" data-act="qrProbar" data-v="HAB-${esc(h)}" style="flex:1">${ic('camera')} Reportar novedad en Hab. ${esc(h)}</button>
      <button class="btn" data-act="abrirBim" data-v="arq" style="flex:1">${ic('eye')} Ver piso 2 en 3D</button>
      ${h === '216' ? '<a class="btn teal" href="#habitacion-216" style="flex:1">Explorar prototipo SketchUp + Smart Home →</a>' : ''}
    </div>
    <div><span class="label">Actividades de la habitación (${a.hechas} de ${acts.length} terminadas)</span>
      <div class="scrollbox" style="max-height:220px">${acts.map((ac) => { const d = espDe(ac.esp), done = realAct(ac) >= 1; return `<label class="check ${done ? 'done' : ''}"><input type="checkbox" data-act="hecho" data-v="${esc(ac.id)}" ${done ? 'checked' : ''}><span class="bx">${ic('check', 3)}</span><span class="tx" style="flex:1"><b>${esc(ac.fase.replace(/^\d+\.\s*/, ''))}</b><small><span style="color:${d.c};font-weight:900">●</span> ${esc(ac.quien)} · ${fd(ac.ini)}–${fd(ac.fin)}</small></span></label>`; }).join('')}</div>
    </div>
    ${novs.length ? `<div><span class="label">Novedades registradas (${novs.length})</span><div class="list">${novs.map(rowNov).join('')}</div></div>` : ''}
  </div></div>`;
}

/* ---------------- render de rutas ---------------- */
function vPlanPiso2(): string {
  const fronts = OBRA?.frentes ?? [
    { frente: 'Frente 1', secuencia: '214 → 215 → 216 → 217', n: 4, comp: '', area: 0, ini: '', fin: '', criterio: '' },
    { frente: 'Frente 2', secuencia: '225 → 218 → 219 → 220', n: 4, comp: '', area: 0, ini: '', fin: '', criterio: '' },
    { frente: 'Frente 3', secuencia: '223 → 222 → 224 → 221', n: 4, comp: '', area: 0, ini: '', fin: '', criterio: '' },
  ];
  const overall = OBRA ? totalObra() : { prog: .30, real: .26, n: 0, hechas: 0 };
  const pct = (n: number) => Math.round(n * 100);
  const room = (number: string): string => {
    const p = porHab(number);
    const ref = OBRA?.habitaciones.find(h => h.hab === number);
    const assigned = [...new Set((OBRA?.actividades ?? []).filter(a => a.hab === number).map(a => a.quien).filter(Boolean))].slice(0, 2);
    return `<button class="plan-room ${number === '216' ? 'demo' : ''}" data-act="habDetalle" data-v="${number}" aria-label="Habitación ${number}, avance ${pct(p.real)} por ciento, abrir detalle"><span class="plan-room-head"><b>${number}</b><i>${number === '216' ? 'DEMO 3D' : ref?.tipo ?? 'HABITACIÓN'}</i></span><span class="plan-room-progress"><span style="width:${pct(p.real)}%"></span></span><small>${pct(p.real)}% ejecutado <span>· ${pct(p.prog)}% previsto</span></small><em>${assigned.join(' · ') || 'Equipo programado'}</em></button>`;
  };
  return `<div class="plan-screen">
    <header class="plan-intro"><div><p class="plan-kicker">02 / 05 · ESTELAR LA FONTANA</p><h1>Planeación del <b>piso 2.</b></h1><p>La matriz organiza 12 habitaciones en tres frentes paralelos. Abre una habitación para ver tareas, responsables previstos y novedades.</p></div><div class="plan-intro-actions"><a class="btn pri" href="#bim-${S.espUser || 'arq'}">Abrir modelo BIM ${ic('arrowR')}</a><a class="btn" href="#novedades">Ver novedades</a></div></header>
    <div class="plan-dashboard"><section class="plan-floor"><div class="plan-section-head"><div><span>PLANTA DE EJECUCIÓN</span><h2>Torre Suites · Nivel 02</h2></div><small>Selecciona cualquier habitación <span>↗</span></small></div><div class="plan-lanes">${fronts.map((front, i) => {
      const numbers = front.secuencia.split('→').map(s => s.trim());
      const stat = porFrente(front.frente);
      return `<div class="plan-lane"><div class="plan-lane-head"><span>0${i + 1} / ${front.frente.toUpperCase()}</span><b>${pct(stat.real)}%</b></div><div class="plan-rooms">${numbers.map(room).join('')}</div></div>`;
    }).join('')}</div><div class="plan-corridor"><span>↔</span> CORREDOR · CIRCULACIÓN COMÚN <span>↔</span></div><p class="plan-data-note">Avance y responsables tomados de la matriz de programación. La presencia en tiempo real se conectará al acceso personal y check-in QR.</p></section>
    <aside class="plan-side"><div class="plan-summary"><span class="plan-kicker">CONTROL DE AVANCE</span><h2>Visión general</h2><div class="plan-big"><strong>${pct(overall.real)}<i>%</i></strong><small>avance ejecutado en la matriz</small></div><div class="plan-meter"><div><span>Ejecutado</span><b>${pct(overall.real)}%</b></div><i><span style="width:${pct(overall.real)}%"></span></i></div><div class="plan-meter muted"><div><span>Programado</span><b>${pct(overall.prog)}%</b></div><i><span style="width:${pct(overall.prog)}%"></span></i></div><div class="plan-summary-foot"><span>${overall.hechas} actividades completadas</span><span>${overall.n} actividades en matriz</span></div></div><div class="plan-next"><span class="plan-kicker">SIGUIENTE PASO</span><h3>Inspecciona el modelo.</h3><p>Entra al BIM con tu especialidad para ver sistemas, elementos y puntos de novedad.</p><a href="#bim-${S.espUser || 'arq'}">Explorar BIM ${ic('arrowR')}</a></div></aside></div>
  </div>`;
}
function vNovedadesPiso2(): string {
  const all = listaNovedades();
  const query = filtroNov.q.trim().toLowerCase();
  const items = all.filter(n =>
    (filtroNov.esp === 'todas' || n.esp === filtroNov.esp) &&
    (filtroNov.est === 'todas' || (filtroNov.est === 'abiertas' ? n.estado !== 'Cerrada' : n.estado === 'Cerrada')) &&
    (!query || [n.txt, n.id, ubic(n.loc), n.quien].some(x => x.toLowerCase().includes(query)))
  );
  const open = all.filter(n => n.estado !== 'Cerrada');
  const high = open.filter(n => n.prio === 'Alta');
  const locations = [...new Set(all.map(n => n.loc))].map(loc => ({ loc, count: all.filter(n => n.loc === loc).length }));
  return `<div class="nov-screen">
    <header class="nov-intro"><div><p class="plan-kicker">04 / 05 · ESTELAR LA FONTANA</p><h1>Novedades del <b>piso 2.</b></h1><p>Consulta los reportes por habitación o especialidad. Cada punto registrado en el BIM abre su detalle aquí.</p></div><div class="nov-actions"><button class="btn pri" data-act="reportar">${ic('pin')} Nueva novedad</button><a class="btn" href="#qr">${ic('novedades')} Códigos QR</a></div></header>
    <div class="nov-stats"><div><span>REGISTRADAS</span><b>${all.length}</b><small>en el prototipo</small></div><div><span>ABIERTAS</span><b>${open.length}</b><small>pendientes de resolver</small></div><div><span>PRIORIDAD ALTA</span><b>${high.length}</b><small>requieren atención</small></div><div><span>EN EL MODELO</span><b>${all.filter(n => n.pos).length}</b><small>con punto 3D</small></div></div>
    <div class="nov-layout"><section class="nov-register"><div class="nov-register-head"><div><span>BITÁCORA / REGISTRO</span><h2>${filtroNov.est === 'abiertas' ? 'Pendientes' : filtroNov.est === 'cerradas' ? 'Cerradas' : 'Todas las novedades'} <small>${items.length}</small></h2></div><label class="nov-search">${ic('search')}<input id="qNov" value="${esc(filtroNov.q)}" placeholder="Buscar habitación, ID o descripción" aria-label="Filtrar novedades"></label></div>
    <div class="nov-filters"><div class="chiprow"><button class="chip" data-act="fEsp" data-v="todas" aria-pressed="${filtroNov.esp === 'todas'}">Todas</button>${ESPECIALIDADES.filter(e => e.id !== 'coo').map(e => `<button class="chip" data-act="fEsp" data-v="${e.id}" aria-pressed="${filtroNov.esp === e.id}"><span class="sw" style="background:${e.c}"></span>${e.corto}</button>`).join('')}</div><div class="seg">${[['abiertas','Abiertas'],['cerradas','Cerradas'],['todas','Todas']].map(([k,l]) => `<button data-act="fEst" data-v="${k}" aria-pressed="${filtroNov.est === k}">${l}</button>`).join('')}</div></div>
    <div class="nov-list">${items.map(rowNov).join('') || '<p class="nov-empty">No hay novedades con este filtro.</p>'}</div><p class="nov-storage">${compartido() ? 'Sincronizado con base de datos compartida.' : 'Demostración local: los cambios se guardan en este dispositivo.'}</p></section>
    <aside class="nov-side"><div class="nov-locations"><span class="plan-kicker">PISO 02 / UBICACIONES</span><h3>¿Dónde están?</h3>${locations.map(({loc,count}) => `<button data-act="${loc.startsWith('HAB-') ? 'habDetalle' : 'irRuta'}" data-v="${loc.startsWith('HAB-') ? loc.slice(4) : 'plan'}"><span>${esc(ubic(loc))}</span><b>${count}</b></button>`).join('')}</div><div class="nov-qr"><span class="plan-kicker">DESDE LA OBRA</span><h3>Un QR por habitación.</h3><p>El código abre el formulario con la ubicación preparada y permite adjuntar foto. El punto 3D se marca desde el visor BIM.</p><a href="#qr">Ver códigos QR ${ic('arrowR')}</a></div></aside></div>
  </div>`;
}
function renderPage(): void {
  if (parseRuta(route)) return; // el área espacial del gemelo es dueña de esta ruta
  const page = $('page');
  const base = route.split('-')[0];
  if (!PAGES.includes(base)) { page.innerHTML = ''; page.className = ''; return; }
  const html = base === 'equipo' ? vEquipo() : base === 'asistente' ? `<header class="rs-head"><div><p class="eyebrow">ASISTENTE BIM · SOLO CONSULTA</p><h1>Pregúntale <b>a la obra.</b></h1><p class="sub">Responde con novedades, cronograma, avances validados y responsables registrados, y cita cada registro. No modifica datos.</p></div><a class="btn" href="#ia">${ic('wa')} Bitácora WhatsApp y 360° (demo anterior)</a></header>${vChat(false)}` : base === 'resumen' ? vResumen() : base === 'panel' ? vPanel() : base === 'ia' ? vAsistente(aiChat, waLog, modo360) : base === 'plan' ? vPlanPiso2() : base === 'avance' ? vAvance(habFiltro) : base === 'proveedores' ? vProveedores()
    : base === 'novedades' ? vNovedadesPiso2() : base === 'qr' ? vQR() : base === 'entregables' ? vEntregables() : vHonorarios();
  const y = page.scrollTop;
  const focusId = document.activeElement?.id;
  const selStart = (document.activeElement as HTMLInputElement | null)?.selectionStart ?? null;
  page.className = 'page';
  page.innerHTML = `<div class="wrap ${anim ? 'anim' : ''}">${html}</div>`;
  if (anim) { countUp(page); page.scrollTop = 0; } else page.scrollTop = y;
  anim = false;
  if (focusId) {
    const el = document.getElementById(focusId) as HTMLInputElement | null;
    if (el) { el.focus(); if (selStart !== null && el.setSelectionRange) el.setSelectionRange(selStart, selStart); }
  }
  if (base === 'qr') void pintarQR();
  if (base === 'resumen') montarResumen();
  if (base === 'equipo') void pintarQrsEquipo();
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
  if (disposePrototype) { disposePrototype(); disposePrototype = null; }
  const h = decodeURIComponent(location.hash.slice(1));
  route = h; anim = true;
  const base = h.split('-')[0];
  app.dataset.view = base || 'mapa';
  document.body.classList.toggle('con-sesion', !!perfil);
  if (h.startsWith('checkin/')) { const [, hab, tok] = h.split('/'); $('rail').hidden = true; $('topbar').hidden = true; ocultarWorkspace(); $('page').innerHTML = ''; $('ov').innerHTML = ''; await mostrarCheckin($('layer'), hab, tok ?? ''); return; }
  if (h === 'nueva-clave') { $('rail').hidden = true; $('topbar').hidden = true; mostrarNuevaClave($('layer'), () => { $('layer').innerHTML = ''; location.hash = 'mapa'; }); return; }
  if (h.startsWith('qr-aprobar/')) {
    const [, id, nonce] = h.split('/');
    $('rail').hidden = true; $('topbar').hidden = true; ocultarWorkspace();
    await mostrarAprobacion($('layer'), id, nonce, () => renderLogin());
    return;
  }
  if (!perfil && base !== 'reportar') {
    $('rail').hidden = true; $('topbar').hidden = true; $('page').innerHTML = ''; $('page').className = ''; $('ov').innerHTML = '';
    bim?.cerrar(); $('bim').hidden = true; ocultarWorkspace();
    renderLogin();
    return;
  }
  // área espacial del gemelo (#fontana…): la sidebar sigue visible
  if (h === 'fontana') { history.replaceState(null, '', '#hoteles/la-fontana'); route = 'hoteles/la-fontana'; return go(); }
  const rt = parseRuta(h);
  if (rt) {
    $('rail').hidden = false; $('topbar').hidden = false;
    $('page').innerHTML = ''; $('page').className = ''; $('ov').innerHTML = '';
    bim?.cerrar(); $('bim').hidden = true; pausarMapa(true); cerrarHoja();
    const tw = $('twin'); const desdeMapa = tw.hidden; tw.hidden = false;
    if (desdeMapa) { tw.style.transition = 'none'; tw.style.opacity = '0'; requestAnimationFrame(() => requestAnimationFrame(() => { tw.style.transition = 'opacity .9s ease'; tw.style.opacity = '1'; })); }
    renderChrome();
    await (await cargarWS()).abrirWorkspace(rt);
    renderChrome();
    return;
  }
  ocultarWorkspace();
  if (base !== 'mapa' && base !== '' && W.HLF && est) { est.detenerCine(W.HLF.viewer as never); enRecorrido = false; ciudadCine = null; }
  if (h === 'hoteles/bogota' || h === 'hoteles/la-fontana') {
    $('rail').hidden = false; $('topbar').hidden = false; $('page').innerHTML = ''; $('page').className = ''; bim?.cerrar(); $('bim').hidden = true;
    renderChrome();
    const bog = HOTELES.filter((x) => x.ciudad === 'Bogotá');

    $('ov').innerHTML = h === 'hoteles/bogota'
      ? `<aside class="mapcard"><div class="glass hlist" style="max-height:none"><p class="map-eyebrow">BOGOTÁ · ${bog.length} HOTELES</p>${bog.map((x) => `<button class="hrow ${x.obra ? 'obra' : ''}" data-act="hotel" data-v="${x.id}"><span class="pin">${ic(x.obra ? 'build' : 'pin', 2)}</span><span><b>${esc(x.nombre)}</b><small>${esc(x.dir)}${x.obra ? '' : ' · ubicación aproximada'}</small></span></button>`).join('')}</div></aside>`
      : vFontanaCard();
    const hlf = await cargarMapa(); pausarMapa(false);
    if (route !== h) return;
    if (h === 'hoteles/bogota') { pines?.show(true); hlf.volarA(-74.06, 4.66, 42000, 2.8); }
    else { pines?.show(false); await hlf.entrar(); }
    return;
  }

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
  if (h === 'habitacion-216') {
    $('page').innerHTML = ''; $('page').className = ''; $('ov').innerHTML = ''; $('topbar').hidden = true; $('rail').hidden = false;
    bim?.cerrar(); $('bim').hidden = true; pausarMapa(true); cerrarHoja();
    const { mountPrototype } = await import('./prototype');
    if (location.hash === '#habitacion-216') disposePrototype = mountPrototype($('prototype'));
    return;
  }
  if (base === 'bim') {
    $('page').innerHTML = ''; $('page').className = ''; $('ov').innerHTML = ''; $('topbar').hidden = false; $('rail').hidden = false;
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
  else { pines?.show(true); if (!hotelSel && est) { hlf.vistaColombia(0); est.verTodos(hlf.viewer as never, !entradaHecha); entradaHecha = true; } }
}

/* ---------------- eventos ---------------- */
app.addEventListener('click', async (ev) => {
  const t = ev.target as HTMLElement;
  const b = t.closest<HTMLElement>('[data-act]'); if (!b) return;
  const a = b.dataset.act!, v = b.dataset.v ?? '';
  if (b.tagName === 'INPUT') return;
  if (a === 'novEstado' || a === 'novVer3d') ev.stopPropagation();
  switch (a) {
    case 'cerrarHojaFondo': if (t === b) { cerrarHoja(); form = null; habAbierta = ''; } return;
    case 'cerrarHoja': cerrarHoja(); form = null; habAbierta = ''; return;
    case 'hotel': seleccionarHotel(v); return;
    case 'cerrarHotel': hotelSel = null; renderOv(); return;
    case 'colombia': hotelSel = null; renderOv(); (await cargarMapa()).vistaColombia(); return;
    case 'toggleLista': mapOpen = !mapOpen; renderOv(); return;
    case 'elegirEsp': location.hash = 'bim-' + (S.espUser || 'coo'); return;
    case 'piso2': piso2Open = !piso2Open; W.HLF?.piso2(); renderOv(); return;
    case 'completo': piso2Open = false; W.HLF?.completo(); renderOv(); return;
    case 'irRuta': location.hash = v; return;
    case 'torreExplotar': W.HLF?.explotar(); return;
    case 'torreRecomponer': W.HLF?.recomponer(); return;
    case 'torreNivel': entrarNivel(+v); return;
    case 'mapCiudad': { const h = await cargarMapa(); enRecorrido = false; ciudadCine = null; hotelSel = null; ciudadSel = v || null; h.vistaColombia(0); if (v) est?.volarCiudad(h.viewer as never, v); else est?.verTodos(h.viewer as never); renderOv(); return; }
    case 'mapHotel': { if (v === 'fontana') { location.hash = 'hoteles/la-fontana'; return; } const h = await cargarMapa(); est?.detenerCine(h.viewer as never); hotelSel = v; const x = HOTELES.find((q) => q.id === v)!; h.volarA(x.lon, x.lat, 5000); renderOv(); return; }
    case 'mapTodos': { const h = await cargarMapa(); ciudadSel = null; enRecorrido = false; ciudadCine = null; hotelSel = null; h.vistaColombia(0); est?.verTodos(h.viewer as never); renderOv(); return; }
    case 'mapRecorrido': { const h = await cargarMapa(); if (enRecorrido) { est?.detenerCine(h.viewer as never); enRecorrido = false; ciudadCine = null; renderOv(); return; } enRecorrido = true; hotelSel = null; h.vistaColombia(0); renderOv(); void est?.recorrido(h.viewer as never, (c) => { ciudadCine = c; if (!c) enRecorrido = false; if (route === 'mapa' || route === '') renderOv(); }); return; }
    case 'asAbrir': { const pa = $('asisPanel'); pa.hidden = !pa.hidden; pintarPanelAs(); return; }
    case 'asCerrar': $('asisPanel').hidden = true; return;
    case 'asSug': void preguntar(v); return;
    case 'rsKpi': $('layer').innerHTML = detalleKpi(v); return;
    case 'rsZoom': FR.zoom = v as typeof FR.zoom; renderPage(); return;
    case 'rsEsp': try { sessionStorage.setItem('twin-aislar', v); } catch { /* */ } location.hash = 'fontana/piso-2'; return;
    case 'rsValidar': await validar(+v); return;
    case 'aiPrompt': {
      const r = responderIA(v);
      aiChat.push({ q: v, ...r });
      renderPage();
      const box = document.getElementById('aiChatBox');
      if (box) box.scrollTop = box.scrollHeight;
      return;
    }
    case 'modo360': modo360 = v === '1'; renderPage(); return;
    case 'waCorte': {
      const ob = OBRA ? totalObra() : { prog: 0.3, real: 0.26, n: 120, hechas: 31 };
      const ab = listaNovedades().filter((n) => n.estado !== 'Cerrada');
      waLog.unshift({
        id: 'W-' + (waLog.length + 1),
        hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        autor: 'Asistente IA BACO',
        rol: 'Corte Diario Automático',
        frente: 'PISO 2',
        tipo: 'corte',
        msg: `📈 Corte diario generado: Avance piso 2 ${Math.round(ob.real * 100)}% (${ob.hechas}/${ob.n} actividades) · ${ab.length} novedades abiertas · fotos y recorrido 360° sincronizados en CDE.`,
        resp: 'Enviado por WhatsApp a Gerencia Estelar y Supervisor BIM ✓✓',
        tag: 'Corte 6:00 p.m.',
      });
      toast('Corte diario de las 6:00 p.m. enviado por WhatsApp');
      renderPage();
      return;
    }
    case 'irBim': cerrarHoja(); location.hash = 'bim-' + v; return;
    case 'abrirBim': cerrarHoja(); habAbierta = ''; location.hash = 'bim-' + v; return;
    case 'bimEsp': bimEsp = v; history.replaceState(null, '', '#bim-' + v); route = 'bim-' + v; void bim?.abrir(v).then(renderBimUi); renderBimUi(); return;
    case 'bimVolver': location.hash = 'plan'; return;
    case 'toggleBimLayers': bimLayersOpen = !bimLayersOpen; renderBimUi(); return;
    case 'bimCorte': corte = !corte; bim?.setCorte(corte); renderBimUi(); return;
    case 'bimFantasma': fantasma = !fantasma; bim?.setFantasma(fantasma); renderBimUi(); return;
    case 'bimToggleGrupo': bim?.toggleGrupo(v); renderBimUi(); return;
    case 'bimResetGrupos': bim?.resetGrupos(); renderBimUi(); return;
    case 'bimResetCam': bim?.resetCamara(); return;
    case 'guiaOk': guiaVista = true; try { localStorage.setItem('baco-obra-guia', '1'); } catch { /* */ } renderBimUi(); return;
    case 'guiaToggle': guiaVista = !guiaVista; renderBimUi(); return;
    case 'bimReportar': if (bim) { bim.reportando = !bim.reportando; renderBimUi(); } return;
    case 'tema': { const d = oscuro() ? 'light' : 'dark'; document.documentElement.dataset.theme = d; try { localStorage.setItem('baco-obra-tema', d); } catch { /* */ } renderChrome(); return; }
    case 'reportar': abrirForm(); return;
    case 'qrProbar': habAbierta = ''; abrirForm({ loc: v }); return;
    case 'habDetalle': habFiltro = v; renderPage(); abrirHabDetalle(v); return;
    case 'habFiltro': habFiltro = v; renderPage(); return;
    case 'limpiarQNov': filtroNov.q = ''; renderPage(); return;
    case 'imprimir': window.print(); return;
    case 'fv': if (form) { leerForm(); (form as unknown as Record<string, string>)[b.dataset.k!] = v; renderForm(); } return;
    case 'novEstado': case 'setEstado': {
      const n = listaNovedades().find((x) => x.id === (b.dataset.id ?? v)); if (!n) return;
      const seq = ['Abierta', 'En revisión', 'Cerrada'] as const;
      const nuevo = a === 'setEstado' ? (v as Novedad['estado']) : seq[(seq.indexOf(n.estado) + 1) % 3];
      await actualizarNovedad(n.id, { estado: nuevo }); toast(`${n.id} → ${nuevo}`);
      if (a === 'setEstado') abrirDetalle(n.id);
      else if (habAbierta) abrirHabDetalle(habAbierta);
      bim?.setPins(listaNovedades()); renderChrome(); renderPage(); return;
    }
    case 'novVer3d': {
      const n = listaNovedades().find((x) => x.id === v);
      if (n) {
        cerrarHoja(); habAbierta = '';
        if (n.pos) pendingPinFocus = [n.pos[0], n.pos[1], n.pos[2] - (n.ej ? 12 : 0)];
        if (location.hash === '#bim-' + n.esp && bim) {
          if (pendingPinFocus) { bim.enfocar(pendingPinFocus); pendingPinFocus = null; }
        } else {
          location.hash = 'bim-' + n.esp;
        }
      }
      return;
    }
    case 'verFoto': { const n = listaNovedades().find((x) => x.id === v); if (n) abrirDetalle(n.id); return; }
    case 'fEsp': filtroNov.esp = v; renderPage(); return;
    case 'fEst': filtroNov.est = v; renderPage(); return;
    case 'lightbox': $('layer').innerHTML = `<div class="lightbox" data-act="cerrarHoja"><img src="${['img/suite.webp', 'img/bano.webp', 'img/axo.webp'][S.img]}" alt="Render"><button class="circle light" aria-label="Cerrar">${ic('x')}</button></div>`; return;
    case 'loginRol': {
      const inp = document.getElementById('lNombre') as HTMLInputElement | null;
      void inp;
      loginChoice = v as 'estelar' | 'contratista';
      renderLogin();
      return;
    }
    case 'loginEsp': {
      const inp = document.getElementById('lNombre') as HTMLInputElement | null;
      void inp;
      loginEsp = v;
      renderLogin();
      return;
    }
    case 'cambiarRol': case 'salir': {
      await desconectarPresencia(); await detenerNovedades(); await salir(); S.rol = null; save();
      document.body.classList.remove('con-sesion'); location.hash = 'mapa'; void go();
      return;
    }
    case 'compacta': compacta = !compacta; document.body.classList.toggle('side-compact', compacta); try { localStorage.setItem('baco-side', compacta ? 'compacta' : 'expandida'); } catch { /* */ } renderChrome(); return;
    case 'setEspUser': {
      S.espUser = v;
      filtroNov.esp = v === 'coo' ? 'todas' : v;
      save();
      anim = true;
      renderChrome();
      if (route === 'mapa' || route === '') renderOv();
      renderPage();
      return;
    }
  }
  // acciones que cambian el estado y vuelven a pintar la página
  if (a === 'mes') S.mes = Math.max(1, Math.min(T(), S.mes + +v));
  else if (a === 'setMes') S.mes = Math.max(1, Math.min(T(), +v));
  else if (a === 'obra') { S.obra = +v; if (S.mes > T()) S.mes = T(); }
  else if (a === 'modo') S.modo = v as 'solo' | 'integrado';
  else if (a === 'iva') S.iva = v === '1';
  else if (a === 'chart') S.chart = v as 'bar' | 'line';
  else if (a === 'img') S.img = +v;
  else if (a === 'semana') S.semana = +v;
  else if (a === 'provEstado') { const p = S.prov[+v]; const seq = ['Por contratar', 'En evaluación', 'Contratado'] as const; p.estado = seq[(seq.indexOf(p.estado) + 1) % 3]; toast(`${p.nombre}: ${p.estado}`); }
  else if (a === 'provAvance') { const p = S.prov[+v]; p.avance = Math.min(100, p.avance + 10); }
  else if (a === 'provDelta') { const p = S.prov[+(b.dataset.i ?? 0)]; p.avance = Math.max(0, Math.min(100, p.avance + +v)); }
  else if (a === 'reset') { reset(); habFiltro = ''; filtroNov.q = ''; toast('Datos de ejemplo restablecidos'); renderChrome(); }
  else return;
  save(); anim = ['mes', 'setMes', 'obra', 'modo', 'chart', 'semana'].includes(a); renderPage();
});
app.addEventListener('input', (ev) => {
  const t = ev.target as HTMLInputElement;
  if (t.id === 'qNov') {
    filtroNov.q = t.value;
    renderPage();
  } else if (t.id === 'rCorteH') {
    corteH = +t.value;
    bim?.setCorteAltura(corteH);
  }
});
app.addEventListener('change', async (ev) => {
  const t = ev.target as HTMLInputElement;
  if (t.dataset.eq && await eventoEquipo(t)) return;
  if (t.dataset.rsf) { (FR as Record<string, string>)[t.dataset.rsf] = t.value; anim = false; renderPage(); return; }
  if (t.id === 'nFoto' && t.files?.[0] && form) {
    leerForm();
    try { form.foto = await comprimirFoto(t.files[0]); } catch { toast('No se pudo leer la foto. Prueba con otra.'); }
    renderForm(); return;
  }
  const a = t.dataset.act;
  if (a === 'ent') S.ent[t.dataset.v!] = t.checked ? 1 : 0;
  else if (a === 'act') S.act[+t.dataset.v!] = t.checked ? 1 : 0;
  else if (a === 'hecho') {
    marcar(t.dataset.v!, t.checked);
    toast(t.checked ? 'Actividad marcada como terminada' : 'Actividad reabierta');
    if (habAbierta) abrirHabDetalle(habAbierta);
  }
  else return;
  save(); renderPage();
});
app.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const f = ev.target as HTMLFormElement;
  if (f.id === 'fLogin') {
    const inp = (document.getElementById('lNombre') as HTMLInputElement | null)?.value.trim() ?? '';
    const dest = 'mapa';
    S.rol = loginChoice;
    S.espUser = loginEsp;
    S.nombreUser = inp;
    if (inp) { try { localStorage.setItem('baco-obra-quien', inp); } catch { /* */ } }
    filtroNov.esp = loginChoice === 'contratista' && loginEsp !== 'coo' ? loginEsp : 'todas';
    save();
    cerrarHoja();
    const labelRol = loginChoice === 'estelar' ? 'Gerencia Estelar' : `Contratista · ${espDe(loginEsp).corto}`;
    toast(`Sesión iniciada: ${inp || labelRol}`);
    if (location.hash === '#' + dest) void go();
    else location.hash = dest;
    return;
  }
  if (f.id === 'fEqCuenta') { await crearCuenta(f); renderPage(); return; }
  if (f.id === 'fAs' || f.id === 'fAsP') { const q = String(new FormData(f).get('q') ?? '').trim(); if (q) { f.reset(); void preguntar(q); } return; }
  if (f.id === 'fRsAvance') { await enviarAvance(f); f.reset(); return; }
  if (f.id === 'fBuscar') {
    const q = (document.getElementById('q') as HTMLInputElement).value.trim().toLowerCase(); if (!q) return;
    const h = HOTELES.find((x) => x.nombre.toLowerCase().includes(q) || x.ciudad.toLowerCase().includes(q));
    if (h) { seleccionarHotel(h.id); return; }
    const u = UBICACIONES.find(([k, t]) => t.toLowerCase().includes(q) || k.toLowerCase().includes(q) || (k.startsWith('HAB-') && k.slice(4) === q));
    if (u) {
      if (u[0].startsWith('HAB-') && OBRA) {
        const hk = u[0].slice(4);
        location.hash = 'avance';
        habFiltro = hk;
        renderPage();
        abrirHabDetalle(hk);
      } else {
        abrirForm({ loc: u[0] });
      }
      return;
    }
    const nv = listaNovedades().find((n) => n.id.toLowerCase().includes(q) || n.txt.toLowerCase().includes(q));
    if (nv) { location.hash = 'novedades'; abrirDetalle(nv.id); return; }
    toast('No encontré ese hotel, habitación o novedad'); return;
  }
  if (f.id === 'fAiAsk') {
    const inp = document.getElementById('qAi') as HTMLInputElement | null;
    const q = inp?.value.trim() ?? '';
    if (!q) return;
    const r = responderIA(q);
    aiChat.push({ q, ...r });
    renderPage();
    const box = document.getElementById('aiChatBox');
    if (box) box.scrollTop = box.scrollHeight;
    return;
  }
  if (f.id === 'fWaSim') {
    const inp = document.getElementById('waTxt') as HTMLInputElement | null;
    const sel = document.getElementById('waFrente') as HTMLSelectElement | null;
    const msg = inp?.value.trim() ?? '';
    const frente = sel?.value ?? 'HAB-216';
    if (!msg) return;
    const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const autor = S.nombreUser || (S.rol === 'contratista' ? `Residente · ${espDe(S.espUser).corto}` : 'Supervisor en Obra');
    const esProblema = /falta|choque|choca|error|interferencia|pendiente|daño/i.test(msg);
    if (esProblema) {
      const n: Novedad = {
        id: nuevoId(),
        ts: Date.now(),
        loc: frente,
        esp: S.espUser && S.espUser !== 'coo' ? S.espUser : 'arq',
        tipo: 'Interferencia',
        prio: 'Alta',
        txt: `[WhatsApp] ${msg}`,
        quien: autor,
        estado: 'Abierta',
      };
      await agregarNovedad(n);
      waLog.unshift({
        id: 'W-' + (waLog.length + 1),
        hora,
        autor,
        rol: 'Reporte WhatsApp',
        frente,
        tipo: 'texto',
        msg,
        resp: `Detecté una incidencia en ${ubic(frente)}. He creado automáticamente la novedad ${n.id} para el supervisor y actualizado la bitácora. ✓`,
        tag: `Auto-Novedad ${n.id}`,
      });
      toast(`WhatsApp → Novedad ${n.id} creada en bitácora`);
      renderChrome();
    } else {
      waLog.unshift({
        id: 'W-' + (waLog.length + 1),
        hora,
        autor,
        rol: 'Reporte WhatsApp',
        frente,
        tipo: 'texto',
        msg,
        resp: `Anotado en la bitácora del día para ${ubic(frente)}. Queda indexado para el corte de las 6:00 p.m. y consultas del Asistente IA. ✓`,
        tag: `Bitácora · ${frente}`,
      });
      toast('Entrada registrada en la bitácora de WhatsApp');
    }
    renderPage();
    return;
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
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if ($('layer').innerHTML && !formSolo && S.rol) { cerrarHoja(); form = null; habAbierta = ''; }
    else if (bim?.reportando) { bim.reportando = false; renderBimUi(); }
  }
});

void cargarObra().then(() => { if (PAGES.includes(route.split('-')[0])) { anim = true; renderPage(); } });
void cargarNovedades().then(() => { renderChrome(); if (PAGES.includes(route.split('-')[0])) renderPage(); });
addEventListener('twin:ruta', () => { route = decodeURIComponent(location.hash.slice(1)); renderChrome(); });
alCambiarPresencia((l) => { presentes = l; pintarWho(); });
alCambiarSesion((ev) => { if (ev === 'PASSWORD_RECOVERY') location.hash = 'nueva-clave'; });
void iniciarAuth().then((p) => { if (p) { sincronizarPerfil(); conectarPresencia(p); void iniciarNovedades(); void iniciarAvance(); void iniciarPersonal(); void cargarEquipo(); } void go(); });
alCambiarPersonal(() => { if (route === 'equipo') renderPage(); });
function pintarPanelAs(): void { const pa = $('asisPanel'); if (pa.hidden) return; pa.innerHTML = vChat(true); const l = document.getElementById('asLogP'); if (l) l.scrollTop = l.scrollHeight; }
alCambiarChat(() => { pintarPanelAs(); if (route === 'asistente') { renderPage(); const l = document.getElementById('asLog'); if (l) l.scrollTop = l.scrollHeight; } });
alCambiarAvance(() => { if (route === 'resumen') renderPage(); });
addEventListener('rs:novedades', (e) => { const d = (e as CustomEvent).detail as { fecha: string; tipo: 'nueva' | 'retraso' | 'imprevisto' }; filtroNovUI.periodo = 'dia'; filtroNovUI.fecha = d.fecha; filtroNovUI.tipos = new Set([d.tipo]); location.hash = 'novedades'; });
alCambiarNovedades(() => { if (!perfil) return; renderChrome(); bim?.setPins(listaNovedades()); if (PAGES.includes(route.split('-')[0]) && !parseRuta(route)) { renderPage(); } });

