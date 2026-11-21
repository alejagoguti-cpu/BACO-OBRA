import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gunzipSync } from 'fflate';
import './prototype.css';

const inventory = [
  ['MA-01', 'Mesas de noche', '02'], ['LP-01', 'Lámparas de cabecero', '02'],
  ['LP-02', 'Lámpara de pie', '01'], ['LP-03', 'Lámparas de lectura', '02'],
  ['MA-02', 'Mesa auxiliar', '01'], ['TA-01', 'Tapete entre camas', '01'],
  ['PO-01', 'Poltronas', '02'], ['M-01', 'Escritorio', '01'],
  ['ME-01', 'Clóset', '01'], ['ME-02', 'Minibar', '01'],
  ['ME-03', 'Panel TV', '01'], ['ME-04', 'Entrepaños bar', '01'],
  ['ME-05', 'Espejo de cuerpo entero', '01'], ['ME-07', 'Cabecero', '01'],
  ['ME-09', 'Maletero flexible', '01'],
] as const;

const devices = [
  ['light', 'Iluminación', 'Luz cálida de la habitación'],
  ['climate', 'Climatización', 'Temperatura de confort'],
  ['curtain', 'Cortinas', 'Control de luz natural'],
  ['tv', 'Televisor', 'Panel de entretenimiento'],
  ['lock', 'Acceso', 'Cerradura de la habitación'],
] as const;

