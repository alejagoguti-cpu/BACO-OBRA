/* Área de trabajo espacial del gemelo: Torre Suites → VER BIM → Piso 2 → Habitación → Gemelo → Elemento.
   La sidebar es de app.ts y nunca se oculta; este módulo solo ocupa el espacio restante (#twin).
   El estado (cámara, capas, selección) vive mientras la sesión esté abierta: volver atrás no recarga nada. */
import './twin.css';
import { crearStage, type Stage, type Modo } from './stage';
import { crearRoom, type Room, type ElementoTwin } from './room';
import { ESPECIALIDADES, TWIN, CAT_TXT } from './config';
import { leerElemento, guardarElemento, comentar, abrirIncidencia, cerrarIncidencia, responsablesDe, incidenciasAbiertas, ESTADOS, type FilaElemento, type Evento } from './datos';
import { perfil, puedeEditar } from '../app/auth';
import { informarUbicacion, alCambiarPresencia, type Presente } from '../app/presence';
import { OBRA, cargarObra, porHab } from '../app/obra';
import { listaNovedades } from '../app/store';
import { esc, ic, toast } from '../app/ui';

export type RutaTwin =
  | { v: 'edificio' } | { v: 'bim' } | { v: 'planta'; hab?: string }
  | { v: 'gemelo'; hab: string; el?: string };

export function parseRuta(h: string): RutaTwin | null {
  const p = h.split('/');
  if (p[0] !== 'fontana') return null;
  if (p.length === 1) return { v: 'edificio' };
  if (p[1] === 'bim') return { v: 'bim' };
  if (p[1] === 'piso-2') return p[2] ? { v: 'planta', hab: p[2] } : { v: 'planta' };
  if (/^\d{3}$/.test(p[1]) && p[2] === 'gemelo') return { v: 'gemelo', hab: p[1], el: p[3] ? decodeURIComponent(p[3]) : undefined };
  return { v: 'edificio' };
}

let host: HTMLElement;
let stage: Stage | null = null;
let room: Room | null = null; let roomHab = '';
let ruta: RutaTwin = { v: 'edificio' };
let edificioSel = false;
let habSel: string | null = null;
let elSel: ElementoTwin | null = null;
let capasAbiertas = true;
let presentes: Presente[] = [];
const $ = (s: string) => host.querySelector<HTMLElement>(s);

export function montarWorkspace(el: HTMLElement): void {
  host = el;
  host.innerHTML = `
    <div class="tw-stage" id="twStage"></div>
    <div class="tw-room" id="twRoom" hidden></div>
    <div class="tw-veil" id="twVeil"></div>
    <div class="tw-ui" id="twUi"></div>`;
  host.addEventListener('click', onClick);
  host.addEventListener('input', onInput);
  host.addEventListener('submit', onSubmit);
  alCambiarPresencia((l) => { presentes = l; pintarCoincidencias(); });
}

function asegurarStage(): Stage {
  if (stage) return stage;
  stage = crearStage($('#twStage')!);
  stage.onModo = (m: Modo) => {
    if (m === 'planta' && ruta.v === 'bim') { history.replaceState(null, '', '#fontana/piso-2'); ruta = { v: 'planta' }; dispatchEvent(new CustomEvent('twin:ruta')); }
    if (m === 'edificio' && ruta.v !== 'edificio') { history.replaceState(null, '', '#fontana'); ruta = { v: 'edificio' }; dispatchEvent(new CustomEvent('twin:ruta')); }
    render();
  };
  stage.onEdificio = (s) => { edificioSel = s; informarUbicacion({ vista: 'Hotel La Fontana', lugar: s ? 'Torre Suites' : '', elemento: '' }); render(); };
  stage.onHabitacion = (n) => {
    habSel = n;
    const h = n ? `#fontana/piso-2/${n}` : '#fontana/piso-2';
    if (location.hash !== h) history.replaceState(null, '', h);
    ruta = n ? { v: 'planta', hab: n } : { v: 'planta' };
    informarUbicacion({ vista: 'Piso 2', lugar: n ? 'HAB-' + n : '', elemento: '' });
    dispatchEvent(new CustomEvent('twin:ruta'));
    render();
  };
  stage.onProgreso = (p) => { const r = host.querySelector<HTMLInputElement>('#twScrub'); if (r) r.value = String(Math.round(p * 1000)); const b = $('#twPlay'); if (b) b.innerHTML = stage!.tl.isActive() ? ic('pause') : ic('play'); };
  void stage.listo.then(() => render()).catch((e) => { console.error(e); toast('No se pudo cargar el modelo de la Torre Suites'); });
  return stage;
}

