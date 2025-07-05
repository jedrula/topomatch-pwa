/**
 * Image Cache Service
 * Pre-downloads and caches region images for offline use
 */

const CACHE_NAME = "topo-images-v1";
const MAX_CACHE_SIZE = 100; // Maximum number of images to cache

class ImageCacheService extends EventTarget {
  constructor() {
    super();
    this.cache = null;
    this.initCache();
  }

  async initCache() {
    if ("caches" in window) {
      try {
        this.cache = await caches.open(CACHE_NAME);
        console.log(`Cache ${CACHE_NAME} initialized`);
      } catch (error) {
        console.error('Failed to initialize cache:', error);
      }
    } else {
      console.warn('Cache API not available');
    }
  }

  /**
   * Pre-download and cache all images for a region
   * @param {Array} imagePaths - Array of image paths to cache
   * @param {Function} onProgress - Progress callback (currentIndex, total)
   * @param {AbortSignal} signal - Abort signal for cancellation
   */
  async cacheRegionImages(imagePaths, onProgress = null, signal = null) {
    if (!this.cache) {
      console.warn("Cache API not available");
      return;
    }

    console.log(`Starting to cache ${imagePaths.length} images for region...`);

    for (let i = 0; i < imagePaths.length; i++) {
      // Check for cancellation
      if (signal?.aborted) {
        throw new Error('AbortError');
      }

      const imagePath = imagePaths[i];

      try {
        // Check if image is already cached
        const cachedResponse = await this.cache.match(imagePath);
        if (cachedResponse) {
          console.log(`Image already cached: ${imagePath}`);
        } else {
          // Download and cache the image
          console.log(`Caching image: ${imagePath}`);
          const response = await fetch(imagePath, { signal });

          if (response.ok) {
            // Clone the response to cache it
            await this.cache.put(imagePath, response.clone());
            console.log(`Successfully cached: ${imagePath}`);
            
            // Emit cache update event
            this.dispatchEvent(new CustomEvent('cacheUpdated', { 
              detail: { imagePath, action: 'cached' } 
            }));
          } else {
            console.warn(`Failed to fetch image: ${imagePath}, status: ${response.status}`);
          }
        }

        // Call progress callback
        if (onProgress) {
          onProgress(i + 1, imagePaths.length);
        }

        // Small delay to avoid overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 10));
      } catch (error) {
        if (error.name === 'AbortError' || signal?.aborted) {
          throw error;
        }
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
    // Ensure cache is initialized
    if (!this.cache) {
      await this.initCache();
    }
    
    if (!this.cache) return false;

    try {
      const cachedResponse = await this.cache.match(imagePath);
      const isCached = !!cachedResponse;
      console.log(`Cache check for ${imagePath}: ${isCached ? 'CACHED' : 'NOT CACHED'}`);
      return isCached;
    } catch (error) {
      console.error("Error checking cache:", error);
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
      console.error("Error getting cached image:", error);
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
      
      // Emit cache update event
      this.dispatchEvent(new CustomEvent('cacheUpdated', { 
        detail: { imagePath, action: 'cached' } 
      }));
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
        await Promise.all(keysToDelete.map((key) => this.cache.delete(key)));
        console.log(`Cleaned up ${keysToDelete.length} old cache entries`);
      }
    } catch (error) {
      console.error("Error cleaning up cache:", error);
    }
  }

  /**
   * Get cache status for a list of images
   * @param {Array} imagePaths - Array of image paths to check
   * @returns {Promise<Object>} - Object with cached/total counts
   */
  async getCacheStatus(imagePaths) {
    // Ensure cache is initialized
    if (!this.cache) {
      await this.initCache();
    }
    
    if (!this.cache) {
      return { cached: 0, total: imagePaths.length };
    }

    let cached = 0;
    for (const imagePath of imagePaths) {
      if (await this.isImageCached(imagePath)) {
        cached++;
      }
    }

    console.log(`Cache status: ${cached}/${imagePaths.length} images cached`);
    return { cached, total: imagePaths.length };
  }

  /**
   * Remove specific cached images
   * @param {Array} imagePaths - Array of image paths to remove from cache
   */
  async removeCachedImages(imagePaths) {
    if (!this.cache) return;
    
    try {
      await Promise.all(imagePaths.map(imagePath => this.cache.delete(imagePath)));
      console.log(`Removed ${imagePaths.length} images from cache`);
      
      // Emit cache update events for removed images
      imagePaths.forEach(imagePath => {
        this.dispatchEvent(new CustomEvent('cacheUpdated', { 
          detail: { imagePath, action: 'removed' } 
        }));
      });
    } catch (error) {
      console.error('Error removing cached images:', error);
    }
  }

  /**
   * Force refresh cache status for all components
   */
  refreshCacheStatus() {
    this.dispatchEvent(new CustomEvent('cacheRefresh'));
  }

  /**
   * Clear all cached images
   */
  async clearCache() {
    if (!this.cache) return;

    try {
      const keys = await this.cache.keys();
      await Promise.all(keys.map((key) => this.cache.delete(key)));
      console.log("Cleared all cached images");
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }
}

// Create singleton instance
export const imageCacheService = new ImageCacheService();
export default imageCacheService;