export function mountPrototype(host: HTMLElement): () => void {
  host.innerHTML = `<section class="proto" aria-label="Prototipo de la habitación 216">
    <header class="proto-top"><div class="proto-brand"><span class="proto-mark">B<span>·</span></span><span>BACO <strong>OBRA</strong></span></div>
      <div class="proto-crumb"><a href="#obra">Hotel La Fontana</a><span>/</span><a href="#bim-arq">Piso 02</a><span>/</span><b>Habitación 216</b></div>
      <div class="proto-top-actions"><span class="proto-status"><i></i> PROTOTIPO</span><a class="proto-back" href="#obra">← Volver a la torre</a></div>
    </header>
    <div class="proto-layout">
      <aside class="proto-catalog"><div class="proto-overline">01 / ARQUITECTURA</div><h1>Habitación<br><em>216</em></h1>
        <p class="proto-intro">Un espacio Twin para explorar la propuesta de mobiliario y ensayar sus escenas de Smart Home.</p>
        <div class="proto-source"><span class="proto-source-dot"></span><div><b>Modelo SketchUp real</b><small>Maqueta de habitación Twin · no es un render</small></div></div>
        <div class="proto-list-head"><b>Matriz de mobiliario</b><span>${inventory.length} referencias</span></div>
        <div class="proto-list">${inventory.map(([code,name,qty])=>`<div class="proto-item"><span>${code}</span><b>${name}</b><small>×${qty}</small></div>`).join('')}</div>
        <div class="proto-catalog-foot">Fuente: HLF Matriz de Amoblamiento · Habitación Twin</div>
      </aside>
      <main class="proto-stage"><div class="proto-stage-top"><div><span class="proto-overline">MODELO / 3D INTERACTIVO</span><strong>Habitación doble · Twin</strong></div><div class="proto-stage-actions"><button data-pact="reset">Centrar vista</button><span>Arrastra para girar · rueda para acercar</span></div></div>
        <div class="proto-canvas" id="proto-canvas"><div class="proto-loading" id="proto-loading"><span></span>Cargando geometría SketchUp…</div></div>
        <div class="proto-stage-bottom"><span>PROTOTIPO 01 — HOTEL LA FONTANA</span><span>Habitación 216 · Piso 02</span></div>
      </main>
      <aside class="proto-smart"><div class="proto-overline">02 / EXPERIENCIA</div><h2>Smart<br>Home<span>↗</span></h2>
        <p>Prueba escenas de la habitación. Los controles son una simulación del prototipo.</p>
        <div class="proto-scene-title">ESCENA</div><div class="proto-scenes"><button data-pact="scene" data-value="welcome" aria-pressed="true">Bienvenida</button><button data-pact="scene" data-value="rest" aria-pressed="false">Descanso</button><button data-pact="scene" data-value="work" aria-pressed="false">Trabajo</button></div>
        <div class="proto-systems-title"><b>Dispositivos</b><span>DEMO</span></div>
        <div class="proto-devices">${devices.map(([key,name,desc])=>`<button class="proto-device" data-pact="toggle" data-value="${key}" aria-pressed="${key==='light'||key==='climate'}"><span class="proto-device-icon">${key==='light'?'✳':key==='climate'?'❄':key==='curtain'?'▥':key==='tv'?'▣':'⌑'}</span><span class="proto-device-text"><b>${name}</b><small>${desc}</small></span><span class="proto-switch"></span></button>`).join('')}</div>
        <label class="proto-temp">Temperatura <strong id="proto-temp-value">22 °C</strong><input id="proto-temp" type="range" min="18" max="28" value="22" aria-label="Temperatura simulada"></label>
        <div class="proto-note"><b>Demo interactiva</b><span>La interfaz representa posibles controles. No hay dispositivos físicos conectados.</span></div>
      </aside>
    </div></section>`;
  const canvas = host.querySelector<HTMLElement>('#proto-canvas')!;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  canvas.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .05, 100);
  const ambient = new THREE.AmbientLight(0xffffff, 2.0); scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff3df, 2.2); sun.position.set(-3, -5, 9); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xd8e7f3, 1.2); fill.position.set(8, 7, 6); scene.add(fill);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .08;
  controls.minDistance = 3.5; controls.maxDistance = 24;
  controls.maxPolarAngle = Math.PI * .48;
  let center = new THREE.Vector3(4,4,1), radius = 7;
  function resetCamera() { camera.position.copy(center).add(new THREE.Vector3(-radius*.4, -radius*.8, radius*.95)); controls.target.copy(center); controls.update(); }
  resetCamera();
  let alive=true, raf=0;
  const resize = new ResizeObserver(() => { const w=canvas.clientWidth,h=canvas.clientHeight; if (!w||!h) return; camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h); });
  resize.observe(canvas);
  const state: Record<string,boolean> = {light:true,climate:true,curtain:false,tv:false,lock:false};
  function sync() { ambient.intensity=state.light?2:.65; sun.intensity=state.curtain?1.1:2.2; renderer.toneMappingExposure=state.light?1.35:.85;
    host.querySelectorAll<HTMLButtonElement>('[data-pact="toggle"]').forEach(b=>b.setAttribute('aria-pressed',String(state[b.dataset.value!]))) }
  host.addEventListener('click', onClick);
  function onClick(e:Event) { const b=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-pact]'); if(!b)return;
    if(b.dataset.pact==='reset') resetCamera();
    if(b.dataset.pact==='toggle'){const k=b.dataset.value!;state[k]=!state[k];sync()}
    if(b.dataset.pact==='scene') { const name=b.dataset.value; Object.assign(state,name==='rest'?{light:false,climate:true,curtain:true,tv:false,lock:true}:name==='work'?{light:true,climate:true,curtain:false,tv:false,lock:false}:{light:true,climate:true,curtain:false,tv:false,lock:false}); sync();host.querySelectorAll<HTMLButtonElement>('[data-pact="scene"]').forEach(x=>x.setAttribute('aria-pressed',String(x===b))) }
  }
  const temp=host.querySelector<HTMLInputElement>('#proto-temp')!; temp.addEventListener('input',()=>{host.querySelector('#proto-temp-value')!.textContent=temp.value+' °C'});
  const loader = new GLTFLoader();
  const onModel = (gltf: { scene: THREE.Group })=>{
    if(!alive)return;
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const b=new THREE.Box3().setFromObject(o),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());
      if((b.min.z>1.85&&b.max.z>2.3&&(s.x>1.5||s.y>1.5))||(s.z>1.35&&((c.x<2.7&&s.y>1)||(c.y<.4&&s.x>1))))o.visible=false});
    scene.add(gltf.scene);
    const box=new THREE.Box3().setFromObject(gltf.scene); center=box.getCenter(new THREE.Vector3());const size=box.getSize(new THREE.Vector3());radius=Math.max(size.x,size.y,size.z)*.8;resetCamera();
    host.querySelector('#proto-loading')?.remove();
  };
  void (async()=>{
    const response=await fetch(`${import.meta.env.BASE_URL}prototype/habitacion-216-sketchup.glb.gz`);
    if(!response.ok)throw new Error('Modelo no disponible');
    const bytes=new Uint8Array(await response.arrayBuffer());
    const data=bytes[0]===0x1f&&bytes[1]===0x8b?gunzipSync(bytes).buffer:bytes.buffer;
    loader.parse(data,'',onModel,(error)=>{console.error('Modelo SketchUp incompatible',error);const el=host.querySelector('#proto-loading');if(el)el.textContent='No se pudo cargar el modelo. Recarga esta pantalla.'});
  })().catch((error)=>{console.error('Carga del modelo SketchUp',error);const el=host.querySelector('#proto-loading');if(el)el.textContent='No se pudo cargar el modelo. Recarga esta pantalla.'});
  function animate(){if(!alive)return;raf=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)} animate();
  return ()=>{alive=false;cancelAnimationFrame(raf);resize.disconnect();host.removeEventListener('click',onClick);controls.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose())}});renderer.dispose();host.innerHTML=''};
}
