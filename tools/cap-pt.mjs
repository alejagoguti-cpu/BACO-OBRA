import puppeteer from 'puppeteer-core';
const [ruta, x, y] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--window-size=1600,900'] });
const p = await b.newPage(); await p.setViewport({ width: 1600, height: 900 });
await p.goto('http://127.0.0.1:4321/BACO-OBRA/?demo#' + ruta, { waitUntil: 'networkidle2', timeout: 120000 }); await new Promise((r) => setTimeout(r, 9000));
console.log(await p.evaluate((x, y) => document.elementsFromPoint(x, y).slice(0, 6).map((e) => e.tagName + '.' + e.className + ' "' + (e.textContent || '').trim().slice(0, 40) + '" z=' + getComputedStyle(e).zIndex).join('\n'), +x, +y));
console.log(await p.evaluate(() => { const t = document.getElementById('topbar'); const s = getComputedStyle(t); return 'topbar z=' + s.zIndex + ' pos=' + s.position + ' hidden=' + t.hidden; }));
await b.close();
