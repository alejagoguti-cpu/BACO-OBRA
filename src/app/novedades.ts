/* Fuente ÚNICA de novedades (Supabase `novedades` + `novedad_historial`, adjuntos en Storage).
   La comparten: módulo Novedades (marcadores en planta), Resumen (indicadores y gráficas), Asistente, ficha de
   habitación, barra lateral y las páginas anteriores (vía store.ts). Se actualiza en tiempo real.
   Fechas: la marca original es created_at (UTC en la base); se presenta en America/Bogota. */
import { sb, perfil } from './auth';

export const TZ = 'America/Bogota';
export type TipoNov = 'nueva' | 'retraso' | 'imprevisto' | 'avance' | 'incidencia';
export type EstadoNov = 'pendiente' | 'en_proceso' | 'resuelta' | 'cerrada';
export type PrioNov = 'alta' | 'media' | 'baja';
export interface Adjunto { path: string; nombre: string; tipo: string }
export interface Nov {
  id: string; codigo: string; hotel: string; edificio: string; piso: string; habitacion: string | null; element_id: string | null;
  pos: [number, number, number] | null; titulo: string; descripcion: string; tipo: TipoNov; especialidad: string; prioridad: PrioNov;
  estado: EstadoNov; responsable: string | null; fecha_prevista: string | null; adjuntos: Adjunto[];
  created_by: string; created_at: string; updated_by: string | null; updated_at: string;
}
export interface Hist { id: number; novedad_id: string; user_id: string | null; tipo: 'creacion' | 'cambio' | 'comentario' | 'adjunto'; cambios: Record<string, [unknown, unknown]> | null; comentario: string | null; ts: string }

export const TIPO_TXT: Record<TipoNov, string> = { nueva: 'Nueva novedad', retraso: 'Retraso', imprevisto: 'Imprevisto', avance: 'Avance', incidencia: 'Incidencia' };
export const TIPO_COL: Record<TipoNov, string> = { nueva: '#2F7BEA', retraso: '#D98A1C', imprevisto: '#C3402F', avance: '#1E9A62', incidencia: '#8E44AD' };
export const ESTADO_TXT: Record<EstadoNov, string> = { pendiente: 'Pendiente', en_proceso: 'En proceso', resuelta: 'Resuelta', cerrada: 'Cerrada' };
export const PRIO_TXT: Record<PrioNov, string> = { alta: 'Alta', media: 'Media', baja: 'Baja' };
export const abierta = (n: Nov) => n.estado === 'pendiente' || n.estado === 'en_proceso';

let lista: Nov[] = [];
let cargada = false;
const nombres = new Map<string, string>();
const subs = new Set<(l: Nov[]) => void>();
let canal: ReturnType<NonNullable<typeof sb>['channel']> | null = null;

export const novedades = () => lista;
export const novedadesCargadas = () => cargada;
export const nombreDe = (uid: string | null) => (uid ? nombres.get(uid) ?? 'Usuario' : '—');
export function alCambiarNovedades(cb: (l: Nov[]) => void): () => void { subs.add(cb); if (cargada) cb(lista); return () => subs.delete(cb); }
const avisar = () => subs.forEach((cb) => cb(lista));

async function cargarNombres(ids: string[]): Promise<void> {
  const falta = [...new Set(ids.filter((x) => x && !nombres.has(x)))];
  if (!falta.length || !sb) return;
  const { data } = await sb.from('profiles').select('id, nombre').in('id', falta);
  (data ?? []).forEach((p: { id: string; nombre: string }) => nombres.set(p.id, p.nombre));
}

export async function iniciarNovedades(): Promise<void> {
  if (!sb || !perfil || canal) return;
  const { data, error } = await sb.from('novedades').select('*').order('created_at', { ascending: false });
  if (!error) lista = (data ?? []) as Nov[];
  await cargarNombres(lista.flatMap((n) => [n.created_by, n.updated_by ?? '']));
  cargada = true; avisar();
  canal = sb.channel('novedades-db')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'novedades' }, async (p) => {
      const n = p.new as Nov;
      if (p.eventType === 'INSERT') { if (!lista.some((x) => x.id === n.id)) lista = [n, ...lista]; }
      else if (p.eventType === 'UPDATE') lista = lista.map((x) => (x.id === n.id ? n : x));
      await cargarNombres([n.created_by, n.updated_by ?? '']);
      avisar();
    })
    .subscribe();
}
export async function detenerNovedades(): Promise<void> { if (canal && sb) await sb.removeChannel(canal); canal = null; lista = []; cargada = false; avisar(); }

