/* Asistente BIM (consulta). Pregunta a la Edge Function `asistente` (modelo de lenguaje con herramientas de solo
   lectura, permisos del usuario). Si el backend no tiene clave del modelo, responde un motor de consulta local
   sobre LOS MISMOS datos (novedades, cronograma, avances validados) y lo dice. Nunca inventa datos. */
import { sb, perfil } from './auth';
import { novedades, abierta, diaBog, hoyBog, fechaHoraBog, TIPO_TXT, ESTADO_TXT, type Nov } from './novedades';
import { actividades, agregar, realActEn, progActEn, registrosAvance } from './avance';
import { esc, ic } from './ui';

export interface Registro { tipo: string; id: string; titulo: string; href: string }
export interface Turno { q: string; respuesta?: string; registros?: Registro[]; modo?: 'modelo' | 'local'; error?: string; cargando?: boolean }
export const chat: Turno[] = [];
const subs = new Set<() => void>();
export function alCambiarChat(cb: () => void): () => void { subs.add(cb); return () => subs.delete(cb); }
const avisar = () => subs.forEach((c) => c());

export const SUGERENCIAS = [
  '¿Qué novedades se registraron hoy en el piso 2?', '¿Qué habitaciones presentan retrasos?', '¿Cuál es el avance de electricidad esta semana?',
  '¿Quién es el responsable de la habitación 216?', '¿Qué imprevistos siguen sin resolverse?', '¿Cuál es la especialidad más atrasada?',
  'Muéstrame las novedades de la habitación 216.', '¿Qué cambió entre ayer y hoy?', '¿Qué actividades están programadas para mañana?', '¿Qué elementos BIM tienen incidencias abiertas?',
];

export async function preguntar(q: string): Promise<void> {
  const t: Turno = { q, cargando: true }; chat.push(t); avisar();
  try {
    if (!sb || !perfil || perfil.id === 'dev') throw new Error('local');
    const historial = chat.slice(-7, -1).flatMap((x) => [{ rol: 'user' as const, texto: x.q }, ...(x.respuesta ? [{ rol: 'assistant' as const, texto: x.respuesta }] : [])]);
    const { data, error } = await sb.functions.invoke('asistente', { body: { pregunta: q, historial } });
    if (error) {
      const ctx = (error as { context?: Response }).context; let cuerpo: { error?: string } = {};
      try { cuerpo = await ctx?.json(); } catch { /* */ }
      if (cuerpo.error === 'sin_clave' || ctx?.status === 503) throw new Error('local');
      throw new Error(cuerpo.error ?? error.message);
    }
    Object.assign(t, { respuesta: data.respuesta, registros: data.registros ?? [], modo: 'modelo', cargando: false });
  } catch (e) {
    if ((e as Error).message === 'local') Object.assign(t, motorLocal(q), { modo: 'local', cargando: false });
    else Object.assign(t, { error: (e as Error).message, cargando: false });
  }
  avisar();
}

/* ---------------- motor local (sin modelo de lenguaje) ---------------- */
const ESP: [RegExp, string, string, string[]][] = [
  [/electric|el[eé]ctric/i, 'ele', 'Electricidad', ['ele']], [/hidro|sanitar|plomer/i, 'hid', 'Hidrosanitaria', ['hid']], [/desag/i, 'des', 'Desagües', []],
  [/arquitect/i, 'arq', 'Arquitectura', ['arq']], [/estructur/i, 'est', 'Estructura', []], [/incendi|rci/i, 'rci', 'Contra incendios', []], [/hvac|aire|ventila/i, 'hvac', 'HVAC', []],
  [/acabad|interior/i, 'aca', 'Interiorismo y acabados', []], [/coordinaci|inspecci/i, 'coo', 'Coordinación e inspección', ['coo']],
];
const regN = (n: Nov): Registro => ({ tipo: 'novedad', id: n.codigo, titulo: `${n.titulo} · ${n.habitacion ? 'Hab. ' + n.habitacion : 'Piso 2'} · ${ESTADO_TXT[n.estado]}`, href: '#novedades/n/' + n.codigo });
const lineaN = (n: Nov) => `${n.codigo} — ${TIPO_TXT[n.tipo]}: ${n.titulo}${n.habitacion ? ` (hab. ${n.habitacion})` : ''}, ${ESTADO_TXT[n.estado].toLowerCase()}, ${fechaHoraBog(n.created_at)}`;
const pct = (v: number) => (v * 100).toFixed(1).replace('.0', '') + ' %';

