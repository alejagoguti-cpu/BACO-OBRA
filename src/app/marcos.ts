/* Conversión entre los dos marcos de coordenadas del piso 2:
   - "bim" (visor anterior, public/bim): x = Xrevit − 18.073, z = −(Yrevit − 320.31)  (sin girar)
   - "twin" (gemelo, public/twin): Revit alineado al sitio (HLF/build/revit/alineacion.json) y centrado en manifest.enu.
   Verificado: la caja de las columnas del piso 2 coincide al centímetro tras la conversión. La cota (y) es la misma. */
const A = { th: 11.05, cx: -217.863, cy: 280.296, rx: 17, ry: 333 };
const ENU = { e: -214.09217169557732, n: 270.9238323147715 };
const O = [18.073, 320.31];
const TH = (A.th * Math.PI) / 180, CT = Math.cos(TH), ST = Math.sin(TH);
const SC = 1.000614, AA = (0.0849 * Math.PI) / 180, CA = Math.cos(AA), SA = Math.sin(AA);

export function bimATwin([x, y, z]: [number, number, number]): [number, number, number] {
  const rx = x + O[0], ry = -z + O[1];
  const X = (rx - A.rx) * CT - (ry - A.ry) * ST, Y = (rx - A.rx) * ST + (ry - A.ry) * CT;
  const mx = X + A.cx, my = Y + A.cy;
  const e = (mx * CA - my * SA) * SC, n = (mx * SA + my * CA) * SC;
  return [e - ENU.e, y, -(n - ENU.n)];
}
export function twinABim([x, y, z]: [number, number, number]): [number, number, number] {
  const e = x + ENU.e, n = -z + ENU.n;
  const mx = (e * CA + n * SA) / SC, my = (-e * SA + n * CA) / SC;
  const X = mx - A.cx, Y = my - A.cy;
  const rx = X * CT + Y * ST + A.rx, ry = -X * ST + Y * CT + A.ry;
  return [rx - O[0], y, -(ry - O[1])];
}
