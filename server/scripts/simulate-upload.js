const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Initialize Firebase Admin (for production)
admin.initializeApp({
  projectId: 'topomatch-pwa',
  storageBucket: 'topomatch-pwa.firebasestorage.app'
});

const storage = new Storage();
const db = admin.firestore();

async function simulateVideoUpload(testVideoPath) {
  console.log('🎬 Starting video upload simulation...\n');
  
  // Generate test identifiers
  const userId = 'test-user-123';
  const videoId = `test-video-${Date.now()}`;
  const uploadPath = `videos/raw/${userId}/${videoId}.mp4`;
  
  console.log(`📤 Uploading test video to: ${uploadPath}`);
  console.log(`📁 Source file: ${testVideoPath}\n`);
  
  try {
    // 1. Upload video to Storage (this triggers the Cloud Function)
    await storage
      .bucket('topomatch-pwa.firebasestorage.app')
      .upload(testVideoPath, {
        destination: uploadPath,
        metadata: {
          contentType: 'video/mp4',
          metadata: {
            userId: userId,
            uploadedBy: 'test-script'
          }
        }
      });
    
    console.log('✅ Upload complete!\n');
    
    // 2. Create Firestore document (Cloud Function might do this, but we'll ensure it exists)
    const videoRef = db.collection('climbVideos').doc(videoId);
    await videoRef.set({
      status: 'processing',
      userId: userId,
      originalPath: uploadPath,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        fileName: path.basename(testVideoPath)
      }
    });
    
    console.log(`📝 Created Firestore document: /climbVideos/${videoId}\n`);
    console.log('⏳ Monitoring transcoding progress...\n');
    console.log('   (This may take 1-3 minutes for a 1-minute video)\n');
    
    // 3. Monitor Firestore for status changes
    return new Promise((resolve, reject) => {
      let lastStatus = null;
      
      const unsubscribe = videoRef.onSnapshot(async (snapshot) => {
        const data = snapshot.data();
        
        if (!data) {
          console.log('⚠️  Document not found');
          return;
        }
        
        // Only log if status changed
        if (data.status !== lastStatus) {
          console.log(`📊 Status: ${data.status}`);
          lastStatus = data.status;
        }
        
        if (data.status === 'ready') {
          console.log('\n✅ TRANSCODING COMPLETE!\n');
          console.log('📹 Transcoded versions:');
          data.transcodedVersions?.forEach(version => {
            console.log(`  - ${version.quality}: ${version.path}`);
          });
          
          // Verify transcoded file exists
          const transcodedPath = data.transcodedVersions?.[0]?.path;
        if (transcodedPath) {
          const [exists] = await storage
            .bucket('topomatch-pwa.firebasestorage.app')
            .file(transcodedPath)
            .exists();            console.log(`\n📦 Transcoded file exists in Storage: ${exists ? '✅ YES' : '❌ NO'}`);
            
          if (exists) {
            const [metadata] = await storage
              .bucket('topomatch-pwa.firebasestorage.app')
              .file(transcodedPath)
              .getMetadata();
            
            const originalSize = (await storage
              .bucket('topomatch-pwa.firebasestorage.app')
              .file(uploadPath)
              .getMetadata())[0].size;              console.log(`📏 Original file size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
              console.log(`📏 Transcoded file size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
              console.log(`💰 Size reduction: ${(((originalSize - metadata.size) / originalSize) * 100).toFixed(1)}%`);
            }
          }
          
          unsubscribe();
          resolve(data);
        } else if (data.status === 'failed') {
          console.log('\n❌ TRANSCODING FAILED!\n');
          console.error('Error:', data.error);
          unsubscribe();
          reject(new Error(data.error));
        }
      }, (error) => {
        console.error('\n❌ Firestore listener error:', error.message);
        unsubscribe();
        reject(error);
      });
      
      // Timeout after 10 minutes
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Transcoding timeout (10 minutes)'));
      }, 10 * 60 * 1000);
    });
  } catch (error) {
    console.error('\n❌ Error during upload:', error.message);
    throw error;
  }
}

// Run the test
const testVideoPath = process.argv[2] || '../test-data/FLOW_IMG_8013.mov';

console.log('================================================');
console.log('  Video Transcoding POC - End-to-End Test');
console.log('================================================\n');

simulateVideoUpload(testVideoPath)
  .then(() => {
    console.log('\n================================================');
    console.log('  🎉 Test completed successfully!');
    console.log('================================================\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n================================================');
    console.error('  💥 Test failed:', error.message);
    console.error('================================================\n');
    process.exit(1);
  });
