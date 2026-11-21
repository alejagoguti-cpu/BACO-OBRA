/* Módulo NOVEDADES sobre la planta del piso 2 (dentro del área espacial del gemelo).
   Marcadores agrupados por cercanía en pantalla, filtros, panel de detalle (fotos, comentarios, responsables,
   historial), registro "+ Nueva novedad" eligiendo el punto en el modelo y línea de tiempo por día (Bogotá). */
import type { Stage } from './stage';
import { ESPECIALIDADES, CAT_TXT } from './config';
import { novedades, alCambiarNovedades, crearNovedad, actualizarNov, comentarNov, historial, adjuntar, urlAdjunto, nombreDe, abierta,
  TIPO_TXT, TIPO_COL, ESTADO_TXT, PRIO_TXT, fechaHoraBog, horaBog, diaBog, hoyBog, TZ, type Nov, type TipoNov, type EstadoNov, type PrioNov, type Hist } from '../app/novedades';
import { perfil, puedeEditar } from '../app/auth';
import { informarUbicacion } from '../app/presence';
import { esc, ic, toast } from '../app/ui';

type Periodo = 'todo' | 'dia' | 'semana' | 'mes';
export interface FiltroNov { tipos: Set<TipoNov>; estado: 'abiertas' | 'todas' | EstadoNov; esp: string; hab: string; resp: string; periodo: Periodo; fecha: string }
export const filtro: FiltroNov = { tipos: new Set(), estado: 'todas', esp: '', hab: '', resp: '', periodo: 'todo', fecha: hoyBog() };

let stage: Stage | null = null;
let ui: HTMLElement | null = null;
let pins: HTMLElement | null = null;
let activo = false;
let sel: string | null = null;
let creando: null | { paso: 'ubicar' | 'form'; pos: [number, number, number] | null; hab: string | null; cat: string | null } = null;
let raf = 0; let firma = '';
let quitarSub: (() => void) | null = null;
const navegar = (h: string) => { if (location.hash !== h) history.replaceState(null, '', h); dispatchEvent(new CustomEvent('twin:ruta')); };

/* ---------------- filtros ---------------- */
function enPeriodo(iso: string): boolean {
  if (filtro.periodo === 'todo') return true;
  const d = diaBog(iso);
  if (filtro.periodo === 'dia') return d === filtro.fecha;
  const f = new Date(filtro.fecha + 'T12:00:00-05:00');
  if (filtro.periodo === 'mes') return d.slice(0, 7) === filtro.fecha.slice(0, 7);
  const dow = (f.getUTCDay() + 6) % 7; const ini = new Date(f.getTime() - dow * 864e5); const fin = new Date(ini.getTime() + 6 * 864e5);
  return d >= diaBog(ini) && d <= diaBog(fin);
}
export function filtradas(): Nov[] {
  return novedades().filter((n) =>
    (!filtro.tipos.size || filtro.tipos.has(n.tipo)) &&
    (filtro.estado === 'todas' || (filtro.estado === 'abiertas' ? abierta(n) : n.estado === filtro.estado)) &&
    (!filtro.esp || n.especialidad === filtro.esp) &&
    (!filtro.hab || n.habitacion === filtro.hab) &&
    (!filtro.resp || (n.responsable ?? '') === filtro.resp) &&
    enPeriodo(n.created_at));
}

