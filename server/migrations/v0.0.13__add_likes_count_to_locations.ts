export async function migrate(firestore: any): Promise<void> {
  const db = firestore.firestore;
  
  console.log("Adding likesCount field to existing locations...");
  
  const locationsSnapshot = await db.collection("locations").get();
  
  if (locationsSnapshot.empty) {
    console.log("No locations found, skipping migration");
    return;
  }
  
  const batch = db.batch();
  let count = 0;
  
  locationsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    if (data.likesCount === undefined || data.likesCount === null) {
      batch.update(doc.ref, {
        likesCount: 0,
      });
      count++;
    }
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`✅ Updated ${count} locations with likesCount: 0`);
  } else {
    console.log("All locations already have likesCount field");
  }
}
