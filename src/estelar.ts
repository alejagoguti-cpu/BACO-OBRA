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
  const normal = pinCanvas('#141A21', false), obra = pinCanvas('#E8604F', true);
  const ents: Cesium.Entity[] = [];
  for (const h of HOTELES) {
    ents.push(viewer.entities.add({
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
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, h.obra ? 4.5e6 : 9e4),
      },
    }));
  }
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((e: { position: Cesium.Cartesian2 }) => {
    if (document.body.dataset.modo !== 'pais') return;
    const p = viewer.scene.pick(e.position) as { id?: Cesium.Entity } | undefined;
    const id = p?.id?.id;
    if (typeof id === 'string' && id.startsWith('estelar-')) onPick(id.slice(8));
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  handler.setInputAction((e: { endPosition: Cesium.Cartesian2 }) => {
    if (document.body.dataset.modo !== 'pais') return;
    const p = viewer.scene.pick(e.endPosition) as { id?: Cesium.Entity } | undefined;
    viewer.scene.canvas.style.cursor = typeof p?.id?.id === 'string' && p.id.id.startsWith('estelar-') ? 'pointer' : '';
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  return { show(v: boolean) { ents.forEach((e) => { e.show = v; }); } };
}