/* ---------------- ciclo de vida ---------------- */
export function activarNovedades(s: Stage, host: HTMLElement, sub: string[]): void {
  stage = s; ui = host;
  if (!activo) {
    activo = true;
    quitarSub = alCambiarNovedades(() => { if (activo) render(); });
    loop();
  }
  // subrutas: novedades/hab/216 · novedades/n/N-0001 · novedades/nueva/216
  if (sub[0] === 'hab' && sub[1]) filtro.hab = sub[1];
  if (sub[0] === 'n' && sub[1]) { const n = novedades().find((x) => x.codigo === sub[1]); if (n) void seleccionar(n.id); }
  if (sub[0] === 'nueva') { creando = { paso: 'ubicar', pos: null, hab: sub[1] ?? null, cat: null }; pedirPunto(); }
  informarUbicacion({ vista: 'Novedades · Piso 2', lugar: filtro.hab ? 'HAB-' + filtro.hab : '', elemento: '' });
  render();
}
export function desactivarNovedades(): void {
  activo = false; cancelAnimationFrame(raf); quitarSub?.(); quitarSub = null;
  stage?.elegirPunto(null); creando = null;
  pins?.remove(); pins = null;
}
export const novedadesActivo = () => activo;
/** clic en una habitación de la planta mientras el módulo está activo */
export function habitacionTocada(num: string | null): void {
  if (creando?.paso === 'ubicar') return;
  filtro.hab = num ?? ''; sel = null;
  navegar(num ? '#novedades/hab/' + num : '#novedades');
  informarUbicacion({ vista: 'Novedades · Piso 2', lugar: num ? 'HAB-' + num : '', elemento: '' });
  render();
}

/* ---------------- marcadores agrupados ---------------- */
function loop(): void {
  if (!activo) return;
  raf = requestAnimationFrame(loop);
  if (!stage || !ui) return;
  if (!pins || !pins.isConnected) { pins = document.createElement('div'); pins.className = 'nv-pins'; ui.parentElement?.insertBefore(pins, ui); pins.addEventListener('click', onPin); }
  const lista = filtradas().filter((n) => n.pos);
  const pts = lista.map((n) => ({ n, p: stage!.proyectar(n.pos!) })).filter((x) => x.p.visible);
  const R = 30; const grupos: { x: number; y: number; ns: Nov[] }[] = [];
  for (const { n, p } of pts) {
    const g = grupos.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < R);
    if (g) { g.ns.push(n); g.x = (g.x * (g.ns.length - 1) + p.x) / g.ns.length; g.y = (g.y * (g.ns.length - 1) + p.y) / g.ns.length; }
    else grupos.push({ x: p.x, y: p.y, ns: [n] });
  }
  const f = grupos.map((g) => g.ns.map((n) => n.id + n.estado + n.tipo).join(',')).join('|') + '#' + sel;
  if (f !== firma) {
    firma = f;
    pins.innerHTML = grupos.map((g) => {
      if (g.ns.length === 1) {
        const n = g.ns[0]; const res = !abierta(n);
        return `<button class="nv-pin ${res ? 'res' : ''} ${n.id === sel ? 'on' : ''}" data-id="${n.id}" style="--c:${TIPO_COL[n.tipo]}" title="${esc(n.codigo)} · ${esc(TIPO_TXT[n.tipo])} · ${esc(n.titulo)}"><i>${res ? ic('check', 3) : n.tipo === 'retraso' ? ic('clock', 2.4) : n.tipo === 'imprevisto' ? '!' : n.tipo === 'avance' ? ic('arrow', 2.4) : ''}</i></button>`;
      }
      const tipos = [...new Set(g.ns.map((n) => n.tipo))];
      return `<button class="nv-cluster" data-ids="${g.ns.map((n) => n.id).join(',')}" title="${g.ns.length} novedades"><b>${g.ns.length}</b><span>${tipos.map((t) => `<i style="background:${TIPO_COL[t]}"></i>`).join('')}</span></button>`;
    }).join('');
  }
  [...pins.children].forEach((el, i) => { const g = grupos[i]; if (g) (el as HTMLElement).style.transform = `translate(${g.x}px, ${g.y}px)`; });
}
function onPin(ev: Event): void {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('.nv-pin,.nv-cluster'); if (!b) return;
  if (b.dataset.id) { void seleccionar(b.dataset.id); return; }
  const ids = (b.dataset.ids ?? '').split(','); const ns = novedades().filter((n) => ids.includes(n.id) && n.pos);
  if (!ns.length || !stage) return;
  const c: [number, number, number] = [0, 1, 2].map((k) => ns.reduce((a, n) => a + n.pos![k], 0) / ns.length) as [number, number, number];
  void stage.enfocarPunto(c, 6);
}

