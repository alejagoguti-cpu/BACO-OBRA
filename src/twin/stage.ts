/* Escena espacial del gemelo (three.js + GSAP), un solo canvas para:
   edificio (Torre Suites en su contexto) → VER BIM (explosión real por niveles, timeline pausable/reversible)
   → PISO 2 aislado en planta ortográfica con habitaciones del Revit y capas por especialidad.
   Geometría: public/twin/nivel_*.bin (HLF_P2-P6.rvt) + mep.bin (redes del piso 2), mismo marco: x = Este, y = cota, z = −Norte.
   Contexto: public/secciones/hotel_*.glb (resto del complejo, recortado por la huella del Revit) — sin BIM. */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import gsap from 'gsap';
import { ESPECIALIDADES, TWIN } from './config';

const BASE = import.meta.env.BASE_URL;
export type Modo = 'edificio' | 'bim' | 'planta';
export interface Habitacion { numero: string; nombre: string; revitId: number; area_m2: number; contorno: [number, number][] }
interface Cat { nombre: string; vOff: number; vLen: number; tOff?: number; tLen?: number; uvOff?: number; uvLen?: number; elementos?: number }
interface NivelInfo { i: number; nombre: string; elev: number; zmin: number; zmax: number; archivo: string; cats: Cat[] }
interface Manifest { enu: { e: number; n: number; z: number }; niveles: NivelInfo[] }
interface Nivel { info: NivelInfo; grupo: THREE.Group; mats: THREE.MeshStandardMaterial[]; edges: THREE.LineBasicMaterial }
export interface CapaEstado { visible: boolean; opacidad: number; resaltada: boolean }

const COL: Record<string, string> = {
  muros: '#E9E4DA', puertas: '#8A5A3B', ventanas: '#8FA9B8', paneles: '#D8D2C6', montantes: '#3A3D41', barandas: '#3A3D41', escaleras: '#B9B3A8',
  cubiertas: '#B5654A', losas: '#C7C2B8', columnas: '#BDB7AD', vigas: '#BDB7AD',
};
const MEP_COL: Record<string, string> = {
  af: '#2F7BEA', acs: '#E8504A', san: '#8B5E3C', sanitarios: '#F4F6F8', otras: '#7F8E9C', rci: '#D2332A', conduit: '#2A9D8F', aparatos: '#0E3064', luminarias: '#F2C230', ductos: '#A3AEB9',
};
const CORTE_PLANTA = 1.35; // m sobre el piso terminado: corte de planta arquitectónica

export interface Stage {
  readonly listo: Promise<void>;
  readonly modo: Modo;
  readonly habitaciones: Habitacion[];
  readonly tl: gsap.core.Timeline;
  readonly capas: Map<string, CapaEstado>;
  onModo: ((m: Modo) => void) | null;
  onEdificio: ((sel: boolean) => void) | null;
  onHabitacion: ((num: string | null) => void) | null;
  onHoverHab: ((num: string | null) => void) | null;
  onProgreso: ((p: number) => void) | null;
  seleccionarEdificio(sel: boolean): void;
  verBim(): void;
  volverAEdificio(): void;
  irAPlantaDirecto(): void;
  setCapa(id: string, p: Partial<CapaEstado>): void;
  aislarCapa(id: string | null): void;
  readonly aislada: string | null;
  seleccionarHabitacion(num: string | null, enfocar?: boolean): void;
  centroHabitacion(num: string): THREE.Vector3 | null;
  acercarHabitacion(num: string): Promise<void>;
  encuadrar(): void;
  conteo(id: string): { cats: string[]; elementos: number | null; tris: number };
  resize(): void;
  pausar(p: boolean): void;
  dispose(): void;
}

