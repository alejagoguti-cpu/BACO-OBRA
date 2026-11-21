/* ---------------- personas sobre la planta ---------------- */
let gente: HTMLElement | null = null; let firmaGente = ''; let personaSel: string | null = null;
const ESP_NOMBRE: Record<string, string> = { ele: 'Electricidad', hid: 'Hidrosanitaria', arq: 'Obra civil / arquitectura', coo: 'Supervisión', est: 'Estructura', rci: 'Contra incendios', hvac: 'HVAC', des: 'Desagües', aca: 'Acabados', mob: 'Mobiliario' };
const colorPersona = (p: Persona) => (p.especialidad ? espCol(p.especialidad) : '#8F9DAA');
const avatarStyle = (p: Persona) => { const f = fotoDe(p); return f ? `background-image:url('${f}')` : ''; };
const centroHab = (num: string): [number, number, number] | null => {
  const h = stage?.habitaciones.find((x) => x.numero === num); if (!h) return null;
  const n = h.contorno.length; return [h.contorno.reduce((a, q) => a + q[0], 0) / n, 3.1, h.contorno.reduce((a, q) => a + q[1], 0) / n];
};
function dibujarGente(): void {
  if (!stage || !ui) return;
  if (!gente || !gente.isConnected) { gente = document.createElement('div'); gente.className = 'nv-gente'; ui.parentElement?.insertBefore(gente, ui); gente.addEventListener('click', (ev) => { const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-per]'); if (b) { personaSel = b.dataset.per!; sel = null; render(); } }); }
  const grupos = stage.habitaciones.map((h) => ({ num: h.numero, gente: enHabitacion(h.numero), c: centroHab(h.numero) })).filter((g) => g.gente.length && g.c);
  const f = grupos.map((g) => g.num + ':' + g.gente.map((x) => x.p.id + x.estado + (fotoDe(x.p) ? 1 : 0)).join(',')).join('|') + '#' + personaSel;
  if (f !== firmaGente) {
    firmaGente = f;
    gente.innerHTML = grupos.map((g) => {
      const vis = g.gente.slice(0, 4), resto = g.gente.length - vis.length;
      return vis.map(({ p, estado }) => `<button class="nv-per ${estado} ${p.id === personaSel ? 'on' : ''}" data-per="${p.id}" data-hab="${g.num}" style="--ring:${estado === 'dentro' ? '#1E9A62' : '#B8C0C8'};--c:${colorPersona(p)}" title="${esc(p.nombre)} · ${esc(p.area || 'área sin registrar')} · ${estado === 'dentro' ? 'en la habitación' : 'asignado'}"><span class="av" style="${avatarStyle(p)}">${fotoDe(p) ? '' : esc(iniciales(p.nombre))}</span><span class="es"></span><span class="nm">${esc(p.nombre.split(' ')[0])}</span></button>`).join('')
        + (resto > 0 ? `<span class="nv-per" data-hab="${g.num}" data-mas="1"><span class="nv-mas">+${resto}</span></span>` : '');
    }).join('');
  }
  // posiciones: en rejilla bajo el número de la habitación
  const offs: Record<string, number> = {};
  gente.querySelectorAll<HTMLElement>('[data-hab]').forEach((el) => {
    const num = el.dataset.hab!; const c = centroHab(num); if (!c) return;
    const pr = stage!.proyectar(c); const k = offs[num] = (offs[num] ?? -1) + 1;
    const n = Math.min(5, grupos.find((g) => g.num === num)?.gente.length ?? 1);
    el.style.display = pr.visible ? '' : 'none';
    el.style.transform = `translate(${pr.x + (k - (n - 1) / 2) * 30}px, ${pr.y + 34}px)`;
  });
}
function caraHtml(p: Persona, estado: 'dentro' | 'asignado', extra = ''): string {
  return `<button class="nv-cara ${estado}" data-nv="persona" data-v="${p.id}" style="--ring:${estado === 'dentro' ? '#1E9A62' : '#B8C0C8'}"><i style="${avatarStyle(p)}">${fotoDe(p) ? '' : esc(iniciales(p.nombre))}</i>${esc(p.nombre.split(' ').slice(0, 2).join(' '))}<small>${esc(p.area || '—')}${extra}</small></button>`;
}
function uiEquipo(): string {
  const todos = listaPersonal();
  if (!todos.length) return '';
  const ed = puedeEditar(perfil);
  if (filtro.hab) {
    const g = enHabitacion(filtro.hab);
    const libres = todos.filter((p) => !g.some((x) => x.p.id === p.id));
    return `<section class="nv-equipo"><span class="tw-lbl">Equipo · habitación ${esc(filtro.hab)}<em class="nv-st st-${g.some((x) => x.estado === 'dentro') ? 'resuelta' : 'cerrada'}">${g.filter((x) => x.estado === 'dentro').length} en obra</em></span>
      <div class="nv-caras">${g.length ? g.map(({ p, estado }) => caraHtml(p, estado)).join('') : '<small class="tw-muted">Nadie asignado ni con check-in hoy.</small>'}</div>
      ${ed ? `<select data-nvf="asignar" data-hab="${esc(filtro.hab)}"><option value="">+ Asignar persona a la ${esc(filtro.hab)}…</option>${libres.map((p) => `<option value="${p.id}">${esc(p.nombre)} · ${esc(p.area || 'sin área')}</option>`).join('')}</select>` : ''}</section>`;
  }
  const dentro = todos.filter((p) => dentroAhora(p.id)).length;
  const asig = todos.filter((p) => !dentroAhora(p.id) && habitacionesDe(p.id).length).length;
  const libres = sinUbicar();
  return `<section class="nv-equipo"><span class="tw-lbl">Equipo en obra hoy</span>
    <div class="nv-leyenda"><span><i style="background:#1E9A62"></i>${dentro} con check-in</span><span><i style="background:#B8C0C8"></i>${asig} asignados</span><span><i style="background:#E5E8EC;border:1px solid #B8C0C8"></i>${libres.length} sin ubicar</span></div>
    ${libres.length ? `<div class="nv-caras">${libres.slice(0, 8).map((p) => caraHtml(p, 'asignado')).join('')}${libres.length > 8 ? `<small class="tw-muted">+${libres.length - 8} más</small>` : ''}</div>` : ''}
    <small class="tw-muted">Toca una habitación para ver su equipo${puedeEditar(perfil) ? ' y asignar personas' : ''}. El check-in se hace con el QR de cada habitación.</small></section>`;
}
function uiPersona(): string {
  const p = listaPersonal().find((x) => x.id === personaSel); if (!p) return '';
  const hab = dentroAhora(p.id); const asigs = habitacionesDe(p.id); const ed = puedeEditar(perfil);
  const habs = stage?.habitaciones.map((h) => h.numero) ?? [];
  return `<aside class="tw-card tw-panel nv-det">
    <div class="tw-phead"><div><span class="tw-over">Equipo de obra</span></div><button class="tw-ico sm" data-nv="cerrarPersona" aria-label="Cerrar">${ic('x')}</button></div>
    <div class="nv-perfil"><span class="foto" style="${avatarStyle(p)}">${fotoDe(p) ? '' : esc(iniciales(p.nombre))}</span><div><h3>${esc(p.nombre)}</h3><p class="tw-muted" style="margin:0">${esc(p.area || 'Área sin registrar en el listado')}</p></div></div>
    <dl class="tw-dl">
      <div><dt>Especialidad</dt><dd><span class="tw-chip"><i style="background:${colorPersona(p)}"></i>${esc(p.especialidad ? ESP_NOMBRE[p.especialidad] ?? p.especialidad : 'Sin definir')}</span></dd></div>
      <div><dt>Contratista</dt><dd>${esc(p.contratista || '—')}</dd></div>
      <div><dt>Ahora</dt><dd>${hab ? `<b style="color:#16774B">En la habitación ${esc(hab)}</b> (check-in de hoy)` : '<span class="tw-muted">Sin check-in hoy</span>'}</dd></div>
      <div><dt>Asignado a</dt><dd>${asigs.length ? asigs.map((h) => `Hab. ${esc(h)}${ed ? ` <button class="tw-btn ghost" style="padding:0 4px;font-size:11px" data-nv="quitarAsig" data-v="${p.id}|${esc(h)}">quitar</button>` : ''}`).join(' · ') : '—'}</dd></div>
    </dl>
    ${ed ? `<select class="nv-equipo" data-nvf="asignar" data-pid="${p.id}"><option value="">+ Asignar a una habitación…</option>${habs.filter((h) => !asigs.includes(h)).map((h) => `<option value="${h}">Habitación ${h}</option>`).join('')}</select>` : ''}
  </aside>`;
}
