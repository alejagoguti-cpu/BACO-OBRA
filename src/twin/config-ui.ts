/* Interfaz del configurador de habitación (estilo catálogo + visor + materiales) y persistencia compartida
   de los cambios de material en Supabase (config_habitacion, en tiempo real). */
import { crearConfigurador, CATEGORIAS, GRUPOS_MAT, type Configurador, type CategoriaPieza, type Pieza } from './configurador';
import { sb, perfil, puedeEditar } from '../app/auth';
import { esc, ic, toast } from '../app/ui';

let cfg: Configurador | null = null; let hab = ''; let ui: HTMLElement | null = null;
let cat: CategoriaPieza = 'Muebles'; let buscar = ''; let ranura = ''; let grupoMat = '';
let canal: ReturnType<NonNullable<typeof sb>['channel']> | null = null;
const ICON: Record<CategoriaPieza, string> = { 'Muebles': 'build', 'Baño': 'drop', 'Iluminación': 'bolt', 'Textiles': 'layers', 'Pisos': 'area', 'Muros': 'plan', 'Puertas y ventanas': 'eye', 'Otros': 'filter' };
const key = (clave: string, original: string) => clave + '::' + original;

export const configuradorActivo = () => !!cfg;
export async function abrirConfigurador(host: HTMLElement, uiHost: HTMLElement, h: string, url: string): Promise<void> {
  cerrarConfigurador();
  hab = h; ui = uiHost; cfg = crearConfigurador(host, url, h);
  cfg.onSeleccion = (c) => { ranura = c ? (cfg!.piezas().find((p) => p.clave === c)?.ranuras[0] ?? '') : ''; if (c) { const p = cfg!.piezas().find((x) => x.clave === c); if (p) cat = p.categoria; } renderConfig(); };
  renderConfig();
  await cfg.listo;
  const cats = new Set(cfg.piezas().map((p) => p.categoria)); if (!cats.has(cat)) cat = CATEGORIAS.find((c) => cats.has(c)) ?? 'Otros';
  await cargarCambios();
  renderConfig();
}
export function cerrarConfigurador(): void { cfg?.dispose(); cfg = null; if (canal && sb) void sb.removeChannel(canal); canal = null; }

async function cargarCambios(): Promise<void> {
  if (!sb || !perfil || !cfg) return;
  const { data } = await sb.from('config_habitacion').select('element_id, material').eq('habitacion', hab);
  for (const r of (data ?? []) as { element_id: string; material: string }[]) { const [c, o] = r.element_id.split('::'); cfg.aplicar(c, o, r.material); }
  canal = sb.channel('config-' + hab).on('postgres_changes', { event: '*', schema: 'public', table: 'config_habitacion', filter: `habitacion=eq.${hab}` }, (p) => {
    if (!cfg) return;
    const r = (p.eventType === 'DELETE' ? p.old : p.new) as { element_id?: string; material?: string };
    if (!r.element_id) return; const [c, o] = r.element_id.split('::');
    cfg.aplicar(c, o, p.eventType === 'DELETE' ? null : r.material ?? null); renderConfig();
  }).subscribe();
}
async function guardar(clave: string, original: string, nuevo: string | null): Promise<void> {
  if (!sb || !perfil || perfil.id === 'dev') return;
  const element_id = key(clave, original);
  const { error } = nuevo && nuevo !== original
    ? await sb.from('config_habitacion').upsert({ habitacion: hab, element_id, material: nuevo, updated_by: perfil.id, updated_at: new Date().toISOString() })
    : await sb.from('config_habitacion').delete().eq('habitacion', hab).eq('element_id', element_id);
  if (error) toast(/row-level/i.test(error.message) ? 'Tu rol puede probar materiales, pero no guardarlos (gestión los guarda).' : error.message);
}

