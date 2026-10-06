import type { ImageRow } from "./types";

// COLMAP stores world-to-camera transform (R, t) with quaternion (qw,qx,qy,qz)
// Camera center in world: C = -R^T * t
export function quatToMat3(qw: number, qx: number, qy: number, qz: number) {
  const n = Math.hypot(qw, qx, qy, qz) || 1;
  const w = qw / n, x = qx / n, y = qy / n, z = qz / n;
  const xx = x * x, yy = y * y, zz = z * z;
  const xy = x * y, xz = x * z, yz = y * z;
  const wx = w * x, wy = w * y, wz = w * z;
  return [
    1 - 2 * (yy + zz), 2 * (xy - wz),     2 * (xz + wy),
    2 * (xy + wz),     1 - 2 * (xx + zz), 2 * (yz - wx),
    2 * (xz - wy),     2 * (yz + wx),     1 - 2 * (xx + yy),
  ];
}

export function cameraCenter(img: ImageRow): [number, number, number] {
  const R = quatToMat3(img.qw, img.qx, img.qy, img.qz);
  // C = -R^T * t
  const cx = -(R[0] * img.tx + R[3] * img.ty + R[6] * img.tz);
  const cy = -(R[1] * img.tx + R[4] * img.ty + R[7] * img.tz);
  const cz = -(R[2] * img.tx + R[5] * img.ty + R[8] * img.tz);
  return [cx, cy, cz];
}

// Return columns of R^T (camera axes in world)
export function cameraAxes(img: ImageRow) {
  const R = quatToMat3(img.qw, img.qx, img.qy, img.qz);
  // R rows are R^T columns
  const right: [number, number, number] = [R[0], R[1], R[2]];
  const up: [number, number, number] = [R[3], R[4], R[5]];
  const forward: [number, number, number] = [R[6], R[7], R[8]];
  return { right, up, forward };
}
