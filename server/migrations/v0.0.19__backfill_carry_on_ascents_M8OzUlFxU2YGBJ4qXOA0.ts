/**
 * Migration: Backfill carry-on ascents for location M8OzUlFxU2YGBJ4qXOA0
 *
 * Context: A new routesetting was created on 2026-03-30 with carry-on images.
 * The old routesettingService wrote directly to locationImages without backfilling ascents.
 * This migration finds all images that have the new routesetting and adds it to their ascents.
 */

export async function migrate(firestore: any): Promise<void> {
  console.log('🚀 Backfilling carry-on ascents for location M8OzUlFxU2YGBJ4qXOA0\n');

  const db = firestore.firestore;
  const FieldValue = firestore.FieldValue;
  const locationId = 'M8OzUlFxU2YGBJ4qXOA0';

  let batch = db.batch();
  let batchCount = 0;
  let totalAscentsUpdated = 0;
  const MAX_BATCH_SIZE = 500;

  const commitBatch = async () => {
    if (batchCount === 0) return;
    await batch.commit();
    console.log(`  ✅ Committed batch of ${batchCount} operations`);
    batch = db.batch();
    batchCount = 0;
  };

  // Step 1: Get the location to find all routesettings
  const locationDoc = await db.collection('locations').doc(locationId).get();
  if (!locationDoc.exists) {
    throw new Error(`Location ${locationId} not found`);
  }
  const allRoutesettings: string[] = locationDoc.data().routesettings || [];
  console.log(`📍 Location routesettings: ${JSON.stringify(allRoutesettings)}`);

  if (allRoutesettings.length < 2) {
    console.log('⚠️  Less than 2 routesettings — nothing to backfill');
    return;
  }

  // New routesetting = the 2026-03-30 one
  const newRoutesetting = allRoutesettings.find((rs) => rs.startsWith('2026-03-30'));
  if (!newRoutesetting) {
    throw new Error('Could not find 2026-03-30 routesetting in location doc');
  }
  console.log(`🔖 New routesetting to backfill: "${newRoutesetting}"\n`);

  // Step 2: Find all locationImages for this location that have the new routesetting (carry-ons)
  const imagesSnap = await db
    .collection('locationImages')
    .where('locationId', '==', locationId)
    .where('routesettings', 'array-contains', newRoutesetting)
    .get();

  console.log(`🖼️  Found ${imagesSnap.size} carry-on images with routesetting "${newRoutesetting}"`);
  if (imagesSnap.size === 0) {
    console.log('⚠️  No carry-on images found — nothing to backfill');
    return;
  }

  // Step 3: For each image, find boulder problems on that image
  for (const imageDoc of imagesSnap.docs) {
    const imageId = imageDoc.id;
    const problemsSnap = await db
      .collection('locations')
      .doc(locationId)
      .collection('boulderProblems')
      .where('imageId', '==', imageId)
      .get();

    console.log(`  Image ${imageId}: ${problemsSnap.size} problems`);

    // Step 4: For each problem, find ascents and backfill the new routesetting
    for (const problemDoc of problemsSnap.docs) {
      const problemId = problemDoc.id;
      const ascentsSnap = await db
        .collection('ascents')
        .where('problemId', '==', problemId)
        .where('locationId', '==', locationId)
        .get();

      for (const ascentDoc of ascentsSnap.docs) {
        const existingRS: string[] = ascentDoc.data().routesettings || [];
        if (existingRS.includes(newRoutesetting)) {
          continue; // already backfilled
        }
        batch.update(ascentDoc.ref, {
          routesettings: FieldValue.arrayUnion(newRoutesetting),
        });
        batchCount++;
        totalAscentsUpdated++;

        if (batchCount >= MAX_BATCH_SIZE) {
          await commitBatch();
        }
      }
    }
  }

  await commitBatch();

  console.log(`\n🎉 Done! Backfilled ${totalAscentsUpdated} ascents with routesetting "${newRoutesetting}"`);
}
