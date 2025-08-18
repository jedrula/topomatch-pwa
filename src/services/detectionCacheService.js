/**
 * Detection Cache Service
 *
 * Abstracts browser caching for hold detection results.
 * To disable caching: set CACHE_ENABLED = false
 * To remove caching entirely: replace this service with a no-op implementation
 */

// Cache configuration
const CACHE_ENABLED = true; // Set to false to disable caching
const CACHE_EXPIRY_HOURS = 24 * 30; // Cache for 1 month
const CACHE_PREFIX = "hold_detection_cache_";

/**
 * Generate a consistent cache key based on image URL and settings
 */
const generateCacheKey = (imageUrl, settings) => {
  if (!CACHE_ENABLED) return null;

  try {
    const settingsHash = btoa(
      JSON.stringify({
        enabled: settings.enabled,
        maxSizeMB: settings.maxSizeMB,
        maxWidthOrHeight: settings.maxWidthOrHeight,
      })
    );

    // Use full URL hash to avoid collisions between similar Firebase URLs
    // Extract unique parts: filename and token for additional uniqueness
    let uniquePart = "";
    try {
      const url = new URL(imageUrl);
      const pathname = decodeURIComponent(url.pathname);
      const filename = pathname.split("/").pop() || "";
      const token = url.searchParams.get("token") || "";
      uniquePart = filename + "_" + token.slice(0, 8); // First 8 chars of token for brevity
    } catch (urlError) {
      // Fallback to using part of the URL if parsing fails
      uniquePart = imageUrl.slice(-32); // Last 32 chars as fallback
    }

    const urlHash = btoa(imageUrl + "_" + uniquePart).replace(/[=+/]/g, ""); // Remove problematic chars
    return `${CACHE_PREFIX}${urlHash}_${settingsHash}`.replace(/[=+/]/g, ""); // Clean final key
  } catch (error) {
    console.error("Error generating cache key:", error);
    return null;
  }
};

/**
 * Check if cached detection result exists for an image without retrieving it
 */
export const hasCachedDetectionResult = (imageUrl, settings) => {
  if (!CACHE_ENABLED) return false;

  try {
    const cacheKey = generateCacheKey(imageUrl, settings);
    if (!cacheKey) return false;

    const cached = localStorage.getItem(cacheKey);
    if (!cached) return false;

    const { timestamp } = JSON.parse(cached);
    const now = Date.now();
    const expiry = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

    // Check if cache is expired
    if (now - timestamp > expiry) {
      localStorage.removeItem(cacheKey);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking detection cache:", error);
    return false;
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
      settings: { ...settings },
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

    Object.keys(localStorage).forEach((key) => {
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
    let clearedCount = 0;
    const keysToRemove = [];

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach((key) => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { imageUrl } = JSON.parse(cached);
          console.log("🗑️ Removing cached detection for:", imageUrl);
        }
      } catch (parseError) {
        console.log("🗑️ Removing corrupted cache entry:", key);
      }
      localStorage.removeItem(key);
      clearedCount++;
    });

    console.log(`🗑️ Cleared ${clearedCount} detection cache entries`);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
};

/**
 * Clear cache for a specific image URL
 */
export const clearDetectionCacheForImage = (imageUrl, settings) => {
  if (!CACHE_ENABLED) return;

  try {
    const cacheKey = generateCacheKey(imageUrl, settings);
    if (cacheKey && localStorage.getItem(cacheKey)) {
      localStorage.removeItem(cacheKey);
      console.log("🗑️ Cleared cache for specific image:", imageUrl);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error clearing cache for image:", error);
    return false;
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

    Object.keys(localStorage).forEach((key) => {
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
      expiryHours: CACHE_EXPIRY_HOURS,
    };
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return { enabled: true, count: 0, totalSize: 0, error: error.message };
  }
};

/**
 * Debug: List all cached images with their URLs (for troubleshooting cache collisions)
 */
export const debugListCachedImages = () => {
  if (!CACHE_ENABLED) return [];

  try {
    const cachedImages = [];
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          const { imageUrl, timestamp, settings } = JSON.parse(cached);
          cachedImages.push({
            key,
            imageUrl,
            timestamp,
            settings,
            age: Math.round((Date.now() - timestamp) / (1000 * 60 * 60)), // hours
          });
        } catch (parseError) {
          cachedImages.push({
            key,
            imageUrl: "CORRUPTED",
            error: parseError.message,
          });
        }
      }
    });

    console.table(cachedImages);
    return cachedImages;
  } catch (error) {
    console.error("Error listing cached images:", error);
    return [];
  }
};

// Initialize: Clean up expired cache on module load
if (CACHE_ENABLED) {
  clearExpiredDetectionCache();
}
