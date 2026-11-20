/* BACO Obra · entrada de la app.
   Flujo: mapa de Colombia con los hoteles Estelar → La Fontana (escena 3D de HLF) → tocar la torre →
   elegir especialidad → modelo 3D del Piso 2 → reportar novedades (también desde QR en obra). */
import './app.css';
import { ESPECIALIDADES, HOTELES, TIPOS, UBICACIONES, type Novedad } from './data';
import { S, save, reset, listaNovedades, cargarNovedades, agregarNovedad, actualizarNovedad, nuevoId, comprimirFoto } from './store';
import { countUp, esc, ic, toast } from './ui';
import { OBRA, cargarObra, marcar, porEsp, porHab, realAct, fechaCorta } from './obra';
import { T, espDe, ubic, vAvance, vEntregables, vHonorarios, vNovedades, vPanel, vPlan, vProveedores, vQR, rowNov } from './pages';
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
  ['mapa', 'Hoteles en Colombia', 'globe'], ['obra', 'Edificio 3D', 'obra'], ['panel', 'Panel', 'panel'], ['plan', 'Planeación', 'plan'],
  ['avance', 'Avance semanal', 'avance'], ['proveedores', 'Proveedores', 'proveedores'], ['novedades', 'Novedades y QR', 'novedades'],
  ['entregables', 'Entregables', 'entregables'], ['honorarios', 'Honorarios', 'honorarios'],
];
const PAGES = ['panel', 'plan', 'avance', 'proveedores', 'novedades', 'qr', 'entregables', 'honorarios'];
let route = ''; let anim = true;
const filtroNov = { esp: 'todas', est: 'abiertas', q: '' };
let habFiltro = '';
let hotelSel: string | null = null;
let mapOpen = false;
let corteH = 6.15;
let pendingPinFocus: [number, number, number] | null = null;

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
let guiaVista = false; try { guiaVista = localStorage.getItem('baco-obra-guia') === '1'; } catch { /* */ }

/* ---------------- guía de pasos con flechas ---------------- */
const PASOS: [string, string][] = [['Elige el hotel', 'mapa'], ['Toca la torre', 'obra'], ['Elige especialidad', ''], ['Reporta en obra', '']];
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
      <div class="glass bimtitle" style="padding:10px 18px 10px 10px"><button class="circle" data-act="bimVolver" aria-label="Volver">${ic('back')}</button><div><h2>Piso 2 · ${e.corto}</h2><small>Torre Suites · ${e.desc}</small></div></div>
      ${pasos(bim?.reportando ? 3 : 2, 'bimpasos')}
      <div class="glass espbar">${ESPECIALIDADES.map((x) => `<button data-act="bimEsp" data-v="${x.id}" aria-pressed="${x.id === bimEsp}"><i style="background:${x.c}"></i>${x.corto}</button>`).join('')}</div>
    </div>
    <div class="bimui glass legend">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:2px"><b style="margin:0;color:var(--ink);font-size:13px">Capas (toca para aislar)</b>${hayOcultos ? `<button class="chip" data-act="bimResetGrupos" style="padding:3px 9px;font-size:11.5px">Ver todas</button>` : ''}</div>
      ${grupos.filter((g) => GRUPOS[g]).map((g) => {
        const oc = bim?.ocultos.has(g) ?? false;
        return `<button type="button" class="leg-btn ${oc ? 'off' : ''}" data-act="bimToggleGrupo" data-v="${g}" data-g="${g}" aria-pressed="${!oc}"><i style="background:${GRUPOS[g].c}"></i><span>${GRUPOS[g].n}</span></button>`;
      }).join('')}
      ${pinsVis ? `<div style="border-top:1px solid var(--line);padding-top:6px;margin-top:2px;font-size:12px;color:var(--muted)">${ic('pin', 1.8)} ${pinsVis} ${pinsVis === 1 ? 'novedad ubicada' : 'novedades ubicadas'} en 3D</div>` : ''}
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
let loginNombre = S.nombreUser || '';

