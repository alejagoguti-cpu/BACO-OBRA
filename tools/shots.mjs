// Capturas de prueba: node tools/shots.mjs <baseUrl> <salida> ruta1 ruta2 ...  (ruta "w:390" cambia a ancho de celular)
import puppeteer from 'puppeteer-core';
const [base, out, ...rutas] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errores.push('console: ' + m.text().slice(0, 200)); });
let w = 1440, h = 900;
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
let first = true;
for (const r of rutas) {
  if (r.startsWith('w:')) { w = +r.slice(2); h = w < 600 ? 844 : 900; await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 }); continue; }
  const [ruta, espera = '2500'] = r.split('@');
  if (first) { await page.goto(base + '#' + ruta, { waitUntil: 'domcontentloaded' }); first = false; }
  else await page.evaluate((x) => { location.hash = x; }, ruta);
  await new Promise((res) => setTimeout(res, +espera));
  const f = `${out}/${ruta.replace(/[^a-z0-9-]/gi, '_') || 'inicio'}_${w}.png`;
  await page.screenshot({ path: f });
  console.log('ok', f);
}
console.log(errores.length ? errores.slice(0, 12).join('\n') : 'sin errores de consola');
await browser.close();
