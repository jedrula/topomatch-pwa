const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'topomatch-pwa' });
const BUCKET_NAME = 'topomatch-pwa.firebasestorage.app';
const bucket = admin.storage().bucket(BUCKET_NAME);

// Usage:
//   node compare-videos.js              -- most recent 5 ready ascents
//   node compare-videos.js --limit=10   -- most recent 10
//   node compare-videos.js --user=<uid> -- filter by userId
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const userArg  = process.argv.find(a => a.startsWith('--user='));
const LIMIT    = limitArg ? parseInt(limitArg.split('=')[1]) : 5;
const USER_ID  = userArg  ? userArg.split('=')[1] : null;

async function fetchRecentReadyAscents() {
  const db = admin.firestore();
  let query = db.collection('ascents')
    .where('video.status', '==', 'ready')
    .orderBy('video.transcodedAt', 'desc')
    .limit(LIMIT);
  if (USER_ID) query = db.collection('ascents')
    .where('userId', '==', USER_ID)
    .where('video.status', '==', 'ready')
    .orderBy('video.transcodedAt', 'desc')
    .limit(LIMIT);
  const snap = await query.get();
  return snap.docs
    .map(d => {
      const data = d.data();
      const v = data.video || {};
      return {
        id: d.id,
        userId: data.userId,
        userName: data.userName,
        locationName: data.locationName || null,
        uploadedAt: v.uploadedAt ? (v.uploadedAt.toDate ? v.uploadedAt.toDate() : new Date(v.uploadedAt)) : null,
        transcodedAt: v.transcodedAt ? v.transcodedAt.toDate() : null,
        transcodedPath: v.transcodedPath,
        transcodedFileSize: v.transcodedFileSize,
        uploadedOn: v.uploadedOn || null,
      };
    })
    .filter(a => a.transcodedPath && a.transcodedFileSize);
}

function makeDownloadUrl(path, token) {
  return (
    'https://firebasestorage.googleapis.com/v0/b/' +
    encodeURIComponent(BUCKET_NAME) +
    '/o/' +
    encodeURIComponent(path) +
    '?alt=media&token=' +
    token
  );
}

function mb(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

async function findRawPath(userId, ascentId) {
  for (const ext of ['mov', 'mp4', 'MOV', 'MP4']) {
    const path = `videos/raw/${userId}/${ascentId}.${ext}`;
    const [exists] = await bucket.file(path).exists();
    if (exists) return path;
  }
  return null;
}
async function ensureToken(filePath) {
  const file = bucket.file(filePath);
  const [meta] = await file.getMetadata();
  let token = meta.metadata && meta.metadata.firebaseStorageDownloadTokens;
  if (!token) {
    // Add a download token so the file is publicly accessible via Firebase URL
    const crypto = require('crypto');
    token = crypto.randomUUID();
    await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
  }
  return token;
}
(async () => {
  console.log(`Fetching ${LIMIT} most recent ready ascents${USER_ID ? ' for user ' + USER_ID : ''}...\n`);
  const ascents = await fetchRecentReadyAscents();
  if (!ascents.length) { console.log('No ready ascents found.'); process.exit(0); }

  for (const a of ascents) {
    const rawPath = await findRawPath(a.userId, a.id);
    if (!rawPath) {
      console.log(`\n=== ${a.id} === RAW FILE NOT FOUND`);
      continue;
    }
    const [rawMeta] = await bucket.file(rawPath).getMetadata();
    const rawSize = Number(rawMeta.size);
    const ext = rawPath.split('.').pop().toUpperCase();
    const rawToken = await ensureToken(rawPath);
    const tToken = await ensureToken(a.transcodedPath);
    const reduction = ((1 - a.transcodedFileSize / rawSize) * 100).toFixed(1);
    const PLATFORM_LABELS = { ios: 'iOS', android: 'Android', web: 'Web' };
    const platform = a.uploadedOn
      ? (PLATFORM_LABELS[a.uploadedOn] ?? a.uploadedOn)
      : ext === 'MOV' ? 'iOS' : 'Android/Web';

    const fmt = d => d ? d.toISOString().replace('T', ' ').substring(0, 19) : 'unknown';
    console.log(`\n=== ${a.id.substring(0, 8)} | ${platform} | user: ${a.userName} | location: ${a.locationName || 'unknown'} ===`);
    console.log(`  Uploaded:   ${fmt(a.uploadedAt)}  →  Transcoded: ${fmt(a.transcodedAt)}`);
    console.log(`  Raw   (${ext}): ${mb(rawSize)}`);
    console.log(`  Transcoded MP4: ${mb(a.transcodedFileSize)}  [${reduction}% smaller]`);
    console.log(`  RAW:        ${makeDownloadUrl(rawPath, rawToken)}`);
    console.log(`  TRANSCODED: ${makeDownloadUrl(a.transcodedPath, tToken)}`);
  }
})().catch(console.error);
