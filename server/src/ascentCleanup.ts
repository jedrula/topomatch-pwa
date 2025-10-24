import {onDocumentDeleted} from "firebase-functions/v2/firestore";
import {getStorage} from "firebase-admin/storage";
import {logger} from "firebase-functions";

/**
 * Cascade delete when an ascent is deleted
 * Deletes associated video files from Storage:
 * - Original video in videos/raw/{userId}/{ascentId}.*
 * - Transcoded video in videos/transcoded/{userId}/{ascentId}/
 */
export const onAscentDeleted = onDocumentDeleted(
  {
    document: "ascents/{ascentId}",
    region: "europe-west1",
  },
  async (event) => {
    const ascentId = event.params.ascentId;
    const ascentData = event.data?.data();

    if (!ascentData) {
      logger.warn(`No data found for deleted ascent: ${ascentId}`);
      return null;
    }

    const {userId, video} = ascentData;

    // If there's no video, nothing to delete
    if (!video || (!video.originalPath && !video.transcodedPath)) {
      logger.info(`No video attached to ascent ${ascentId}, skipping cleanup`);
      return null;
    }

    logger.info(`🗑️ Cleaning up video files for ascent: ${ascentId}`);

    try {
      const storage = getStorage();
      const bucket = storage.bucket();

      // Delete original video file
      // Path: videos/raw/{userId}/{ascentId}.* (find and delete all extensions)
      if (video.originalPath) {
        try {
          await bucket.file(video.originalPath).delete();
          logger.info(`✅ Deleted original video: ${video.originalPath}`);
        } catch (error) {
          logger.warn(`Could not delete original video: ${video.originalPath}`, error);
        }
      }

      // Delete transcoded video folder
      // Path: videos/transcoded/{userId}/{ascentId}/
      if (video.transcodedPath) {
        try {
          await bucket.file(video.transcodedPath).delete();
          logger.info(`✅ Deleted transcoded video: ${video.transcodedPath}`);
        } catch (error) {
          logger.warn(`Could not delete transcoded video: ${video.transcodedPath}`, error);
        }
      }

      // Also try to delete the entire transcoded folder
      const transcodedFolderPrefix = `videos/transcoded/${userId}/${ascentId}/`;
      try {
        const [files] = await bucket.getFiles({prefix: transcodedFolderPrefix});
        const deletePromises = files.map((file) => file.delete());
        await Promise.all(deletePromises);
        logger.info(`✅ Deleted ${files.length} files from transcoded folder: ${transcodedFolderPrefix}`);
      } catch (error) {
        logger.warn(`Could not delete transcoded folder: ${transcodedFolderPrefix}`, error);
      }

      return {
        success: true,
        ascentId,
        deletedOriginal: !!video.originalPath,
        deletedTranscoded: !!video.transcodedPath,
      };
    } catch (error) {
      logger.error(`Error cleaning up video files for ascent ${ascentId}:`, error);
      // Don't throw - Firestore doc is already deleted
      return {
        success: false,
        ascentId,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);
