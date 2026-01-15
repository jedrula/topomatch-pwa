import { onObjectFinalized } from "firebase-functions/v2/storage";
import * as logger from "firebase-functions/logger";
import { handleRawVideoUpload, handleTranscodedVideo } from "./videoHandlers";
import { handleLocationImageUpload } from "./imageHandlers";

/**
 * 🎯 UNIFIED STORAGE TRIGGER
 * 
 * Single Cloud Function that routes to specialized handlers based on file path
 * 
 * Handles:
 * 1. videos/raw/{userId}/{videoId}.{ext}          → Start transcoding
 * 2. videos/transcoded/{userId}/{ascentId}/*.mp4  → Update Firestore + generate thumbnail
 * 3. location-images/{locationId}/{imageId}/*     → Detect holds
 * 
 * Benefits:
 * - Single function = less cold starts
 * - Cleaner logs (one function to monitor)
 * - Easier to debug (all storage events in one place)
 * - Better resource utilization
 */
export const onStorageFileCreated = onObjectFinalized(
  {
    region: "europe-west1",
    memory: "512MiB", // Enough for image buffers + API calls (videos use disk, not RAM)
    timeoutSeconds: 540, // TODO: 9 min for polling hold detection (legacy) - replace with webhook callback
    secrets: [], // Add secrets if needed
  },
  async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType || "";

    logger.info(`📦 Storage event: ${filePath} (${contentType})`);

    // Route 1: Raw video upload → Start transcoding
    if (filePath.startsWith("videos/raw/") && contentType.startsWith("video/")) {
      logger.info("🎬 Route: Raw video upload → transcoding");
      return handleRawVideoUpload(filePath, event);
    }

    // Route 2: Transcoded video → Update Firestore + thumbnail
    if (filePath.startsWith("videos/transcoded/") && filePath.endsWith(".mp4")) {
      logger.info("✅ Route: Transcoded video → Firestore update + thumbnail");
      return handleTranscodedVideo(filePath, event);
    }

    // Route 3: Location image → Hold detection
    if (filePath.match(/^location-images\/[^\/]+\/[^\/]+\/original\.(jpg|jpeg|png)$/i)) {
      logger.info("🖼️ Route: Location image → hold detection");
      return handleLocationImageUpload(filePath, event);
    }

    // No matching route
    logger.info("⏭️ No matching route, skipping");
    return null;
  }
);
