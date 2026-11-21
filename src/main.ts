import './cesium-base';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import * as Cesium from 'cesium';
import { ASSETS, PLACES, VIEWS } from './config';
import { ArchCamera } from './arch-camera';
import { loadSite, enuToWorld, siteMatrix, type Site, type Building } from './site';
import { createTrafico, type Trafico } from './vehiculos';
import { loadRevitHotel, createPisosPanel, type RevitHotel } from './revit';
import { gradeStage, skyStage } from './shaders';
import { createLookStudio, hexToRgbNorm, type LookParams, type PresetId } from './look-studio';
import { luzDeHora, lluviaStage, crearPanelTiempo, aplicarFiltro, type Clima, type Filtro } from './tiempo';
import { createMasterplanPins } from './pins';

/* ============================================================
   UNICENTRO · Hotel La Fontana · visor arquitectónico
   CesiumJS + 3D Tiles reales + edificaciones y vegetación del proyecto Unreal
   ============================================================ */

Cesium.Ion.defaultAccessToken = ASSETS.ionToken;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
const container = $('cesiumContainer')!;
const loadingEl = $('loading')!;
const loadBar = $('loadBar')!;
const loadLabel = $('loadLabel')!;
const loadPct = $('loadPct')!;

function progress(label: string, ratio: number): void {
  loadLabel.textContent = label;
  const p = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  loadBar.style.width = p + '%';
  loadPct.textContent = p + '%';
}

/* ------------------------------------------------------------ espectador */

const viewer = new Cesium.Viewer(container, {
  animation: false,
  timeline: false,
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  fullscreenButton: false,
  infoBox: false,
  selectionIndicator: false,
  shadows: true,
  terrainShadows: Cesium.ShadowMode.RECEIVE_ONLY,
  terrain: Cesium.Terrain.fromWorldTerrain({ requestWaterMask: false, requestVertexNormals: true }),
  baseLayer: Cesium.ImageryLayer.fromProviderAsync(Cesium.IonImageryProvider.fromAssetId(ASSETS.imageryAssetId), {}),
  contextOptions: {
    webgl: { alpha: false, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false },
  },
  requestRenderMode: false,
  useBrowserRecommendedResolution: false,
});

const scene = viewer.scene;
scene.globe.enableLighting = true;
scene.globe.showGroundAtmosphere = true;
scene.globe.depthTestAgainstTerrain = true;
scene.globe.maximumScreenSpaceError = 2;
scene.fog.enabled = false;
scene.fog.density = 0.00018;
scene.fog.minimumBrightness = 0.04;
scene.highDynamicRange = true;
scene.msaaSamples = 4;
scene.postProcessStages.fxaa.enabled = true;
scene.screenSpaceCameraController.enableCollisionDetection = false;
scene.light = new Cesium.SunLight({ intensity: 3.0, color: Cesium.Color.fromCssColorString('#fff4e3') });

// sombras suaves de alta resolución estilo Unreal
const sm = viewer.shadowMap;
sm.softShadows = true;
sm.size = 4096;
sm.maximumDistance = 1200;
sm.darkness = 0.24;
sm.normalOffset = true;
// sesgo de profundidad ajustado: contacto firme en bases y sin rayado en muros/cubiertas
{
  const bias = sm as unknown as { _primitiveBias: { depthBias: number; normalOffsetScale: number; normalShadingSmooth: number }; _terrainBias: { depthBias: number } };
  bias._primitiveBias.depthBias = 0.0008;
  bias._primitiveBias.normalOffsetScale = 1.6;
  bias._primitiveBias.normalShadingSmooth = 0.35;
}

// oclusión ambiental: contacto en aleros, nichos y bases de edificios
const ao = scene.postProcessStages.ambientOcclusion;
ao.enabled = true;
ao.uniforms.intensity = 2.1;
ao.uniforms.bias = 0.08;
ao.uniforms.lengthCap = 0.35;
ao.uniforms.stepSize = 1.4;
ao.uniforms.blurStepSize = 1.0;

// bloom sutil en reflejos solares y ventanas nocturnas
const bloom = scene.postProcessStages.bloom;
bloom.enabled = true;
bloom.uniforms.glowOnly = false;
bloom.uniforms.contrast = 128;
bloom.uniforms.brightness = -0.36;
bloom.uniforms.delta = 1.0;
bloom.uniforms.sigma = 2.6;
bloom.uniforms.stepSize = 1.5;

