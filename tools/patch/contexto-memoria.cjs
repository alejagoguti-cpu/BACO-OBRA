// Contexto: decodificador Draco, árboles sin autosombra y liberación de memoria de video al entrar al gemelo.
const fs = require('fs'); const p = 'src/twin/stage.ts';
let s = fs.readFileSync(p, 'utf8'); const CRLF = s.includes('\r\n'); s = s.split('\r\n').join('\n');
function R(a, b) { if (!s.includes(a)) { console.error('NO ENCONTRADO:\n' + a.slice(0, 160)); process.exit(1); } s = s.replace(a, () => b); }
R("import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';", "import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';\nimport { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';");
R("    const loader = new GLTFLoader();\n    // mismo contexto", "    const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(BASE + 'draco/'));\n    ctxCargado = true; enuCtx = enu;\n    // mismo contexto");
R("        mesh.castShadow = tipo === 'hotel' || tipo === 'pbr' || tipo === 'arbol'; mesh.receiveShadow = true; mesh.raycast = () => {};",
  "        mesh.castShadow = tipo === 'hotel' || tipo === 'pbr' || tipo === 'arbol'; mesh.receiveShadow = tipo !== 'arbol'; mesh.raycast = () => {};");
R("  let conPiso = false;", "  let conPiso = false;\n  let ctxCargado = false; let enuCtx: Manifest['enu'] | null = null;\n  /** libera la memoria de video del contexto (se recarga desde la caché del navegador al volver) */\n  function liberarContexto(): void {\n    if (!ctxCargado) return;\n    contexto.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => { Object.values(x).forEach((v) => { if (v instanceof THREE.Texture) v.dispose(); }); x.dispose(); }); });\n    contexto.clear(); ctxMats.length = 0; ctxCargado = false;\n  }");
R("    pausar(p) {", "    pausar(p) {\n      if (p && host.closest('#twin')?.querySelector('#twRoom:not([hidden])')) liberarContexto();\n      if (!p && !ctxCargado && enuCtx) void cargarContexto(enuCtx);");
R("sol.shadow.mapSize.set(4096, 4096);", "sol.shadow.mapSize.set(2048, 2048);");
fs.writeFileSync(p, CRLF ? s.split('\n').join('\r\n') : s); console.log('ok');
