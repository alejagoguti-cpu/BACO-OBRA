/* Datos de la app. Fuentes:
   - Hoteles: "PPT GENERAL ESTELAR INGLES" (lista de hoteles y direcciones). Coordenadas aproximadas por dirección,
     salvo La Fontana (georreferencia exacta del proyecto).
   - Propuesta: Propuesta_BIM_BACO-1.docx, versión 03 (9 nov 2026).
   - Piso 2: numeración de habitaciones del plano IHG (214–225). */

export interface Hotel { id: string; nombre: string; ciudad: string; dir: string; lon: number; lat: number; obra?: boolean }
export const HOTELES: Hotel[] = [
  { id: 'fontana', nombre: 'Estelar La Fontana', ciudad: 'Bogotá', dir: 'Av. Calle 127 No. 15A-10', lon: -74.04145, lat: 4.70208, obra: true },
  { id: 'p93', nombre: 'Estelar Parque de la 93', ciudad: 'Bogotá', dir: 'Calle 93 No. 11-19', lon: -74.0486, lat: 4.6767 },
  { id: 'jones', nombre: 'Estelar Suites Jones', ciudad: 'Bogotá', dir: 'Calle 61 No. 5-39', lon: -74.0591, lat: 4.6452 },
  { id: 'c100', nombre: 'Estelar Calle 100', ciudad: 'Bogotá', dir: 'Calle 100 No. 14-46', lon: -74.0478, lat: 4.6858 },
  { id: 'aptbog', nombre: 'Estelar Apartamentos Bogotá', ciudad: 'Bogotá', dir: 'Av. 127 No. 15A-10', lon: -74.0411, lat: 4.7029 },
  { id: 'milla', nombre: 'Estelar Milla de Oro', ciudad: 'Medellín', dir: 'El Poblado', lon: -75.5738, lat: 6.1996 },
  { id: 'torre', nombre: 'Estelar La Torre Suites', ciudad: 'Medellín', dir: 'Carrera 20 No. 1-33', lon: -75.5603, lat: 6.2052 },
  { id: 'square', nombre: 'Estelar Square', ciudad: 'Medellín', dir: 'El Poblado', lon: -75.5684, lat: 6.2071 },
  { id: 'blue', nombre: 'Estelar Blue', ciudad: 'Medellín', dir: 'El Poblado', lon: -75.5702, lat: 6.2088 },
  { id: 'aptmed', nombre: 'Estelar Apartamentos Medellín', ciudad: 'Medellín', dir: 'Carrera 43B No. 8 Sur-10', lon: -75.5749, lat: 6.2012 },
  { id: 'cali', nombre: 'InterContinental Cali', ciudad: 'Cali', dir: 'Av. Colombia No. 2-72', lon: -76.5413, lat: 3.4497 },
  { id: 'ctg', nombre: 'Estelar Cartagena de Indias', ciudad: 'Cartagena', dir: 'Carrera 1 No. 11-116', lon: -75.5558, lat: 10.3988 },
  { id: 'manz', nombre: 'Estelar Playa Manzanillo', ciudad: 'Cartagena', dir: 'Anillo vial, vía Manzanillo', lon: -75.5128, lat: 10.4872 },
  { id: 'altop', nombre: 'Estelar en Alto Prado', ciudad: 'Barranquilla', dir: 'Alto Prado', lon: -74.8068, lat: 11.0042 },
  { id: 'aptbaq', nombre: 'Estelar Apartamentos Barranquilla', ciudad: 'Barranquilla', dir: 'Alto Prado', lon: -74.8089, lat: 11.0058 },
  { id: 'santamar', nombre: 'Estelar Santamar', ciudad: 'Santa Marta', dir: 'Vía al aeropuerto', lon: -74.2262, lat: 11.1581 },
  { id: 'altamira', nombre: 'Estelar Altamira', ciudad: 'Ibagué', dir: 'Carrera 1 No. 45-50', lon: -75.2052, lat: 4.4431 },
  { id: 'paipa', nombre: 'Estelar Paipa', ciudad: 'Paipa', dir: 'Orillas del lago Sochagota', lon: -73.1152, lat: 5.7562 },
  { id: 'recinto', nombre: 'Estelar Recinto del Pensamiento', ciudad: 'Manizales', dir: 'Km 11 vía al Magdalena', lon: -75.4382, lat: 5.0502 },
  { id: 'cable', nombre: 'Estelar El Cable', ciudad: 'Manizales', dir: 'Carrera 23C No. 64A-60', lon: -75.4872, lat: 5.0561 },
  { id: 'villavo', nombre: 'Estelar Villavicencio', ciudad: 'Villavicencio', dir: 'Villavicencio', lon: -73.6252, lat: 4.1302 },
  { id: 'yopal', nombre: 'Estelar Yopal', ciudad: 'Yopal', dir: 'Yopal', lon: -72.3942, lat: 5.3362 },
];

