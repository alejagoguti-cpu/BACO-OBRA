/* Datos reales de obra del Piso 2 (public/data/obra.json, generado desde la matriz de programación).
   Avance programado = proporción de días cumplidos de cada actividad a la fecha de corte, ponderado por días operativos.
   Avance real = % real de la matriz, o 100% si se marcó como terminada en la app. */
import { S, save } from './store';

export interface Hab { hab: string; frente: string; tipo: string; area: number; ini: string; fin: string; dias: number }
export interface Act { id: string; frente: string; hab: string; tipo: string; fase: string; desc: string; ini: string; fin: string; dias: number; rel: string; quien: string; esp: string; estado: string; real: number; obs: string }
export interface Hito { fecha: string; hito: string; resultado: string; quien: string; tipo: string; decision: string }
export interface Frente { frente: string; secuencia: string; n: number; comp: string; area: number; ini: string; fin: string; criterio: string }
export interface Obra { fuente: string; resumen: string; inicio: string; entrega: string; finProduccion: string; habitaciones: Hab[]; frentes: Frente[]; hitos: Hito[]; actividades: Act[]; inspeccion: { hab: string; act: string; fase: string; cob: string }[] }

export let OBRA: Obra | null = null;
export async function cargarObra(): Promise<Obra | null> {
  if (OBRA) return OBRA;
  try { OBRA = await (await fetch(import.meta.env.BASE_URL + 'data/obra.json')).json(); } catch { OBRA = null; }
  return OBRA;
}

const D = (s: string) => new Date(s + 'T12:00:00').getTime();
export const DIA = 864e5;
/** fecha de corte: la elegida por el usuario o hoy, dentro del rango de la obra */
export function corte(): number {
  if (!OBRA) return Date.now();
  const lo = D(OBRA.inicio), hi = D(OBRA.entrega);
  const c = S.corte ? D(S.corte) : Date.now();
  return Math.min(hi, Math.max(lo, c));
}
export function progAct(a: Act, t = corte()): number {
  const i = D(a.ini), f = D(a.fin) + DIA;
  return t <= i ? 0 : t >= f ? 1 : (t - i) / (f - i);
}
export const realAct = (a: Act) => (S.hecho[a.id] ? 1 : a.real);
export function marcar(id: string, v: boolean): void { if (v) S.hecho[id] = 1; else delete S.hecho[id]; save(); }

function agregado(acts: Act[], t = corte()): { prog: number; real: number; n: number; hechas: number } {
  let w = 0, p = 0, r = 0, h = 0;
  for (const a of acts) { const k = Math.max(1, a.dias); w += k; p += progAct(a, t) * k; r += realAct(a) * k; if (realAct(a) >= 1) h++; }
  return { prog: w ? p / w : 0, real: w ? r / w : 0, n: acts.length, hechas: h };
}
export const total = (t?: number) => agregado(OBRA?.actividades ?? [], t);
export const porHab = (hab: string, t?: number) => agregado((OBRA?.actividades ?? []).filter((a) => a.hab === hab), t);
export const porFrente = (f: string, t?: number) => agregado((OBRA?.actividades ?? []).filter((a) => a.frente === f), t);
export const porEsp = (e: string, t?: number) => agregado((OBRA?.actividades ?? []).filter((a) => a.esp === e), t);
export const fases = () => [...new Set((OBRA?.actividades ?? []).map((a) => a.fase))].sort((a, b) => parseInt(a) - parseInt(b));
export const porFase = (f: string, t?: number) => agregado((OBRA?.actividades ?? []).filter((a) => a.fase === f), t);

/** semanas de obra (lunes a domingo) desde el inicio hasta la entrega */
export function semanas(): { i: number; ini: number; fin: number; label: string }[] {
  if (!OBRA) return [];
  const out = []; const lo = D(OBRA.inicio), hi = D(OBRA.entrega);
  let s = lo - ((new Date(lo).getDay() + 6) % 7) * DIA;
  for (let i = 1; s <= hi; i++, s += 7 * DIA) out.push({ i, ini: s, fin: s + 6 * DIA, label: 'S' + i });
  return out;
}
/** curva programada acumulada al final de cada semana */
export const curvaProg = () => semanas().map((w) => total(Math.min(w.fin + DIA - 1, D(OBRA!.entrega) + DIA)).prog);
export const actsSemana = (ini: number, fin: number) => (OBRA?.actividades ?? []).filter((a) => D(a.ini) <= fin && D(a.fin) >= ini);
export const fechaCorta = (t: number) => new Date(t).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
