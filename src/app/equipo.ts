/* Equipo: cuentas de la plataforma (solo administración), personal de obra y códigos QR de check-in por habitación.
   Check-in: página pública que abre el QR impreso (#checkin/<hab>/<token>); el trabajador toca su nombre. */
import { sb, perfil, ROL_TXT } from './auth';
import { listaPersonal, fotoDe, editarPersona, dentroAhora, habitacionesDe, iniciales, ESP_PERSONA, espPersona } from './personal';
import { esc, ic, toast } from './ui';

const ESPS: [string, string][] = [['', 'Sin especialidad'], ...Object.entries(ESP_PERSONA).map(([k, v]) => [k, v.n] as [string, string])];
let cuentas: { nombre: string; rol: string; empresa: string }[] = [];
let tokens: { habitacion: string; token: string }[] = [];
export async function cargarEquipo(): Promise<void> {
  if (!sb || !perfil) return;
  const [a, b] = await Promise.all([sb.from('profiles').select('nombre, rol, empresa').order('nombre'), sb.from('qr_habitacion').select('habitacion, token').order('habitacion')]);
  cuentas = (a.data ?? []) as typeof cuentas; tokens = (b.data ?? []) as typeof tokens;
}
const urlCheckin = (h: string, t: string) => `${location.origin}${location.pathname}#checkin/${h}/${t}`;

export function vEquipo(): string {
  const esAdmin = !!perfil && ['admin', 'estelar'].includes(perfil.rol);
  const gestion = !!perfil && ['admin', 'estelar', 'bim'].includes(perfil.rol);
  const per = listaPersonal();
  return `<header class="rs-head"><div><p class="eyebrow">EQUIPO · LA FONTANA PISO 2</p><h1>Equipo <b>y accesos.</b></h1><p class="sub">Cuentas de la plataforma, personal de obra con su especialidad y los QR de check-in de cada habitación. Las fotos solo se ven con sesión iniciada.</p></div></header>
  <div class="eq-grid">
    <section class="rs-card"><div class="rs-ch"><div><h2>Personal de obra (${per.length})</h2><p class="muted">Área y contratista del listado de personal; la especialidad define el color en la planta.</p></div></div>
      <div class="eq-per">${per.map((p) => `<div class="eq-row"><span class="eq-av" style="box-shadow:0 0 0 3px ${espPersona(p.especialidad).c};${fotoDe(p) ? `background-image:url('${fotoDe(p)}')` : ''}">${fotoDe(p) ? '' : esc(iniciales(p.nombre))}</span>
        <span class="eq-n"><b>${esc(p.nombre)}</b><small>${esc(p.area || 'Área sin registrar')}${p.contratista ? ' · ' + esc(p.contratista) : ''} · ${dentroAhora(p.id) ? `<span style="color:#16774B;font-weight:700">en la ${dentroAhora(p.id)}</span>` : habitacionesDe(p.id).length ? 'asignado a ' + habitacionesDe(p.id).join(', ') : 'sin ubicar'}</small></span>
        ${gestion ? `<select data-eq="esp" data-id="${p.id}">${ESPS.map(([v, t]) => `<option value="${v}" ${(p.especialidad ?? '') === v ? 'selected' : ''}>${t}</option>`).join('')}</select>` : ''}</div>`).join('')}</div></section>
    <div class="eq-col">
      ${esAdmin ? `<section class="rs-card"><div class="rs-ch"><div><h2>Crear cuenta</h2><p class="muted">El acceso es solo con cuenta autorizada. Comparte la contraseña temporal por un canal privado.</p></div></div>
        <form class="eq-form" id="fEqCuenta"><input name="nombre" placeholder="Nombre completo" required><input name="email" type="email" placeholder="Correo" required><input name="empresa" placeholder="Empresa (opcional)">
        <select name="rol">${(['consulta', 'contratista', 'bim', 'estelar'] as const).map((r) => `<option value="${r}">${ROL_TXT[r]}</option>`).join('')}</select>
        <input name="password" placeholder="Contraseña temporal (mín. 8)" minlength="8" required><button class="btn pri">Crear cuenta</button></form>
        <div class="eq-cuentas">${cuentas.map((c) => `<span><b>${esc(c.nombre)}</b> ${esc(ROL_TXT[c.rol as keyof typeof ROL_TXT] ?? c.rol)}${c.empresa ? ' · ' + esc(c.empresa) : ''}</span>`).join('')}</div></section>` : ''}
      ${gestion ? `<section class="rs-card"><div class="rs-ch"><div><h2>QR de check-in por habitación</h2><p class="muted">Imprímelos y pégalos en la puerta. Quien lo escanee marca su entrada o salida; no necesita cuenta.</p></div><button class="btn" data-act="imprimir">${ic('printer', 1.8)} Imprimir</button></div>
        <div class="eq-qrs">${tokens.map((t) => `<figure><img data-qrurl="${esc(urlCheckin(t.habitacion, t.token))}" alt="QR check-in habitación ${t.habitacion}"><figcaption>Habitación <b>${t.habitacion}</b><small>Check-in de obra</small></figcaption></figure>`).join('')}</div></section>` : ''}
    </div>
  </div>`;
}
export async function pintarQrsEquipo(): Promise<void> {
  const imgs = document.querySelectorAll<HTMLImageElement>('img[data-qrurl]'); if (!imgs.length) return;
  const QR = (await import('qrcode')).default;
  imgs.forEach(async (img) => { img.src = await QR.toDataURL(img.dataset.qrurl!, { margin: 1, width: 220, color: { dark: '#0E3064', light: '#FFFFFF' } }); });
}
export async function eventoEquipo(t: HTMLElement): Promise<boolean> {
  if (t.dataset.eq === 'esp') { const s = t as HTMLSelectElement; toast((await editarPersona(s.dataset.id!, { especialidad: s.value || null })) ?? 'Especialidad actualizada'); return true; }
  return false;
}
export async function crearCuenta(f: HTMLFormElement): Promise<void> {
  if (!sb) return;
  const d = Object.fromEntries(new FormData(f)) as Record<string, string>;
  const { data, error } = await sb.functions.invoke('admin-usuarios', { body: d });
  let msg = data?.error as string | undefined;
  if (error) { try { msg = (await (error as { context?: Response }).context?.json())?.error; } catch { /* */ } }
  if (error || msg) { toast(msg || 'No se pudo crear la cuenta'); return; }
  toast(`Cuenta creada para ${d.email}`); f.reset(); await cargarEquipo();
}