// cielo andino con nubes animadas + etalonaje fílmico estilo Unreal
const smat = siteMatrix();
const axis = (col: number) => {
  const c = Cesium.Matrix4.getColumn(smat, col, new Cesium.Cartesian4());
  return new Cesium.Cartesian3(c.x, c.y, c.z);
};
const sky = skyStage(axis(0), axis(1), axis(2));
scene.postProcessStages.add(sky);
const grade = gradeStage();
scene.postProcessStages.add(grade);

(viewer.camera.frustum as Cesium.PerspectiveFrustum).fov = Cesium.Math.toRadians(48);

/* ------------------------------------------------------------ calidad adaptable */

// gráficas integradas: arranca en calidad media para que orbitar sea fluido
const glInfo = (() => { try { const gl = (scene as unknown as { context: { _gl: WebGL2RenderingContext } }).context._gl; const e = gl.getExtension("WEBGL_debug_renderer_info"); return e ? String(gl.getParameter(e.UNMASKED_RENDERER_WEBGL)) : ""; } catch { return ""; } })();
const integrated = /Intel|UHD|Iris|Mali|Adreno|Apple GPU|SwiftShader/i.test(glInfo) && !/Arc/i.test(glInfo);
let site: Site | null = null;
let quality = integrated || matchMedia("(pointer: coarse)").matches ? 0.5 : 1;
function applyQuality(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // nunca por debajo de la resolución nativa de la pantalla (si no, se ve pixeleado)
  viewer.resolutionScale = dpr; // siempre HD: al bajar calidad se recortan sombras/AO, nunca la resolución
  sm.size = quality >= 1 ? 4096 : quality >= 0.5 ? 2048 : 1024;
  sm.softShadows = quality >= 0.5;
  ao.enabled = quality >= 1;
  bloom.enabled = quality >= 0.5;
  scene.msaaSamples = quality >= 0.5 ? 4 : 2; // bordes y hojas sin escalones
  viewer.shadows = quality >= 0.5;
  if (site?.tileset) site.tileset.maximumScreenSpaceError = quality >= 1 ? 8 : quality >= 0.5 ? 12 : 20;
}
applyQuality();

viewer.clock.shouldAnimate = false;
viewer.clock.currentTime = Cesium.JulianDate.fromIso8601('2026-06-21T16:50:00-05:00');

const cam = new ArchCamera(viewer);
const placeWorld = (key: keyof typeof PLACES) => enuToWorld(PLACES[key].e, PLACES[key].n, PLACES[key].u);
cam.flyTo({ pivot: enuToWorld(-255, 320, 12), heading: 0.55, pitch: -0.42, range: 260 }, 0);
cam.groundHeight = (c) => scene.globe.getHeight(c);

/* ------------------------------------------------------------ luz / hora */

interface LightingPreset { id: string; iso: string; night: number; tarde: number; fog: number; label: string; sun: number; color: string }
const PRESETS: LightingPreset[] = [
  { id: 'dia', iso: '2026-06-21T16:50:00-05:00', night: 0.04, tarde: 1, fog: 0.00022, label: '10:10', sun: 5.75, color: '#ffe3c4' },
  { id: 'tarde', iso: '2026-06-21T16:50:00-05:00', night: 0.04, tarde: 1, fog: 0.00022, label: '16:50', sun: 5.75, color: '#ffe3c4' },
  { id: 'noche', iso: '2026-06-21T19:35:00-05:00', night: 1, tarde: 0, fog: 0.00022, label: '19:35', sun: 0.6, color: '#6b8fd4' },
];

let currentNight = 0.04;
let currentTarde = 1;
let clockTween: { from: number; to: number; start: number; dur: number } | null = null;

function applyLook(p: LookParams): void {
  (scene.light as Cesium.SunLight).intensity = p.sunIntensity;
  (scene.light as Cesium.SunLight).color = Cesium.Color.fromCssColorString(p.sunColor);
  sm.darkness = p.shadowDarkness;
  ao.uniforms.intensity = p.aoIntensity;
  bloom.uniforms.brightness = p.bloomBrightness;
  grade.uniforms.uExposure = p.exposure;
  grade.uniforms.uContrast = p.contrast;
  grade.uniforms.uSaturation = p.saturation;
  const [tr, tg, tb] = hexToRgbNorm(p.tintColor);
  grade.uniforms.uTint = new Cesium.Cartesian3(tr, tg, tb);
  grade.uniforms.uVignette = p.vignette;
  const [zr, zg, zb] = hexToRgbNorm(p.skyZenith);
  sky.uniforms.uSkyZenith = new Cesium.Cartesian3(zr, zg, zb);
  const [hr, hg, hb] = hexToRgbNorm(p.skyHorizon);
  sky.uniforms.uSkyHorizon = new Cesium.Cartesian3(hr, hg, hb);
  sky.uniforms.uCloudDensity = p.cloudDensity;
  sky.uniforms.uCloudSpeed = p.cloudSpeed;
  site?.setLook({ skyFill: p.skyFill, groundFill: p.groundFill, hazeAmount: p.hazeAmount, hazeStart: p.hazeStart });
}

