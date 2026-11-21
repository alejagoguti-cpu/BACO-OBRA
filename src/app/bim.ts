/* Visor 3D del Piso 2 por especialidad (three.js).
   Geometría: public/bim/piso2.bin (HLF_P2-P6.rvt) + public/bim/mep.bin (1001_Hotel_la_fotona_redes.rvt).
   Ambos en ejes web (x, z, -y) centrados en el mismo origen. */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ESPECIALIDADES, type Novedad } from './data';

interface Cat { nombre: string; vOff: number; vLen: number; tOff: number; tLen: number }
interface Pack { archivo: string; cats: Cat[]; zmin?: number }

export const GRUPOS: Record<string, { n: string; c: string; op?: number; emis?: boolean; metal?: number }> = {
  muros: { n: 'Muros', c: '#ECE7DD' }, puertas: { n: 'Puertas', c: '#9A6A48' }, ventanas: { n: 'Ventanas', c: '#8FB3C7', op: 0.45 },
  paneles: { n: 'Paneles', c: '#DAD4C8' }, montantes: { n: 'Montantes', c: '#4A4F55', metal: 0.5 }, barandas: { n: 'Barandas', c: '#4A4F55', metal: 0.5 },
  escaleras: { n: 'Escaleras', c: '#C2BCB1' }, cubiertas: { n: 'Cubiertas', c: '#A5563B' },
  losas: { n: 'Losas', c: '#C9C4BB' }, columnas: { n: 'Columnas', c: '#B9B3A9' }, vigas: { n: 'Vigas', c: '#B9B3A9' },
  af: { n: 'Agua fría', c: '#2F7BEA' }, acs: { n: 'Agua caliente', c: '#E8504A' }, san: { n: 'Sanitaria', c: '#8B5E3C' },
  sanitarios: { n: 'Aparatos sanitarios', c: '#F4F6F8' }, otras: { n: 'Otras tuberías', c: '#7F8E9C' },
  conduit: { n: 'Conduit', c: '#D08B12', metal: 0.3 }, aparatos: { n: 'Salidas y tomas', c: '#F2C94C' }, luminarias: { n: 'Luminarias', c: '#FFE7A0', emis: true },
  rci: { n: 'Contra incendios', c: '#D2332A', metal: 0.2 }, ductos: { n: 'Ductos', c: '#A3AEB9', metal: 0.4 },
};

export interface Bim {
  abrir(esp: string): Promise<void>;
  cerrar(): void;
  setPins(n: Novedad[]): void;
  readonly grupos: Set<string>;
  readonly ocultos: Set<string>;
  readonly hoverGrupo: string | null;
  onReportar: ((pos: [number, number, number], grupo: string) => void) | null;
  onPin: ((id: string) => void) | null;
  onHover: ((grupo: string | null) => void) | null;
  reportando: boolean;
  setCorte(on: boolean): void;
  setCorteAltura(h: number): void;
  setFantasma(on: boolean): void;
  toggleGrupo(g: string): void;
  resetGrupos(): void;
  resetCamara(): void;
  enfocar(pos: [number, number, number]): void;
}

