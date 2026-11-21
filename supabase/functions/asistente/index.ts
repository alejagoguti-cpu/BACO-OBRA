// Asistente BIM (solo consulta). Corre en Supabase Edge Functions; la clave de Anthropic vive en el secreto
// ANTHROPIC_API_KEY y nunca llega al navegador. Las consultas usan el JWT de quien pregunta → aplica su RLS.
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const TZ = 'America/Bogota';
const CRONOGRAMA_URL = 'https://alejagoguti-cpu.github.io/BACO-OBRA/data/obra.json';
const diaBog = (d: string | number | Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d));
const fechaHora = (d: string) => new Date(d).toLocaleString('es-CO', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' });

interface Act { id: string; hab: string; fase: string; ini: string; fin: string; dias: number; quien: string; esp: string; real: number; frente: string }
let obraCache: { t: number; acts: Act[]; inicio: string; entrega: string } | null = null;
async function cronograma() {
  if (obraCache && Date.now() - obraCache.t < 600_000) return obraCache;
  const o = await (await fetch(CRONOGRAMA_URL)).json();
  obraCache = { t: Date.now(), acts: o.actividades, inicio: o.inicio, entrega: o.entrega };
  return obraCache;
}
const ESP_OBRA: Record<string, string[]> = { arq: ['arq'], ele: ['ele'], hid: ['hid'], coo: ['coo'], est: [], des: [], rci: [], hvac: [], aca: [], mob: [] };
const T = (d: string) => new Date(d + 'T12:00:00-05:00').getTime();
const progAct = (a: Act, d: string) => { const t = T(d) + 432e5, i = T(a.ini) - 432e5, f = T(a.fin) + 432e5; return t <= i ? 0 : t >= f ? 1 : (t - i) / (f - i); };

const TOOLS: Anthropic.Beta.BetaTool[] = [
  { name: 'consultar_novedades', description: 'Novedades registradas en el piso 2 (incidencias, retrasos, imprevistos, avances, nuevas). Filtra por habitación (p. ej. "216"), especialidad (arq, est, ele, hid, des, rci, hvac, mob, aca), tipo (nueva, retraso, imprevisto, avance, incidencia), estado (pendiente, en_proceso, resuelta, cerrada), solo_abiertas y rango de fechas YYYY-MM-DD (hora de Bogotá).',
    input_schema: { type: 'object', properties: { habitacion: { type: 'string' }, especialidad: { type: 'string' }, tipo: { type: 'string' }, estado: { type: 'string' }, solo_abiertas: { type: 'boolean' }, desde: { type: 'string' }, hasta: { type: 'string' } } } },
  { name: 'consultar_cronograma', description: 'Actividades programadas del cronograma oficial del piso 2 con su avance programado y real a una fecha. Filtra por habitación, especialidad (arq, ele, hid, coo), rango de fechas en que la actividad está programada (desde/hasta) y solo_pendientes.',
    input_schema: { type: 'object', properties: { habitacion: { type: 'string' }, especialidad: { type: 'string' }, desde: { type: 'string' }, hasta: { type: 'string' }, solo_pendientes: { type: 'boolean' }, fecha: { type: 'string' } } } },
  { name: 'avance', description: 'Avance acumulado programado y real (ponderado por días programados; real = matriz + avances VALIDADOS) a una fecha, total y por especialidad. Opcional: habitación, especialidad, fecha (YYYY-MM-DD) y fecha_comparacion para calcular la variación entre dos fechas.',
    input_schema: { type: 'object', properties: { fecha: { type: 'string' }, fecha_comparacion: { type: 'string' }, habitacion: { type: 'string' }, especialidad: { type: 'string' } } } },
  { name: 'responsables', description: 'Responsables registrados: asignaciones por elemento BIM, responsables de novedades y frentes/cuadrillas del cronograma. Filtra por habitación.',
    input_schema: { type: 'object', properties: { habitacion: { type: 'string' } } } },
  { name: 'cambios', description: 'Cambios registrados entre dos fechas (YYYY-MM-DD, Bogotá): historial de novedades (creaciones, cambios de estado/responsable, comentarios) y avances registrados o validados.',
    input_schema: { type: 'object', properties: { desde: { type: 'string' }, hasta: { type: 'string' } }, required: ['desde', 'hasta'] } },
  { name: 'elementos_con_incidencias', description: 'Elementos BIM con incidencias abiertas (fichas de elemento del gemelo y novedades abiertas vinculadas a un elemento o categoría).',
    input_schema: { type: 'object', properties: {} } },
];

type Reg = { tipo: 'novedad' | 'actividad' | 'habitacion' | 'elemento'; id: string; titulo: string; href: string };
async function ejecutar(sb: SupabaseClient, nombre: string, inp: Record<string, unknown>, regs: Map<string, Reg>): Promise<unknown> {
  const s = (k: string) => (typeof inp[k] === 'string' && inp[k] ? String(inp[k]) : undefined);
  const hoy = diaBog(Date.now());
  if (nombre === 'consultar_novedades') {
    let q = sb.from('novedades').select('*').order('created_at', { ascending: false }).limit(200);
    if (s('habitacion')) q = q.eq('habitacion', s('habitacion')!);
    if (s('especialidad')) q = q.eq('especialidad', s('especialidad')!);
    if (s('tipo')) q = q.eq('tipo', s('tipo')!);
    if (s('estado')) q = q.eq('estado', s('estado')!);
    if (inp.solo_abiertas === true) q = q.in('estado', ['pendiente', 'en_proceso']);
    const { data, error } = await q; if (error) return { error: error.message };
    const rows = (data ?? []).filter((n) => (!s('desde') || diaBog(n.created_at) >= s('desde')!) && (!s('hasta') || diaBog(n.created_at) <= s('hasta')!));
    rows.forEach((n) => regs.set(n.codigo, { tipo: 'novedad', id: n.codigo, titulo: n.titulo, href: '#novedades/n/' + n.codigo }));
    return { total: rows.length, novedades: rows.map((n) => ({ codigo: n.codigo, titulo: n.titulo, descripcion: n.descripcion, tipo: n.tipo, estado: n.estado, prioridad: n.prioridad, habitacion: n.habitacion, especialidad: n.especialidad, responsable: n.responsable ?? 'sin asignar', elemento: n.element_id, registrada: fechaHora(n.created_at), solucion_prevista: n.fecha_prevista })) };
  }
  const { acts } = await cronograma();
  const { data: av } = await sb.from('avance_registros').select('*').not('validado_por', 'is', null);
  const realAct = (a: Act, d: string) => { let v = a.real >= 1 && d >= a.fin ? 1 : 0; for (const r of av ?? []) if (r.actividad_id === a.id && r.fecha <= d) v = Math.min(1, r.pct_acumulado / 100); return v; };
  const filtrar = () => acts.filter((a) => (!s('habitacion') || a.hab === s('habitacion')) && (!s('especialidad') || (ESP_OBRA[s('especialidad')!] ?? [s('especialidad')]).includes(a.esp)));
  const agg = (xs: Act[], d: string) => { let w = 0, p = 0, r = 0; for (const a of xs) { const k = Math.max(1, a.dias); w += k; p += progAct(a, d) * k; r += realAct(a, d) * k; } return w ? { programado_pct: +(p / w * 100).toFixed(1), real_pct: +(r / w * 100).toFixed(1), actividades: xs.length } : null; };
  if (nombre === 'consultar_cronograma') {
    const d = s('fecha') ?? hoy;
    let xs = filtrar().filter((a) => (!s('desde') || a.fin >= s('desde')!) && (!s('hasta') || a.ini <= s('hasta')!));
    if (inp.solo_pendientes === true) xs = xs.filter((a) => realAct(a, d) < 1);
    xs.slice(0, 80).forEach((a) => regs.set(a.id, { tipo: 'actividad', id: a.id, titulo: `${a.hab} · ${a.fase}`, href: '#fontana/piso-2/' + a.hab }));
    return { fecha: d, total: xs.length, actividades: xs.slice(0, 80).map((a) => ({ id: a.id, habitacion: a.hab, frente: a.frente, fase: a.fase, especialidad: a.esp, inicio: a.ini, fin: a.fin, responsable_cronograma: a.quien, programado_pct: Math.round(progAct(a, d) * 100), real_pct: Math.round(realAct(a, d) * 100) })) };
  }
  if (nombre === 'avance') {
    const d = s('fecha') ?? hoy; const xs = filtrar();
    const porEsp = Object.fromEntries(['arq', 'ele', 'hid', 'coo', 'est', 'des', 'rci', 'hvac', 'aca'].map((e) => [e, agg(acts.filter((a) => (ESP_OBRA[e] ?? []).includes(a.esp) && (!s('habitacion') || a.hab === s('habitacion'))), d) ?? 'sin datos']));
    const comp = s('fecha_comparacion') ? agg(xs, s('fecha_comparacion')!) : null;
    return { fecha: d, total: agg(xs, d), comparacion: comp ? { fecha: s('fecha_comparacion'), ...comp } : undefined, por_especialidad: porEsp, nota: 'Ponderación por días programados. Real = matriz de programación + avances validados. Las novedades no suman avance.' };
  }
  if (nombre === 'responsables') {
    const h = s('habitacion');
    let q = sb.from('elementos').select('element_id, nombre, especialidad, responsable, empresa, estado_revision').not('responsable', 'is', null);
    if (h) q = q.or(`element_id.like.HAB-${h}%,element_id.like.SKP${h}:%`);
    const { data: el } = await q;
    let qn = sb.from('novedades').select('codigo, titulo, habitacion, responsable').not('responsable', 'is', null);
    if (h) qn = qn.eq('habitacion', h);
    const { data: nv } = await qn;
    const crono = [...new Set(acts.filter((a) => !h || a.hab === h).map((a) => a.quien))];
    if (h) regs.set('HAB-' + h, { tipo: 'habitacion', id: 'HAB-' + h, titulo: 'Habitación ' + h, href: '#fontana/piso-2/' + h });
    return { asignaciones_por_elemento: el ?? [], responsables_en_novedades: nv ?? [], frentes_del_cronograma: crono, nota: (el ?? []).length ? undefined : 'No hay responsables asignados a elementos BIM en la plataforma.' };
  }
  if (nombre === 'cambios') {
    const desde = s('desde')!, hasta = s('hasta')!;
    const ini = new Date(desde + 'T00:00:00-05:00').toISOString(), fin = new Date(hasta + 'T23:59:59-05:00').toISOString();
    const { data: h } = await sb.from('novedad_historial').select('tipo, cambios, comentario, ts, novedad_id').gte('ts', ini).lte('ts', fin).order('ts');
    const ids = [...new Set((h ?? []).map((x) => x.novedad_id))];
    const { data: ns } = ids.length ? await sb.from('novedades').select('id, codigo, titulo, habitacion').in('id', ids) : { data: [] };
    const nm = new Map((ns ?? []).map((n) => [n.id, n]));
    (ns ?? []).forEach((n) => regs.set(n.codigo, { tipo: 'novedad', id: n.codigo, titulo: n.titulo, href: '#novedades/n/' + n.codigo }));
    const { data: ar } = await sb.from('avance_registros').select('actividad_id, fecha, pct_acumulado, validado_at, created_at').gte('created_at', ini).lte('created_at', fin);
    return { novedades: (h ?? []).map((x) => ({ cuando: fechaHora(x.ts), tipo: x.tipo, novedad: nm.get(x.novedad_id)?.codigo, titulo: nm.get(x.novedad_id)?.titulo, habitacion: nm.get(x.novedad_id)?.habitacion, cambios: x.cambios && x.tipo === 'cambio' ? x.cambios : undefined, comentario: x.comentario })), avances_registrados: ar ?? [] };
  }
  if (nombre === 'elementos_con_incidencias') {
    const { data: ev } = await sb.from('elemento_eventos').select('element_id, detalle, ts').eq('tipo', 'incidencia').eq('abierta', true);
    const { data: nv } = await sb.from('novedades').select('codigo, titulo, element_id, habitacion, estado').not('element_id', 'is', null).in('estado', ['pendiente', 'en_proceso']);
    (ev ?? []).forEach((e) => { const hab = /^SKP(\d{3}):/.exec(e.element_id)?.[1]; regs.set(e.element_id, { tipo: 'elemento', id: e.element_id, titulo: e.detalle, href: hab ? `#fontana/${hab}/gemelo/${encodeURIComponent(e.element_id)}` : '#novedades' }); });
    (nv ?? []).forEach((n) => regs.set(n.codigo, { tipo: 'novedad', id: n.codigo, titulo: n.titulo, href: '#novedades/n/' + n.codigo }));
    return { incidencias_en_fichas: ev ?? [], novedades_con_elemento: nv ?? [] };
  }
  return { error: 'herramienta desconocida' };
}

const SYSTEM = `Eres el asistente de consulta de la remodelación del Hotel Estelar La Fontana (Bogotá), Torre Suites, piso 2 (habitaciones 214 a 225).
Responde en español, claro y breve, para gerencia y equipo de obra.
Reglas:
- Usa SOLO lo que devuelven las herramientas. Nunca inventes responsables, porcentajes, novedades, fechas ni cantidades.
- Si un dato no existe en los registros, dilo: "No dispongo de ese dato en la plataforma".
- Cita los registros que usas por su código (p. ej. N-0003, F1-216-04, HAB-216).
- Eres de solo consulta: no modificas datos. Si piden cambiar algo, indica en qué módulo hacerlo.
- Fechas y horas en America/Bogota. Especialidades: arq Arquitectura, est Estructura, ele Electricidad, hid Hidrosanitaria, des Desagües, rci Contra incendios, hvac HVAC, mob Mobiliario, aca Acabados, coo Coordinación.
- El avance solo cambia con actividades y avances validados; una novedad no suma avance.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const auth = req.headers.get('Authorization') ?? '';
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: { user } } = await sb.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
  if (!user) return json({ error: 'requiere sesión' }, 401);
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) return json({ error: 'sin_clave' }, 503);
  let body: { pregunta?: string; historial?: { rol: 'user' | 'assistant'; texto: string }[] };
  try { body = await req.json(); } catch { return json({ error: 'cuerpo inválido' }, 400); }
  const pregunta = (body.pregunta ?? '').trim().slice(0, 2000);
  if (!pregunta) return json({ error: 'pregunta vacía' }, 400);

  const client = new Anthropic({ apiKey: key });
  const hoy = diaBog(Date.now());
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...(body.historial ?? []).slice(-6).map((m) => ({ role: m.rol, content: m.texto.slice(0, 4000) })),
    { role: 'user', content: `Hoy es ${hoy} (Bogotá).\n\n${pregunta}` },
  ];
  const regs = new Map<string, Reg>();
  try {
    for (let i = 0; i < 6; i++) {
      const r = await client.beta.messages.create({
        model: 'claude-opus-5-5', max_tokens: 16000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
        output_config: { effort: 'medium' }, system: SYSTEM, tools: TOOLS, messages,
      });
      if (r.stop_reason === 'refusal') return json({ respuesta: 'No puedo responder esa consulta.', registros: [] });
      if (r.stop_reason !== 'tool_use') {
        const texto = r.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map((b) => b.text).join('\n').trim();
        const citados = [...regs.values()].filter((g) => texto.includes(g.id));
        return json({ respuesta: texto || 'No dispongo de ese dato en la plataforma.', registros: (citados.length ? citados : [...regs.values()]).slice(0, 25), modelo: r.model });
      }
      messages.push({ role: 'assistant', content: r.content });
      const usos = r.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
      const resultados = await Promise.all(usos.map(async (u) => {
        try { return { type: 'tool_result' as const, tool_use_id: u.id, content: JSON.stringify(await ejecutar(sb, u.name, (u.input ?? {}) as Record<string, unknown>, regs)) }; }
        catch (e) { return { type: 'tool_result' as const, tool_use_id: u.id, is_error: true, content: String((e as Error).message) }; }
      }));
      messages.push({ role: 'user', content: resultados });
    }
    return json({ respuesta: 'La consulta requirió demasiados pasos. Intenta con una pregunta más concreta.', registros: [...regs.values()].slice(0, 25) });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'límite de uso del modelo, intenta en un momento' }, 429);
    if (e instanceof Anthropic.AuthenticationError) return json({ error: 'sin_clave' }, 503);
    if (e instanceof Anthropic.APIError) return json({ error: `modelo no disponible (${e.status})` }, 502);
    return json({ error: 'error interno' }, 500);
  }
});