/** Entra o actualiza la vista espacial según la ruta (#fontana…). */
export async function abrirWorkspace(r: RutaTwin): Promise<void> {
  const previa = ruta; ruta = r;
  host.hidden = false;
  const s = asegurarStage();
  s.pausar(r.v === 'gemelo');
  await s.listo;
  if (r.v === 'gemelo') { await abrirGemelo(r.hab, r.el); render(); return; }
  cerrarGemelo();
  if (r.v === 'edificio') {
    informarUbicacion({ vista: 'Hotel La Fontana', lugar: edificioSel ? 'Torre Suites' : '', elemento: '' });
    if (s.modo !== 'edificio' && previa.v !== 'edificio') s.volverAEdificio();
  } else if (r.v === 'bim') {
    informarUbicacion({ vista: 'BIM · Torre Suites', lugar: '', elemento: '' });
    if (s.modo === 'edificio') s.verBim();
  } else if (r.v === 'planta') {
    if (s.modo === 'edificio') {
      // llegada directa (recarga o enlace): se anima igual, no se salta la explosión
      s.verBim();
    }
    if (r.hab !== habSel) s.seleccionarHabitacion(r.hab ?? null);
    informarUbicacion({ vista: 'Piso 2', lugar: r.hab ? 'HAB-' + r.hab : '', elemento: '' });
  }
  render();
}
export function ocultarWorkspace(): void { if (!host) return; host.hidden = true; stage?.pausar(true); cerrarGemelo(); }

/* ---------------- gemelo interior ---------------- */
async function abrirGemelo(hab: string, elId?: string): Promise<void> {
  const cfg = TWIN.habitaciones[hab];
  const veil = $('#twVeil')!;
  if (!cfg) { toast(`El gemelo de la habitación ${hab} está pendiente de vinculación`); location.hash = '#fontana/piso-2/' + hab; return; }
  informarUbicacion({ vista: 'Gemelo digital', lugar: 'HAB-' + hab, elemento: elId ?? '' });
  if (room && roomHab === hab) { if (elId !== undefined) room.seleccionarPorId(elId); return; }
  // transición: la planta se acerca a la habitación y un velo funde hacia el interior
  if (stage?.modo === 'planta') { stage.pausar(false); await stage.acercarHabitacion(hab); }
  veil.classList.add('on');
  await new Promise((r) => setTimeout(r, 450));
  stage?.pausar(true);
  const rh = $('#twRoom')!; rh.hidden = false; rh.innerHTML = '';
  room?.dispose();
  room = crearRoom(rh, cfg.gemelo); roomHab = hab;
  room.onSeleccion = (e) => {
    elSel = e;
    const h = `#fontana/${hab}/gemelo${e ? '/' + encodeURIComponent(e.id) : ''}`;
    if (location.hash !== h) history.replaceState(null, '', h);
    ruta = { v: 'gemelo', hab, el: e?.id };
    informarUbicacion({ vista: 'Gemelo digital', lugar: 'HAB-' + hab, elemento: e?.id ?? '' });
    dispatchEvent(new CustomEvent('twin:ruta'));
    render();
    if (e) void pintarFicha(e);
  };
  render();
  try { await room.listo; } catch (e) { console.error(e); toast('No se pudo cargar el gemelo de la habitación'); }
  veil.classList.remove('on');
  if (elId) room.seleccionarPorId(elId);
}
function cerrarGemelo(): void {
  if (!room) return;
  room.dispose(); room = null; roomHab = ''; elSel = null;
  const rh = $('#twRoom'); if (rh) { rh.hidden = true; rh.innerHTML = ''; }
  stage?.pausar(false);
}

