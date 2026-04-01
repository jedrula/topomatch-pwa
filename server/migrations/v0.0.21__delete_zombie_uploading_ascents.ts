/**
 * Migration: Delete zombie ascents stuck in 'uploading' status with no video paths
 *
 * These 26 docs were created when a user started a video upload that never
 * completed. They have:
 *   - video.status = 'uploading'
 *   - video.uploadedAt stored as ISO string (old client bug)
 *   - no video.originalPath or video.transcodedPath
 *
 * Cascade cleanup:
 *   - /comments where ascentId matches (unlikely but checked)
 *   - /analysisDiagnostics/{ascentId} (unlikely since never transcoded)
 *   - Storage files: onAscentDeleted Cloud Function handles this automatically,
 *     but there are none (no paths stored)
 */

export async function migrate(firestore: any): Promise<void> {
  console.log('🚀 Deleting zombie ascents stuck in uploading status...\n');

  const db = firestore.firestore;

  const ascentsSnap = await db.collection('ascents').get();
  console.log(`Total ascents: ${ascentsSnap.size}`);

  // Identify zombies: uploadedAt is not a Timestamp (ISO string or missing)
  const zombies = ascentsSnap.docs.filter((doc: any) => {
    const data = doc.data();
    const uploadedAt = data.video?.uploadedAt;
    const isTimestamp =
      uploadedAt != null &&
      typeof uploadedAt === 'object' &&
      typeof uploadedAt.toDate === 'function';
    return !isTimestamp;
  });

  console.log(`Found ${zombies.length} zombie doc(s) to delete\n`);

  if (zombies.length === 0) {
    console.log('✅ Nothing to do.');
    return;
  }

  let totalDeleted = 0;

  for (const doc of zombies) {
    const ascentId = doc.id;
    const data = doc.data();
    console.log(`  🗑️  ${ascentId} (userId: ${data.userId}, status: ${data.video?.status})`);

    // Delete orphaned comments (unlikely for a zombie but clean up anyway)
    const commentsSnap = await db
      .collection('comments')
      .where('ascentId', '==', ascentId)
      .get();
    if (!commentsSnap.empty) {
      const batch = db.batch();
      commentsSnap.docs.forEach((c: any) => batch.delete(c.ref));
      await batch.commit();
      console.log(`    ↳ deleted ${commentsSnap.size} comment(s)`);
    }

    // Delete analysisDiagnostics doc if it exists
    const diagRef = db.collection('analysisDiagnostics').doc(ascentId);
    const diagSnap = await diagRef.get();
    if (diagSnap.exists) {
      await diagRef.delete();
      console.log(`    ↳ deleted analysisDiagnostics/${ascentId}`);
    }

    // Delete the ascent doc itself (triggers onAscentDeleted for Storage cleanup)
    await doc.ref.delete();
    totalDeleted++;
  }

  console.log(`\n✅ Done. Deleted ${totalDeleted} zombie ascent(s).`);
}
