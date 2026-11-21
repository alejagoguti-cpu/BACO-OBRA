/* Pines de los hoteles Estelar sobre el globo de Cesium (modo país). */
import * as Cesium from 'cesium';
import { HOTELES } from './app/data';

function pinCanvas(color: string, obra: boolean): HTMLCanvasElement {
  const s = obra ? 2 : 1.4; const w = Math.round(40 * s), h = Math.round(52 * s);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d')!; x.scale(s, s);
  x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(20, 49, 8, 2.6, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = color; x.strokeStyle = '#fff'; x.lineWidth = 2.5;
  x.beginPath(); x.arc(20, 18, 15, Math.PI, 0); x.bezierCurveTo(35, 31, 24, 38, 20, 48); x.bezierCurveTo(16, 38, 5, 31, 5, 18); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(20, 18, 6, 0, Math.PI * 2); x.fill();
  return c;
}

export function crearPinesEstelar(viewer: Cesium.Viewer, onPick: (id: string) => void): { show(v: boolean): void } {
  const normal = pinCanvas('#0E3064', false), obra = pinCanvas('#B79E66', true);
  const pinNormal = normal.toDataURL(), pinObra = obra.toDataURL();
  const ents: Cesium.Entity[] = [];
  const ds = new Cesium.CustomDataSource('hoteles-estelar');
  ds.clustering.enabled = true; ds.clustering.pixelRange = 34; ds.clustering.minimumClusterSize = 2;
  ds.clustering.clusterEvent.addEventListener((entidades, cl) => {
    const hs = entidades.map((e) => HOTELES.find((h) => 'estelar-' + h.id === e.id)).filter(Boolean) as typeof HOTELES;
    const ciudades = [...new Set(hs.map((h) => h.ciudad))];
    const obra = hs.some((h) => h.obra);
    cl.billboard.show = true; cl.billboard.image = obra ? pinObra : pinNormal; cl.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
    cl.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;
    cl.label.show = true; const cuenta = (c: string) => hs.filter((h) => h.ciudad === c).length;
    const prin = obra ? 'Bogotá' : [...ciudades].sort((x, y) => cuenta(y) - cuenta(x))[0];
    cl.label.text = (ciudades.length === 1 ? `${prin} · ${hs.length} hoteles` : `${hs.length} hoteles · ${prin} y ${ciudades.length - 1 === 1 ? ciudades.find((c) => c !== prin) : (ciudades.length - 1) + ' ciudades más'}`) + (obra ? '  ·  La Fontana en obra' : '');
    cl.label.font = '800 14px Urbanist, system-ui, sans-serif'; cl.label.fillColor = Cesium.Color.fromCssColorString('#16202B');
    cl.label.showBackground = true; cl.label.backgroundColor = Cesium.Color.WHITE.withAlpha(0.94); cl.label.backgroundPadding = new Cesium.Cartesian2(10, 6);
    cl.label.verticalOrigin = Cesium.VerticalOrigin.BOTTOM; cl.label.pixelOffset = new Cesium.Cartesian2(0, obra ? -112 : -78); cl.label.disableDepthTestDistance = Number.POSITIVE_INFINITY;
  });
  viewer.dataSources.add(ds);
  for (const h of HOTELES) {
    ents.push(ds.entities.add({
      id: 'estelar-' + h.id,
      position: Cesium.Cartesian3.fromDegrees(h.lon, h.lat, 0),
      billboard: {
        image: h.obra ? obra : normal, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY, scaleByDistance: new Cesium.NearFarScalar(2e4, 1.1, 3e6, 0.7),
      },
      label: {
        text: h.obra ? 'La Fontana · obra' : h.nombre.replace('Estelar ', ''), font: (h.obra ? '800 15px' : '700 13px') + ' Urbanist, system-ui, sans-serif',
        fillColor: Cesium.Color.fromCssColorString('#16202B'), showBackground: true, backgroundColor: Cesium.Color.WHITE.withAlpha(0.92),
        backgroundPadding: new Cesium.Cartesian2(9, 6), pixelOffset: new Cesium.Cartesian2(0, h.obra ? -112 : -78),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        
      },
    }));
  }
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((e: { position: Cesium.Cartesian2 }) => {
    if (document.body.dataset.modo !== 'pais') return;
    const p = viewer.scene.pick(e.position) as { id?: Cesium.Entity | Cesium.Entity[] } | undefined;
    if (Array.isArray(p?.id)) { // grupo de hoteles: acercarse a la ciudad
      const hs = p!.id.map((x) => HOTELES.find((h) => 'estelar-' + h.id === x.id)).filter(Boolean) as typeof HOTELES;
      if (hs.length) { detenerCine(viewer); const lon = hs.reduce((a, h) => a + h.lon, 0) / hs.length, lat = hs.reduce((a, h) => a + h.lat, 0) / hs.length; viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat - 0.17, 16000), orientation: { heading: 0, pitch: Cesium.Math.toRadians(-40), roll: 0 }, duration: 2.4 }); }
      return;
    }
    const id = (p?.id as Cesium.Entity | undefined)?.id;
    if (typeof id === 'string' && id.startsWith('estelar-')) onPick(id.slice(8));
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  handler.setInputAction((e: { endPosition: Cesium.Cartesian2 }) => {
    if (document.body.dataset.modo !== 'pais') return;
    const p = viewer.scene.pick(e.endPosition) as { id?: Cesium.Entity | Cesium.Entity[] } | undefined;
    viewer.scene.canvas.style.cursor = Array.isArray(p?.id) || (typeof (p?.id as Cesium.Entity | undefined)?.id === 'string' && (p!.id as Cesium.Entity).id.startsWith('estelar-')) ? 'pointer' : '';
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  return { show(v: boolean) { ds.show = v; } };
}

/* ---------------- cámara cinematográfica (modo país) ---------------- */
const rectHoteles = () => {
  const lons = HOTELES.map((h) => h.lon), lats = HOTELES.map((h) => h.lat);
  return Cesium.Rectangle.fromDegrees(Math.min(...lons) - 0.9, Math.min(...lats) - 1.1, Math.max(...lons) + 0.9, Math.max(...lats) + 0.7);
};
let orbita: (() => void) | null = null;
let cancelado = 0;
export function detenerCine(viewer: Cesium.Viewer): void { cancelado++; orbita?.(); orbita = null; viewer.camera.cancelFlight(); }

/** giro lento alrededor de Colombia hasta que la persona toque el mapa */
function orbitar(viewer: Cesium.Viewer): void {
  orbita?.();
  const c = Cesium.Rectangle.center(rectHoteles());
  const centro = Cesium.Cartesian3.fromRadians(c.longitude, c.latitude, 0);
  const off = new Cesium.HeadingPitchRange(viewer.camera.heading, Cesium.Math.toRadians(-48), 2.1e6);
  const t0 = performance.now();
  const quitar = viewer.scene.preRender.addEventListener(() => {
    off.heading = viewer.camera.heading + 0.0007;
    viewer.camera.lookAt(centro, off);
    if (performance.now() - t0 > 90000) parar();
  });
  const parar = () => { quitar(); viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); viewer.canvas.removeEventListener('pointerdown', parar); viewer.canvas.removeEventListener('wheel', parar); orbita = null; };
  viewer.canvas.addEventListener('pointerdown', parar, { once: true });
  viewer.canvas.addEventListener('wheel', parar, { once: true });
  orbita = parar;
}

/** entrada: desde el espacio, bajada inclinada sobre Colombia hasta encuadrar todos los hoteles y giro lento */
export function verTodos(viewer: Cesium.Viewer, desdeEspacio = false): void {
  detenerCine(viewer); const yo = cancelado;
  const c = Cesium.Rectangle.center(rectHoteles());
  const ir = () => viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromRadians(c.longitude, c.latitude - Cesium.Math.toRadians(13.5), 1.75e6),
    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-48), roll: 0 }, duration: desdeEspacio ? 5.2 : 3,
    easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    complete: () => { if (yo === cancelado) orbitar(viewer); },
  });
  if (desdeEspacio) {
    viewer.camera.setView({ destination: Cesium.Cartesian3.fromRadians(c.longitude + 0.35, c.latitude - 0.2, 1.6e7), orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 } });
  }
  ir();
}

