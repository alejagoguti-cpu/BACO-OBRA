/* Configurador de habitación (modelo de 3ds Max de la escena renderizada, pieza por pieza).
   - Piezas agrupadas por familia (nombre del nodo sin el id de Revit): "Cama Twin Acolchada ×2".
   - Cada pieza tiene uno o más materiales (ranuras); se puede cambiar cada ranura por otro material del proyecto.
   - Miniaturas 3D de piezas y materiales renderizadas a demanda en un renderizador fuera de pantalla.
   - Vista 3D (axonométrica) y 2D (planta ortográfica). Dibujo a demanda. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import gsap from 'gsap';
import { draco } from './draco';

export type CategoriaPieza = 'Muebles' | 'Baño' | 'Iluminación' | 'Textiles' | 'Pisos' | 'Muros' | 'Puertas y ventanas' | 'Otros';
export const CATEGORIAS: CategoriaPieza[] = ['Muebles', 'Baño', 'Iluminación', 'Textiles', 'Pisos', 'Muros', 'Puertas y ventanas', 'Otros'];
export type GrupoMaterial = 'Maderas' | 'Telas y cueros' | 'Piedras y cerámicas' | 'Metales' | 'Pinturas y muros' | 'Vidrios y espejos' | 'Otros';
export const GRUPOS_MAT: GrupoMaterial[] = ['Maderas', 'Telas y cueros', 'Piedras y cerámicas', 'Metales', 'Pinturas y muros', 'Vidrios y espejos', 'Otros'];
export interface Pieza { clave: string; nombre: string; codigo: string; medidas: string; categoria: CategoriaPieza; cantidad: number; ranuras: string[]; ids: string[] }
export interface MaterialInfo { nombre: string; etiqueta: string; grupo: GrupoMaterial }

const limpiar = (s: string) => s.replace(/\s*\[\d+\]\s*$/, '').replace(/\s+/g, ' ').trim();
function describir(nodo: string): { nombre: string; codigo: string; medidas: string; categoria: CategoriaPieza } {
  const base = limpiar(nodo).replace(/[ _]/g, ' ').replace(/\s+\d{5,}$/, '').replace(/^hlf[-_ ]?mob\s+/i, '').trim();
  const medidas = (/(\d+\s*[x×]\s*\d+(?:\s*[x×]\s*\d+)?\s*mm)/i.exec(base)?.[1] ?? '').replace(/\s+/g, ' ');
  const codigo = (/\b([A-Za-z]{2,4}-\d{2})\b/.exec(base)?.[1] ?? '').toUpperCase();
  let nombre = base.replace(medidas, '').replace(/^HLF-MOB\s+/, '').replace(new RegExp(codigo.replace(/[-]/g, '\-'), 'i'), '').replace(/^mob\s+/i, '').replace(/\s+\d{5,}\b/g, '').replace(/\s+mm\b/i, '').replace(/^Muro básico\s+/i, 'Muro ').replace(/^Suelo\s+/i, 'Piso ').replace(/\bHLF[-_ ]/g, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const mitad = nombre.split(' '); if (mitad.length > 6 && mitad.slice(0, mitad.length / 2).join(' ') === mitad.slice(mitad.length / 2).join(' ')) nombre = mitad.slice(0, mitad.length / 2).join(' ');
  nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase().replace(/\b(twin|led|tv|mdf|pbr)\b/gi, (m) => m.toUpperCase());
  const s = base;
  const categoria: CategoriaPieza =
    /cortina|velo|tapete/i.test(s) ? 'Textiles'
      : /ba[ñn]o|kohler|grival|genebre|sanindusa|ducha|shower|sanitario|mes[oó]n|valvula|v[aá]lvula|nicho|sif[oó]n|desag|registro/i.test(s) ? 'Baño'
        : /\bDL\b|_DL_|led|l[aá]mpara|luminaria|aplique|marquesina/i.test(s) ? 'Iluminación'
          : /puerta|ventana|dintel|marco/i.test(s) ? 'Puertas y ventanas'
            : /^suelo|piso|guardaescoba/i.test(s) ? 'Pisos'
              : /^muro|cabecero|z[oó]calo|panel/i.test(s) ? 'Muros'
                : /mob|cama|mesa|closet|minibar|poltrona|silla|escritorio|perchero|tv|televisor|bar\b|espejo/i.test(s) ? 'Muebles' : 'Otros';
  return { nombre: nombre || base, codigo, medidas, categoria };
}
function grupoDe(m: string): GrupoMaterial {
  return /madera|wood|vinilo|nogal|sikuani|melamina|carpinter|mdf|portico/i.test(m) ? 'Maderas'
    : /tejido|fabric|lino|velo|cortina|tapete|leather|cuero|natural_texture|plain_/i.test(m) ? 'Telas y cueros'
      : /m[aá]rmol|marmol|piedra|porcelanato|neolith|santorini|piso_ba|mampost|vitreous|china|meson/i.test(m) ? 'Piedras y cerámicas'
        : /bronce|laton|acero|inox|cromo|chrome|metal|gold|iron|corten|martillado|registro|aro/i.test(m) ? 'Metales'
          : /vidrio|glass|mirror|espejo/i.test(m) ? 'Vidrios y espejos'
            : /pintura|tendido|wall|blanca|nubes|default/i.test(m) ? 'Pinturas y muros' : 'Otros';
}
const etiqueta = (m: string) => m.replace(/^HLF_(REF_|MOB_)?/i, '').replace(/_+/g, ' ').replace(/\b(PBR|P)\b/g, '').trim().toLowerCase().replace(/^./, (c) => c.toUpperCase());

export interface Configurador {
  readonly listo: Promise<void>;
  piezas(): Pieza[];
  materiales(): MaterialInfo[];
  miniaturaPieza(clave: string): Promise<string>;
  miniaturaMaterial(nombre: string): Promise<string>;
  seleccionar(clave: string | null, enfocar?: boolean): void;
  readonly seleccion: string | null;
  /** cambia la ranura `original` de la pieza por el material `nuevo` (null = restaurar) */
  aplicar(clave: string, original: string, nuevo: string | null): void;
  materialActual(clave: string, original: string): string;
  setVista(v: '2d' | '3d'): void;
  readonly vista: '2d' | '3d';
  setZoom(z: number): void;
  centrar(): void;
  onSeleccion: ((clave: string | null) => void) | null;
  dispose(): void;
}

