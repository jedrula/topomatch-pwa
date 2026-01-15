import { getStorage } from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";
import * as os from "os";
import * as path from "path";
import * as fs from "fs/promises";
import { spawn } from "child_process";

// ffmpeg-static is a CommonJS module - use require for proper import
const ffmpegPath: string = require("ffmpeg-static");

/**
 * Generate video thumbnail using FFmpeg
 * 
 * @param videoPath - Storage path to video file
 * @param outputPath - Storage path where thumbnail should be saved
 * @param bucketName - Storage bucket name
 * @returns Public URL of generated thumbnail
 */
export async function generateVideoThumbnail(
  videoPath: string,
  outputPath: string,
  bucketName: string
): Promise<string> {
  const bucket = getStorage().bucket(bucketName);
  
  // Create temp directories
  const tempDir = os.tmpdir();
  const tempVideoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
  const tempThumbPath = path.join(tempDir, `thumb_${Date.now()}.jpg`);

  try {
    logger.info(`📥 Downloading video: ${videoPath}`);
    
    // Download video to temp location
    await bucket.file(videoPath).download({ destination: tempVideoPath });
    
    logger.info(`🎬 Generating thumbnail with FFmpeg`);
    
    // Generate thumbnail at 2 seconds, 640x360
    await runFFmpeg([
      "-ss", "00:00:02",           // Seek to 2 seconds (avoid black frames at start)
      "-i", tempVideoPath,          // Input file
      "-frames:v", "1",             // Extract 1 frame
      "-vf", "scale=640:-1",        // Scale width to 640, maintain aspect ratio
      "-q:v", "2",                  // High quality (1-31, lower is better)
      tempThumbPath                 // Output file
    ]);

    logger.info(`📤 Uploading thumbnail: ${outputPath}`);
    
    // Upload thumbnail as public file (single operation, no extra API call)
    const [file] = await bucket.upload(tempThumbPath, {
      destination: outputPath,
      metadata: {
        contentType: "image/jpeg",
        cacheControl: "public, max-age=31536000", // Cache for 1 year
      },
      public: true, // Make public during upload (more efficient than separate makePublic call)
    });
    
    // Get public URL from upload metadata
    const publicUrl = file.publicUrl();
    
    logger.info(`✅ Thumbnail generated: ${publicUrl}`);
    return publicUrl;
  } finally {
    // Cleanup temp files
    try {
      await fs.unlink(tempVideoPath).catch(() => {});
      await fs.unlink(tempThumbPath).catch(() => {});
    } catch (error) {
      logger.warn("Failed to cleanup temp files:", error);
    }
  }
}

/**
 * Run FFmpeg command as child process
 */
function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    // Use ffmpeg-static binary path (bundles ffmpeg for Cloud Functions)
    if (!ffmpegPath) {
      reject(new Error("FFmpeg binary not found - install ffmpeg-static package"));
      return;
    }
    
    const ffmpeg = spawn(ffmpegPath, args);
    
    let stderr = "";
    
    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      }
    });
    
    ffmpeg.on("error", (error) => {
      reject(new Error(`FFmpeg error: ${error.message}`));
    });
  });
}
