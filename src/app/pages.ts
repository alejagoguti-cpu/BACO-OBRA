/* Páginas de gestión: panel, planeación, avance semanal, proveedores, novedades + QR, entregables, honorarios. */
import { ENTREGABLES, ESPECIALIDADES, ETAPAS, M, PLAN, RATE, TIPOS, UBICACIONES, type EtapaK, type Novedad } from './data';
import { S, compartido, listaNovedades } from './store';
import { OBRA, DIA, actsSemana, corte, curvaProg, fases, fechaCorta, porEsp, porFase, porFrente, porHab, realAct, semanas, total as totalObra } from './obra';
import { cnt, donutRing, esc, fmt, fmtM, gauge, ic, ring } from './ui';

/* ---------------- cálculos de la propuesta ---------------- */
export const T = () => 3 + S.obra + 1;
export const etapa = (m: number): EtapaK => (m <= 1 ? 'A' : m <= 3 ? 'B' : m <= 3 + S.obra ? 'C' : 'D');
export const span = (k: EtapaK): [number, number] => (k === 'A' ? [1, 1] : k === 'B' ? [2, 3] : k === 'C' ? [4, 3 + S.obra] : [T(), T()]);
const feeC = (modo = S.modo, obra = S.obra) => RATE[modo] * obra;
export const fee = (k: EtapaK) => (k === 'C' ? feeC() : ETAPAS[k].fee);
export const total = (modo = S.modo, obra = S.obra) => 111 * M + feeC(modo, obra);
const iv = (v: number) => (S.iva ? v * 1.19 : v);
interface Pago { mes: number; c: 'inicio' | 'fin'; et: EtapaK; v: number; d: string }
export function pagos(): Pago[] {
  const r = RATE[S.modo], t = T();
  const o: Pago[] = [
    { mes: 1, c: 'inicio', et: 'A', v: 16.5 * M, d: '50% a la formalización' }, { mes: 1, c: 'fin', et: 'A', v: 16.5 * M, d: '50% con BEP, matrices y anexos' },
    { mes: 2, c: 'fin', et: 'B', v: 23.5 * M, d: 'Corte 1 de coordinación' }, { mes: 3, c: 'fin', et: 'B', v: 23.5 * M, d: 'Corte 2 de coordinación' }];
  for (let i = 1; i <= S.obra; i++) o.push({ mes: 3 + i, c: 'fin', et: 'C', v: r, d: `Mes de obra ${i} · mes vencido` });
  o.push({ mes: t, c: 'inicio', et: 'D', v: 15.5 * M, d: '50% al iniciar el cierre' }, { mes: t, c: 'fin', et: 'D', v: 15.5 * M, d: '50% contra entrega as-built' });
  return o;
}
const paid = (p: Pago) => (p.c === 'inicio' ? p.mes <= S.mes : p.mes < S.mes);
export const entP = (k?: EtapaK) => { const ids = (k ? [k] : (Object.keys(ENTREGABLES) as EtapaK[])).flatMap((e) => ENTREGABLES[e].map((_, i) => e + i)); const d = ids.filter((i) => S.ent[i]).length; return { d, t: ids.length, p: d / ids.length }; };
export const espDe = (id: string) => ESPECIALIDADES.find((e) => e.id === id) ?? ESPECIALIDADES[5];
export const ubic = (k: string) => UBICACIONES.find((u) => u[0] === k)?.[1] ?? k;
const abiertas = () => listaNovedades().filter((n) => n.estado !== 'Cerrada');
const fecha = (ts: number) => new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

const head = (eyebrow: string, title: string, right = '') => `<div class="hero"><div><p class="muted" style="font-weight:700;font-size:13px">${eyebrow}</p><h1>${title}</h1></div>${right}</div>`;
const segObra = () => `<div class="seg">${[6, 8, 9].map((n) => `<button data-act="obra" data-v="${n}" aria-pressed="${S.obra === n}">Obra ${n} meses${n === 8 ? ' · base' : ''}</button>`).join('')}</div>`;
const stepper = () => `<div class="stepper"><button class="circle light" data-act="mes" data-v="-1" aria-label="Mes anterior">${ic('left')}</button><span>Mes ${S.mes} / ${T()}</span><button class="circle" data-act="mes" data-v="1" aria-label="Mes siguiente">${ic('right')}</button></div>`;
const IMGS = [['img/suite.webp', 'Suite tipo', 'Render de la remodelación'], ['img/bano.webp', 'Baño de suite', 'Render de la remodelación'], ['img/axo.webp', 'Suite C1', 'Axonometría de acabados']];

