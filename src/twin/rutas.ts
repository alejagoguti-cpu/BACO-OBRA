/* Rutas del área espacial del gemelo (módulo liviano: no carga three.js). */
export type RutaTwin =
  | { v: 'edificio' } | { v: 'bim' } | { v: 'planta'; hab?: string }
  | { v: 'gemelo'; hab: string; el?: string }
  | { v: 'novedades'; sub: string[] };

export function parseRuta(h: string): RutaTwin | null {
  const p = h.split('/');
  if (p[0] === 'novedades' && (p.length === 1 || ['hab', 'n', 'nueva'].includes(p[1]))) return { v: 'novedades', sub: p.slice(1) };
  if (p[0] !== 'fontana') return null;
  if (p.length === 1) return { v: 'edificio' };
  if (p[1] === 'bim') return { v: 'bim' };
  if (p[1] === 'piso-2') return p[2] ? { v: 'planta', hab: p[2] } : { v: 'planta' };
  if (/^\d{3}$/.test(p[1]) && p[2] === 'gemelo') return { v: 'gemelo', hab: p[1], el: p[3] ? decodeURIComponent(p[3]) : undefined };
  return { v: 'edificio' };
}