/* ---------------- interfaz ---------------- */
export function renderConfig(): void {
  if (!ui || !cfg) return;
  const piezas = cfg.piezas(); const cats = CATEGORIAS.filter((c) => piezas.some((p) => p.categoria === c));
  const lista = piezas.filter((p) => p.categoria === cat && (!buscar || (p.nombre + ' ' + p.codigo).toLowerCase().includes(buscar.toLowerCase())));
  const sel = piezas.find((p) => p.clave === cfg!.seleccion) ?? null;
  ui.innerHTML = `
  <aside class="cf-cat">
    <nav class="cf-rail">${(cats.length ? cats : CATEGORIAS.slice(0, 1)).map((c) => `<button data-cf="cat" data-v="${c}" aria-pressed="${c === cat}" title="${c}">${ic(ICON[c], 1.8)}<span>${c}</span></button>`).join('')}</nav>
    <div class="cf-lista">
      <label class="cf-buscar">${ic('search', 1.8)}<input data-cf="buscar" value="${esc(buscar)}" placeholder="Buscar pieza…"></label>
      ${piezas.length ? '' : '<p class="tw-muted" style="padding:12px">Cargando las piezas del modelo de 3ds Max…</p>'}
      ${lista.map((p) => tarjeta(p, p.clave === sel?.clave)).join('')}
    </div>
  </aside>
  <div class="cf-tools">
    <div class="cf-seg"><button data-cf="vista" data-v="2d" aria-pressed="${cfg.vista === '2d'}">2D</button><button data-cf="vista" data-v="3d" aria-pressed="${cfg.vista === '3d'}">3D</button></div>
    <div class="cf-iconos"><button class="tw-ico sm" data-cf="centrar" title="Centrar">${ic('focus', 1.8)}</button></div>
    <input type="range" min="60" max="250" value="100" data-cf="zoom" aria-label="Zoom">
  </div>
  <div class="cf-fuente">Habitación ${esc(hab)} · escena renderizada de 3ds Max · ${piezas.length} piezas</div>
  ${sel ? panelMateriales(sel) : `<div class="cf-ayuda">${ic('tap', 1.8)} Toca una pieza en el modelo o en el catálogo para ver y cambiar sus materiales</div>`}`;
  void pintarMiniaturas();
}
function tarjeta(p: Pieza, on: boolean): string {
  const mats = p.ranuras.slice(0, 5);
  return `<button class="cf-card ${on ? 'on' : ''}" data-cf="pieza" data-v="${esc(p.clave)}">
    <span class="cf-img"><img data-mini="${esc(p.clave)}" alt=""></span>
    ${p.cantidad > 1 ? `<span class="cf-cant">×${p.cantidad}</span>` : ''}
    <span class="cf-sw">${mats.map((m) => `<i data-mmini="${esc(cfg!.materialActual(p.clave, m))}" title="${esc(cfg!.materialActual(p.clave, m))}"></i>`).join('')}</span>
    <span class="cf-meta"><small>${esc(p.codigo || p.categoria)}</small><small>${esc(p.medidas)}</small></span>
    <b>${esc(p.nombre)}</b></button>`;
}
function panelMateriales(p: Pieza): string {
  const mats = cfg!.materiales(); const r = ranura || p.ranuras[0] || '';
  const actual = r ? cfg!.materialActual(p.clave, r) : '';
  const grupos = GRUPOS_MAT.filter((g) => mats.some((m) => m.grupo === g));
  const g = grupoMat || mats.find((m) => m.nombre === actual)?.grupo || grupos[0];
  return `<aside class="cf-mat">
    <div class="tw-phead"><div><span class="tw-over">${esc(p.categoria)}${p.codigo ? ' · ' + esc(p.codigo) : ''}${p.cantidad > 1 ? ` · ${p.cantidad} unidades` : ''}</span><h3>${esc(p.nombre)}</h3>${p.medidas ? `<small class="tw-muted">${esc(p.medidas)}</small>` : ''}</div><button class="tw-ico sm" data-cf="cerrar" aria-label="Cerrar">${ic('x')}</button></div>
    ${p.matriz ? fichaMatriz(p) : ''}
    ${p.ranuras.length > 1 ? `<span class="tw-lbl">Parte de la pieza</span><div class="cf-ranuras">${p.ranuras.map((x) => `<button data-cf="ranura" data-v="${esc(x)}" aria-pressed="${x === r}"><i data-mmini="${esc(cfg!.materialActual(p.clave, x))}"></i>${esc(etq(cfg!.materialActual(p.clave, x)))}</button>`).join('')}</div>` : ''}
    <span class="tw-lbl">Material actual</span>
    <div class="cf-actual"><i data-mmini="${esc(actual)}"></i><span><b>${esc(etq(actual))}</b>${actual !== r ? `<small>original: ${esc(etq(r))}</small>` : '<small>material del proyecto</small>'}</span>${actual !== r ? `<button class="tw-btn ghost" data-cf="restaurar">${ic('reset', 1.6)} Original</button>` : ''}</div>
    <div class="cf-grupos">${grupos.map((x) => `<button data-cf="grupo" data-v="${x}" aria-pressed="${x === g}">${x}</button>`).join('')}</div>
    <div class="cf-mats">${mats.filter((m) => m.grupo === g).map((m) => `<button class="${m.nombre === actual ? 'on' : ''}" data-cf="material" data-v="${esc(m.nombre)}" title="${esc(m.etiqueta)}"><i data-mmini="${esc(m.nombre)}"></i><span>${esc(m.etiqueta)}</span></button>`).join('')}</div>
    <p class="tw-note">${puedeEditar(perfil) ? 'El cambio se guarda para todo el equipo y se aplica a todas las unidades de esta pieza.' : 'Puedes probar materiales; guardarlos es de gestión (admin, Estelar o BIM).'}</p>
  </aside>`;
}
function fichaMatriz(p: Pieza): string {
  const m = p.matriz!; const fila = (k: string, v: string) => v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : '';
  return `<dl class="cf-ficha"><span class="cf-tag">${esc(m.codigo)}</span><small>Matriz de amoblamiento · Habitación Twin V2</small>${fila('Referencia', m.referencia)}${fila('Proveedor', m.proveedor)}${fila('Medidas', m.medidas)}${fila('Acabado', m.material)}${fila('Cantidad', m.cantidad)}</dl>`;
}
const etq = (n: string) => cfg?.materiales().find((m) => m.nombre === n)?.etiqueta ?? n;
async function pintarMiniaturas(): Promise<void> {
  if (!ui || !cfg) return;
  const obs = new IntersectionObserver((es) => es.forEach(async (e) => {
    if (!e.isIntersecting) return; obs.unobserve(e.target);
    const el = e.target as HTMLElement;
    if (el.dataset.mini) (el as HTMLImageElement).src = await cfg!.miniaturaPieza(el.dataset.mini);
    else if (el.dataset.mmini) { const u = await cfg!.miniaturaMaterial(el.dataset.mmini); if (u) el.style.backgroundImage = `url(${u})`; }
  }), { root: null, rootMargin: '120px' });
  ui.querySelectorAll('[data-mini],[data-mmini]').forEach((el) => obs.observe(el));
}