const lookStudio = createLookStudio((_id, params) => applyLook(params));
applyLook(lookStudio.getPreset('dia'));
sky.uniforms.uNight = currentNight;
sky.uniforms.uTarde = currentTarde;
grade.uniforms.uNight = currentNight;
grade.uniforms.uTarde = currentTarde;
if (scene.skyAtmosphere) {
  scene.skyAtmosphere.hueShift = 0;
  scene.skyAtmosphere.saturationShift = 0.08;
  scene.skyAtmosphere.brightnessShift = -0.04;
}

/* ------------------------------------------------------------ reloj de 24 h y clima (como el simulador) */

const HORA_PRESET: Record<string, number> = { dia: 10.17, tarde: 16.83, noche: 19.58 };
let hora = 10.17;
let clima: Clima = 'sol';
let filtro: Filtro = 'planos';
let horaPlay = false;          // arranca al terminar la transición inicial
let horaTween: { from: number; to: number; start: number } | null = null;
let horaAplicada = -1;
const lluvia = scene.postProcessStages.add(lluviaStage());
const panelTiempo = crearPanelTiempo({
  hora,
  onHora: (h) => { hora = h; horaTween = null; horaPlay = false; panelTiempo.setPlay(false); },
  onClima: (c) => { clima = c; horaAplicada = -1; },
  onPlay: (on) => { horaPlay = on; },
  onFiltro: (f) => { filtro = f; horaAplicada = -1; },
});

/** Aplica la luz de la hora actual: sol real sobre Bogotá, cielo, sombras, ciudad y clima. */
function aplicarHora(): void {
  const est = luzDeHora(hora, clima, lookStudio.getPreset('dia'), lookStudio.getPreset('tarde'), lookStudio.getPreset('noche'));
  viewer.clock.currentTime = est.fecha;
  applyLook(aplicarFiltro(est.look, filtro, est.night));
  currentNight = est.night;
  currentTarde = est.tarde;
  site?.setNight(currentNight);
  site?.setTarde(currentTarde);
  revit?.setNight(currentNight);
  sky.uniforms.uNight = currentNight;
  sky.uniforms.uTarde = currentTarde;
  grade.uniforms.uNight = currentNight;
  grade.uniforms.uTarde = currentTarde;
  lluvia.uniforms.uRain = est.lluvia;
  if (scene.skyAtmosphere) {
    scene.skyAtmosphere.brightnessShift = -0.55 * currentNight - (clima === 'lluvia' ? 0.2 : clima === 'nublado' ? 0.08 : 0);
    scene.skyAtmosphere.saturationShift = 0.06 - 0.3 * currentNight - (clima === 'sol' ? 0 : 0.35);
  }
  const clockEl = $('clockLabel');
  if (clockEl) clockEl.textContent = est.etiqueta;
  panelTiempo.setHora(hora, est.etiqueta);
  const id = currentNight > 0.5 ? 'noche' : currentTarde > 0.5 ? 'tarde' : 'dia';
  document.querySelectorAll<HTMLButtonElement>('[data-light]').forEach((b) => b.classList.toggle('on', b.dataset.light === id));
}

function applyPreset(p: LightingPreset): void {
  horaPlay = false;
  panelTiempo.setPlay(false);
  horaTween = { from: hora, to: HORA_PRESET[p.id] ?? hora, start: performance.now() };
}
document.querySelectorAll<HTMLButtonElement>('[data-light]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const p = PRESETS.find((x) => x.id === btn.dataset.light);
    if (p) applyPreset(p);
  });
});

/* ------------------------------------------------------------ vistas */

let autoOrbit = false;
const btnOrbit = $<HTMLButtonElement>('btnOrbit');
const btnPed = $<HTMLButtonElement>('btnPedestrian');
const btnPiso2 = $<HTMLButtonElement>('btnPiso2');
const btnEdificioCompleto = $<HTMLButtonElement>('btnEdificioCompleto');
function stopOrbit(): void {
  autoOrbit = false;
  btnOrbit?.classList.remove('on');
}

function verEdificioCompleto(dur = 2.0): void {
  stopOrbit();
  if (cam.isWalking) cam.exitWalk();
  btnPiso2?.classList.remove('on');
  btnEdificioCompleto?.classList.add('on');
  pisosPanel?.mark(-1);
  pisosPanel?.show(true);
  revit?.full();
  // Encuadre a la derecha del Hotel La Fontana
  cam.flyTo({ pivot: enuToWorld(-255, 320, 12), heading: 0.55, pitch: -0.42, range: 260 }, dur);
}
btnEdificioCompleto?.addEventListener('click', () => verEdificioCompleto(2.0));

