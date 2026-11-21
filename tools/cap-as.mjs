import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] || 'http://127.0.0.1:4321/BACO-OBRA/';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--window-size=1600,900'] });
const p = await b.newPage(); await p.setViewport({ width: 1600, height: 900 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
await p.goto(BASE + '?demo#asistente', { waitUntil: 'networkidle2' }); await new Promise((r) => setTimeout(r, 2500));
for (const q of ['¿Cuál es la especialidad más atrasada?', '¿Qué actividades están programadas para mañana?', '¿Quién es el responsable de la habitación 216?']) {
  await p.evaluate((q) => { const f = document.getElementById('fAs'); f.q.value = q; f.requestSubmit(); }, q); await new Promise((r) => setTimeout(r, 900));
}
await p.screenshot({ path: 'build/cap/a1-asistente.jpg', type: 'jpeg', quality: 78 });
await p.evaluate(() => { location.hash = 'resumen'; }); await new Promise((r) => setTimeout(r, 1500));
await p.evaluate(() => document.querySelector('[data-act="asAbrir"]').click()); await new Promise((r) => setTimeout(r, 700));
await p.screenshot({ path: 'build/cap/a2-panel.jpg', type: 'jpeg', quality: 78 });
console.log(errs.join('\n') || 'sin errores'); await b.close();
