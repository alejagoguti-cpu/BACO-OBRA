// Capturas del módulo Novedades (servidor de desarrollo, ?demo): node tools/cap-nov.mjs
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const BASE = process.argv[2] || 'http://127.0.0.1:4321/BACO-OBRA/';
const OUT = 'build/cap/'; fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 300000, args: ['--no-sandbox', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-size=1600,900'] });
const page = await browser.newPage(); await page.setViewport({ width: 1600, height: 900 });
const errs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (n) => { await page.screenshot({ path: OUT + n + '.jpg', type: 'jpeg', quality: 78 }); console.log('shot', n); };
await page.goto(BASE + '?demo#novedades', { waitUntil: 'networkidle2', timeout: 120000 }); await espera(9000); await shot('n1-novedades');
await page.evaluate(() => document.querySelector('[data-nv="nueva"]')?.click()); await espera(800); await shot('n2-ubicar');
// tocar la habitación 216 (centro de su etiqueta)
const r = await page.evaluate(() => { const b = document.querySelector('.tw-roomtag[data-hab="216"]'); const q = b?.getBoundingClientRect(); return q ? { x: q.x + q.width / 2, y: q.y + q.height + 14 } : null; });
if (r) { await page.mouse.click(r.x, r.y); await espera(1200); }
await shot('n3-form');
await page.evaluate(() => document.querySelector('[data-nv="cancelar"]')?.click()); await espera(500);
await page.evaluate(() => document.querySelector('[data-nv="vista"][data-v="3d"]')?.click()); await espera(2200); await shot('n4-3d');
console.log(errs.slice(0, 15).join('\n') || 'sin errores');
await browser.close();
