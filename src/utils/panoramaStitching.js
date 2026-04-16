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

  // 7. Composite with feathered blend: 2-D distance-transform weighting + exposure compensation

  // Render warped imgB onto its own canvas
  const tempCanvasB = document.createElement('canvas');
  tempCanvasB.width = outputW;
  tempCanvasB.height = outputH;
  cv.imshow(tempCanvasB, warpedMat);

  // Render reference imgA at its translated position onto its own canvas
  const tempCanvasA = document.createElement('canvas');
  tempCanvasA.width = outputW;
  tempCanvasA.height = outputH;
  tempCanvasA.getContext('2d').drawImage(imgA, offsetX, offsetY);

  // Free OpenCV mats before the pixel-level blend
  matB.delete();
  warpedMat.delete();
  H_final_cv.delete();

  const outputCanvas = blendCanvasPair(cv, tempCanvasA, tempCanvasB, outputW, outputH);

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

/**
 * Blend a reference canvas with a warped canvas using 2D distance-transform feathering.
 *
 * In the overlap region each pixel is weighted by how deep inside each canvas's content it
 * sits — pixels near the centre of the reference stay as-is, pixels near the centre of the
 * warped image transition smoothly. Also applies a simple luminance gain to the warped image
 * so it matches the reference brightness in the overlap (exposure compensation).
 *
 * @param {Object} cv  OpenCV instance (already loaded)
 * @param {HTMLCanvasElement} canvasRef     Reference image rendered in output space
 * @param {HTMLCanvasElement} canvasWarped  Warped image rendered in output space
 * @param {number} outputW
 * @param {number} outputH
 * @returns {HTMLCanvasElement}
 */
function blendCanvasPair(cv, canvasRef, canvasWarped, outputW, outputH) {
  const dataRef    = canvasRef.getContext('2d').getImageData(0, 0, outputW, outputH);
  const dataWarped = canvasWarped.getContext('2d').getImageData(0, 0, outputW, outputH);
  const N = outputW * outputH;

  const maskRef    = new Uint8Array(N);
  const maskWarped = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    maskRef[i]    = dataRef.data[i * 4 + 3]    > 0 ? 255 : 0;
    maskWarped[i] = dataWarped.data[i * 4 + 3] > 0 ? 255 : 0;
  }

  const matMaskRef    = cv.matFromArray(outputH, outputW, cv.CV_8U, maskRef);
  const matMaskWarped = cv.matFromArray(outputH, outputW, cv.CV_8U, maskWarped);
  const distRef    = new cv.Mat();
  const distWarped = new cv.Mat();
  cv.distanceTransform(matMaskRef,    distRef,    cv.DIST_L2, 5);
  cv.distanceTransform(matMaskWarped, distWarped, cv.DIST_L2, 5);
  const distRefData    = distRef.data32F;
  const distWarpedData = distWarped.data32F;

  // Exposure compensation: scale warped pixels to match ref mean brightness in overlap
  let sumRef = 0, sumWarped = 0, overlapCount = 0;
  for (let i = 0; i < N; i++) {
    if (maskRef[i] && maskWarped[i]) {
      const px = i * 4;
      sumRef    += 0.299 * dataRef.data[px]    + 0.587 * dataRef.data[px + 1]    + 0.114 * dataRef.data[px + 2];
      sumWarped += 0.299 * dataWarped.data[px] + 0.587 * dataWarped.data[px + 1] + 0.114 * dataWarped.data[px + 2];
      overlapCount++;
    }
  }
  const gain = overlapCount > 500
    ? Math.max(0.5, Math.min(2.0, sumRef / (sumWarped + 1e-6)))
    : 1.0;

  const result = new Uint8ClampedArray(N * 4);
  for (let i = 0; i < N; i++) {
    const px = i * 4;
    const hasRef    = maskRef[i] > 0;
    const hasWarped = maskWarped[i] > 0;

    if (hasRef && hasWarped) {
      const dR = distRefData[i];
      const dW = distWarpedData[i];
      const tRef = dR / (dR + dW + 1e-6);
      result[px]     = tRef * dataRef.data[px]     + (1 - tRef) * dataWarped.data[px]     * gain;
      result[px + 1] = tRef * dataRef.data[px + 1] + (1 - tRef) * dataWarped.data[px + 1] * gain;
      result[px + 2] = tRef * dataRef.data[px + 2] + (1 - tRef) * dataWarped.data[px + 2] * gain;
      result[px + 3] = 255;
    } else if (hasRef) {
      result[px] = dataRef.data[px]; result[px + 1] = dataRef.data[px + 1];
      result[px + 2] = dataRef.data[px + 2]; result[px + 3] = 255;
    } else if (hasWarped) {
      result[px]     = dataWarped.data[px]     * gain;
      result[px + 1] = dataWarped.data[px + 1] * gain;
      result[px + 2] = dataWarped.data[px + 2] * gain;
      result[px + 3] = 255;
    }
  }

  matMaskRef.delete(); matMaskWarped.delete(); distRef.delete(); distWarped.delete();

  const out = document.createElement('canvas');
  out.width = outputW; out.height = outputH;
  out.getContext('2d').putImageData(new ImageData(result, outputW, outputH), 0, 0);
  return out;
}