/* ---------------- interfaz ---------------- */
function render(): void {
  const ui = $('#twUi'); if (!ui) return;
  const s = stage;
  const modo = s?.modo ?? 'edificio';
  let html = '';
  if (ruta.v === 'gemelo') html = uiGemelo();
  else if (modo === 'edificio') html = uiEdificio();
  else html = uiBim(modo) + (modo === 'planta' ? uiCapas() + (habSel ? uiHabitacion(habSel) : '') : '');
  ui.innerHTML = html;
  if (habSel && modo === 'planta' && ruta.v !== 'gemelo') void completarHabitacion(habSel);
  pintarCoincidencias();
}

function uiEdificio(): string {
  const cargando = !s0();
  return `
  <div class="tw-card tw-intro">
    <span class="tw-over">Hotel Estelar La Fontana · Bogotá</span>
    <h2>Complejo arquitectónico</h2>
    <p>${cargando ? 'Cargando el modelo Revit de la Torre Suites…' : 'Pasa el cursor y haz clic sobre la Torre Suites para seleccionarla. Doble clic para acercar.'}</p>
    <dl class="tw-dl"><div><dt>Modelo</dt><dd>HLF_P2-P6.rvt · 7 niveles</dd></div><div><dt>Contexto</dt><dd>Resto del complejo sin BIM (fotogrametría)</dd></div></dl>
  </div>
  ${edificioSel ? `<div class="tw-card tw-sel">
    <span class="tw-over">Edificio seleccionado</span>
    <h3>${esc(TWIN.edificios[0].nombre)}</h3>
    <p class="tw-muted">${esc(TWIN.edificios[0].descripcion)}</p>
    <button class="tw-btn pri lg" data-tw="verBim">${ic('layers', 2)} VER BIM</button>
    <button class="tw-btn ghost" data-tw="deselEd">Quitar selección</button>
  </div>` : ''}
  <div class="tw-tools"><button class="tw-ico" data-tw="encuadrar" title="Encuadrar">${ic('area')}</button></div>`;
}
function s0(): boolean { return !!stage && stage.habitaciones !== undefined && !!stage.tl; }

function uiBim(modo: Modo): string {
  const p = Math.round((stage?.tl.progress() ?? 0) * 1000);
  const activo = stage?.tl.isActive();
  return `
  <div class="tw-timeline ${modo === 'planta' ? 'min' : ''}" role="group" aria-label="Secuencia BIM">
    <button class="tw-ico" data-tw="tlVolver" title="Volver al edificio">${ic('back')}</button>
    <button class="tw-ico" data-tw="tlReverse" title="Retroceder">${ic('rew')}</button>
    <button class="tw-ico" id="twPlay" data-tw="tlPlay" title="Reproducir / pausar">${activo ? ic('pause') : ic('play')}</button>
    <button class="tw-ico" data-tw="tlRestart" title="Repetir">${ic('reset')}</button>
    <input type="range" id="twScrub" min="0" max="1000" value="${p}" aria-label="Posición de la secuencia">
    <span class="tw-steps">Explosión · Sistemas · Piso 2 · Planta</span>
  </div>`;
}

