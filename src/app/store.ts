/* Estado de la app.
   - Preferencias y marcas: localStorage (por navegador).
   - Novedades: si hay Supabase configurado (SUPA abajo) se comparten entre todos; si no, quedan en este navegador. */
import { NOVEDADES_SEED, PROVEEDORES_SEED, type Novedad, type Proveedor } from './data';

/** Para compartir novedades entre todos: URL y clave pública (publishable) del proyecto Supabase. */
export const SUPA = { url: '', key: '' };
export const compartido = () => !!(SUPA.url && SUPA.key);

const KEY = 'baco-obra-v4';
export interface Estado {
  modo: 'solo' | 'integrado'; obra: number; iva: boolean; mes: number;
  ent: Record<string, number>; prov: Proveedor[]; esp: string; chart: 'bar' | 'line'; img: number; semana: number;
  act: Record<number, number>; corte: string; hecho: Record<string, number>;
}
const def = (): Estado => ({ modo: 'solo', obra: 8, iva: false, mes: 5, ent: { A0: 1, A1: 1, A2: 1, A4: 1 }, prov: PROVEEDORES_SEED.map((p) => ({ ...p })), esp: 'coo', chart: 'bar', img: 0, semana: -1, act: {}, corte: '', hecho: {} });
export let S: Estado = def();
try { const r = localStorage.getItem(KEY); if (r) S = Object.assign(def(), JSON.parse(r)); } catch { /* sin almacenamiento */ }
export const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* lleno o bloqueado */ } };
export function reset(): void { S = def(); save(); try { localStorage.removeItem(KEY + '-nov'); } catch { /* */ } novedades = NOVEDADES_SEED.map((n) => ({ ...n })); }

/* ---------------- novedades ---------------- */
let novedades: Novedad[] = NOVEDADES_SEED.map((n) => ({ ...n }));
try { const r = localStorage.getItem(KEY + '-nov'); if (r) novedades = JSON.parse(r); } catch { /* */ }
const saveNov = () => {
  try { localStorage.setItem(KEY + '-nov', JSON.stringify(novedades)); }
  catch { // fotos muy pesadas: guarda sin las más viejas
    try { localStorage.setItem(KEY + '-nov', JSON.stringify(novedades.map((n, i) => (i > 20 ? { ...n, foto: undefined } : n)))); } catch { /* */ }
  }
};
export const listaNovedades = () => novedades;

const hdr = () => ({ apikey: SUPA.key, Authorization: 'Bearer ' + SUPA.key, 'Content-Type': 'application/json' });
export async function cargarNovedades(): Promise<Novedad[]> {
  if (!compartido()) return novedades;
  try {
    const r = await fetch(`${SUPA.url}/rest/v1/novedades?select=*&order=ts.desc`, { headers: hdr() });
    if (r.ok) { const rows = (await r.json()) as Novedad[]; novedades = [...rows, ...novedades.filter((n) => n.ej && !rows.some((x) => x.id === n.id))]; }
  } catch { /* sin red: se queda con lo local */ }
  return novedades;
}
export function nuevoId(): string {
  const n = Math.max(0, ...novedades.map((x) => parseInt(x.id.split('-')[1]) || 0)) + 1;
  return 'N-' + String(n).padStart(3, '0') + (compartido() ? '-' + Math.random().toString(36).slice(2, 5) : '');
}
export async function agregarNovedad(n: Novedad): Promise<void> {
  novedades.unshift(n); saveNov();
  if (compartido()) {
    try { await fetch(`${SUPA.url}/rest/v1/novedades`, { method: 'POST', headers: { ...hdr(), Prefer: 'return=minimal' }, body: JSON.stringify(n) }); } catch { /* queda local */ }
  }
}
export async function actualizarNovedad(id: string, cambios: Partial<Novedad>): Promise<void> {
  const n = novedades.find((x) => x.id === id); if (!n) return;
  Object.assign(n, cambios); saveNov();
  if (compartido() && !n.ej) {
    try { await fetch(`${SUPA.url}/rest/v1/novedades?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: hdr(), body: JSON.stringify(cambios) }); } catch { /* */ }
  }
}

/** Reduce una foto del celular a JPEG de máximo 1280 px antes de guardarla. */
export function comprimirFoto(file: File, max = 1280, q = 0.72): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}
