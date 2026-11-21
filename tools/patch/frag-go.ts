  document.body.classList.toggle('con-sesion', !!perfil);
  if (h === 'nueva-clave') { $('rail').hidden = true; $('topbar').hidden = true; mostrarNuevaClave($('layer'), () => { $('layer').innerHTML = ''; location.hash = 'mapa'; }); return; }
  if (h.startsWith('qr-aprobar/')) {
    const [, id, nonce] = h.split('/');
    $('rail').hidden = true; $('topbar').hidden = true; ocultarWorkspace();
    await mostrarAprobacion($('layer'), id, nonce, () => renderLogin());
    return;
  }
  if (!perfil && base !== 'reportar') {
    $('rail').hidden = true; $('topbar').hidden = true; $('page').innerHTML = ''; $('page').className = ''; $('ov').innerHTML = '';
    bim?.cerrar(); $('bim').hidden = true; ocultarWorkspace();
    renderLogin();
    return;
  }
  // área espacial del gemelo (#fontana…): la sidebar sigue visible
  const rt = parseRuta(h);
  if (rt) {
    $('rail').hidden = false; $('topbar').hidden = false;
    $('page').innerHTML = ''; $('page').className = ''; $('ov').innerHTML = '';
    bim?.cerrar(); $('bim').hidden = true; pausarMapa(true); cerrarHoja();
    const tw = $('twin'); const desdeMapa = tw.hidden; tw.hidden = false;
    if (desdeMapa) { tw.style.transition = 'none'; tw.style.opacity = '0'; requestAnimationFrame(() => requestAnimationFrame(() => { tw.style.transition = 'opacity .9s ease'; tw.style.opacity = '1'; })); }
    renderChrome();
    await abrirWorkspace(rt);
    renderChrome();
    return;
  }
  ocultarWorkspace();
  if (h === 'hoteles/bogota' || h === 'hoteles/la-fontana') {
    $('rail').hidden = false; $('topbar').hidden = false; $('page').innerHTML = ''; $('page').className = ''; bim?.cerrar(); $('bim').hidden = true;
    renderChrome();
    const bog = HOTELES.filter((x) => x.ciudad === 'Bogotá');
    const fon = HOTELES.find((x) => x.id === 'fontana')!;
    $('ov').innerHTML = h === 'hoteles/bogota'
      ? `<aside class="mapcard"><div class="glass hlist" style="max-height:none"><p class="map-eyebrow">BOGOTÁ · ${bog.length} HOTELES</p>${bog.map((x) => `<button class="hrow ${x.obra ? 'obra' : ''}" data-act="hotel" data-v="${x.id}"><span class="pin">${ic(x.obra ? 'build' : 'pin', 2)}</span><span><b>${esc(x.nombre)}</b><small>${esc(x.dir)}${x.obra ? '' : ' · ubicación aproximada'}</small></span></button>`).join('')}</div></aside>`
      : `<aside class="hcard glass fontana-card"><p class="map-eyebrow">BOGOTÁ · USAQUÉN</p><h2 style="font-size:24px;font-weight:800;margin:2px 0">Hotel Estelar La Fontana</h2><p class="muted" style="font-size:13.5px">${esc(fon.dir)}</p><p class="muted" style="font-size:12.5px">Modelo Revit de la Torre Suites georreferenciado sobre el sitio.</p><a class="btn coral block cta" href="#fontana">${ic('cube', 2)} Explorar gemelo digital <span class="go">${ic('arrowR', 2.2)}</span></a></aside>`;
    const hlf = await cargarMapa(); pausarMapa(false);
    if (route !== h) return;
    if (h === 'hoteles/bogota') { pines?.show(true); hlf.volarA(-74.06, 4.66, 42000, 2.8); }
    else { pines?.show(false); await hlf.entrar(); }
    return;
  }
