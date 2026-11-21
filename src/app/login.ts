/* Pantalla de acceso: QR de sesión (temporal, de un solo uso) o cuenta corporativa.
   También: aprobación del QR desde el teléfono (#qr-aprobar/<id>/<nonce>) y nueva contraseña (#nueva-clave). */
import { ACCESO_ABIERTO, backendListo, entrarConClave, registrar, recuperar, nuevaClave, perfil, qrNuevo, qrEstado, qrCanjear, qrMarcarEscaneado, qrAprobar, ROL_TXT, type SesionQR, type EstadoQR } from './auth';
import { esc, ic, toast } from './ui';

type Tab = 'qr' | 'cuenta' | 'registro' | 'recuperar';
let tab: Tab = ACCESO_ABIERTO ? 'cuenta' : 'qr';
let qr: SesionQR | null = null;
let qrEst: EstadoQR = 'esperando';
let poll = 0; let tick = 0;
let host: HTMLElement | null = null;
let alEntrar: () => void = () => {};
let msg = '';
const SVG = {
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.2"/></svg>',
  ojo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/><path d="m4 4 16 16"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  capas: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M24 8 4 17l20 9 20-9-20-9Z"/><path d="m4 24 20 9 20-9"/><path d="m4 31 20 9 20-9"/></svg>',
  barras: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="28" width="7" height="12"/><rect x="20" y="18" width="7" height="22"/><rect x="34" y="6" width="7" height="34"/></svg>',
  persona: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="24" cy="15" r="8"/><path d="M8 42c1-9 7.5-14 16-14s15 5 16 14"/></svg>',
  escudo: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M24 5 8 11v11c0 10 7 17 16 21 9-4 16-11 16-21V11L24 5Z"/><path d="m17 24 5 5 9-10"/></svg>',
};
const ARTE = `<div class="acc-art" aria-hidden="true"><i class="acc-arc a1"></i><i class="acc-arc a2"></i>
  <img class="acc-eco" src="logos/ecoestelar-blanco.png" alt="">
  <div class="acc-cap"><span class="acc-k">PLATAFORMA BIM</span><i class="acc-rule"></i>
    <h2>El futuro se construye <b>antes de construir.</b></h2>
    <p>La transformación de Estelar comienza con BIM. Una nueva forma de visualizar, coordinar y gestionar cada espacio antes, durante y después de su intervención.</p>
    <ul class="acc-ben"><li>${SVG.capas}<b>Detectar<br>interferencias</b></li><li>${SVG.barras}<b>Cuantificar<br>con exactitud</b></li><li>${SVG.persona}<b>Perfiles<br>claros</b></li><li>${SVG.escudo}<b>Menos<br>imprevistos</b></li></ul>
  </div></div>`;

const EST_TXT: Record<EstadoQR, [string, string]> = {
  esperando: ['Esperando escaneo', 'Escanea con la cámara de un teléfono donde ya tengas sesión iniciada.'],
  verificando: ['Verificando identidad', 'El teléfono abrió el enlace. Falta confirmar el acceso desde allí.'],
  autorizado: ['Acceso autorizado', 'Iniciando sesión en este dispositivo…'],
  consumido: ['Acceso autorizado', 'Sesión iniciada.'],
  expirado: ['Sesión expirada', 'El código venció por seguridad. Genera uno nuevo.'],
  invalido: ['Código no válido', 'Genera un código nuevo.'],
};

function detenerQR(): void { clearInterval(poll); clearInterval(tick); poll = 0; tick = 0; }

