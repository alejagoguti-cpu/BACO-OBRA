import puppeteer from 'puppeteer-core';
const rutas = (process.argv[2] || 'bim,novedades,novedades/hab/216').split(',');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 300000, args: ['--no-sandbox', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-size=1600,900'] });
const p = await b.newPage(); await p.setViewport({ width: 1600, height: 900 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
await p.goto('http://127.0.0.1:4321/BACO-OBRA/?demo#' + rutas[0], { waitUntil: 'networkidle2', timeout: 120000 }); await w(12000);
for (const [i, r] of rutas.entries()) {
  if (i) { await p.evaluate((h) => { location.hash = h; }, r); await w(9000); }
  await p.screenshot({ path: `build/cap/u${i}-${r.replace(/\W/g, '_')}.jpg`, type: 'jpeg', quality: 75 });
}
console.log(errs.slice(0, 8).join('\n') || 'sin errores'); await b.close();
