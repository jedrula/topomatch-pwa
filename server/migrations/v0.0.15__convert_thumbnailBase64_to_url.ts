/**
 * Migration: Convert thumbnailBase64 to thumbnailUrl
 * 
 * This migration converts old base64-encoded thumbnails stored in Firestore
 * to actual thumbnail files in Storage with URLs.
 * 
 * Process:
 * 1. Find all ascents with video.thumbnailBase64
 * 2. Decode base64 → Buffer
 * 3. Upload to Storage: videos/transcoded/{userId}/{ascentId}/thumbnail.jpg
 * 4. Update Firestore: replace thumbnailBase64 with thumbnailUrl
 * 5. Clean up old thumbnailBase64 field
 */

import * as admin from 'firebase-admin';

export async function migrate(firestore: any): Promise<void> {
  console.log('🚀 Starting thumbnailBase64 → thumbnailUrl migration...\n');
  
  // Initialize Firebase Admin if not already initialized
  if (!admin.apps.length) {
    const projectId = process.env.GCLOUD_PROJECT || 'topomatch-pwa';
    admin.initializeApp({
      projectId,
      storageBucket: `${projectId}.firebasestorage.app`,
    });
  }
  
  const db = firestore.firestore;
  const bucket = admin.storage().bucket();
  
  let convertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let alreadyHasUrlCount = 0;
  
  /**
   * Extract base64 data from data URL
   * e.g., "data:image/jpeg;base64,/9j/4AAQ..." → "/9j/4AAQ..."
   */
  const extractBase64Data = (dataUrl: string): string | null => {
    if (!dataUrl) return null;
    
    // Handle both formats: data URL or raw base64
    const match = dataUrl.match(/^data:image\/[a-zA-Z]+;base64,(.+)$/);
    if (match) {
      return match[1];
    }
    
    // If it doesn't have the data URL prefix, assume it's raw base64
    return dataUrl;
  };
  
  /**
   * Upload base64 thumbnail to Storage
   */
  const uploadThumbnail = async (
    userId: string,
    ascentId: string,
    base64Data: string
  ): Promise<string> => {
    const thumbnailPath = `videos/transcoded/${userId}/${ascentId}/thumbnail.jpg`;
    const file = bucket.file(thumbnailPath);
    
    // Decode base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Upload to Storage
    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    });
    
    console.log(`   📤 Uploaded thumbnail: ${thumbnailPath}`);
    
    // For emulator, construct direct URL; for production, use public URL
    const isEmulator = process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    
    if (isEmulator) {
      // Emulator URL format
      const encodedPath = encodeURIComponent(thumbnailPath);
      return `http://127.0.0.1:9199/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
    } else {
      // Production: make file public and use public URL
      await file.makePublic();
      return `https://storage.googleapis.com/${bucket.name}/${thumbnailPath}`;
    }
  };
  
  // Get all ascents
  console.log('📥 Fetching all ascents...');
  const ascentsSnapshot = await db.collection('ascents').get();
  console.log(`   Found ${ascentsSnapshot.size} ascents\n`);
  
  // Process each ascent
  for (const ascentDoc of ascentsSnapshot.docs) {
    const ascentData = ascentDoc.data();
    const ascentId = ascentDoc.id;
    
    // Skip if no video object
    if (!ascentData.video) {
      skippedCount++;
      console.log(`⏭️  Ascent ${ascentId}: No video object`);
      continue;
    }
    
    // Skip if already has thumbnailUrl
    if (ascentData.video.thumbnailUrl) {
      alreadyHasUrlCount++;
      console.log(`⏭️  Ascent ${ascentId}: Already has thumbnailUrl`);
      continue;
    }
    
    // Skip if no thumbnailBase64
    if (!ascentData.video.thumbnailBase64) {
      skippedCount++;
      console.log(`⏭️  Ascent ${ascentId}: No thumbnailBase64 to convert`);
      continue;
    }
    
    // Skip if no userId (need it for storage path)
    if (!ascentData.userId) {
      errorCount++;
      console.log(`❌ Ascent ${ascentId}: Missing userId, cannot upload thumbnail`);
      continue;
    }
    
    try {
      console.log(`🔄 Processing ascent ${ascentId}...`);
      
      // Extract base64 data
      const base64Data = extractBase64Data(ascentData.video.thumbnailBase64);
      if (!base64Data) {
        errorCount++;
        console.log(`❌ Ascent ${ascentId}: Invalid base64 data format`);
        continue;
      }
      
      // Upload thumbnail to Storage
      const thumbnailUrl = await uploadThumbnail(
        ascentData.userId,
        ascentId,
        base64Data
      );
      
      // Update Firestore: replace thumbnailBase64 with thumbnailUrl
      const ascentRef = db.collection('ascents').doc(ascentId);
      await ascentRef.update({
        'video.thumbnailUrl': thumbnailUrl,
        'video.thumbnailBase64': firestore.FieldValue.delete(), // Remove old field
        updatedAt: new Date()
      });
      
      convertedCount++;
      console.log(`✅ Ascent ${ascentId}: Converted to thumbnailUrl`);
      
    } catch (error) {
      errorCount++;
      console.error(`❌ Ascent ${ascentId}: Error converting thumbnail`, error);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Converted:       ${convertedCount} ascents`);
  console.log(`⏭️  Already has URL: ${alreadyHasUrlCount} ascents`);
  console.log(`⏭️  Skipped:         ${skippedCount} ascents (no video or no base64)`);
  console.log(`❌ Errors:          ${errorCount} ascents`);
  console.log(`📊 Total processed: ${ascentsSnapshot.size} ascents`);
  console.log('='.repeat(60) + '\n');
  
  if (errorCount > 0) {
    console.warn(`⚠️  ${errorCount} ascents could not be converted. Check logs above for details.`);
  }
  
  console.log('✨ Migration completed!\n');
}
