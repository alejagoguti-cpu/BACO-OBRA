import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 300000, args: ['--no-sandbox', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-size=1600,900'] });
const p = await b.newPage(); await p.setViewport({ width: 1600, height: 900 });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
p.goto('http://127.0.0.1:4321/BACO-OBRA/?demo#mapa', { timeout: 120000 }).catch(() => {});
let t = 0; for (const ms of [1500, 1500, 2000, 2000, 3000, 4000, 6000]) { await w(ms); t += ms; await p.screenshot({ path: `build/cap/s${t}.jpg`, type: 'jpeg', quality: 60 }); }
console.log('ok'); await b.close();
