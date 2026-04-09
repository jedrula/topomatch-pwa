#!/usr/bin/env node
'use strict';
/**
 * Capture production Firestore data + image for an E2E seed.
 *
 * Usage:
 *   node scripts/captureImage.js --imageId=<id>
 *
 * Reads from production Firestore (uses ADC / application credentials).
 * Writes to ../../boulder-map-view/tests-e2e/seed/data/<imageId>/
 *   meta.json        — remapped Firestore docs (locationId → e2e-location-001)
 *   original.<ext>   — full-resolution image binary
 */

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

admin.initializeApp({ projectId: 'topomatch-pwa' });
const db = admin.firestore();

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const imageIdArg = process.argv.find(a => a.startsWith('--imageId='));
if (!imageIdArg) {
  console.error('Usage: node scripts/captureImage.js --imageId=<id>');
  process.exit(1);
}
const IMAGE_ID        = imageIdArg.split('=')[1].trim();
const E2E_LOCATION_ID = 'e2e-location-001';
const E2E_ROUTESETTING = 'e2e-routesetting-001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively convert admin SDK Timestamps to a tagged object that
 * seedEmulator.ts can recognise and convert back to Firestore timestampValue.
 */
function serialize(obj) {
  if (obj === null || obj === undefined) return null;
  if (obj instanceof admin.firestore.Timestamp) {
    return { __type: 'Timestamp', value: obj.toDate().toISOString() };
  }
  if (Array.isArray(obj)) return obj.map(serialize);
  if (typeof obj === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = serialize(v);
    }
    return result;
  }
  return obj;
}

/** HTTP/HTTPS download following redirects, returns a Buffer. */
function download(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} downloading image`));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end',  () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 1. LocationImage doc
  const imgSnap = await db.collection('locationImages').doc(IMAGE_ID).get();
  if (!imgSnap.exists) {
    console.error(`locationImages/${IMAGE_ID} not found in production Firestore`);
    process.exit(1);
  }
  const locationImage = serialize({ id: imgSnap.id, ...imgSnap.data() });
  const originalLocationId = locationImage.locationId;

  // 2. HoldDetection doc (may not exist for every image)
  const hdSnap = await db
    .collection('locations').doc(originalLocationId)
    .collection('holdDetections').doc(IMAGE_ID)
    .get();
  const holdDetection = hdSnap.exists
    ? serialize({ id: hdSnap.id, ...hdSnap.data() })
    : null;

  // 3. BoulderProblems for this image
  const bpSnap = await db
    .collection('locations').doc(originalLocationId)
    .collection('boulderProblems')
    .where('imageId', '==', IMAGE_ID)
    .get();
  const boulderProblems = bpSnap.docs.map(d =>
    serialize({ id: d.id, ...d.data() })
  );

  // 4. Download original image
  const { downloadUrl, fileName, fileExtension } = locationImage;
  const ext = fileExtension
    || (fileName ? path.extname(fileName).slice(1) : 'jpg')
    || 'jpg';
  console.log(`Downloading ${fileName || IMAGE_ID}…`);
  const imageBuffer = await download(downloadUrl);

  // 5. Remap to stable E2E IDs
  locationImage.locationId   = E2E_LOCATION_ID;
  locationImage.routesettings = [E2E_ROUTESETTING];
  if (holdDetection) holdDetection.locationId = E2E_LOCATION_ID;
  boulderProblems.forEach(p => { p.locationId = E2E_LOCATION_ID; });

  // 6. Write output
  const outDir = path.resolve(
    __dirname,
    '../../../boulder-map-view/tests-e2e/seed/data',
    IMAGE_ID,
  );
  fs.mkdirSync(outDir, { recursive: true });

  const meta = { locationImage, holdDetection, boulderProblems, originalImageExt: ext };
  fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));
  fs.writeFileSync(path.join(outDir, `original.${ext}`), imageBuffer);

  console.log(`\n✓ Captured → ${outDir}`);
  console.log(`  locationImage  : ${fileName || IMAGE_ID}`);
  console.log(`  holdDetection  : ${holdDetection ? '✓' : 'none'}`);
  console.log(`  boulderProblems: ${boulderProblems.length}`);
  console.log(`  image file     : original.${ext} (${imageBuffer.length.toLocaleString()} bytes)`);
  console.log(`\nCommit the generated files and run tests:\n  cd ../../boulder-map-view && npx playwright test`);
}

main().catch(err => { console.error(err); process.exit(1); });