function uiCapas(): string {
  if (!stage) return '';
  return `<aside class="tw-card tw-layers ${capasAbiertas ? '' : 'closed'}">
    <button class="tw-lhead" data-tw="toggleCapas"><span><span class="tw-over">Coordinación · Piso 2</span><b>Especialidades</b></span>${ic(capasAbiertas ? 'down' : 'chev', 2)}</button>
    ${capasAbiertas ? `<div class="tw-lrows">${ESPECIALIDADES.map((e) => {
      const c = stage!.capas.get(e.id)!;
      const n = stage!.conteo(e.id);
      const disponible = e.fuente && n.cats.length;
      if (!disponible) return `<div class="tw-lrow off"><i style="background:${e.color}"></i><span><b>${e.nombre}</b><small>Modelo pendiente de vinculación</small></span></div>`;
      const iso = stage!.aislada === e.id;
      return `<div class="tw-lrow ${c.visible ? '' : 'hid'} ${iso ? 'iso' : ''}">
        <i style="background:${e.color}"></i>
        <span><b>${e.nombre}</b><small>${n.cats.map((x) => CAT_TXT[x] ?? x).join(' · ')}</small></span>
        <div class="tw-lact">
          <button data-tw="capaVis" data-v="${e.id}" aria-pressed="${c.visible}" title="Mostrar u ocultar">${ic('eye', 1.8)}</button>
          <button data-tw="capaIso" data-v="${e.id}" aria-pressed="${iso}" title="Aislar">${ic('focus', 1.8)}</button>
          <button data-tw="capaHl" data-v="${e.id}" aria-pressed="${c.resaltada}" title="Resaltar">${ic('spark', 1.8)}</button>
          <button data-tw="capaInfo" data-v="${e.id}" title="Consultar">${ic('help', 1.8)}</button>
        </div>
        <input type="range" min="0" max="100" value="${Math.round(c.opacidad * 100)}" data-capa="${e.id}" aria-label="Transparencia ${e.nombre}">
      </div>`;
    }).join('')}
    <p class="tw-note">${ic('help', 1.6)} Interferencias: pendiente. La geometría exportada está agrupada por categoría, sin ID por elemento; hace falta exportar elementos individuales del Revit para detectarlas.</p>
    </div>` : ''}
  </aside>`;
}