/* ================= PANEL (DIFERENCIADO POR ROL) ================= */
export function vPanelContratista(): string {
  const ob = OBRA ? totalObra() : { prog: 0, real: 0, n: 0, hechas: 0 };
  const sems = semanas(); const tC = corte();
  let si = S.semana; if (si < 0 || si >= sems.length) si = Math.max(0, sems.findIndex((w) => tC >= w.ini && tC <= w.fin + DIA));
  const w = sems[si];
  const eUser = espDe(S.espUser || 'arq');
  const novAll = listaNovedades();
  const novMias = S.espUser && S.espUser !== 'coo' ? novAll.filter((n) => n.esp === S.espUser) : novAll;
  const abMias = novMias.filter((n) => n.estado !== 'Cerrada');
  const cerrMias = novMias.length - abMias.length;
  const allActs = w ? actsSemana(w.ini, w.fin + DIA - 1) : [];
  const actsMias = S.espUser && S.espUser !== 'coo' ? allActs.filter((a) => a.esp === S.espUser) : allActs;
  const actsDisplay = actsMias.length ? actsMias : allActs;
  const avEsp = OBRA ? porEsp(S.espUser === 'est' || S.espUser === 'rci' ? 'arq' : S.espUser || 'arq') : { prog: 0, real: 0, n: 0, hechas: 0 };
  const colorHab = (p: number) => `color-mix(in srgb, var(--teal) ${Math.round(14 + p * 86)}%, var(--soft))`;
  const fd = (s: string) => fechaCorta(new Date(s + 'T12:00').getTime());
  const novPorHab = new Map<string, number>();
  novAll.forEach((nv) => { if (nv.estado !== 'Cerrada' && nv.loc.startsWith('HAB-')) { const hk = nv.loc.slice(4); novPorHab.set(hk, (novPorHab.get(hk) ?? 0) + 1); } });
  const nombre = S.nombreUser || `Equipo ${eUser.corto}`;

  return `${head(
    `Dashboard Técnico de Obra · Torre Suites Piso 2 · Especialidad: ${eUser.n}`,
    `Hola, <b>${esc(nombre)}</b>. Tu frente en obra`,
    `<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">
      <div class="kchip"><span class="ic2" style="background:${eUser.c};color:#fff">${ic(eUser.ic)}</span><span><b>${cnt(avEsp.real * 100, 'pct')}</b><small>Avance ${eUser.corto}</small></span></div>
      <div class="kchip"><span class="ic2">${ic('bell')}</span><span><b>${cnt(abMias.length)}</b><small>Pendientes ${eUser.corto}</small></span></div>
      <button class="btn coral" data-act="reportar">${ic('camera')} Reportar en obra</button>
    </div>`
  )}
  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:-8px">
    <p class="muted">Filtra tu especialidad activa para resaltar tus redes en 3D, tareas de la semana y RFI/interferencias:</p>
    <div class="chiprow">${ESPECIALIDADES.map((e) => `<button class="chip" data-act="setEspUser" data-v="${e.id}" aria-pressed="${S.espUser === e.id}"><span class="sw" style="background:${e.c}"></span>${e.corto}</button>`).join('')}</div>
  </div>
  <div class="cols">
    <div class="col">
      <section class="card glow"><div class="chead" style="align-items:center"><div style="display:flex;gap:12px;align-items:center"><span class="badge" style="background:${eUser.c}">${ic(eUser.ic, 2.2)}</span><div><h2>Frente ${eUser.corto}</h2><p class="sub">${eUser.desc}</p></div></div></div>
        <div class="minis">
          <div class="mini"><small>Real especialidad</small><b style="color:var(--teal);font-size:17px">${Math.round(avEsp.real * 100)}%</b></div>
          <div class="mini"><small>Meta semana ${w?.label ?? 'S4'}</small><b style="font-size:17px">${Math.round(avEsp.prog * 100)}%</b></div>
          <div class="mini"><small>Tareas cumplidas</small><b style="font-size:17px">${avEsp.hechas} / ${avEsp.n}</b></div>
        </div>
        <div class="pl"><span>Cumplimiento frente al cronograma</span><b>${Math.round(avEsp.real * 100)}% vs. ${Math.round(avEsp.prog * 100)}%</b></div>
        <div class="pbar"><i style="width:${avEsp.real * 100}%;background:${eUser.c}"></i></div>
        <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
          <button class="btn pri" data-act="abrirBim" data-v="${eUser.id}" style="flex:1">${ic('eye')} Abrir 3D ${eUser.corto}</button>
          <a class="btn" href="#qr" style="flex:1">${ic('novedades')} QR de puertas</a>
        </div>
      </section>
      <section class="card"><div class="chead"><div><h2>Coordinación técnica BIM</h2><p class="sub">Avance físico por frente · toca para abrir en 3D</p></div><a class="circle" href="#avance" aria-label="Ver avance semanal">${ic('arrow')}</a></div>
        ${(['arq', 'hid', 'ele', 'coo'] as const).map((e, k) => { const d = espDe(e), a = OBRA ? porEsp(e) : { prog: 0, real: 0 }; return `<button class="hbar" data-act="abrirBim" data-v="${e}" style="width:100%;text-align:left"><span>${e === 'coo' ? 'Pruebas y entrega' : d.corto}</span><span class="tr2 dual"><i style="--k:${k};width:${a.prog * 100}%;background:color-mix(in srgb,${d.c} 28%,transparent)"></i><i style="--k:${k};width:${a.real * 100}%;background:${d.c}"></i></span><b>${Math.round(a.real * 100)}%</b></button>`; }).join('')}
      </section>
    </div>
    <div class="col">
      <section class="card"><div class="chead"><div><h2>Checklist de campo · ${w?.label ?? ''}</h2><p class="sub">${actsDisplay.length} tareas ${actsMias.length ? `de ${eUser.corto}` : 'en la semana'} · marca al terminar en sitio</p></div><a class="circle" href="#avance" aria-label="Ver todas">${ic('arrow')}</a></div>
        <div class="scrollbox" style="max-height:330px">${actsDisplay.slice(0, 18).map((a) => { const d = espDe(a.esp), done = realAct(a) >= 1; return `<label class="check ${done ? 'done' : ''}"><input type="checkbox" data-act="hecho" data-v="${esc(a.id)}" ${done ? 'checked' : ''}><span class="bx">${ic('check', 3)}</span><span class="tx" style="flex:1"><b>Hab. ${a.hab} · ${esc(a.fase.replace(/^\d+\.\s*/, ''))}</b><small><span style="color:${d.c};font-weight:900">●</span> ${esc(a.quien)} · ${fd(a.ini)}–${fd(a.fin)}</small></span></label>`; }).join('') || '<p class="muted">Sin actividades pendientes en esta semana.</p>'}</div>
      </section>
      <section class="card"><div class="chead"><div><h2>Mapa rápido de habitaciones Piso 2</h2><p class="sub">Toca cualquier habitación (214–225) para abrir su ficha técnica o reportar</p></div></div>
        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px">${(OBRA?.habitaciones ?? []).map((hb, k) => {
          const a = porHab(hb.hab);
          const nAb = novPorHab.get(hb.hab) ?? 0;
          return `<button class="hab" data-act="habDetalle" data-v="${hb.hab}" style="--k:${k};min-height:74px;padding:10px;background:${colorHab(a.real)}"><b>${hb.hab}</b><small>${Math.round(a.real * 100)}%</small>${nAb ? `<span class="hnov" style="bottom:8px;right:8px">${nAb}</span>` : ''}</button>`;
        }).join('')}</div>
      </section>
    </div>
    <div class="col">
      <section class="card"><div class="chead"><div><h2>Mis RFI e interferencias</h2><p class="sub">${abMias.length} abiertas · ${cerrMias} resueltas en ${eUser.corto}</p></div><a class="circle" href="#novedades" aria-label="Ir a novedades">${ic('arrow')}</a></div>
        <div class="gwrap" style="margin-bottom:10px"><div><div class="big">${cnt(novMias.length)}</div><small>${abMias.length} por resolver en obra</small></div>${gauge(novMias.length ? cerrMias / novMias.length : 1, 'var(--coral)', 'Novedades cerradas')}</div>
        <div class="list">${abMias.slice(0, 4).map(rowNov).join('') || '<p class="muted" style="padding:10px 0">¡Todo al día! No tienes interferencias abiertas en esta especialidad.</p>'}</div>
      </section>
      <section class="card"><div class="chead"><div><h2>Entregables técnicos LOD 400</h2><p class="sub">${entP().d} de ${entP().t} validados en CDE (ISO 19650)</p></div><a class="circle" href="#entregables" aria-label="Ver entregables">${ic('arrow')}</a></div>
        <div class="pl"><span>Avance global piso 2</span><b>${Math.round(ob.real * 100)}%</b></div>
        <div class="pbar"><i style="width:${ob.real * 100}%"></i></div>
      </section>
    </div>
  </div>`;
}

