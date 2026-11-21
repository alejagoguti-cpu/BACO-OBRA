// PROTOTIPO · acceso abierto: cualquier correo entra. Si la cuenta no existe se crea ya confirmada.
// El cliente inicia sesión después con signInWithPassword. Para cerrar el acceso: borrar esta función
// y poner ACCESO_ABIERTO = false en src/app/auth.ts.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  let b: { email?: string; password?: string; nombre?: string };
  try { b = await req.json(); } catch { return json({ error: 'cuerpo inválido' }, 400); }
  const email = (b.email ?? '').trim().toLowerCase();
  const password = b.password ?? '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return json({ error: 'Escribe un correo válido.' }, 400);
  if (password.length < 6 || password.length > 200) return json({ error: 'contraseña inválida' }, 400);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nombre: (b.nombre ?? '').trim().slice(0, 80) || email.split('@')[0], acceso: 'abierto' } });
  if (error && !/already|registered|exists/i.test(error.message)) return json({ error: error.message }, 500);
  return json({ ok: true, nueva: !error });
});