/**
 * Blend N warped canvases (same output dimensions) using per-row 1-D distance-weighted feathering.
 *
 * For each row and each pixel column, each image gets a weight equal to its 1-D distance
 * to its nearest left/right content edge (how "central" it is horizontally). Weights are
 * normalised across all images that cover the pixel. This eliminates hard seam lines for
 * typical left-to-right panoramas.
 *
 * Per-image exposure gains are propagated pairwise from image 0 (reference) outwards so
 * brightness jumps between frames are also corrected.
 *
 * @param {HTMLCanvasElement[]} warpedCanvases  Ordered canvases in output space (index 0 = reference)
 * @param {number} outputW
 * @param {number} outputH
 * @returns {HTMLCanvasElement}
 */
function blendSectionImages(warpedCanvases, outputW, outputH) {
  const n = warpedCanvases.length;
  const datas = warpedCanvases.map(c => c.getContext('2d').getImageData(0, 0, outputW, outputH).data);
  const NPixels = outputW * outputH;

  // Pairwise gain chain so every image matches image 0 (reference) brightness
  const gains = new Float32Array(n).fill(1.0);
  for (let k = 1; k < n; k++) {
    let sumPrev = 0, sumK = 0, count = 0;
    for (let i = 0; i < NPixels; i++) {
      const px = i * 4;
      if (datas[k - 1][px + 3] > 0 && datas[k][px + 3] > 0) {
        sumPrev += 0.299 * datas[k - 1][px] + 0.587 * datas[k - 1][px + 1] + 0.114 * datas[k - 1][px + 2];
        sumK    += 0.299 * datas[k][px]     + 0.587 * datas[k][px + 1]     + 0.114 * datas[k][px + 2];
        count++;
      }
    }
    const pairGain = count > 500 ? Math.max(0.5, Math.min(2.0, sumPrev / (sumK + 1e-6))) : 1.0;
    gains[k] = gains[k - 1] * pairGain;
  }

  const result = new Uint8ClampedArray(NPixels * 4);
  const hasPixel = new Uint8Array(outputW);
  const dists = Array.from({ length: n }, () => new Float32Array(outputW));

  for (let y = 0; y < outputH; y++) {
    const rowBase = y * outputW;

    for (let k = 0; k < n; k++) {
      for (let x = 0; x < outputW; x++) {
        hasPixel[x] = datas[k][(rowBase + x) * 4 + 3] > 0 ? 1 : 0;
      }
      // 1-D distance from nearest left or right content boundary
      let d = 0;
      for (let x = 0; x < outputW; x++) {
        d = hasPixel[x] ? d + 1 : 0;
        dists[k][x] = d;
      }
      d = 0;
      for (let x = outputW - 1; x >= 0; x--) {
        d = hasPixel[x] ? d + 1 : 0;
        if (d < dists[k][x]) dists[k][x] = d;
      }
    }

    for (let x = 0; x < outputW; x++) {
      let totalDist = 0;
      for (let k = 0; k < n; k++) totalDist += dists[k][x];
      if (totalDist === 0) continue;

      const px = (rowBase + x) * 4;
      let accR = 0, accG = 0, accB = 0;
      for (let k = 0; k < n; k++) {
        if (dists[k][x] === 0) continue;
        const w = dists[k][x] / totalDist;
        const gainK = gains[k];
        accR += w * datas[k][px]     * gainK;
        accG += w * datas[k][px + 1] * gainK;
        accB += w * datas[k][px + 2] * gainK;
      }
      result[px]     = accR;
      result[px + 1] = accG;
      result[px + 2] = accB;
      result[px + 3] = 255;
    }
  }

  const out = document.createElement('canvas');
  out.width = outputW; out.height = outputH;
  out.getContext('2d').putImageData(new ImageData(result, outputW, outputH), 0, 0);
  return out;
}