export function vPanel(): string {
  if (S.rol === 'contratista') return vPanelContratista();
  if (S.mes > T()) S.mes = T();
  const et = etapa(S.mes), [a, b] = span(et), pE = Math.min(1, (S.mes - a + 1) / (b - a + 1));
  const ps = pagos(), fact = ps.filter(paid).reduce((s, p) => s + p.v, 0), tot = total();
  const nov = listaNovedades(), ab = abiertas(), cerr = nov.length - ab.length;
  const hoy = new Date();
  const pm = Array(T()).fill(0); ps.forEach((p) => { pm[p.mes - 1] += p.v; });
  const mx = Math.max(...pm), avg = pm.reduce((s, v) => s + v, 0) / pm.length;
  const bars = pm.map((v, i) => { const h = (v / mx) * 100; return `<button type="button" class="cap ${i + 1 < S.mes ? '' : i + 1 === S.mes ? 'now' : 'fut'}" data-act="setMes" data-v="${i + 1}" style="--k:${i};--h:${h}%" aria-label="Ir al mes ${i + 1}: ${fmtM(v)}"><i style="height:${h}%"></i><span class="bub">M${i + 1} · ${fmtM(iv(v))}</span></button>`; }).join('');
  let acc = 0; const cum = pm.map((v) => (acc += v)); const W = 400, H = 170;
  const pts = cum.map((v, i) => [((i + 0.5) / pm.length) * W, H - (v / acc) * (H - 12)]);
  const line = 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join(' L');
  const np = pts[S.mes - 1];
  const curve = `<svg class="curve" viewBox="0 0 ${W} ${H + 4}" preserveAspectRatio="none" role="img" aria-label="Facturación acumulada"><defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1FA58C" stop-opacity=".35"/><stop offset="1" stop-color="#1FA58C" stop-opacity="0"/></linearGradient></defs>
    ${[0.25, 0.5, 0.75, 1].map((f) => `<line x1="0" x2="${W}" y1="${H - f * (H - 12)}" y2="${H - f * (H - 12)}" stroke="var(--line)" stroke-dasharray="3 5"/>`).join('')}
    <path class="ar" d="${line} L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H}Z" fill="url(#gA)"/><path class="ln" d="${line}" fill="none" stroke="var(--teal)" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    <circle cx="${np[0]}" cy="${np[1]}" r="6" fill="var(--teal)" stroke="var(--card)" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>`;
  const next = ps.filter((p) => !paid(p)).slice(0, 3);
  const ob = OBRA ? totalObra() : { prog: 0, real: 0 };
  const espRow = (e: string, k: number) => { const d = espDe(e), a = OBRA ? porEsp(e) : { prog: 0, real: 0 }; return `<button class="hbar" data-act="abrirBim" data-v="${e}" style="width:100%;text-align:left"><span>${e === 'coo' ? 'Pruebas y entrega' : d.corto}</span><span class="tr2 dual"><i style="--k:${k};width:${a.prog * 100}%;background:color-mix(in srgb,${d.c} 28%,transparent)"></i><i style="--k:${k};width:${a.real * 100}%;background:${d.c}"></i></span><b>${Math.round(a.real * 100)}%</b></button>`; };
  const nombre = S.nombreUser || 'Gerencia Estelar';
  return `${head('Dashboard Ejecutivo · Hoteles Estelar · Remodelación Torre Suites Piso 2', `Hola, <b>${esc(nombre)}</b>. Así va la inversión y la obra`, `<div style="display:flex;gap:20px;flex-wrap:wrap">
      <div class="kchip"><span class="ic2">${ic('avance')}</span><span><b>${cnt(ob.real * 100, 'pct')}</b><small>Avance real del piso 2</small></span></div>
      <div class="kchip"><span class="ic2">${ic('honorarios')}</span><span><b>${cnt(iv(fact), 'M')}</b><small>Inversión ejecutada</small></span></div>
      <div class="kchip"><span class="ic2">${ic('bell')}</span><span><b>${cnt(ab.length)}</b><small>Novedades abiertas</small></span></div></div>`)}
  <p class="muted" style="margin-top:-10px">Hoy es ${hoy.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · mes ${S.mes} de ${T()} del contrato</p>
  <div class="cols">
    <div class="col">
      <section class="card"><div class="chead" style="align-items:center"><div style="display:flex;gap:12px;align-items:center"><span class="badge" style="background:${ETAPAS[et].c}">${et}</span><div><h2>Etapa ${et} · ${ETAPAS[et].s}</h2><p class="sub">${ETAPAS[et].n}</p></div></div></div>
        <div class="minis"><div class="mini"><small>Modalidad</small><b>${S.modo === 'solo' ? 'Solo BIM' : 'BIM + Construcción'}</b></div><div class="mini"><small>Plazo etapa</small><b>Mes ${a}${b > a ? '–' + b : ''}</b></div><div class="mini"><small>Especialidades</small><b>6 activas</b></div></div>
        <div class="pl"><span>Avance de la etapa</span><b>${Math.round(pE * 100)}%</b></div><div class="pbar"><i style="width:${pE * 100}%"></i></div>
        <div class="pl" style="margin-top:10px"><span class="muted">Honorarios de la etapa</span><span>${fmtM(iv(fee(et)))}</span></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;gap:8px;flex-wrap:wrap"><span class="muted" style="font-size:13px">Simular avance</span>${stepper()}</div></section>
      <section class="card"><div class="chead"><div><h2>Avance por especialidad</h2><p class="sub">Piso 2 · real sobre programado (matriz de obra)</p></div><a class="circle" href="#avance" aria-label="Ver avance semanal">${ic('arrow')}</a></div>
        ${['arq', 'hid', 'ele', 'coo'].map(espRow).join('')}</section>
      ${next.map((p) => `<div class="hito"><span class="n">M${p.mes}</span><div class="t"><b>${fmtM(iv(p.v))} · Etapa ${p.et}</b><small>${esc(p.d)}</small></div>${ring(Math.min(1, S.mes / p.mes), ETAPAS[p.et].c)}</div>`).join('')}
    </div>
    <div class="col">
      <section class="card photo"><div class="frame">
        <img src="${IMGS[S.img][0]}" alt="${IMGS[S.img][1]} · ${IMGS[S.img][2]}">
        <div class="dots">${IMGS.map((m, i) => `<button data-act="img" data-v="${i}" aria-pressed="${S.img === i}" aria-label="${m[1]}"></button>`).join('')}</div>
        <button class="circle tr" data-act="lightbox" aria-label="Ver en grande">${ic('area')}</button>
        <div class="tag"><span class="ic3">${ic('build')}</span><span><b>${IMGS[S.img][1]}</b><small>${IMGS[S.img][2]}</small></span></div>
      </div></section>
      <p class="desc">Remodelación de Torre Suites con gestión BIM de punta a punta: del modelo de condiciones existentes LOD 300 a la coordinación LOD 400, la obra y el gemelo digital para mantenimiento. El piso 2 es el prototipo.</p>
      <div class="tiles"><div class="tile">${ic('area')}<b>10.000 m²</b></div><div class="tile">${ic('layers')}<b>12 habitaciones · P2</b></div><div class="tile">${ic('clock')}<b>${T()} meses</b></div></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn pri" data-act="elegirEsp" style="flex:1">${ic('eye')} Ver modelo 3D del piso 2</button><a class="btn" href="#novedades" style="flex:1">${ic('novedades')} Códigos QR</a></div>
      <section class="card"><h2 style="margin-bottom:14px">Detalle</h2><div class="dl">
        <div>${ic('doc')}<span>Propuesta</span><b>v03 · 9 nov 2026</b></div><div>${ic('user')}<span>Proponente</span><b>BACO Studio S.A.S.</b></div>
        <div>${ic('honorarios')}<span>Valor ${S.iva ? 'con' : 'sin'} IVA</span><b>${fmt(iv(tot))}</b></div><div>${ic('cal')}<span>Validez</span><b>30 días calendario</b></div>
        <div>${ic('layers')}<span>Marco</span><b>ISO 19650 · IFC</b></div></div></section>
    </div>
    <div class="col">
      <section class="card"><div class="chead"><div><h2>Facturación por mes</h2><p class="sub">${S.chart === 'bar' ? 'Honorarios por mes de contrato' : 'Facturación acumulada'}</p></div>
        <div class="tog"><button data-act="chart" data-v="bar" aria-pressed="${S.chart === 'bar'}" aria-label="Barras">${ic('bars', 2)}</button><button data-act="chart" data-v="line" aria-pressed="${S.chart === 'line'}" aria-label="Curva">${ic('line', 2)}</button></div></div>
        ${S.chart === 'bar' ? `<div class="caps">${bars}<div class="avg" style="bottom:${(avg / mx) * 160}px"><span>Promedio ${fmtM(iv(avg))}</span></div></div>` : curve}
        <div class="xl">${pm.map((_, i) => `<span style="${i + 1 === S.mes ? 'color:var(--ink);font-weight:800' : ''}">${i + 1}</span>`).join('')}</div></section>
      <section class="card"><div class="chead"><div><h2>Novedades cerradas</h2><p class="sub">Reportes desde obra con QR</p></div><a class="circle" href="#novedades" aria-label="Ver novedades">${ic('arrow')}</a></div>
        <div class="gwrap"><div><div class="big">${cnt(nov.length)}</div><small>${cerr} cerradas · ${ab.length} abiertas</small></div>${gauge(nov.length ? cerr / nov.length : 0, 'var(--coral)', 'Novedades cerradas')}</div></section>
      <section class="card"><div class="chead"><div><h2>Honorarios ejecutados</h2><p class="sub">${S.iva ? 'Con IVA' : 'Sin IVA'} · ${S.modo === 'solo' ? 'Solo BIM' : 'BIM + Construcción'}</p></div><a class="circle" href="#honorarios" aria-label="Ver honorarios">${ic('arrow')}</a></div>
        <div class="gwrap"><div><div class="big">${cnt(iv(fact), 'M')}</div><small>de ${fmtM(iv(tot))}</small></div>${gauge(fact / tot, 'var(--teal)', 'Honorarios ejecutados')}</div></section>
    </div>
  </div>
  <section class="card"><div class="chead"><div><h2>Entregables verificados</h2><p class="sub">${entP().d} de ${entP().t} · criterios de recepción de la propuesta</p></div><a class="circle" href="#entregables" aria-label="Ver entregables">${ic('arrow')}</a></div>
    <div class="rings">${(Object.keys(ENTREGABLES) as EtapaK[]).map((k) => donutRing(entP(k).p, ETAPAS[k].c, 'Etapa ' + k, ETAPAS[k].s, '#entregables')).join('')}</div></section>
  <p class="foot-note">Prototipo de BACO Studio S.A.S. para la propuesta de remodelación v03. Cifras de honorarios tomadas de la propuesta; avances, proveedores y novedades precargadas son de ejemplo. No es un sitio oficial de Hoteles Estelar.</p>`;
}

