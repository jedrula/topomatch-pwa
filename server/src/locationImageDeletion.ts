import {onDocumentDeleted} from "firebase-functions/v2/firestore";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {logger} from "firebase-functions";

/**
 * Cascade delete when a locationImage is deleted
 * Deletes:
 * 1. All boulder problems with this imageId
 * 2. Hold detection document for this imageId
 * 3. Storage file for the image
 */
export const onLocationImageDeleted = onDocumentDeleted(
  {
    document: "locationImages/{imageId}",
    region: "europe-west1",
  },
  async (event) => {
    // Initialize Firestore inside the function
    const db = getFirestore();
    const imageId = event.params.imageId;
    const imageData = event.data?.data();

    if (!imageData) {
      logger.warn(`No data found for deleted image: ${imageId}`);
      return null;
    }

    const {locationId, downloadUrl} = imageData;

    logger.info(`🗑️ Cascading delete for image: ${imageId} at location: ${locationId}`);

    try {
      // 1. Delete all boulder problems with this imageId
      const problemsRef = db.collection("locations")
        .doc(locationId)
        .collection("boulderProblems");

      const problemsSnapshot = await problemsRef
        .where("imageId", "==", imageId)
        .get();

      logger.info(`Found ${problemsSnapshot.size} problems to delete`);

      const problemDeletePromises = problemsSnapshot.docs.map((doc) =>
        doc.ref.delete()
      );

      await Promise.all(problemDeletePromises);
      logger.info(`✅ Deleted ${problemsSnapshot.size} boulder problems`);

      // 2. Delete hold detection doc (keyed by imageId)
      const holdDetectionRef = db.collection("locations")
        .doc(locationId)
        .collection("holdDetections")
        .doc(imageId);

      await holdDetectionRef.delete();
      logger.info(`✅ Deleted hold detection for image: ${imageId}`);

      // 3. Delete image from Storage
      if (downloadUrl) {
        try {
          const storage = getStorage();
          const bucket = storage.bucket();

          // Extract path from downloadUrl
          // Format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path?token=...
          const url = new URL(downloadUrl);
          const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/);

          if (pathMatch) {
            const filePath = decodeURIComponent(pathMatch[1]);
            await bucket.file(filePath).delete();
            logger.info(`✅ Deleted storage file: ${filePath}`);
          } else {
            logger.warn(`Could not extract file path from URL: ${downloadUrl}`);
          }
        } catch (storageError) {
          logger.error(`Error deleting storage file:`, storageError);
          // Don't throw - Firestore docs are already deleted
        }
      }

      return {
        success: true,
        imageId,
        deletedProblems: problemsSnapshot.size,
      };
    } catch (error) {
      logger.error(`Error in cascade delete for image ${imageId}:`, error);
      throw error;
    }
  }
);
