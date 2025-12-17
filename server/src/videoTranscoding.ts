import { onObjectFinalized } from "firebase-functions/v2/storage";
import { getFirestore } from "firebase-admin/firestore";
import { TranscoderServiceClient } from "@google-cloud/video-transcoder";
import * as logger from "firebase-functions/logger";

// Configuration
const PROJECT_ID = "topomatch-pwa";
const LOCATION = "europe-west1"; // Matches Firebase region eur3

/**
 * Triggered when a video is uploaded to videos/raw/{userId}/{videoId}.{ext}
 * Creates a transcoding job to convert to SD quality (480p)
 */
export const transcodeVideo = onObjectFinalized(
  {
    region: "europe-west1",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (event) => {
    // Initialize transcoder client inside the function
    const transcoderClient = new TranscoderServiceClient();
    
    const filePath = event.data.name;
    const contentType = event.data.contentType;

    logger.info(`Storage trigger fired for file: ${filePath}`);

    // Only process videos in the raw upload path
    if (!filePath.startsWith("videos/raw/")) {
      logger.info(`Skipping file - not in videos/raw/ path: ${filePath}`);
      return null;
    }

    // Validate video content type
    if (!contentType || !contentType.startsWith("video/")) {
      logger.info(`Skipping file - not a video (${contentType}): ${filePath}`);
      return null;
    }

    // Parse the file path to extract userId and videoId
    // Expected format: videos/raw/{userId}/{videoId}.{ext}
    const pathParts = filePath.split("/");
    if (pathParts.length !== 4) {
      logger.error(`Invalid file path format: ${filePath}`);
      return null;
    }

    const userId = pathParts[2];
    const fileNameWithExt = pathParts[3];
    const videoId = fileNameWithExt.split(".")[0];
    
    // Get ascentId from custom metadata (required)
    const ascentId = event.data.metadata?.ascentId;
    if (!ascentId || typeof ascentId !== 'string') {
      logger.error(`Missing or invalid ascentId in file metadata for ${filePath}`);
      return null;
    }

    logger.info(`Processing video for user ${userId}, videoId: ${videoId}, ascentId: ${ascentId}`);

    try {
      // Initialize Firestore and create initial video object
      const db = getFirestore();
      const ascentRef = db.collection("ascents").doc(ascentId);
      
      // Get file metadata
      const fileSize = event.data.size ? Number(event.data.size) : 0;
      const mimeType = event.data.contentType || "video/mp4";
      
      // Create initial video object in ascent (client created ascent without video)
      try {
        await ascentRef.update({
          "video.videoId": videoId,
          "video.status": "transcoding",
          "video.originalPath": filePath,
          "video.mimeType": mimeType,
          "video.originalFileSize": fileSize,
          "video.uploadedAt": new Date(),
          updatedAt: new Date(),
        });
        logger.info(`Created video object in ascent ${ascentId} (status: transcoding)`);
      } catch (updateError) {
        logger.error(`Could not create video object for ${ascentId}:`, updateError);
        // Don't proceed with transcoding if we can't update Firestore
        return null;
      }
      
      // Prepare transcoding job configuration (SD-only)
      const bucketName = event.bucket; // Get bucket name from event
      // Use ascentId from metadata (stable, set by client)
      const outputPath = `videos/transcoded/${userId}/${ascentId}/`;
      const inputUri = `gs://${bucketName}/${filePath}`;
      const outputUri = `gs://${bucketName}/${outputPath}`;

      logger.info(`Input URI: ${inputUri}`);
      logger.info(`Output URI: ${outputUri}`);

      // Create transcoding job with SD-only configuration
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
                    frameRate: 24, // Cinema standard (-20% from 30 FPS)
                    heightPixels: 480,
                    // Don't set widthPixels - let transcoder maintain aspect ratio
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

      logger.info("Creating transcoding job...");
      const [job] = await transcoderClient.createJob(request);
      logger.info(`Transcoding job created: ${job.name}`);

      return { success: true, jobId: job.name };
    } catch (error) {
      logger.error(`Error creating transcoding job for ${videoId}:`, error);
      throw error;
    }
  }
);

/**
 * Triggered when a transcoded video is written to storage
 * Updates Firestore with the transcoded video metadata
 */
export const onTranscodingComplete = onObjectFinalized(
  {
    region: "europe-west1",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (event) => {
    // Initialize Firestore inside the function
    const db = getFirestore();
    
    const filePath = event.data.name;

    logger.info(`Storage trigger fired for file: ${filePath}`);

    // Only process transcoded videos
    if (!filePath.startsWith("videos/transcoded/")) {
      logger.info(`Skipping file - not in videos/transcoded/ path: ${filePath}`);
      return null;
    }

    // Skip manifest files or other non-video files
    if (!filePath.endsWith(".mp4")) {
      logger.info(`Skipping non-MP4 file: ${filePath}`);
      return null;
    }

    // Parse the file path to extract userId and ascentId
    // Expected format: videos/transcoded/{userId}/{ascentId}/video.mp4
    const pathParts = filePath.split("/");
    if (pathParts.length !== 5) {
      logger.error(`Invalid transcoded file path format: ${filePath}`);
      return null;
    }

    const userId = pathParts[2];
    const ascentId = pathParts[3];

    logger.info(`Transcoding complete for user ${userId}, ascentId: ${ascentId}`);

    // Declare early for error handling
    try {
      const ascentRef = db.collection("ascents").doc(ascentId);
      const ascentDoc = await ascentRef.get();

      if (!ascentDoc.exists) {
        logger.error(`Ascent document not found: ${ascentId}`);
        return null;
      }

      // Get file metadata
      const fileSize = event.data.size ? Number(event.data.size) : 0;

      // Update the embedded video object in the ascent document
      await ascentRef.update({
        "video.status": "ready",
        "video.transcodedPath": filePath,
        "video.transcodedFileSize": fileSize,
        "video.transcodedAt": new Date(),
        updatedAt: new Date(),
      });

      logger.info(`Successfully updated ascent ${ascentId} with transcoded video info`);
      return { success: true, ascentId: ascentId };
    } catch (error) {
      logger.error(`Error updating ascent ${ascentId}:`, error);

      // Try to update with failed status only if we have an ascentId
      if (ascentId) {
        try {
          await db.collection("ascents").doc(ascentId).update({
            "video.status": "error",
            "video.error": error instanceof Error ? error.message : "Failed to update after transcoding",
            updatedAt: new Date(),
          });
        } catch (firestoreError) {
          logger.error(`Failed to update ascent with error status:`, firestoreError);
        }
      }

      throw error;
    }
  }
);
