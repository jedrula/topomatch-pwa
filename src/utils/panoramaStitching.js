/**
 * Panorama stitching utility
 *
 * Uses the LoFTR server to get a homography matrix between two images,
 * then uses OpenCV.js warpPerspective to composite them into a single canvas.
 *
 * The first image (A) is kept as the reference frame.
 * The second image (B) is warped to align with A.
 */

import { matchImagesOnServer } from '@/services/imageMatchingService';
import { loadOpenCV } from './opencv';

/**
 * Load an image element from a URL.
 * Sets crossOrigin = 'anonymous' for Firebase Storage CORS compatibility.
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Draw an HTMLImageElement into an offscreen canvas and return its ImageData.
 * @param {HTMLImageElement} img
 * @returns {{ canvas: HTMLCanvasElement, imageData: ImageData }}
 */
function imageToCanvas(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return { canvas, imageData: ctx.getImageData(0, 0, canvas.width, canvas.height) };
}

/**
 * Multiply two 3x3 matrices (flat row-major arrays of 9 elements).
 * @param {number[]} A
 * @param {number[]} B
 * @returns {number[]}
 */
function mat3Multiply(A, B) {
  const C = new Array(9).fill(0);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      for (let k = 0; k < 3; k++) {
        C[r * 3 + c] += A[r * 3 + k] * B[k * 3 + c];
      }
    }
  }
  return C;
}

/**
 * Apply a 3x3 homography (flat row-major) to a 2D point.
 * @param {number[]} H flat 9-element array
 * @param {number} x
 * @param {number} y
 * @returns {{ x: number, y: number }}
 */
function applyHomography(H, x, y) {
  const w = H[6] * x + H[7] * y + H[8];
  return {
    x: (H[0] * x + H[1] * y + H[2]) / w,
    y: (H[3] * x + H[4] * y + H[5]) / w,
  };
}

/**
 * Stitch two images into a panorama.
 *
 * Image A is the reference (left/anchor). Image B is warped to align with A.
 *
 * @param {string} urlA - URL of the reference image
 * @param {string} urlB - URL of the image to warp
 * @returns {Promise<{ canvas: HTMLCanvasElement, inlierRatio: number, inlierCount: number, matchQuality: string }>}
 */
export async function stitchImages(urlA, urlB) {
  // 1. Load both images concurrently
  const [imgA, imgB] = await Promise.all([loadImage(urlA), loadImage(urlB)]);

  // 2. Get homography from LoFTR server
  //    H maps coords in imgA → coords in imgB (server convention: image1→image2)
  const matchResult = await matchImagesOnServer(
    imgA,
    imgB,
    'panorama_match.jpg',
    { width: imgA.naturalWidth, height: imgA.naturalHeight },
    { width: imgB.naturalWidth, height: imgB.naturalHeight },
  );

  const { homography_matrix: H3x3, inlier_matches, inlier_ratio, matchQuality } = matchResult;

  if (!H3x3) {
    throw new Error('Server did not return a homography matrix. Check match quality.');
  }

  // Flatten 3x3 nested array to row-major flat array
  const H = [
    H3x3[0][0], H3x3[0][1], H3x3[0][2],
    H3x3[1][0], H3x3[1][1], H3x3[1][2],
    H3x3[2][0], H3x3[2][1], H3x3[2][2],
  ];

  // 3. Load OpenCV and invert H to get H_inv: maps imgB coords → imgA coords
  const { cv } = await loadOpenCV();

  const H_cv = cv.matFromArray(3, 3, cv.CV_64F, H);
  const H_inv_cv = new cv.Mat();
  cv.invert(H_cv, H_inv_cv, cv.DECOMP_LU);

  // Extract H_inv as flat array
  const H_inv = Array.from(H_inv_cv.data64F);

  H_cv.delete();
  H_inv_cv.delete();

  // 4. Project the 4 corners of imgB through H_inv to find where they land in imgA's frame
  const { naturalWidth: wA, naturalHeight: hA } = imgA;
  const { naturalWidth: wB, naturalHeight: hB } = imgB;

  const cornersB = [
    applyHomography(H_inv, 0,  0),
    applyHomography(H_inv, wB, 0),
    applyHomography(H_inv, wB, hB),
    applyHomography(H_inv, 0,  hB),
  ];

  const allX = [0, wA, ...cornersB.map(c => c.x)];
  const allY = [0, hA, ...cornersB.map(c => c.y)];
  const minX = Math.floor(Math.min(...allX));
  const minY = Math.floor(Math.min(...allY));
  const maxX = Math.ceil(Math.max(...allX));
  const maxY = Math.ceil(Math.max(...allY));

  const offsetX = -minX;
  const offsetY = -minY;
  const outputW = maxX - minX;
  const outputH = maxY - minY;

  // 5. Build adjusted homography: H_final = T * H_inv
  //    where T translates by (offsetX, offsetY) so all pixels land on-canvas
  const T = [
    1, 0, offsetX,
    0, 1, offsetY,
    0, 0, 1,
  ];
  const H_final = mat3Multiply(T, H_inv);

  // 6. warpPerspective(imgB, H_final, outputSize) → warped imgB on output canvas
  const { imageData: imgDataB } = imageToCanvas(imgB);
  const matB = cv.matFromImageData(imgDataB);
  const warpedMat = new cv.Mat();
  const H_final_cv = cv.matFromArray(3, 3, cv.CV_64F, H_final);
  const outputSize = new cv.Size(outputW, outputH);

  cv.warpPerspective(matB, warpedMat, H_final_cv, outputSize, cv.INTER_LINEAR, cv.BORDER_CONSTANT);

  // 7. Composite onto output canvas: draw warped imgB first, then imgA on top at offset
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = outputW;
  outputCanvas.height = outputH;

  // Draw warped imgB to a temp canvas via cv.imshow
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = outputW;
  tempCanvas.height = outputH;
  cv.imshow(tempCanvas, warpedMat);

  const ctx = outputCanvas.getContext('2d');
  ctx.drawImage(tempCanvas, 0, 0);

  // Draw imgA at its translated position (reference frame)
  ctx.drawImage(imgA, offsetX, offsetY);

  // Cleanup OpenCV mats
  matB.delete();
  warpedMat.delete();
  H_final_cv.delete();

  return {
    canvas: outputCanvas,
    inlierRatio: inlier_ratio,
    inlierCount: inlier_matches,
    matchQuality: matchQuality ?? assessQuality(inlier_ratio),
  };
}

function assessQuality(ratio) {
  if (ratio > 0.7) return 'excellent';
  if (ratio > 0.4) return 'good';
  if (ratio > 0.2) return 'moderate';
  return 'poor';
}
