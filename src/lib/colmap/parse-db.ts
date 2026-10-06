import initSqlJs, { type SqlJsStatic } from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import type { DbImage, Keypoint, MatchPair, TwoViewGeometry } from "./types";
import { TWO_VIEW_CONFIG_BY_ID } from "./types";

// COLMAP database.db schema notes:
// - cameras(camera_id, model, width, height, params BLOB, prior_focal_length)
// - images(image_id, name, camera_id, prior_qw/qx/qy/qz/tx/ty/tz)
// - keypoints(image_id, rows, cols, data BLOB) — float32 rows x cols (cols in 2/4/6)
// - descriptors(image_id, rows, cols, data BLOB)  [ignored]
// - matches(pair_id, rows, cols, data BLOB) — uint32 rows x 2
// - two_view_geometries(pair_id, rows, cols, data BLOB, config, F/E/H BLOB, qvec, tvec)
//   pair_id = image_id1 * MAX_IMAGE_ID + image_id2, where MAX_IMAGE_ID = 2^31 - 1

const MAX_IMAGE_ID = 2 ** 31 - 1;

export function pairIdToImageIds(pairId: number): [number, number] {
  const id2 = pairId % MAX_IMAGE_ID;
  const id1 = (pairId - id2) / MAX_IMAGE_ID;
  return [id1, id2];
}

let sqlPromise: Promise<SqlJsStatic> | null = null;
function getSql() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      // Bundle the wasm via Vite so it's served from the same origin
      // with a hashed URL — CDN fetches were blocked in some preview envs.
      locateFile: () => sqlWasmUrl,
    });
  }
  return sqlPromise;
}

function blobToFloat32(blob: Uint8Array): Float32Array {
  // Copy to guarantee 4-byte alignment.
  const copy = new Uint8Array(blob);
  return new Float32Array(copy.buffer, copy.byteOffset, copy.byteLength / 4);
}

function blobToUint32(blob: Uint8Array): Uint32Array {
  const copy = new Uint8Array(blob);
  return new Uint32Array(copy.buffer, copy.byteOffset, copy.byteLength / 4);
}

function blobToFloat64(blob: Uint8Array | null | undefined): number[] | undefined {
  if (!blob || blob.byteLength === 0) return undefined;
  const copy = new Uint8Array(blob);
  const arr = new Float64Array(copy.buffer, copy.byteOffset, copy.byteLength / 8);
  return Array.from(arr);
}