export function crearStage(host: HTMLElement): Stage {
  const canvas = document.createElement('canvas'); canvas.className = 'tw-canvas'; host.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  const labels = new CSS2DRenderer(); labels.domElement.className = 'tw-labels'; host.append(labels.domElement);

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight('#f4f7fb', '#9d968b', 0.55));
  const sol = new THREE.DirectionalLight('#fff1dc', 2.1);
  sol.position.set(-60, 110, 45); sol.castShadow = true; sol.shadow.mapSize.set(4096, 4096);
  Object.assign(sol.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 10, far: 400 });
  sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02; sol.shadow.radius = 4;
  scene.add(sol);
  const sombraSuelo = new THREE.Mesh(new THREE.CircleGeometry(260, 72), new THREE.ShadowMaterial({ opacity: 0.16 }));
  sombraSuelo.rotation.x = -Math.PI / 2; sombraSuelo.position.y = -1.1; sombraSuelo.receiveShadow = true; scene.add(sombraSuelo);

  // cámaras: perspectiva (todo el recorrido) y ortográfica (planta final, zoom sin deformación)
  const persp = new THREE.PerspectiveCamera(35, 1, 0.5, 4000);
  const orto = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.5, 4000);
  let cam: THREE.Camera = persp;
  const controls = new OrbitControls(persp, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.screenSpacePanning = true;
  controls.maxPolarAngle = Math.PI * 0.47; controls.minDistance = 12; controls.maxDistance = 600;

  /* rig: la cámara se describe por objetivo + alto visible H + acimut + polar + fov (dolly-zoom continuo hasta la planta) */
  const rig = { tx: 0, ty: 10, tz: 0, H: 70, az: 0.75, pol: 1.08, fov: 35 };
  let rigActivo = true;
  const tmp = new THREE.Vector3();
  function aplicarRig(): void {
    const d = rig.H / (2 * Math.tan(THREE.MathUtils.degToRad(rig.fov) / 2));
    persp.fov = rig.fov; persp.near = Math.max(0.5, d * 0.05); persp.far = d * 6 + 800; persp.updateProjectionMatrix();
    tmp.setFromSphericalCoords(d, Math.max(0.0005, rig.pol), rig.az);
    persp.position.set(rig.tx + tmp.x, rig.ty + tmp.y, rig.tz + tmp.z);
    persp.up.set(0, 1, 0);
    if (rig.pol < 0.002) persp.up.set(-Math.sin(rig.az), 0, -Math.cos(rig.az)); // cenital: norte del dibujo estable
    controls.target.set(rig.tx, rig.ty, rig.tz);
    persp.lookAt(controls.target);
  }
  function rigDesdeCamara(): void {
    const off = tmp.copy(persp.position).sub(controls.target);
    const s = new THREE.Spherical().setFromVector3(off);
    rig.tx = controls.target.x; rig.ty = controls.target.y; rig.tz = controls.target.z;
    rig.az = s.theta; rig.pol = s.phi; rig.fov = persp.fov;
    rig.H = 2 * s.radius * Math.tan(THREE.MathUtils.degToRad(persp.fov) / 2);
  }

  /* ---------------- carga ---------------- */
  const niveles: Nivel[] = [];
  const edificio = new THREE.Group(); edificio.name = 'Torre Suites'; scene.add(edificio);
  const contexto = new THREE.Group(); contexto.name = 'contexto'; scene.add(contexto);
  const ctxMats: THREE.Material[] = [];
  const porCat = new Map<string, THREE.Mesh[]>();
  const pickEdificio: THREE.Mesh[] = [];
  const mepGrupo = new THREE.Group(); mepGrupo.name = 'MEP piso 2';
  const salasGrupo = new THREE.Group(); salasGrupo.name = 'habitaciones';
  const corte = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e5);
  const habitaciones: Habitacion[] = [];
  const salaMesh = new Map<string, THREE.Mesh>();
  const salaLabel = new Map<string, CSS2DObject>();
  const nivelLabels: CSS2DObject[] = [];
  let mepInfo: { cats: Cat[] } | null = null;
  let p2: Nivel | null = null;
  const caja = new THREE.Box3();

  const texLoader = new THREE.TextureLoader();
  const ladrillo = texLoader.load(BASE + 'secciones/tex_ladrillo_hlf.webp', (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });

  function addCat(buf: ArrayBuffer, c: Cat, grupo: THREE.Group, color: string, mep: boolean, arr: THREE.MeshStandardMaterial[]): void {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buf, c.vOff, c.vLen), 3));
    if (c.tOff !== undefined) g.setIndex(new THREE.BufferAttribute(new Uint32Array(buf, c.tOff, c.tLen!), 1));
    if (c.uvOff !== undefined) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(buf, c.uvOff, c.uvLen!), 2));
    g.computeVertexNormals(); g.computeBoundingBox();
    const vidrio = c.nombre === 'ventanas';
    const m = new THREE.MeshStandardMaterial({
      color, roughness: vidrio ? 0.08 : mep ? 0.45 : 0.86, metalness: vidrio ? 0.25 : c.nombre === 'montantes' || c.nombre === 'barandas' ? 0.6 : 0.02,
      side: THREE.DoubleSide, transparent: true, opacity: vidrio ? 0.45 : 1, depthWrite: !vidrio, clippingPlanes: [corte],
      map: c.nombre === 'muros' && c.uvOff !== undefined ? ladrillo : null, flatShading: !mep && c.nombre !== 'muros',
    });
    m.userData = { base: vidrio ? 0.45 : 1, cat: c.nombre, col: color };
    if (m.map) m.color.set('#ffffff');
    const mesh = new THREE.Mesh(g, m);
    mesh.name = c.nombre; mesh.castShadow = !vidrio; mesh.receiveShadow = true;
    mesh.userData = { cat: c.nombre, tris: (c.tLen ?? c.vLen / 3) / 3, elementos: c.elementos ?? null, mep };
    grupo.add(mesh); arr.push(m);
    if (!porCat.has(c.nombre)) porCat.set(c.nombre, []);
    porCat.get(c.nombre)!.push(mesh);
  }

  const listo = (async () => {
    const man = (await (await fetch(BASE + 'twin/manifest.json')).json()) as Manifest;
    await Promise.all(man.niveles.map(async (info) => {
      const buf = await (await fetch(BASE + 'twin/' + info.archivo)).arrayBuffer();
      const grupo = new THREE.Group(); grupo.name = info.nombre;
      const mats: THREE.MeshStandardMaterial[] = [];
      for (const c of info.cats) { if (COL[c.nombre]) addCat(buf, c, grupo, COL[c.nombre], false, mats); }
      const edges = new THREE.LineBasicMaterial({ color: '#2B3540', transparent: true, opacity: 0, depthWrite: false, clippingPlanes: [corte] });
      grupo.children.slice().forEach((o) => {
        const m = o as THREE.Mesh; if (!['muros', 'columnas', 'puertas'].includes(m.name)) return;
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), edges); e.raycast = () => {}; e.userData.edge = true; grupo.add(e);
      });
      niveles[info.i] = { info, grupo, mats, edges };
      edificio.add(grupo);
    }));
    niveles.forEach((n) => n.grupo.children.forEach((o) => { if ((o as THREE.Mesh).isMesh) pickEdificio.push(o as THREE.Mesh); }));
    caja.setFromObject(edificio);
    p2 = niveles.find((n) => n.info.nombre === 'PISO 2') ?? null;
    // etiquetas discretas de nivel
    niveles.forEach((n) => {
      const el = document.createElement('div'); el.className = 'tw-lvl'; el.textContent = n.info.nombre;
      const o = new CSS2DObject(el); o.position.set(caja.max.x + 3, n.info.elev + 1.2, (caja.min.z + caja.max.z) / 2); o.visible = false;
      n.grupo.add(o); nivelLabels.push(o);
    });
    // redes del piso 2
    if (p2) {
      try {
        mepInfo = await (await fetch(BASE + TWIN.pisos['PISO 2'].mep)).json();
        const buf = await (await fetch(BASE + 'twin/mep.bin')).arrayBuffer();
        const mats: THREE.MeshStandardMaterial[] = [];
        for (const c of mepInfo!.cats) if (MEP_COL[c.nombre]) addCat(buf, c, mepGrupo, MEP_COL[c.nombre], true, mats);
        mats.forEach((m) => { m.opacity = 0; m.userData.base = 1; });
        mepGrupo.visible = false; p2.grupo.add(mepGrupo);
      } catch { /* sin redes: las capas lo dirán */ }
      // habitaciones del Revit
      try {
        const hj = (await (await fetch(BASE + TWIN.pisos['PISO 2'].habitaciones)).json()) as { habitaciones: (Habitacion & { elev_m: number })[] };
        for (const h of hj.habitaciones) {
          habitaciones.push(h);
          const sh = new THREE.Shape(h.contorno.map(([x, z]) => new THREE.Vector2(x, z)));
          const g = new THREE.ShapeGeometry(sh); g.rotateX(Math.PI / 2);
          const m = new THREE.MeshBasicMaterial({ color: '#C9A96E', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
          const mesh = new THREE.Mesh(g, m); mesh.position.y = (h.elev_m ?? 3) + 0.04; mesh.renderOrder = 5; mesh.userData = { hab: h.numero };
          salasGrupo.add(mesh); salaMesh.set(h.numero, mesh);
          const contorno = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(h.contorno.map(([x, z]) => new THREE.Vector3(x, 0, z))),
            new THREE.LineBasicMaterial({ color: '#8C6F3A', transparent: true, opacity: 0 }));
          contorno.position.y = mesh.position.y + 0.01; contorno.userData.hab = h.numero; contorno.raycast = () => {}; salasGrupo.add(contorno);
          const c = new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3());
          const el = document.createElement('button'); el.type = 'button'; el.className = 'tw-roomtag'; el.dataset.hab = h.numero;
          el.innerHTML = `<b>${h.numero}</b><small>${h.area_m2.toFixed(1)} m²</small>`;
          el.addEventListener('click', (ev) => { ev.stopPropagation(); api.seleccionarHabitacion(h.numero); });
          el.addEventListener('pointerenter', () => { hoverHab = h.numero; pintarSalas(); api.onHoverHab?.(h.numero); });
          el.addEventListener('pointerleave', () => { if (hoverHab === h.numero) { hoverHab = null; pintarSalas(); api.onHoverHab?.(null); } });
          const lb = new CSS2DObject(el); lb.position.set(c.x, mesh.position.y + 0.2, c.z); lb.visible = false;
          salasGrupo.add(lb); salaLabel.set(h.numero, lb);
        }
        salasGrupo.visible = false; p2.grupo.add(salasGrupo);
      } catch { /* sin contornos: planta sin habitaciones seleccionables */ }
    }
    // contexto del complejo (sin BIM): resto del hotel recortado por la huella del Revit + torres vecinas
    void cargarContexto(man.enu);
    encuadreInicial(); aplicarRig();
    construirTimeline();
  })();

  async function cargarContexto(enu: Manifest['enu']): Promise<void> {
    contexto.position.set(-enu.e, -enu.z, enu.n);
    let huella: [number, number][][] = [];
    try { huella = (await (await fetch(BASE + 'twin/huella.json')).json()).huella; } catch { /* */ }
    const dentro = (poly: [number, number][], x: number, y: number) => {
      let r = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) r = !r;
      }
      return r;
    };
    const enHuella = (e: number, n: number) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => huella.some((p) => dentro(p, e + dx, n + dy)));
    const loader = new GLTFLoader();
    await Promise.all(['hotel_plazoleta', 'hotel_fachadas', 'hotel_cubiertas', 'torres_vecinas'].map(async (f) => {
      let gltf; try { gltf = await loader.loadAsync(`${BASE}secciones/${f}.glb`); } catch { return; }
      const recortar = f === 'hotel_fachadas' || f === 'hotel_cubiertas';
      gltf.scene.traverse((o) => {
        const mesh = o as THREE.Mesh; if (!mesh.isMesh) return;
        const g = mesh.geometry as THREE.BufferGeometry; const pos = g.getAttribute('position');
        if (recortar && g.index && huella.length) {
          const idx = g.index.array; const keep: number[] = [];
          for (let t = 0; t < idx.length; t += 3) {
            let x = 0, z = 0; for (let k = 0; k < 3; k++) { x += pos.getX(idx[t + k]); z += pos.getZ(idx[t + k]); }
            if (!enHuella(x / 3, -z / 3)) keep.push(idx[t], idx[t + 1], idx[t + 2]);
          }
          g.setIndex(keep);
        }
        const m = mesh.material as THREE.MeshStandardMaterial;
        m.transparent = true; m.userData.baseOp = m.opacity; ctxMats.push(m);
        mesh.castShadow = f !== 'hotel_plazoleta'; mesh.receiveShadow = true; mesh.raycast = () => {};
      });
      contexto.add(gltf.scene);
    }));
    aplicarEstado();
  }

  function encuadreInicial(): void {
    const c = caja.getCenter(new THREE.Vector3()); const s = caja.getSize(new THREE.Vector3());
    Object.assign(rig, { tx: c.x, ty: c.y * 0.8, tz: c.z, H: Math.max(s.x, s.z) * 0.95, az: 0.75, pol: 1.08, fov: 35 });
  }

  /* ---------------- estado animable (lo mueve la timeline) ---------------- */
  const st = { sep: 0, otros: 1, mep: 0, corte: 0, salas: 0, ctx: 1, sel: 0, bordes: 0 };
  let modo: Modo = 'edificio';
  let edificioSel = false;
  let hoverEd = false;
  let hoverHab: string | null = null;
  let habSel: string | null = null;
  const capas = new Map<string, CapaEstado>(ESPECIALIDADES.map((e) => [e.id, { visible: true, opacidad: 1, resaltada: false }]));
  let aislada: string | null = null;
  const GAP = 8.5;

  function catVisible(cat: string): { vis: boolean; op: number; hl: boolean } {
    const esp = ESPECIALIDADES.find((e) => e.cats.includes(cat));
    if (!esp) return { vis: true, op: 1, hl: false };
    const c = capas.get(esp.id);
    if (!c) return { vis: true, op: 1, hl: false };
    const vis = c.visible && (!aislada || aislada === esp.id);
    return { vis, op: aislada && aislada !== esp.id ? 0 : c.opacidad, hl: c.resaltada };
  }

  function aplicarEstado(): void {
    const t = performance.now() / 1000;
    niveles.forEach((n, i) => {
      const esP2 = n === p2;
      n.grupo.position.y = i * GAP * st.sep;
      const op = esP2 ? 1 : st.otros;
      n.grupo.visible = op > 0.005;
      n.edges.opacity = (esP2 ? st.bordes : 0) * 0.55;
      for (const m of n.mats) {
        const cat = m.userData.cat as string;
        const cv = modo === 'edificio' ? { vis: true, op: 1, hl: false } : catVisible(cat);
        const base = m.userData.base as number;
        // en el recorrido BIM la arquitectura de los otros pisos queda en blanco técnico
        const tecnico = st.sep > 0.02 && !esP2;
        m.color.set(m.map ? (tecnico ? '#EEF0F2' : '#FFFFFF') : tecnico ? '#E6E9EC' : (m.userData.col as string));
        m.opacity = base * op * cv.op;
        m.depthWrite = m.opacity > 0.98;
        (m as THREE.Material).visible = cv.vis && m.opacity > 0.01;
        const hlEd = modo === 'edificio' && (hoverEd || edificioSel);
        const pulso = 0.5 + 0.5 * Math.sin(t * 3.2);
        m.emissive.set(cv.hl ? '#E8B44A' : hlEd ? '#B79E66' : '#000000');
        m.emissiveIntensity = cv.hl ? 0.15 + 0.35 * pulso : hlEd ? (edificioSel ? 0.22 : 0.12) : 0;
      }
    });
    // redes
    mepGrupo.visible = st.mep > 0.01;
    mepGrupo.children.forEach((o) => {
      const mesh = o as THREE.Mesh; if (!mesh.isMesh) return;
      const m = mesh.material as THREE.MeshStandardMaterial; const cv = catVisible(mesh.userData.cat);
      const pulso = 0.5 + 0.5 * Math.sin(t * 3.2);
      m.opacity = st.mep * cv.op; (m as THREE.Material).visible = cv.vis && m.opacity > 0.01; m.depthWrite = m.opacity > 0.98;
      m.emissive.set(cv.hl ? m.userData.col : '#000000'); m.emissiveIntensity = cv.hl ? 0.25 + 0.55 * pulso : 0;
    });
    // corte de planta (sigue al piso 2 mientras se separa)
    const y0 = p2 ? p2.grupo.position.y + p2.info.elev : 3;
    corte.constant = st.corte > 0.001 ? THREE.MathUtils.lerp(y0 + 8, y0 + CORTE_PLANTA, st.corte) : 1e5;
    // contexto
    for (const m of ctxMats) { m.opacity = (m.userData.baseOp ?? 1) * st.ctx; m.visible = st.ctx > 0.01; m.depthWrite = st.ctx > 0.98; }
    contexto.visible = st.ctx > 0.01;
    sombraSuelo.visible = st.otros > 0.2;
    // habitaciones
    salasGrupo.visible = st.salas > 0.01;
    pintarSalas();
    nivelLabels.forEach((l) => { l.visible = modo === 'bim' && st.sep > 0.6 && st.otros > 0.4; });
  }
  function pintarSalas(): void {
    salasGrupo.children.forEach((o) => {
      const hab = o.userData.hab as string | undefined; if (!hab) return;
      const sel = hab === habSel, hov = hab === hoverHab;
      if ((o as THREE.Mesh).isMesh) {
        const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = st.salas * (sel ? 0.42 : hov ? 0.26 : 0.1);
        m.color.set(sel ? '#B79E66' : hov ? '#C9A96E' : '#D7C7A3');
      } else if ((o as THREE.LineLoop).isLine) {
        ((o as THREE.LineLoop).material as THREE.LineBasicMaterial).opacity = st.salas * (sel ? 1 : 0.6);
      }
    });
    salaLabel.forEach((lb, num) => {
      lb.visible = st.salas > 0.3;
      const el = lb.element as HTMLElement;
      el.style.opacity = String(Math.min(1, st.salas * 1.4));
      el.classList.toggle('on', num === habSel); el.classList.toggle('hov', num === hoverHab);
    });
  }

  /* ---------------- timeline VER BIM (pausable, reversible, repetible) ---------------- */
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  let rigInicio = { ...rig };
  function construirTimeline(): void {
    tl.clear();
    const s = caja.getSize(new THREE.Vector3()); const c = caja.getCenter(new THREE.Vector3());
    const yP2 = (p2?.info.elev ?? 3) + (p2 ? niveles.indexOf(p2) : 1) * GAP;
    const habCaja = new THREE.Box3(); salaMesh.forEach((m) => habCaja.expandByObject(m));
    const pc = habCaja.isEmpty() ? c.clone() : habCaja.getCenter(new THREE.Vector3());
    const pw = habCaja.isEmpty() ? Math.max(s.x, s.z) : Math.max(habCaja.max.x - habCaja.min.x, habCaja.max.z - habCaja.min.z);
    const r0 = { ...rig };
    rigInicio = r0;
    const altoExpl = (niveles.length - 1) * GAP + s.y;
    tl.addLabel('alejar')
      .to(rig, { H: r0.H * 1.25, pol: 1.16, duration: 1.0 }, 'alejar')
      .to(st, { ctx: 0, duration: 0.9 }, 'alejar')
      .addLabel('explotar')
      .to(st, { sep: 1, duration: 1.8, ease: 'power3.inOut' }, 'explotar')
      .to(rig, { ty: c.y * 0.5 + altoExpl * 0.42, H: Math.max(r0.H * 1.25, altoExpl * 1.05), duration: 1.8 }, 'explotar')
      .addLabel('sistemas')
      .to(st, { mep: 1, bordes: 1, duration: 0.9 }, 'sistemas')
      .to(st, { otros: 0.14, duration: 1.0, ease: 'power1.inOut' }, 'sistemas+=0.3')
      .addLabel('acercar')
      .to(rig, { tx: pc.x, ty: yP2 + 1, tz: pc.z, H: pw * 1.25, pol: 0.95, duration: 1.4 }, 'acercar')
      .addLabel('aislar')
      .to(st, { otros: 0, duration: 0.6 }, 'aislar')
      .to(st, { corte: 1, duration: 0.8 }, 'aislar+=0.2')
      .addLabel('cenital')
      .to(rig, { pol: 0, az: Math.round(r0.az / (Math.PI / 2)) * (Math.PI / 2), fov: 6, H: pw * 1.12, duration: 1.6, ease: 'power3.inOut' }, 'cenital')
      .to(st, { mep: 0.0, duration: 0.8 }, 'cenital+=0.4')
      .addLabel('planta')
      .to(st, { salas: 1, duration: 0.7 }, 'planta')
      .addLabel('fin');
    tl.eventCallback('onUpdate', () => { api.onProgreso?.(tl.progress()); });
    tl.eventCallback('onComplete', () => { entrarPlanta(); });
    tl.eventCallback('onReverseComplete', () => { modo = 'edificio'; rigActivo = false; controls.enabled = true; api.onModo?.(modo); });
  }

  function entrarPlanta(): void {
    modo = 'planta';
    // perspectiva casi ortográfica → ortográfica real con el mismo encuadre
    const asp = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const H = rig.H;
    orto.left = -H * asp / 2; orto.right = H * asp / 2; orto.top = H / 2; orto.bottom = -H / 2; orto.zoom = 1;
    orto.position.set(rig.tx, rig.ty + 200, rig.tz); orto.up.copy(persp.up); orto.lookAt(rig.tx, rig.ty, rig.tz); orto.updateProjectionMatrix();
    cam = orto; rigActivo = false;
    controls.object = orto; controls.target.set(rig.tx, rig.ty, rig.tz);
    controls.enableRotate = false; controls.minZoom = 0.6; controls.maxZoom = 14; controls.enabled = true;
    controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    controls.update();
    api.onModo?.(modo);
  }
  function salirPlanta(): void {
    if (cam !== orto) return;
    // vuelve a la perspectiva en el pose final del timeline (la planta pudo moverse con pan/zoom: se ignora)
    cam = persp; controls.object = persp;
    controls.enableRotate = true;
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  }

  /* ---------------- interacción ---------------- */
  const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2();
  let down: { x: number; y: number; t: number } | null = null;
  let ultimoClick = 0;
  function pick(e: PointerEvent | MouseEvent, objs: THREE.Object3D[]): THREE.Intersection | undefined {
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, cam as THREE.PerspectiveCamera);
    return ray.intersectObjects(objs, false).find((h) => (h.object as THREE.Mesh).visible && ((h.object as THREE.Mesh).material as THREE.Material).visible);
  }
  const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; if (rigActivo && modo !== 'bim') { rigActivo = false; } };
  const onMove = (e: PointerEvent) => {
    if (down || tl.isActive()) return;
    if (modo === 'edificio') {
      const h = !!pick(e, pickEdificio);
      if (h !== hoverEd) { hoverEd = h; canvas.style.cursor = h ? 'pointer' : ''; aplicarEstado(); }
    } else if (modo === 'planta') {
      const h = pick(e, [...salaMesh.values()]);
      const num = (h?.object.userData.hab as string) ?? null;
      if (num !== hoverHab) { hoverHab = num; canvas.style.cursor = num ? 'pointer' : ''; pintarSalas(); api.onHoverHab?.(num); }
    }
  };
  const onUp = (e: PointerEvent) => {
    if (!down) return;
    const click = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5 && performance.now() - down.t < 450;
    down = null;
    if (!click || tl.isActive()) return;
    const ahora = performance.now(); const doble = ahora - ultimoClick < 320; ultimoClick = ahora;
    if (modo === 'edificio') {
      const h = pick(e, pickEdificio);
      if (doble && h) { volarA(h.point, rig.H * 0.55); return; }
      api.seleccionarEdificio(!!h);
    } else if (modo === 'planta') {
      const h = pick(e, [...salaMesh.values()]);
      const num = (h?.object.userData.hab as string) ?? null;
      if (doble && num) { void api.acercarHabitacion(num); return; }
      api.seleccionarHabitacion(num);
    }
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);

  let vuelo: gsap.core.Tween | null = null;
  function volarA(p: THREE.Vector3, H: number, extra: Partial<typeof rig> = {}): Promise<void> {
    rigDesdeCamara(); rigActivo = true;
    vuelo?.kill();
    return new Promise((res) => { vuelo = gsap.to(rig, { tx: p.x, ty: p.y, tz: p.z, H, ...extra, duration: 1.2, ease: 'power2.inOut', onComplete: () => { rigActivo = false; res(); } }); });
  }

  /* ---------------- bucle ---------------- */
  let raf = 0; let pausado = false; let vivo = true;
  function resize(): void {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); labels.setSize(w, h);
    persp.aspect = w / h; persp.updateProjectionMatrix();
    const H = (orto.top - orto.bottom) || 1; const asp = w / h;
    orto.left = -H * asp / 2; orto.right = H * asp / 2; orto.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(host);
  function loop(): void {
    if (!vivo) return;
    raf = requestAnimationFrame(loop);
    if (pausado) return;
    if (rigActivo || tl.isActive() || modo === 'bim') { aplicarRig(); } else controls.update();
    aplicarEstado();
    renderer.render(scene, cam);
    labels.render(scene, cam);
  }
  resize(); loop();

  const api: Stage = {
    listo, tl, capas, habitaciones,
    get modo() { return modo; },
    get aislada() { return aislada; },
    onModo: null, onEdificio: null, onHabitacion: null, onHoverHab: null, onProgreso: null,
    seleccionarEdificio(sel) {
      if (edificioSel === sel) return;
      edificioSel = sel;
      gsap.to(st, { ctx: sel ? 0.18 : 1, duration: 0.8, ease: 'power2.out' });
      if (sel) { const c = caja.getCenter(new THREE.Vector3()); void volarA(c, rig.H > 0 ? Math.max(caja.getSize(tmp).x, caja.getSize(tmp).z) * 0.9 : 60); }
      api.onEdificio?.(sel);
    },
    verBim() {
      if (modo === 'planta') return;
      modo = 'bim'; api.onModo?.(modo);
      edificioSel = false; hoverEd = false;
      // arranca desde donde esté la cámara: se reescribe el primer tramo con el pose actual
      rigDesdeCamara(); rigActivo = true; controls.enabled = false;
      if (tl.progress() === 0) { construirTimeline(); }
      tl.timeScale(1).play();
    },
    volverAEdificio() {
      if (modo === 'planta') { salirPlanta(); modo = 'bim'; api.onModo?.(modo); }
      rigActivo = true; controls.enabled = false;
      api.seleccionarHabitacion(null);
      tl.timeScale(1.6).reverse();
    },
    irAPlantaDirecto() {
      // al volver a una URL de planta sin animar (p. ej. recarga): salta al final
      modo = 'bim'; rigDesdeCamara(); construirTimeline(); tl.progress(1).pause(); aplicarRig(); entrarPlanta();
    },
    setCapa(id, p) { const c = capas.get(id); if (!c) return; Object.assign(c, p); },
    aislarCapa(id) { aislada = aislada === id ? null : id; if (aislada && st.mep < 1 && modo === 'planta') gsap.to(st, { mep: 1, duration: 0.5 }); },
    seleccionarHabitacion(num, enfocar = false) {
      habSel = num; pintarSalas(); api.onHabitacion?.(num);
      if (num && enfocar) void api.acercarHabitacion(num);
    },
    centroHabitacion(num) {
      const m = salaMesh.get(num); if (!m) return null;
      return new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3());
    },
    async acercarHabitacion(num) {
      const m = salaMesh.get(num); if (!m || cam !== orto) return;
      const b = new THREE.Box3().setFromObject(m); const c = b.getCenter(new THREE.Vector3()); const s = b.getSize(new THREE.Vector3());
      const H = orto.top - orto.bottom; const zoom = Math.min(controls.maxZoom, H / (Math.max(s.x, s.z) * 2.2));
      await new Promise<void>((res) => {
        gsap.to(controls.target, { x: c.x, z: c.z, duration: 1, ease: 'power2.inOut', onUpdate: () => { orto.position.set(controls.target.x, orto.position.y, controls.target.z); } });
        gsap.to(orto, { zoom, duration: 1, ease: 'power2.inOut', onUpdate: () => orto.updateProjectionMatrix(), onComplete: res });
      });
    },
    encuadrar() {
      if (modo === 'planta') { gsap.to(orto, { zoom: 1, duration: 0.8, onUpdate: () => orto.updateProjectionMatrix() }); const r = { ...rig }; gsap.to(controls.target, { x: r.tx, z: r.tz, duration: 0.8, onUpdate: () => { orto.position.set(controls.target.x, orto.position.y, controls.target.z); } }); }
      else { rigActivo = true; vuelo?.kill(); vuelo = gsap.to(rig, { ...rigInicio, duration: 1.2, ease: 'power2.inOut', onComplete: () => { rigActivo = false; } }); }
    },
    conteo(id) {
      const e = ESPECIALIDADES.find((x) => x.id === id)!;
      let tris = 0; let el = 0; let hayEl = false;
      for (const c of e.cats) for (const m of porCat.get(c) ?? []) {
        if (m.parent !== p2?.grupo && m.parent !== mepGrupo) continue;
        tris += m.userData.tris; if (m.userData.elementos != null) { el += m.userData.elementos; hayEl = true; }
      }
      return { cats: e.cats.filter((c) => (porCat.get(c) ?? []).some((m) => m.parent === p2?.grupo || m.parent === mepGrupo)), elementos: hayEl ? el : null, tris };
    },
    resize,
    pausar(p) { pausado = p; labels.domElement.style.display = p ? 'none' : ''; },
    dispose() {
      vivo = false; cancelAnimationFrame(raf); ro.disconnect(); tl.kill(); vuelo?.kill(); controls.dispose();
      scene.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); const mt = m.material as THREE.Material | THREE.Material[] | undefined; if (mt) (Array.isArray(mt) ? mt : [mt]).forEach((x) => x.dispose()); });
      renderer.dispose(); labels.domElement.remove(); canvas.remove();
    },
  };
  return api;
}
