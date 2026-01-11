export async function migrate(firestore: any): Promise<void> {
  const db = firestore.firestore;
  
  console.log("Adding name_lowercase field to existing locations...");
  
  const locationsSnapshot = await db.collection("locations").get();
  
  if (locationsSnapshot.empty) {
    console.log("No locations found, skipping migration");
    return;
  }
  
  const batch = db.batch();
  let count = 0;
  
  locationsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    if (data.name && !data.name_lowercase) {
      batch.update(doc.ref, {
        name_lowercase: data.name.toLowerCase(),
      });
      count++;
    }
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`✅ Updated ${count} locations with name_lowercase field`);
  } else {
    console.log("All locations already have name_lowercase field");
  }
}
