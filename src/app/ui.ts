/* Piezas de interfaz compartidas: íconos, formatos y gráficos animados (SVG). */
import { M } from './data';

export const fmt = (v: number) => '$' + Math.round(v).toLocaleString('es-CO');
export const fmtM = (v: number) => '$' + (v / M).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M';
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const P: Record<string, string> = {
  mapa: '<path d="M9 4.5 3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8z"/><path d="M9 4.5v12.7M15 6.8v12.7"/>',
  obra: '<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6M4 20h16"/>',
  panel: '<rect x="3.5" y="3.5" width="7" height="8" rx="2"/><rect x="13.5" y="3.5" width="7" height="5" rx="2"/><rect x="13.5" y="11.5" width="7" height="9" rx="2"/><rect x="3.5" y="14.5" width="7" height="6" rx="2"/>',
  plan: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M7 14h5M11 17h6"/>',
  avance: '<path d="M4 19V10M10 19V5M16 19v-6M22 19H2"/>',
  proveedores: '<path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.5V20h14V9.5M9.5 20v-5h5v5"/>',
  novedades: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
  entregables: '<rect x="5" y="3.5" width="14" height="17" rx="3"/><path d="M9 12l2 2 4-4"/>',
  honorarios: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2.1 0 2.9 5.8 1.4 5.8 4.3 0 1.3-1.2 2.1-2.9 2.1-1.3 0-2.5-.6-3-1.5M12 6v1.8M12 16.2V18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>', filter: '<path d="M5 7h14M8 12h8M10.5 17h3"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5h4"/>', arrow: '<path d="M7 17L17 7M9 7h8v8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', chev: '<path d="M9 6l6 6-6 6"/>', down: '<path d="M12 4v15M6 13l6 6 6-6"/>', arrowR: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  tap: '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0 0V9.5a1.5 1.5 0 0 1 3 0V11m0 0v-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4 15.5a1.5 1.5 0 0 1 2.3-1.9L9 16"/>', back: '<path d="M10 6l-6 6 6 6M4 12h16"/>',
  build: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 20.5v-4h4v4"/>',
  layers: '<path d="M12 4l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/>', drop: '<path d="M12 3.5s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l9-11.5h-6z"/>', fire: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6 0-4.5 4-6.2 4.5-10.5 2.7 1.7 4 4 4 6 1-.6 1.6-1.6 1.8-2.9 1.6 1.7 2.7 4 2.7 6.9 0 3.6-2.6 6.5-6.5 6.5z"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  area: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  doc: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M10 12h5M10 15.5h5"/>', cal: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5"/>', bars: '<path d="M6 19V11M12 19V5M18 19v-8"/>', line: '<path d="M3 17l5-5 4 3 8-8"/>',
  camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  printer: '<path d="M7 9V4h10v5M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="6"/>', cut: '<path d="M4 12h16M7 8l-3 4 3 4M17 8l3 4-3 4"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.5 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.5-3.5-8.5s1-5.9 3.5-8.5z"/>',
  moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.3a2.6 2.6 0 1 1 3.7 2.4c-.9.4-1.2 1-1.2 1.8v.3"/><circle cx="12" cy="16.8" r=".7" fill="currentColor"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2.5 2.5M18 4.5L20.5 7"/>',
  logout: '<path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10"/><path d="M15 8l5 4-5 4M9 12h11"/>',
  hard: '<path d="M4 15a8 8 0 0 1 16 0v2H4z"/><path d="M10 7.3V5a2 2 0 0 1 4 0v2.3M2 17h20"/>',
  crown: '<path d="M3.5 18h17M4.5 15L3 7l5 4 4-6 4 6 5-4-1.5 8z"/>',
  spark: '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/><path d="M19 3l.8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8z"/>',
  wa: '<path d="M20 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.2A8.5 8.5 0 1 1 20 11.5z"/><path d="M9.5 8.8c-.3 0-.8.3-.8 1.2 0 1.4 1.3 3.2 2.9 4.2 1.4.9 2.5.9 3 .7.5-.2.9-.8 1-1.2.1-.3 0-.5-.2-.6l-1.3-.6c-.2-.1-.4 0-.6.2l-.5.6c-.2.2-.4.2-.7 0-.6-.3-1.5-1-2-1.8-.2-.3-.1-.5.1-.7l.4-.5c.2-.2.2-.4.1-.6l-.6-1.4c-.2-.3-.4-.5-.8-.5z"/>',
  mic: '<rect x="9" y="3.5" width="6" height="10" rx="3"/><path d="M5.5 10.5a6.5 6.5 0 0 0 13 0M12 17v3.5M8.5 20.5h7"/>',
  vr: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.8"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>', pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>', rew: '<path d="M11 6.5 4.5 12l6.5 5.5zM19.5 6.5 13 12l6.5 5.5z"/>',
  focus: '<circle cx="12" cy="12" r="3"/><path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/>', cube: '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>', mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>', side: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9 4.5v15"/>',
  send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
};
export const ic = (k: string, sw = 1.8, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k] ?? ''}</svg>`;

export function ring(p: number, c: string, size = 38, sw = 4): string {
  const r = (size - sw) / 2 - 1, L = 2 * Math.PI * r, h = size / 2;
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px"><circle cx="${h}" cy="${h}" r="${r}" stroke="var(--soft)" stroke-width="${sw}" fill="none"/><circle cx="${h}" cy="${h}" r="${r}" stroke="${c}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - p)}" transform="rotate(-90 ${h} ${h})"/></svg>`;
}
export function gauge(p: number, c: string, label: string): string {
  const L = Math.PI * 80;
  return `<svg class="gauge" viewBox="0 0 180 100" role="img" aria-label="${label}">
  <path d="M10 92 A80 80 0 0 1 170 92" fill="none" stroke="var(--line)" stroke-width="22" stroke-dasharray="2.2 4.6"/>
  <path class="val" d="M10 92 A80 80 0 0 1 170 92" stroke="${c}" stroke-dasharray="${L} ${L}" style="stroke-dashoffset:${L * (1 - p)}"/>
  <text x="90" y="88" text-anchor="middle">${(p * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })}%</text></svg>`;
}
export function donutRing(p: number, c: string, label: string, sub: string, href = ''): string {
  const L = 2 * Math.PI * 36;
  const inner = `<svg viewBox="0 0 82 82"><circle cx="41" cy="41" r="36" stroke="var(--soft)"/><circle class="v" cx="41" cy="41" r="36" stroke="${c}" stroke-dasharray="${L}" style="stroke-dashoffset:${L * (1 - p)}" transform="rotate(-90 41 41)"/><text x="41" y="47" text-anchor="middle">${Math.round(p * 100)}%</text></svg><b>${label}</b><small>${sub}</small>`;
  return href ? `<a class="rg" href="${href}">${inner}</a>` : `<div class="rg">${inner}</div>`;
}
export const cnt = (v: number, f: 'int' | 'M' | 'pct' = 'int') => `<span data-count="${v}" data-f="${f}">${f === 'M' ? fmtM(v) : f === 'pct' ? Math.round(v) + '%' : Math.round(v).toLocaleString('es-CO')}</span>`;
export function countUp(root: HTMLElement): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const to = +el.dataset.count!, f = el.dataset.f, t0 = performance.now(), dur = 1100;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur), v = to * (1 - Math.pow(1 - k, 3));
      el.textContent = f === 'M' ? fmtM(v) : f === 'pct' ? Math.round(v) + '%' : Math.round(v).toLocaleString('es-CO');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
let tt = 0;
export function toast(m: string): void {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = m; el.setAttribute('role', 'status');
  document.getElementById('app')!.appendChild(el);
  clearTimeout(tt); tt = window.setTimeout(() => el.remove(), 2600);
}
