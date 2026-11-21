/* Un solo decodificador Draco para todo el gemelo (cada instancia abre hilos con su propia memoria WASM). */
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
let d: DRACOLoader | null = null;
export function draco(): DRACOLoader {
  if (!d) { d = new DRACOLoader().setDecoderPath(import.meta.env.BASE_URL + 'draco/'); d.setWorkerLimit(2); }
  return d;
}
