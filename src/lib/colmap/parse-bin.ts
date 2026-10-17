import {
  CAMERA_MODEL_BY_ID,
  CAMERA_MODEL_NUM_PARAMS,
  type Camera,
  type ImageRow,
  type Point2D,
  type Point3D,
} from "./types";

class Reader {
  view: DataView;
  offset = 0;
  constructor(public buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
  }
  u32() { const v = this.view.getUint32(this.offset, true); this.offset += 4; return v; }
  u64() {
    // COLMAP uses uint64; JS number is fine for realistic reconstruction sizes.
    const lo = this.view.getUint32(this.offset, true);
    const hi = this.view.getUint32(this.offset + 4, true);
    this.offset += 8;
    return hi * 2 ** 32 + lo;
  }
  i32() { const v = this.view.getInt32(this.offset, true); this.offset += 4; return v; }
  i64() {
    const lo = this.view.getUint32(this.offset, true);
    const hi = this.view.getInt32(this.offset + 4, true);
    this.offset += 8;
    return hi * 2 ** 32 + lo;
  }
  f64() { const v = this.view.getFloat64(this.offset, true); this.offset += 8; return v; }
  u8() { const v = this.view.getUint8(this.offset); this.offset += 1; return v; }
  cstr() {
    let s = "";
    while (this.offset < this.view.byteLength) {
      const c = this.view.getUint8(this.offset++);
      if (c === 0) break;
      s += String.fromCharCode(c);
    }
    return s;
  }
}

export function parseCamerasBin(buf: ArrayBuffer): Map<number, Camera> {
  const r = new Reader(buf);
  const n = r.u64();
  const map = new Map<number, Camera>();
  for (let i = 0; i < n; i++) {
    const cameraId = r.u32();
    const modelId = r.i32();
    const width = r.u64();
    const height = r.u64();
    const model = CAMERA_MODEL_BY_ID[modelId] ?? "PINHOLE";
    const numParams = CAMERA_MODEL_NUM_PARAMS[model] ?? 4;
    const params: number[] = [];
    for (let k = 0; k < numParams; k++) params.push(r.f64());
    map.set(cameraId, { cameraId, model, width, height, params });
  }
  return map;
}

export function parseImagesBin(buf: ArrayBuffer): Map<number, ImageRow> {
  const r = new Reader(buf);
  const n = r.u64();
  const map = new Map<number, ImageRow>();
  for (let i = 0; i < n; i++) {
    const imageId = r.u32();
    const qw = r.f64();
    const qx = r.f64();
    const qy = r.f64();
    const qz = r.f64();
    const tx = r.f64();
    const ty = r.f64();
    const tz = r.f64();
    const cameraId = r.u32();
    const name = r.cstr();
    const numPoints = r.u64();
    const points2D: Point2D[] = new Array(numPoints);
    for (let k = 0; k < numPoints; k++) {
      const x = r.f64();
      const y = r.f64();
      const pid = r.i64();
      points2D[k] = { x, y, point3DId: pid };
    }
    map.set(imageId, { imageId, qw, qx, qy, qz, tx, ty, tz, cameraId, name, points2D });
  }
  return map;
}

export function parsePoints3DBin(buf: ArrayBuffer): Map<number, Point3D> {
  const r = new Reader(buf);
  const n = r.u64();
  const map = new Map<number, Point3D>();
  for (let i = 0; i < n; i++) {
    const pointId = r.u64();
    const x = r.f64();
    const y = r.f64();
    const z = r.f64();
    const rC = r.u8();
    const gC = r.u8();
    const bC = r.u8();
    const error = r.f64();
    const trackLen = r.u64();
    const track: Point3D["track"] = new Array(trackLen);
    for (let k = 0; k < trackLen; k++) {
      const imageId = r.u32();
      const point2DIdx = r.u32();
      track[k] = { imageId, point2DIdx };
    }
    map.set(pointId, { pointId, x, y, z, r: rC, g: gC, b: bC, error, track });
  }
  return map;
}
