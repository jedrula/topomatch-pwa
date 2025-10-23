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
    // Initialize clients inside the function
    const db = getFirestore();
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

    logger.info(`Processing video for user ${userId}, videoId: ${videoId}`);

    try {
      // Create or update Firestore document
      const videoRef = db.collection("climbVideos").doc(videoId);
      const videoDoc = await videoRef.get();

      if (!videoDoc.exists) {
        // Create new document
        await videoRef.set({
          status: "processing",
          userId: userId,
          originalPath: filePath,
          uploadedAt: new Date(),
          processingStartedAt: new Date(),
        });
        logger.info(`Created Firestore document for video: ${videoId}`);
      } else {
        // Update existing document
        await videoRef.update({
          status: "processing",
          processingStartedAt: new Date(),
        });
        logger.info(`Updated Firestore document for video: ${videoId}`);
      }

      // Prepare transcoding job configuration (SD-only)
      const bucketName = event.bucket; // Get bucket name from event
      const outputPath = `videos/transcoded/${userId}/${videoId}/`;
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
                    bitrateBps: 1000000, // 1 Mbps
                    frameRate: 30,
                    heightPixels: 480,
                    widthPixels: 854,
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

      // Update Firestore with job ID
      await videoRef.update({
        transcodingJobId: job.name,
        transcodingJobState: job.state,
      });

      return { success: true, jobId: job.name };
    } catch (error) {
      logger.error(`Error creating transcoding job for ${videoId}:`, error);

      // Update Firestore with error status
      try {
        await db.collection("climbVideos").doc(videoId).update({
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          failedAt: new Date(),
        });
      } catch (firestoreError) {
        logger.error(`Failed to update Firestore with error status:`, firestoreError);
      }

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

    // Parse the file path to extract userId and videoId
    // Expected format: videos/transcoded/{userId}/{videoId}/video.mp4
    const pathParts = filePath.split("/");
    if (pathParts.length !== 5) {
      logger.error(`Invalid transcoded file path format: ${filePath}`);
      return null;
    }

    const userId = pathParts[2];
    const videoId = pathParts[3];

    logger.info(`Transcoding complete for user ${userId}, videoId: ${videoId}`);

    try {
      const videoRef = db.collection("climbVideos").doc(videoId);
      const videoDoc = await videoRef.get();

      if (!videoDoc.exists) {
        logger.error(`Firestore document not found for video: ${videoId}`);
        return null;
      }

      // Get file metadata
      const fileSize = event.data.size ? Number(event.data.size) : 0;

      // Update Firestore with transcoded video information
      await videoRef.update({
        status: "ready",
        processingCompletedAt: new Date(),
        transcodedVersions: [
          {
            quality: "sd",
            path: filePath,
            size: fileSize,
            bitrate: 1000000,
            resolution: "480p",
          },
        ],
      });

      logger.info(`Successfully updated Firestore for video: ${videoId}`);
      return { success: true, videoId: videoId };
    } catch (error) {
      logger.error(`Error updating Firestore for ${videoId}:`, error);

      // Try to update with failed status
      try {
        await db.collection("climbVideos").doc(videoId).update({
          status: "failed",
          error: error instanceof Error ? error.message : "Failed to update after transcoding",
          failedAt: new Date(),
        });
      } catch (firestoreError) {
        logger.error(`Failed to update Firestore with error status:`, firestoreError);
      }

      throw error;
    }
  }
);
