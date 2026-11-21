/* RESUMEN — centro de control del piso 2. Todo sale de la misma fuente: cronograma (obra.json),
   avances validados (avance_registros) y novedades (Supabase). Cada indicador y gráfica lleva al BIM. */
import { OBRA, type Act } from './obra';
import { agregar, dias, actividades, realActEn, progActEn, registrosAvance, registrarAvance, validarAvance, pendientesValidar } from './avance';
import { novedades, abierta, diaBog, hoyBog, fechaHoraBog, TIPO_TXT, TIPO_COL, ESTADO_TXT, type Nov, type TipoNov } from './novedades';
import { perfil, puedeEditar } from './auth';
import { esc, ic, toast } from './ui';

export const F = { desde: '', hasta: '', zoom: 'todo' as 'todo' | '30' | '7', hab: '', esp: '', resp: '' };
const ESP_ROWS: { id: string; n: string; obra: string[]; nota?: string }[] = [
  { id: 'arq', n: 'Arquitectura', obra: ['arq'] }, { id: 'est', n: 'Estructura', obra: [] }, { id: 'ele', n: 'Electricidad', obra: ['ele'] },
  { id: 'hid', n: 'Hidrosanitaria', obra: ['hid'] }, { id: 'des', n: 'Desagües', obra: [], nota: 'el cronograma la incluye en Hidrosanitaria' },
  { id: 'rci', n: 'Contra incendios', obra: [] }, { id: 'hvac', n: 'HVAC', obra: [] }, { id: 'aca', n: 'Interiorismo y acabados', obra: [] },
  { id: 'coo', n: 'Coordinación e inspección', obra: ['coo'] },
];
const C_PROG = '#2F5DA8', C_REAL = '#B98A2E';
const pct = (v: number) => (v * 100).toFixed(1).replace('.0', '') + '%';
const fmtD = (d: string) => new Date(d + 'T12:00:00-05:00').toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short' });

function actsF(): Act[] {
  return actividades().filter((a) => (!F.hab || a.hab === F.hab) && (!F.esp || ESP_ROWS.find((r) => r.id === F.esp)?.obra.includes(a.esp)) && (!F.resp || a.quien === F.resp));
}
function novsF(): Nov[] {
  return novedades().filter((n) => (!F.hab || n.habitacion === F.hab) && (!F.esp || n.especialidad === F.esp) && (!F.resp || n.responsable === F.resp));
}
function rango(): string[] {
  if (!OBRA) return [];
  const hasta = F.hasta || hoyBog(); let desde = F.desde || OBRA.inicio;
  if (F.zoom !== 'todo') { const k = +F.zoom; desde = diaBog(new Date(hasta + 'T12:00:00-05:00').getTime() - (k - 1) * 864e5); }
  return dias(desde, hasta);
}
interface Dia { d: string; prog: number; real: number; ejec: number; nuevas: number; retrasos: number; imprev: number; abiertasDia: { nueva: number; retraso: number; imprevisto: number }; reg: { nueva: number; retraso: number; imprevisto: number }; terminadas: number }
let serie: Dia[] = [];
function calcular(): void {
  const acts = actsF(); const ns = novsF(); const ds = rango();
  let prev = ds.length ? agregar(acts, diaBog(new Date(ds[0] + 'T12:00:00-05:00').getTime() - 864e5)) : null;
  serie = ds.map((d) => {
    const g = agregar(acts, d);
    const delDia = ns.filter((n) => diaBog(n.created_at) === d);
    const cerradoEn = (n: Nov) => (abierta(n) ? null : diaBog(n.updated_at));
    const vivas = (t: TipoNov) => ns.filter((n) => n.tipo === t && diaBog(n.created_at) <= d && (!cerradoEn(n) || cerradoEn(n)! > d)).length;
    const reg = { nueva: delDia.filter((n) => n.tipo === 'nueva').length, retraso: delDia.filter((n) => n.tipo === 'retraso').length, imprevisto: delDia.filter((n) => n.tipo === 'imprevisto').length };
    const abiertasDia = { nueva: delDia.filter((n) => n.tipo === 'nueva' && abierta(n)).length, retraso: delDia.filter((n) => n.tipo === 'retraso' && abierta(n)).length, imprevisto: delDia.filter((n) => n.tipo === 'imprevisto' && abierta(n)).length };
    const x: Dia = { d, prog: g.prog, real: g.real, ejec: prev ? g.real - prev.real : 0, nuevas: delDia.length, retrasos: vivas('retraso'), imprev: reg.imprevisto, abiertasDia, reg, terminadas: prev ? g.hechas - prev.hechas : g.hechas };
    prev = g; return x;
  });
}

