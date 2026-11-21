/* Personal de obra: quién está asignado a cada habitación y quién hizo check-in hoy (QR de la habitación).
   Las fotos viven en Storage privado (bucket personal): se piden con enlaces firmados de 1 hora, solo con sesión. */
import { sb, perfil } from './auth';
import { hoyBog } from './novedades';

export interface Persona { id: string; nombre: string; area: string; especialidad: string | null; contratista: string; foto_path: string | null; activo: boolean }
export interface Asignacion { id: number; personal_id: string; habitacion: string; desde: string; hasta: string | null }
export interface Checkin { id: number; personal_id: string; habitacion: string; ts: string; salida: string | null }

let personas: Persona[] = []; let asign: Asignacion[] = []; let checks: Checkin[] = [];
const fotos = new Map<string, string>();
const subs = new Set<() => void>();
let canal: ReturnType<NonNullable<typeof sb>['channel']> | null = null;
const avisar = () => subs.forEach((c) => c());
export function alCambiarPersonal(cb: () => void): () => void { subs.add(cb); return () => subs.delete(cb); }
export const listaPersonal = () => personas;
export const fotoDe = (p: Persona) => fotos.get(p.id) ?? null;

async function firmarFotos(): Promise<void> {
  if (!sb) return;
  const faltan = personas.filter((p) => p.foto_path && !fotos.has(p.id));
  if (!faltan.length) return;
  const { data } = await sb.storage.from('personal').createSignedUrls(faltan.map((p) => p.foto_path!), 3600);
  (data ?? []).forEach((d, i) => { if (d.signedUrl) fotos.set(faltan[i].id, d.signedUrl); });
}
async function recargar(): Promise<void> {
  if (!sb) return;
  const hoy = hoyBog();
  const [a, b, c] = await Promise.all([
    sb.from('personal').select('*').eq('activo', true).order('nombre'),
    sb.from('asignaciones').select('*').lte('desde', hoy).or(`hasta.is.null,hasta.gte.${hoy}`),
    sb.from('checkins').select('*').gte('ts', new Date(hoy + 'T00:00:00-05:00').toISOString()).order('ts', { ascending: false }),
  ]);
  personas = (a.data ?? []) as Persona[]; asign = (b.data ?? []) as Asignacion[]; checks = (c.data ?? []) as Checkin[];
  await firmarFotos();
  avisar();
}
export async function iniciarPersonal(): Promise<void> {
  if (!sb || !perfil || canal) return;
  await recargar();
  let t = 0;
  const pronto = () => { clearTimeout(t); t = window.setTimeout(() => void recargar(), 400); };
  canal = sb.channel('personal-db')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'asignaciones' }, pronto)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, pronto)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'personal' }, pronto)
    .subscribe();
  setInterval(() => { fotos.clear(); void firmarFotos().then(avisar); }, 50 * 60_000); // renueva enlaces antes de que venzan
}

/** dentro = check-in de hoy sin salida; asignado = asignación vigente sin check-in */
export function enHabitacion(hab: string): { p: Persona; estado: 'dentro' | 'asignado'; desde?: string }[] {
  const dentro = new Map<string, Checkin>();
  for (const c of checks) if (!c.salida && !dentro.has(c.personal_id)) dentro.set(c.personal_id, c);
  const out: { p: Persona; estado: 'dentro' | 'asignado'; desde?: string }[] = [];
  for (const p of personas) {
    const c = dentro.get(p.id);
    if (c && c.habitacion === hab) out.push({ p, estado: 'dentro', desde: c.ts });
    else if (!c && asign.some((a) => a.personal_id === p.id && a.habitacion === hab)) out.push({ p, estado: 'asignado' });
  }
  return out;
}
export const habitacionesDe = (id: string) => asign.filter((a) => a.personal_id === id).map((a) => a.habitacion);
export const dentroAhora = (id: string) => checks.find((c) => c.personal_id === id && !c.salida)?.habitacion ?? null;
export const sinUbicar = () => personas.filter((p) => !asign.some((a) => a.personal_id === p.id) && !dentroAhora(p.id));

export async function asignar(personal_id: string, habitacion: string): Promise<string | null> {
  if (!sb) return 'Sin sesión';
  const { error } = await sb.from('asignaciones').insert({ personal_id, habitacion });
  if (error) return /row-level/i.test(error.message) ? 'Solo gestión (admin, Estelar o BIM) asigna personal.' : error.message;
  await recargar(); return null;
}
export async function quitarAsignacion(personal_id: string, habitacion: string): Promise<string | null> {
  if (!sb) return 'Sin sesión';
  const ids = asign.filter((a) => a.personal_id === personal_id && a.habitacion === habitacion).map((a) => a.id);
  if (!ids.length) return null;
  const { error } = await sb.from('asignaciones').update({ hasta: hoyBog() }).in('id', ids);
  if (error) return /row-level/i.test(error.message) ? 'Solo gestión quita asignaciones.' : error.message;
  await recargar(); return null;
}
export async function editarPersona(id: string, cambios: Partial<Pick<Persona, 'area' | 'especialidad' | 'contratista'>>): Promise<string | null> {
  if (!sb) return 'Sin sesión';
  const { error } = await sb.from('personal').update(cambios).eq('id', id);
  if (error) return error.message;
  await recargar(); return null;
}
export const iniciales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();

/** convenciones de especialidad del personal (color del aro y etiqueta en la planta) */
export const ESP_PERSONA: Record<string, { n: string; corto: string; c: string }> = {
  jefe: { n: 'Jefe de obra', corto: 'JEFE', c: '#7B2D4F' },
  coo: { n: 'Supervisión', corto: 'SUP', c: '#0E3064' },
  arq: { n: 'Arquitectónico', corto: 'ARQ', c: '#C9A96E' },
  est: { n: 'Estructural', corto: 'EST', c: '#8E9AA6' },
  ele: { n: 'Eléctrico', corto: 'ELE', c: '#E0A526' },
  hid: { n: 'Hidrosanitario', corto: 'HID', c: '#2F7BEA' },
  des: { n: 'Desagües', corto: 'DES', c: '#8B5E3C' },
  rci: { n: 'Contra incendios', corto: 'RCI', c: '#D2332A' },
  hvac: { n: 'HVAC', corto: 'HVAC', c: '#5FA8A0' },
  aca: { n: 'Acabados', corto: 'ACA', c: '#C77D5B' },
  mob: { n: 'Mobiliario', corto: 'MOB', c: '#9A6BDB' },
  aseo: { n: 'Aseo', corto: 'ASEO', c: '#9AA6B2' },
};
export const espPersona = (id: string | null) => (id && ESP_PERSONA[id]) || { n: 'Sin especialidad', corto: '—', c: '#C5CBD2' };