function setView(key: keyof typeof VIEWS, dur = 2.0): void {
  stopOrbit();
  btnPiso2?.classList.remove('on');
  btnEdificioCompleto?.classList.remove('on');
  if (revit && revit.abierto >= 0) {
    revit.full();
    pisosPanel?.mark(-1);
  }
  const v = VIEWS[key];
  cam.flyTo({ pivot: placeWorld(v.place as keyof typeof PLACES), heading: v.heading, pitch: v.pitch, range: v.range }, dur);
}

$('btnHome')?.addEventListener('click', () => setView('general', 2.2));
$('btnAerial')?.addEventListener('click', () => setView('aerial'));
$('btnArch')?.addEventListener('click', () => setView('arch'));
btnPed?.addEventListener('click', () => {
  stopOrbit();
  btnPiso2?.classList.remove('on');
  btnEdificioCompleto?.classList.remove('on');
  if (cam.isWalking) cam.exitWalk();
  else cam.enterWalk(selected ? buildingDoor(selected) : undefined);
});
cam.onModeChange = (walking) => {
  btnPed?.classList.toggle('on', walking);
  const hint = $('hint');
  if (hint && walking) {
    hint.textContent = 'Peatonal: arrastra para mirar · WASD o flechas para caminar · Shift para correr · Doble clic para ir a un punto';
    hint.classList.remove('fade');
    setTimeout(() => hint.classList.add('fade'), 7000);
  }
};
document.querySelectorAll<HTMLButtonElement>('[data-place]').forEach((btn) => {
  btn.addEventListener('click', () => {
    stopOrbit();
    const key = btn.dataset.place as keyof typeof PLACES;
    // el botón Hotel también selecciona el edificio: lanza el apilado del modelo de Revit
    if (key === 'hotel' && site) {
      const h = site.buildings.find((x) => x.s === 'Hotel');
      if (h) { select(null); select(h); return; }
    }
    cam.flyTo({ pivot: placeWorld(key), range: key === 'hotel' ? 300 : 520, pitch: -0.5 }, 2.0);
  });
});
btnOrbit?.addEventListener('click', () => {
  autoOrbit = !autoOrbit;
  btnOrbit.classList.toggle('on', autoOrbit);
  if (autoOrbit && cam.isWalking) cam.exitWalk();
});

const masterplanPins = createMasterplanPins(viewer, (pin) => {
  stopOrbit();
  if (pin.id === 'piso2') {
    btnPiso2?.click();
    return;
  }
  if (pin.id === 'hotel' && site) {
    const h = site.buildings.find((x) => x.s === 'Hotel');
    if (h) { select(null); select(h); return; }
  }
  const pivot = enuToWorld(pin.enu[0], pin.enu[1], pin.enu[2]);
  cam.flyTo({
    pivot,
    heading: pin.camera.heading,
    pitch: pin.camera.pitch,
    range: pin.camera.range,
  }, pin.camera.dur ?? 2.0);
});

