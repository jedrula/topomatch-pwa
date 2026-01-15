import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { TranscoderServiceClient } from "@google-cloud/video-transcoder";
import * as logger from "firebase-functions/logger";
import { generateVideoThumbnail } from "./thumbnailGenerator";

const PROJECT_ID = "topomatch-pwa";
const LOCATION = "europe-west1";
const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";

/**
 * Handle raw video upload - start transcoding
 * Path: videos/raw/{userId}/{videoId}.{ext}
 */
export async function handleRawVideoUpload(
  filePath: string,
  event: any
): Promise<any> {
  const contentType = event.data.contentType;

  // Validate video content type
  if (!contentType || !contentType.startsWith("video/")) {
    logger.info(`Skipping - not a video (${contentType})`);
    return null;
  }

  // Parse path: videos/raw/{userId}/{videoId}.{ext}
  const pathParts = filePath.split("/");
  if (pathParts.length !== 4) {
    logger.error(`Invalid raw video path format: ${filePath}`);
    return null;
  }

  const userId = pathParts[2];
  const fileNameWithExt = pathParts[3];
  const videoId = fileNameWithExt.split(".")[0];

  // Get ascentId from metadata (required)
  const ascentId = event.data.metadata?.ascentId;
  if (!ascentId || typeof ascentId !== "string") {
    logger.error(`Missing ascentId in metadata for ${filePath}`);
    return null;
  }

  logger.info(`🎥 Processing video: userId=${userId}, videoId=${videoId}, ascentId=${ascentId}`);

  const db = getFirestore();
  const ascentRef = db.collection("ascents").doc(ascentId);

  try {
    // Get file metadata
    const fileSize = event.data.size ? Number(event.data.size) : 0;
    const mimeType = event.data.contentType || "video/mp4";

    // Update ascent with initial video data
    await ascentRef.update({
      "video.videoId": videoId,
      "video.status": "transcoding",
      "video.originalPath": filePath,
      "video.mimeType": mimeType,
      "video.originalFileSize": fileSize,
      "video.uploadedAt": new Date(),
      updatedAt: new Date(),
    });

    const bucketName = event.bucket;
    const outputPath = `videos/transcoded/${userId}/${ascentId}/`;
    const inputUri = `gs://${bucketName}/${filePath}`;
    const outputUri = `gs://${bucketName}/${outputPath}`;

    // EMULATOR MODE: Just copy to transcoded path
    if (isEmulator) {
      logger.info("🧪 EMULATOR: Copying raw video (no transcoding)");

      const bucket = getStorage().bucket(bucketName);
      const sourceFile = bucket.file(filePath);
      const destPath = `${outputPath}video.mp4`;
      const destFile = bucket.file(destPath);

      await sourceFile.copy(destFile);
      logger.info(`✅ Copied to ${destPath} (onTranscodingComplete will trigger)`);

      return { success: true, emulator: true, destPath };
    }

    // PRODUCTION MODE: Create transcoding job
    logger.info("🎬 PRODUCTION: Creating transcoding job");

    const transcoderClient = new TranscoderServiceClient();
    const request = {
      parent: transcoderClient.locationPath(PROJECT_ID, LOCATION),
      job: {
        inputUri: inputUri,
        outputUri: outputUri,
        config: {
          elementaryStreams: [
            {
              key: "video-sd",
              videoStream: {
                h264: {
                  bitrateBps: 900000,
                  frameRate: 24,
                  heightPixels: 480,
                },
              },
            },
            {
              key: "audio",
              audioStream: {
                codec: "aac",
                bitrateBps: 128000,
              },
            },
          ],
          muxStreams: [
            {
              key: "sd-output",
              container: "mp4",
              elementaryStreams: ["video-sd", "audio"],
              fileName: "video.mp4",
            },
          ],
        },
      },
    };

    const [job] = await transcoderClient.createJob(request);
    logger.info(`✅ Transcoding job created: ${job.name}`);

    return { success: true, jobId: job.name };
  } catch (error) {
    logger.error(`❌ Error processing video:`, error);
    throw error;
  }
}

/**
 * Handle transcoded video completion - update Firestore and generate thumbnail
 * Path: videos/transcoded/{userId}/{ascentId}/video.mp4
 */
export async function handleTranscodedVideo(
  filePath: string,
  event: any
): Promise<any> {
  // Parse path: videos/transcoded/{userId}/{ascentId}/video.mp4
  const pathParts = filePath.split("/");
  if (pathParts.length !== 5) {
    logger.error(`Invalid transcoded path format: ${filePath}`);
    return null;
  }

  const userId = pathParts[2];
  const ascentId = pathParts[3];

  logger.info(`✅ Transcoding complete: userId=${userId}, ascentId=${ascentId}`);

  const db = getFirestore();
  const ascentRef = db.collection("ascents").doc(ascentId);

  try {
    // Verify ascent exists
    const ascentDoc = await ascentRef.get();
    if (!ascentDoc.exists) {
      logger.error(`Ascent not found: ${ascentId}`);
      return null;
    }

    const fileSize = event.data.size ? Number(event.data.size) : 0;
    const bucketName = event.data.bucket;

    // Generate thumbnail path
    const thumbnailPath = filePath.replace("video.mp4", "thumbnail.jpg");

    logger.info(`🖼️ Generating thumbnail: ${thumbnailPath}`);

    // Generate thumbnail (runs FFmpeg)
    let thumbnailUrl: string | null = null;
    try {
      thumbnailUrl = await generateVideoThumbnail(filePath, thumbnailPath, bucketName);
    } catch (thumbError) {
      logger.warn(`⚠️ Thumbnail generation failed (non-critical):`, thumbError);
      // Continue without thumbnail
    }

    // Update ascent with transcoded video and thumbnail
    await ascentRef.update({
      "video.status": "ready",
      "video.transcodedPath": filePath,
      "video.transcodedFileSize": fileSize,
      "video.transcodedAt": new Date(),
      ...(thumbnailUrl && { "video.thumbnailUrl": thumbnailUrl }),
      updatedAt: new Date(),
    });

    logger.info(`💾 Updated ascent ${ascentId} (thumbnail: ${thumbnailUrl ? "✅" : "❌"})`);

    return { success: true, ascentId, thumbnailUrl };
  } catch (error) {
    logger.error(`❌ Error updating ascent:`, error);

    // Update with error status
    try {
      await ascentRef.update({
        "video.status": "error",
        "video.error": error instanceof Error ? error.message : "Processing failed",
        updatedAt: new Date(),
      });
    } catch (updateError) {
      logger.error("Failed to update error status:", updateError);
    }

    throw error;
  }
}