export interface Esp { id: string; n: string; corto: string; c: string; ic: string; grupos: string[]; desc: string }
/** Especialidades: qué grupos de geometría del Piso 2 resalta cada una (ver bim.ts) */
export const ESPECIALIDADES: Esp[] = [
  { id: 'arq', n: 'Arquitectura e interiorismo', corto: 'Arquitectura', c: '#4F6EF0', ic: 'build', grupos: ['muros', 'puertas', 'ventanas', 'paneles', 'montantes', 'barandas', 'escaleras', 'cubiertas'], desc: 'Muros, puertas, ventanas y acabados' },
  { id: 'est', n: 'Estructura', corto: 'Estructura', c: '#E8604F', ic: 'layers', grupos: ['losas', 'columnas', 'vigas'], desc: 'Losas, columnas y vigas' },
  { id: 'hid', n: 'Hidrosanitaria', corto: 'Hidrosanitaria', c: '#1FA58C', ic: 'drop', grupos: ['af', 'acs', 'san', 'sanitarios', 'otras'], desc: 'Agua fría, caliente y desagües' },
  { id: 'ele', n: 'Eléctrica', corto: 'Eléctrica', c: '#C98A12', ic: 'bolt', grupos: ['conduit', 'aparatos', 'luminarias'], desc: 'Tubería conduit, salidas y luminarias' },
  { id: 'rci', n: 'Red contra incendios', corto: 'Contra incendios', c: '#D2433A', ic: 'fire', grupos: ['rci'], desc: 'Rociadores y ramales' },
  { id: 'coo', n: 'Coordinación BIM', corto: 'Coordinación', c: '#141A21', ic: 'eye', grupos: ['*'], desc: 'Todas las especialidades federadas' },
];

export const HABITACIONES = [
  ['214', 'Junior Suite'], ['215', 'Estándar'], ['216', 'Estándar'], ['217', 'Estándar'], ['218', 'Estándar'],
  ['219', 'Estándar'], ['220', 'Estándar'], ['221', 'Estándar'], ['222', 'Junior Suite'], ['223', 'Junior Suite'],
  ['224', 'Junior Suite'], ['225', 'Junior Suite'],
] as const;
export const ZONAS = [['COR', 'Corredor piso 2'], ['ESC', 'Escaleras'], ['ASC', 'Hall de ascensores'], ['TEC', 'Cuarto técnico']] as const;
export const UBICACIONES: [string, string][] = [
  ...HABITACIONES.map(([n, t]) => ['HAB-' + n, `Habitación ${n} · ${t}`] as [string, string]),
  ...ZONAS.map(([k, t]) => [k, t] as [string, string]),
];

/* ---------------- propuesta v03 ---------------- */
export const M = 1e6;
export const ETAPAS = {
  A: { n: 'Estructuración BIM y contratación', s: 'Estructuración', foco: 'BEP, requisitos EIR/AIR, matrices y anexos de contratación.', c: 'var(--sA)', fee: 33 * M },
  B: { n: 'Coordinación de diseños', s: 'Coordinación', foco: 'Federación de modelos, mesas técnicas y control de interferencias.', c: 'var(--sB)', fee: 47 * M },
  C: { n: 'Acompañamiento de obra', s: 'Obra', foco: 'Gestión BIM, información vigente y cambios registrados.', c: 'var(--sC)', fee: 0 },
  D: { n: 'Cierre digital', s: 'Cierre', foco: 'Modelos récord, datos de activos y transferencia documental.', c: 'var(--sD)', fee: 31 * M },
} as const;
export type EtapaK = keyof typeof ETAPAS;
export const RATE = { solo: 23 * M, integrado: 13.8 * M };

