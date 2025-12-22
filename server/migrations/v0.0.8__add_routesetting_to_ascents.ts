/**
 * Migration: Add routesetting field to existing ascents
 * 
 * This migration adds the routesetting field to all existing ascents based on:
 * - If ascent has a problemId: Use the latest routesetting from the problem's image
 * - If ascent has no problemId: Use the location's latest routesetting
 * 
 * This allows filtering beta videos by routesetting without complex chain lookups.
 */

export async function migrate(firestore: any): Promise<void> {
  console.log('🚀 Starting ascent routesetting migration...\n');
  
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
  
  // Get all ascents
  console.log('📥 Fetching all ascents...');
  const ascentsSnapshot = await db.collection('ascents').get();
  console.log(`   Found ${ascentsSnapshot.size} ascents\n`);
  
  // Process each ascent
  for (const ascentDoc of ascentsSnapshot.docs) {
    const ascentData = ascentDoc.data();
    const ascentId = ascentDoc.id;
    
    // Skip if already has routesetting
    if (ascentData.routesetting) {
      skippedCount++;
      console.log(`⏭️  Ascent ${ascentId}: Already has routesetting (${ascentData.routesetting})`);
      continue;
    }
    
    try {
      let routesetting: string | null = null;
      
      // Strategy 1: Get from problem's image routesettings (most accurate)
      if (ascentData.problemId) {
        console.log(`🔍 Ascent ${ascentId}: Looking up problem ${ascentData.problemId}...`);
        
        // Get the problem
        const problemDoc = await db
          .collection('locations')
          .doc(ascentData.locationId)
          .collection('boulderProblems')
          .doc(ascentData.problemId)
          .get();
        
        if (problemDoc.exists) {
          const problemData = problemDoc.data();
          
          if (problemData.imageId) {
            console.log(`   Problem has imageId: ${problemData.imageId}`);
            
            // Get the image
            const imageDoc = await db
              .collection('locationImages')
              .doc(problemData.imageId)
              .get();
            
            if (imageDoc.exists) {
              const imageData = imageDoc.data();
              
              if (imageData.routesettings && Array.isArray(imageData.routesettings) && imageData.routesettings.length > 0) {
                // Sort newest first and take the latest
                const sortedRoutesettings = imageData.routesettings.sort((a: string, b: string) => b.localeCompare(a));
                routesetting = sortedRoutesettings[0];
                console.log(`   ✅ Found latest routesetting from image: ${routesetting}`);
              } else {
                console.log(`   ⚠️  Image has no routesettings array`);
              }
            } else {
              console.log(`   ⚠️  Image ${problemData.imageId} not found`);
            }
          } else {
            console.log(`   ⚠️  Problem has no imageId`);
          }
        } else {
          console.log(`   ⚠️  Problem ${ascentData.problemId} not found`);
        }
      }
      
      // Strategy 2: No problemId OR couldn't find routesetting - use location's latest
      if (!routesetting) {
        console.log(`🔍 Ascent ${ascentId}: Looking up location ${ascentData.locationId}...`);
        
        const locationDoc = await db.collection('locations').doc(ascentData.locationId).get();
        
        if (locationDoc.exists) {
          const locationData = locationDoc.data();
          
          if (locationData.routesettings && Array.isArray(locationData.routesettings) && locationData.routesettings.length > 0) {
            // Sort newest first and take the latest
            const sortedRoutesettings = locationData.routesettings.sort((a: string, b: string) => b.localeCompare(a));
            routesetting = sortedRoutesettings[0];
            console.log(`   ✅ Using location's latest routesetting: ${routesetting}`);
          } else {
            console.log(`   ⚠️  Location has no routesettings array`);
          }
        } else {
          console.log(`   ❌ Location ${ascentData.locationId} not found`);
          errorCount++;
          continue;
        }
      }
      
      // Update ascent with routesetting
      if (routesetting) {
        batch.update(ascentDoc.ref, { routesetting });
        batchCount++;
        updatedCount++;
        console.log(`✅ Ascent ${ascentId}: Will update with routesetting=${routesetting}\n`);
        
        // Commit batch if it's getting large
        if (batchCount >= MAX_BATCH_SIZE) {
          await commitBatch();
        }
      } else {
        console.log(`⚠️  Ascent ${ascentId}: Could not determine routesetting - skipping\n`);
        skippedCount++;
      }
      
    } catch (error) {
      console.error(`❌ Error processing ascent ${ascentId}:`, error);
      errorCount++;
    }
  }
  
  // Commit final batch
  await commitBatch();
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Migration Summary');
  console.log('='.repeat(80));
  console.log(`Total ascents:        ${ascentsSnapshot.size}`);
  console.log(`Updated:              ${updatedCount}`);
  console.log(`Skipped (has field):  ${skippedCount}`);
  console.log(`Errors:               ${errorCount}`);
  console.log('='.repeat(80));
  console.log('\n✅ Migration completed successfully');
}