/* ---------------- página ---------------- */
export function vResumen(): string {
  if (!OBRA) return '<p class="muted">Cargando cronograma…</p>';
  calcular();
  const acts = actsF(); const ns = novsF(); const hoy = hoyBog();
  const gHoy = agregar(acts, hoy); const gAyer = agregar(acts, diaBog(Date.now() - 864e5));
  const hechas = acts.filter((a) => realActEn(a, hoy) >= 1).length;
  const nuevasHoy = ns.filter((n) => diaBog(n.created_at) === hoy).length;
  const retrasos = ns.filter((n) => n.tipo === 'retraso' && abierta(n)).length;
  const imprev = ns.filter((n) => n.tipo === 'imprevisto'); const imprevAb = imprev.filter(abierta).length;
  const delDia = gHoy.real - gAyer.real;
  const habs = [...new Set(actividades().map((a) => a.hab))].sort();
  const resps = [...new Set(actividades().map((a) => a.quien).filter(Boolean))].sort();
  const kpi = (k: string, label: string, val: string, sub: string, extra = '') => `<button class="rs-kpi ${extra}" data-act="rsKpi" data-v="${k}"><small>${label}</small><b>${val}</b><span>${sub}</span></button>`;
  const pend = pendientesValidar().length;
  return `
  <header class="rs-head"><div><p class="eyebrow">CENTRO DE CONTROL · PISO 2</p><h1>Resumen de <b>la remodelación.</b></h1>
    <p class="sub">Cronograma ${esc(OBRA.inicio)} → ${esc(OBRA.entrega)} · ${OBRA.actividades.length} actividades ponderadas por días programados · avance real solo con registros validados.</p></div>
    <a class="btn" href="#novedades">${ic('pin')} Abrir novedades en el BIM</a></header>
  <div class="rs-filtros" role="group" aria-label="Filtros globales">
    <label>Hotel<select disabled><option>Estelar La Fontana</option></select></label>
    <label>Edificio<select disabled><option>Torre Suites</option></select></label>
    <label>Piso<select disabled><option>Piso 2</option></select></label>
    <label>Habitación<select data-rsf="hab"><option value="">Todas</option>${habs.map((h) => `<option ${F.hab === h ? 'selected' : ''}>${h}</option>`).join('')}</select></label>
    <label>Especialidad<select data-rsf="esp"><option value="">Todas</option>${ESP_ROWS.map((r) => `<option value="${r.id}" ${F.esp === r.id ? 'selected' : ''}>${r.n}</option>`).join('')}</select></label>
    <label>Responsable<select data-rsf="resp"><option value="">Todos</option>${resps.map((r) => `<option ${F.resp === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></label>
    <label>Desde<input type="date" data-rsf="desde" value="${F.desde || OBRA.inicio}"></label>
    <label>Hasta<input type="date" data-rsf="hasta" value="${F.hasta || hoy}" max="${hoy}"></label>
  </div>
  <section class="rs-kpis">
    ${kpi('avance', 'Avance general', pct(gHoy.real), `programado ${pct(gHoy.prog)} · diferencia ${pct(gHoy.real - gHoy.prog)}`, 'big')}
    ${kpi('dia', 'Avance del día', delDia > 0 ? '+' + pct(delDia) : '—', delDia > 0 ? 'validado hoy' : 'sin avance validado hoy')}
    ${kpi('nuevas', 'Novedades hoy', String(nuevasHoy), `${ns.length} en total`)}
    ${kpi('retrasos', 'Retrasos activos', String(retrasos), 'pendientes o en proceso', retrasos ? 'warn' : '')}
    ${kpi('imprevistos', 'Imprevistos', String(imprev.length), `${imprevAb} sin resolver`, imprevAb ? 'crit' : '')}
    ${kpi('hechas', 'Actividades completadas', `${hechas}`, `de ${acts.length}`)}
    ${kpi('pendientes', 'Actividades pendientes', `${acts.length - hechas}`, pend ? `${pend} avances por validar` : 'según registros validados')}
  </section>
  <section class="rs-card"><div class="rs-ch"><div><h2>Avance diario acumulado</h2><p class="muted">Programado vs. real · la banda es la diferencia</p></div>
    <div class="rs-legend"><span><i style="background:${C_PROG}"></i>Programado</span><span><i style="background:${C_REAL}"></i>Real validado</span>
    <div class="seg">${(['todo', '30', '7'] as const).map((z) => `<button data-act="rsZoom" data-v="${z}" aria-pressed="${F.zoom === z}">${z === 'todo' ? 'Todo' : z + ' días'}</button>`).join('')}</div></div></div>
    <div class="rs-chart" id="rsLinea" style="height:300px"></div></section>
  <div class="rs-grid">
    <section class="rs-card"><div class="rs-ch"><div><h2>Novedades, retrasos e imprevistos</h2><p class="muted">Por día de registro · lo oscuro sigue abierto · clic para verlas en el BIM</p></div>
      <div class="rs-legend">${(['nueva', 'retraso', 'imprevisto'] as TipoNov[]).map((t) => `<span><i style="background:${TIPO_COL[t]}"></i>${TIPO_TXT[t]}</span>`).join('')}</div></div>
      <div class="rs-chart" id="rsBarras" style="height:240px"></div></section>
    <section class="rs-card"><div class="rs-ch"><div><h2>Avance por especialidad</h2><p class="muted">Clic para abrir el piso 2 con la disciplina aislada</p></div>
      <div class="rs-legend"><span><i style="background:${C_PROG}"></i>Programado</span><span><i style="background:${C_REAL}"></i>Real</span></div></div>
      ${vEsp()}</section>
  </div>
  ${perfil ? vRegistro(acts) : ''}`;
}

function vEsp(): string {
  const hoy = F.hasta || hoyBog(); const ns = novsF();
  return `<div class="rs-esp">${ESP_ROWS.map((r) => {
    const acts = actividades().filter((a) => r.obra.includes(a.esp) && (!F.hab || a.hab === F.hab) && (!F.resp || a.quien === F.resp));
    const ret = ns.filter((n) => n.especialidad === r.id && n.tipo === 'retraso' && abierta(n)).length;
    if (!acts.length) return `<button class="rs-erow nd" data-act="rsEsp" data-v="${r.id}"><b>${r.n}</b><span class="rs-nd">Sin datos${r.nota ? ` · ${esc(r.nota)}` : ''}</span><small>${ret ? ret + ' retrasos abiertos' : ''}</small></button>`;
    const g = agregar(acts, hoy); const pend = acts.filter((a) => realActEn(a, hoy) < 1).length;
    const quien = [...new Set(acts.map((a) => a.quien))];
    return `<button class="rs-erow" data-act="rsEsp" data-v="${r.id}" title="${esc(r.n)}: programado ${pct(g.prog)}, real ${pct(g.real)}">
      <b>${r.n}</b>
      <span class="rs-bars"><i style="width:${g.prog * 100}%;background:${C_PROG}"></i><i style="width:${g.real * 100}%;background:${C_REAL}"></i></span>
      <span class="rs-num">${pct(g.real)} <em>/ ${pct(g.prog)}</em> <strong class="${g.real - g.prog < -0.005 ? 'neg' : ''}">${g.real - g.prog >= 0 ? '+' : ''}${pct(g.real - g.prog)}</strong></span>
      <small>${pend} pendientes · ${ret} retrasos · ${esc(quien.slice(0, 2).join(', '))}${quien.length > 2 ? '…' : ''}</small></button>`;
  }).join('')}</div>`;
}

function vRegistro(acts: Act[]): string {
  const hoy = hoyBog(); const ed = puedeEditar(perfil); const pend = pendientesValidar();
  const candidatas = acts.filter((a) => realActEn(a, hoy) < 1 && a.ini <= hoy);
  return `<section class="rs-card"><div class="rs-ch"><div><h2>Registrar y validar avance</h2><p class="muted">El avance solo cambia con una actividad y su porcentaje ejecutado, validado por gestión. Una novedad no suma avance.</p></div></div>
    <form class="rs-reg" id="fRsAvance"><select name="act" required><option value="">Actividad…</option>${candidatas.map((a) => `<option value="${esc(a.id)}">${esc(a.hab)} · ${esc(a.fase.replace(/^\d+\.\s*/, ''))}</option>`).join('')}</select>
      <input name="pct" type="number" min="1" max="100" step="1" placeholder="% ejecutado acumulado" required><input name="nota" placeholder="Nota (opcional)"><button class="btn teal">Registrar</button></form>
    ${pend.length ? `<div class="rs-pend"><span class="label">Por validar (${pend.length})</span>${pend.map((r) => { const a = actividades().find((x) => x.id === r.actividad_id); return `<div class="rs-prow"><span><b>${esc(a?.hab ?? '')} · ${esc(a?.fase.replace(/^\d+\.\s*/, '') ?? r.actividad_id)}</b><small>${r.pct_acumulado}% · ${esc(r.fecha)}${r.nota ? ' · ' + esc(r.nota) : ''}</small></span>${ed ? `<button class="btn" data-act="rsValidar" data-v="${r.id}">${ic('check', 2)} Validar</button>` : '<small class="muted">espera validación</small>'}</div>`; }).join('')}</div>` : ''}
  </section>`;
}

/* ---------------- gráficas (SVG + tooltip) ---------------- */
let ro: ResizeObserver | null = null;
export function montarResumen(): void {
  const linea = document.getElementById('rsLinea'); const barras = document.getElementById('rsBarras');
  if (!linea || !barras) return;
  ro?.disconnect(); ro = new ResizeObserver(() => { dibujarLinea(linea); dibujarBarras(barras); }); ro.observe(linea); ro.observe(barras);
}
const tip = () => { let t = document.getElementById('rsTip'); if (!t) { t = document.createElement('div'); t.id = 'rsTip'; t.className = 'rs-tip'; document.getElementById('app')!.append(t); } return t; };
function mostrarTip(html: string, x: number, y: number): void { const t = tip(); t.innerHTML = html; t.hidden = false; const w = t.offsetWidth; t.style.left = Math.min(innerWidth - w - 12, x + 14) + 'px'; t.style.top = Math.max(8, y - t.offsetHeight - 10) + 'px'; }
const ocultarTip = () => { const t = document.getElementById('rsTip'); if (t) t.hidden = true; };

function dibujarLinea(el: HTMLElement): void {
  const W = el.clientWidth, H = el.clientHeight; if (!W || !serie.length) { el.innerHTML = '<p class="muted">Sin datos en el rango.</p>'; return; }
  const m = { l: 44, r: 16, t: 12, b: 28 }; const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const x = (i: number) => m.l + (serie.length === 1 ? iw / 2 : (i / (serie.length - 1)) * iw); const y = (v: number) => m.t + ih * (1 - v);
  const path = (k: 'prog' | 'real') => serie.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(s[k]).toFixed(1)}`).join('');
  const band = serie.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(s.prog).toFixed(1)}`).join('') + serie.slice().reverse().map((s, j) => `L${x(serie.length - 1 - j).toFixed(1)},${y(s.real).toFixed(1)}`).join('') + 'Z';
  const ticksY = [0, 0.25, 0.5, 0.75, 1]; const paso = Math.max(1, Math.ceil(serie.length / Math.max(2, Math.floor(iw / 80))));
  el.innerHTML = `<svg width="${W}" height="${H}" role="img" aria-label="Avance acumulado programado y real por día">
    ${ticksY.map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" class="rs-grid"/><text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end" class="rs-ax">${v * 100}%</text>`).join('')}
    ${serie.map((s, i) => (i % paso === 0 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="rs-ax">${fmtD(s.d)}</text>` : '')).join('')}
    <path d="${band}" fill="${C_PROG}" opacity=".08"/>
    <path d="${path('prog')}" fill="none" stroke="${C_PROG}" stroke-width="2" class="rs-draw"/>
    <path d="${path('real')}" fill="none" stroke="${C_REAL}" stroke-width="2.5" class="rs-draw"/>
    <g id="rsCross" visibility="hidden"><line y1="${m.t}" y2="${m.t + ih}" class="rs-cross"/><circle r="4.5" fill="${C_PROG}" stroke="#fff" stroke-width="2"/><circle r="4.5" fill="${C_REAL}" stroke="#fff" stroke-width="2"/></g>
    <rect x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent" id="rsHit"/></svg>`;
  const hit = el.querySelector('#rsHit')!; const cross = el.querySelector<SVGGElement>('#rsCross')!;
  hit.addEventListener('mousemove', (ev) => {
    const e = ev as MouseEvent; const r = el.getBoundingClientRect(); const px = e.clientX - r.left;
    const i = Math.max(0, Math.min(serie.length - 1, Math.round(((px - m.l) / iw) * (serie.length - 1)))); const s = serie[i];
    cross.setAttribute('visibility', 'visible');
    const [ln, c1, c2] = cross.children; ln.setAttribute('x1', String(x(i))); ln.setAttribute('x2', String(x(i)));
    c1.setAttribute('cx', String(x(i))); c1.setAttribute('cy', String(y(s.prog))); c2.setAttribute('cx', String(x(i))); c2.setAttribute('cy', String(y(s.real)));
    mostrarTip(`<b>${fmtD(s.d)} ${s.d.slice(0, 4)}</b>
      <div><i style="background:${C_PROG}"></i>Programado <span>${pct(s.prog)}</span></div><div><i style="background:${C_REAL}"></i>Real <span>${pct(s.real)}</span></div>
      <div>Diferencia <span>${pct(s.real - s.prog)}</span></div><div>Ejecutado ese día <span>${s.ejec > 0 ? '+' + pct(s.ejec) : '—'}</span></div>
      <div>Novedades nuevas <span>${s.nuevas}</span></div><div>Retrasos activos <span>${s.retrasos}</span></div><div>Imprevistos del día <span>${s.imprev}</span></div><div>Actividades terminadas <span>${s.terminadas}</span></div>`, e.clientX, e.clientY);
  });
  hit.addEventListener('mouseleave', () => { cross.setAttribute('visibility', 'hidden'); ocultarTip(); });
}

