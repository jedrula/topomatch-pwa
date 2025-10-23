import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getStorage } from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";

/**
 * Cloud Function that triggers when a climbVideos document is deleted.
 * Automatically cleans up associated video files from Storage:
 * - Original video in videos/raw/{userId}/{videoId}.*
 * - Transcoded video in videos/transcoded/{userId}/{videoId}/video.mp4
 */
export const onVideoDeleted = onDocumentDeleted(
  "climbVideos/{videoId}",
  async (event) => {
    const videoId = event.params.videoId;
    const videoData = event.data?.data();

    logger.info(`🗑️ onVideoDeleted triggered for video ${videoId}`);

    if (!videoData) {
      logger.warn(`⚠️ No data found for deleted video ${videoId}`);
      return;
    }

    // Get bucket inside the function (after Firebase is initialized)
    const bucket = getStorage().bucket();
    
    logger.info(`🪣 Bucket info:`, {
      bucketName: bucket.name,
    });

    logger.info(`📋 Video data:`, {
      videoId,
      userId: videoData.userId,
      originalPath: videoData.originalPath,
      transcodedPath: videoData.transcodedPath,
      status: videoData.status,
      hasTranscodedVersions: !!videoData.transcodedVersions,
    });

    logger.info(`🧹 Starting cleanup for video ${videoId}`);

    const deletionPromises: Promise<void>[] = [];

    // Delete original video from videos/raw/{userId}/{videoId}.*
    if (videoData.originalPath) {
      logger.info(`📁 Attempting to delete original video: ${videoData.originalPath}`);
      
      const deleteOriginal = async () => {
        try {
          const fileRef = bucket.file(videoData.originalPath);
          logger.info(`🔍 File reference:`, {
            path: fileRef.name,
            bucket: fileRef.bucket.name,
          });
          
          await fileRef.delete();
          logger.info(`✅ Successfully deleted original video: ${videoData.originalPath}`);
        } catch (error: any) {
          // Ignore "not found" errors - file may already be deleted
          if (error.code === 404 || error.code === "storage/object-not-found") {
            logger.warn(`⚠️ Original video not found (404): ${videoData.originalPath}`, {
              errorCode: error.code,
              errorMessage: error.message,
            });
          } else {
            logger.error(`❌ Error deleting original video: ${videoData.originalPath}`, {
              errorCode: error.code,
              errorMessage: error.message,
              error,
            });
          }
        }
      };

      deletionPromises.push(deleteOriginal());
    } else {
      logger.warn(`⚠️ No originalPath found in video data for ${videoId}`);
    }

    // Delete transcoded video from videos/transcoded/{userId}/{videoId}/video.mp4
    if (videoData.transcodedPath) {
      logger.info(`📁 Attempting to delete transcoded video: ${videoData.transcodedPath}`);
      
      const deleteTranscoded = async () => {
        try {
          await bucket.file(videoData.transcodedPath).delete();
          logger.info(`✅ Successfully deleted transcoded video: ${videoData.transcodedPath}`);
        } catch (error: any) {
          // Ignore "not found" errors
          if (error.code === 404 || error.code === "storage/object-not-found") {
            logger.info(`ℹ️ Transcoded video already deleted: ${videoData.transcodedPath}`);
          } else {
            logger.error(`❌ Error deleting transcoded video: ${videoData.transcodedPath}`, {
              errorCode: error.code,
              errorMessage: error.message,
              error,
            });
          }
        }
      };

      deletionPromises.push(deleteTranscoded());
    } else {
      logger.info(`ℹ️ No transcodedPath found (video may not have been transcoded yet)`);
    }

    // If there are any additional transcoded versions (different qualities)
    if (videoData.transcodedVersions && Array.isArray(videoData.transcodedVersions)) {
      logger.info(`📁 Found ${videoData.transcodedVersions.length} additional transcoded versions`);
      
      for (const version of videoData.transcodedVersions) {
        if (version.path) {
          logger.info(`📁 Attempting to delete transcoded version: ${version.path}`);
          
          const deleteVersion = async () => {
            try {
              await bucket.file(version.path).delete();
              logger.info(`✅ Successfully deleted transcoded version: ${version.path}`);
            } catch (error: any) {
              if (error.code === 404 || error.code === "storage/object-not-found") {
                logger.info(`ℹ️ Transcoded version already deleted: ${version.path}`);
              } else {
                logger.error(`❌ Error deleting transcoded version: ${version.path}`, {
                  errorCode: error.code,
                  errorMessage: error.message,
                  error,
                });
              }
            }
          };

          deletionPromises.push(deleteVersion());
        }
      }
    } else {
      logger.info(`ℹ️ No additional transcoded versions found`);
    }

    logger.info(`⏳ Waiting for ${deletionPromises.length} deletion operations to complete...`);

    // Wait for all deletions to complete
    const results = await Promise.allSettled(deletionPromises);

    // Log summary
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    
    logger.info(`🎯 Cleanup summary for video ${videoId}:`, {
      totalOperations: deletionPromises.length,
      successful,
      failed,
    });

    logger.info(`✅ Cleanup completed for video ${videoId}`);
  }
);