export function crearBim(host: HTMLElement): Bim {
  const canvas = document.createElement('canvas');
  canvas.className = 'bim-canvas';
  host.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight('#f6f9fc', '#a8a196', 0.7));
  const sol = new THREE.DirectionalLight('#fff4e2', 1.5);
  sol.position.set(40, 80, 30); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 5, far: 200 });
  sol.shadow.bias = -0.0006;
  scene.add(sol);
  const piso = new THREE.Mesh(new THREE.CircleGeometry(160, 64), new THREE.ShadowMaterial({ opacity: 0.12 }));
  piso.rotation.x = -Math.PI / 2; piso.position.y = 2.6; piso.receiveShadow = true; scene.add(piso);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.3, 2000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.09;
  controls.maxPolarAngle = Math.PI * 0.49; controls.minDistance = 4; controls.maxDistance = 260;
  controls.screenSpacePanning = true;

  const corte = new THREE.Plane(new THREE.Vector3(0, -1, 0), 6.15);
  const sinCorte = new THREE.Plane(new THREE.Vector3(0, -1, 0), 999);
  let planoActivo = corte;
  const mallas = new Map<string, THREE.Mesh[]>();
  const pickables: THREE.Mesh[] = [];
  const grupos = new Set<string>();
  const ocultos = new Set<string>();
  const centro = new THREE.Vector3(0, 4.5, 0);
  let listo: Promise<void> | null = null;
  let esp = 'coo';
  let fantasma = true;
  let anim = 0;
  let hoverGrupo: string | null = null;

  const hoverRing = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.34, 32),
    new THREE.MeshBasicMaterial({ color: '#E8604F', side: THREE.DoubleSide, transparent: true, opacity: 0.92, depthTest: false })
  );
  hoverRing.rotation.x = -Math.PI / 2;
  hoverRing.visible = false;
  hoverRing.renderOrder = 15;
  scene.add(hoverRing);

  function mat(g: string): THREE.MeshStandardMaterial {
    const d = GRUPOS[g] ?? { n: g, c: '#999' };
    return new THREE.MeshStandardMaterial({
      color: d.c, roughness: d.op ? 0.1 : 0.82, metalness: d.metal ?? (d.op ? 0.2 : 0), side: THREE.DoubleSide, flatShading: true,
      transparent: true, opacity: d.op ?? 1, emissive: d.emis ? new THREE.Color(d.c) : new THREE.Color(0), emissiveIntensity: d.emis ? 0.6 : 0,
      clippingPlanes: [corte],
    });
  }
  async function pack(url: string): Promise<void> {
    const r = await fetch(url);
    if (!r.ok) return;
    const man = (await r.json()) as Pack;
    const buf = await (await fetch(url.replace(/[^/]+$/, man.archivo))).arrayBuffer();
    for (const c of man.cats) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buf, c.vOff, c.vLen), 3));
      geo.setIndex(new THREE.BufferAttribute(new Uint32Array(buf, c.tOff, c.tLen), 1));
      geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, mat(c.nombre));
      m.castShadow = !GRUPOS[c.nombre]?.op; m.receiveShadow = true;
      m.userData = { g: c.nombre, base: (GRUPOS[c.nombre]?.op ?? 1) };
      scene.add(m);
      if (!mallas.has(c.nombre)) mallas.set(c.nombre, []);
      mallas.get(c.nombre)!.push(m);
      pickables.push(m);
      grupos.add(c.nombre);
    }
  }
  function cargar(): Promise<void> {
    listo ??= (async () => {
      await Promise.all([pack(import.meta.env.BASE_URL + 'bim/piso2.json'), pack(import.meta.env.BASE_URL + 'bim/mep.json')]);
      const box = new THREE.Box3();
      pickables.forEach((m) => box.expandByObject(m));
      box.getCenter(centro);
      piso.position.set(centro.x, box.min.y - 0.02, centro.z);
    })();
    return listo;
  }

  function aplicar(): void {
    const e = ESPECIALIDADES.find((x) => x.id === esp)!;
    const todos = e.grupos.includes('*');
    for (const [g, ms] of mallas) {
      const activo = (todos || e.grupos.includes(g)) && !ocultos.has(g);
      const oculto = ocultos.has(g);
      for (const m of ms) {
        const mt = m.material as THREE.MeshStandardMaterial;
        const d = GRUPOS[g];
        m.visible = !oculto && (activo || fantasma);
        mt.color.set(activo ? d?.c ?? '#999' : '#cdd5dc');
        mt.opacity = activo ? m.userData.base : g === 'muros' || g === 'losas' ? 0.13 : 0.06;
        mt.depthWrite = activo && m.userData.base === 1;
        mt.emissive.set(activo && d?.emis ? d.c : hoverGrupo === g && activo ? '#1FA58C' : 0x000000);
        mt.emissiveIntensity = activo && d?.emis ? 0.6 : hoverGrupo === g && activo ? 0.25 : 0;
        mt.clippingPlanes = [planoActivo];
        m.castShadow = activo && m.userData.base === 1;
        m.renderOrder = activo ? 0 : 1;
        m.userData.activo = activo;
      }
    }
  }

  /* ---------------- pines de novedades ---------------- */
  const pinGroup = new THREE.Group(); scene.add(pinGroup);
  const texCache = new Map<string, THREE.Texture>();
  function pinTex(color: string): THREE.Texture {
    if (texCache.has(color)) return texCache.get(color)!;
    const c = document.createElement('canvas'); c.width = 96; c.height = 128;
    const x = c.getContext('2d')!;
    x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(48, 120, 16, 5, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = color; x.beginPath(); x.arc(48, 44, 36, Math.PI, 0); x.bezierCurveTo(84, 74, 56, 92, 48, 116); x.bezierCurveTo(40, 92, 12, 74, 12, 44); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(48, 44, 14, 0, Math.PI * 2); x.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; texCache.set(color, t); return t;
  }
  function setPins(ns: Novedad[]): void {
    pinGroup.clear();
    for (const n of ns) {
      if (!n.pos) continue;
      const e = ESPECIALIDADES.find((x) => x.id === n.esp);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: pinTex(n.estado === 'Cerrada' ? '#8a96a3' : e?.c ?? '#1FA58C'), depthTest: false }));
      sp.center.set(0.5, 0.06); sp.scale.set(1.3, 1.7, 1);
      // Las cinco novedades de ejemplo usan coordenadas del prototipo anterior.
      // Las nuevas posiciones marcadas por el usuario ya están en ejes del modelo actual.
      sp.position.set(n.pos[0], n.pos[1], n.pos[2] - (n.ej ? 12 : 0)); sp.renderOrder = 10;
      sp.userData = { id: n.id };
      pinGroup.add(sp);
    }
  }

  /* ---------------- interacción ---------------- */
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let down: { x: number; y: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointermove', (e) => {
    if (down) return;
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const pin = ray.intersectObjects(pinGroup.children)[0];
    if (pin) {
      canvas.style.cursor = 'pointer';
      hoverRing.visible = false;
      if (hoverGrupo !== null) { hoverGrupo = null; aplicar(); api.onHover?.(null); }
      return;
    }
    const hit = ray.intersectObjects(pickables.filter((m) => m.visible && m.userData.activo)).find((h) => h.point.y < planoActivo.constant + 0.01);
    const g = hit ? (hit.object.userData.g as string) : null;
    if (api.reportando && hit) {
      canvas.style.cursor = 'crosshair';
      hoverRing.visible = true;
      hoverRing.position.copy(hit.point);
      if (hit.face) {
        const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        hoverRing.position.addScaledVector(n, 0.03);
        hoverRing.lookAt(hoverRing.position.clone().add(n));
      }
    } else {
      canvas.style.cursor = api.reportando ? 'crosshair' : g ? 'grab' : '';
      hoverRing.visible = false;
    }
    if (g !== hoverGrupo) {
      hoverGrupo = g;
      aplicar();
      api.onHover?.(g);
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down = null; return; }
    down = null;
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const pin = ray.intersectObjects(pinGroup.children)[0];
    if (pin) { api.onPin?.(pin.object.userData.id); return; }
    if (!api.reportando) return;
    const hit = ray.intersectObjects(pickables.filter((m) => m.visible && m.userData.activo)).find((h) => h.point.y < planoActivo.constant + 0.01);
    if (hit) {
      hoverRing.visible = false;
      api.onReportar?.([+hit.point.x.toFixed(2), +hit.point.y.toFixed(2), +hit.point.z.toFixed(2)], hit.object.userData.g as string);
    }
  });

  function resize(): void {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);

  let raf = 0; let abierto = false; let t0 = 0; let camOnly = false;
  const desde = new THREE.Vector3(); const hacia = new THREE.Vector3();
  const targetDesde = new THREE.Vector3(); const targetHacia = new THREE.Vector3();
  function loop(now: number): void {
    if (!abierto) return;
    raf = requestAnimationFrame(loop);
    if (anim) {
      const dur = camOnly ? 900 : 1600;
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      camera.position.lerpVectors(desde, hacia, e);
      if (camOnly) {
        controls.target.lerpVectors(targetDesde, targetHacia, e);
        if (k >= 1) { anim = 0; camOnly = false; }
      } else {
        for (const [g, ms] of mallas) {
          const i = Object.keys(GRUPOS).indexOf(g);
          const kk = Math.min(1, Math.max(0, (now - t0 - i * 45) / 700)), ee = 1 - Math.pow(1 - kk, 3);
          for (const m of ms) m.position.y = (1 - ee) * 6;
        }
        if (k >= 1 && now - t0 > 1600 + 21 * 45 + 700) anim = 0;
      }
    }
    pinGroup.children.forEach((s, i) => { s.position.y += Math.sin(now * 0.004 + i) * 0.002; });
    controls.update();
    renderer.render(scene, camera);
  }

  const api: Bim = {
    grupos,
    ocultos,
    get hoverGrupo() { return hoverGrupo; },
    onReportar: null, onPin: null, onHover: null, reportando: false,
    abrir(e: string) {
      esp = e;
      const primera = !abierto;
      abierto = true; host.hidden = false; resize();
      const p = cargar().then(() => {
        aplicar();
        if (primera) {
          controls.target.copy(centro);
          hacia.set(centro.x + 42, centro.y + 50, centro.z + 57);
          desde.set(centro.x + 90, centro.y + 140, centro.z + 120);
          camera.position.copy(desde); t0 = performance.now(); anim = 1; camOnly = false;
        }
      });
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      return p;
    },
    cerrar() { abierto = false; host.hidden = true; hoverRing.visible = false; cancelAnimationFrame(raf); },
    setPins,
    setCorte(on: boolean) { planoActivo = on ? corte : sinCorte; aplicar(); },
    setCorteAltura(h: number) { corte.constant = h; aplicar(); },
    setFantasma(on: boolean) { fantasma = on; aplicar(); },
    toggleGrupo(g: string) { if (ocultos.has(g)) ocultos.delete(g); else ocultos.add(g); aplicar(); },
    resetGrupos() { ocultos.clear(); aplicar(); },
    resetCamara() {
      desde.copy(camera.position);
      hacia.set(centro.x + 42, centro.y + 50, centro.z + 57);
      targetDesde.copy(controls.target);
      targetHacia.copy(centro);
      t0 = performance.now(); anim = 1; camOnly = true;
    },
    enfocar(pos: [number, number, number]) {
      desde.copy(camera.position);
      targetDesde.copy(controls.target);
      targetHacia.set(...pos);
      hacia.set(pos[0] + 10, pos[1] + 9, pos[2] + 12);
      t0 = performance.now(); anim = 1; camOnly = true;
    },
  };
  return api;
}
