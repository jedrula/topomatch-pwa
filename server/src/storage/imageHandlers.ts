import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";
import fetch from "node-fetch";
import { getHoldDetectionServerUrl } from "../services/appConfig";

// Detection server types
interface RawDetectionHold {
  svgMarkup?: string;
  svg_path?: string;
  bbox?: [number, number, number, number];
  center_x?: number;
  center_y?: number;
  confidence: number;
  type?: string;
  color_analysis?: any;
}

interface DetectionResponse {
  holds: RawDetectionHold[];
  image_info?: { width: number; height: number };
  viewBox?: string;
  metadata?: {
    viewBox?: string;
    imageDimensions?: { width: number; height: number };
    modelVersion?: string;
  };
}

interface FirestoreHold {
  id: string;
  holdId: string;
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
 * Handle location image upload - detect holds
 * Path: location-images/{locationId}/{imageId}/original.{ext}
 */
export async function handleLocationImageUpload(
  filePath: string,
  event: any
): Promise<any> {
  const contentType = event.data.contentType;

  // Validate image content type
  if (!contentType || !contentType.startsWith("image/")) {
    logger.info(`Skipping - not an image (${contentType})`);
    return null;
  }

  // Parse path: location-images/{locationId}/{imageId}/original.{ext}
  const pathRegex = /^location-images\/([^\/]+)\/([^\/]+)\/original\.(jpg|jpeg|png)$/i;
  const match = filePath.match(pathRegex);

  if (!match) {
    logger.error(`Invalid location image path format: ${filePath}`);
    return null;
  }

  const locationId = match[1];
  const imageId = match[2];

  logger.info(`🖼️ Processing hold detection: locationId=${locationId}, imageId=${imageId}`);

  const detectionServerUrl = await getHoldDetectionServerUrl();
  logger.info(`📡 Detection server: ${detectionServerUrl}`);

  const db = getFirestore();
  const holdDetectionRef = db
    .collection("locations")
    .doc(locationId)
    .collection("holdDetections")
    .doc(imageId);

  try {
    // Update status to 'processing'
    await holdDetectionRef.set(
      {
        status: "processing",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Download image from Storage
    const storage = getStorage();
    const bucket = storage.bucket(event.data.bucket);
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File not found: ${filePath}`);
    }

    logger.info(`📥 Downloading image from Storage`);
    const [fileBuffer] = await file.download();

    // Upload to detection server
    logger.info(`📤 Uploading to detection server`);
    const FormData = require("form-data");
    const formData = new FormData();
    formData.append("file", fileBuffer, {
      filename: "climbing_wall.jpg",
      contentType: contentType || "image/jpeg",
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

    let uploadResponse;
    try {
      uploadResponse = await fetch(`${detectionServerUrl}/api/v1/process`, {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true",
          ...formData.getHeaders(),
        },
        body: formData as any,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Upload timeout (2 minutes)");
      }
      throw error;
    }

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status}: ${errorText}`);
    }

    const uploadResult = (await uploadResponse.json()) as any;
    const jobId = uploadResult.job_id;

    if (!jobId) {
      throw new Error("No job_id returned from detection server");
    }

    logger.info(`⏳ Polling for results: job_id=${jobId}`);

    // Poll for results (max 3 minutes)
    let attempts = 0;
    const maxAttempts = 18; // 3 minutes at 10s intervals
    let detectionResult: DetectionResponse | null = null;

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(
        `${detectionServerUrl}/api/v1/status/${jobId}`,
        {
          headers: { "ngrok-skip-browser-warning": "true" },
        }
      );

      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      const statusData = (await statusResponse.json()) as any;
      logger.info(`📊 Status: ${statusData.status}, progress: ${statusData.progress || "N/A"}`);

      if (statusData.status === "completed") {
        detectionResult = statusData.result;
        break;
      }

      if (statusData.status === "failed") {
        throw new Error(`Detection failed: ${statusData.result?.error_message || "Unknown"}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 10000)); // 10s
      attempts++;
    }

    if (!detectionResult) {
      throw new Error("Polling timeout: max attempts exceeded");
    }

    logger.info(`✅ Detection completed: ${detectionResult.holds?.length || 0} holds`);

    // Map holds with generated IDs
    const holdsWithIds: FirestoreHold[] = (detectionResult.holds || []).map((hold, index) => {
      let x = 0,
        y = 0,
        width = 0,
        height = 0;

      if (Array.isArray(hold.bbox)) {
        [x, y, width, height] = hold.bbox;
      } else if (hold.bbox && typeof hold.bbox === "object") {
        const bboxObj = hold.bbox as any;
        x = bboxObj.x || 0;
        y = bboxObj.y || 0;
        width = bboxObj.width || 0;
        height = bboxObj.height || 0;
      }

      const holdId = `ai_hold_${index}`;
      return {
        id: holdId,
        holdId: holdId,
        svgMarkup: (detectionResult as any).svg_markups?.[index] || hold.svgMarkup || "",
        bbox: [x, y, width, height] as [number, number, number, number],
        x,
        y,
        centerX: hold.center_x !== undefined ? hold.center_x : x + width / 2,
        centerY: hold.center_y !== undefined ? hold.center_y : y + height / 2,
        width,
        height,
        confidence: hold.confidence !== undefined ? hold.confidence : 0,
        holdType: hold.type || "hold",
      };
    });

    // Extract metadata
    const imageInfo = (detectionResult as any).image_info;
    const imageDimensions = imageInfo || { width: 1920, height: 1080 };
    const viewBox = imageInfo ? `0 0 ${imageInfo.width} ${imageInfo.height}` : "0 0 1920 1080";

    // Save to Firestore
    await holdDetectionRef.set({
      status: "completed",
      imageId,
      detectionResults: {
        aiHolds: holdsWithIds,
        manualHolds: [],
        metadata: {
          viewBox,
          detectedAt: FieldValue.serverTimestamp(),
          imagePath: filePath,
          imageDimensions,
          modelVersion: detectionResult.metadata?.modelVersion || "unknown",
          detectionSource: "ai-model",
        },
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`💾 Saved ${holdsWithIds.length} holds to Firestore`);

    return {
      success: true,
      locationId,
      imageId,
      holdsDetected: holdsWithIds.length,
    };
  } catch (error) {
    logger.error(`❌ Error detecting holds:`, error);

    // Update with error status
    await holdDetectionRef.set(
      {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      success: false,
      locationId,
      imageId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