const btnPins = $<HTMLButtonElement>('btnPins');
btnPins?.addEventListener('click', () => {
  const next = !masterplanPins.visible;
  masterplanPins.setVisible(next);
  btnPins.classList.toggle('on', next);
});
container.addEventListener('pointerdown', stopOrbit);
container.addEventListener('wheel', stopOrbit, { passive: true });
addEventListener('keydown', (e) => {
  if (modo !== 'sitio' || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  if (e.code === 'Escape') {
    if (cam.isWalking) cam.exitWalk();
    else select(null);
  }
  if (e.code === 'KeyH' || e.code === 'Home') setView('general', 2.2);
  if (e.code === 'KeyP') btnPed?.click();
});

/* ------------------------------------------------------------ selección */

let selected: Building | null = null;
let trafico: Trafico | null = null;

/* Hotel La Fontana: al seleccionarlo se arma piso por piso */
const HOTEL_PISOS = 9;
let hotelAnim: { start: number } | null = null;
/* modelo de Revit del hotel, por niveles */
let revit: RevitHotel | null = null;
let pisosPanel: { show(v: boolean): void; mark(i: number): void } | null = null;
let revitPending = false;
let autoPlayed = false;
let autoPendiente = false;
/** Al levantarse el telón de carga: la cámara vuela suavemente al hotel y el modelo se arma piso por piso. */
async function autoPlayHotel(): Promise<void> {
  if (modo !== 'sitio') { autoPendiente = true; return; }
  if (autoPlayed) return;
  autoPlayed = true;
  await initRevit();
  if (!site || !revit) return;
  stopOrbit();
  arrancarHotel();
  site?.startBackground();
}
function arrancarHotel(): void {
  if (!site) return;
  const h = site.buildings.find((x) => x.s === 'Hotel');
  // select() vuela la cámara al hotel: aquí ya va en camino, así que se anula ese vuelo
  const flyTo = cam.flyTo.bind(cam);
  cam.flyTo = () => {};
  try {
    if (h) { select(h); if (card) card.hidden = true; }
    else playRevit();
  } finally {
    cam.flyTo = flyTo;
  }
}
let revitLoading: Promise<void> | null = null;
/** Carga el modelo de Revit por niveles (una sola vez) y arma su panel de pisos. */
function initRevit(): Promise<void> {
  if (revitLoading) return revitLoading;
  revitLoading = (async () => {
    if (!site) return;
    revit = await loadRevitHotel(viewer, site.matrix);
    if (!revit) return;
    revit.setNight(currentNight);
    // el bloque viejo que reemplaza el Revit se retira desde la carga (no solo al animar)
    site.setRevitBlocks(revit.bloques, revit.huella);
    pisosPanel = createPisosPanel(revit, (i) => {
      if (!revit) return;
      stopOrbit();
      pisosPanel?.mark(i);
      btnPiso2?.classList.toggle('on', i === 1);
      btnEdificioCompleto?.classList.toggle('on', i < 0);
      if (i < 0) {
        verEdificioCompleto(2.0);
      } else if (i === 1) {
        btnEdificioCompleto?.classList.remove('on');
        revit.openAt(1);
        // Encuadre cenital exacto de Piso 2 en planta arquitectónica
        cam.flyTo({ pivot: enuToWorld(-222, 278, 12), heading: 0.1928, pitch: -1.55, range: 105 }, 2.5);
      } else {
        btnEdificioCompleto?.classList.remove('on');
        btnPiso2?.classList.remove('on');
        revit.openAt(i);
        const c = revit.caja;
        cam.flyTo({ pivot: enuToWorld((c[0] + c[2]) / 2, (c[1] + c[3]) / 2, 12), pitch: -0.95, range: 150 }, 2.0);
      }
    });
    // si ya se había pedido el hotel mientras cargaba, arranca la animación
    if (revitPending) { revitPending = false; playRevit(); if (highlight) { viewer.entities.remove(highlight); highlight = null; } }
  })();
  return revitLoading;
}

/** Alterna entre la vista cenital del Piso 2 y el edificio completo. */
async function togglePiso2(): Promise<void> {
  stopOrbit();
  if (cam.isWalking) cam.exitWalk();
  await initRevit();
  if (!revit) return;
  site?.setRevitBlocks(revit.bloques, revit.huella);

  const yaActivo = btnPiso2?.classList.contains('on') && revit.abierto === 1;
  if (yaActivo) {
    // Si ya está activo: restaura el edificio completo con encuadre a la derecha
    verEdificioCompleto(2.0);
  } else {
    // Si no está activo: separa los pisos superiores y encuadra el Piso 2 en planta
    btnPiso2?.classList.add('on');
    btnEdificioCompleto?.classList.remove('on');
    pisosPanel?.mark(1);
    pisosPanel?.show(true);
    revit.openAt(1);
    cam.flyTo({ pivot: enuToWorld(-222, 278, 12), heading: 0.1928, pitch: -1.55, range: 105 }, 2.5);
  }
}
btnPiso2?.addEventListener('click', () => void togglePiso2());
function playRevit(): void {
  if (!site || !revit) return;
  // solo desaparece el bloque que el Revit reemplaza; el resto del hotel queda intacto
  site.setRevitBlocks(revit.bloques, revit.huella);
  revit.play();
  pisosPanel?.mark(-1);
  pisosPanel?.show(true);
}
function playHotel(): void {
  if (!site) return;
  hotelAnim = { start: performance.now() };
  site.setHotelFloors(0);
}
let highlight: Cesium.Entity | null = null;
const card = $('card');

function buildingCenter(b: Building): Cesium.Cartesian3 {
  return enuToWorld((b.bb[0] + b.bb[2]) / 2, (b.bb[1] + b.bb[3]) / 2, b.b + b.h * 0.5);
}
/** Un punto en la calle junto al edificio, para bajar a pie. */
function buildingDoor(b: Building): Cesium.Cartesian3 {
  return enuToWorld((b.bb[0] + b.bb[2]) / 2, b.bb[1] - 9, b.b);
}

function select(b: Building | null): void {
  const wasHotel = selected?.s === 'Hotel';
  selected = b;
  if (b?.s !== 'Hotel') btnPiso2?.classList.remove('on');
  if (highlight) { viewer.entities.remove(highlight); highlight = null; }
  if (!b || !site) { if (card) card.hidden = true; pisosPanel?.show(false); return; }
  if (b.s !== 'Hotel') pisosPanel?.show(false);
  else if (revit?.visible) pisosPanel?.show(true);

  if (b.s !== 'Hotel') {
    const pos = b.r.map(([e, n]) => enuToWorld(e, n, 0, site!.matrix));
    const hBase = 2572 + b.b - 0.5;
    highlight = viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(pos),
        height: hBase,
        extrudedHeight: hBase + b.h + 2.2,
        material: Cesium.Color.fromCssColorString('#9dc4ea').withAlpha(0.2),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#d7ebff'),
        shadows: Cesium.ShadowMode.DISABLED,
      },
    });
  }

  const hotel = b.s === 'Hotel';
  if (hotel) window.dispatchEvent(new CustomEvent('hlf:hotel'));
  if (hotel && !wasHotel) {
    if (revit) {
      playRevit();
      // con el modelo real a la vista no hace falta el prisma de selección
      if (highlight) { viewer.entities.remove(highlight); highlight = null; }
    } else { revitPending = true; void initRevit(); playHotel(); }
    stopOrbit();
    btnEdificioCompleto?.classList.add('on');
    btnPiso2?.classList.remove('on');
    cam.flyTo({ pivot: enuToWorld(-255, 320, 12), heading: 0.55, pitch: -0.42, range: 260 }, 1.8);
  }
  const piezas = hotel && site ? site.buildings.filter((x) => x.s === 'Hotel') : [b];
  const areaDe = (x: Building) => Math.abs(x.r.reduce((s, p, i) => { const q = x.r[(i + 1) % x.r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
  const huella = piezas.reduce((s, x) => s + areaDe(x), 0);
  const construida = piezas.reduce((s, x) => s + areaDe(x) * x.p, 0);
  const pisosMax = Math.max(...piezas.map((x) => x.p));
  const altoMax = Math.max(...piezas.map((x) => x.h));
  const area = Math.abs(b.r.reduce((s, p, i) => { const q = b.r[(i + 1) % b.r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
  $('cardKind')!.textContent = hotel ? 'Proyecto' : `Sector ${b.s}`;
  $('cardTitle')!.textContent = hotel ? 'Hotel La Fontana' : `Edificación ${b.id + 1}`;
  $('cardData')!.innerHTML =
    `<dt>Pisos</dt><dd>${hotel ? 'hasta ' + pisosMax : b.p}</dd>` +
    `<dt>Altura</dt><dd>${altoMax.toFixed(1)} m</dd>` +
    `<dt>Huella</dt><dd>${Math.round(huella).toLocaleString('es-CO')} m²</dd>` +
    `<dt>Área aprox.</dt><dd>${Math.round(construida).toLocaleString('es-CO')} m²</dd>`;
  void area;
  if (card) card.hidden = false;
}

let sobreTorre = false; let nivelHover = -1; let ultHover = 0;
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
};
$('cardClose')?.addEventListener('click', () => select(null));
$('cardFocus')?.addEventListener('click', () => {
  if (!selected) return;
  stopOrbit();
  const size = Math.max(selected.bb[2] - selected.bb[0], selected.bb[3] - selected.bb[1], selected.h);
  cam.flyTo({ pivot: buildingCenter(selected), pitch: -0.42, range: Math.max(60, size * 2.1) }, 1.7);
});
$('cardWalk')?.addEventListener('click', () => {
  if (!selected) return;
  stopOrbit();
  cam.enterWalk(buildingDoor(selected));
});

/* ------------------------------------------------------------ carga */

const statusEl = $('status');
const statusText = $('statusText');

async function waitForSceneReady(maxMs = 25000): Promise<void> {
  const deadline = performance.now() + maxMs;
  let stableSince = 0;
  while (performance.now() < deadline) {
    const globeOk = scene.globe.tilesLoaded;
    const tilesOk = !site?.tileset || site.tileset.tilesLoaded;
    if (globeOk && tilesOk) {
      if (!stableSince) stableSince = performance.now();
      if (performance.now() - stableSince >= 600) break;
    } else {
      stableSince = 0;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => requestAnimationFrame(r));
  }
}

async function boot(): Promise<void> {
  progress('Cargando el modelo del hotel...', 0.05);
  await new Promise((r) => setTimeout(r, 30));

  site = await loadSite(
    viewer,
    (label, ratio) => progress(label, 0.05 + ratio * 0.20),
    (loaded, total, label) => {
      progress(`Cargando secciones (${loaded}/${total}) · ${label}`, 0.25 + (loaded / Math.max(1, total)) * 0.45);
      if (!statusEl || !statusText) return;
      statusEl.hidden = false;
      statusText.textContent = loaded < total ? `Cargando secciones ${loaded}/${total} · ${label}` : `Modelo completo · ${total} secciones`;
      if (loaded >= total) setTimeout(() => statusEl.classList.add('fade'), 2600);
    },
  );
  site.setNight(currentNight);
  site.setTarde(currentTarde);
  // el modelo de Revit del hotel se descarga desde el arranque: al pulsar Hotel la animación sale de inmediato
  void initRevit();
  const activeId = (document.querySelector<HTMLButtonElement>('[data-light].on')?.dataset.light as PresetId) || 'dia';
  applyLook(lookStudio.getPreset(activeId));
  applyQuality();

  // La cámara se posiciona directamente en el encuadre aprobado del Hotel La Fontana
  cam.flyTo({ pivot: enuToWorld(-255, 320, 12), heading: 0.55, pitch: -0.42, range: 260 }, 0);

  // no se entra hasta que esté todo cargado: hotel (Revit), ciudad completa, vegetación y tráfico
  site.startBackground();
  progress('Preparando el Hotel La Fontana...', 0.55);
  await initRevit();
  progress('Hotel listo · la ciudad termina de cargar en segundo plano', 0.8);
  progress('Preparando la llegada...', 0.85);
  void createTrafico(viewer, site.matrix).then((t) => { trafico = t; });
  (window as unknown as { __ALL__?: boolean }).__ALL__ = true;
  progress('Renderizando...', 0.94);
  await waitForSceneReady(3500);
  progress('Listo', 1);
  loadingEl.classList.add('done');
  setTimeout(() => { loadingEl.hidden = true; }, 900);
  setTimeout(() => void autoPlayHotel(), 3300);
  const hint = $('hint');
  if (hint) setTimeout(() => hint.classList.add('fade'), 9000);
  (window as unknown as { __READY__?: boolean }).__READY__ = true;
}

const stats = { fps: 0, frames: 0, t0: performance.now(), low: 0 };
(window as unknown as { __DBG__?: unknown }).__DBG__ = {
  Cesium, viewer, cam, getSite: () => site, enuToWorld, select, stats, playHotel, playRevit, getRevit: () => revit, getTrafico: () => trafico,
  setQuality: (q: number) => { quality = q; applyQuality(); },
};

/* ------------------------------------------------------------ modos: país (Colombia) ↔ sitio (La Fontana) */

let modo: 'pais' | 'sitio' = 'pais';
let booting: Promise<void> | null = null;
const HOTEL_PIVOT = () => enuToWorld(-255, 320, 12);
const LLEGADA = { heading: 0.55, pitch: -0.62, range: 2600 };
function fx(on: boolean): void {
  sky.enabled = on; grade.enabled = on; lluvia.enabled = on;
  if (on) applyQuality(); else { ao.enabled = false; bloom.enabled = false; viewer.shadows = false; scene.msaaSamples = 2; }
  scene.globe.enableLighting = on;
}
function modoPais(): void {
  modo = 'pais';
  cam.active = false;
  scene.screenSpaceCameraController.enableInputs = true;
  fx(false);
  document.body.dataset.modo = 'pais';
}
function vistaColombia(dur = 2.6): void {
  modoPais();
  viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(-77.6, 3.4, 2600000), orientation: { heading: 0, pitch: Cesium.Math.toRadians(-82), roll: 0 }, duration: dur });
}
function volarA(lon: number, lat: number, alt = 18000, dur = 2.4): void {
  modoPais();
  viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat - alt / 160000, alt), orientation: { heading: 0, pitch: Cesium.Math.toRadians(-55), roll: 0 }, duration: dur });
}
function activarSitio(): void {
  modo = 'sitio';
  fx(true);
  scene.screenSpaceCameraController.enableInputs = false;
  cam.flyTo({ pivot: HOTEL_PIVOT(), ...LLEGADA }, 0);
  cam.active = true;
  cam.flyTo({ pivot: HOTEL_PIVOT(), heading: 0.55, pitch: -0.42, range: 260 }, 3.2);
  document.body.dataset.modo = 'sitio';
  if (autoPendiente) { autoPendiente = false; setTimeout(() => void autoPlayHotel(), 1200); }
}
/** Entra a La Fontana: vuela de Colombia a Bogotá mientras carga la escena, luego la cámara arquitectónica toma el control. */
async function entrar(): Promise<void> {
  const off = new Cesium.HeadingPitchRange(LLEGADA.heading, LLEGADA.pitch, LLEGADA.range);
  if (site) {
    viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(HOTEL_PIVOT(), 1), { offset: off, duration: 3, complete: activarSitio });
    return;
  }
  modoPais();
  loadingEl.hidden = false; loadingEl.classList.remove('done');
  const vuelo = new Promise<void>((r) => viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(HOTEL_PIVOT(), 1), { offset: off, duration: 5.5, complete: () => r(), cancel: () => r() }));
  booting ??= boot();
  try { await Promise.all([booting, vuelo]); } catch (err) {
    console.error(err);
    loadLabel.textContent = 'No se pudo cargar la escena. Revisa la conexión y vuelve a intentar.';
    booting = null;
    return;
  }
  viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(HOTEL_PIVOT(), 1), { offset: off, duration: 0 });
  activarSitio();
}
(window as unknown as { HLF: unknown }).HLF = { entrar, vistaColombia, volarA, viewer, get modo() { return modo; },
  /** empieza a cargar el sitio y el Revit en segundo plano (sin mover la cámara ni mostrar la carga) */
  precargar: () => { booting ??= boot().catch((e) => { console.warn('precarga', e); booting = null; }); },
  explotar: () => explotarTorre(), recomponer: () => recomponerTorre(), get explotado() { return !!revit?.explotado; }, piso2: () => void togglePiso2(), completo: () => verEdificioCompleto(2) };
