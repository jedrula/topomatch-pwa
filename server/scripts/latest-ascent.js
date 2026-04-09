const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'topomatch-pwa' });
const db = admin.firestore();

async function main() {
  const snap = await db.collection('ascents').orderBy('createdAt', 'desc').limit(3).get();
  snap.docs.forEach(d => {
    const data = d.data();
    const v = data.video || {};
    console.log('\n--- ' + d.id + ' ---');
    console.log('user:       ', data.userName);
    console.log('location:   ', data.locationName);
    console.log('createdAt:  ', data.createdAt?.toDate?.()?.toISOString());
    console.log('video.status:        ', v.status);
    console.log('video.uploadedOn:    ', v.uploadedOn ?? '(not set)');
    console.log('video.uploadedAt:    ', v.uploadedAt?.toDate?.()?.toISOString() ?? v.uploadedAt);
    console.log('video.thumbnailUrl:  ', v.thumbnailUrl ?? '(not set)');
    console.log('video.transcodedPath:', v.transcodedPath ?? '(not set)');
  });
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