/* ================= PLANEACIÓN ================= */
export function vPlan(): string {
  const t = T();
  const fases: ['00' | EtapaK, string, string][] = [['00', 'Punto de partida', 'Escaneo y modelo LOD 300 (tercero)'], ['A', ETAPAS.A.s, 'Mes 1'], ['B', ETAPAS.B.s, 'Mes 2–3'], ['C', ETAPAS.C.s, `Mes 4–${3 + S.obra}`], ['D', ETAPAS.D.s, `Mes ${t}`]];
  const cur = etapa(S.mes);
  const orden = ['00', 'A', 'B', 'C', 'D'];
  return `${head('De la planeación a la entrega final', '<b>Planeación</b> y cronograma', segObra())}
  <section class="card"><div class="chead"><div><h2>Ruta del proyecto</h2><p class="sub">Toca una fase para ver sus tareas</p></div>${stepper()}</div>
    <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px">${fases.map(([k, n, d]) => { const done = orden.indexOf(k) < orden.indexOf(cur), now = k === cur; return `<a href="#plan-${k}" class="mini" style="text-decoration:none;color:inherit;${now ? 'box-shadow:inset 0 0 0 2px ' + ETAPAS[k as EtapaK].c : ''}"><span class="badge" style="width:34px;height:34px;font-size:13px;margin-bottom:8px;background:${k === '00' ? '#5C6B7A' : ETAPAS[k as EtapaK].c}">${done ? ic('check', 3) : k}</span><b>${n}</b><small>${d}</small></a>`; }).join('')}</div></section>
  <section class="card"><div class="gsc"><div class="gantt">
    <div class="gmon" style="grid-template-columns:repeat(${t},1fr)">${Array.from({ length: t }, (_, i) => `<span style="${i + 1 === S.mes ? 'color:var(--coral)' : ''}">M${i + 1}</span>`).join('')}</div>
    ${(Object.keys(ETAPAS) as EtapaK[]).map((k, j) => { const [a, b] = span(k); return `<div class="grow"><div class="gl"><b>${k} · ${ETAPAS[k].s}</b><small>${b - a + 1} ${b > a ? 'meses' : 'mes'} · ${fmtM(fee(k))}</small></div><div class="gtrack"><div class="gblk" style="--c:${ETAPAS[k].c};--k:${j};left:${((a - 1) / t) * 100}%;width:${((b - a + 1) / t) * 100}%">${ETAPAS[k].n}</div>${j === 0 ? `<div class="gtoday" style="left:${((S.mes - 0.5) / t) * 100}%"><span>Hoy · M${S.mes}</span></div>` : ''}</div></div>`; }).join('')}
  </div></div></section>
  <div class="g2">${orden.map((k) => `<section class="card" id="plan-${k}"><div class="chead" style="align-items:center"><div style="display:flex;gap:12px;align-items:center"><span class="badge" style="background:${k === '00' ? '#5C6B7A' : ETAPAS[k as EtapaK].c}">${k}</span><div><h2>${k === '00' ? 'Condiciones existentes' : ETAPAS[k as EtapaK].n}</h2><p class="sub">${k === '00' ? 'Proveedor independiente contratado por el propietario' : ETAPAS[k as EtapaK].foco}</p></div></div></div>
    <div class="list">${PLAN.filter((p) => p.k === k).map((p) => `<div class="lrow"><span class="pill neu">${esc(p.quien)}</span><div class="t"><b>${esc(p.t)}</b></div><span></span></div>`).join('')}</div></section>`).join('')}</div>`;
}

