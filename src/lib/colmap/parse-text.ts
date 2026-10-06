import {
  CAMERA_MODEL_BY_ID,
  type Camera,
  type CameraModel,
  type ImageRow,
  type Point2D,
  type Point3D,
} from "./types";

function* nonCommentLines(text: string) {
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    yield line;
  }
}

export function parseCamerasTxt(text: string): Map<number, Camera> {
  const map = new Map<number, Camera>();
  for (const line of nonCommentLines(text)) {
    const parts = line.split(/\s+/);
    const cameraId = Number(parts[0]);
    const modelRaw = parts[1];
    const model = (Number.isNaN(Number(modelRaw))
      ? modelRaw
      : CAMERA_MODEL_BY_ID[Number(modelRaw)]) as CameraModel;
    const width = Number(parts[2]);
    const height = Number(parts[3]);
    const params = parts.slice(4).map(Number);
    map.set(cameraId, { cameraId, model, width, height, params });
  }
  return map;
}

export function parseImagesTxt(text: string): Map<number, ImageRow> {
  const map = new Map<number, ImageRow>();
  const lines = [...nonCommentLines(text)];
  for (let i = 0; i < lines.length; i += 2) {
    const headerParts = lines[i].split(/\s+/);
    if (headerParts.length < 10) continue;
    const imageId = Number(headerParts[0]);
    const qw = Number(headerParts[1]);
    const qx = Number(headerParts[2]);
    const qy = Number(headerParts[3]);
    const qz = Number(headerParts[4]);
    const tx = Number(headerParts[5]);
    const ty = Number(headerParts[6]);
    const tz = Number(headerParts[7]);
    const cameraId = Number(headerParts[8]);
    const name = headerParts.slice(9).join(" ");

    const points2D: Point2D[] = [];
    const pointsLine = lines[i + 1];
    if (pointsLine) {
      const p = pointsLine.split(/\s+/).map(Number);
      for (let k = 0; k + 2 < p.length; k += 3) {
        points2D.push({ x: p[k], y: p[k + 1], point3DId: p[k + 2] });
      }
    }
    map.set(imageId, { imageId, qw, qx, qy, qz, tx, ty, tz, cameraId, name, points2D });
  }
  return map;
}

export function parsePoints3DTxt(text: string): Map<number, Point3D> {
  const map = new Map<number, Point3D>();
  for (const line of nonCommentLines(text)) {
    const p = line.split(/\s+/);
    if (p.length < 8) continue;
    const pointId = Number(p[0]);
    const x = Number(p[1]);
    const y = Number(p[2]);
    const z = Number(p[3]);
    const r = Number(p[4]);
    const g = Number(p[5]);
    const b = Number(p[6]);
    const error = Number(p[7]);
    const track: Point3D["track"] = [];
    for (let k = 8; k + 1 < p.length; k += 2) {
      track.push({ imageId: Number(p[k]), point2DIdx: Number(p[k + 1]) });
    }
    map.set(pointId, { pointId, x, y, z, r, g, b, error, track });
  }
  return map;
}