function renderLogin(): void {
  const e = espDe(loginEsp);
  $('layer').innerHTML = `<div class="login-gate">
    <div class="login-bg"><img src="portada-milhoja.webp" alt=""></div>
    <form class="login-box" id="fLogin" role="dialog" aria-label="Portal de Acceso BACO Obra">
      <div class="login-head">
        <div class="login-logos">
          <img src="logos/baco.png" alt="BACO Studio">
          <span class="lsep"></span>
          <img src="logos/estelar.png" alt="Hoteles Estelar">
        </div>
        <span class="pill ok" style="padding:6px 12px;font-size:12px">ISO 19650 · CDE Activo</span>
      </div>
      <div>
        <p class="eyebrow">TORRE SUITES · HOTEL LA FONTANA · PISO 2 PROTOTIPO</p>
        <h1>Portal de Gestión <b>BIM & Obra</b></h1>
        <p class="sub">Selecciona tu perfil de ingreso para cargar tu entorno personalizado de control o ejecución técnica en campo.</p>
      </div>
      <div class="role-cards" role="radiogroup" aria-label="Perfil de acceso">
        <button type="button" class="rcard ${loginChoice === 'estelar' ? 'on' : ''}" data-act="loginRol" data-v="estelar" aria-pressed="${loginChoice === 'estelar'}">
          <div class="rtop"><span class="ric est">${ic('crown', 2)}</span><span class="rchk">${ic('check', 2.8)}</span></div>
          <b>Hoteles Estelar / Gerencia</b>
          <small>Dashboard ejecutivo: inversión, facturación, curva S, hitos contractuales y supervisión de contratistas.</small>
          <div class="rtags"><span>Panel Ejecutivo</span><span>Honorarios</span><span>Curva S</span><span>Mapa 3D</span></div>
        </button>
        <button type="button" class="rcard ${loginChoice === 'contratista' ? 'on' : ''}" data-act="loginRol" data-v="contratista" aria-pressed="${loginChoice === 'contratista'}">
          <div class="rtop"><span class="ric con">${ic('hard', 2)}</span><span class="rchk">${ic('check', 2.8)}</span></div>
          <b>Contratistas / Especialistas</b>
          <small>Dashboard técnico de obra: modelo 3D LOD 400 por red, checklist semanal, RFI, interferencias y códigos QR.</small>
          <div class="rtags"><span>Visor 3D BIM</span><span>Checklist Campo</span><span>RFI & QR</span><span>Planos</span></div>
        </button>
      </div>
      ${loginChoice === 'contratista' ? `
      <div class="login-sub">
        <span class="label" style="margin-bottom:6px">Especialidad o frente asignado</span>
        <div class="chiprow">${ESPECIALIDADES.map((x) => `<button type="button" class="chip" data-act="loginEsp" data-v="${x.id}" aria-pressed="${loginEsp === x.id}"><span class="sw" style="background:${x.c}"></span>${x.corto}</button>`).join('')}</div>
      </div>` : ''}
      <div class="login-fields">
        <div style="flex:1.4">
          <label class="label" for="lNombre">Nombre o responsable <small style="font-weight:500;opacity:.7">(opcional)</small></label>
          <input class="field" id="lNombre" value="${esc(loginNombre)}" placeholder="${loginChoice === 'estelar' ? 'Ej.: Dirección de Proyectos Estelar' : `Ej.: Ing. Residente · ${e.corto}`}">
        </div>
        <div style="flex:1">
          <label class="label" for="lDestino">Al ingresar abrir</label>
          <select class="field" id="lDestino">
            <option value="panel">Dashboard (${loginChoice === 'estelar' ? 'Ejecutivo Estelar' : 'Técnico de Obra'})</option>
            <option value="obra">Escena 3D Hotel La Fontana</option>
            <option value="bim-${loginChoice === 'contratista' ? loginEsp : 'coo'}">Visor BIM 3D · Piso 2</option>
            <option value="mapa">Mapa de Hoteles en Colombia</option>
          </select>
        </div>
      </div>
      <div class="login-foot">
        <button class="btn ${loginChoice === 'estelar' ? 'pri' : 'teal'} block cta" type="submit" style="padding:16px 22px;font-size:15.5px">
          ${ic(loginChoice === 'estelar' ? 'crown' : 'hard', 2)}
          <span>Entrar como <b>${loginChoice === 'estelar' ? 'Gerencia Estelar' : `Contratista · ${e.corto}`}</b></span>
          <span class="go">${ic('arrowR', 2.6)}</span>
        </button>
      </div>
    </form>
  </div>`;
}