function uiHabitacion(num: string): string {
  const h = stage?.habitaciones.find((x) => x.numero === num);
  const cfg = TWIN.habitaciones[num];
  const hb = OBRA?.habitaciones.find((x) => x.hab === num);
  return `<aside class="tw-card tw-panel" aria-label="Habitación ${esc(num)}">
    <div class="tw-phead"><div><span class="tw-over">Piso 2 · ${esc(hb?.frente ?? 'Torre Suites')}</span><h3>Habitación ${esc(num)}</h3></div><button class="tw-ico sm" data-tw="cerrarHab" aria-label="Cerrar">${ic('x')}</button></div>
    <dl class="tw-dl">
      <div><dt>Identificador</dt><dd>${esc(num)} · Room ${h?.revitId ?? '—'}</dd></div>
      <div><dt>Área (Revit)</dt><dd>${h ? h.area_m2.toFixed(2) + ' m²' : '—'}</dd></div>
      <div><dt>Tipo</dt><dd>${esc(hb?.tipo ?? '—')}</dd></div>
    </dl>
    <div class="tw-sec"><span class="tw-lbl">Especialidades disponibles</span><div class="tw-chips">${ESPECIALIDADES.map((e) => {
      const ok = !!(e.fuente && stage?.conteo(e.id).cats.length);
      return `<span class="tw-chip ${ok ? '' : 'off'}"><i style="background:${e.color}"></i>${e.nombre}</span>`;
    }).join('')}${cfg ? '<span class="tw-chip"><i style="background:#1E9A62"></i>Gemelo interior</span>' : ''}</div></div>
    <div class="tw-sec" id="twHabEstado"><span class="tw-lbl">Estado de remodelación</span><p class="tw-muted">Cargando programación…</p></div>
    <div class="tw-sec" id="twHabResp"><span class="tw-lbl">Responsables asignados</span><p class="tw-muted">Consultando…</p></div>
    <div class="tw-sec" id="twHabInc"><span class="tw-lbl">Incidencias</span><p class="tw-muted">Consultando…</p></div>
    ${cfg ? `<a class="tw-btn pri lg" href="#fontana/${esc(num)}/gemelo">${ic('cube', 2)} Entrar al gemelo digital</a>` : '<p class="tw-pend">Gemelo interior: modelo pendiente de vinculación</p>'}
    <p class="tw-coinc" id="twCoinc" hidden></p>
  </aside>`;
}
async function completarHabitacion(num: string): Promise<void> {
  await cargarObra();
  const est = $('#twHabEstado');
  if (est && habSel === num) {
    const a = porHab(num); const hb = OBRA?.habitaciones.find((x) => x.hab === num);
    est.innerHTML = `<span class="tw-lbl">Estado de remodelación</span>${hb ? `
      <div class="tw-bars"><div><small>Programado a hoy</small><b>${Math.round(a.prog * 100)}%</b><span><i style="width:${a.prog * 100}%"></i></span></div>
      <div><small>Real reportado</small><b>${Math.round(a.real * 100)}%</b><span class="real"><i style="width:${a.real * 100}%"></i></span></div></div>
      <small class="tw-muted">${a.hechas}/${a.n} actividades · ${esc(hb.ini)} → ${esc(hb.fin)} · fuente: Programación de obra HE La Fontana${a.real === 0 ? ' · sin avance real reportado' : ''}</small>` : '<p class="tw-muted">Sin programación para esta habitación.</p>'}`;
  }
  const [resp, inc] = await Promise.all([responsablesDe('HAB-' + num), incidenciasAbiertas('HAB-' + num)]);
  const twinResp = TWIN.habitaciones[num] ? await responsablesDe('SKP' + num + ':') : [];
  const quien = [...new Set((OBRA?.actividades ?? []).filter((x) => x.hab === num).map((x) => x.quien).filter(Boolean))];
  const r = $('#twHabResp');
  if (r && habSel === num) {
    const todos = [...resp, ...twinResp];
    r.innerHTML = `<span class="tw-lbl">Responsables asignados</span>${todos.length
      ? `<ul class="tw-list">${todos.map((f) => `<li><b>${esc(f.responsable)}</b><small>${esc(f.empresa ?? '')} · ${esc(f.nombre || f.element_id)}</small></li>`).join('')}</ul>`
      : '<p class="tw-muted">Sin responsable asignado</p>'}
      ${quien.length ? `<small class="tw-muted">Frentes en la programación: ${quien.map(esc).join(', ')}</small>` : ''}`;
  }
  const n = listaNovedades().filter((x) => x.loc === 'HAB-' + num && x.estado !== 'Cerrada');
  const ii = $('#twHabInc');
  if (ii && habSel === num) {
    ii.innerHTML = `<span class="tw-lbl">Incidencias</span>${inc.length + n.length ? `<ul class="tw-list">${inc.map((e) => `<li><b>${esc(e.detalle)}</b><small>Elemento ${esc(e.element_id)} · ${new Date(e.ts).toLocaleDateString('es-CO')}</small></li>`).join('')}${n.map((x) => `<li><b>${esc(x.txt)}</b><small>${esc(x.id)} · ${esc(x.prio)} ${x.ej ? '<span class="tw-tag">ejemplo</span>' : ''}</small></li>`).join('')}</ul>` : '<p class="tw-muted">Sin incidencias abiertas</p>'}`;
  }
}