async function seleccionar(id: string | null): Promise<void> {
  sel = id; creando = null; stage?.elegirPunto(null);
  const n = id ? novedades().find((x) => x.id === id) : null;
  navegar(n ? '#novedades/n/' + n.codigo : filtro.hab ? '#novedades/hab/' + filtro.hab : '#novedades');
  informarUbicacion({ vista: 'Novedades · Piso 2', lugar: n?.habitacion ? 'HAB-' + n.habitacion : '', elemento: n ? n.codigo : '' });
  render();
  if (n && stage) {
    if (n.habitacion) stage.resaltarHabitacion(n.habitacion);
    if (n.pos) await stage.enfocarPunto(n.pos, 4.5);
    void pintarDetalle(n);
  }
}

function pedirPunto(): void {
  stage?.elegirPunto((r) => {
    if (!creando) return;
    if (!r) { toast('No se encontró un punto del piso 2 ahí. Intenta de nuevo.'); pedirPunto(); return; }
    creando = { paso: 'form', pos: r.pos, hab: r.habitacion ?? creando.hab, cat: r.categoria };
    if (r.habitacion) stage?.resaltarHabitacion(r.habitacion);
    render();
  });
}

/* ---------------- interfaz ---------------- */
const ESPS = ESPECIALIDADES;
const espTxt = (id: string) => ESPS.find((e) => e.id === id)?.nombre ?? id;
const espCol = (id: string) => ESPS.find((e) => e.id === id)?.color ?? '#8f9daa';

