/**
 * Migration: Backfill pickOrder and batchUploadedAt on existing locationImages documents.
 *
 * These fields were added to preserve file-picker ordering when multiple photos are
 * uploaded in a single batch. Existing images have neither field.
 *
 * For legacy images we have no way to know the original picker order, so we assign:
 *   - pickOrder: 0  (single-item batch, no relative ordering ambiguity)
 *   - batchUploadedAt: uploadedAt.toMillis()  (treat each legacy image as its own batch)
 *
 * This keeps the sort deterministic (newest first) and indistinguishable from the
 * old uploadedAt-desc behaviour for images that were uploaded one at a time.
 */

export async function migrate(firestore: any): Promise<void> {
  console.log('🚀 Backfilling pickOrder + batchUploadedAt on locationImages...\n');

  const db = firestore.firestore;

  const snapshot = await db.collection('locationImages').get();
  console.log(`📸 Found ${snapshot.size} locationImages documents`);

  let batch = db.batch();
  let batchCount = 0;
  let totalFixed = 0;
  const MAX_BATCH_SIZE = 500;

  const commitBatch = async () => {
    if (batchCount === 0) return;
    await batch.commit();
    console.log(`  ✅ Committed batch of ${batchCount}`);
    batch = db.batch();
    batchCount = 0;
  };

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.pickOrder !== undefined && data.batchUploadedAt !== undefined) continue;

    const uploadedAtMs: number =
      data.uploadedAt && typeof data.uploadedAt.toMillis === 'function'
        ? data.uploadedAt.toMillis()
        : Date.now();

    batch.update(doc.ref, {
      pickOrder: 0,
      batchUploadedAt: uploadedAtMs,
    });
    batchCount++;
    totalFixed++;

    if (batchCount >= MAX_BATCH_SIZE) {
      await commitBatch();
    }
  }

  await commitBatch();
  console.log(`\n✅ Done. Backfilled ${totalFixed} documents.`);
}
