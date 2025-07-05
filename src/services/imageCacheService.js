/**
 * Image Cache Service
 * Pre-downloads and caches region images for offline use
 */

const CACHE_NAME = 'topo-images-v1';
const MAX_CACHE_SIZE = 100; // Maximum number of images to cache

class ImageCacheService {
  constructor() {
    this.cache = null;
    this.initCache();
  }

  async initCache() {
    if ('caches' in window) {
      this.cache = await caches.open(CACHE_NAME);
    }
  }

  /**
   * Pre-download and cache all images for a region
   * @param {Array} imagePaths - Array of image paths to cache
   * @param {Function} onProgress - Progress callback (currentIndex, total)
   */
  async cacheRegionImages(imagePaths, onProgress = null) {
    if (!this.cache) {
      console.warn('Cache API not available');
      return;
    }

    console.log(`Starting to cache ${imagePaths.length} images for region...`);
    
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      
      try {
        // Check if image is already cached
        const cachedResponse = await this.cache.match(imagePath);
        if (cachedResponse) {
          console.log(`Image already cached: ${imagePath}`);
        } else {
          // Download and cache the image
          console.log(`Caching image: ${imagePath}`);
          const response = await fetch(imagePath);
          
          if (response.ok) {
            // Clone the response to cache it
            await this.cache.put(imagePath, response.clone());
            console.log(`Successfully cached: ${imagePath}`);
          } else {
            console.warn(`Failed to fetch image: ${imagePath}, status: ${response.status}`);
          }
        }
        
        // Call progress callback
        if (onProgress) {
          onProgress(i + 1, imagePaths.length);
        }
        
        // Small delay to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        console.error(`Error caching image ${imagePath}:`, error);
      }
    }

    // Clean up old cache entries if we exceed max size
    await this.cleanupCache();
    
    console.log(`Finished caching region images`);
  }

  /**
   * Check if an image is cached
   * @param {string} imagePath - Path to the image
   * @returns {Promise<boolean>}
   */
  async isImageCached(imagePath) {
    if (!this.cache) return false;
    
    try {
      const cachedResponse = await this.cache.match(imagePath);
      return !!cachedResponse;
    } catch (error) {
      console.error('Error checking cache:', error);
      return false;
    }
  }

  /**
   * Get a cached image response
   * @param {string} imagePath - Path to the image
   * @returns {Promise<Response|null>}
   */
  async getCachedImage(imagePath) {
    if (!this.cache) return null;
    
    try {
      return await this.cache.match(imagePath);
    } catch (error) {
      console.error('Error getting cached image:', error);
      return null;
    }
  }

  /**
   * Fetch image with cache-first strategy
   * @param {string} imagePath - Path to the image
   * @returns {Promise<Response>}
   */
  async fetchImage(imagePath) {
    // Try cache first
    const cachedResponse = await this.getCachedImage(imagePath);
    if (cachedResponse) {
      console.log(`Serving from cache: ${imagePath}`);
      return cachedResponse;
    }

    // Fallback to network
    console.log(`Fetching from network: ${imagePath}`);
    const networkResponse = await fetch(imagePath);
    
    // Cache the response for future use
    if (networkResponse.ok && this.cache) {
      await this.cache.put(imagePath, networkResponse.clone());
    }
    
    return networkResponse;
  }

  /**
   * Clean up old cache entries to stay under max size
   */
  async cleanupCache() {
    if (!this.cache) return;

    try {
      const keys = await this.cache.keys();
      if (keys.length > MAX_CACHE_SIZE) {
        // Remove oldest entries (this is a simple strategy, could be improved)
        const keysToDelete = keys.slice(0, keys.length - MAX_CACHE_SIZE);
        await Promise.all(keysToDelete.map(key => this.cache.delete(key)));
        console.log(`Cleaned up ${keysToDelete.length} old cache entries`);
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  /**
   * Get cache status for a list of images
   * @param {Array} imagePaths - Array of image paths to check
   * @returns {Promise<Object>} - Object with cached/total counts
   */
  async getCacheStatus(imagePaths) {
    if (!this.cache) {
      return { cached: 0, total: imagePaths.length };
    }

    let cached = 0;
    for (const imagePath of imagePaths) {
      if (await this.isImageCached(imagePath)) {
        cached++;
      }
    }

    return { cached, total: imagePaths.length };
  }

  /**
   * Clear all cached images
   */
  async clearCache() {
    if (!this.cache) return;
    
    try {
      const keys = await this.cache.keys();
      await Promise.all(keys.map(key => this.cache.delete(key)));
      console.log('Cleared all cached images');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

// Create singleton instance
export const imageCacheService = new ImageCacheService();
export default imageCacheService;
