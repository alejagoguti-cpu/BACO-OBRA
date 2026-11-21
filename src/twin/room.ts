/* Gemelo digital interior de una habitación (hoy: 216, modelo SketchUp tipo Twin).
   Conserva geometría y materiales del modelo; mejora la presentación: entorno PBR, sombras suaves, GTAO
   (oclusión ambiental), tone mapping ACES + exposición, contorno sutil de selección y cámara de recorrido.
   Cada malla seleccionable recibe un identificador estable `SKP216:<nombre del nodo>`; su categoría se infiere
   del nombre del MATERIAL del SketchUp (lo dice la ficha: no hay IDs de Revit en este modelo). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { draco } from './draco';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { gunzipSync } from 'fflate';
import gsap from 'gsap';

export interface ElementoTwin { id: string; nombre: string; categoria: string; especialidad: string; material: string; nodo: string; tris: number }
const REGLAS: [RegExp, string, string][] = [
  [/porcelain/i, 'Aparato sanitario', 'Red hidrosanitaria'],
  [/tile ba|piso tile/i, 'Piso de baño', 'Acabados e interiorismo'],
  [/santorini|silver blue/i, 'Enchape de baño', 'Acabados e interiorismo'],
  [/aluminium brushed|anodized/i, 'Grifería o accesorio de baño', 'Red hidrosanitaria'],
  [/parquet|flooring/i, 'Piso', 'Acabados e interiorismo'],
  [/carpet|tapete/i, 'Tapete', 'Mobiliario y equipamiento'],
  [/glass window/i, 'Ventana', 'Arquitectura'],
  [/^luz$|corte luces/i, 'Luminaria', 'Red eléctrica'],
  [/pintura|tendido|papel colgadua/i, 'Muro (acabado)', 'Acabados e interiorismo'],
  [/cortina/i, 'Cortina', 'Mobiliario y equipamiento'],
  [/leather|velvet|jacquard|fabric|plain natural/i, 'Mueble tapizado', 'Mobiliario y equipamiento'],
  [/madera|sikuani|primadera/i, 'Carpintería', 'Mobiliario y equipamiento'],
  [/neolith|martillado|corten/i, 'Superficie de piedra / metal', 'Acabados e interiorismo'],
  [/iron|gold|alumin|plastic|glass_black/i, 'Herraje o equipo', 'Mobiliario y equipamiento'],
];
function clasificar(mat: string): [string, string] {
  for (const [re, c, e] of REGLAS) if (re.test(mat)) return [c, e];
  return ['Elemento', 'Sin clasificar'];
}

export interface Room {
  readonly listo: Promise<void>;
  onSeleccion: ((e: ElementoTwin | null) => void) | null;
  seleccionarPorId(id: string | null): void;
  vista(v: 'maqueta' | 'recorrido'): void;
  paso(dir: 1 | -1): void;
  readonly vistaActual: 'maqueta' | 'recorrido';
  setExposicion(v: number): void;
  setAO(on: boolean): void;
  dispose(): void;
}

export function crearRoom(host: HTMLElement, url: string): Room {
  const canvas = document.createElement('canvas'); canvas.className = 'tw-canvas'; host.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // mismo recorte del prototipo: separa la Twin de la fachada y del vecino
  const recorte = [new THREE.Plane(new THREE.Vector3(1, 0, 0), -2.5), new THREE.Plane(new THREE.Vector3(0, 0, -1), -0.35)];
  const techo = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.65); // maqueta: corte a 1,65 m como el prototipo
  renderer.clippingPlanes = [...recorte, techo];

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#ECE8E1');
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 0.55;
  const amb = new THREE.HemisphereLight('#fff7ec', '#7a7064', 0.35); scene.add(amb);
  const sol = new THREE.DirectionalLight('#ffe9cf', 2.4); // luz de ventana
  sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); sol.shadow.bias = -0.0008; sol.shadow.normalBias = 0.045; sol.shadow.radius = 5;
  scene.add(sol, sol.target);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.03, 120);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI * 0.49;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 1, 1);
  gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 12 });
  gtao.blendIntensity = 0.85;
  composer.addPass(gtao);
  const outline = new OutlinePass(new THREE.Vector2(1, 1), scene, camera);
  outline.edgeStrength = 3.2; outline.edgeGlow = 0.2; outline.edgeThickness = 1.2; outline.pulsePeriod = 0;
  outline.visibleEdgeColor.set('#C9A96E'); outline.hiddenEdgeColor.set('#5a4a2a');
  composer.addPass(outline);
  composer.addPass(new OutputPass());

  const mallas: THREE.Mesh[] = [];
  const porId = new Map<string, { mesh: THREE.Mesh; el: ElementoTwin }>();
  const techos: THREE.Mesh[] = [];
  const centro = new THREE.Vector3(4, 1.2, 1); let radio = 6; let piso = 0;
  let vistaActual: 'maqueta' | 'recorrido' = 'maqueta';
  let puntos: { pos: THREE.Vector3; mira: THREE.Vector3 }[] = [];
  let iPunto = 0;

  function resize(): void {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); composer.setSize(w, h); gtao.setSize(w, h); outline.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(host);

  const listo = (async () => {
    const r = await fetch(import.meta.env.BASE_URL + url);
    if (!r.ok) throw new Error('Modelo no disponible: ' + url);
    const bytes = new Uint8Array(await r.arrayBuffer());
    const data = bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes).buffer : bytes.buffer;
    const gltf = await new GLTFLoader().setDRACOLoader(draco()).parseAsync(data as ArrayBuffer, '');
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh; if (!m.isMesh) return;
      const b = new THREE.Box3().setFromObject(m), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
      // mismo filtro del prototipo para retirar fachada/contexto que tapa el interior
      if (s.y > 1.35 && ((c.x < 2.7 && s.z > 1) || (c.z > -0.4 && s.x > 1))) { m.visible = false; return; }
      const esTecho = b.min.y > 1.85 && b.max.y > 2.3 && (s.x > 1.5 || s.z > 1.5);
      const mats = (Array.isArray(m.material) ? m.material : [m.material]) as THREE.MeshStandardMaterial[];
      mats.forEach((mt) => {
        if (!mt.isMeshStandardMaterial) return;
        if (mt.map) { mt.map.anisotropy = renderer.capabilities.getMaxAnisotropy(); mt.map.colorSpace = THREE.SRGBColorSpace; }
        if (/glass/i.test(mt.name)) { mt.transparent = true; mt.opacity = Math.min(mt.opacity, 0.35); mt.roughness = 0.05; mt.metalness = 0.1; }
        if (/gold|alumin|iron/i.test(mt.name)) { mt.metalness = Math.max(mt.metalness, 0.75); mt.roughness = Math.min(Math.max(mt.roughness, 0.25), 0.55); }
        if (/^luz$|corte luces/i.test(mt.name)) { mt.emissive = new THREE.Color('#ffd9a0'); mt.emissiveIntensity = 1.2; }
      });
      m.castShadow = !esTecho; m.receiveShadow = true;
      if (esTecho) techos.push(m);
      const matName = mats[0]?.name || 'sin material';
      const [categoria, especialidad] = clasificar(matName);
      const id = 'SKP216:' + (m.name || m.uuid);
      const tris = (m.geometry.index ? m.geometry.index.count : m.geometry.getAttribute('position').count) / 3;
      const el: ElementoTwin = { id, nombre: `${categoria} · ${matName}`, categoria, especialidad, material: matName, nodo: m.name, tris };
      m.userData.el = el; porId.set(id, { mesh: m, el }); mallas.push(m);
    });
    scene.add(gltf.scene);
    const box = new THREE.Box3(); mallas.forEach((m) => { if (m.visible) box.expandByObject(m); });
    box.getCenter(centro); const size = box.getSize(new THREE.Vector3()); radio = Math.max(size.x, size.z) * 0.85; piso = box.min.y; techo.constant = piso + 1.65;
    sol.position.set(centro.x - 4, piso + 5, centro.z + 6); sol.target.position.copy(centro);
    Object.assign(sol.shadow.camera, { left: -radio, right: radio, top: radio, bottom: -radio, near: 0.5, far: 30 });
    // puntos de recorrido a 1,60 m: esquinas interiores mirando al centro (sin inventar: derivados de la caja del modelo)
    const ojo = piso + 1.6, m = 0.7;
    const xs = [box.min.x + m + 0.3, box.max.x - m], zs = [box.min.z + m, box.max.z - m];
    puntos = [
      { pos: new THREE.Vector3(xs[1], ojo, zs[1]), mira: new THREE.Vector3(centro.x, piso + 1.0, centro.z) },
      { pos: new THREE.Vector3(xs[0], ojo, zs[1]), mira: new THREE.Vector3(centro.x, piso + 0.9, centro.z) },
      { pos: new THREE.Vector3(xs[0], ojo, zs[0]), mira: new THREE.Vector3(centro.x, piso + 1.0, centro.z) },
      { pos: new THREE.Vector3(xs[1], ojo, zs[0]), mira: new THREE.Vector3(centro.x, piso + 0.9, centro.z) },
    ];
    // entrada desde arriba (continuidad con la planta): cenital → maqueta
    camera.position.set(centro.x, centro.y + radio * 3.2, centro.z + 0.01); controls.target.copy(centro); controls.update();
    resize();
    await new Promise<void>((res) => gsap.to(camera.position, { x: centro.x - radio * 0.55, y: centro.y + radio * 1.15, z: centro.z + radio * 0.8, duration: 1.8, ease: 'power3.inOut', onUpdate: () => camera.lookAt(controls.target), onComplete: res }));
  })();

  // selección
  const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2();
  let down: { x: number; y: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) { down = null; return; }
    down = null;
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(mallas, false).find((h) => h.object.visible && !(vistaActual === 'maqueta' && techos.includes(h.object as THREE.Mesh)));
    api.seleccionarPorId(hit ? (hit.object.userData.el as ElementoTwin).id : null);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (down) return;
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    canvas.style.cursor = ray.intersectObjects(mallas, false).some((h) => h.object.visible) ? 'pointer' : '';
  });

  let raf = 0, vivo = true;
  function loop(): void { if (!vivo) return; raf = requestAnimationFrame(loop); controls.update(); composer.render(); }
  loop();

  const api: Room = {
    listo,
    onSeleccion: null,
    get vistaActual() { return vistaActual; },
    seleccionarPorId(id) {
      const x = id ? porId.get(id) : null;
      outline.selectedObjects = x ? [x.mesh] : [];
      api.onSeleccion?.(x ? x.el : null);
    },
    vista(v) {
      vistaActual = v;
      techo.constant = piso + 1.65;
      renderer.clippingPlanes = v === 'maqueta' ? [...recorte, techo] : recorte;
      if (v === 'recorrido' && puntos.length) {
        iPunto = 0; const p = puntos[0];
        controls.minDistance = 0.01; controls.maxDistance = 1.2;
        gsap.to(camera.position, { x: p.pos.x, y: p.pos.y, z: p.pos.z, duration: 1.6, ease: 'power2.inOut' });
        gsap.to(controls.target, { x: p.mira.x, y: p.mira.y, z: p.mira.z, duration: 1.6, ease: 'power2.inOut' });
      } else {
        controls.minDistance = 1.5; controls.maxDistance = 24;
        gsap.to(camera.position, { x: centro.x - radio * 0.55, y: centro.y + radio * 1.15, z: centro.z + radio * 0.8, duration: 1.4, ease: 'power2.inOut' });
        gsap.to(controls.target, { x: centro.x, y: centro.y, z: centro.z, duration: 1.4, ease: 'power2.inOut' });
      }
    },
    paso(dir) {
      if (vistaActual !== 'recorrido' || !puntos.length) return;
      iPunto = (iPunto + dir + puntos.length) % puntos.length; const p = puntos[iPunto];
      gsap.to(camera.position, { x: p.pos.x, y: p.pos.y, z: p.pos.z, duration: 1.8, ease: 'power2.inOut' });
      gsap.to(controls.target, { x: p.mira.x, y: p.mira.y, z: p.mira.z, duration: 1.8, ease: 'power2.inOut' });
    },
    setExposicion(v) { renderer.toneMappingExposure = v; },
    setAO(on) { gtao.enabled = on; },
    dispose() {
      vivo = false; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); gsap.killTweensOf(camera.position); gsap.killTweensOf(controls.target);
      scene.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); const mt = m.material as THREE.Material | THREE.Material[] | undefined; if (mt) (Array.isArray(mt) ? mt : [mt]).forEach((x) => { Object.values(x).forEach((v) => { if (v instanceof THREE.Texture) v.dispose(); }); x.dispose(); }); });
      composer.dispose(); renderer.dispose(); canvas.remove();
    },
  };
  return api;
}