export function motorLocal(q: string): Pick<Turno, 'respuesta' | 'registros'> {
  const s = q.toLowerCase(); const hoy = hoyBog(); const ayer = diaBog(Date.now() - 864e5); const ns = novedades();
  const hab = /\b(2[12]\d)\b/.exec(s)?.[1];
  const esp = ESP.find(([re]) => re.test(s));
  const sinDatosNov = !perfil || perfil.id === 'dev' ? ' (sin sesión no tengo acceso a las novedades registradas)' : '';
  if (/elemento/.test(s) && /incidenc/.test(s)) {
    const xs = ns.filter((n) => n.element_id && abierta(n));
    return xs.length ? { respuesta: `Hay ${xs.length} novedades abiertas vinculadas a un elemento o categoría BIM:\n` + xs.map(lineaN).join('\n'), registros: xs.map(regN) }
      : { respuesta: 'No encontré novedades abiertas vinculadas a elementos BIM' + sinDatosNov + '. Las incidencias de fichas del gemelo se consultan en la ficha de cada elemento.', registros: [] };
  }
  if (/respons/.test(s)) {
    const acts = actividades().filter((a) => !hab || a.hab === hab); const frentes = [...new Set(acts.map((a) => a.quien))];
    const nv = ns.filter((n) => (!hab || n.habitacion === hab) && n.responsable);
    return { respuesta: `${hab ? `Habitación ${hab}: ` : ''}no hay responsables asignados en la plataforma a elementos BIM${nv.length ? '' : ' ni a novedades'}.${nv.length ? `\nResponsables en novedades: ${[...new Set(nv.map((n) => n.responsable))].join(', ')}.` : ''}\nFrentes del cronograma: ${frentes.join(', ') || 'sin dato'}.`,
      registros: hab ? [{ tipo: 'habitacion', id: 'HAB-' + hab, titulo: 'Habitación ' + hab, href: '#fontana/piso-2/' + hab }, ...nv.map(regN)] : nv.map(regN) };
  }
  if (/cambi/.test(s) && /ayer|hoy/.test(s)) {
    const xs = ns.filter((n) => [hoy, ayer].includes(diaBog(n.created_at)) || [hoy, ayer].includes(diaBog(n.updated_at)));
    const av = registrosAvance().filter((r) => [hoy, ayer].includes(r.fecha));
    const g1 = agregar(actividades(), ayer), g2 = agregar(actividades(), hoy);
    return { respuesta: `Entre ayer (${ayer}) y hoy (${hoy}):\n• Avance real: ${pct(g1.real)} → ${pct(g2.real)}.\n• ${xs.length} novedades registradas o modificadas${sinDatosNov}.\n• ${av.length} registros de avance (${av.filter((r) => r.validado_por).length} validados).` + (xs.length ? '\n' + xs.map(lineaN).join('\n') : ''), registros: xs.map(regN) };
  }
  if (/mañana|manana/.test(s)) {
    const m = diaBog(Date.now() + 864e5); const xs = actividades().filter((a) => a.ini <= m && a.fin >= m && (!hab || a.hab === hab));
    return { respuesta: xs.length ? `Para mañana (${m}) el cronograma tiene ${xs.length} actividades:\n` + xs.slice(0, 20).map((a) => `${a.id} — ${a.hab}: ${a.fase.replace(/^\d+\.\s*/, '')} (${a.quien})`).join('\n') : `El cronograma no tiene actividades programadas para mañana (${m}). La entrega programada del piso era el 2026-11-02.`,
      registros: xs.slice(0, 20).map((a) => ({ tipo: 'actividad', id: a.id, titulo: `${a.hab} · ${a.fase}`, href: '#fontana/piso-2/' + a.hab })) };
  }
  if (/m[aá]s atrasad/.test(s)) {
    const filas = ESP.filter(([, , , o]) => o.length).map(([, id, n, o]) => { const g = agregar(actividades().filter((a) => o.includes(a.esp)), hoy); return { id, n, g, d: g.real - g.prog }; }).sort((a, b) => a.d - b.d);
    const f = filas[0];
    return { respuesta: `La especialidad más atrasada es ${f.n}: real ${pct(f.g.real)} frente a ${pct(f.g.prog)} programado (diferencia ${pct(f.d)}).\nResto: ${filas.slice(1).map((x) => `${x.n} ${pct(x.d)}`).join(', ')}.\nSin datos de cronograma: Estructura, Desagües, Contra incendios, HVAC, Interiorismo.`, registros: [] };
  }
  if (/avance|progreso/.test(s)) {
    const semana = /semana/.test(s); const d0 = semana ? diaBog(Date.now() - 7 * 864e5) : hoy;
    const acts = actividades().filter((a) => (!esp || esp[3].includes(a.esp)) && (!hab || a.hab === hab));
    if (!acts.length) return { respuesta: `No dispongo de datos de cronograma para ${esp?.[2] ?? 'esa consulta'}.`, registros: [] };
    const g = agregar(acts, hoy), g0 = agregar(acts, d0);
    return { respuesta: `${esp ? esp[2] : 'Obra'}${hab ? ` · hab. ${hab}` : ''}: real ${pct(g.real)} vs. ${pct(g.prog)} programado a hoy (${g.hechas}/${g.n} actividades completas).${semana ? `\nEsta semana (desde ${d0}): +${pct(g.real - g0.real)} real validado.` : ''}`, registros: [] };
  }
  if (/retras/.test(s)) {
    const xs = ns.filter((n) => n.tipo === 'retraso' && abierta(n)); const habs = [...new Set(xs.map((n) => n.habitacion).filter(Boolean))] as string[];
    return { respuesta: xs.length ? `Se encontraron ${habs.length} habitaciones con retrasos activos en el piso 2: ${habs.join(', ')}.\n` + xs.map(lineaN).join('\n') : 'No hay retrasos activos registrados en el piso 2' + sinDatosNov + '.',
      registros: [...habs.map((h) => ({ tipo: 'habitacion', id: 'HAB-' + h, titulo: 'Habitación ' + h, href: '#novedades/hab/' + h })), ...xs.map(regN)] };
  }
  if (/imprevist/.test(s)) {
    const xs = ns.filter((n) => n.tipo === 'imprevisto' && (/sin resolver|abiert|siguen/.test(s) ? abierta(n) : true));
    return { respuesta: xs.length ? `${xs.length} imprevistos${/sin resolver|abiert|siguen/.test(s) ? ' sin resolver' : ''}:\n` + xs.map(lineaN).join('\n') : 'No hay imprevistos registrados' + sinDatosNov + '.', registros: xs.map(regN) };
  }
  if (/novedad/.test(s)) {
    let xs = ns; let ctx = 'en el piso 2';
    if (/hoy/.test(s)) { xs = xs.filter((n) => diaBog(n.created_at) === hoy); ctx = 'hoy en el piso 2'; }
    if (hab) { xs = xs.filter((n) => n.habitacion === hab); ctx = `en la habitación ${hab}`; }
    if (esp) xs = xs.filter((n) => n.especialidad === esp[1]);
    return { respuesta: xs.length ? `${xs.length} novedades ${ctx}:\n` + xs.map(lineaN).join('\n') : `No hay novedades registradas ${ctx}${sinDatosNov}.`, registros: [...(hab ? [{ tipo: 'habitacion', id: 'HAB-' + hab, titulo: 'Ver habitación ' + hab + ' en el BIM', href: '#novedades/hab/' + hab }] : []), ...xs.map(regN)] };
  }
  if (/actividad/.test(s)) {
    const xs = actividades().filter((a) => (!hab || a.hab === hab) && (!esp || esp[3].includes(a.esp)) && realActEn(a, hoy) < 1);
    return { respuesta: `${xs.length} actividades pendientes${hab ? ` en la habitación ${hab}` : ''}${esp ? ` de ${esp[2]}` : ''}. Programado a hoy: ${xs.filter((a) => progActEn(a, hoy) >= 1).length} ya deberían estar terminadas.`, registros: xs.slice(0, 15).map((a) => ({ tipo: 'actividad', id: a.id, titulo: `${a.hab} · ${a.fase}`, href: '#fontana/piso-2/' + a.hab })) };
  }
  return { respuesta: 'En modo de consulta local entiendo preguntas sobre novedades, retrasos, imprevistos, avance por especialidad, responsables, cambios entre ayer y hoy, actividades de mañana e incidencias en elementos. Prueba con una de las sugerencias.', registros: [] };
}

