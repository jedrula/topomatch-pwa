/**
 * Migration: Add array-based routesetting architecture
 * 
 * This migration introduces the array-based routesetting system:
 * 1. Adds routesettings[] array to locations (list of ISO timestamp strings)
 * 2. Adds routesettings[] array to locationImages (which routesettings include this image)
 * 3. Creates default routesetting (2025-12-20) for existing locations
 * 4. Assigns all existing images to the default routesetting
 * 
 * Architecture:
 * - Locations: routesettings = ["2025-12-22T13:32", "2025-12-20", ...] (sorted newest first)
 * - Images: routesettings = ["2025-12-20", "2025-12-22T13:32"] (which routesettings include this image)
 * - Current routesetting = first item in location's routesettings array OR query param
 */

export async function migrate(firestore: any): Promise<void> {
  console.log('🚀 Starting array-based routesetting architecture migration...\n');
  
  const db = firestore.firestore;
  const DEFAULT_ROUTESETTING = '2025-12-20'; // Default for existing data
  
  let batch = db.batch();
  let batchCount = 0;
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
  
  // ========================================
  // STEP 1: Add routesettings[] to locations
  // ========================================
  console.log('📍 Step 1: Adding routesettings array to locations...');
  
  const locationsSnapshot = await db.collection('locations').get();
  console.log(`   Found ${locationsSnapshot.size} locations\n`);
  
  for (const locationDoc of locationsSnapshot.docs) {
    const locationData = locationDoc.data();
    const locationId = locationDoc.id;
    
    // Skip if already has routesettings array
    if (locationData.routesettings && Array.isArray(locationData.routesettings)) {
      console.log(`⏭️  Location ${locationData.name || locationId}: Already has routesettings array`);
      continue;
    }
    
    console.log(`✅ Location ${locationData.name || locationId}: Adding routesettings array with default`);
    
    // Add routesettings array with default routesetting
    batch.update(locationDoc.ref, {
      routesettings: [DEFAULT_ROUTESETTING]
    });
    batchCount++;
    
    await commitBatch();
  }
  
  await batch.commit();
  batch = db.batch();
  batchCount = 0;
  console.log('✅ Step 1 complete\n');
  
  // ========================================
  // STEP 2: Add routesettings[] to locationImages
  // ========================================
  console.log('📷 Step 2: Adding routesettings array to locationImages...');
  
  const imagesSnapshot = await db.collection('locationImages').get();
  console.log(`   Found ${imagesSnapshot.size} images\n`);
  
  let imagesUpdated = 0;
  let imagesSkipped = 0;
  
  for (const imageDoc of imagesSnapshot.docs) {
    const imageData = imageDoc.data();
    const imageId = imageDoc.id;
    
    // Skip if already has routesettings array
    if (imageData.routesettings && Array.isArray(imageData.routesettings)) {
      console.log(`⏭️  Image ${imageId}: Already has routesettings array`);
      imagesSkipped++;
      continue;
    }
    
    console.log(`✅ Image ${imageId}: Adding routesettings array with default`);
    
    // Add routesettings array with default routesetting
    batch.update(imageDoc.ref, {
      routesettings: [DEFAULT_ROUTESETTING]
    });
    batchCount++;
    imagesUpdated++;
    
    await commitBatch();
  }
  
  await batch.commit();
  batch = db.batch();
  batchCount = 0;
  console.log(`✅ Step 2 complete: Updated ${imagesUpdated} images, skipped ${imagesSkipped}\n`);
  
  // ========================================
  // STEP 3: Collect unique routesettings from images and add to locations
  // ========================================
  console.log('🔗 Step 3: Collecting all routesettings from images and updating locations...');
  
  for (const locationDoc of locationsSnapshot.docs) {
    const locationId = locationDoc.id;
    const locationData = locationDoc.data();
    
    // Get all images for this location
    const locationImagesSnapshot = await db
      .collection('locationImages')
      .where('locationId', '==', locationId)
      .get();
    
    if (locationImagesSnapshot.empty) {
      console.log(`   Location ${locationId}: No images found`);
      continue;
    }
    
    // Collect all unique routesettings from images
    const allRoutesettings = new Set<string>(locationData.routesettings || []);
    
    locationImagesSnapshot.forEach((imageDoc: any) => {
      const imageData = imageDoc.data();
      if (imageData.routesettings && Array.isArray(imageData.routesettings)) {
        imageData.routesettings.forEach((rs: string) => allRoutesettings.add(rs));
      }
    });
    
    // Sort newest first
    const sortedRoutesettings = Array.from(allRoutesettings).sort((a, b) => b.localeCompare(a));
    
    console.log(`✅ Location ${locationId}: Found ${allRoutesettings.size} unique routesettings from ${locationImagesSnapshot.size} images`);
    console.log(`   Routesettings: ${sortedRoutesettings.join(', ')}`);
    
    // Update location with complete routesettings array
    batch.update(locationDoc.ref, {
      routesettings: sortedRoutesettings
    });
    batchCount++;
    
    await commitBatch();
  }
  
  await batch.commit();
  console.log('✅ Step 3 complete\n');
  
  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 Migration Summary');
  console.log('='.repeat(80));
  console.log(`Locations processed:      ${locationsSnapshot.size}`);
  console.log(`Images updated:           ${imagesUpdated}`);
  console.log(`Images skipped:           ${imagesSkipped}`);
  console.log(`Default routesetting:     ${DEFAULT_ROUTESETTING}`);
  console.log('='.repeat(80));
  console.log('\n✅ Migration completed successfully');
  console.log('\n📝 Next steps:');
  console.log('   - Run v0.0.8 migration to add routesetting field to ascents');
  console.log('   - Images are now version-controlled by routesetting');
  console.log('   - Current routesetting = first item in location.routesettings array');
}
