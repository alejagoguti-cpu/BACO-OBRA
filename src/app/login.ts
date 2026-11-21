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
    <div class="acc-art" aria-hidden="true"><div class="acc-grid"></div><div class="acc-cap"><span>HOTELES ESTELAR · GEMELO DIGITAL</span><b>Hotel Estelar La Fontana</b><small>Bogotá · Torre Suites · remodelación</small><ul class="acc-ben"><li><i>01</i><div><b>Detectar interferencias</b><small>Cruza la arquitectura con las redes sanitarias e hidráulicas antes de llegar a obra.</small></div></li><li><i>02</i><div><b>Cuantificar con exactitud</b><small>Cantidades exactas de cada elemento y accesorio, salidas del modelo y no de un estimado.</small></div></li><li><i>03</i><div><b>Perfiles claros</b><small>Cada persona entra con su rol y sabe qué le toca revisar, aprobar o ejecutar.</small></div></li><li><i>04</i><div><b>Menos imprevistos</b><small>Lo que se resuelve en el modelo no se paga dos veces en obra: reduce costos por imprevistos.</small></div></li></ul></div></div>
    <section class="acc-box" role="dialog" aria-label="Acceso a la plataforma">
      <div class="acc-logos"><img src="logos/estelar.png" alt="Hoteles Estelar"><span></span><img src="logos/baco.png" alt="BACO Studio"></div>
      <div><p class="acc-over">Plataforma BIM · Acceso autorizado</p><h1>Ingresar</h1></div>
      ${sinBackend ? '<p class="acc-msg err">Backend de autenticación no configurado: faltan VITE_SUPABASE_URL y VITE_SUPABASE_KEY en .env.local.</p>' : ''}
      <div class="acc-tabs" role="tablist">
        <button role="tab" data-acc="tab" data-v="qr" aria-selected="${tab === 'qr'}">${ic('qr', 1.8)} Código QR</button>
        <button role="tab" data-acc="tab" data-v="cuenta" aria-selected="${tab !== 'qr'}">${ic('mail', 1.8)} Con cuenta</button>
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
          <label>Correo corporativo<input type="email" name="email" autocomplete="username" required></label>
          <label>Contraseña<input type="password" name="clave" autocomplete="current-password" required></label>
          <button class="acc-btn pri">Ingresar ${ic('arrowR', 2)}</button>
          ${ACCESO_ABIERTO ? '<p class="acc-muted acc-fine">Prototipo con acceso abierto: entra con cualquier correo y una contraseña. La primera vez se crea tu cuenta; después usa la misma contraseña.</p>' : '<div class="acc-links"><button type="button" data-acc="tab" data-v="recuperar">¿Olvidaste tu contraseña?</button><span class="acc-muted">¿Sin cuenta? Pídela a administración</span></div>'}
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
      ${msg && tab !== 'qr' ? `<p class="acc-msg">${esc(msg)}</p>` : ''}
      <p class="acc-foot">Prototipo BACO Studio para Hoteles Estelar · cada ingreso queda registrado (identidad, método, hora y dispositivo).</p>
    </section></div>`;
  if (tab === 'qr') { pintarEstado(); pintarCuenta(); }
}

async function onClick(ev: Event): Promise<void> {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-acc]'); if (!b) return;
  if (b.dataset.acc === 'tab') { tab = b.dataset.v as Tab; msg = ''; if (tab === 'qr') void nuevoQR(); else { detenerQR(); pintar(); } }
  if (b.dataset.acc === 'nuevoQR') void nuevoQR();
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