export async function onConfig(ev: Event): Promise<boolean> {
  const t = ev.target as HTMLElement; const b = t.closest<HTMLElement>('[data-cf]'); if (!b || !cfg) return false;
  const a = b.dataset.cf!, v = b.dataset.v ?? '';
  if (ev.type === 'input') {
    if (a === 'buscar') { buscar = (t as HTMLInputElement).value; const pos = (t as HTMLInputElement).selectionStart; renderConfig(); const i = ui?.querySelector<HTMLInputElement>('[data-cf="buscar"]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } return true; }
    if (a === 'zoom') { cfg.setZoom(+(t as HTMLInputElement).value / 100); return true; }
    return false;
  }
  switch (a) {
    case 'cat': cat = v as CategoriaPieza; renderConfig(); return true;
    case 'pieza': cfg.seleccionar(v === cfg.seleccion ? null : v, true); return true;
    case 'cerrar': cfg.seleccionar(null); return true;
    case 'ranura': ranura = v; grupoMat = ''; renderConfig(); return true;
    case 'grupo': grupoMat = v; renderConfig(); return true;
    case 'material': { const p = cfg.piezas().find((x) => x.clave === cfg!.seleccion); const r = ranura || p?.ranuras[0]; if (!p || !r) return true; cfg.aplicar(p.clave, r, v); renderConfig(); await guardar(p.clave, r, v); return true; }
    case 'restaurar': { const p = cfg.piezas().find((x) => x.clave === cfg!.seleccion); const r = ranura || p?.ranuras[0]; if (!p || !r) return true; cfg.aplicar(p.clave, r, null); renderConfig(); await guardar(p.clave, r, null); return true; }
    case 'vista': cfg.setVista(v as '2d' | '3d'); renderConfig(); return true;
    case 'centrar': cfg.centrar(); return true;
  }
  return false;
}
