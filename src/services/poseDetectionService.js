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
        this.worker = new Worker(new URL("/poseDetectionWorker.combined.js", import.meta.url));
        
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
      // Return mock data if no poses detected (similar to the mock in the component)
      const { width, height } = { width: 640, height: 480 }; // Default dimensions
      
      return {
        keypoints: {
          leftWrist: { 
            x: width * 0.3, 
            y: height * 0.4, 
            confidence: 0.5 
          },
          rightWrist: { 
            x: width * 0.7, 
            y: height * 0.4, 
            confidence: 0.5 
          },
          leftAnkle: { 
            x: width * 0.4, 
            y: height * 0.9, 
            confidence: 0.5 
          },
          rightAnkle: { 
            x: width * 0.6, 
            y: height * 0.9, 
            confidence: 0.5 
          }
        },
        confidence: 0.5
      };
    }

    // Take the highest confidence pose
    const bestPose = poses.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    // YOLOv8-pose keypoint indices (COCO format)
    // 0: nose, 1-2: eyes, 3-4: ears, 5-6: shoulders, 7-8: elbows, 9-10: wrists, 11-12: hips, 13-14: knees, 15-16: ankles
    const keypoints = bestPose.keypoints;
    
    // Return all keypoints for debugging, not just climbing-relevant ones
    const allKeypoints = [];
    for (let i = 0; i < 17; i++) { // COCO has 17 keypoints
      allKeypoints.push(this.extractKeypoint(keypoints, i));
    }
    
    return {
      keypoints: {
        // Keep simplified format for UI display
        leftWrist: this.extractKeypoint(keypoints, 9), // left wrist
        rightWrist: this.extractKeypoint(keypoints, 10), // right wrist  
        leftAnkle: this.extractKeypoint(keypoints, 15), // left ankle
        rightAnkle: this.extractKeypoint(keypoints, 16) // right ankle
      },
      // Add full keypoints array for debugging
      allKeypoints: allKeypoints,
      confidence: bestPose.confidence
    };
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
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      this.initializationPromise = null;
    }
  }
}

// Export singleton instance
export const poseDetectionService = new PoseDetectionService();
export default poseDetectionService;
