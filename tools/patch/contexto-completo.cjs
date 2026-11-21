// Visor del gemelo: carga TODO el contexto ya hecho (el mismo de la escena del sitio) y no lo apaga al seleccionar.
const fs = require('fs'); const p = 'src/twin/stage.ts';
let s = fs.readFileSync(p, 'utf8'); const CRLF = s.includes('\r\n'); s = s.split('\r\n').join('\n');
function R(a, b) { if (!s.includes(a)) { console.error('NO ENCONTRADO:\n' + a.slice(0, 160)); process.exit(1); } s = s.replace(a, () => b); }

R(`    const loader = new GLTFLoader();
    await Promise.all(['hotel_plazoleta', 'hotel_fachadas', 'hotel_cubiertas', 'torres_vecinas'].map(async (f) => {
      let gltf; try { gltf = await loader.loadAsync(\`\${BASE}secciones/\${f}.glb\`); } catch { return; }
      const recortar = f === 'hotel_fachadas' || f === 'hotel_cubiertas';`,
`    const loader = new GLTFLoader();
    // mismo contexto que la escena del sitio (src/site.ts): suelos, manzanas, hotel, vecinos PBR y árboles 3D
    const leer = async (f: string) => { try { return (await (await fetch(BASE + 'secciones/' + f)).json()).secciones as { key: string; file: string }[]; } catch { return []; } };
    const [edif, suelo, arb3d] = await Promise.all([leer('edificios.json'), leer('suelo.json'), leer('arboles3d.json')]);
    const SUELO_TEX: Record<string, [string, number]> = { Terreno: ['tex_prado.webp', 6], Separadores: ['tex_prado.webp', 6], Vias: ['tex_asfalto.webp', 5], Andenes: ['tex_anden.webp', 2], Ciclorrutas: ['tex_ciclo.webp', 3] };
    const texCtx = new Map<string, THREE.Texture>();
    const tex = (f: string) => { if (!texCtx.has(f)) { const t = texLoader.load(BASE + 'secciones/' + f); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; texCtx.set(f, t); } return texCtx.get(f)!; };
    const archivos = [
      ...suelo.map((x) => ({ f: x.file, tipo: 'suelo', key: x.key })),
      { f: 'hotel_plazoleta.glb', tipo: 'pbr', key: '' }, { f: 'hotel_fachadas.glb', tipo: 'hotel', key: '' }, { f: 'hotel_cubiertas.glb', tipo: 'hotel', key: '' },
      ...['torres_vecinas', 'esquina_ak15', 'metro127', 'clinica127', 'unicentro_cubierta'].map((k) => ({ f: k + '.glb', tipo: 'pbr', key: '' })),
      ...edif.filter((x) => x.key !== 'Hotel').map((x) => ({ f: x.file, tipo: 'edif', key: '' })),
      ...arb3d.map((x) => ({ f: x.file, tipo: 'arbol', key: '' })),
    ];
    let hayPiso = false;
    await Promise.all(archivos.map(async ({ f: archivo, tipo, key }) => {
      let gltf; try { gltf = await loader.loadAsync(\`\${BASE}secciones/\${archivo}\`); } catch { return; }
      const recortar = tipo === 'hotel';
      if (tipo === 'suelo') hayPiso = true;`);

R(`        const m = mesh.material as THREE.MeshStandardMaterial;
        m.transparent = true; m.userData.baseOp = m.opacity; ctxMats.push(m);
        mesh.castShadow = f !== 'hotel_plazoleta'; mesh.receiveShadow = true; mesh.raycast = () => {};`,
`        let m = mesh.material as THREE.MeshStandardMaterial;
        if (tipo === 'suelo') {
          const [t, esc] = SUELO_TEX[key] ?? ['', 0];
          if (t) {
            const uv = new Float32Array(pos.count * 2);
            for (let i = 0; i < pos.count; i++) { uv[i * 2] = pos.getX(i) / esc; uv[i * 2 + 1] = pos.getZ(i) / esc; }
            g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
            m = new THREE.MeshStandardMaterial({ map: tex(t), roughness: 0.95 });
          }
          if (key !== 'Terreno') { m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -2; }
          mesh.material = m;
        } else if (tipo === 'edif') {
          m = new THREE.MeshStandardMaterial({ color: '#e6e2db', roughness: 0.9, flatShading: true }); mesh.material = m;
        }
        m.transparent = true; m.userData.baseOp = m.opacity; ctxMats.push(m);
        mesh.castShadow = tipo === 'hotel' || tipo === 'pbr' || tipo === 'arbol'; mesh.receiveShadow = true; mesh.raycast = () => {};`);
R(`      contexto.add(gltf.scene);
    }));
    aplicarEstado();`, `      contexto.add(gltf.scene);
    }));
    if (hayPiso) sombraSuelo.visible = false;
    conPiso = hayPiso;
    aplicarEstado();`);
R(`    sombraSuelo.visible = st.otros > 0.2;`, `    sombraSuelo.visible = !conPiso && st.otros > 0.2;`);
R(`  const ctxMats: THREE.Material[] = [];`, `  const ctxMats: THREE.Material[] = [];\n  let conPiso = false;`);
// el contexto no se apaga: al seleccionar la torre queda completo; en la secuencia BIM queda tenue de fondo
R(`      gsap.to(st, { ctx: sel ? 0.18 : 1, duration: 0.8, ease: 'power2.out' });`, ``);
R(`      .to(st, { ctx: 0, duration: 0.9 }, 'alejar')`, `      .to(st, { ctx: 0.28, duration: 0.9 }, 'alejar')`);
fs.writeFileSync(p, CRLF ? s.split('\n').join('\r\n') : s); console.log('ok');