// ── Multi-image section stitching ────────────────────────────────────────────

/**
 * Invert a 3x3 matrix (flat row-major, 9 elements) using cv.invert.
 * Returns the inverted flat array.
 * @param {Object} cv - OpenCV instance
 * @param {number[]} flat
 * @returns {number[]}
 */
function invertMat3(cv, flat) {
  const m = cv.matFromArray(3, 3, cv.CV_64F, flat);
  const inv = new cv.Mat();
  cv.invert(m, inv, cv.DECOMP_LU);
  const result = Array.from(inv.data64F);
  m.delete();
  inv.delete();
  return result;
}

/**
 * Stitch all images in an ordered sequence into a single panorama.
 *
 * Strategy:
 *  - Image[0] is the reference frame.
 *  - For each consecutive pair (i, i+1) we ask LoFTR for the homography H_pair[i]
 *    that maps image[i] → image[i+1] coords.
 *  - We chain the inverses to get H_to_ref[k]: maps image[k] → image[0] coords.
 *  - We compute a global bounding box, add a translation offset, and
 *    warpPerspective each image onto the output canvas.
 *  - Images are painted back-to-front (last → first) so image[0] is always crisp.
 *
 * @param {Array<{ imageId: string, downloadUrl: string, fileName: string }>} images
 *   Ordered array of image objects (e.g. from orderImagesBySection).
 * @param {(progress: { step: string, pairIndex: number, totalPairs: number, message: string }) => void} [onProgress]
 * @returns {Promise<{
 *   canvas: HTMLCanvasElement,
 *   pairResults: Array<{ inlierRatio: number, inlierCount: number, matchQuality: string }>,
 *   worstQuality: string,
 * }>}
 */
