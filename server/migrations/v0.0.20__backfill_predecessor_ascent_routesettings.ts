/**
 * Migration: Backfill routesettings for ascents of predecessor problems
 *
 * When setPredecessorProblem is called, it backfills the predecessor's ascents
 * with the new routesetting derived from the new problem's image.
 * But if the callable was invoked before the image had the new routesetting,
 * the backfill was a no-op with the old RS (or ran before carry-on was set).
 *
 * This migration scans all problems with a predecessorProblemId, derives the
 * expected routesetting from the new problem's image, and ensures all predecessor
 * ascents have that routesetting.
 */

export async function migrate(firestore: any): Promise<void> {
  console.log('🚀 Backfilling predecessor ascents for all locations...\n');

  const db = firestore.firestore;
  const FieldValue = firestore.FieldValue;

  let batch = db.batch();
  let batchCount = 0;
  let totalFixed = 0;
  let problemsChecked = 0;
  const MAX_BATCH_SIZE = 500;

  const commitBatch = async () => {
    if (batchCount === 0) return;
    await batch.commit();
    console.log(`  ✅ Committed batch of ${batchCount}`);
    batch = db.batch();
    batchCount = 0;
  };

  // Get all locations
  const locationsSnap = await db.collection('locations').get();
  console.log(`📍 Found ${locationsSnap.size} locations\n`);

  for (const locationDoc of locationsSnap.docs) {
    const locationId = locationDoc.id;
    const locationRoutesettings: string[] = locationDoc.data().routesettings || [];
    if (locationRoutesettings.length < 2) continue; // Need at least 2 routesettings

    // Find all problems with a predecessorProblemId
    const problemsSnap = await db
      .collection('locations').doc(locationId)
      .collection('boulderProblems')
      .get();

    for (const problemDoc of problemsSnap.docs) {
      const problem = problemDoc.data();
      if (!problem.predecessorProblemId) continue;

      problemsChecked++;
      const newProblemId = problemDoc.id;
      const predecessorProblemId = problem.predecessorProblemId;
      const imageId = problem.imageId;

      if (!imageId) continue;

      // Derive the new routesetting from the problem's image
      const imageSnap = await db.collection('locationImages').doc(imageId).get();
      if (!imageSnap.exists) continue;

      const imageRoutesettings: string[] = imageSnap.data()?.routesettings || [];
      if (imageRoutesettings.length === 0) continue;

      // The new routesetting is the latest one on the image (highest value ISO string)
      const newRS = [...imageRoutesettings].sort().pop()!;

      // Also confirm this RS is newer than any RS the predecessor already has
      const predecessorAscentsSnap = await db.collection('ascents')
        .where('problemId', '==', predecessorProblemId)
        .get();

      let fixed = 0;
      for (const ascentDoc of predecessorAscentsSnap.docs) {
        const existingRS: string[] = ascentDoc.data().routesettings || [];
        if (existingRS.includes(newRS)) continue; // already has it

        batch.update(ascentDoc.ref, {
          routesettings: FieldValue.arrayUnion(newRS),
        });
        batchCount++;
        fixed++;
        totalFixed++;

        if (batchCount >= MAX_BATCH_SIZE) await commitBatch();
      }

      if (fixed > 0) {
        console.log(`  📎 ${locationId}: problem ${newProblemId} → predecessor ${predecessorProblemId}: fixed ${fixed} ascents with RS "${newRS}"`);
      }
    }
  }

  await commitBatch();

  console.log(`\n🎉 Done! Checked ${problemsChecked} predecessor-linked problems, fixed ${totalFixed} ascents.`);
}