async function nuevoQR(): Promise<void> {
  detenerQR(); qr = null; qrEst = 'esperando'; msg = ''; pintar();
  try { qr = await qrNuevo(); } catch (e) { msg = 'No se pudo generar el código: ' + (e as Error).message; pintar(); return; }
  pintar();
  const QR = (await import('qrcode')).default;
  const img = host?.querySelector<HTMLImageElement>('#qrImg');
  if (img && qr) img.src = await QR.toDataURL(qr.url, { margin: 1, width: 360, color: { dark: '#0E3064', light: '#FFFFFF' } });
  poll = window.setInterval(async () => {
    if (!qr) return;
    const e = await qrEstado(qr);
    if (e !== qrEst) { qrEst = e; pintarEstado(); }
    if (e === 'autorizado') {
      detenerQR();
      const err = await qrCanjear(qr);
      if (err) { qrEst = 'invalido'; msg = err; pintarEstado(); return; }
      qrEst = 'consumido'; pintarEstado(); alEntrar();
    } else if (e === 'expirado' || e === 'invalido' || e === 'consumido') detenerQR();
  }, 1500);
  tick = window.setInterval(pintarCuenta, 1000);
}
function pintarCuenta(): void {
  const el = host?.querySelector('#qrCuenta'); if (!el || !qr) return;
  const s = Math.max(0, Math.round((qr.expira - Date.now()) / 1000));
  el.textContent = s ? `Vence en ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : 'Vencido';
  if (!s && qrEst === 'esperando') { qrEst = 'expirado'; pintarEstado(); detenerQR(); }
}
function pintarEstado(): void {
  const el = host?.querySelector<HTMLElement>('#qrEstado'); if (!el) return;
  const [t, d] = EST_TXT[qrEst];
  el.className = `qr-state s-${qrEst}`;
  el.innerHTML = `<i></i><span><b>${t}</b><small>${esc(msg || d)}</small></span>`;
  host?.querySelector('.qr-frame')?.classList.toggle('dead', qrEst === 'expirado' || qrEst === 'invalido');
}

function pintar(): void {
  if (!host) return;
  const sinBackend = !backendListo();
  host.innerHTML = `<div class="acc">
    ${ARTE}
    <section class="acc-box" role="dialog" aria-label="Acceso a la plataforma">
      <div><p class="acc-over">Plataforma BIM · Acceso autorizado</p><h1>Ingresar</h1></div>
      ${sinBackend ? '<p class="acc-msg err">Backend de autenticación no configurado: faltan VITE_SUPABASE_URL y VITE_SUPABASE_KEY en .env.local.</p>' : ''}
      <div class="acc-tabs" role="tablist">
        <button role="tab" data-acc="tab" data-v="qr" aria-selected="${tab === 'qr'}">${ic('qr', 1.8)} Código QR</button>
        <button role="tab" data-acc="tab" data-v="cuenta" aria-selected="${tab !== 'qr'}">${ic('user', 1.8)} Con cuenta</button>
      </div>
      ${tab === 'qr' ? `
        <div class="qr-wrap">
          <div class="qr-frame">${qr ? '<img id="qrImg" alt="Código QR de sesión">' : '<div class="qr-load"></div>'}</div>
          <div class="qr-side">
            <div id="qrEstado" class="qr-state"></div>
            <small id="qrCuenta" class="acc-muted"></small>
            <button class="acc-btn ghost" data-acc="nuevoQR">${ic('reset', 1.8)} Generar otro código</button>
            <p class="acc-muted acc-fine">El código es único, vence en 2 minutos y se usa una sola vez. Lo aprueba una persona con sesión activa en otro dispositivo.</p>
          </div>
        </div>` : tab === 'cuenta' ? `
        <form class="acc-form" id="fAccCuenta">
          <label>Correo corporativo<span class="acc-in">${SVG.mail}<input type="email" name="email" autocomplete="username" required></span></label>
          <label>Contraseña<span class="acc-in">${SVG.lock}<input type="password" name="clave" autocomplete="current-password" required><button type="button" class="acc-ojo" data-acc="ojo" aria-label="Mostrar contraseña">${SVG.ojo}</button></span></label>
          <button class="acc-btn pri">Ingresar ${ic('arrowR', 2)}</button>
          ${ACCESO_ABIERTO ? '<p class="acc-muted acc-fine">Prototipo con acceso abierto: entra con cualquier correo y una contraseña. La primera vez se crea tu cuenta; después usa la misma contraseña.</p>' : '<div class="acc-links"><button type="button" data-acc="tab" data-v="recuperar">¿Olvidaste tu contraseña?</button><button type="button" data-acc="solicitar">Solicitar cuenta</button></div>'}
        </form>` : tab === 'registro' ? `
        <form class="acc-form" id="fAccRegistro">
          <label>Nombre completo<input name="nombre" autocomplete="name" required></label>
          <label>Correo corporativo<input type="email" name="email" autocomplete="username" required></label>
          <label>Contraseña<input type="password" name="clave" autocomplete="new-password" required minlength="6"></label>
          <button class="acc-btn pri">Crear cuenta</button>
          <p class="acc-muted acc-fine">Las cuentas nuevas entran con rol <b>Consulta</b>. Un administrador asigna el rol definitivo.</p>
          <div class="acc-links"><button type="button" data-acc="tab" data-v="cuenta">Ya tengo cuenta</button></div>
        </form>` : `
        <form class="acc-form" id="fAccRecuperar">
          <label>Correo corporativo<input type="email" name="email" autocomplete="username" required></label>
          <button class="acc-btn pri">Enviar enlace de recuperación</button>
          <div class="acc-links"><button type="button" data-acc="tab" data-v="cuenta">Volver</button></div>
        </form>`}
      ${msg && tab !== 'qr' ? `<p class="acc-msg acc-info">${SVG.info}<span>${esc(msg)}</span></p>` : ''}
      <p class="acc-foot">Prototipo BACO Studio para Hoteles Estelar · cada ingreso queda registrado (identidad, método, hora y dispositivo).</p>
    </section></div>`;
  if (tab === 'qr') { pintarEstado(); pintarCuenta(); }
}

async function onClick(ev: Event): Promise<void> {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-acc]'); if (!b) return;
  if (b.dataset.acc === 'tab') { tab = b.dataset.v as Tab; msg = ''; if (tab === 'qr') void nuevoQR(); else { detenerQR(); pintar(); } }
  if (b.dataset.acc === 'nuevoQR') void nuevoQR();
  if (b.dataset.acc === 'ojo') { const inp = b.parentElement?.querySelector('input'); if (inp) inp.type = inp.type === 'password' ? 'text' : 'password'; }
  if (b.dataset.acc === 'solicitar') { msg = 'Las cuentas las crea administración (BACO Studio). Pide la tuya a tu coordinador de obra.'; pintar(); }
}
async function onSubmit(ev: Event): Promise<void> {
  const f = ev.target as HTMLFormElement; if (!f.id.startsWith('fAcc')) return;
  ev.preventDefault();
  const d = new FormData(f); const email = String(d.get('email') || '').trim(); const clave = String(d.get('clave') || '');
  const btn = f.querySelector('button.acc-btn') as HTMLButtonElement; btn.disabled = true;
  if (f.id === 'fAccCuenta') { const err = await entrarConClave(email, clave); if (err) { msg = err; pintar(); } else alEntrar(); }
  else if (f.id === 'fAccRegistro') { const r = await registrar(email, clave, String(d.get('nombre') || '').trim()); if (r) { msg = r; tab = 'cuenta'; pintar(); } else alEntrar(); }
  else if (f.id === 'fAccRecuperar') { msg = await recuperar(email); pintar(); }
  btn.disabled = false;
}

export function mostrarAcceso(el: HTMLElement, entrar: () => void): void {
  if (host !== el) { el.addEventListener('click', onClick); el.addEventListener('submit', onSubmit); }
  host = el; alEntrar = () => { detenerQR(); host = null; el.removeEventListener('click', onClick); el.removeEventListener('submit', onSubmit); entrar(); };
  pintar();
  if (tab === 'qr' && backendListo()) void nuevoQR();
}
export function cerrarAcceso(): void { detenerQR(); }

/* ---------- teléfono: aprobar un QR (requiere sesión en este dispositivo) ---------- */
export async function mostrarAprobacion(el: HTMLElement, id: string, nonce: string, irLogin: () => void): Promise<void> {
  if (!perfil) {
    el.innerHTML = `<div class="acc solo"><section class="acc-box"><p class="acc-over">Aprobar acceso por QR</p><h1>Inicia sesión primero</h1><p class="acc-muted">Para autorizar otro dispositivo necesitas una sesión activa aquí.</p><button class="acc-btn pri" id="accIrLogin">Ingresar con cuenta</button></section></div>`;
    el.querySelector('#accIrLogin')?.addEventListener('click', () => { try { sessionStorage.setItem('baco-qr-pendiente', `${id}/${nonce}`); } catch { /* */ } tab = 'cuenta'; irLogin(); });
    return;
  }
  const est = await qrMarcarEscaneado(id, nonce);
  if (est !== 'verificando' && est !== 'esperando') {
    el.innerHTML = `<div class="acc solo"><section class="acc-box"><p class="acc-over">Aprobar acceso por QR</p><h1>${EST_TXT[est][0]}</h1><p class="acc-muted">${EST_TXT[est][1]}</p><a class="acc-btn" href="#mapa">Ir a la plataforma</a></section></div>`;
    return;
  }
  el.innerHTML = `<div class="acc solo"><section class="acc-box">
    <p class="acc-over">Aprobar acceso por QR</p><h1>¿Autorizas el ingreso?</h1>
    <p class="acc-muted">Otro dispositivo entrará a la plataforma como <b>${esc(perfil.nombre)}</b> (${esc(ROL_TXT[perfil.rol])}). Hazlo solo si tú lo tienes enfrente.</p>
    <div class="acc-row"><button class="acc-btn pri" id="accAprobar">${ic('check', 2)} Autorizar</button><a class="acc-btn ghost" href="#mapa">Cancelar</a></div></section></div>`;
  el.querySelector('#accAprobar')?.addEventListener('click', async () => {
    const r = await qrAprobar(id, nonce);
    toast(r === 'autorizado' ? 'Acceso autorizado en el otro dispositivo' : EST_TXT[r][0]);
    location.hash = 'mapa';
  });
}

export function mostrarNuevaClave(el: HTMLElement, listo: () => void): void {
  el.innerHTML = `<div class="acc solo"><section class="acc-box"><p class="acc-over">Recuperación de acceso</p><h1>Nueva contraseña</h1>
    <form class="acc-form" id="fNuevaClave"><label>Nueva contraseña<input type="password" name="clave" minlength="6" required autocomplete="new-password"></label><button class="acc-btn pri">Guardar</button></form></section></div>`;
  el.querySelector('#fNuevaClave')?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const err = await nuevaClave(String(new FormData(ev.target as HTMLFormElement).get('clave') || ''));
    toast(err ?? 'Contraseña actualizada'); if (!err) listo();
  });
}