function dibujarBarras(el: HTMLElement): void {
  const W = el.clientWidth, H = el.clientHeight; if (!W) return;
  const s = serie; const maxV = Math.max(1, ...s.map((d) => Math.max(d.reg.nueva, d.reg.retraso, d.reg.imprevisto)));
  if (!novsF().length) { el.innerHTML = '<p class="muted rs-empty">Sin novedades registradas todavía. Se llenará con cada registro del módulo Novedades.</p>'; return; }
  const m = { l: 32, r: 10, t: 10, b: 26 }; const iw = W - m.l - m.r, ih = H - m.t - m.b; const gw = iw / s.length; const bw = Math.max(2, Math.min(14, (gw - 4) / 3 - 2));
  const y = (v: number) => m.t + ih * (1 - v / maxV); const tipos = ['nueva', 'retraso', 'imprevisto'] as const;
  const paso = Math.max(1, Math.ceil(s.length / Math.max(2, Math.floor(iw / 80))));
  el.innerHTML = `<svg width="${W}" height="${H}" role="img" aria-label="Novedades, retrasos e imprevistos por día">
    ${[0, Math.ceil(maxV / 2), maxV].map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" class="rs-grid"/><text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end" class="rs-ax">${v}</text>`).join('')}
    ${s.map((d, i) => (i % paso === 0 ? `<text x="${m.l + gw * (i + 0.5)}" y="${H - 8}" text-anchor="middle" class="rs-ax">${fmtD(d.d)}</text>` : '')).join('')}
    ${s.map((d, i) => tipos.map((t, k) => { const v = d.reg[t]; if (!v) return ''; const bx = m.l + gw * i + (gw - (bw + 2) * 3) / 2 + k * (bw + 2); const ab = d.abiertasDia[t];
      return `<g class="rs-bar" data-d="${d.d}" data-t="${t}"><rect x="${bx}" y="${y(v)}" width="${bw}" height="${y(0) - y(v)}" rx="2" fill="${TIPO_COL[t]}" opacity=".45"/>${ab ? `<rect x="${bx}" y="${y(ab)}" width="${bw}" height="${y(0) - y(ab)}" rx="2" fill="${TIPO_COL[t]}"/>` : ''}<rect x="${bx - 3}" y="${m.t}" width="${bw + 6}" height="${ih}" fill="transparent"/></g>`; }).join('')).join('')}
  </svg>`;
  el.querySelectorAll<SVGGElement>('.rs-bar').forEach((g) => {
    const d = s.find((q) => q.d === g.dataset.d)!; const t = g.dataset.t as 'nueva' | 'retraso' | 'imprevisto';
    g.addEventListener('mousemove', (ev) => mostrarTip(`<b>${fmtD(d.d)} ${d.d.slice(0, 4)}</b><div><i style="background:${TIPO_COL[t]}"></i>${TIPO_TXT[t]} registrados <span>${d.reg[t]}</span></div><div>Siguen abiertos <span>${d.abiertasDia[t]}</span></div><small>Clic: ver en el BIM</small>`, (ev as MouseEvent).clientX, (ev as MouseEvent).clientY));
    g.addEventListener('mouseleave', ocultarTip);
    g.addEventListener('click', () => { ocultarTip(); dispatchEvent(new CustomEvent('rs:novedades', { detail: { fecha: d.d, tipo: t } })); });
  });
}

/* ---------------- detalle de indicadores ---------------- */
export function detalleKpi(k: string): string {
  const hoy = hoyBog(); const ns = novsF(); const acts = actsF();
  const filaN = (n: Nov) => `<a class="rs-li" href="#novedades/n/${esc(n.codigo)}"><i style="background:${TIPO_COL[n.tipo]}"></i><span><b>${esc(n.titulo)}</b><small>${esc(n.codigo)} · ${n.habitacion ? 'Hab. ' + esc(n.habitacion) : 'Piso 2'} · ${ESTADO_TXT[n.estado]} · ${fechaHoraBog(n.created_at)}</small></span>${ic('pin', 1.8)}</a>`;
  const filaA = (a: Act) => `<a class="rs-li" href="#fontana/piso-2/${esc(a.hab)}"><i style="background:${realActEn(a, hoy) >= 1 ? '#1E9A62' : '#8F9DAA'}"></i><span><b>${esc(a.hab)} · ${esc(a.fase.replace(/^\d+\.\s*/, ''))}</b><small>${esc(a.ini)} → ${esc(a.fin)} · programado ${pct(progActEn(a, hoy))} · real ${pct(realActEn(a, hoy))} · ${esc(a.quien)}</small></span>${ic('arrowR', 1.8)}</a>`;
  const T: Record<string, [string, string]> = {
    avance: ['Avance general', acts.map(filaA).join('')],
    dia: ['Avance validado hoy', registrosAvance().filter((r) => r.validado_por && r.fecha === hoy).map((r) => { const a = actividades().find((x) => x.id === r.actividad_id); return a ? filaA(a) : ''; }).join('') || '<p class="muted">No hay avances validados con fecha de hoy.</p>'],
    nuevas: ['Novedades registradas hoy', ns.filter((n) => diaBog(n.created_at) === hoy).map(filaN).join('') || '<p class="muted">Ninguna hoy.</p>'],
    retrasos: ['Retrasos activos', ns.filter((n) => n.tipo === 'retraso' && abierta(n)).map(filaN).join('') || '<p class="muted">Sin retrasos activos.</p>'],
    imprevistos: ['Imprevistos', ns.filter((n) => n.tipo === 'imprevisto').map(filaN).join('') || '<p class="muted">Sin imprevistos registrados.</p>'],
    hechas: ['Actividades completadas', acts.filter((a) => realActEn(a, hoy) >= 1).map(filaA).join('')],
    pendientes: ['Actividades pendientes', acts.filter((a) => realActEn(a, hoy) < 1).map(filaA).join('')],
  };
  const [t, body] = T[k] ?? ['', ''];
  return `<div class="sheetbg" data-act="cerrarHojaFondo"><div class="sheet" role="dialog" aria-label="${esc(t)}"><div style="display:flex;justify-content:space-between;gap:10px"><div><p class="eyebrow">RESUMEN · PISO 2</p><h2>${esc(t)}</h2></div><button class="circle light" data-act="cerrarHoja" aria-label="Cerrar">${ic('x')}</button></div><div class="rs-lista">${body}</div></div></div>`;
}

export async function enviarAvance(f: HTMLFormElement): Promise<void> {
  const d = new FormData(f); const a = actividades().find((x) => x.id === d.get('act')); if (!a) return;
  const err = await registrarAvance(a, +(d.get('pct') ?? 0), String(d.get('nota') ?? ''));
  toast(err ?? 'Avance registrado · queda pendiente de validación');
}
export async function validar(id: number): Promise<void> { toast((await validarAvance(id)) ?? 'Avance validado · el Resumen se actualiza'); }
