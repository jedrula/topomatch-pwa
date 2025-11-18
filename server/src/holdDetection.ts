import { onObjectFinalized } from "firebase-functions/v2/storage";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { defineString } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import fetch from "node-fetch";

// Configuration - detection server URL from environment
// No default - forces explicit configuration in .env.local or .env.production
// This ensures the app fails fast if not properly configured
const DETECTION_SERVER_URL = defineString("HOLD_DETECTION_SERVER_URL", {
  description: "URL of the hold detection server",
});

// Detection server response types (server does NOT return IDs currently)
interface RawDetectionHold {
  // Note: Detection server returns holds WITHOUT IDs
  // We generate them in this Cloud Function
  svgMarkup?: string;
  svg_path?: string; // Alternative field name
  bbox?: [number, number, number, number];
  center_x?: number;
  center_y?: number;
  confidence: number;
  type?: string;
  color_analysis?: any;
}

interface DetectionResponse {
  holds: RawDetectionHold[];
  image_info?: {
    width: number;
    height: number;
  };
  // Metadata might be in different locations depending on server version
  viewBox?: string;
  metadata?: {
    viewBox?: string;
    imageDimensions?: {
      width: number;
      height: number;
    };
    modelVersion?: string;
  };
}

// Firestore hold format (with generated IDs)
interface FirestoreHold {
  id: string; // For hover tracking and UI interactions
  holdId: string; // For boulder problem membership checks
  svgMarkup: string;
  bbox: [number, number, number, number];
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  confidence: number;
  holdType?: string;
}

/**
 * Automatically detect holds when a location image is uploaded
 * 
 * Triggered when an image is uploaded to: location-images/{locationId}/{imageId}/original.*
 * 
 * Flow:
 * 1. Extract locationId and imageId from file path
 * 2. Get image download URL
 * 3. Call detection server API
 * 4. Store results in Firestore at /locations/{locationId}/holdDetections/{imageId}
 */