/** Tareas de planeación a cierre (fase 00 = punto de partida acordado, a cargo de terceros) */
export const PLAN: { k: '00' | EtapaK; t: string; quien: string }[] = [
  { k: '00', t: 'Escaneo 3D y modelo de condiciones existentes LOD 300', quien: 'Proveedor de escaneo' },
  { k: 'A', t: 'Revisión técnica del modelo LOD 300', quien: 'BACO Studio' },
  { k: 'A', t: 'EIR / AIR y matriz de usos BIM', quien: 'BACO Studio' },
  { k: 'A', t: 'BEP marco y BEP operativo', quien: 'BACO Studio' },
  { k: 'A', t: 'Protocolo CDE y matriz LOD 400', quien: 'BACO Studio' },
  { k: 'A', t: 'Anexos BIM y evaluación de proponentes', quien: 'BACO Studio + Gerencia' },
  { k: 'B', t: 'Federación de modelos por especialidad', quien: 'Diseñadores' },
  { k: 'B', t: 'Mesas de coordinación e interferencias', quien: 'BACO Studio' },
  { k: 'B', t: 'Paquetes coordinados para construcción', quien: 'Diseñadores' },
  { k: 'C', t: 'Mesas BIM semanales y registro de RFI', quien: 'BACO Studio' },
  { k: 'C', t: 'Modelos de fabricación e instalación LOD 400', quien: 'Contratistas' },
  { k: 'C', t: 'Informes BIM mensuales', quien: 'BACO Studio' },
  { k: 'D', t: 'Modelos as-built y planos récord', quien: 'Especialistas' },
  { k: 'D', t: 'Inventario de activos y base de gemelo digital', quien: 'BACO Studio' },
  { k: 'D', t: 'Acta de transferencia al propietario', quien: 'Gerencia' },
];

export const ENTREGABLES: Record<EtapaK, [string, string][]> = {
  A: [['Revisión del modelo de condiciones existentes LOD 300', 'Archivos, coordenadas y zonas no verificadas'], ['EIR / AIR', 'Requisitos del propietario y del activo'], ['BEP marco', 'Emitido, revisado y aprobado'], ['BEP operativo', 'Concertado con las especialidades'], ['Protocolo CDE', 'Estructura, nomenclatura y estados'], ['Matriz LOD 400', 'Por elemento y especialidad'], ['Anexos BIM de contratación', 'Obligaciones BIM en los contratos']],
  B: [['Modelo federado por hito', 'Trazabilidad de versiones'], ['Reportes de interferencias', 'Responsable y fecha por conflicto'], ['Minutas de mesas de coordinación', 'Decisiones registradas'], ['Registro de incidencias', 'Cierre con versión actualizada'], ['Paquetes coordinados para construcción', 'Aprobación del diseñador competente']],
  C: [['Informes BIM mensuales', 'Entregas, interferencias, riesgos'], ['Control de versiones en el CDE', 'Vigencia documental en obra'], ['Registro de RFI y cambios', 'Soporte, responsables y fechas'], ['Revisión de modelos LOD 400 de instalación', 'Revisión periódica por especialidad']],
  D: [['Modelo federado as-built', 'Integridad, vínculos y nomenclatura'], ['Planos récord por especialidad', 'Lista de verificación AIR'], ['Inventario de equipos', 'Fichas, garantías y mantenimiento'], ['Base de gemelo digital', 'Prueba de apertura y consulta'], ['Acta de transferencia', 'Sesión con el propietario']],
};

export interface Proveedor { id: string; nombre: string; rol: string; esp: string; estado: 'Por contratar' | 'En evaluación' | 'Contratado'; avance: number; entrega: string; contacto: string; ej: boolean }
/** Proveedores de ejemplo: la propuesta define los roles; los nombres y avances son ilustrativos. */
export const PROVEEDORES_SEED: Proveedor[] = [
  { id: 'P1', nombre: 'Proveedor de escaneo 3D', rol: 'Levantamiento y modelo LOD 300', esp: 'coo', estado: 'Contratado', avance: 100, entrega: 'Modelo de condiciones existentes', contacto: 'Por definir', ej: true },
  { id: 'P2', nombre: 'Diseño arquitectónico e interiorismo', rol: 'Modelo LOD 400 de arquitectura', esp: 'arq', estado: 'Contratado', avance: 72, entrega: 'Paquete coordinado piso 2', contacto: 'Por definir', ej: true },
  { id: 'P3', nombre: 'Diseño estructural', rol: 'Modelo LOD 400 de estructura', esp: 'est', estado: 'Contratado', avance: 64, entrega: 'Refuerzos y pasos de losa', contacto: 'Por definir', ej: true },
  { id: 'P4', nombre: 'Diseño hidrosanitario', rol: 'Redes AF, ACS y sanitaria', esp: 'hid', estado: 'Contratado', avance: 58, entrega: 'Redes por habitación', contacto: 'Por definir', ej: true },
  { id: 'P5', nombre: 'Diseño eléctrico', rol: 'Conduit, salidas e iluminación', esp: 'ele', estado: 'En evaluación', avance: 41, entrega: 'Cuadros de carga y circuitos', contacto: 'Por definir', ej: true },
  { id: 'P6', nombre: 'Red contra incendios', rol: 'Rociadores y ramales', esp: 'rci', estado: 'En evaluación', avance: 30, entrega: 'Cálculo hidráulico', contacto: 'Por definir', ej: true },
  { id: 'P7', nombre: 'Contratista de obra civil', rol: 'Ejecución y modelos de instalación', esp: 'arq', estado: 'Por contratar', avance: 0, entrega: 'Cronograma de obra', contacto: 'Por definir', ej: true },
  { id: 'P8', nombre: 'Fabricante de carpintería', rol: 'Puertas, closets y mobiliario fijo', esp: 'arq', estado: 'Por contratar', avance: 0, entrega: 'Planos de taller', contacto: 'Por definir', ej: true },
];

