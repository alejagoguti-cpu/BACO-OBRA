function renderLogin(): void {
  mostrarAcceso($('layer'), () => { void trasLogin(); });
}
async function trasLogin(): Promise<void> {
  cerrarAcceso();
  sincronizarPerfil();
  if (perfil) { conectarPresencia(perfil); toast(`Sesión iniciada · ${perfil.nombre}`); }
  $('layer').innerHTML = '';
  let pend = ''; try { pend = sessionStorage.getItem('baco-qr-pendiente') || ''; sessionStorage.removeItem('baco-qr-pendiente'); } catch { /* */ }
  const actual = location.hash.slice(1);
  const destino = pend ? 'qr-aprobar/' + pend : actual && !actual.startsWith('qr-') && actual !== 'nueva-clave' ? actual : 'mapa';
  if (location.hash === '#' + destino) void go(); else location.hash = destino;
}
function sincronizarPerfil(): void {
  if (!perfil) { S.rol = null; return; }
  S.rol = perfil.rol === 'contratista' ? 'contratista' : 'estelar';
  S.nombreUser = perfil.nombre;
  save();
}