/* ---------------- rail + topbar ---------------- */
function navActual(): [string, string, string][] {
  if (S.rol === 'contratista') {
    return [
      ['panel', 'Mi Frente', 'panel'],
      ['obra', 'Edificio 3D', 'obra'],
      ['avance', 'Avance semanal', 'avance'],
      ['novedades', 'Novedades y QR', 'novedades'],
      ['plan', 'Planeación', 'plan'],
      ['entregables', 'Entregables', 'entregables'],
      ['mapa', 'Hoteles Estelar', 'globe'],
    ];
  }
  return NAV;
}

function renderChrome(): void {
  const base = route.split('-')[0];
  const ab = listaNovedades().filter((n) => n.estado !== 'Cerrada').length;
  const nav = navActual();
  const isCon = S.rol === 'contratista';
  const eUser = espDe(S.espUser || 'arq');
  const uName = S.nombreUser || (isCon ? `Contratista · ${eUser.corto}` : 'Gerencia Estelar');
  const uSub = isCon ? `Frente ${eUser.corto} · Piso 2` : 'Hoteles Estelar · Propietario';
  const uInic = isCon ? eUser.corto.slice(0, 2).toUpperCase() : 'HE';
  const uBg = isCon ? `linear-gradient(135deg,${eUser.c},#141A21)` : 'linear-gradient(135deg,#C59B27,#16202B)';
  $('rail').innerHTML = `<button class="logo" data-act="cambiarRol" title="BACO Studio · Cambiar perfil de acceso">BS</button>` + nav.map(([k, l, i]) => `<a href="#${k}" ${base === k || (k === 'mapa' && base === '') || (k === 'novedades' && base === 'qr') ? 'aria-current="page"' : ''} aria-label="${l}">${ic(i)}<span class="lbl">${l}</span><span class="rtx">${l.split(' ')[0]}</span>${k === 'novedades' && ab ? `<span class="dot">${ab}</span>` : ''}</a>`).join('');
  $('topbar').innerHTML = `
    <form class="search" id="fBuscar" role="search">${ic('search')}<input id="q" list="sugerencias" placeholder="Buscar hotel, habitación (214–225) o novedad…" aria-label="Buscar hotel o habitación"><datalist id="sugerencias">${HOTELES.map((h) => `<option value="${esc(h.nombre)}">`).join('')}${UBICACIONES.map(([, t]) => `<option value="${esc(t)}">`).join('')}</datalist><button class="circle" type="submit" aria-label="Buscar">${ic('filter')}</button></form>
    ${base === 'mapa' || base === '' ? pasos(0) : base === 'obra' ? pasos(1) : '<div class="sp"></div>'}
    <button class="circle light" data-act="tema" aria-label="Cambiar tema" title="Cambiar modo claro / oscuro">${ic(oscuro() ? 'sun' : 'moon')}</button>
    <a class="circle light" href="#novedades" aria-label="${ab} novedades abiertas" style="position:relative">${ic('bell')}${ab ? '<i style="position:absolute;top:9px;right:10px;width:8px;height:8px;border-radius:50%;background:var(--coral);border:2px solid var(--card)"></i>' : ''}</a>
    <button class="user user-btn" data-act="cambiarRol" title="Cambiar perfil (Estelar / Contratista)">
      <span class="avatar" style="background:${uBg}">${uInic}</span>
      <span class="t"><b>${esc(uName)}</b><small>${esc(uSub)}</small></span>
      <span class="role-switch">${ic('logout', 1.8)}</span>
    </button>`;
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
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn coral cta" href="#obra" style="flex:1.2">${ic('obra')} Entrar en 3D <span class="go">${ic('arrowR', 2.6)}</span></a>
          <a class="btn" href="#panel" style="flex:1" title="Abrir tablero de control sin esperar el mapa 3D">${ic('panel')} Ir al Panel</a>
        </div>
        <button class="chip" data-act="toggleLista" style="align-self:center">${mapOpen ? 'Ocultar' : 'Ver'} todos los hoteles</button></div></div>
      <div class="glass hlist">${ciudades.map((c) => `<span class="city">${c}</span>` + HOTELES.filter((h) => h.ciudad === c).map((h) => `<button class="hrow ${h.obra ? 'obra' : ''}" data-act="hotel" data-v="${h.id}" aria-pressed="${hotelSel === h.id}"><span class="pin">${ic(h.obra ? 'build' : 'pin', 2)}</span><span><b>${esc(h.nombre)}</b><small>${esc(h.dir)}</small></span></button>`).join('')).join('')}</div>
    </aside>
    ${sel ? `<aside class="hcard glass"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><p class="muted" style="font-size:12.5px;font-weight:800">${esc(sel.ciudad)}</p><h2 style="font-size:20px;font-weight:800">${esc(sel.nombre)}</h2><p class="muted" style="font-size:13.5px">${esc(sel.dir)}</p></div><button class="circle sm light" data-act="cerrarHotel" aria-label="Cerrar">${ic('x')}</button></div>
      ${sel.obra ? `<span class="pill crit">Remodelación en curso</span><a class="btn coral block" href="#obra">${ic('obra')} Entrar al hotel</a>` : `<span class="pill neu">Sin obra activa</span><p class="muted" style="font-size:13px">Ubicación aproximada por dirección. Solo La Fontana tiene modelo 3D en esta etapa.</p><button class="btn block" data-act="colombia">${ic('globe')} Ver toda Colombia</button>`}</aside>` : ''}`;
  } else if (route === 'obra') {
    ov.innerHTML = `<button class="tapme" data-act="elegirEsp" aria-label="Tocar la torre en remodelación"><span class="tapbub">${ic('tap', 2)} Toca aquí la torre</span><span class="taparrow">${ic('down', 2.8)}</span><span class="tapring"></span></button>
    <div class="hint" style="display:flex;gap:10px;align-items:center;white-space:normal;max-width:calc(100vw - 28px);flex-wrap:wrap;justify-content:center"><span class="pulse"></span><span>Paso 2 · explora o toca la torre</span>
      <button class="chip" data-act="elegirEsp" style="background:var(--coral);color:#fff">Elegir especialidad (3D BIM) ${ic('arrowR', 2.4)}</button>
      <button class="chip" data-act="piso2" title="Separar pisos superiores en el modelo exterior">Abrir Piso 2</button>
      <button class="chip" data-act="completo" title="Restaurar edificio completo">Edificio completo</button>
      <a class="chip" href="#panel">Panel</a>
      <a class="chip" href="#mapa">Colombia</a></div>`;
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
    </div>
    <div><span class="label">Actividades de la habitación (${a.hechas} de ${acts.length} terminadas)</span>
      <div class="scrollbox" style="max-height:220px">${acts.map((ac) => { const d = espDe(ac.esp), done = realAct(ac) >= 1; return `<label class="check ${done ? 'done' : ''}"><input type="checkbox" data-act="hecho" data-v="${esc(ac.id)}" ${done ? 'checked' : ''}><span class="bx">${ic('check', 3)}</span><span class="tx" style="flex:1"><b>${esc(ac.fase.replace(/^\d+\.\s*/, ''))}</b><small><span style="color:${d.c};font-weight:900">●</span> ${esc(ac.quien)} · ${fd(ac.ini)}–${fd(ac.fin)}</small></span></label>`; }).join('')}</div>
    </div>
    ${novs.length ? `<div><span class="label">Novedades registradas (${novs.length})</span><div class="list">${novs.map(rowNov).join('')}</div></div>` : ''}
  </div></div>`;
}