export async function stitchSection(images, onProgress) {
  if (!images || images.length < 2) {
    throw new Error('Need at least 2 images to stitch a section.');
  }

  const n = images.length;
  const totalPairs = n - 1;

  // 1. Load all images concurrently
  onProgress?.({ step: 'loading', pairIndex: 0, totalPairs, message: 'Loading images…' });
  const loaded = await Promise.all(images.map(img => loadImage(img.downloadUrl)));

  // 2. Get pairwise homographies sequentially (server can't handle parallel load)
  //    H_pair[i]: maps image[i] coords → image[i+1] coords (LoFTR convention)
  const pairResults = [];
  const H_pairs = []; // flat row-major arrays

  for (let i = 0; i < totalPairs; i++) {
    onProgress?.({
      step: 'matching',
      pairIndex: i,
      totalPairs,
      message: `Matching pair ${i + 1}/${totalPairs}: "${images[i].fileName}" → "${images[i + 1].fileName}"`,
    });

    const result = await matchImagesOnServer(
      loaded[i],
      loaded[i + 1],
      `panorama_pair_${i}.jpg`,
      { width: loaded[i].naturalWidth, height: loaded[i].naturalHeight },
      { width: loaded[i + 1].naturalWidth, height: loaded[i + 1].naturalHeight },
    );

    if (!result.homography_matrix) {
      throw new Error(
        `No homography returned for pair ${i + 1} ("${images[i].fileName}" → "${images[i + 1].fileName}"). ` +
        `Match quality: ${result.matchQuality ?? 'unknown'}.`,
      );
    }

    const H3x3 = result.homography_matrix;
    H_pairs.push([
      H3x3[0][0], H3x3[0][1], H3x3[0][2],
      H3x3[1][0], H3x3[1][1], H3x3[1][2],
      H3x3[2][0], H3x3[2][1], H3x3[2][2],
    ]);
    pairResults.push({
      inlierRatio: result.inlier_ratio,
      inlierCount: result.inlier_matches,
      matchQuality: result.matchQuality ?? assessQuality(result.inlier_ratio),
    });
  }

  onProgress?.({ step: 'compositing', pairIndex: totalPairs, totalPairs, message: 'Computing layout…' });

  // 3. Load OpenCV and chain homographies
  //    H_to_ref[k] maps image[k] → image[0] (reference) coords.
  //    H_to_ref[0] = Identity
  //    H_to_ref[k] = H_to_ref[k-1] · H_pair[k-1]⁻¹
  const { cv } = await loadOpenCV();

  const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const H_to_ref = [IDENTITY];
  for (let i = 0; i < totalPairs; i++) {
    const H_inv_i = invertMat3(cv, H_pairs[i]);
    H_to_ref.push(mat3Multiply(H_to_ref[i], H_inv_i));
  }

  // 4. Project all corners of all images through their H_to_ref to find global bounding box
  const allX = [];
  const allY = [];
  for (let k = 0; k < n; k++) {
    const H = H_to_ref[k];
    const w = loaded[k].naturalWidth;
    const h = loaded[k].naturalHeight;
    for (const [cx, cy] of [[0, 0], [w, 0], [w, h], [0, h]]) {
      const p = applyHomography(H, cx, cy);
      allX.push(p.x);
      allY.push(p.y);
    }
  }

  const minX = Math.floor(Math.min(...allX));
  const minY = Math.floor(Math.min(...allY));
  const maxX = Math.ceil(Math.max(...allX));
  const maxY = Math.ceil(Math.max(...allY));

  const offsetX = -minX;
  const offsetY = -minY;
  const outputW = maxX - minX;
  const outputH = maxY - minY;

  // 5. Build final transforms: H_final[k] = T · H_to_ref[k]
  const T = [1, 0, offsetX, 0, 1, offsetY, 0, 0, 1];
  const H_finals = H_to_ref.map(H => mat3Multiply(T, H));

  // 6. Warp each image to output space, then blend with per-row feathering
  const outputSize = new cv.Size(outputW, outputH);
  const warpedCanvases = [];

  for (let k = 0; k < n; k++) {
    onProgress?.({
      step: 'warping',
      pairIndex: totalPairs,
      totalPairs,
      message: `Warping image ${k + 1}/${n}…`,
    });

    const kCanvas = document.createElement('canvas');
    kCanvas.width = outputW;
    kCanvas.height = outputH;

    if (k === 0) {
      // Reference image: draw directly (no warp, stays crisp)
      kCanvas.getContext('2d').drawImage(loaded[0], offsetX, offsetY);
    } else {
      const { imageData } = imageToCanvas(loaded[k]);
      const mat = cv.matFromImageData(imageData);
      const warped = new cv.Mat();
      const H_cv = cv.matFromArray(3, 3, cv.CV_64F, H_finals[k]);
      cv.warpPerspective(mat, warped, H_cv, outputSize, cv.INTER_LINEAR, cv.BORDER_CONSTANT);
      cv.imshow(kCanvas, warped);
      mat.delete(); warped.delete(); H_cv.delete();
    }
    warpedCanvases.push(kCanvas);
  }

  onProgress?.({
    step: 'blending',
    pairIndex: totalPairs,
    totalPairs,
    message: 'Blending seams…',
  });
  const outputCanvas = blendSectionImages(warpedCanvases, outputW, outputH);

  const qualityRanks = { poor: 0, moderate: 1, good: 2, excellent: 3 };
  const worstQuality = pairResults.reduce(
    (worst, r) => qualityRanks[r.matchQuality] < qualityRanks[worst] ? r.matchQuality : worst,
    'excellent',
  );

  return { canvas: outputCanvas, pairResults, worstQuality };
}