function uiGemelo(): string {
  if (ruta.v !== 'gemelo') return '';
  const cfg = TWIN.habitaciones[ruta.hab];
  const v = room?.vistaActual ?? 'maqueta';
  return `
  <div class="tw-card tw-intro">
    <span class="tw-over">Gemelo digital · Piso 2</span>
    <h2>Habitación ${esc(ruta.hab)}</h2>
    <p class="tw-muted">${esc(cfg?.fuenteGemelo ?? '')}</p>
    <div class="tw-seg"><button data-tw="vista" data-v="maqueta" aria-pressed="${v === 'maqueta'}">Maqueta</button><button data-tw="vista" data-v="recorrido" aria-pressed="${v === 'recorrido'}">Recorrido</button></div>
    ${v === 'recorrido' ? `<div class="tw-walk"><button class="tw-ico" data-tw="paso" data-v="-1">${ic('left')}</button><span>Punto de vista</span><button class="tw-ico" data-tw="paso" data-v="1">${ic('right')}</button></div>` : ''}
    <label class="tw-range"><span>Exposición</span><input type="range" id="twExpo" min="60" max="160" value="105"></label>
    <p class="tw-hint">Haz clic en cualquier objeto para ver su ficha técnica.</p>
  </div>
  <aside class="tw-card tw-panel tw-ficha" id="twFicha" ${elSel ? '' : 'hidden'}></aside>
  <p class="tw-coinc floating" id="twCoinc" hidden></p>`;
}

async function pintarFicha(e: ElementoTwin): Promise<void> {
  const box = $('#twFicha'); if (!box) return;
  box.hidden = false;
  box.innerHTML = `<div class="tw-phead"><div><span class="tw-over">${esc(e.especialidad)}</span><h3>${esc(e.categoria)}</h3></div><button class="tw-ico sm" data-tw="cerrarFicha" aria-label="Cerrar">${ic('x')}</button></div><p class="tw-muted">Cargando ficha…</p>`;
  const { fila, eventos } = await leerElemento(e.id, { nombre: e.nombre, especialidad: e.especialidad });
  if (elSel?.id !== e.id) return;
  const ed = puedeEditar(perfil);
  const abiertas = eventos.filter((x) => x.tipo === 'incidencia' && x.abierta);
  box.innerHTML = `
    <div class="tw-phead"><div><span class="tw-over">${esc(e.especialidad)}</span><h3>${esc(e.categoria)}</h3></div><button class="tw-ico sm" data-tw="cerrarFicha" aria-label="Cerrar">${ic('x')}</button></div>
    <dl class="tw-dl">
      <div><dt>Elemento</dt><dd>${esc(e.nombre)}</dd></div>
      <div><dt>Identificador</dt><dd><code>${esc(e.id)}</code><small class="tw-muted"> (nodo del modelo SketchUp; sin ID Revit)</small></dd></div>
      <div><dt>Especialidad</dt><dd>${esc(e.especialidad)}</dd></div>
      <div><dt>Responsable</dt><dd>${fila.responsable ? esc(fila.responsable) : '<span class="tw-muted">Sin responsable asignado</span>'}</dd></div>
      <div><dt>Empresa o equipo</dt><dd>${fila.empresa ? esc(fila.empresa) : '—'}</dd></div>
      <div><dt>Estado de revisión</dt><dd><span class="tw-st st-${ESTADOS.indexOf(fila.estado_revision)}">${esc(fila.estado_revision)}</span></dd></div>
      <div><dt>Última modificación</dt><dd>${fila.updated_at ? new Date(fila.updated_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</dd></div>
      <div><dt>Observaciones</dt><dd>${fila.observaciones ? esc(fila.observaciones) : '—'}</dd></div>
      <div><dt>Incidencias abiertas</dt><dd>${abiertas.length}</dd></div>
    </dl>
    ${ed ? `<form class="tw-form" id="twFormEl" data-id="${esc(e.id)}">
      <span class="tw-lbl">Asignación y revisión</span>
      <input name="responsable" placeholder="Nombre del responsable" value="${esc(fila.responsable ?? '')}">
      <input name="empresa" placeholder="Empresa o equipo" value="${esc(fila.empresa ?? '')}">
      <select name="estado">${ESTADOS.map((s) => `<option ${s === fila.estado_revision ? 'selected' : ''}>${s}</option>`).join('')}</select>
      <textarea name="obs" placeholder="Observaciones">${esc(fila.observaciones)}</textarea>
      <button class="tw-btn pri">Guardar</button>
    </form>` : `<p class="tw-note">${ic('key', 1.6)} Tu rol (${esc(perfil?.rol ?? 'sin sesión')}) puede comentar y reportar incidencias; asignar y cambiar estados lo hacen Administración, Estelar o Coordinación BIM.</p>`}
    <form class="tw-form" id="twFormCom" data-id="${esc(e.id)}">
      <span class="tw-lbl">Comentario o incidencia</span>
      <textarea name="txt" placeholder="Escribe un comentario…" required></textarea>
      <div class="tw-row"><button class="tw-btn" name="tipo" value="comentario">Comentar</button><button class="tw-btn warn" name="tipo" value="incidencia">Abrir incidencia</button></div>
    </form>
    <div class="tw-sec"><span class="tw-lbl">Historial de cambios</span>${eventos.length ? `<ul class="tw-hist">${eventos.map((x: Evento) => `<li class="t-${x.tipo}"><b>${esc(x.autor ?? '')}</b> <span>${esc(x.detalle)}</span><small>${new Date(x.ts).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })} · ${x.tipo}${x.tipo === 'incidencia' ? (x.abierta ? ` · abierta ${ed ? `<button data-tw="cerrarInc" data-v="${x.id}">cerrar</button>` : ''}` : ' · cerrada') : ''}</small></li>`).join('')}</ul>` : '<p class="tw-muted">Sin cambios registrados</p>'}</div>`;
  pintarCoincidencias();
}

