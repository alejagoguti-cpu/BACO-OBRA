/* Avance de obra: programado vs. real, por día (America/Bogota).
   - Programado: cronograma (public/data/obra.json), ponderado por días programados de cada actividad.
   - Real: estado de la matriz (actividades "Completado" se toman como 100 % en su fecha de fin) + avances
     registrados y VALIDADOS en Supabase (avance_registros). Las novedades NUNCA suman avance.
   Nada se interpola ni se estima: un día sin registros conserva el último valor conocido. */
import { sb, perfil } from './auth';
import { OBRA, type Act } from './obra';
import { diaBog } from './novedades';

export interface RegAvance { id: number; actividad_id: string; habitacion: string | null; especialidad: string | null; fecha: string; pct_acumulado: number; nota: string; registrado_por: string; validado_por: string | null; validado_at: string | null; created_at: string }
let registros: RegAvance[] = [];
let canal: ReturnType<NonNullable<typeof sb>['channel']> | null = null;
const subs = new Set<() => void>();
export const registrosAvance = () => registros;
export function alCambiarAvance(cb: () => void): () => void { subs.add(cb); return () => subs.delete(cb); }

export async function iniciarAvance(): Promise<void> {
  if (!sb || !perfil || canal) return;
  const { data } = await sb.from('avance_registros').select('*').order('fecha');
  registros = (data ?? []) as RegAvance[];
  subs.forEach((c) => c());
  canal = sb.channel('avance-db').on('postgres_changes', { event: '*', schema: 'public', table: 'avance_registros' }, (p) => {
    const r = p.new as RegAvance;
    registros = p.eventType === 'INSERT' ? [...registros, r] : registros.map((x) => (x.id === r.id ? r : x));
    subs.forEach((c) => c());
  }).subscribe();
}
export async function registrarAvance(a: Act, pct: number, nota: string): Promise<string | null> {
  if (!sb || !perfil) return 'Inicia sesión';
  const { error } = await sb.from('avance_registros').insert({ actividad_id: a.id, habitacion: a.hab, especialidad: a.esp, pct_acumulado: pct, nota });
  return error ? error.message : null;
}
export async function validarAvance(id: number): Promise<string | null> {
  if (!sb || !perfil) return 'Inicia sesión';
  const { error } = await sb.from('avance_registros').update({ validado_por: perfil.id, validado_at: new Date().toISOString() }).eq('id', id);
  return error ? (/row-level/i.test(error.message) ? 'Solo Administración, Estelar o Coordinación BIM validan avances.' : error.message) : null;
}

const T = (d: string) => new Date(d + 'T12:00:00-05:00').getTime();
/** fracción real (0–1) de una actividad al cierre del día d, o null si no hay ningún dato para ese día */
export function realActEn(a: Act, d: string): number {
  let v = a.real >= 1 && d >= a.fin ? 1 : 0; // matriz: completadas
  for (const r of registros) if (r.actividad_id === a.id && r.validado_por && r.fecha <= d) v = Math.max(0, Math.min(1, r.pct_acumulado / 100));
  return v;
}
export function progActEn(a: Act, d: string): number {
  const t = T(d) + 12 * 3600e3, i = T(a.ini) - 12 * 3600e3, f = T(a.fin) + 12 * 3600e3;
  return t <= i ? 0 : t >= f ? 1 : (t - i) / (f - i);
}
export function agregar(acts: Act[], d: string): { prog: number; real: number; hechas: number; n: number } {
  let w = 0, p = 0, r = 0, h = 0;
  for (const a of acts) { const k = Math.max(1, a.dias); w += k; p += progActEn(a, d) * k; const ra = realActEn(a, d); r += ra * k; if (ra >= 1) h++; }
  return { prog: w ? p / w : 0, real: w ? r / w : 0, hechas: h, n: acts.length };
}
export function dias(desde: string, hasta: string): string[] {
  const out: string[] = []; for (let t = T(desde); t <= T(hasta); t += 864e5) out.push(diaBog(t)); return out;
}
export const actividades = () => OBRA?.actividades ?? [];
export const pendientesValidar = () => registros.filter((r) => !r.validado_por);
