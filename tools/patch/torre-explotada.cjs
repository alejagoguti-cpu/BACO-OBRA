// Escena Cesium de La Fontana: precarga, resaltado de la Torre Suites con el resto atenuado,
// y axonometría explotada por pisos al hacer clic.
const fs = require('fs');
function edit(p, fn) { let s = fs.readFileSync(p, 'utf8'); const CR = s.includes('\r\n'); s = s.split('\r\n').join('\n'); s = fn(s); fs.writeFileSync(p, CR ? s.split('\n').join('\r\n') : s); }
function R(s, a, b) { if (!s.includes(a)) { console.error('NO ENCONTRADO:\n' + a.slice(0, 160)); process.exit(1); } return s.replace(a, () => b); }

/* ---------- revit.ts ---------- */
edit('src/revit.ts', (s) => {
  s = R(s, "      uNight: { type: Cesium.UniformType.FLOAT, value: 0 },\n      uLadrillo:", "      uNight: { type: Cesium.UniformType.FLOAT, value: 0 },\n      uHl: { type: Cesium.UniformType.FLOAT, value: 0 },\n      uLadrillo:");
  s = R(s, "        material.emissive = col * 0.14 * (1.0 - uNight);\n        \n      }", "        material.emissive = col * 0.14 * (1.0 - uNight) + vec3(0.95, 0.70, 0.32) * uHl * 0.20;\n        material.diffuse *= 1.0 + 0.12 * uHl;\n      }");
  s = R(s, "  setNight(n: number): void;\n  update(dt: number, now: number): void;\n}", "  setNight(n: number): void;\n  update(dt: number, now: number): void;\n  /** brillo dorado de la torre (0–1) */\n  setHighlight(v: number): void;\n  /** axonometría explotada: los niveles se separan en altura */\n  explode(): void;\n  readonly explotado: boolean;\n  /** índice del nivel al que pertenece un primitivo de Cesium (-1 si no es de la torre) */\n  nivelDe(prim: unknown): number;\n  /** resalta un nivel (en la vista explotada) */\n  marcarNivel(i: number): void;\n}");
  s = R(s, "    full() {\n      api.visible = true;\n      api.abierto = -1;", "    full() {\n      api.visible = true;\n      api.abierto = -1;\n      explotado = false;");
  s = R(s, "    setNight(v: number) {\n      shader.setUniform('uNight', v);\n    },", `    setNight(v: number) {
      shader.setUniform('uNight', v);
    },
    setHighlight(v: number) { shader.setUniform('uHl', v); },
    get explotado() { return explotado; },
    explode() {
      api.visible = true; api.abierto = -1; explotado = true;
      const now = performance.now();
      for (const n of niveles) {
        n.shown = true; place(n);
        n.anim = { o0: n.off, o1: n.i * SEPARACION, start: now + n.i * 110, dur: 1300 };
      }
    },
    nivelDe(prim: unknown) { return niveles.find((n) => n.model === prim)?.i ?? -1; },
    marcarNivel(i: number) {
      for (const n of niveles) {
        n.model.color = n.i === i ? Cesium.Color.fromCssColorString('#E8B44A') : Cesium.Color.WHITE;
        n.model.colorBlendMode = Cesium.ColorBlendMode.MIX;
        n.model.colorBlendAmount = n.i === i ? 0.35 : 0;
      }
    },`);
  s = R(s, "  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);", "  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);\n  const SEPARACION = 9; // m entre niveles en la vista explotada\n  let explotado = false;");
  return s;
});

/* ---------- site.ts: atenuar todo menos la torre ---------- */
edit('src/site.ts', (s) => {
  s = R(s, "  buildingAt(world: Cesium.Cartesian3): Building | null;\n}", "  buildingAt(world: Cesium.Cartesian3): Building | null;\n  /** 0 = normal, 1 = contexto opaco/atenuado (la torre en remodelación queda protagonista) */\n  setAtenuado(v: number): void;\n}");
  s = R(s, "      scene.primitives.add(model);\n      if (s.kind === 'arboles') treeModels.push(model);", "      scene.primitives.add(model);\n      todos.push({ model, suelo: s.kind === 'suelo' });\n      if (atenuado > 0) atenuar(model, s.kind === 'suelo');\n      if (s.kind === 'arboles') treeModels.push(model);");
  s = R(s, "  const state = { total: queue.length, loaded: 0, failed: [] as string[] };", `  const state = { total: queue.length, loaded: 0, failed: [] as string[] };
  const todos: { model: Cesium.Model; suelo: boolean }[] = [];
  let atenuado = 0;
  const gris = Cesium.Color.fromCssColorString('#d9d4cb');
  const atenuar = (m: Cesium.Model, suelo: boolean) => {
    const a = atenuado;
    m.color = a > 0 ? gris.withAlpha(suelo ? 1 : 1 - 0.55 * a) : Cesium.Color.WHITE;
    m.colorBlendMode = Cesium.ColorBlendMode.MIX;
    m.colorBlendAmount = a * (suelo ? 0.35 : 0.7);
  };`);
  s = R(s, "    setTreesVisible(v: boolean) {", "    setAtenuado(v: number) { atenuado = v; for (const t of todos) atenuar(t.model, t.suelo); },\n    setTreesVisible(v: boolean) {");
  return s;
});