export const onLocationImageUploaded = onObjectFinalized(
  {
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 540, // 9 minutes (detection can be slow)
    secrets: [], // Add HOLD_DETECTION_SERVER_URL to secrets if needed
  },
  async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;

    logger.info(`🖼️ Storage trigger fired for file: ${filePath}, 📥 Detection server URL: ${DETECTION_SERVER_URL.value()}`);

    // Only process original images in location-images path
    // Path format: location-images/{locationId}/{imageId}/original.{ext}
    const pathRegex = /^location-images\/([^\/]+)\/([^\/]+)\/original\./;
    const match = filePath.match(pathRegex);

    if (!match) {
      logger.info(`Skipping file - not an original location image: ${filePath}`);
      return null;
    }

    // Validate image content type
    if (!contentType || !contentType.startsWith("image/")) {
      logger.info(`Skipping file - not an image (${contentType}): ${filePath}`);
      return null;
    }

    const locationId = match[1];
    const imageId = match[2];

    logger.info(`📍 Processing hold detection for location: ${locationId}, image: ${imageId}`);

    const db = getFirestore();
    const holdDetectionRef = db
      .collection("locations")
      .doc(locationId)
      .collection("holdDetections")
      .doc(imageId);

    try {
      // 1. Update status to 'processing'
      await holdDetectionRef.set(
        {
          status: "processing",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // 2. Get image from Storage using Admin SDK
      const storage = getStorage();
      const bucket = storage.bucket(event.data.bucket);
      const file = bucket.file(filePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error(`File not found in Storage: ${filePath}`);
      }
      
      // Download the image as buffer
      logger.info(`📥 Downloading image from Storage: ${filePath}`);
      const [fileBuffer] = await file.download();
      
      logger.info(`📤 Uploading to detection server: ${DETECTION_SERVER_URL.value()}/api/v1/process`);

      // 3. Upload image to detection server using Buffer directly
      // Note: Using Buffer instead of Blob because form-data package (used by fetch in Node.js)
      // expects objects with Stream interface (.on() method), which Blob doesn't have
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: 'climbing_wall.jpg',
        contentType: contentType || 'image/jpeg'
      });
      
      // Create AbortController for 2-minute timeout (model initialization can take time)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes
      
      let uploadResponse;
      try {
        uploadResponse = await fetch(`${DETECTION_SERVER_URL.value()}/api/v1/process`, {
          method: "POST",
          headers: {
            "ngrok-skip-browser-warning": "true", // For ngrok URLs
            ...formData.getHeaders() // Adds Content-Type with multipart boundary
          },
          body: formData as any,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Upload to detection server timed out after 2 minutes');
        }
        throw error;
      }

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status}: ${errorText}`);
      }

      const uploadResult = await uploadResponse.json() as any;
      const jobId = uploadResult.job_id;
      
      if (!jobId) {
        throw new Error('No job_id returned from detection server');
      }
      
      logger.info(`⏳ Polling for results, job_id: ${jobId}`);

      // 4. Poll for results
      let attempts = 0;
      const maxMinutes = 3;
      const pollingIntervalMs = 10000; // 10 seconds
      const maxAttempts = Math.floor(maxMinutes * 60 * 1000 / pollingIntervalMs);
      let detectionResult: DetectionResponse | null = null;
      
      while (attempts < maxAttempts) {
        const statusResponse = await fetch(`${DETECTION_SERVER_URL.value()}/api/v1/status/${jobId}`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        });

        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json() as any;
        logger.info(`📊 Job status: ${statusData.status}, progress: ${statusData.progress || 'N/A'}`);

        if (statusData.status === 'completed') {
          detectionResult = statusData.result;
          break;
        }

        if (statusData.status === 'failed') {
          throw new Error(`Detection failed: ${statusData.result?.error_message || 'Unknown error'}`);
        }

        // Wait  before next poll
        await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
        attempts++;
      }

      if (!detectionResult) {
        throw new Error('Polling timeout: Maximum attempts exceeded');
      }

      logger.info(`✅ Detection completed: ${detectionResult.holds?.length || 0} holds found`);
      
      
      // IMPORTANT: Detection server structure:
      // - holds[]: Array of hold objects with bbox, confidence, etc.
      // - svg_markups[]: Separate array with actual SVG path markup (parallel to holds)
      // We need to map them together by index!
      
      const holdsWithIds: FirestoreHold[] = (detectionResult.holds || []).map((hold, index) => {
        // Log each hold BEFORE mapping
        // Handle different bbox formats: array [x,y,w,h] or object {x,y,width,height}
        let x = 0, y = 0, width = 0, height = 0;
        
        if (Array.isArray(hold.bbox)) {
          [x, y, width, height] = hold.bbox;
        } else if (hold.bbox && typeof hold.bbox === 'object') {
          const bboxObj = hold.bbox as any; // Type assertion for flexibility
          x = bboxObj.x || 0;
          y = bboxObj.y || 0;
          width = bboxObj.width || 0;
          height = bboxObj.height || 0;
        } else {
          logger.warn(`  ⚠️ No valid bbox found for hold ${index}`);
        }
        
        const holdId = `ai_hold_${index}`;
        const mappedHold = {
          id: holdId, // For hover tracking and UI interactions
          holdId: holdId, // For boulder problem membership checks
          svgMarkup: (detectionResult as any).svg_markups?.[index] || hold.svgMarkup || "", // Get SVG from parallel array
          bbox: [x, y, width, height] as [number, number, number, number],
          x: x,
          y: y,
          centerX: hold.center_x !== undefined ? hold.center_x : x + width / 2,
          centerY: hold.center_y !== undefined ? hold.center_y : y + height / 2,
          width: width,
          height: height,
          confidence: hold.confidence !== undefined ? hold.confidence : 0,
          holdType: hold.type || "hold",
        };
        
        return mappedHold;
      });
      
      // Extract viewBox and dimensions from server response
      // The detection server returns coordinates in the ORIGINAL image space
      // So viewBox MUST match image_info dimensions for coordinates to align
      const imageInfo = (detectionResult as any).image_info;
      const imageDimensions = imageInfo || { width: 1920, height: 1080 }; // Fallback
      
      // ViewBox MUST match the coordinate space the holds are in (image_info dimensions)
      const viewBox = imageInfo 
        ? `0 0 ${imageInfo.width} ${imageInfo.height}`
        : "0 0 1920 1080";
      
      // 4. Store results in Firestore (with generated IDs)
      await holdDetectionRef.set({
        status: "completed",
        imageId,
        detectionResults: {
          aiHolds: holdsWithIds, // Holds now have IDs
          manualHolds: [], // Empty initially
          metadata: {
            viewBox: viewBox,
            detectedAt: FieldValue.serverTimestamp(),
            imagePath: filePath, // Store the Storage path instead of URL
            imageDimensions: imageDimensions,
            modelVersion: detectionResult.metadata?.modelVersion || "unknown",
            detectionSource: "ai-model",
          },
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(`💾 Saved ${holdsWithIds.length} holds to Firestore for location id ${locationId}`);

      return {
        success: true,
        locationId,
        imageId,
        holdsDetected: holdsWithIds.length,
      };
    } catch (error) {
      logger.error(`❌ Error detecting holds for image ${imageId}:`, error);

      // Update status to 'failed' with error message
      await holdDetectionRef.set(
        {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Don't throw - we've recorded the failure in Firestore
      return {
        success: false,
        locationId,
        imageId,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);
