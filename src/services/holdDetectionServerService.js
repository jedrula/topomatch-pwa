/**
 * Hold Detection Server API Service
 * Handles communication with the Python/CUDA hold detection server
 */

class HoldDetectionServerService {
  constructor() {
    // Default API URL - can be configured
    this.apiUrl = "https://6d2401b5f155.ngrok-free.app";
    this.currentJobId = null;
  }

  /**
   * Set API URL for the server
   */
  setApiUrl(url) {
    this.apiUrl = url.replace(/\/$/, ""); // Remove trailing slash
  }

  /**
   * Test API health and component status
   */
  async testHealth() {
    try {
      const healthUrl = `${this.apiUrl}/health`;
      console.log("🔍 Service: Testing health endpoint:", healthUrl);

      const response = await fetch(healthUrl);
      console.log("🔍 Service: Response status:", response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const health = await response.json();
      console.log("🔍 Service: Health response:", health);

      return {
        success: true,
        data: health,
        message: "API is healthy",
      };
    } catch (error) {
      console.log("❌ Service: Health check error:", error);
      return {
        success: false,
        error: error.message,
        message: `API health check failed: ${error.message}`,
      };
    }
  }

  /**
   * Fetch image from Firebase Storage using direct fetch
   */
  async fetchImageAsBlob(imageUrl) {
    console.log("🔍 Using direct fetch for all Firebase Storage URLs");
    return await this.fetchImageAsBlobDirect(imageUrl);
  }

  /**
   * Direct fetch method for Firebase Storage URLs with tokens
   */
  async fetchImageAsBlobDirect(imageUrl) {
    try {
      console.log("🔍 Fetching image via direct fetch:", imageUrl);

      // Firebase Storage URLs with tokens should work with cors mode
      const fetchOptions = {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
        credentials: "omit", // Don't send cookies, token is in URL
      };

      console.log("🔍 Using cors mode with token authentication");

      const response = await fetch(imageUrl, fetchOptions);

      console.log("🔍 Direct fetch response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        type: response.type,
      });

      if (!response.ok) {
        if (response.status === 0) {
          throw new Error(
            `CORS Error: Cannot fetch image from Firebase Storage.`
          );
        }
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const sizeMB = blob.size / 1024 / 1024;

      console.log("✅ Image fetched successfully via direct fetch:", {
        sizeMB: sizeMB.toFixed(2),
        type: blob.type,
        size: blob.size,
      });

      return {
        success: true,
        blob,
        sizeMB,
        message: `Image fetched successfully via direct fetch (${sizeMB.toFixed(2)} MB)`,
      };
    } catch (error) {
      console.error("❌ Direct fetch failed:", error);

      return {
        success: false,
        error: error.message,
        message: `Failed to fetch image: ${error.message}`,
      };
    }
  }

  /**
   * Compress image using browser-image-compression (if available)
   */
  async compressImage(blob, options = {}) {
    // Check if compression library is available
    if (typeof imageCompression === "undefined") {
      console.warn("Image compression library not available, using original image");
      return {
        success: true,
        blob,
        compressionRatio: 1.0,
        message: "Compression not available, using original image",
      };
    }

    if (!options.enabled) {
      return {
        success: true,
        blob,
        compressionRatio: 1.0,
        message: "Compression disabled",
      };
    }

    const originalSize = blob.size;

    const compressionOptions = {
      maxSizeMB: options.maxSizeMB || 1,
      maxWidthOrHeight: options.maxWidthOrHeight || 1920,
      useWebWorker: options.useWebWorker !== false,
      fileType: "image/jpeg",
      initialQuality: 0.8,
    };

    try {
      const startTime = performance.now();

      // Convert blob to File for compression
      const file = new File([blob], "climbing_wall.jpg", { type: blob.type });
      const compressedFile = await imageCompression(file, compressionOptions);

      const compressionTime = (performance.now() - startTime) / 1000;
      const compressionRatio = originalSize / compressedFile.size;

      return {
        success: true,
        blob: compressedFile,
        compressionRatio,
        compressionTime,
        originalSize,
        compressedSize: compressedFile.size,
        message: `Compression completed in ${compressionTime.toFixed(
          2
        )}s (${compressionRatio.toFixed(2)}x reduction)`,
      };
    } catch (error) {
      console.warn("Compression failed, using original image:", error);
      return {
        success: true,
        blob,
        compressionRatio: 1.0,
        message: `Compression failed: ${error.message}, using original image`,
      };
    }
  }

  /**
   * Upload image to server for processing
   */
  async uploadImage(blob, filename = "climbing_wall.jpg") {
    try {
      const formData = new FormData();
      formData.append("file", blob, filename);

      const response = await fetch(`${this.apiUrl}/api/v1/process`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      this.currentJobId = result.job_id;

      return {
        success: true,
        jobId: result.job_id,
        message: `Upload successful, job ID: ${result.job_id}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Upload failed: ${error.message}`,
      };
    }
  }

  /**
   * Poll for job status and results
   */
  async getJobStatus(jobId) {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/status/${jobId}`);

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const status = await response.json();

      return {
        success: true,
        status: status.status,
        progress: status.progress,
        detailedProgress: status.detailed_progress,
        result: status.result,
        message: `Status: ${status.status}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Status check failed: ${error.message}`,
      };
    }
  }

  /**
   * Process complete workflow: fetch → compress → upload → poll
   */
  async processImage(imageUrl, options = {}) {
    const workflow = {
      steps: [],
      currentStep: 0,
      totalSteps: 4,
    };

    try {
      // Step 1: Fetch image
      workflow.steps.push("Fetching image from Firebase Storage...");
      workflow.currentStep = 1;

      const fetchResult = await this.fetchImageAsBlob(imageUrl);
      if (!fetchResult.success) {
        throw new Error(fetchResult.error);
      }

      // Step 2: Compress image (optional)
      workflow.steps.push("Compressing image...");
      workflow.currentStep = 2;

      const compressionResult = await this.compressImage(
        fetchResult.blob,
        options.compression || {}
      );
      if (!compressionResult.success) {
        throw new Error(compressionResult.error);
      }

      // Step 3: Upload to server
      workflow.steps.push("Uploading to server...");
      workflow.currentStep = 3;

      const uploadResult = await this.uploadImage(compressionResult.blob);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Step 4: Return job ID for polling
      workflow.steps.push("Processing started...");
      workflow.currentStep = 4;

      return {
        success: true,
        jobId: uploadResult.jobId,
        workflow,
        fetchInfo: {
          originalSize: fetchResult.sizeMB,
          compressionRatio: compressionResult.compressionRatio,
        },
        message: "Processing started successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        workflow,
        message: `Processing failed: ${error.message}`,
      };
    }
  }

  /**
   * Poll for results with automatic retry
   */
  async pollForResults(jobId, options = {}) {
    const maxAttempts = options.maxAttempts || 60; // 2 minutes max
    const intervalMs = options.intervalMs || 2000; // 2 seconds
    let attempts = 0;

    const poll = async () => {
      attempts++;

      if (attempts > maxAttempts) {
        throw new Error("Polling timeout: Maximum attempts exceeded");
      }

      const statusResult = await this.getJobStatus(jobId);

      if (!statusResult.success) {
        throw new Error(statusResult.error);
      }

      const { status, result } = statusResult;

      if (status === "completed") {
        return {
          success: true,
          result,
          message: "Processing completed successfully",
        };
      }

      if (status === "failed") {
        const errorMsg = result?.error_message || "Unknown error";
        throw new Error(`Processing failed: ${errorMsg}`);
      }

      // Still processing, wait and retry
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      return poll();
    };

    try {
      return await poll();
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Polling failed: ${error.message}`,
      };
    }
  }
}

// Export singleton instance
export const holdDetectionServerService = new HoldDetectionServerService();
export default holdDetectionServerService;
