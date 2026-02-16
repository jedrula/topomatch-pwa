export async function migrate(firestore: any): Promise<void> {
  const db = firestore.firestore;
  
  console.log("Adding default floorplan structure to existing locations...");
  
  const locationsSnapshot = await db.collection("locations").get();
  
  if (locationsSnapshot.empty) {
    console.log("No locations found, skipping migration");
    return;
  }
  
  const batch = db.batch();
  let count = 0;
  
  // Default floorplan with empty outline and sections
  const defaultFloorplan = {
    outline: [],
    sections: []
  };
  
  locationsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    if (!data.floorplan) {
      batch.update(doc.ref, {
        floorplan: defaultFloorplan,
      });
      count++;
    }
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`✅ Updated ${count} locations with default floorplan structure`);
  } else {
    console.log("All locations already have floorplan field");
  }
}