/** recorrido cinematográfico ciudad por ciudad; onCiudad informa la ciudad en pantalla (null al terminar) */
export async function recorrido(viewer: Cesium.Viewer, onCiudad: (c: string | null) => void): Promise<void> {
  detenerCine(viewer); const yo = cancelado;
  const ciudades = [...new Set(HOTELES.map((h) => h.ciudad))];
  const vuelo = (o: Parameters<Cesium.Camera['flyTo']>[0]) => new Promise<boolean>((r) => viewer.camera.flyTo({ ...o, complete: () => r(true), cancel: () => r(false) }));
  const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
  for (const [i, ciudad] of ciudades.entries()) {
    if (yo !== cancelado) return;
    const hs = HOTELES.filter((h) => h.ciudad === ciudad);
    const lon = hs.reduce((a, h) => a + h.lon, 0) / hs.length, lat = hs.reduce((a, h) => a + h.lat, 0) / hs.length;
    const alt = hs.length > 1 ? 16000 : 9000;
    onCiudad(ciudad);
    const ok = await vuelo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat - alt / 95000, alt), orientation: { heading: Cesium.Math.toRadians((i * 47) % 360 - 20), pitch: Cesium.Math.toRadians(-38), roll: 0 }, duration: 3.6, easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT });
    if (!ok || yo !== cancelado) return;
    await espera(2200);
  }
  onCiudad(null);
  if (yo === cancelado) verTodos(viewer);
}

/** vuelo cinematográfico a una ciudad encuadrando todos sus hoteles */
export function volarCiudad(viewer: Cesium.Viewer, ciudad: string): void {
  detenerCine(viewer);
  const hs = HOTELES.filter((h) => h.ciudad === ciudad); if (!hs.length) return;
  const lon = hs.reduce((a, h) => a + h.lon, 0) / hs.length, lat = hs.reduce((a, h) => a + h.lat, 0) / hs.length;
  const ext = Math.max(0.01, ...hs.map((h) => Math.hypot(h.lon - lon, h.lat - lat)));
  const alt = Math.min(60000, Math.max(9000, ext * 220000));
  viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat - alt / 125000, alt * 1.15), orientation: { heading: 0, pitch: Cesium.Math.toRadians(-48), roll: 0 }, duration: 3.2, easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT });
}