/* ---------------- render de rutas ---------------- */
function renderPage(): void {
  const page = $('page');
  const base = route.split('-')[0];
  if (!PAGES.includes(base)) { page.innerHTML = ''; page.className = ''; return; }
  const html = base === 'panel' ? vPanel() : base === 'plan' ? vPlan() : base === 'avance' ? vAvance(habFiltro) : base === 'proveedores' ? vProveedores()
    : base === 'novedades' ? vNovedades(filtroNov) : base === 'qr' ? vQR() : base === 'entregables' ? vEntregables() : vHonorarios();
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
  if (!S.rol) {
    $('rail').hidden = true; $('topbar').hidden = true; $('page').innerHTML = ''; $('page').className = ''; $('ov').innerHTML = '';
    bim?.cerrar(); $('bim').hidden = true;
    pausarMapa(true);
    renderLogin();
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
  if (a === 'novEstado' || a === 'novVer3d') ev.stopPropagation();
  switch (a) {
    case 'cerrarHojaFondo': if (t === b) { cerrarHoja(); form = null; habAbierta = ''; } return;
    case 'cerrarHoja': cerrarHoja(); form = null; habAbierta = ''; return;
    case 'hotel': seleccionarHotel(v); return;
    case 'cerrarHotel': hotelSel = null; renderOv(); return;
    case 'colombia': hotelSel = null; renderOv(); (await cargarMapa()).vistaColombia(); return;
    case 'toggleLista': mapOpen = !mapOpen; renderOv(); return;
    case 'elegirEsp': hojaEspecialidad(); return;
    case 'piso2': W.HLF?.piso2(); return;
    case 'completo': W.HLF?.completo(); return;
    case 'irBim': cerrarHoja(); location.hash = 'bim-' + v; return;
    case 'abrirBim': cerrarHoja(); habAbierta = ''; location.hash = 'bim-' + v; return;
    case 'bimEsp': bimEsp = v; history.replaceState(null, '', '#bim-' + v); route = 'bim-' + v; void bim?.abrir(v).then(renderBimUi); renderBimUi(); return;
    case 'bimVolver': location.hash = W.HLF ? 'obra' : 'panel'; return;
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
        if (n.pos) pendingPinFocus = n.pos;
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
      if (inp) loginNombre = inp.value;
      loginChoice = v as 'estelar' | 'contratista';
      renderLogin();
      return;
    }
    case 'loginEsp': {
      const inp = document.getElementById('lNombre') as HTMLInputElement | null;
      if (inp) loginNombre = inp.value;
      loginEsp = v;
      renderLogin();
      return;
    }
    case 'cambiarRol': {
      loginChoice = S.rol ?? 'estelar';
      loginEsp = S.espUser || 'arq';
      loginNombre = S.nombreUser || '';
      renderLogin();
      return;
    }
    case 'setEspUser': {
      S.espUser = v;
      filtroNov.esp = v === 'coo' ? 'todas' : v;
      save();
      anim = true;
      renderChrome();
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
    const dest = (document.getElementById('lDestino') as HTMLSelectElement | null)?.value ?? 'panel';
    S.rol = loginChoice;
    S.espUser = loginChoice === 'contratista' ? loginEsp : 'coo';
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
void go();