/* ================= AVANCE SEMANAL (datos reales de la matriz de programación) ================= */
export function vAvance(habSel = ''): string {
  const total = totalObra;
  if (!OBRA) return `${head('Avance de obra · Piso 2', '<b>Avance</b> de la semana')}<section class="card"><p class="muted">Cargando la programación de obra…</p></section>`;
  const sems = semanas(); const tC = corte();
  let si = S.semana; if (si < 0 || si >= sems.length) si = Math.max(0, sems.findIndex((w) => tC >= w.ini && tC <= w.fin + DIA));
  const w = sems[si]; const tW = Math.min(w.fin + DIA - 1, tC);
  const tot = total(tW), totPrev = si ? total(sems[si - 1].fin + DIA - 1) : { prog: 0, real: 0 };
  const delta = Math.round((tot.real - tot.prog) * 100);
  const sinReporte = OBRA.actividades.every((a) => realAct(a) < 1 || a.fase.startsWith('1.'));
  const cp = curvaProg(); const n = cp.length;
  const W = 640, H = 220, x = (i: number) => 30 + (i / Math.max(1, n - 1)) * (W - 50), y = (v: number) => H - 24 - v * (H - 48);
  const lp = 'M' + cp.map((v, i) => `${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' L');
  const area = `${lp} L${x(n - 1)} ${H - 24} L${x(0)} ${H - 24}Z`;
  const ry = y(total().real);
  const allActs = actsSemana(w.ini, w.fin + DIA - 1);
  const acts = habSel ? allActs.filter((a) => a.hab === habSel) : allActs;
  const frentes = OBRA.frentes;
  const colorHab = (p: number) => `color-mix(in srgb, var(--teal) ${Math.round(14 + p * 86)}%, var(--soft))`;
  const fd = (s: string) => fechaCorta(new Date(s + 'T12:00').getTime());
  const novPorHab = new Map<string, number>();
  listaNovedades().forEach((nv) => { if (nv.estado !== 'Cerrada' && nv.loc.startsWith('HAB-')) { const hk = nv.loc.slice(4); novPorHab.set(hk, (novPorHab.get(hk) ?? 0) + 1); } });
  return `${head(`Avance de obra · Piso 2 · ${OBRA.habitaciones.length} habitaciones · ${frentes.length} frentes`, `<b>Avance</b> de la semana`, `<div class="seg" style="max-width:100%;overflow-x:auto;flex-wrap:nowrap">${sems.map((s, i) => `<button data-act="semana" data-v="${i}" aria-pressed="${si === i}">${s.label}</button>`).join('')}</div>`)}
  <p class="muted" style="margin-top:-8px">Semana ${w.label} · ${fechaCorta(w.ini)} – ${fechaCorta(w.fin)} · inicio ${fd(OBRA.inicio)} · entrega formal ${fd(OBRA.entrega)}</p>
  <div class="g3">
    <section class="card glow"><div class="chead"><div><h2>Programado a la fecha</h2><p class="sub">Según la matriz de programación</p></div></div>
      <div class="gwrap"><div><div class="big">${cnt(tot.prog * 100, 'pct')}</div><small>+${Math.round((tot.prog - totPrev.prog) * 100)} puntos en la semana</small></div>${gauge(tot.prog, 'var(--sA)', 'Avance programado')}</div></section>
    <section class="card glow"><div class="chead"><div><h2>Real reportado</h2><p class="sub">Matriz + marcas en obra · ${tot.hechas} de ${tot.n} actividades terminadas</p></div></div>
      <div class="gwrap"><div><div class="big">${cnt(tot.real * 100, 'pct')}</div><small>${sinReporte ? '<span class="pill warn">Falta reportar avance desde la inspección</span>' : `<span class="pill ${delta >= 0 ? 'ok' : delta > -10 ? 'warn' : 'crit'}">${delta >= 0 ? 'Al día' : Math.abs(delta) + ' puntos por debajo'}</span>`}</small></div>${gauge(tot.real, delta >= 0 ? 'var(--teal)' : 'var(--coral)', 'Avance real')}</div></section>
    <section class="card"><div class="chead"><div><h2>Por especialidad</h2><p class="sub">Real sobre programado · toca para ver el modelo</p></div></div>
      ${(['arq', 'hid', 'ele', 'coo'] as const).map((e, k) => { const d = espDe(e), a = porEsp(e, tW); return `<button class="hbar" data-act="abrirBim" data-v="${e}" style="width:100%;text-align:left"><span>${e === 'coo' ? 'Pruebas y entrega' : d.corto}</span><span class="tr2 dual"><i style="--k:${k};width:${a.prog * 100}%;background:color-mix(in srgb,${d.c} 28%,transparent)"></i><i style="--k:${k};width:${a.real * 100}%;background:${d.c}"></i></span><b>${Math.round(a.real * 100)}%</b></button>`; }).join('')}</section>
  </div>
  <section class="card"><div class="chead"><div><h2>Curva S del piso 2</h2><p class="sub">Avance programado acumulado por semana (toca cualquier semana en la curva para inspeccionarla) · línea roja = real reportado</p></div><div style="display:flex;gap:14px;font-size:13px;font-weight:700;flex-wrap:wrap"><span style="display:flex;gap:6px;align-items:center"><i style="width:18px;height:3px;background:var(--sA);border-radius:2px"></i>Programado</span><span style="display:flex;gap:6px;align-items:center"><i style="width:10px;height:10px;border-radius:50%;background:var(--coral)"></i>Real</span></div></div>
    <svg class="curve" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:240px" role="img" aria-label="Curva S programada y avance real">
      <defs><linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4F6EF0" stop-opacity=".32"/><stop offset="1" stop-color="#4F6EF0" stop-opacity="0"/></linearGradient></defs>
      ${[0, 0.25, 0.5, 0.75, 1].map((v) => `<line x1="30" x2="${W - 20}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-dasharray="3 5"/><text x="0" y="${y(v) + 4}" style="fill:var(--muted);font:700 10px var(--f)">${v * 100}%</text>`).join('')}
      <rect x="${x(si) - 12}" y="10" width="24" height="${H - 34}" rx="12" fill="var(--soft)"/>
      <path class="ar" d="${area}" fill="url(#gS)"/>
      <path class="ln" d="${lp}" fill="none" stroke="var(--sA)" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      ${cp.map((v, i) => `<g style="cursor:pointer" data-act="semana" data-v="${i}"><rect x="${x(i) - 18}" y="10" width="36" height="${H - 30}" fill="transparent"/><circle cx="${x(i)}" cy="${y(v)}" r="${i === si ? 7 : 4}" fill="var(--sA)" stroke="var(--card)" stroke-width="2" vector-effect="non-scaling-stroke"/><title>Semana ${sems[i].label}: ${Math.round(v * 100)}% programado</title></g>`).join('')}
      <line x1="30" x2="${W - 20}" y1="${ry}" y2="${ry}" stroke="var(--coral)" stroke-dasharray="2 6" vector-effect="non-scaling-stroke"/>
      <circle class="pulso" cx="${x(si)}" cy="${ry}" r="7" fill="var(--coral)" stroke="var(--card)" stroke-width="3" vector-effect="non-scaling-stroke" style="pointer-events:none"/>
    </svg>
    <div class="xl" style="padding-left:24px">${sems.map((s, i) => `<button type="button" data-act="semana" data-v="${i}" style="flex:1;font-size:11.5px;padding:4px 0;border-radius:8px;${i === si ? 'color:var(--ink);font-weight:900;background:var(--soft)' : 'color:var(--muted)'}">${s.label}</button>`).join('')}</div></section>
  <section class="card"><div class="chead" style="flex-wrap:wrap"><div><h2>Habitaciones del piso 2</h2><p class="sub">Toca una habitación para ver su ficha completa, marcar actividades o reportar novedad</p></div>${habSel ? `<button class="chip" data-act="habFiltro" data-v="">Quitar filtro Hab. ${esc(habSel)} ×</button>` : ''}</div>
    <div class="frentes">${frentes.map((f) => { const af = porFrente(f.frente, tW); return `<div class="frente"><div class="fhead"><div><b>${f.frente}</b><small>${esc(f.comp)} · ${f.area} m²</small></div>${ring(af.real, 'var(--teal)', 34, 4)}</div><div class="habs">${f.secuencia.split(/\s*→\s*/).map((h, k) => { const hb = OBRA!.habitaciones.find((q) => q.hab === h); const a = porHab(h, tW); const nAb = novPorHab.get(h) ?? 0; return `<button class="hab ${habSel === h ? 'sel' : ''}" data-act="habDetalle" data-v="${h}" style="--k:${k};background:${colorHab(a.real)}"><div><b>${h}</b><small style="display:block">${esc(hb?.tipo ?? '')}</small></div><span class="hp">${Math.round(a.real * 100)}% <small style="opacity:.65">/ ${Math.round(a.prog * 100)}%</small></span>${nAb ? `<span class="hnov" title="${nAb} novedades abiertas">${nAb}</span>` : ''}<span class="hbar2"><i style="width:${a.real * 100}%"></i></span></button>`; }).join('')}</div></div>`; }).join('')}</div></section>
  <div class="g2">
    <section class="card" id="secActs"><div class="chead" style="flex-wrap:wrap"><div><h2>Actividades de la semana ${w.label}${habSel ? ` · Hab. ${esc(habSel)}` : ''}</h2><p class="sub">${acts.length} programadas · marca las terminadas</p></div>${habSel ? `<button class="chip" data-act="habFiltro" data-v="">Ver todas (${allActs.length})</button>` : ''}</div>
      <div class="scrollbox">${acts.slice(0, 40).map((a) => { const d = espDe(a.esp), done = realAct(a) >= 1; return `<label class="check ${done ? 'done' : ''}"><input type="checkbox" data-act="hecho" data-v="${esc(a.id)}" ${done ? 'checked' : ''}><span class="bx">${ic('check', 3)}</span><span class="tx" style="flex:1"><b>Hab. ${a.hab} · ${esc(a.fase.replace(/^\d+\.\s*/, ''))}</b><small><span style="color:${d.c};font-weight:900">●</span> ${esc(a.quien)} · ${fd(a.ini)}–${fd(a.fin)}</small></span></label>`; }).join('') || '<p class="muted">Sin actividades programadas con este filtro en esta semana.</p>'}</div></section>
    <section class="card"><div class="chead"><div><h2>Hitos de control</h2><p class="sub">Condiciones de éxito del comité</p></div></div>
      <div class="timeline2">${OBRA.hitos.map((h, k) => { const t = new Date(h.fecha + 'T12:00').getTime(), pas = t <= tC; return `<div class="th ${pas ? 'pas' : ''}" style="--k:${k}"><span class="tdot"></span><div><b>${esc(h.hito)}</b><small>${fechaCorta(t)} · ${esc(h.quien)}</small><p>${esc(h.resultado)}</p></div><span class="pill ${h.tipo === 'Crítico' ? 'crit' : h.tipo === 'Contractual' ? 'warn' : 'neu'}">${esc(h.tipo)}</span></div>`; }).join('')}</div></section>
  </div>
  <section class="card"><div class="chead"><div><h2>Avance por fase</h2><p class="sub">Las 10 fases del flujo continuo por oficios</p></div></div>
    ${fases().map((f, k) => { const a = porFase(f, tW); return `<div class="hbar wide"><span>${esc(f)}</span><span class="tr2 dual"><i style="--k:${k};width:${a.prog * 100}%;background:color-mix(in srgb,var(--sA) 25%,transparent)"></i><i style="--k:${k};width:${a.real * 100}%;background:var(--sA)"></i></span><b>${Math.round(a.real * 100)}%</b></div>`; }).join('')}</section>
  <p class="foot-note">Fuente: ${esc(OBRA.fuente)} (${OBRA.actividades.length} actividades y ${OBRA.inspeccion.length} intervenciones de inspección). El % real viene de la matriz; lo que marques aquí se suma en este dispositivo.</p>`;
}

/* ================= PROVEEDORES ================= */
export function vProveedores(): string {
  const cnts = { 'Contratado': 0, 'En evaluación': 0, 'Por contratar': 0 } as Record<string, number>;
  S.prov.forEach((p) => cnts[p.estado]++);
  return `${head('Matriz de responsabilidades de la propuesta', '<b>Proveedores</b> y contratistas', `<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">${Object.entries(cnts).map(([k, v]) => `<div class="kchip"><span class="ic2">${ic(k === 'Contratado' ? 'check' : k === 'En evaluación' ? 'clock' : 'plus')}</span><span><b>${v}</b><small>${k}</small></span></div>`).join('')}<button class="chip" data-act="reset" title="Restablecer datos de ejemplo">${ic('reset', 1.8)} Restablecer demo</button></div>`)}
  <div class="g3">${S.prov.map((p, i) => { const e = espDe(p.esp), st = p.estado === 'Contratado' ? 'ok' : p.estado === 'En evaluación' ? 'warn' : 'neu'; return `<section class="card prov">
    <div class="top"><span class="eic2" style="background:${e.c}">${ic(e.ic)}</span><span class="pill ${st}">${p.estado}</span></div>
    <div><h2>${esc(p.nombre)}</h2><p class="sub">${esc(p.rol)}</p></div>
    <div class="pl"><span>Avance de entregables</span><b>${p.avance}%</b></div><div class="pbar"><i style="width:${p.avance}%;background:${e.c}"></i></div>
    <div class="dl" style="gap:8px"><div><span>Próxima entrega</span><b>${esc(p.entrega)}</b></div><div><span>Contacto</span><b>${esc(p.contacto)}</b></div></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><button class="chip" data-act="provEstado" data-v="${i}">Estado ›</button><button class="chip" data-act="provDelta" data-i="${i}" data-v="-10" ${p.avance <= 0 ? 'disabled style="opacity:.4"' : ''}>−10%</button><button class="chip" data-act="provDelta" data-i="${i}" data-v="10" ${p.avance >= 100 ? 'disabled style="opacity:.4"' : ''}>+10%</button>${p.ej ? '<span class="pill ex" style="margin-left:auto">ejemplo</span>' : ''}</div></section>`; }).join('')}</div>
  <section class="card"><h2 style="margin-bottom:10px">Quién responde por qué</h2><div class="list">
    ${[['Proveedor de escaneo', 'Levantamiento 3D y modelo de condiciones existentes LOD 300.'], ['Diseñadores / especialistas', 'Desarrollan y aprueban sus modelos en LOD 400 según la matriz pactada.'], ['Contratistas / fabricantes', 'Modelos de fabricación e instalación, cambios, as-built y datos de equipos.'], ['BACO Studio', 'Requisitos, BEP y CDE, coordinación, verificación de entregas y cierre digital.'], ['Propietario / gerencia', 'Contrata, aprueba, exige cumplimiento y recibe los entregables.']].map(([a, r]) => `<div class="lrow"><span class="avatar" style="background:${a === 'BACO Studio' ? 'var(--teal)' : '#5C6B7A'}">${a.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span><div class="t"><b>${a}</b><small>${r}</small></div><span></span></div>`).join('')}</div></section>
  <p class="foot-note">Los roles vienen de la propuesta; nombres, estados y avances son de ejemplo hasta que se contraten.</p>`;
}

/* ================= NOVEDADES + QR ================= */
export function rowNov(n: Novedad): string {
  const e = espDe(n.esp), pr = { Alta: 'crit', Media: 'warn', Baja: 'ok' }[n.prio], st = { Abierta: 'crit', 'En revisión': 'warn', Cerrada: 'ok' }[n.estado];
  return `<div class="lrow row-click" data-act="verFoto" data-v="${esc(n.id)}" tabindex="0" role="button" aria-label="Ver detalle de novedad ${esc(n.id)}">${n.foto ? `<img class="thumb" src="${n.foto}" alt="">` : `<span class="eic2" style="background:${e.c}">${ic(e.ic)}</span>`}
    <div class="t"><b>${esc(n.txt)}</b><small>${esc(n.id)} · ${esc(ubic(n.loc))} · ${esc(n.tipo)} · ${fecha(n.ts)}${n.ej ? ' · ejemplo' : ''}</small></div>
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end"><span class="pill ${pr}">${n.prio}</span><button class="pill ${st}" data-act="novEstado" data-v="${esc(n.id)}" title="Cambiar estado">${n.estado} ›</button>${n.pos ? `<button class="circle sm light" data-act="novVer3d" data-v="${esc(n.id)}" aria-label="Ver en el modelo 3D" title="Ver punto en modelo 3D">${ic('pin')}</button>` : ''}</div></div>`;
}
export function vNovedades(filtro: { esp: string; est: string; q?: string }): string {
  const fq = (filtro.q ?? '').trim().toLowerCase();
  const nov = listaNovedades().filter((n) =>
    (filtro.esp === 'todas' || n.esp === filtro.esp) &&
    (filtro.est === 'todas' || (filtro.est === 'abiertas' ? n.estado !== 'Cerrada' : n.estado === 'Cerrada')) &&
    (!fq || n.txt.toLowerCase().includes(fq) || n.id.toLowerCase().includes(fq) || ubic(n.loc).toLowerCase().includes(fq) || n.quien.toLowerCase().includes(fq))
  );
  const porTipo = TIPOS.map((t) => [t, listaNovedades().filter((n) => n.tipo === t).length] as [string, number]);
  const mx = Math.max(1, ...porTipo.map((x) => x[1]));
  return `${head('Reportes desde obra con código QR', '<b>Novedades</b> y códigos QR', `<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn coral" data-act="reportar">${ic('camera')} Reportar novedad</button><a class="btn" href="#qr">${ic('novedades')} Ver códigos QR</a></div>`)}
  ${compartido() ? '' : '<p class="pill warn" style="align-self:flex-start;padding:8px 14px">Modo local: las novedades se guardan en este dispositivo hasta conectar la base de datos compartida</p>'}
  <div class="g2">
    <section class="card"><div class="chead"><div><h2>Por tipo</h2><p class="sub">${listaNovedades().length} novedades registradas</p></div></div>
      ${porTipo.map(([t, v], k) => `<div class="hbar"><span>${t}</span><span class="tr2"><i style="--k:${k};width:${(v / mx) * 100}%;background:var(--coral)"></i></span><b>${v}</b></div>`).join('')}</section>
    <section class="card"><div class="chead"><div><h2>Cómo funciona</h2><p class="sub">Tres pasos en obra</p></div></div><div class="list">
      ${[['1', 'Pega el QR', 'Imprime el código de cada habitación o zona del piso 2 y pégalo en la puerta.'], ['2', 'Escanéalo con el celular', 'La cámara abre el formulario con la ubicación ya escogida.'], ['3', 'Toma la foto y envía', 'La novedad aparece aquí, en el avance semanal y en el modelo 3D.']].map(([n, t, d]) => `<div class="lrow"><span class="badge" style="width:36px;height:36px;font-size:14px;background:var(--black);color:var(--onBlack)">${n}</span><div class="t"><b>${t}</b><small>${d}</small></div><span></span></div>`).join('')}</div></section>
  </div>
  <section class="card"><div class="chead" style="flex-wrap:wrap;gap:12px"><div><h2>Registro</h2><p class="sub">${nov.length} con este filtro · toca una fila para ver detalle</p></div>
    <div class="search sm-search" style="flex:1 1 220px;height:40px;box-shadow:none;background:var(--soft)">${ic('search')}<input id="qNov" value="${esc(filtro.q ?? '')}" placeholder="Filtrar por texto, ID o habitación…" aria-label="Filtrar novedades">${filtro.q ? `<button type="button" class="circle sm light" data-act="limpiarQNov" aria-label="Limpiar búsqueda">${ic('x')}</button>` : ''}</div>
    <div class="chiprow"><button class="chip" data-act="fEsp" data-v="todas" aria-pressed="${filtro.esp === 'todas'}">Todas</button>${ESPECIALIDADES.filter((e) => e.id !== 'coo').map((e) => `<button class="chip" data-act="fEsp" data-v="${e.id}" aria-pressed="${filtro.esp === e.id}"><span class="sw" style="background:${e.c}"></span>${e.corto}</button>`).join('')}</div>
    <div class="seg">${[['abiertas', 'Abiertas'], ['cerradas', 'Cerradas'], ['todas', 'Todas']].map(([k, l]) => `<button data-act="fEst" data-v="${k}" aria-pressed="${filtro.est === k}">${l}</button>`).join('')}</div></div>
    <div class="list">${nov.map(rowNov).join('') || '<p class="muted" style="padding:16px 0">No hay novedades con este filtro.</p>'}</div></section>`;
}
export function vQR(): string {
  return `<div class="qrprint">${head('Piso 2 · un código por habitación y zona', '<b>Códigos QR</b> para la obra', `<div class="noprint" style="display:flex;gap:10px"><button class="btn pri" data-act="imprimir">${ic('printer')} Imprimir hoja</button><a class="btn" href="#novedades">${ic('back')} Novedades</a></div>`)}
  <p class="muted noprint">Escanea cualquiera con la cámara del celular: abre el formulario de novedad con la ubicación lista. También puedes tocar un código para probarlo aquí.</p>
  <div class="qrgrid">${UBICACIONES.map(([k, t]) => `<button class="card qr" data-act="qrProbar" data-v="${k}"><img data-qr="${k}" alt="Código QR de ${esc(t)}" width="130" height="130"><b>${k}</b><small>${esc(t)}</small></button>`).join('')}</div></div>`;
}

/* ================= ENTREGABLES ================= */
export function vEntregables(): string {
  return `${head('Criterios de recepción por etapa', '<b>Entregables</b> verificables', `<span class="pill neu" style="font-size:14px;padding:8px 14px">${entP().d} de ${entP().t} verificados</span>`)}
  <div class="g2">${(Object.keys(ENTREGABLES) as EtapaK[]).map((k) => { const e = entP(k); return `<section class="card"><div class="chead" style="align-items:center"><div style="display:flex;gap:14px;align-items:center"><div style="width:64px">${donutRing(e.p, ETAPAS[k].c, '', '')}</div><div><h2>Etapa ${k} · ${ETAPAS[k].s}</h2><p class="sub">${e.d} de ${e.t} verificados</p></div></div></div>
    ${ENTREGABLES[k].map(([t, v], i) => { const id = k + i; return `<label class="check ${S.ent[id] ? 'done' : ''}"><input type="checkbox" data-act="ent" data-v="${id}" ${S.ent[id] ? 'checked' : ''}><span class="bx">${ic('check', 3)}</span><span class="tx"><b>${esc(t)}</b><small>${esc(v)}</small></span></label>`; }).join('')}</section>`; }).join('')}</div>
  <p class="foot-note">El gemelo digital entregado es un modelo informacional del activo; no incluye conexión viva con sensores, BMS ni IoT.</p>`;
}

/* ================= HONORARIOS ================= */
export function vHonorarios(): string {
  const tot = total(), L = 2 * Math.PI * 80; let off = 0;
  const ks = Object.keys(ETAPAS) as EtapaK[];
  const segs = ks.map((k) => { const len = (fee(k) / tot) * L; const s = `<circle cx="100" cy="100" r="80" fill="none" stroke-width="26" stroke="${ETAPAS[k].c}" stroke-dasharray="${Math.max(0, len - 3)} ${L}" stroke-dashoffset="${-off}" transform="rotate(-90 100 100)"/>`; off += len; return s; }).join('');
  const ps = pagos();
  return `${head('Valores en pesos colombianos · propuesta v03', '<b>Honorarios</b> de la consultoría', `<div style="display:flex;gap:10px;flex-wrap:wrap">${segObra()}<div class="seg"><button data-act="iva" data-v="0" aria-pressed="${!S.iva}">Sin IVA</button><button data-act="iva" data-v="1" aria-pressed="${S.iva}">Con IVA</button></div></div>`)}
  <div class="g2">${([['solo', 'Solo BIM', 'Consultoría BIM independiente. Coordinador líder con dedicación cercana al 70% durante la obra.'], ['integrado', 'BIM + Construcción', 'BACO también ejecuta la obra: 40% menos solo en la Etapa C, de $23 M a $13,8 M por mes.']] as const).map(([k, t, d]) => `<button class="card" data-act="modo" data-v="${k}" style="text-align:left;display:flex;flex-direction:column;gap:10px;border:2px solid ${S.modo === k ? 'var(--teal)' : 'transparent'}"><div style="display:flex;justify-content:space-between;width:100%"><h2>${t}</h2>${S.modo === k ? '<span class="pill ok">Elegida</span>' : ''}</div><span style="font-size:clamp(28px,3vw,40px);font-weight:800;letter-spacing:-.02em;line-height:1">${cnt(iv(total(k)), 'M')}</span><span class="muted" style="font-size:13.5px">${d}</span></button>`).join('')}</div>
  <div class="g2">
    <section class="card"><div class="chead"><div><h2>Distribución por etapa</h2><p class="sub">Obra de ${S.obra} meses</p></div></div>
      <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 200 200" style="width:200px;height:200px;max-width:100%" role="img" aria-label="Distribución de honorarios"><circle cx="100" cy="100" r="80" fill="none" stroke-width="26" stroke="var(--soft)"/>${segs}<text x="100" y="96" text-anchor="middle" style="fill:var(--muted);font:700 13px var(--f)">Total ${S.iva ? 'con' : 'sin'} IVA</text><text x="100" y="122" text-anchor="middle" style="fill:var(--ink);font:800 24px var(--f)">${fmtM(iv(tot))}</text></svg>
      <div style="display:flex;flex-direction:column;gap:10px;flex:1;min-width:200px">${ks.map((k) => `<div style="display:flex;gap:10px;align-items:center;font-size:14px"><i style="width:12px;height:12px;border-radius:4px;background:${ETAPAS[k].c}"></i><span style="flex:1;color:var(--ink2)">${k} · ${ETAPAS[k].s}${k === 'C' ? ` (${S.obra} × ${fmtM(RATE[S.modo])})` : ''}</span><b>${fmtM(iv(fee(k)))}</b></div>`).join('')}
        <div style="display:flex;gap:10px;border-top:1px solid var(--line);padding-top:10px;font-size:14px"><span style="flex:1">Ahorro de la modalidad integrada</span><b style="color:var(--teal)">${fmtM(iv(total('solo') - total('integrado')))}</b></div></div></div></section>
    <section class="card"><div class="chead"><div><h2>Plan de pagos</h2><p class="sub">${ps.filter(paid).length} de ${ps.length} facturados al mes ${S.mes}</p></div>${stepper()}</div>
      <div class="list">${ps.map((p) => `<div class="lrow"><span class="pill ${paid(p) ? 'ok' : 'neu'}">${p.c === 'inicio' ? 'Inicio' : 'Fin'} M${p.mes}</span><div class="t"><b>Etapa ${p.et}</b><small>${esc(p.d)}</small></div><b>${fmtM(iv(p.v))}</b></div>`).join('')}</div></section>
  </div>
  <section class="card"><h2 style="margin-bottom:8px">Qué no incluye</h2><p class="desc" style="font-size:14px">Escaneo y modelado LOD 300, elaboración o firma de diseños, modelos LOD 400 de terceros, interventoría o dirección de obra, integración BMS/IoT/CMMS y licencias permanentes del propietario. Las etapas A, B y D son fijas: $111.000.000.</p></section>`;
}
