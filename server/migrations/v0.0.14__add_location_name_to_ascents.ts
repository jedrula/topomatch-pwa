/**
 * Migration: Add locationName field to existing ascents
 * 
 * This migration backfills the locationName field for all existing ascents
 * by fetching the location data and copying the name.
 * 
 * This provides denormalized data for efficient video metadata display
 * without requiring location lookups.
 */

export async function migrate(firestore: any): Promise<void> {
  console.log('🚀 Starting ascent locationName migration...\n');
  
  const db = firestore.firestore;
  let batch = db.batch();
  let batchCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  const MAX_BATCH_SIZE = 500;
  
  /**
   * Commit current batch and start new one
   */
  const commitBatch = async () => {
    if (batchCount === 0) return;
    
    await batch.commit();
    console.log(`✅ Committed batch of ${batchCount} operations`);
    
    batch = db.batch();
    batchCount = 0;
  };
  
  // Cache locations to avoid repeated fetches
  const locationCache = new Map<string, string | null>();
  
  /**
   * Get location name from cache or fetch from Firestore
   */
  const getLocationName = async (locationId: string): Promise<string | null> => {
    if (locationCache.has(locationId)) {
      return locationCache.get(locationId)!;
    }
    
    try {
      const locationDoc = await db.collection('locations').doc(locationId).get();
      if (!locationDoc.exists) {
        console.warn(`   ⚠️  Location ${locationId} not found`);
        locationCache.set(locationId, null);
        return null;
      }
      
      const locationName = locationDoc.data().name;
      locationCache.set(locationId, locationName);
      return locationName;
    } catch (error) {
      console.error(`   ❌ Error fetching location ${locationId}:`, error);
      locationCache.set(locationId, null);
      return null;
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
    
    // Skip if already has locationName
    if (ascentData.locationName) {
      skippedCount++;
      console.log(`⏭️  Ascent ${ascentId}: Already has locationName (${ascentData.locationName})`);
      continue;
    }
    
    // Skip if no locationId
    if (!ascentData.locationId) {
      errorCount++;
      console.log(`❌ Ascent ${ascentId}: Missing locationId, cannot add locationName`);
      continue;
    }
    
    try {
      // Get location name
      const locationName = await getLocationName(ascentData.locationId);
      
      if (!locationName) {
        errorCount++;
        console.log(`❌ Ascent ${ascentId}: Could not fetch location name for locationId ${ascentData.locationId}`);
        continue;
      }
      
      // Add locationName to ascent
      const ascentRef = db.collection('ascents').doc(ascentId);
      batch.update(ascentRef, {
        locationName: locationName,
        updatedAt: new Date()
      });
      
      batchCount++;
      updatedCount++;
      console.log(`✅ Ascent ${ascentId}: Added locationName "${locationName}"`);
      
      // Commit batch if it reaches max size
      if (batchCount >= MAX_BATCH_SIZE) {
        await commitBatch();
      }
      
    } catch (error) {
      errorCount++;
      console.error(`❌ Ascent ${ascentId}: Error adding locationName`, error);
    }
  }
  
  // Commit remaining batch
  await commitBatch();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Updated:  ${updatedCount} ascents`);
  console.log(`⏭️  Skipped:  ${skippedCount} ascents (already had locationName)`);
  console.log(`❌ Errors:   ${errorCount} ascents`);
  console.log(`📍 Cached:   ${locationCache.size} unique locations`);
  console.log('='.repeat(60) + '\n');
  
  if (errorCount > 0) {
    console.warn(`⚠️  ${errorCount} ascents could not be updated. Check logs above for details.`);
  }
  
  console.log('✨ Migration completed!\n');
}
