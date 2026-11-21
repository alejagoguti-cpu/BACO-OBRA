// Capturas del flujo del gemelo en el servidor de desarrollo: node tools/cap-twin.mjs [base]
import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] || 'http://127.0.0.1:4321/BACO-OBRA/';
const OUT = 'build/cap/';
import fs from 'node:fs'; fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 300000, args: ['--no-sandbox', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-size=1600,900'] });
const page = await browser.newPage(); await page.setViewport({ width: 1600, height: 900 });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (n) => { await page.screenshot({ path: OUT + n + '.jpg', type: 'jpeg', quality: 78 }); console.log('shot', n); };

await page.goto(BASE + '#mapa', { waitUntil: 'networkidle2', timeout: 120000 }); await espera(3500); await shot('01-login');
await page.goto(BASE + '?demo#fontana', { waitUntil: 'networkidle2', timeout: 120000 }); await espera(9000); await shot('02-edificio');
// seleccionar el edificio con un clic al centro del canvas
const c = await page.$('#twin canvas'); const bb = await c.boundingBox();
await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await espera(1800); await shot('03-edificio-sel');
await page.evaluate(() => { location.hash = 'fontana/bim'; }); await espera(4200); await shot('04-explosion');
await espera(7000); await shot('05-planta');
await page.evaluate(() => { const b = document.querySelector('.tw-roomtag[data-hab="216"]'); b && b.click(); }); await espera(2500); await shot('06-hab216');
await page.evaluate(() => { location.hash = 'fontana/216/gemelo'; }); await espera(12000); await shot('07-gemelo');
const c2 = await page.$('#twRoom canvas'); const b2 = await c2.boundingBox();
await page.mouse.click(b2.x + b2.width * 0.5, b2.y + b2.height * 0.6); await espera(2500); await shot('08-ficha');
for (let k = 0; k < 4; k++) { await page.evaluate(() => document.querySelector('[data-tw="vista"][data-v="recorrido"]')?.click()); await espera(300); }
await espera(2200); await shot('10-recorrido');
for (let k = 1; k <= 3; k++) { await page.evaluate(() => document.querySelector('[data-tw="paso"][data-v="1"]')?.click()); await espera(2300); await shot('11-paso' + k); }
await page.evaluate(() => { location.hash = 'plan'; }); await espera(2500); await shot('09-plan-sidebar');
console.log(errs.slice(0, 15).join('\n') || 'sin errores');
await browser.close();