/* ---------- main.ts ---------- */
edit('src/main.ts', (s) => {
  // precarga silenciosa: el arranque automático del hotel espera a que se entre al sitio
  s = R(s, "async function autoPlayHotel(): Promise<void> {\n  if (autoPlayed) return;", "async function autoPlayHotel(): Promise<void> {\n  if (modo !== 'sitio') { autoPendiente = true; return; }\n  if (autoPlayed) return;");
  s = R(s, "let autoPlayed = false;", "let autoPlayed = false;\nlet autoPendiente = false;");
  s = R(s, "  cam.flyTo({ pivot: HOTEL_PIVOT(), heading: 0.55, pitch: -0.42, range: 260 }, 3.2);\n  document.body.dataset.modo = 'sitio';", "  cam.flyTo({ pivot: HOTEL_PIVOT(), heading: 0.55, pitch: -0.42, range: 260 }, 3.2);\n  document.body.dataset.modo = 'sitio';\n  if (autoPendiente) { autoPendiente = false; setTimeout(() => void autoPlayHotel(), 1200); }");
  // cursor sobre la torre: brillo dorado + contexto atenuado; en la vista explotada se marca el nivel
  s = R(s, "cam.onPick = (world) => {\n  if (!site || modo !== 'sitio') return;\n  select(world ? site.buildingAt(world) : null);\n};", `let sobreTorre = false; let nivelHover = -1; let ultHover = 0;
let hl = 0, hlObj = 0, aten = 0, atenObj = 0;
function hoverTorre(e: PointerEvent): void {
  if (modo !== 'sitio' || !revit?.visible || cam.isWalking || e.buttons) return;
  const now = performance.now(); if (now - ultHover < 60) return; ultHover = now;
  const r = container.getBoundingClientRect();
  const p = scene.pick(new Cesium.Cartesian2(e.clientX - r.left, e.clientY - r.top)) as { primitive?: unknown } | undefined;
  const i = revit.nivelDe(p?.primitive);
  sobreTorre = i >= 0;
  if (revit.explotado) { if (i !== nivelHover) { nivelHover = i; revit.marcarNivel(i); window.dispatchEvent(new CustomEvent('hlf:nivel', { detail: i })); } }
  hlObj = sobreTorre || revit.explotado ? 1 : 0; atenObj = sobreTorre || revit.explotado ? 1 : 0;
  container.style.cursor = sobreTorre ? 'pointer' : '';
}
container.addEventListener('pointermove', hoverTorre);
container.addEventListener('pointerleave', () => { if (!revit?.explotado) { sobreTorre = false; hlObj = 0; atenObj = 0; } });
scene.preRender.addEventListener(() => {
  if (Math.abs(hl - hlObj) > 0.005) { hl += (hlObj - hl) * 0.14; revit?.setHighlight(hl); }
  if (Math.abs(aten - atenObj) > 0.005) { aten += (atenObj - aten) * 0.12; site?.setAtenuado(aten < 0.01 ? 0 : aten); }
});
/** clic sobre la torre: axonometría explotada por piso (o, ya explotada, entrar al piso tocado) */
function explotarTorre(): void {
  if (!revit) return;
  stopOrbit(); select(null);
  revit.explode(); hlObj = 1; atenObj = 1;
  const c = revit.caja;
  cam.flyTo({ pivot: enuToWorld((c[0] + c[2]) / 2, (c[1] + c[3]) / 2, 38), heading: 0.55, pitch: -0.3, range: 330 }, 2.2);
  window.dispatchEvent(new CustomEvent('hlf:explotado', { detail: revit.niveles }));
}
function recomponerTorre(): void {
  if (!revit) return;
  revit.full(); revit.marcarNivel(-1); nivelHover = -1; hlObj = 0; atenObj = 0;
  cam.flyTo({ pivot: HOTEL_PIVOT(), heading: 0.55, pitch: -0.42, range: 260 }, 2.0);
  window.dispatchEvent(new CustomEvent('hlf:recompuesto'));
}
cam.onPick = (world) => {
  if (!site || modo !== 'sitio') return;
  if (revit?.explotado) { if (nivelHover >= 0) window.dispatchEvent(new CustomEvent('hlf:entrarNivel', { detail: nivelHover })); return; }
  if (sobreTorre && revit) { explotarTorre(); return; }
  select(world ? site.buildingAt(world) : null);
};`);
  s = R(s, "(window as unknown as { HLF: unknown }).HLF = { entrar, vistaColombia, volarA, viewer, get modo() { return modo; },", "(window as unknown as { HLF: unknown }).HLF = { entrar, vistaColombia, volarA, viewer, get modo() { return modo; },\n  /** empieza a cargar el sitio y el Revit en segundo plano (sin mover la cámara ni mostrar la carga) */\n  precargar: () => { booting ??= boot().catch((e) => { console.warn('precarga', e); booting = null; }); },\n  explotar: () => explotarTorre(), recomponer: () => recomponerTorre(), get explotado() { return !!revit?.explotado; },");
  return s;
});
console.log('ok');
