/**
 * Detection Cache Service
 * 
 * Abstracts browser caching for hold detection results.
 * To disable caching: set CACHE_ENABLED = false
 * To remove caching entirely: replace this service with a no-op implementation
 */

// Cache configuration
const CACHE_ENABLED = true; // Set to false to disable caching
const CACHE_EXPIRY_HOURS = 24 * 7; // Cache for 1 week
const CACHE_PREFIX = "hold_detection_cache_";

/**
 * Generate a consistent cache key based on image URL and settings
 */
const generateCacheKey = (imageUrl, settings) => {
  if (!CACHE_ENABLED) return null;
  
  try {
    const settingsHash = btoa(JSON.stringify({
      enabled: settings.enabled,
      maxSizeMB: settings.maxSizeMB,
      maxWidthOrHeight: settings.maxWidthOrHeight,
    })).slice(0, 16);
    
    const urlHash = btoa(imageUrl).slice(0, 16);
    return `${CACHE_PREFIX}${urlHash}_${settingsHash}`;
  } catch (error) {
    console.error("Error generating cache key:", error);
    return null;
  }
};

/**
 * Get cached detection result if available and not expired
 */
export const getCachedDetectionResult = (imageUrl, settings) => {
  if (!CACHE_ENABLED) return null;
  
  try {
    const cacheKey = generateCacheKey(imageUrl, settings);
    if (!cacheKey) return null;
    
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    const expiry = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

    // Check if cache is expired
    if (now - timestamp > expiry) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    console.log("📦 Found cached detection results for:", imageUrl);
    return data;
  } catch (error) {
    console.error("Error reading detection cache:", error);
    return null;
  }
};

/**
 * Cache successful detection result
 */
export const setCachedDetectionResult = (imageUrl, settings, data) => {
  if (!CACHE_ENABLED) return;
  
  try {
    const cacheKey = generateCacheKey(imageUrl, settings);
    if (!cacheKey) return;
    
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      imageUrl,
      settings: { ...settings }
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    console.log("💾 Cached detection results for:", imageUrl);
  } catch (error) {
    console.error("Error saving detection cache:", error);
    // If localStorage is full, try to clear old entries
    clearExpiredDetectionCache();
  }
};

/**
 * Clear expired cache entries
 */
export const clearExpiredDetectionCache = () => {
  if (!CACHE_ENABLED) return;
  
  try {
    const now = Date.now();
    const expiry = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const { timestamp } = JSON.parse(localStorage.getItem(key));
          if (now - timestamp > expiry) {
            localStorage.removeItem(key);
            console.log("🗑️ Removed expired cache entry:", key);
          }
        } catch (error) {
          // Remove corrupted cache entries
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error("Error clearing expired cache:", error);
  }
};

/**
 * Clear all detection cache
 */
export const clearAllDetectionCache = () => {
  if (!CACHE_ENABLED) return;
  
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log("🗑️ Cleared all detection cache");
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
};

/**
 * Get cache statistics
 */
export const getDetectionCacheStats = () => {
  if (!CACHE_ENABLED) return { enabled: false, count: 0, totalSize: 0 };
  
  try {
    let count = 0;
    let totalSize = 0;
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        count++;
        totalSize += localStorage.getItem(key).length;
      }
    });
    
    return {
      enabled: true,
      count,
      totalSize,
      formattedSize: `${(totalSize / 1024).toFixed(1)} KB`,
      expiryHours: CACHE_EXPIRY_HOURS
    };
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return { enabled: true, count: 0, totalSize: 0, error: error.message };
  }
};

// Initialize: Clean up expired cache on module load
if (CACHE_ENABLED) {
  clearExpiredDetectionCache();
}