/* coincidencias de presencia: otras personas en la misma habitación / elemento */
function pintarCoincidencias(): void {
  const el = host?.querySelector<HTMLElement>('#twCoinc'); if (!el) return;
  const hab = ruta.v === 'gemelo' ? ruta.hab : ruta.v === 'planta' ? ruta.hab : undefined;
  if (!hab) { el.hidden = true; return; }
  const otros = presentes.filter((p) => p.uid !== perfil?.id && p.lugar === 'HAB-' + hab);
  if (!otros.length) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `${ic('user', 1.8)} También ${otros.length === 1 ? 'está' : 'están'} revisando la ${hab}: ${otros.map((p) => `<b>${esc(p.nombre)}</b>${p.elemento && elSel && p.elemento === elSel.id ? ' (mismo elemento)' : ''}${p.activo ? '' : ' · inactivo'}`).join(', ')}`;
}

/* ---------------- eventos ---------------- */
async function onClick(ev: Event): Promise<void> {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-tw]'); if (!b) return;
  const a = b.dataset.tw!, v = b.dataset.v ?? '';
  const s = stage;
  switch (a) {
    case 'verBim': location.hash = '#fontana/bim'; return;
    case 'deselEd': s?.seleccionarEdificio(false); return;
    case 'encuadrar': s?.encuadrar(); return;
    case 'tlVolver': location.hash = '#fontana'; return;
    case 'tlPlay': if (!s) return; if (s.tl.isActive()) s.tl.pause(); else { if (s.modo === 'planta') return; s.tl.timeScale(1); if (s.tl.progress() >= 1) s.tl.restart(); else s.tl.play(); } render(); return;
    case 'tlReverse': if (!s) return; if (s.modo === 'planta') { s.volverAEdificio(); return; } s.tl.timeScale(1.4).reverse(); render(); return;
    case 'tlRestart': if (!s) return; if (s.modo === 'planta') { s.volverAEdificio(); setTimeout(() => { location.hash = '#fontana/bim'; }, 300); return; } s.tl.timeScale(1).restart(); render(); return;
    case 'toggleCapas': capasAbiertas = !capasAbiertas; render(); return;
    case 'capaVis': { const c = s?.capas.get(v); if (c) s!.setCapa(v, { visible: !c.visible }); render(); return; }
    case 'capaIso': s?.aislarCapa(v); render(); return;
    case 'capaHl': { const c = s?.capas.get(v); if (c) s!.setCapa(v, { resaltada: !c.resaltada }); render(); return; }
    case 'capaInfo': {
      const e = ESPECIALIDADES.find((x) => x.id === v)!; const n = s!.conteo(v);
      toast(`${e.nombre}: ${n.cats.map((c) => CAT_TXT[c] ?? c).join(', ')} · ${n.elementos != null ? n.elementos.toLocaleString('es-CO') + ' elementos · ' : ''}${Math.round(n.tris).toLocaleString('es-CO')} triángulos · ${e.fuente}`);
      return;
    }
    case 'cerrarHab': s?.seleccionarHabitacion(null); return;
    case 'vista': room?.vista(v as 'maqueta' | 'recorrido'); render(); return;
    case 'paso': room?.paso(+v as 1 | -1); return;
    case 'cerrarFicha': room?.seleccionarPorId(null); return;
    case 'cerrarInc': { const err = await cerrarIncidencia(+v); toast(err ?? 'Incidencia cerrada'); if (elSel) void pintarFicha(elSel); return; }
  }
}
function onInput(ev: Event): void {
  const t = ev.target as HTMLInputElement;
  if (t.id === 'twScrub' && stage) { stage.tl.pause(); stage.tl.progress(+t.value / 1000); return; }
  if (t.dataset.capa && stage) { stage.setCapa(t.dataset.capa, { opacidad: +t.value / 100 }); return; }
  if (t.id === 'twExpo') room?.setExposicion(+t.value / 100);
}
async function onSubmit(ev: Event): Promise<void> {
  const f = ev.target as HTMLFormElement;
  if (f.id !== 'twFormEl' && f.id !== 'twFormCom') return;
  ev.preventDefault();
  if (!elSel) return;
  const fd = new FormData(f);
  if (f.id === 'twFormEl') {
    const { fila } = await leerElemento(elSel.id, { nombre: elSel.nombre, especialidad: elSel.especialidad });
    const err = await guardarElemento(fila, { responsable: String(fd.get('responsable') || '').trim() || null, empresa: String(fd.get('empresa') || '').trim() || null, estado_revision: fd.get('estado') as FilaElemento['estado_revision'], observaciones: String(fd.get('obs') || '').trim() });
    toast(err ?? 'Ficha actualizada');
  } else {
    const tipo = ((ev as SubmitEvent).submitter as HTMLButtonElement | null)?.value ?? 'comentario';
    const txt = String(fd.get('txt') || '').trim(); if (!txt) return;
    const err = tipo === 'incidencia' ? await abrirIncidencia(elSel.id, txt) : await comentar(elSel.id, txt);
    toast(err ?? (tipo === 'incidencia' ? 'Incidencia abierta' : 'Comentario registrado'));
  }
  void pintarFicha(elSel);
}

/** migas de pan para la cabecera (app.ts) */
export function migas(): [string, string][] {
  const m: [string, string][] = [['Hoteles', '#mapa'], ['Bogotá', '#hoteles/bogota'], ['La Fontana', '#hoteles/la-fontana'], ['Torre Suites', '#fontana']];
  if (ruta.v === 'bim') m.push(['BIM', '#fontana/bim']);
  if (ruta.v === 'planta' || ruta.v === 'gemelo') m.push(['BIM', '#fontana/bim'], ['Piso 2', '#fontana/piso-2']);
  if (ruta.v === 'planta' && ruta.hab) m.push([`Habitación ${ruta.hab}`, `#fontana/piso-2/${ruta.hab}`]);
  if (ruta.v === 'gemelo') { m.push([`Habitación ${ruta.hab}`, `#fontana/piso-2/${ruta.hab}`], ['Gemelo digital', `#fontana/${ruta.hab}/gemelo`]); if (elSel) m.push([elSel.categoria, location.hash]); }
  return m;
}
export const rutaActual = () => ruta;
