import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-size=1600,900'] });
const p = await b.newPage(); await p.setViewport({ width: 1600, height: 900 });
const errs = []; p.on('response', (r) => { if (r.status() >= 400) errs.push('URL ' + r.status() + ' ' + r.url().slice(0, 160)); }); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warn' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 700)); });
await p.goto('http://127.0.0.1:4321/BACO-OBRA/?demo#mapa', { waitUntil: 'networkidle2', timeout: 120000 });
for (const [t, n] of [[2500, 'm1'], [4500, 'm2'], [9000, 'm3']]) { await new Promise((r) => setTimeout(r, t)); await p.screenshot({ path: `build/cap/${n}.jpg`, type: 'jpeg', quality: 78 }); }
await p.evaluate(() => document.querySelector('[data-act="mapRecorrido"]').click()); await new Promise((r) => setTimeout(r, 7000));
await p.screenshot({ path: 'build/cap/m4.jpg', type: 'jpeg', quality: 78 });
console.log(errs.join('\n') || 'sin errores'); await b.close();
