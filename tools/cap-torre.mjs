import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 300000, args: ['--no-sandbox', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-size=1600,900'] });
const p = await b.newPage(); await p.setViewport({ width: 1600, height: 900 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (n) => p.screenshot({ path: `build/cap/${n}.jpg`, type: 'jpeg', quality: 78 });
await p.goto('http://127.0.0.1:4321/BACO-OBRA/?demo#mapa', { waitUntil: 'networkidle2', timeout: 120000 });
await w(40000); // tiempo en el mapa: la precarga avanza
const t0 = Date.now();
await p.evaluate(() => { location.hash = 'hoteles/la-fontana'; });
await p.waitForFunction(() => document.body.dataset.modo === 'sitio', { timeout: 120000 });
console.log('llegada al sitio en', ((Date.now() - t0) / 1000).toFixed(1), 's');
await w(6000); await shot('t1-llegada');
// buscar un punto de la torre recorriendo la pantalla
const pt = await p.evaluate(() => { const H = window.HLF, v = H.viewer; const r = v.canvas.getBoundingClientRect();
  for (let y = 300; y < 800; y += 25) for (let x = 500; x < 1400; x += 25) { const o = v.scene.pick({ x: x - r.left, y: y - r.top }); if (o && o.primitive && window.__DBG__.getRevit() && window.__DBG__.getRevit().nivelDe(o.primitive) >= 0) return { x, y }; } return null; });
console.log('torre en', JSON.stringify(pt));
if (pt) { await p.mouse.move(pt.x, pt.y); await w(1500); await shot('t2-hover'); await p.mouse.click(pt.x, pt.y); await w(4500); await shot('t3-explotada'); }
console.log(errs.slice(0, 8).join('\n') || 'sin errores'); await b.close();
