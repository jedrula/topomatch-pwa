export type CameraModel =
  | "SIMPLE_PINHOLE"
  | "PINHOLE"
  | "SIMPLE_RADIAL"
  | "RADIAL"
  | "OPENCV"
  | "OPENCV_FISHEYE"
  | "FULL_OPENCV"
  | "FOV"
  | "SIMPLE_RADIAL_FISHEYE"
  | "RADIAL_FISHEYE"
  | "THIN_PRISM_FISHEYE";

export const CAMERA_MODEL_BY_ID: Record<number, CameraModel> = {
  0: "SIMPLE_PINHOLE",
  1: "PINHOLE",
  2: "SIMPLE_RADIAL",
  3: "RADIAL",
  4: "OPENCV",
  5: "OPENCV_FISHEYE",
  6: "FULL_OPENCV",
  7: "FOV",
  8: "SIMPLE_RADIAL_FISHEYE",
  9: "RADIAL_FISHEYE",
  10: "THIN_PRISM_FISHEYE",
};

export const CAMERA_MODEL_NUM_PARAMS: Record<CameraModel, number> = {
  SIMPLE_PINHOLE: 3,
  PINHOLE: 4,
  SIMPLE_RADIAL: 4,
  RADIAL: 5,
  OPENCV: 8,
  OPENCV_FISHEYE: 8,
  FULL_OPENCV: 12,
  FOV: 5,
  SIMPLE_RADIAL_FISHEYE: 4,
  RADIAL_FISHEYE: 5,
  THIN_PRISM_FISHEYE: 12,
};

export interface Camera {
  cameraId: number;
  model: CameraModel;
  width: number;
  height: number;
  params: number[];
}

export interface Point2D {
  x: number;
  y: number;
  point3DId: number; // -1 if none
}

export interface ImageRow {
  imageId: number;
  qw: number; qx: number; qy: number; qz: number;
  tx: number; ty: number; tz: number;
  cameraId: number;
  name: string;
  points2D: Point2D[];
}

export interface Point3D {
  pointId: number;
  x: number; y: number; z: number;
  r: number; g: number; b: number;
  error: number;
  track: Array<{ imageId: number; point2DIdx: number }>;
}

export interface Keypoint {
  x: number;
  y: number;
  scale?: number;
  orientation?: number;
}

export interface DbImage {
  imageId: number;
  name: string;
  cameraId: number;
  keypoints?: Keypoint[];
}

// COLMAP two_view_geometries.config values
export type TwoViewConfig =
  | "UNDEFINED"
  | "DEGENERATE"
  | "CALIBRATED"
  | "UNCALIBRATED"
  | "PLANAR"
  | "PANORAMIC"
  | "PLANAR_OR_PANORAMIC"
  | "WATERMARK"
  | "MULTIPLE";

export const TWO_VIEW_CONFIG_BY_ID: Record<number, TwoViewConfig> = {
  0: "UNDEFINED",
  1: "DEGENERATE",
  2: "CALIBRATED",
  3: "UNCALIBRATED",
  4: "PLANAR",
  5: "PANORAMIC",
  6: "PLANAR_OR_PANORAMIC",
  7: "WATERMARK",
  8: "MULTIPLE",
};

export interface TwoViewGeometry {
  config: number;
  configName: TwoViewConfig;
  F?: number[]; // 3x3 row-major fundamental matrix
  E?: number[]; // 3x3 row-major essential matrix
  H?: number[]; // 3x3 row-major homography
  qvec?: [number, number, number, number]; // relative rotation (w,x,y,z)
  tvec?: [number, number, number]; // relative translation
}

export interface MatchPair {
  imageId1: number;
  imageId2: number;
  matches: Array<[number, number]>; // primary set drawn: verified when isGeometric, else raw
  isGeometric: boolean;
  numRawMatches?: number; // rows from raw `matches` table (if available)
  rawMatches?: Array<[number, number]>; // raw putative matches (present when both tables exist)
  geometry?: TwoViewGeometry; // present when isGeometric === true
}

export interface ColmapDataset {
  cameras: Map<number, Camera>;
  images: Map<number, ImageRow>;
  points3D: Map<number, Point3D>;
  db?: {
    images: Map<number, DbImage>;
    matchPairs: MatchPair[];
  };
  meta: {
    source: string;
    loadedAt: number;
  };
}
