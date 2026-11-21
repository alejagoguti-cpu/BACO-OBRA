/* Autenticación real (Supabase Auth) — prototipo.
   - Cuenta: correo + contraseña, registro, recuperación de acceso; sesión persistente del SDK (tokens rotativos).
   - QR: el escritorio crea una sesión QR temporal (120 s) con un secreto que solo él conoce (en la base se guarda su hash).
     Un teléfono YA autenticado la escanea y la aprueba; el escritorio la canjea UNA vez en la Edge Function `qr-claim`
     por un token de un solo uso (magic link sin correo) → verifyOtp. Un QR copiado no sirve sin el secreto ni después de usarse.
   - Cada ingreso queda en access_log (historial), que NO es presencia (ver presence.ts). */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL_SB = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const KEY_SB = (import.meta.env.VITE_SUPABASE_KEY as string) || '';

export const sb: SupabaseClient | null = URL_SB && KEY_SB
  ? createClient(URL_SB, KEY_SB, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'baco-twin-auth', detectSessionInUrl: true } })
  : null;
export const backendListo = () => !!sb;
/** prototipo: cualquier persona entra con cualquier correo y contraseña */
export const ACCESO_ABIERTO = true;

export type RolTwin = 'admin' | 'estelar' | 'bim' | 'contratista' | 'consulta';
export interface Perfil { id: string; email: string; nombre: string; rol: RolTwin; empresa: string; metodo: 'password' | 'qr' }
export const ROL_TXT: Record<RolTwin, string> = { admin: 'Administración', estelar: 'Hoteles Estelar', bim: 'Coordinación BIM', contratista: 'Contratista', consulta: 'Consulta' };
/** roles que pueden asignar responsables y cambiar estados (debe coincidir con las políticas RLS) */
export const puedeEditar = (p: Perfil | null) => !!p && ['admin', 'estelar', 'bim'].includes(p.rol);

export let perfil: Perfil | null = null;
const METODO_KEY = 'baco-twin-metodo';
const dispositivo = () => {
  const ua = navigator.userAgent;
  const so = /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : 'Otro';
  const nav = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Navegador';
  return `${nav} · ${so}`;
};

async function cargarPerfil(): Promise<Perfil | null> {
  // SOLO servidor de desarrollo (vite dev): ?demo permite revisar pantallas sin cuenta. No existe en el build publicado.
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) { perfil = { id: 'dev', email: 'dev@local', nombre: 'Revisión local', rol: 'admin', empresa: '', metodo: 'password' }; return perfil; }
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { perfil = null; return null; }
  const { data } = await sb.from('profiles').select('nombre, rol, empresa').eq('id', session.user.id).maybeSingle();
  let metodo: 'password' | 'qr' = 'password';
  try { metodo = (localStorage.getItem(METODO_KEY) as 'qr') === 'qr' ? 'qr' : 'password'; } catch { /* */ }
  perfil = { id: session.user.id, email: session.user.email ?? '', nombre: data?.nombre || session.user.email || '', rol: (data?.rol as RolTwin) || 'consulta', empresa: data?.empresa || '', metodo };
  return perfil;
}
export const iniciarAuth = cargarPerfil;

async function registrarAcceso(metodo: 'password' | 'qr'): Promise<void> {
  try { localStorage.setItem(METODO_KEY, metodo); } catch { /* */ }
  const p = await cargarPerfil();
  if (p && sb) await sb.from('access_log').insert({ user_id: p.id, metodo, dispositivo: dispositivo() });
}

function errorEs(m: string): string {
  if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/Email not confirmed/i.test(m)) return 'Confirma tu correo: te enviamos un enlace al registrarte.';
  if (/already registered/i.test(m)) return 'Ese correo ya tiene cuenta. Ingresa o recupera el acceso.';
  if (/Password should be/i.test(m)) return 'La contraseña debe tener al menos 6 caracteres.';
  if (/rate limit/i.test(m)) return 'Demasiados intentos. Espera unos minutos.';
  return m;
}