/* ---------------- check-in público (QR de la habitación) ---------------- */
export async function mostrarCheckin(el: HTMLElement, hab: string, token: string): Promise<void> {
  const url = (import.meta.env.VITE_SUPABASE_URL as string) + '/functions/v1/checkin';
  const llamar = async (body: object) => (await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_KEY as string }, body: JSON.stringify({ habitacion: hab, token, ...body }) })).json();
  el.innerHTML = `<div class="acc solo"><section class="acc-box"><p class="acc-over">Check-in de obra</p><h1>Habitación ${esc(hab)}</h1><p class="acc-muted">Cargando…</p></section></div>`;
  const r = await llamar({ accion: 'lista' });
  if (r.error) { el.innerHTML = `<div class="acc solo"><section class="acc-box"><p class="acc-over">Check-in de obra</p><h1>Código no válido</h1><p class="acc-muted">${esc(r.error)}</p></section></div>`; return; }
  const personas = r.personas as { id: string; nombre: string; area: string; asignado: boolean }[]; const dentro = new Set(r.dentro as string[]);
  const fila = (p: (typeof personas)[number]) => `<button class="ck-p ${dentro.has(p.id) ? 'in' : ''}" data-ck="${p.id}"><b>${esc(p.nombre)}</b><small>${esc(p.area || '')}${dentro.has(p.id) ? ' · dentro · toca para salir' : ''}</small></button>`;
  const asign = personas.filter((p) => p.asignado), otros = personas.filter((p) => !p.asignado);
  el.innerHTML = `<div class="acc solo"><section class="acc-box"><p class="acc-over">Check-in de obra · La Fontana</p><h1>Habitación ${esc(hab)}</h1><p class="acc-muted">Toca tu nombre para marcar entrada. Si ya estás dentro, tócalo para marcar salida.</p>
    ${asign.length ? `<span class="acc-over" style="margin-top:6px">Asignados aquí</span><div class="ck-lista">${asign.map(fila).join('')}</div>` : ''}
    <span class="acc-over" style="margin-top:6px">${asign.length ? 'Otras personas' : 'Personal'}</span><div class="ck-lista">${otros.map(fila).join('')}</div></section></div>`;
  el.querySelectorAll<HTMLElement>('[data-ck]').forEach((b) => b.addEventListener('click', async () => {
    const id = b.dataset.ck!; const salida = dentro.has(id);
    const res = await llamar({ accion: salida ? 'salida' : 'entrada', personal_id: id });
    toast(res.error ?? `${res.nombre}: ${salida ? 'salida' : 'entrada'} registrada en la ${hab}`);
    if (!res.error) void mostrarCheckin(el, hab, token);
  }));
}
