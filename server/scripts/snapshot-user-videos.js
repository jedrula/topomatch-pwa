#!/usr/bin/env node

/**
 * Snapshot user's video files in storage
 * Usage: node scripts/snapshot-user-videos.js <userId>
 */

const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');

// Initialize Firebase Admin
const serviceAccount = require('../topomatch-pwa-firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'topomatch-pwa.firebasestorage.app'
});

const storage = getStorage();
const bucket = storage.bucket();

async function snapshotUserVideos(userId) {
  console.log(`\n📸 SNAPSHOT: User ${userId}`);
  console.log('=' .repeat(80));
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // Check raw videos
  console.log('📁 RAW VIDEOS (videos/raw/):');
  const [rawFiles] = await bucket.getFiles({
    prefix: `videos/raw/${userId}/`,
  });
  
  if (rawFiles.length === 0) {
    console.log('  (none)');
  } else {
    for (const file of rawFiles) {
      const [metadata] = await file.getMetadata();
      console.log(`  ✓ ${file.name}`);
      console.log(`    Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`    Created: ${metadata.timeCreated}`);
      console.log(`    AscentId: ${metadata.metadata?.ascentId || 'N/A'}`);
    }
  }

  // Check transcoded videos
  console.log('\n🎬 TRANSCODED VIDEOS (videos/transcoded/):');
  const [transcodedFiles] = await bucket.getFiles({
    prefix: `videos/transcoded/${userId}/`,
  });
  
  if (transcodedFiles.length === 0) {
    console.log('  (none)');
  } else {
    // Group by ascentId
    const byAscent = {};
    for (const file of transcodedFiles) {
      const parts = file.name.split('/');
      const ascentId = parts[3]; // videos/transcoded/{userId}/{ascentId}/file
      if (!byAscent[ascentId]) {
        byAscent[ascentId] = [];
      }
      byAscent[ascentId].push(file);
    }
    
    for (const [ascentId, files] of Object.entries(byAscent)) {
      console.log(`  📂 ${ascentId}:`);
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const fileName = file.name.split('/').pop();
        console.log(`    ✓ ${fileName}`);
        console.log(`      Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`      Created: ${metadata.timeCreated}`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Total raw videos: ${rawFiles.length}`);
  console.log(`Total transcoded files: ${transcodedFiles.length}`);
  console.log('='.repeat(80) + '\n');
}

// Main
const userId = process.argv[2];
if (!userId) {
  console.error('Usage: node scripts/snapshot-user-videos.js <userId>');
  console.error('Example: node scripts/snapshot-user-videos.js rzCownD1WGb9ryHH8cad4RbPcSR2');
  process.exit(1);
}

snapshotUserVideos(userId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
