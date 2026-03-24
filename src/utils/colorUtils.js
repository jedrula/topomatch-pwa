/**
 * Extract the dominant chromatic color from hold bounding boxes on an image.
 *
 * Strategy: hue histogram with saturation filter
 *   1. Draw the image onto an offscreen canvas (scaled to ≤400px for speed)
 *   2. For each hold, sample pixels from its bbox
 *   3. Discard achromatic / too-dark / too-light pixels
 *   4. Bucket surviving pixels by hue (24 bins × 15°)
 *   5. Return a vivid colour from the most-populated bin
 *
 * Accepts both ProblemHold wrappers { hold: {...} } and plain hold objects.
 *
 * @param {HTMLImageElement} imageElement - Already-loaded <img> element
 * @param {Array} holds - ProblemHold wrappers or plain hold objects
 * @returns {Promise<string|null>} Hex colour, or null if no chromatic pixels found
 */
export async function getDominantHoldColor(imageElement, holds) {
  if (!imageElement?.src || !holds?.length) return null;

  let img;
  try {
    img = await loadCorsImage(imageElement.src);
  } catch {
    return null;
  }

  const SCALE = Math.min(1, 400 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * SCALE);
  const h = Math.round(img.naturalHeight * SCALE);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);

  const hueBuckets = new Uint32Array(24);

  for (const holdEntry of holds.slice(0, 20)) {
    const c = extractBbox(holdEntry);
    if (!c) continue;

    const sx = Math.max(0, Math.round(c.x * SCALE));
    const sy = Math.max(0, Math.round(c.y * SCALE));
    const sw = Math.min(Math.max(1, Math.round(c.width * SCALE)), w - sx);
    const sh = Math.min(Math.max(1, Math.round(c.height * SCALE)), h - sy);
    if (sw <= 0 || sh <= 0) continue;

    let data;
    try {
      data = ctx.getImageData(sx, sy, sw, sh).data;
    } catch {
      continue;
    }

    for (let i = 0; i < data.length; i += 16) {
      const { h: hue, s, l } = rgbToHsl(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
      if (s < 0.15 || l < 0.08 || l > 0.92) continue;
      hueBuckets[Math.floor(hue * 24)]++;
    }
  }

  let maxCount = 0;
  let maxBucket = 0;
  for (let i = 0; i < 24; i++) {
    if (hueBuckets[i] > maxCount) { maxCount = hueBuckets[i]; maxBucket = i; }
  }
  if (maxCount === 0) return null;

  return hslToHex(Math.round((maxBucket / 24) * 360), 80, 55);
}

/**
 * Pre-compute the dominant hue (0–360°) for every hold in `holds` by sampling
 * actual image pixels — the same algorithm used by getDominantHoldColor.
 * Useful for feeding real per-hold hue data into the magic wand.
 *
 * @param {HTMLImageElement} imageElement
 * @param {Array} holds - plain hold objects or ProblemHold wrappers
 * @returns {Promise<Map<number, number|null>>} index → hue in degrees (null = achromatic/no data)
 */
export async function precomputeHoldHues(imageElement, holds) {
  const hueMap = new Map();
  if (!imageElement?.src || !holds?.length) return hueMap;

  let img;
  try {
    img = await loadCorsImage(imageElement.src);
  } catch {
    return hueMap;
  }

  const SCALE = Math.min(1, 400 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * SCALE);
  const h = Math.round(img.naturalHeight * SCALE);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);

  holds.forEach((holdEntry, idx) => {
    const c = extractBbox(holdEntry);
    if (!c) { hueMap.set(idx, null); return; }

    const sx = Math.max(0, Math.round(c.x * SCALE));
    const sy = Math.max(0, Math.round(c.y * SCALE));
    const sw = Math.min(Math.max(1, Math.round(c.width * SCALE)), w - sx);
    const sh = Math.min(Math.max(1, Math.round(c.height * SCALE)), h - sy);
    if (sw <= 0 || sh <= 0) { hueMap.set(idx, null); return; }

    try {
      const { data } = ctx.getImageData(sx, sy, sw, sh);
      const hueBuckets = new Uint32Array(24);
      for (let i = 0; i < data.length; i += 16) {
        const { h: hue, s, l } = rgbToHsl(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
        if (s < 0.15 || l < 0.08 || l > 0.92) continue;
        hueBuckets[Math.floor(hue * 24)]++;
      }
      let maxCount = 0, maxBucket = 0;
      for (let i = 0; i < 24; i++) {
        if (hueBuckets[i] > maxCount) { maxCount = hueBuckets[i]; maxBucket = i; }
      }
      hueMap.set(idx, maxCount === 0 ? null : Math.round((maxBucket / 24) * 360));
    } catch {
      hueMap.set(idx, null);
    }
  });

  return hueMap;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Unwrap a ProblemHold wrapper { hold: {...} } or plain hold and return
 * a normalised { x, y, width, height } bbox, or null if unavailable.
 */
function extractBbox(holdEntry) {
  const d = holdEntry.hold ?? holdEntry;
  if (d.coordinates) return d.coordinates;
  if (d.bbox) {
    const b = d.bbox;
    return Array.isArray(b)
      ? { x: b[0], y: b[1], width: b[2], height: b[3] }
      : { x: b.x, y: b.y, width: b.width, height: b.height };
  }
  if (d.x !== undefined) return { x: d.x, y: d.y, width: d.width, height: d.height };
  return null;
}

function loadCorsImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    // Cache-bust to force CORS headers when the browser has a cached non-CORS response
    img.src = src.includes('?') ? src : `${src}?cors=1`;
  });
}

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h / 6, s, l };
}

function hslToHex(h, s, l) {
  // h: 0–360, s: 0–100, l: 0–100
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Convert a hex color to a readable color name.
 * Maps hex → HSL → named color with optional lightness/saturation modifier.
 * Returns compound names like "vivid purple", "dark teal", "red-orange".
 */
export function hexToColorName(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return null;

  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const { h, s, l } = rgbToHsl(r, g, b);

  // Achromatic
  if (s < 0.08) return l < 0.15 ? 'black' : l > 0.85 ? 'white' : 'gray';

  // Hue-based base name (finer buckets + transition zones)
  const hDeg = h * 360;
  let base;
  if (hDeg < 10 || hDeg >= 345) base = 'red';
  else if (hDeg < 25) base = 'red-orange';
  else if (hDeg < 45) base = 'orange';
  else if (hDeg < 55) base = 'gold';
  else if (hDeg < 70) base = 'yellow';
  else if (hDeg < 85) base = 'yellow-green';
  else if (hDeg < 165) base = 'green';
  else if (hDeg < 195) base = 'teal';
  else if (hDeg < 235) base = 'blue';
  else if (hDeg < 260) base = 'indigo';
  else if (hDeg < 295) base = 'purple';
  else if (hDeg < 320) base = 'magenta';
  else base = 'pink';

  // Lightness modifier only — high saturation is expected for hold colors
  if (l < 0.3) return `dark ${base}`;
  if (l > 0.73) return `light ${base}`;

  return base;
}