modoPais();
viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(-77.6, 3.4, 2600000), orientation: { heading: 0, pitch: Cesium.Math.toRadians(-82), roll: 0 } });
loadingEl.hidden = true;
window.dispatchEvent(new CustomEvent('hlf:listo'));

/* ------------------------------------------------------------ bucle */

let last = performance.now();
let settledAt = 0;
function tick(): void {
  const now = performance.now();
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (horaTween) {
    const t = Math.min(1, (now - horaTween.start) / 1800);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    hora = horaTween.from + (horaTween.to - horaTween.from) * e;
    if (t >= 1) horaTween = null;
  } else if (horaPlay) {
    hora += dt / 7;
    if (hora > 20.6) hora = 5.6;
  }
  if (Math.abs(hora - horaAplicada) > 0.004 || horaAplicada < 0) { horaAplicada = hora; aplicarHora(); }
  lluvia.uniforms.uTime = now * 0.001;
  if (clockTween) {
    const t = Math.min(1, (now - clockTween.start) / clockTween.dur);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(clockTween.from + (clockTween.to - clockTween.from) * e));
    if (t >= 1) clockTween = null;
  }

  if (hotelAnim && site) {
    // 0,55 s por piso; cada piso entra con un pequeño rebote
    const t = (now - hotelAnim.start) / 550;
    const piso = Math.floor(t);
    const k = t - piso;
    const e = 1 - Math.pow(1 - Math.min(1, k * 1.6), 3);
    if (piso >= HOTEL_PISOS) { site.setHotelFloors(99); hotelAnim = null; }
    else site.setHotelFloors(piso + e);
  }
  revit?.update(dt, now);
  trafico?.update(dt);
  const tSec = now * 0.001;
  site?.setTime(tSec);
  sky.uniforms.uTime = tSec;

  if (autoOrbit && modo === 'sitio' && !cam.isWalking) cam.flyTo({ heading: cam.state.heading + 0.16 * dt }, 0);
  cam.update(dt);

  // rendimiento: si el equipo no da, baja resolución, sombras y oclusión por pasos
  stats.frames++;
  if (now - stats.t0 >= 2000) {
    stats.fps = Math.round((stats.frames * 1000) / (now - stats.t0));
    stats.frames = 0;
    stats.t0 = now;
    (window as unknown as { __FPS__?: number }).__FPS__ = stats.fps;
    // solo se evalúa con todo cargado: las pausas de la carga no cuentan como equipo lento
    const settled = !!site && site.sections.loaded >= site.sections.total && now - settledAt > 8000;
    if (site && site.sections.loaded >= site.sections.total && !settledAt) settledAt = now;
    if (settled && document.visibilityState === 'visible') {
      if (stats.fps < 20 && quality > 0.25 && !(window as unknown as { __DBG__: { lock?: boolean } }).__DBG__.lock) {
        if (++stats.low >= 3) { quality = quality >= 1 ? 0.5 : 0.25; stats.low = 0; applyQuality(); }
      } else stats.low = 0;
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

addEventListener('resize', applyQuality);
