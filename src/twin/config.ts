/* Vínculo único entre la jerarquía del gemelo y los modelos REALES del repositorio.
   Para conectar algo nuevo se edita SOLO este archivo. `null` = pendiente de vinculación (la interfaz lo dice así). */

export interface Especialidad {
  id: string; nombre: string; color: string;
  /** categorías presentes en public/twin (nivel_*.bin por nivel o mep.bin del piso 2) */
  cats: string[];
  fuente: string | null;
}

export const TWIN = {
  hotel: {
    id: 'la-fontana', nombre: 'Hotel Estelar La Fontana', ciudad: 'Bogotá',
    direccion: 'Av. Calle 127 No. 15A-10',
    // centro de la Torre Suites: alineación del Revit sobre el sitio (HLF/build/revit/alineacion.json → manifest.enu)
    // llevada a lon/lat desde el origen GEO de src/config.ts
    lon: -74.04338, lat: 4.704527,
  },
  edificios: [
    {
      id: 'torre-suites', nombre: 'Torre Suites', descripcion: 'Bloque en remodelación · modelo Revit HLF_P2-P6.rvt',
      modelo: 'twin/manifest.json', // 7 niveles exportados por nivel y categoría
      // los demás volúmenes del complejo solo existen como contexto fotogramétrico en Cesium (sin BIM)
    },
  ],
  pisos: {
    'PISO 2': {
      habitaciones: 'twin/habitaciones_p2.json', // Rooms del Revit (límite en acabado)
      mep: 'twin/mep.json',                      // 1001_Hotel_la_fotona_redes.rvt
    },
  } as Record<string, { habitaciones: string; mep: string }>,
  habitaciones: {
    '216': {
      gemelo: 'prototype/habitacion-216-twin.glb',
      fuenteGemelo: 'Maqueta SketchUp 210-HLF-MOCKUP (tipo Twin) · baño detallado de la maqueta, reflejado a su posición en la Twin',
    },
  } as Record<string, { gemelo: string; fuenteGemelo: string }>,
} as const;

const RED = '1001_Hotel_la_fotona_redes.rvt · Piso 2';
const ARQ = 'HLF_P2-P6.rvt';
export const ESPECIALIDADES: Especialidad[] = [
  { id: 'arq', nombre: 'Arquitectura', color: '#C9A96E', cats: ['muros', 'puertas', 'ventanas', 'paneles', 'montantes', 'barandas', 'escaleras', 'cubiertas'], fuente: ARQ },
  { id: 'est', nombre: 'Estructura', color: '#8E9AA6', cats: ['losas', 'columnas', 'vigas'], fuente: ARQ },
  { id: 'ele', nombre: 'Red eléctrica', color: '#E0A526', cats: ['conduit', 'aparatos', 'luminarias'], fuente: RED },
  { id: 'hid', nombre: 'Red hidrosanitaria', color: '#2F7BEA', cats: ['af', 'acs', 'sanitarios', 'otras'], fuente: RED },
  { id: 'des', nombre: 'Desagües', color: '#8B5E3C', cats: ['san'], fuente: RED },
  { id: 'rci', nombre: 'Red contra incendios', color: '#D2332A', cats: ['rci'], fuente: RED },
  { id: 'hvac', nombre: 'HVAC', color: '#5FA8A0', cats: ['ductos'], fuente: RED },
  { id: 'mob', nombre: 'Mobiliario y equipamiento', color: '#9A6BDB', cats: [], fuente: null },
  { id: 'aca', nombre: 'Acabados e interiorismo', color: '#C77D5B', cats: [], fuente: null },
];

export const CAT_TXT: Record<string, string> = {
  muros: 'Muros', puertas: 'Puertas', ventanas: 'Ventanas', paneles: 'Paneles de muro cortina', montantes: 'Montantes', barandas: 'Barandas',
  escaleras: 'Escaleras', cubiertas: 'Cubiertas', losas: 'Losas', columnas: 'Columnas', vigas: 'Vigas',
  conduit: 'Conduit', aparatos: 'Salidas y tomas', luminarias: 'Luminarias', af: 'Agua fría', acs: 'Agua caliente', sanitarios: 'Aparatos sanitarios',
  otras: 'Otras tuberías', san: 'Red sanitaria / desagües', rci: 'Rociadores y red RCI', ductos: 'Ductos',
};
