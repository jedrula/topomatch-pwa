#!/usr/bin/env node

/**
 * Post-mortem analysis for video transcoding issues
 * Usage: node scripts/investigate-video.js <videoId>
 * Example: node scripts/investigate-video.js 1769740344485-hs6d7hy7v
 */

const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require('../topomatch-pwa-firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'topomatch-pwa.firebasestorage.app'
});

const db = getFirestore();
const storage = getStorage();
const bucket = storage.bucket();

async function investigateVideo(videoId) {
  console.log(`\n🔍 INVESTIGATING VIDEO: ${videoId}\n`);
  console.log('=' .repeat(80));

  // Step 1: Find the raw video file
  console.log('\n📁 STEP 1: Checking raw video file...');
  const [rawFiles] = await bucket.getFiles({
    prefix: 'videos/raw/',
  });
  
  const rawFile = rawFiles.find(f => f.name.includes(videoId));
  if (!rawFile) {
    console.log('❌ Raw video file not found');
    return;
  }
  
  console.log(`✅ Found: ${rawFile.name}`);
  
  const [metadata] = await rawFile.getMetadata();
  console.log(`   Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Content-Type: ${metadata.contentType}`);
  console.log(`   Uploaded: ${metadata.timeCreated}`);
  console.log(`   Metadata:`, metadata.metadata);

  const ascentId = metadata.metadata?.ascentId;
  if (!ascentId) {
    console.log('❌ No ascentId in metadata');
    return;
  }
  console.log(`   AscentId: ${ascentId}`);

  // Step 2: Check Firestore ascent document
  console.log('\n📄 STEP 2: Checking Firestore ascent document...');
  const ascentRef = db.collection('ascents').doc(ascentId);
  const ascentDoc = await ascentRef.get();
  
  if (!ascentDoc.exists) {
    console.log('❌ Ascent document not found');
    return;
  }
  
  const ascent = ascentDoc.data();
  console.log(`✅ Ascent found`);
  console.log(`   Video status: ${ascent.video?.status}`);
  console.log(`   Original path: ${ascent.video?.originalPath}`);
  console.log(`   Transcoded path: ${ascent.video?.transcodedPath || 'N/A'}`);
  console.log(`   Thumbnail URL: ${ascent.video?.thumbnailUrl || 'N/A'}`);
  console.log(`   Uploaded at: ${ascent.video?.uploadedAt?.toDate()}`);
  console.log(`   Transcoded at: ${ascent.video?.transcodedAt?.toDate() || 'N/A'}`);

  // Step 3: Check for transcoded video
  console.log('\n🎬 STEP 3: Checking transcoded video...');
  const userId = rawFile.name.split('/')[2];
  const transcodedPath = `videos/transcoded/${userId}/${ascentId}/video.mp4`;
  const transcodedFile = bucket.file(transcodedPath);
  const [exists] = await transcodedFile.exists();
  
  if (exists) {
    console.log(`✅ Transcoded file exists: ${transcodedPath}`);
    const [transcodedMeta] = await transcodedFile.getMetadata();
    console.log(`   Size: ${(transcodedMeta.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Created: ${transcodedMeta.timeCreated}`);
  } else {
    console.log(`❌ Transcoded file NOT found: ${transcodedPath}`);
  }

  // Step 4: Check for thumbnail
  console.log('\n🖼️  STEP 4: Checking thumbnail...');
  const thumbnailPath = `videos/transcoded/${userId}/${ascentId}/thumbnail.jpg`;
  const thumbnailFile = bucket.file(thumbnailPath);
  const [thumbnailExists] = await thumbnailFile.exists();
  
  if (thumbnailExists) {
    console.log(`✅ Thumbnail exists: ${thumbnailPath}`);
    const [thumbMeta] = await thumbnailFile.getMetadata();
    console.log(`   Size: ${(thumbMeta.size / 1024).toFixed(2)} KB`);
    console.log(`   Created: ${thumbMeta.timeCreated}`);
  } else {
    console.log(`❌ Thumbnail NOT found: ${thumbnailPath}`);
  }

  // Step 5: Summary and diagnosis
  console.log('\n📊 DIAGNOSIS:');
  console.log('=' .repeat(80));
  
  if (ascent.video?.status === 'transcoding' && !exists) {
    console.log('⚠️  STUCK IN TRANSCODING STATE');
    console.log('   Possible causes:');
    console.log('   1. Transcoding job failed (check gcloud transcoder jobs)');
    console.log('   2. onStorageFileCreated function didn\'t trigger for raw upload');
    console.log('   3. Transcoding job succeeded but output file not created');
    console.log('\n   Next steps:');
    console.log(`   1. Check logs: firebase functions:log --only onStorageFileCreated`);
    console.log(`   2. Check transcoder: gcloud transcoder jobs list --location=europe-west1 --limit=20`);
    console.log(`   3. Look for job with inputUri containing: ${videoId}`);
  } else if (exists && ascent.video?.status !== 'ready') {
    console.log('⚠️  TRANSCODED BUT STATUS NOT UPDATED');
    console.log('   Possible causes:');
    console.log('   1. onStorageFileCreated didn\'t trigger for transcoded file');
    console.log('   2. handleTranscodedVideo() failed');
    console.log('\n   Next steps:');
    console.log(`   1. Manually trigger: Copy ${transcodedPath} to itself to re-trigger`);
    console.log(`   2. Or update Firestore manually`);
  } else if (ascent.video?.status === 'ready' && !thumbnailExists) {
    console.log('⚠️  READY BUT NO THUMBNAIL');
    console.log('   Thumbnail generation failed during handleTranscodedVideo()');
  } else if (ascent.video?.status === 'ready' && exists && thumbnailExists) {
    console.log('✅ EVERYTHING LOOKS GOOD');
    console.log('   Video transcoded, thumbnail generated, status updated');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// Main
const videoId = process.argv[2];
if (!videoId) {
  console.error('Usage: node scripts/investigate-video.js <videoId>');
  console.error('Example: node scripts/investigate-video.js 1769740344485-hs6d7hy7v');
  process.exit(1);
}

investigateVideo(videoId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
