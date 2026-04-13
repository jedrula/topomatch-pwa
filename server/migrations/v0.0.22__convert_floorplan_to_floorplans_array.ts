import { randomUUID } from 'crypto';

export async function migrate(firestore: any): Promise<void> {
  const db = firestore.firestore;
  const FieldValue = firestore.FieldValue;
  const snap = await db.collection('locations').get();
  const batch = db.batch();
  let count = 0;

  snap.docs.forEach((doc: any) => {
    const data = doc.data();
    if (data.floorplan !== undefined) {
      batch.update(doc.ref, {
        floorplans: [{ id: randomUUID(), name: 'Main Floor', ...data.floorplan }],
        floorplan: FieldValue.delete(),
      });
      count++;
    } else if (data.floorplans === undefined) {
      batch.update(doc.ref, { floorplans: [] });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Migrated ${count} locations: floorplan → floorplans[0]`);
  } else {
    console.log('No locations with legacy floorplan field found.');
  }
}