/* ---------------- interfaz (página y panel) ---------------- */
function md(t: string): string { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\b(N-\d{4})\b/g, '<a href="#novedades/n/$1">$1</a>').replace(/\bHAB-(\d{3})\b/g, '<a href="#fontana/piso-2/$1">HAB-$1</a>').replace(/\n/g, '<br>'); }
export function vChat(panel: boolean): string {
  return `<div class="as ${panel ? 'panel' : ''}">
    ${panel ? `<div class="as-top"><span><b>Asistente BIM</b><small>Consulta · La Fontana piso 2</small></span><a class="circle light sm" href="#asistente" title="Abrir en página completa">${ic('arrow', 1.8)}</a><button class="circle light sm" data-act="asCerrar" aria-label="Cerrar">${ic('x')}</button></div>` : ''}
    <div class="as-log" id="${panel ? 'asLogP' : 'asLog'}">${chat.length ? chat.map((t) => `
      <div class="as-q">${esc(t.q)}</div>
      <div class="as-a">${t.cargando ? '<span class="as-dots"><i></i><i></i><i></i></span> Consultando registros…' : t.error ? `<p class="as-err">No pude consultar: ${esc(t.error)}</p>` : `
        <p>${md(t.respuesta ?? '')}</p>
        ${t.registros?.length ? `<div class="as-regs"><span>Registros consultados (${t.registros.length})</span>${t.registros.map((r) => `<a href="${esc(r.href)}"><b>${esc(r.id)}</b> ${esc(r.titulo)} ${ic('arrowR', 1.8)}</a>`).join('')}</div>` : ''}
        ${t.registros?.length ? `<a class="btn as-bim" href="${esc(t.registros[0].href)}">${ic('cube', 1.8)} Ver en el modelo BIM</a>` : ''}
        <small class="as-modo">${t.modo === 'modelo' ? 'Respuesta del modelo de lenguaje con herramientas de solo lectura.' : 'Consulta local sin modelo de lenguaje: falta configurar la clave del modelo en el backend.'}</small>`}</div>`).join('')
      : `<div class="as-vacio"><b>Pregunta lo que necesites sobre la obra.</b><p>Responde solo con registros de la plataforma y te dice cuáles usó.</p><div class="as-sug">${SUGERENCIAS.map((x) => `<button data-act="asSug" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`}</div>
    <form class="as-in" id="${panel ? 'fAsP' : 'fAs'}"><input name="q" placeholder="Escribe tu pregunta…" autocomplete="off" required><button class="btn pri" aria-label="Enviar">${ic('send', 2)}</button></form>
  </div>`;
}