export function render(): void {
  if (!ui || !activo) return;
  const todas = novedades(); const lista = filtradas();
  const habs = [...new Set(stage?.habitaciones.map((h) => h.numero) ?? [])];
  const resps = [...new Set(todas.map((n) => n.responsable).filter(Boolean))] as string[];
  const vista3d = stage?.vista3d ?? false;
  ui.innerHTML = `
  <aside class="tw-card nv-side">
    <div class="nv-head"><div><span class="tw-over">Novedades · Piso 2</span><h2>${lista.length} <small>de ${todas.length}</small></h2></div>
      <button class="tw-btn pri" data-nv="nueva" ${perfil ? '' : 'disabled'}>${ic('plus', 2)} Nueva novedad</button></div>
    <div class="nv-chips">${(Object.keys(TIPO_TXT) as TipoNov[]).map((t) => `<button data-nv="tipo" data-v="${t}" aria-pressed="${filtro.tipos.has(t)}" style="--c:${TIPO_COL[t]}"><i></i>${TIPO_TXT[t]}</button>`).join('')}</div>
    <div class="nv-filt">
      <select data-nvf="estado"><option value="todas">Todos los estados</option><option value="abiertas" ${filtro.estado === 'abiertas' ? 'selected' : ''}>Abiertas</option>${(Object.keys(ESTADO_TXT) as EstadoNov[]).map((e) => `<option value="${e}" ${filtro.estado === e ? 'selected' : ''}>${ESTADO_TXT[e]}</option>`).join('')}</select>
      <select data-nvf="esp"><option value="">Especialidad</option>${ESPS.map((e) => `<option value="${e.id}" ${filtro.esp === e.id ? 'selected' : ''}>${e.nombre}</option>`).join('')}</select>
      <select data-nvf="hab"><option value="">Habitación</option>${habs.map((h) => `<option value="${h}" ${filtro.hab === h ? 'selected' : ''}>${h}</option>`).join('')}</select>
      <select data-nvf="resp"><option value="">Responsable</option>${resps.map((r) => `<option ${filtro.resp === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select>
    </div>
    <div class="nv-list">${!lista.length ? `<p class="tw-muted nv-empty">${todas.length ? 'Ninguna novedad cumple los filtros.' : 'Aún no hay novedades registradas en el piso 2. Usa “Nueva novedad” y toca el punto en el modelo.'}</p>` :
      lista.map((n) => `<button class="nv-row ${n.id === sel ? 'on' : ''}" data-nv="sel" data-v="${n.id}">
        <i style="background:${TIPO_COL[n.tipo]}"></i>
        <span><b>${esc(n.titulo)}</b><small>${esc(n.codigo)} · ${n.habitacion ? 'Hab. ' + esc(n.habitacion) : 'Piso 2'} · ${esc(espTxt(n.especialidad))} · ${fechaHoraBog(n.created_at)}</small></span>
        <em class="nv-st st-${n.estado}">${ESTADO_TXT[n.estado]}</em></button>`).join('')}</div>
  </aside>
  <div class="nv-tools">
    <div class="tw-seg nv-vista"><button data-nv="vista" data-v="planta" aria-pressed="${!vista3d}">Planta</button><button data-nv="vista" data-v="3d" aria-pressed="${vista3d}">3D</button></div>
    <button class="tw-ico" data-nv="encuadrar" title="Encuadrar">${ic('area')}</button>
  </div>
  ${creando ? uiCrear() : `<aside class="tw-card tw-panel nv-det" id="nvDet" ${sel ? '' : 'hidden'}></aside>`}
  ${uiTimeline()}`;
  if (sel && !creando) { const n = novedades().find((x) => x.id === sel); if (n) void pintarDetalle(n); }
}

function uiTimeline(): string {
  // días visibles: según periodo/fecha; por defecto las últimas 2 semanas hasta hoy
  const base = new Date(filtro.fecha + 'T12:00:00-05:00').getTime();
  const n = filtro.periodo === 'mes' ? 31 : filtro.periodo === 'semana' ? 7 : 14;
  let ini = base - (n - 1) * 864e5;
  if (filtro.periodo === 'semana') { const dow = (new Date(base).getUTCDay() + 6) % 7; ini = base - dow * 864e5; }
  if (filtro.periodo === 'mes') { ini = new Date(filtro.fecha.slice(0, 7) + '-01T12:00:00-05:00').getTime(); }
  const dias: string[] = []; for (let t = ini, k = 0; k < n; t += 864e5, k++) { const d = diaBog(t); if (filtro.periodo === 'mes' && d.slice(0, 7) !== filtro.fecha.slice(0, 7)) break; dias.push(d); }
  const sinPeriodo = { ...filtro, periodo: 'todo' as Periodo };
  const lista = novedades().filter((x) => { const f = filtro; const keep = (!f.tipos.size || f.tipos.has(x.tipo)) && (f.estado === 'todas' || (f.estado === 'abiertas' ? abierta(x) : x.estado === f.estado)) && (!f.esp || x.especialidad === f.esp) && (!f.hab || x.habitacion === f.hab) && (!f.resp || (x.responsable ?? '') === f.resp); return keep; });
  void sinPeriodo;
  const por = new Map<string, Nov[]>(); lista.forEach((x) => { const d = diaBog(x.created_at); if (!por.has(d)) por.set(d, []); por.get(d)!.push(x); });
  const fmt = (d: string) => new Date(d + 'T12:00:00-05:00').toLocaleDateString('es-CO', { timeZone: TZ, day: '2-digit', month: 'short' }).toUpperCase();
  return `<section class="tw-card nv-tl" aria-label="Línea de tiempo">
    <div class="nv-tlhead"><span class="tw-over">Historial cronológico · America/Bogota</span>
      <div class="tw-seg">${(['dia', 'semana', 'mes', 'todo'] as Periodo[]).map((p) => `<button data-nv="periodo" data-v="${p}" aria-pressed="${filtro.periodo === p}">${{ dia: 'Día', semana: 'Semana', mes: 'Mes', todo: 'Todo' }[p]}</button>`).join('')}</div>
      <input type="date" data-nvf="fecha" value="${filtro.fecha}" max="${hoyBog()}"></div>
    <div class="nv-days">${dias.slice().reverse().map((d) => { const xs = por.get(d) ?? []; return `<button class="nv-day ${filtro.periodo === 'dia' && filtro.fecha === d ? 'on' : ''} ${d === hoyBog() ? 'hoy' : ''}" data-nv="dia" data-v="${d}">
      <b>${fmt(d)}</b>${xs.length ? xs.slice(0, 4).map((x) => `<span style="--c:${TIPO_COL[x.tipo]}" title="${esc(x.titulo)}">${horaBog(x.created_at)} · ${x.habitacion ? esc(x.habitacion) : 'P2'} · ${esc(TIPO_TXT[x.tipo])}</span>`).join('') + (xs.length > 4 ? `<em>+${xs.length - 4}</em>` : '') : '<small>—</small>'}</button>`; }).join('')}</div>
  </section>`;
}

function uiCrear(): string {
  const c = creando!;
  if (c.paso === 'ubicar') return `<div class="nv-pick">${ic('pin', 2)}<span><b>Toca el punto del piso 2 donde ocurre la novedad</b><small>Puedes rotar con “3D” o elegir solo la habitación.</small></span>
    <select data-nvf="habSolo"><option value="">Solo habitación…</option>${(stage?.habitaciones ?? []).map((h) => `<option value="${h.numero}" ${c.hab === h.numero ? 'selected' : ''}>${h.numero}</option>`).join('')}</select>
    <button class="tw-btn ghost" data-nv="cancelar">Cancelar</button></div>`;
  const ahora = new Date().toISOString();
  return `<aside class="tw-card tw-panel nv-form-p"><form class="tw-form nv-form" id="nvForm">
    <div class="tw-phead"><div><span class="tw-over">Nueva novedad · Piso 2</span><h3>${c.hab ? 'Habitación ' + esc(c.hab) : 'Piso 2'}</h3></div><button type="button" class="tw-ico sm" data-nv="cancelar" aria-label="Cancelar">${ic('x')}</button></div>
    <dl class="tw-dl">
      <div><dt>Ubicación BIM</dt><dd>La Fontana · Torre Suites · Piso 2${c.hab ? ' · Hab. ' + esc(c.hab) : ''}${c.cat ? `<br><small class="tw-muted">Categoría Revit tocada: ${esc(CAT_TXT[c.cat] ?? c.cat)} (sin ID de elemento)</small>` : ''}${c.pos ? `<br><small class="tw-muted">Punto x ${c.pos[0].toFixed(2)} · z ${c.pos[2].toFixed(2)} m</small>` : ''}</dd></div>
      <div><dt>Fecha y hora</dt><dd>${fechaHoraBog(ahora)} <small class="tw-muted">(se fija al guardar, America/Bogota)</small></dd></div>
      <div><dt>Registra</dt><dd>${esc(perfil?.nombre ?? '')}</dd></div>
    </dl>
    <button type="button" class="tw-btn ghost" data-nv="reubicar">${ic('pin', 1.8)} Cambiar ubicación</button>
    <label>Título<input name="titulo" required minlength="3" maxlength="160" placeholder="Ej.: Interferencia del desagüe con la viga"></label>
    <label>Descripción<textarea name="descripcion" placeholder="Qué pasa, dónde y qué se necesita"></textarea></label>
    <div class="nv-2"><label>Tipo<select name="tipo">${(Object.keys(TIPO_TXT) as TipoNov[]).map((t) => `<option value="${t}">${TIPO_TXT[t]}</option>`).join('')}</select></label>
      <label>Especialidad<select name="especialidad">${ESPS.map((e) => `<option value="${e.id}">${e.nombre}</option>`).join('')}</select></label></div>
    <div class="nv-2"><label>Prioridad<select name="prioridad">${(Object.keys(PRIO_TXT) as PrioNov[]).map((p) => `<option value="${p}" ${p === 'media' ? 'selected' : ''}>${PRIO_TXT[p]}</option>`).join('')}</select></label>
      <label>Estado<select name="estado">${(Object.keys(ESTADO_TXT) as EstadoNov[]).map((e) => `<option value="${e}">${ESTADO_TXT[e]}</option>`).join('')}</select></label></div>
    <div class="nv-2"><label>Responsable<input name="responsable" placeholder="Pendiente de asignación"></label>
      <label>Fecha prevista de solución<input type="date" name="fecha_prevista" min="${hoyBog()}"></label></div>
    <label>Fotografías y documentos<input type="file" name="adjuntos" multiple accept="image/*,application/pdf,.doc,.docx,.xlsx,.dwg"></label>
    <label>Comentario inicial<textarea name="comentario" placeholder="Opcional"></textarea></label>
    <button class="tw-btn pri lg">Registrar novedad</button>
  </form></aside>`;
}

async function pintarDetalle(n: Nov): Promise<void> {
  const box = ui?.querySelector<HTMLElement>('#nvDet'); if (!box) return;
  box.hidden = false;
  const ed = puedeEditar(perfil) || n.created_by === perfil?.id;
  const cuerpo = (h: Hist[] | null, urls: (string | null)[]) => `
    <div class="tw-phead"><div><span class="tw-over" style="color:${TIPO_COL[n.tipo]}">${esc(TIPO_TXT[n.tipo])} · ${esc(n.codigo)}</span><h3>${esc(n.titulo)}</h3></div><button class="tw-ico sm" data-nv="cerrarDet" aria-label="Cerrar">${ic('x')}</button></div>
    ${n.descripcion ? `<p>${esc(n.descripcion)}</p>` : ''}
    <div class="tw-chips"><span class="nv-st st-${n.estado}">${ESTADO_TXT[n.estado]}</span><span class="tw-chip"><i style="background:${espCol(n.especialidad)}"></i>${esc(espTxt(n.especialidad))}</span><span class="tw-chip">Prioridad ${PRIO_TXT[n.prioridad]}</span></div>
    <dl class="tw-dl">
      <div><dt>Ubicación</dt><dd>Hotel Estelar La Fontana · Torre Suites · ${esc(n.piso)}${n.habitacion ? ` · <a href="#fontana/piso-2/${esc(n.habitacion)}">Hab. ${esc(n.habitacion)}</a>` : ''}</dd></div>
      <div><dt>Elemento BIM</dt><dd>${n.element_id ? esc(n.element_id.startsWith('cat:') ? 'Categoría ' + (CAT_TXT[n.element_id.slice(4)] ?? n.element_id.slice(4)) + ' (sin ID)' : n.element_id) : '—'}</dd></div>
      <div><dt>Registrada</dt><dd>${fechaHoraBog(n.created_at)} · ${esc(nombreDe(n.created_by))}</dd></div>
      <div><dt>Responsable</dt><dd>${n.responsable ? esc(n.responsable) : '<span class="tw-muted">Pendiente de asignación</span>'}</dd></div>
      <div><dt>Solución prevista</dt><dd>${n.fecha_prevista ? esc(n.fecha_prevista) : '—'}</dd></div>
      <div><dt>Última modificación</dt><dd>${fechaHoraBog(n.updated_at)}${n.updated_by ? ' · ' + esc(nombreDe(n.updated_by)) : ''}</dd></div>
    </dl>
    <div class="tw-sec"><span class="tw-lbl">Fotografías y documentos (${n.adjuntos.length})</span>
      ${n.adjuntos.length ? `<div class="nv-adj">${n.adjuntos.map((a, i) => urls[i] ? (a.tipo.startsWith('image/') ? `<a href="${urls[i]}" target="_blank" rel="noopener"><img src="${urls[i]}" alt="${esc(a.nombre)}"></a>` : `<a class="tw-chip" href="${urls[i]}" target="_blank" rel="noopener">${ic('doc', 1.6)} ${esc(a.nombre)}</a>`) : `<span class="tw-chip">${esc(a.nombre)}</span>`).join('')}</div>` : '<p class="tw-muted">Sin adjuntos</p>'}
      ${perfil ? `<label class="tw-btn ghost nv-up">${ic('camera', 1.8)} Agregar fotos o documentos<input type="file" multiple hidden data-nvf="adjuntar" accept="image/*,application/pdf,.doc,.docx,.xlsx,.dwg"></label>` : ''}</div>
    ${ed ? `<form class="tw-form" id="nvEdit"><span class="tw-lbl">Actualizar (queda en el historial)</span>
      <div class="nv-2"><label>Estado<select name="estado">${(Object.keys(ESTADO_TXT) as EstadoNov[]).map((e) => `<option value="${e}" ${n.estado === e ? 'selected' : ''}>${ESTADO_TXT[e]}</option>`).join('')}</select></label>
      <label>Prioridad<select name="prioridad">${(Object.keys(PRIO_TXT) as PrioNov[]).map((p) => `<option value="${p}" ${n.prioridad === p ? 'selected' : ''}>${PRIO_TXT[p]}</option>`).join('')}</select></label></div>
      <div class="nv-2"><label>Responsable<input name="responsable" value="${esc(n.responsable ?? '')}" placeholder="Pendiente de asignación"></label>
      <label>Solución prevista<input type="date" name="fecha_prevista" value="${n.fecha_prevista ?? ''}"></label></div>
      <label>Tipo<select name="tipo">${(Object.keys(TIPO_TXT) as TipoNov[]).map((t) => `<option value="${t}" ${n.tipo === t ? 'selected' : ''}>${TIPO_TXT[t]}</option>`).join('')}</select></label>
      <button class="tw-btn pri">Guardar cambios</button></form>` : `<p class="tw-note">${ic('key', 1.6)} Solo quien la registró o los roles de gestión pueden cambiarla. Puedes comentar.</p>`}
    <form class="tw-form" id="nvCom"><span class="tw-lbl">Comentario</span><textarea name="txt" required placeholder="Escribe un comentario…"></textarea><button class="tw-btn">Comentar</button></form>
    <div class="tw-sec"><span class="tw-lbl">Historial</span>${h === null ? '<p class="tw-muted">Cargando…</p>' : `<ul class="tw-hist">${h.map(lineaHist).join('')}</ul>`}</div>`;
  box.innerHTML = cuerpo(null, []);
  const [h, urls] = await Promise.all([historial(n.id), Promise.all(n.adjuntos.map(urlAdjunto))]);
  if (sel !== n.id) return;
  box.innerHTML = cuerpo(h, urls);
}
const CAMPO: Record<string, string> = { titulo: 'Título', descripcion: 'Descripción', tipo: 'Tipo', especialidad: 'Especialidad', prioridad: 'Prioridad', estado: 'Estado', responsable: 'Responsable', fecha_prevista: 'Solución prevista', habitacion: 'Habitación', element_id: 'Elemento', pos: 'Ubicación' };
const valTxt = (k: string, v: unknown) => v == null || v === '' ? '—' : k === 'estado' ? ESTADO_TXT[v as EstadoNov] ?? String(v) : k === 'tipo' ? TIPO_TXT[v as TipoNov] ?? String(v) : k === 'prioridad' ? PRIO_TXT[v as PrioNov] ?? String(v) : k === 'especialidad' ? espTxt(String(v)) : k === 'pos' ? 'punto' : String(v);
function lineaHist(x: Hist): string {
  const quien = esc(nombreDe(x.user_id)); const t = fechaHoraBog(x.ts);
  if (x.tipo === 'creacion') return `<li class="t-estado"><b>${quien}</b> <span>registró la novedad</span><small>${t}</small></li>`;
  if (x.tipo === 'comentario') return `<li><b>${quien}</b> <span>${esc(x.comentario)}</span><small>${t} · comentario</small></li>`;
  if (x.tipo === 'adjunto') return `<li><b>${quien}</b> <span>agregó adjuntos</span><small>${t}</small></li>`;
  return `<li class="t-responsable"><b>${quien}</b> <span>${Object.entries(x.cambios ?? {}).map(([k, [a, b]]) => `${CAMPO[k] ?? k}: ${esc(valTxt(k, a))} → ${esc(valTxt(k, b))}`).join(' · ')}</span><small>${t} · cambio</small></li>`;
}

/* ---------------- eventos (los registra workspace sobre su contenedor) ---------------- */
export async function onClickNov(ev: Event): Promise<boolean> {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-nv]'); if (!b || !activo) return false;
  const v = b.dataset.v ?? '';
  switch (b.dataset.nv) {
    case 'nueva': sel = null; creando = { paso: 'ubicar', pos: null, hab: filtro.hab || null, cat: null }; pedirPunto(); render(); break;
    case 'cancelar': creando = null; stage?.elegirPunto(null); render(); break;
    case 'reubicar': if (creando) { creando.paso = 'ubicar'; pedirPunto(); render(); } break;
    case 'tipo': filtro.tipos.has(v as TipoNov) ? filtro.tipos.delete(v as TipoNov) : filtro.tipos.add(v as TipoNov); render(); break;
    case 'sel': void seleccionar(v === sel ? null : v); break;
    case 'cerrarDet': void seleccionar(null); break;
    case 'vista': await stage?.setVista3D(v === '3d'); render(); break;
    case 'encuadrar': stage?.encuadrar(); break;
    case 'periodo': filtro.periodo = v as Periodo; render(); break;
    case 'dia': filtro.periodo = 'dia'; filtro.fecha = v; render(); break;
    default: return false;
  }
  return true;
}
export async function onChangeNov(ev: Event): Promise<boolean> {
  const t = ev.target as HTMLInputElement; const k = t.dataset.nvf; if (!k || !activo) return false;
  if (k === 'estado') filtro.estado = t.value as FiltroNov['estado'];
  else if (k === 'esp') filtro.esp = t.value;
  else if (k === 'hab') { filtro.hab = t.value; if (t.value) stage?.resaltarHabitacion(t.value); }
  else if (k === 'resp') filtro.resp = t.value;
  else if (k === 'fecha') { if (!t.value) return true; filtro.fecha = t.value; if (filtro.periodo === 'todo') filtro.periodo = 'dia'; }
  else if (k === 'habSolo' && creando && t.value) { creando = { paso: 'form', pos: null, hab: t.value, cat: null }; stage?.elegirPunto(null); stage?.resaltarHabitacion(t.value); const c = stage?.centroHabitacion(t.value); if (c) creando.pos = [+c.x.toFixed(3), +(c.y).toFixed(3), +c.z.toFixed(3)]; }
  else if (k === 'adjuntar') {
    const n = novedades().find((x) => x.id === sel); if (!n || !t.files?.length) return true;
    toast('Subiendo adjuntos…'); const r = await adjuntar(n, [...t.files]); toast(r.error ?? 'Adjuntos agregados');
    const nn = novedades().find((x) => x.id === sel); if (nn) void pintarDetalle(nn); return true;
  } else return false;
  render(); return true;
}
export async function onSubmitNov(ev: Event): Promise<boolean> {
  const f = ev.target as HTMLFormElement; if (!activo || !['nvForm', 'nvEdit', 'nvCom'].includes(f.id)) return false;
  ev.preventDefault();
  const d = new FormData(f); const s = (k: string) => String(d.get(k) ?? '').trim();
  const btn = f.querySelector<HTMLButtonElement>('button:not([type=button])'); if (btn) btn.disabled = true;
  if (f.id === 'nvForm' && creando) {
    const archivos = (d.getAll('adjuntos') as File[]).filter((x) => x && x.size);
    const r = await crearNovedad({ titulo: s('titulo'), descripcion: s('descripcion'), tipo: s('tipo') as TipoNov, especialidad: s('especialidad'), prioridad: s('prioridad') as PrioNov,
      estado: s('estado') as EstadoNov, responsable: s('responsable') || null, fecha_prevista: s('fecha_prevista') || null, habitacion: creando.hab, element_id: creando.cat ? 'cat:' + creando.cat : null, pos: creando.pos }, archivos);
    if (r.error || !r.nov) { toast(r.error ?? 'No se pudo registrar'); if (btn) btn.disabled = false; return true; }
    if (s('comentario')) await comentarNov(r.nov.id, s('comentario'));
    toast(`Novedad ${r.nov.codigo} registrada · ${fechaHoraBog(r.nov.created_at)}`);
    creando = null; await seleccionar(r.nov.id);
  } else if (f.id === 'nvEdit' && sel) {
    const err = await actualizarNov(sel, { estado: s('estado') as EstadoNov, prioridad: s('prioridad') as PrioNov, responsable: s('responsable') || null, fecha_prevista: s('fecha_prevista') || null, tipo: s('tipo') as TipoNov });
    toast(err ?? 'Novedad actualizada · cambio registrado en el historial');
    const n = novedades().find((x) => x.id === sel); if (n) void pintarDetalle(n);
  } else if (f.id === 'nvCom' && sel) {
    const err = await comentarNov(sel, s('txt')); toast(err ?? 'Comentario agregado');
    const n = novedades().find((x) => x.id === sel); if (n) void pintarDetalle(n);
  }
  if (btn) btn.disabled = false;
  return true;
}
