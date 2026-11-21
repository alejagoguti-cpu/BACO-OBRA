/* Presencia en tiempo real (Supabase Realtime Presence).
   Presencia ≠ historial: aquí solo aparece quien tiene la app abierta AHORA. Si no hay interacción en 2 min
   pasa a "inactivo"; al cerrar la pestaña desaparece. El historial de ingresos vive en access_log. */
import type { RealtimeChannel } from '@supabase/supabase-js';
import { sb, type Perfil } from './auth';

export interface Presente {
  uid: string; nombre: string; rol: string; metodo: 'password' | 'qr';
  proyecto: string; vista: string; lugar: string; elemento: string;
  activo: boolean; ultima: number;
}
const INACTIVO_MS = 120_000;
let canal: RealtimeChannel | null = null;
let yo: Presente | null = null;
let lista: Presente[] = [];
let ultimaAct = Date.now();
let enviado = 0;
const subs = new Set<(l: Presente[]) => void>();

export const presentes = () => lista;
export const yoPresente = () => yo;
export function alCambiarPresencia(cb: (l: Presente[]) => void): () => void { subs.add(cb); cb(lista); return () => subs.delete(cb); }

function publicar(forzar = false): void {
  if (!canal || !yo) return;
  const ahora = Date.now();
  if (!forzar && ahora - enviado < 15_000) return;
  enviado = ahora;
  void canal.track({ ...yo, ultima: ultimaAct });
}

export function conectarPresencia(p: Perfil): void {
  if (!sb || canal) return;
  yo = { uid: p.id, nombre: p.nombre, rol: p.rol, metodo: p.metodo, proyecto: 'Hotel Estelar La Fontana', vista: '', lugar: '', elemento: '', activo: true, ultima: Date.now() };
  canal = sb.channel('twin-la-fontana', { config: { presence: { key: p.id } } });
  canal.on('presence', { event: 'sync' }, () => {
    const st = canal!.presenceState<Presente>();
    // una persona puede tener varias pestañas: se queda con la más reciente
    lista = Object.values(st).map((arr) => arr.reduce((a, b) => (b.ultima > a.ultima ? b : a)))
      .map((x) => ({ ...x, activo: x.activo && Date.now() - x.ultima < INACTIVO_MS + 20_000 }));
    subs.forEach((cb) => cb(lista));
  });
  canal.subscribe((s) => { if (s === 'SUBSCRIBED') publicar(true); });
  const act = () => {
    const estabaInactivo = yo && !yo.activo;
    ultimaAct = Date.now();
    if (yo) yo.activo = true;
    publicar(!!estabaInactivo);
  };
  ['pointerdown', 'keydown', 'wheel'].forEach((e) => addEventListener(e, act, { passive: true }));
  setInterval(() => {
    if (!yo) return;
    const inactivo = Date.now() - ultimaAct > INACTIVO_MS;
    if (inactivo && yo.activo) { yo.activo = false; publicar(true); }
    else publicar();
  }, 30_000);
  document.addEventListener('visibilitychange', () => { if (yo) { yo.activo = document.visibilityState === 'visible'; publicar(true); } });
}

/** La app informa dónde está el usuario: vista (p. ej. "Piso 2"), lugar (p. ej. "HAB-216") y elemento seleccionado. */
export function informarUbicacion(p: Partial<Pick<Presente, 'vista' | 'lugar' | 'elemento'>>): void {
  if (!yo) return;
  const cambio = (Object.keys(p) as (keyof typeof p)[]).some((k) => yo![k] !== p[k]);
  Object.assign(yo, p);
  if (cambio) publicar(true);
}
export async function desconectarPresencia(): Promise<void> {
  if (canal) { await canal.untrack(); await sb?.removeChannel(canal); }
  canal = null; yo = null; lista = []; subs.forEach((cb) => cb(lista));
}
