/**
 * Migration: Convert ascent routesetting (string) to routesettings (string[])
 *
 * Changes each ascent doc from { routesetting: 'rs-id' } to { routesettings: ['rs-id'] }
 * and removes the old scalar field. Ascents with no routesetting get routesettings: [].
 */

export async function migrate(firestore: any): Promise<void> {
  console.log('🚀 Starting ascent routesetting → routesettings migration...\n');

  const db = firestore.firestore;
  let batch = db.batch();
  let batchCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  const MAX_BATCH_SIZE = 500;

  const commitBatch = async () => {
    if (batchCount === 0) return;
    await batch.commit();
    console.log(`✅ Committed batch of ${batchCount} operations`);
    batch = db.batch();
    batchCount = 0;
  };

  console.log('📥 Fetching all ascents...');
  const ascentsSnapshot = await db.collection('ascents').get();
  console.log(`   Found ${ascentsSnapshot.size} ascents\n`);

  for (const ascentDoc of ascentsSnapshot.docs) {
    const ascentData = ascentDoc.data();

    // Skip if already migrated
    if (ascentData.routesettings !== undefined) {
      skippedCount++;
      continue;
    }

    const routesetting = ascentData.routesetting;
    const routesettings = routesetting ? [routesetting] : [];

    batch.update(ascentDoc.ref, {
      routesettings,
      routesetting: firestore.FieldValue.delete(),
    });
    batchCount++;
    updatedCount++;

    if (batchCount >= MAX_BATCH_SIZE) {
      await commitBatch();
    }
  }

  await commitBatch();

  console.log(`\n✅ Migration complete!`);
  console.log(`   Updated: ${updatedCount}`);
  console.log(`   Skipped (already migrated): ${skippedCount}`);
}
