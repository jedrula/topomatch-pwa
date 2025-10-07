// Pose Detection Service
// Wraps the YOLOv8 pose detection worker for easy integration

class PoseDetectionService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = new Promise((resolve, reject) => {
      try {
        // Create worker using the same approach as the working usePoseDetection composable
        this.worker = new Worker(new URL('/poseDetectionWorker.combined.js', import.meta.url));
        
        // Set up message handling
        const handleMessage = (event) => {
          const { type, data } = event.data;
          
          if (type === 'sessionCreated') {
            this.isInitialized = true;
            this.worker.removeEventListener('message', handleMessage);
            resolve();
          } else if (type === 'error') {
            this.worker.removeEventListener('message', handleMessage);
            reject(new Error(data.message));
          }
        };

        this.worker.addEventListener('message', handleMessage);
        
        // Start initialization
        this.worker.postMessage({ type: 'createSession' });
        
      } catch (error) {
        reject(error);
      }
    });

    return this.initializationPromise;
  }

  async detectPoses(imageData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      // Convert ImageData to buffer
      const canvas = new OffscreenCanvas(imageData.width, imageData.height);
      const ctx = canvas.getContext('2d');
      ctx.putImageData(imageData, 0, 0);
      
      canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 }).then(blob => {
        return blob.arrayBuffer();
      }).then(buffer => {
        const handleMessage = (event) => {
          const { type, data } = event.data;
          
          if (type === 'poseDetectionComplete') {
            this.worker.removeEventListener('message', handleMessage);
            resolve(this.formatPoseResults(data.results.poses));
          } else if (type === 'error') {
            this.worker.removeEventListener('message', handleMessage);
            reject(new Error(data.message));
          }
        };

        this.worker.addEventListener('message', handleMessage);
        
        // Send detection request
        this.worker.postMessage({
          type: 'runPoseDetection',
          imageBuffer: buffer,
          imageInfo: {
            width: imageData.width,
            height: imageData.height
          }
        });
      }).catch(reject);
    });
  }

  formatPoseResults(poses) {
    if (!poses || poses.length === 0) {
      // Return empty array if no poses detected (matching original working code)
      return [];
    }

    // Return all poses in the format expected by the original working code
    return poses.map(pose => ({
      bbox: pose.bbox,
      confidence: pose.confidence,
      keypoints: pose.keypoints
    }));
  }

  extractKeypoint(keypoints, index) {
    if (index < keypoints.length / 3) {
      const x = keypoints[index * 3];
      const y = keypoints[index * 3 + 1];
      const confidence = keypoints[index * 3 + 2];
      
      return { x, y, confidence };
    }
    
    // Return default if keypoint not available
    return { x: 0, y: 0, confidence: 0 };
  }

  terminate() {
    if (this.worker) {
      // Send disposal message before terminating
      this.worker.postMessage({ type: 'dispose' });
      
      // Give it a moment to dispose sessions, then terminate
      setTimeout(() => {
        this.worker.terminate();
        this.worker = null;
        this.isInitialized = false;
        this.initializationPromise = null;
      }, 100);
    }
  }
}

// Export singleton instance
export const poseDetectionService = new PoseDetectionService();
export default poseDetectionService;