export interface Novedad { id: string; ts: number; loc: string; esp: string; tipo: string; prio: 'Alta' | 'Media' | 'Baja'; txt: string; quien: string; estado: 'Abierta' | 'En revisión' | 'Cerrada'; foto?: string; pos?: [number, number, number]; ej?: boolean }
const d = (s: string) => new Date(s).getTime();
export const NOVEDADES_SEED: Novedad[] = [
  { id: 'N-001', ts: d('2026-11-16T09:20:00-05:00'), loc: 'HAB-216', esp: 'hid', tipo: 'Interferencia', prio: 'Alta', txt: 'Bajante sanitaria coincide con viga en el baño', quien: 'Diseño hidrosanitario', estado: 'Abierta', pos: [-5.4, 4.3, 3.2], ej: true },
  { id: 'N-002', ts: d('2026-11-17T11:05:00-05:00'), loc: 'COR', esp: 'ele', tipo: 'Interferencia', prio: 'Media', txt: 'Bandeja eléctrica sin altura libre bajo cielo raso', quien: 'Diseño eléctrico', estado: 'En revisión', pos: [0.8, 5.4, 0.2], ej: true },
  { id: 'N-003', ts: d('2026-11-17T15:40:00-05:00'), loc: 'HAB-222', esp: 'arq', tipo: 'Avance', prio: 'Baja', txt: 'Muros en drywall de la junior suite terminados', quien: 'Contratista de obra civil', estado: 'Cerrada', pos: [7.6, 4.1, -4.5], ej: true },
  { id: 'N-004', ts: d('2026-11-18T08:30:00-05:00'), loc: 'HAB-214', esp: 'rci', tipo: 'Calidad', prio: 'Media', txt: 'Verificar distancia del rociador al muro de la suite', quien: 'Red contra incendios', estado: 'Abierta', pos: [-11.2, 5.5, 4.8], ej: true },
  { id: 'N-005', ts: d('2026-11-19T10:10:00-05:00'), loc: 'HAB-219', esp: 'est', tipo: 'RFI', prio: 'Alta', txt: '¿Se puede perforar la losa para el paso del desagüe?', quien: 'BACO Studio', estado: 'Abierta', pos: [2.4, 3.3, 5.1], ej: true },
];
export const TIPOS = ['Avance', 'Interferencia', 'RFI', 'Calidad', 'Seguridad', 'Material'];

/** Avance semanal de obra en piso 2 por especialidad (ejemplo ilustrativo hasta conectar el CDE). */
export const SEMANAS = [
  { s: 'S1', ini: '2026-10-26', plan: 6, real: 5 }, { s: 'S2', ini: '2026-11-02', plan: 13, real: 11 },
  { s: 'S3', ini: '2026-11-09', plan: 21, real: 18 }, { s: 'S4', ini: '2026-11-16', plan: 30, real: 26 },
  { s: 'S5', ini: '2026-11-23', plan: 39, real: 0 }, { s: 'S6', ini: '2026-11-30', plan: 48, real: 0 },
  { s: 'S7', ini: '2026-12-07', plan: 57, real: 0 }, { s: 'S8', ini: '2026-12-14', plan: 66, real: 0 },
];
export const AVANCE_ESP: Record<string, number> = { arq: 34, est: 52, hid: 22, ele: 18, rci: 9, coo: 26 };
export const ACTIVIDADES = [
  { esp: 'arq', t: 'Demolición de enchapes en baños 214–218', p: 100 }, { esp: 'arq', t: 'Muros en drywall junior suites 222–225', p: 80 },
  { esp: 'est', t: 'Refuerzo de losa en pasos de desagüe', p: 60 }, { esp: 'hid', t: 'Redes de agua fría y caliente 214–217', p: 45 },
  { esp: 'hid', t: 'Desagües de lavamanos y duchas', p: 30 }, { esp: 'ele', t: 'Tubería conduit en cielo raso del corredor', p: 35 },
  { esp: 'ele', t: 'Cajas de salida en cabeceros', p: 20 }, { esp: 'rci', t: 'Ramales de rociadores en junior suites', p: 15 },
];
