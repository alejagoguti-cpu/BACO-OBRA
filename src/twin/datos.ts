/* Datos colaborativos por elemento BIM (Supabase: elementos + elemento_eventos).
   Nada se inventa: si no hay fila, el elemento queda "Sin responsable asignado" / "Sin revisar". */
import { sb, perfil } from '../app/auth';

export const ESTADOS = ['Sin revisar', 'En revisión', 'Aprobado', 'Con observaciones'] as const;
export type EstadoRev = typeof ESTADOS[number];
export interface FilaElemento { element_id: string; nombre: string; especialidad: string; responsable: string | null; empresa: string | null; estado_revision: EstadoRev; observaciones: string; updated_at: string | null; updated_by: string | null }
export interface Evento { id: number; element_id: string; user_id: string; tipo: 'comentario' | 'estado' | 'responsable' | 'incidencia'; detalle: string; abierta: boolean; ts: string; autor?: string }

export async function leerElemento(id: string, base: { nombre: string; especialidad: string }): Promise<{ fila: FilaElemento; eventos: Evento[] }> {
  const vacia: FilaElemento = { element_id: id, nombre: base.nombre, especialidad: base.especialidad, responsable: null, empresa: null, estado_revision: 'Sin revisar', observaciones: '', updated_at: null, updated_by: null };
  if (!sb) return { fila: vacia, eventos: [] };
  const [{ data: f }, { data: ev }] = await Promise.all([
    sb.from('elementos').select('*').eq('element_id', id).maybeSingle(),
    sb.from('elemento_eventos').select('*').eq('element_id', id).order('ts', { ascending: false }).limit(50),
  ]);
  const eventos = (ev ?? []) as Evento[];
  const uids = [...new Set(eventos.map((e) => e.user_id))];
  if (uids.length) {
    const { data: ps } = await sb.from('profiles').select('id, nombre').in('id', uids);
    const nom = new Map((ps ?? []).map((p: { id: string; nombre: string }) => [p.id, p.nombre]));
    eventos.forEach((e) => { e.autor = nom.get(e.user_id) ?? 'Usuario'; });
  }
  return { fila: (f as FilaElemento) ?? vacia, eventos };
}

async function evento(id: string, tipo: Evento['tipo'], detalle: string, abierta = false): Promise<string | null> {
  if (!sb || !perfil) return 'Sin sesión';
  const { error } = await sb.from('elemento_eventos').insert({ element_id: id, user_id: perfil.id, tipo, detalle, abierta });
  return error ? error.message : null;
}

export async function guardarElemento(fila: FilaElemento, cambios: Partial<Pick<FilaElemento, 'responsable' | 'empresa' | 'estado_revision' | 'observaciones'>>): Promise<string | null> {
  if (!sb || !perfil) return 'Sin sesión';
  const nueva = { ...fila, ...cambios, updated_by: perfil.id, updated_at: new Date().toISOString() };
  const { error } = await sb.from('elementos').upsert({
    element_id: nueva.element_id, nombre: nueva.nombre, especialidad: nueva.especialidad, responsable: nueva.responsable || null,
    empresa: nueva.empresa || null, estado_revision: nueva.estado_revision, observaciones: nueva.observaciones, updated_by: perfil.id, updated_at: nueva.updated_at,
  });
  if (error) return /row-level security/i.test(error.message) ? 'Tu rol no permite editar este elemento.' : error.message;
  if (cambios.estado_revision && cambios.estado_revision !== fila.estado_revision) await evento(fila.element_id, 'estado', `${fila.estado_revision} → ${cambios.estado_revision}`);
  if (cambios.responsable !== undefined && (cambios.responsable || null) !== fila.responsable) await evento(fila.element_id, 'responsable', cambios.responsable ? `Asignado a ${cambios.responsable}${cambios.empresa ? ' · ' + cambios.empresa : ''}` : 'Responsable retirado');
  return null;
}
export const comentar = (id: string, txt: string) => evento(id, 'comentario', txt);
export const abrirIncidencia = (id: string, txt: string) => evento(id, 'incidencia', txt, true);
export async function cerrarIncidencia(evId: number): Promise<string | null> {
  if (!sb) return 'Sin sesión';
  const { error } = await sb.from('elemento_eventos').update({ abierta: false }).eq('id', evId);
  return error ? (/row-level/i.test(error.message) ? 'Tu rol no permite cerrar incidencias.' : error.message) : null;
}
/** responsables de todos los elementos de un prefijo (p. ej. "HAB-216" o "SKP216:") */
export async function responsablesDe(prefijo: string): Promise<FilaElemento[]> {
  if (!sb) return [];
  const { data } = await sb.from('elementos').select('*').like('element_id', prefijo + '%').not('responsable', 'is', null);
  return (data ?? []) as FilaElemento[];
}
export async function incidenciasAbiertas(prefijo: string): Promise<Evento[]> {
  if (!sb) return [];
  const { data } = await sb.from('elemento_eventos').select('*').like('element_id', prefijo + '%').eq('tipo', 'incidencia').eq('abierta', true).order('ts', { ascending: false });
  return (data ?? []) as Evento[];
}