export function crearConfigurador(host: HTMLElement, url: string): Configurador {
  const canvas = document.createElement('canvas'); canvas.className = 'tw-canvas'; host.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#E9E6E1');
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environment = env; scene.environmentIntensity = 0.75;
  scene.add(new THREE.HemisphereLight('#fffaf2', '#8a8174', 0.55));
  const sol = new THREE.DirectionalLight('#fff1dd', 2.2); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); sol.shadow.bias = -0.0006; sol.shadow.normalBias = 0.04; sol.shadow.radius = 6;
  scene.add(sol, sol.target);
  const persp = new THREE.PerspectiveCamera(32, 1, 0.05, 200);
  const orto = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 200);
  let cam: THREE.Camera = persp;
  const controls = new OrbitControls(persp, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI * 0.46; controls.minDistance = 2; controls.maxDistance = 40;
  const composer = new EffectComposer(renderer);
  const pasoRender = new RenderPass(scene, persp); composer.addPass(pasoRender);
  const gtao = new GTAOPass(scene, persp, 1, 1); gtao.updateGtaoMaterial({ radius: 0.3, distanceExponent: 1.5, thickness: 1, scale: 1, samples: 12 }); gtao.blendIntensity = 0.8; composer.addPass(gtao);
  const outline = new OutlinePass(new THREE.Vector2(1, 1), scene, persp);
  outline.edgeStrength = 4; outline.edgeGlow = 0.3; outline.edgeThickness = 1.4; outline.visibleEdgeColor.set('#C9A96E'); outline.hiddenEdgeColor.set('#8C6F3A'); composer.addPass(outline);
  composer.addPass(new OutputPass());

  const mallasPorPieza = new Map<string, THREE.Mesh[]>(); const primerNodo = new Map<string, THREE.Object3D>();
  const piezas: Pieza[] = []; const mats = new Map<string, THREE.Material>(); const pick: THREE.Mesh[] = [];
  const cambios = new Map<string, string>(); // clave::original -> nuevo
  let seleccion: string | null = null; let vista: '2d' | '3d' = '3d';
  const centro = new THREE.Vector3(); let radio = 5;

  function resize(): void {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); composer.setSize(w, h); gtao.setSize(w, h); outline.setSize(w, h);
    persp.aspect = w / h; persp.updateProjectionMatrix();
    const a = w / h, H = radio * 2.4; orto.left = -H * a / 2; orto.right = H * a / 2; orto.top = H / 2; orto.bottom = -H / 2; orto.updateProjectionMatrix();
    despertar(400);
  }
  const ro = new ResizeObserver(resize); ro.observe(host);

  const listo = (async () => {
    const r = await fetch(import.meta.env.BASE_URL + url);
    if (!r.ok) throw new Error('Modelo no disponible: ' + url);
    const gltf = await new GLTFLoader().setDRACOLoader(draco()).parseAsync(await r.arrayBuffer(), '');
    // centrar: el modelo viene en coordenadas reales del proyecto
    const caja = new THREE.Box3().setFromObject(gltf.scene); const c0 = caja.getCenter(new THREE.Vector3());
    gltf.scene.position.sub(new THREE.Vector3(c0.x, caja.min.y, c0.z));
    scene.add(gltf.scene); gltf.scene.updateMatrixWorld(true);
    const grupos = new Map<string, { nodos: string[]; mallas: THREE.Mesh[]; objs: THREE.Object3D[] }>();
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh; if (!m.isMesh) return;
      const nodo: THREE.Object3D = m.parent && m.parent !== gltf.scene && (m.parent as THREE.Group).isGroup ? m.parent : m;
      const nombre = nodo.name || m.name;
      const clave = limpiar(nombre);
      const ms = (Array.isArray(m.material) ? m.material : [m.material]) as THREE.MeshStandardMaterial[];
      ms.forEach((mt) => {
        if (mt.map) { mt.map.anisotropy = 8; }
        if (/glass|vidrio/i.test(mt.name) && !mt.transparent) { mt.transparent = true; mt.opacity = 0.35; }
        if (/luz|led|downlight/i.test(mt.name)) { mt.emissive = new THREE.Color('#ffdcaa'); mt.emissiveIntensity = 1; }
        if (mt.name && !mats.has(mt.name)) mats.set(mt.name, mt);
        mt.userData.original = mt.name;
      });
      m.userData.original = ms.map((x) => x.name);
      m.castShadow = true; m.receiveShadow = true; m.userData.clave = clave;
      if (!grupos.has(clave)) grupos.set(clave, { nodos: [], mallas: [], objs: [] });
      const g = grupos.get(clave)!; if (!g.objs.includes(nodo)) { g.objs.push(nodo); g.nodos.push(nombre); } g.mallas.push(m); pick.push(m);
    });
    for (const [clave, g] of grupos) {
      const d = describir(clave);
      const ranuras = [...new Set(g.mallas.flatMap((m) => (Array.isArray(m.material) ? m.material : [m.material]).map((x) => x.name).filter(Boolean)))];
      piezas.push({ clave, ...d, cantidad: g.nodos.length, ranuras, ids: g.nodos });
      mallasPorPieza.set(clave, g.mallas); primerNodo.set(clave, g.objs[0]);
    }
    piezas.sort((a, b) => CATEGORIAS.indexOf(a.categoria) - CATEGORIAS.indexOf(b.categoria) || a.nombre.localeCompare(b.nombre));
    const cb = new THREE.Box3().setFromObject(gltf.scene); cb.getCenter(centro); const s = cb.getSize(new THREE.Vector3()); radio = Math.max(s.x, s.z) / 2;
    sol.position.set(centro.x - 6, 9, centro.z + 5); sol.target.position.copy(centro);
    Object.assign(sol.shadow.camera, { left: -radio * 1.3, right: radio * 1.3, top: radio * 1.3, bottom: -radio * 1.3, near: 1, far: 30 });
    resize();
    // entrada: desde la planta (cenital) a la axonometría
    persp.position.set(centro.x, radio * 6, centro.z + 0.01); controls.target.copy(centro); controls.update();
    await new Promise<void>((res) => gsap.to(persp.position, { ...poseAxo(), duration: 1.6, ease: 'power3.inOut', onUpdate: () => persp.lookAt(controls.target), onComplete: res }));
  })();
  const poseAxo = () => ({ x: centro.x - radio * 1.9, y: radio * 2.6, z: centro.z + radio * 2.3 });

  // selección en el modelo
  const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2();
  let down: { x: number; y: number } | null = null;
  const pos = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, cam as THREE.PerspectiveCamera); };
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) { down = null; return; } down = null;
    pos(e); const h = ray.intersectObjects(pick, false).find((x) => x.object.visible);
    api.seleccionar(h ? (h.object.userData.clave as string) : null);
  });
  canvas.addEventListener('pointermove', (e) => { if (down) return; pos(e); canvas.style.cursor = ray.intersectObjects(pick, false).length ? 'pointer' : ''; });

  // dibujo a demanda
  let raf = 0, vivo = true, despiertoHasta = 0, primeros = 40;
  function despertar(ms = 1200): void { despiertoHasta = Math.max(despiertoHasta, performance.now() + ms); }
  const alInteractuar = () => despertar();
  ['pointerdown', 'pointermove', 'wheel', 'keydown', 'input', 'click'].forEach((e) => addEventListener(e, alInteractuar, { passive: true }));
  function loop(): void {
    if (!vivo) return; raf = requestAnimationFrame(loop);
    const mueve = controls.update();
    const anim = gsap.getTweensOf([persp.position, controls.target, orto]).length > 0;
    if (!(mueve || anim || primeros > 0 || performance.now() < despiertoHasta)) return;
    if (primeros > 0) primeros--;
    composer.render();
  }
  loop();

  // miniaturas fuera de pantalla
  let mini: THREE.WebGLRenderer | null = null; const miniScene = new THREE.Scene(); const miniCam = new THREE.PerspectiveCamera(30, 4 / 3, 0.01, 100);
  const cache = new Map<string, string>();
  function miniRenderer(): THREE.WebGLRenderer {
    if (mini) return mini;
    mini = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); mini.setSize(240, 180, false); mini.setPixelRatio(1);
    mini.outputColorSpace = THREE.SRGBColorSpace; mini.toneMapping = THREE.ACESFilmicToneMapping;
    miniScene.environment = new THREE.PMREMGenerator(mini).fromScene(new RoomEnvironment(), 0.03).texture;
    miniScene.add(new THREE.HemisphereLight('#ffffff', '#8a8174', 0.8)); const d = new THREE.DirectionalLight('#ffffff', 1.6); d.position.set(-2, 4, 3); miniScene.add(d);
    return mini;
  }
  let cola = Promise.resolve();
  const enCola = <T>(f: () => T): Promise<T> => { const p = cola.then(() => new Promise<T>((res) => requestAnimationFrame(() => res(f())))); cola = p.then(() => undefined, () => undefined); return p; };
  function fotografiar(obj: THREE.Object3D, distancia = 1.9): string {
    const rr = miniRenderer();
    miniScene.add(obj);
    const b = new THREE.Box3().setFromObject(obj); const c = b.getCenter(new THREE.Vector3()); const s = b.getSize(new THREE.Vector3()); const R = Math.max(s.x, s.y, s.z) || 1;
    miniCam.position.set(c.x + R * 0.9 * distancia, c.y + R * 0.7 * distancia, c.z + R * 1.1 * distancia); miniCam.lookAt(c); miniCam.near = R * 0.05; miniCam.far = R * 20; miniCam.updateProjectionMatrix();
    rr.render(miniScene, miniCam);
    const url = rr.domElement.toDataURL('image/png');
    miniScene.remove(obj);
    return url;
  }

  const api: Configurador = {
    listo,
    piezas: () => piezas,
    materiales: () => [...mats.keys()].map((n) => ({ nombre: n, etiqueta: etiqueta(n), grupo: grupoDe(n) })).sort((a, b) => GRUPOS_MAT.indexOf(a.grupo) - GRUPOS_MAT.indexOf(b.grupo) || a.etiqueta.localeCompare(b.etiqueta)),
    get seleccion() { return seleccion; },
    get vista() { return vista; },
    onSeleccion: null,
    async miniaturaPieza(clave) {
      if (cache.has('p:' + clave)) return cache.get('p:' + clave)!;
      const ms = mallasPorPieza.get(clave); if (!ms?.length) return '';
      const url = await enCola(() => {
        const g = new THREE.Group();
        // solo la primera instancia de la pieza
        const n0 = primerNodo.get(clave)!; const primera = ms.filter((m) => m === n0 || m.parent === n0);
        for (const m of primera) { const c = new THREE.Mesh(m.geometry, m.material); m.updateWorldMatrix(true, false); c.applyMatrix4(m.matrixWorld); g.add(c); }
        return fotografiar(g);
      });
      cache.set('p:' + clave, url); return url;
    },
    async miniaturaMaterial(nombre) {
      if (cache.has('m:' + nombre)) return cache.get('m:' + nombre)!;
      const mt = mats.get(nombre); if (!mt) return '';
      const url = await enCola(() => fotografiar(new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 32), mt), 1.05));
      cache.set('m:' + nombre, url); return url;
    },
    seleccionar(clave, enfocar = false) {
      seleccion = clave;
      outline.selectedObjects = clave ? mallasPorPieza.get(clave) ?? [] : [];
      if (clave && enfocar && vista === '3d') {
        const b = new THREE.Box3(); (mallasPorPieza.get(clave) ?? []).forEach((m) => b.expandByObject(m));
        if (!b.isEmpty()) { const c = b.getCenter(new THREE.Vector3()); gsap.to(controls.target, { x: c.x, y: Math.max(0.4, c.y), z: c.z, duration: 0.9, ease: 'power2.inOut' }); }
      }
      despertar(1500); api.onSeleccion?.(clave);
    },
    materialActual(clave, original) { return cambios.get(clave + '::' + original) ?? original; },
    aplicar(clave, original, nuevo) {
      const destino = nuevo ? mats.get(nuevo) : mats.get(original); if (!destino) return;
      if (nuevo && nuevo !== original) cambios.set(clave + '::' + original, nuevo); else cambios.delete(clave + '::' + original);
      for (const m of mallasPorPieza.get(clave) ?? []) {
        const orig = m.userData.original as string[];
        if (Array.isArray(m.material)) m.material = m.material.map((x, i) => (orig[i] === original ? destino : x));
        else if (orig[0] === original) m.material = destino;
      }
      cache.delete('p:' + clave); despertar(800);
    },
    setVista(v) {
      vista = v;
      if (v === '2d') {
        cam = orto; orto.position.set(centro.x, 30, centro.z); orto.up.set(0, 0, -1); orto.lookAt(centro); orto.zoom = 1; orto.updateProjectionMatrix();
        controls.object = orto; controls.target.copy(centro); controls.enableRotate = false;
      } else {
        cam = persp; controls.object = persp; controls.enableRotate = true; controls.target.copy(centro);
        gsap.to(persp.position, { ...poseAxo(), duration: 1, ease: 'power2.inOut' });
      }
      pasoRender.camera = cam; gtao.camera = cam as THREE.PerspectiveCamera; outline.renderCamera = cam; controls.update(); despertar(1500);
    },
    setZoom(z) {
      if (vista === '2d') { orto.zoom = z; orto.updateProjectionMatrix(); }
      else { const dir = persp.position.clone().sub(controls.target).normalize(); const d = radio * 4.2 / z; persp.position.copy(controls.target).addScaledVector(dir, d); }
      despertar(600);
    },
    centrar() { if (vista === '2d') { orto.zoom = 1; orto.updateProjectionMatrix(); controls.target.copy(centro); orto.position.set(centro.x, 30, centro.z); } else { gsap.to(controls.target, { x: centro.x, y: centro.y, z: centro.z, duration: 0.8 }); gsap.to(persp.position, { ...poseAxo(), duration: 1 }); } despertar(1200); },
    dispose() {
      vivo = false; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); gsap.killTweensOf([persp.position, controls.target, orto]);
      ['pointerdown', 'pointermove', 'wheel', 'keydown', 'input', 'click'].forEach((e) => removeEventListener(e, alInteractuar));
      scene.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); });
      mats.forEach((m) => { Object.values(m).forEach((v) => { if (v instanceof THREE.Texture) v.dispose(); }); m.dispose(); });
      composer.dispose(); renderer.dispose(); mini?.dispose(); env.dispose(); canvas.remove();
    },
  };
  return api;
}
