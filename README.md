# BACO Obra · Torre Suites

App web de gestión BIM para la remodelación de Torre Suites (Hotel La Fontana, Bogotá). Prototipo: piso 2.

**Ver en vivo:** https://alejagoguti-cpu.github.io/BACO-OBRA/

## Flujo
1. Mapa de Colombia con los hoteles Estelar (lista del documento corporativo; ubicaciones aproximadas salvo La Fontana).
2. Entrar a La Fontana: vuelo a Bogotá y escena 3D del sector (base del visor HLF, integrada en esta app).
3. Tocar la torre en remodelación → elegir especialidad → modelo 3D del piso 2 con esa especialidad resaltada.
4. Reportar novedades tocando el modelo o escaneando el código QR de cada habitación o zona.
5. Panel, planeación, avance semanal, proveedores, entregables y honorarios.

## Datos
- Arquitectura y estructura del piso 2: `HLF_P2-P6.rvt` → `public/bim/piso2.*`
- Redes MEP del piso 2: `1001_Hotel_la_fotona_redes.rvt` (`tools/revit_mep_p2.py` + `tools/build-mep.mjs`) → `public/bim/mep.*`
- Programación de obra: matriz `Programacion_Obra_Habitaciones_HE_La_Fontana.xlsx` (`tools/build-obra.mjs`) → `public/data/obra.json`. Solo datos operativos; sin nombres ni precios.
- Honorarios: Propuesta BIM BACO v03 (9 nov 2026).
- Novedades: se guardan en el navegador. Para compartirlas entre todos, configurar `SUPA` en `src/app/store.ts`.

## Desarrollo
```
npm install
npm run dev
npm run build   # genera docs/ para GitHub Pages
```

Prototipo de BACO Studio S.A.S. No es un sitio oficial de Hoteles Estelar.