export async function entrarConClave(email: string, clave: string): Promise<string | null> {
  if (!sb) return 'Backend no configurado (VITE_SUPABASE_URL / VITE_SUPABASE_KEY).';
  // PROTOTIPO · acceso abierto: cualquier correo y contraseña. La Edge Function acceso-abierto crea la cuenta
  // (confirmada) la primera vez; el prefijo permite contraseñas de cualquier largo. Para cerrarlo: ACCESO_ABIERTO = false.
  const pw = ACCESO_ABIERTO ? 'baco-abierto:' + clave : clave;
  if (ACCESO_ABIERTO) {
    const { error: ef } = await sb.functions.invoke('acceso-abierto', { body: { email, password: pw } });
    if (ef) { let m = ''; try { m = (await (ef as { context?: Response }).context?.json())?.error ?? ''; } catch { /* */ } return m || 'No se pudo abrir la sesión. Intenta de nuevo.'; }
  }
  const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pw });
  if (error) return /Invalid login/i.test(error.message) && ACCESO_ABIERTO ? 'Ese correo ya entró antes con otra contraseña. Usa la misma de la primera vez.' : errorEs(error.message);
  await registrarAcceso('password');
  return null;
}
const urlApp = () => location.origin + location.pathname;
export async function registrar(email: string, clave: string, nombre: string): Promise<string | null> {
  if (!sb) return 'Backend no configurado.';
  const { data, error } = await sb.auth.signUp({ email, password: clave, options: { data: { nombre }, emailRedirectTo: urlApp() } });
  if (error) return errorEs(error.message);
  if (data.session) { await registrarAcceso('password'); return null; }
  return 'Te enviamos un correo para confirmar la cuenta. Después ingresa con tu contraseña.';
}
export async function recuperar(email: string): Promise<string> {
  if (!sb) return 'Backend no configurado.';
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: urlApp() + '#nueva-clave' });
  return error ? errorEs(error.message) : 'Si el correo tiene cuenta, recibirás un enlace para crear una nueva contraseña.';
}
export async function nuevaClave(clave: string): Promise<string | null> {
  if (!sb) return 'Backend no configurado.';
  const { error } = await sb.auth.updateUser({ password: clave });
  return error ? errorEs(error.message) : null;
}
export async function salir(): Promise<void> { perfil = null; await sb?.auth.signOut(); }
export function alCambiarSesion(cb: (evento: string) => void): void { sb?.auth.onAuthStateChange((ev) => cb(ev)); }

/* ---------------- QR ---------------- */
export type EstadoQR = 'esperando' | 'verificando' | 'autorizado' | 'consumido' | 'expirado' | 'invalido';
export interface SesionQR { id: string; nonce: string; secret: string; expira: number; url: string }
const aleatorio = (n: number) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function qrNuevo(): Promise<SesionQR> {
  if (!sb) throw new Error('Backend no configurado');
  const secret = aleatorio(32);
  const { data, error } = await sb.rpc('qr_crear', { p_secret: secret, p_dispositivo: dispositivo() });
  if (error || !data?.[0]) throw new Error(error?.message || 'No se pudo crear el QR');
  const r = data[0] as { id: string; nonce: string; expires_at: string };
  return { id: r.id, nonce: r.nonce, secret, expira: new Date(r.expires_at).getTime(), url: `${urlApp()}#qr-aprobar/${r.id}/${r.nonce}` };
}
export async function qrEstado(q: SesionQR): Promise<EstadoQR> {
  if (!sb) return 'invalido';
  const { data } = await sb.rpc('qr_estado', { p_id: q.id, p_secret: q.secret });
  return (data as EstadoQR) || 'invalido';
}
/** Canje único en la Edge Function; deja la sesión iniciada en ESTE dispositivo. */
export async function qrCanjear(q: SesionQR): Promise<string | null> {
  if (!sb) return 'Backend no configurado.';
  const { data, error } = await sb.functions.invoke('qr-claim', { body: { id: q.id, secret: q.secret } });
  if (error || !data?.token_hash) return 'El QR ya no es válido. Genera uno nuevo.';
  const v = await sb.auth.verifyOtp({ token_hash: data.token_hash, type: 'magiclink' });
  if (v.error) return errorEs(v.error.message);
  await registrarAcceso('qr');
  return null;
}
/** Desde el teléfono autenticado. */
export async function qrMarcarEscaneado(id: string, nonce: string): Promise<EstadoQR> {
  if (!sb) return 'invalido';
  const { data, error } = await sb.rpc('qr_escaneado', { p_id: id, p_nonce: nonce });
  return error ? 'invalido' : (data as EstadoQR);
}
export async function qrAprobar(id: string, nonce: string): Promise<EstadoQR> {
  if (!sb) return 'invalido';
  const { data, error } = await sb.rpc('qr_aprobar', { p_id: id, p_nonce: nonce });
  return error ? 'invalido' : (data as EstadoQR);
}