export type NuevaNov = Pick<Nov, 'titulo' | 'descripcion' | 'tipo' | 'especialidad' | 'prioridad' | 'estado' | 'responsable' | 'fecha_prevista' | 'habitacion' | 'element_id' | 'pos'>;
export async function crearNovedad(d: NuevaNov, archivos: File[] = []): Promise<{ nov?: Nov; error?: string }> {
  if (!sb || !perfil) return { error: 'Inicia sesión para registrar novedades.' };
  const { data, error } = await sb.from('novedades').insert({ ...d, hotel: 'la-fontana', edificio: 'torre-suites', piso: 'PISO 2' }).select().single();
  if (error) return { error: error.message };
  let nov = data as Nov;
  if (archivos.length) { const r = await adjuntar(nov, archivos); if (r.nov) nov = r.nov; }
  if (!lista.some((x) => x.id === nov.id)) { lista = [nov, ...lista]; avisar(); }
  return { nov };
}
export async function actualizarNov(id: string, cambios: Partial<NuevaNov>): Promise<string | null> {
  if (!sb) return 'Sin sesión';
  const { data, error } = await sb.from('novedades').update(cambios).eq('id', id).select().single();
  if (error) return /row-level/i.test(error.message) ? 'Tu rol no permite editar esta novedad (solo quien la registró o gestión).' : error.message;
  lista = lista.map((x) => (x.id === id ? (data as Nov) : x)); avisar();
  return null;
}
export async function comentarNov(id: string, txt: string): Promise<string | null> {
  if (!sb || !perfil) return 'Sin sesión';
  const { error } = await sb.from('novedad_historial').insert({ novedad_id: id, user_id: perfil.id, tipo: 'comentario', comentario: txt });
  return error ? error.message : null;
}
export async function historial(id: string): Promise<Hist[]> {
  if (!sb) return [];
  const { data } = await sb.from('novedad_historial').select('*').eq('novedad_id', id).order('ts', { ascending: true });
  const h = (data ?? []) as Hist[];
  await cargarNombres(h.map((x) => x.user_id ?? ''));
  return h;
}
const limpio = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(-80);
export async function adjuntar(n: Nov, archivos: File[]): Promise<{ nov?: Nov; error?: string }> {
  if (!sb || !perfil) return { error: 'Sin sesión' };
  const nuevos: Adjunto[] = [];
  for (const f of archivos) {
    if (f.size > 10 * 1024 * 1024) return { error: `${f.name} supera 10 MB` };
    const path = `${n.id}/${Date.now()}-${limpio(f.name)}`;
    const { error } = await sb.storage.from('novedades').upload(path, f, { contentType: f.type || 'application/octet-stream' });
    if (error) return { error: error.message };
    nuevos.push({ path, nombre: f.name, tipo: f.type });
  }
  const { data, error } = await sb.from('novedades').update({ adjuntos: [...n.adjuntos, ...nuevos] }).eq('id', n.id).select().single();
  if (error) return { error: error.message };
  lista = lista.map((x) => (x.id === n.id ? (data as Nov) : x)); avisar();
  return { nov: data as Nov };
}
export async function urlAdjunto(a: Adjunto): Promise<string | null> {
  if (!sb) return null;
  const { data } = await sb.storage.from('novedades').createSignedUrl(a.path, 600);
  return data?.signedUrl ?? null;
}

/* ---------------- fechas en Bogotá ---------------- */
const fmtDia = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
/** 'YYYY-MM-DD' en America/Bogota */
export const diaBog = (iso: string | number | Date) => fmtDia.format(new Date(iso));
export const hoyBog = () => diaBog(Date.now());
export const fechaHoraBog = (iso: string) => new Date(iso).toLocaleString('es-CO', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).toUpperCase();
export const horaBog = (iso: string) => new Date(iso).toLocaleTimeString('es-CO', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