export async function parseDatabase(buffer: ArrayBuffer): Promise<{
  images: Map<number, DbImage>;
  matchPairs: MatchPair[];
}> {
  const SQL = await getSql();
  const db = new SQL.Database(new Uint8Array(buffer));

  const images = new Map<number, DbImage>();

  // Images
  try {
    const res = db.exec("SELECT image_id, name, camera_id FROM images");
    if (res[0]) {
      for (const row of res[0].values) {
        const [image_id, name, camera_id] = row as [number, string, number];
        images.set(image_id, { imageId: image_id, name, cameraId: camera_id });
      }
    }
  } catch (e) {
    console.warn("no images table", e);
  }

  // Keypoints
  try {
    const res = db.exec("SELECT image_id, rows, cols, data FROM keypoints");
    if (res[0]) {
      for (const row of res[0].values) {
        const [image_id, rows, cols, data] = row as [number, number, number, Uint8Array | null];
        if (!data || !rows) continue;
        const arr = blobToFloat32(data);
        const kps: Keypoint[] = new Array(rows);
        for (let i = 0; i < rows; i++) {
          const base = i * cols;
          kps[i] = {
            x: arr[base],
            y: arr[base + 1],
            scale: cols > 2 ? arr[base + 2] : undefined,
            orientation: cols > 3 ? arr[base + 3] : undefined,
          };
        }
        const im = images.get(image_id);
        if (im) im.keypoints = kps;
        else images.set(image_id, { imageId: image_id, name: `#${image_id}`, cameraId: 0, keypoints: kps });
      }
    }
  } catch (e) {
    console.warn("no keypoints table", e);
  }

  const matchPairs: MatchPair[] = [];

  // First pass: read raw matches (indices) so we can offer a verified↔raw toggle
  // without needing to re-parse the database.
  const rawMatchesByPairId = new Map<number, Array<[number, number]>>();
  try {
    const res = db.exec(`SELECT pair_id, rows, cols, data FROM matches`);
    if (res[0]) {
      for (const row of res[0].values) {
        const [pair_id, rows, _cols, data] = row as [number, number, number, Uint8Array | null];
        if (!data || !rows) continue;
        const arr = blobToUint32(data);
        const m: Array<[number, number]> = new Array(rows);
        for (let i = 0; i < rows; i++) m[i] = [arr[i * 2], arr[i * 2 + 1]];
        rawMatchesByPairId.set(pair_id, m);
      }
    }
  } catch (e) {
    console.warn("no matches table", e);
  }

  // Read a verified table. Includes model matrices when the column exists.
  const readVerified = (table: string): number => {
    let count = 0;
    const tryQuery = (sql: string) => {
      try {
        return db.exec(sql);
      } catch {
        return [] as ReturnType<typeof db.exec>;
      }
    };
    let res = tryQuery(
      `SELECT pair_id, rows, cols, data, config, F, E, H, qvec, tvec FROM ${table}`,
    );
    const hasExtras = res.length > 0;
    if (!hasExtras) {
      res = tryQuery(`SELECT pair_id, rows, cols, data FROM ${table}`);
    }
    if (!res[0]) return 0;
    for (const row of res[0].values) {
      const pair_id = row[0] as number;
      const rows = row[1] as number;
      const data = row[3] as Uint8Array | null;
      if (!data || !rows) continue;
      const [id1, id2] = pairIdToImageIds(pair_id);
      const arr = blobToUint32(data);
      const matches: Array<[number, number]> = new Array(rows);
      for (let i = 0; i < rows; i++) matches[i] = [arr[i * 2], arr[i * 2 + 1]];

      let geometry: TwoViewGeometry | undefined;
      if (hasExtras) {
        const config = (row[4] as number) ?? 0;
        geometry = {
          config,
          configName: TWO_VIEW_CONFIG_BY_ID[config] ?? "UNDEFINED",
          F: blobToFloat64(row[5] as Uint8Array | null),
          E: blobToFloat64(row[6] as Uint8Array | null),
          H: blobToFloat64(row[7] as Uint8Array | null),
        };
        const q = blobToFloat64(row[8] as Uint8Array | null);
        const t = blobToFloat64(row[9] as Uint8Array | null);
        if (q && q.length === 4) geometry.qvec = [q[0], q[1], q[2], q[3]];
        if (t && t.length === 3) geometry.tvec = [t[0], t[1], t[2]];
      }

      const rawMatches = rawMatchesByPairId.get(pair_id);
      matchPairs.push({
        imageId1: id1,
        imageId2: id2,
        matches,
        isGeometric: true,
        numRawMatches: rawMatches?.length,
        rawMatches,
        geometry,
      });
      count++;
    }
    return count;
  };

  let verifiedCount = readVerified("two_view_geometries");
  if (verifiedCount === 0) verifiedCount = readVerified("inlier_matches");

  // No verified table — surface raw matches as the primary set.
  if (verifiedCount === 0 && rawMatchesByPairId.size > 0) {
    for (const [pair_id, m] of rawMatchesByPairId) {
      const [id1, id2] = pairIdToImageIds(pair_id);
      matchPairs.push({
        imageId1: id1,
        imageId2: id2,
        matches: m,
        isGeometric: false,
        numRawMatches: m.length,
      });
    }
  }

  db.close();
  return { images, matchPairs };
}

