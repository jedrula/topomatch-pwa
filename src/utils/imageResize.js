/**
 * Utility functions for working with Firebase Storage Resize Images extension
 * 
 * The extension generates images with the following naming pattern:
 * - Original: path/to/image.jpg
 * - Resized: path/to/image_300x300.jpg (webp versions: path/to/image_300x300.webp)
 * 
 * Our configured sizes: 300x300 (thumbnail), 800x600 (mobile), 1920x1440 (desktop)
 */

/**
 * Extract the base path and extension from a Firebase Storage URL
 * @param {string} originalUrl - The original Firebase Storage URL
 * @returns {Object} - { basePath, extension, bucketUrl }
 */
function parseStorageUrl(originalUrl) {
  try {
    const url = new URL(originalUrl);
    
    // Handle both googleapis.com and firebasestorage.app domains
    let filePath;
    if (url.hostname.includes('googleapis.com')) {
      // Format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile.jpg?alt=media&token=...
      const pathMatch = url.pathname.match(/\/o\/(.*?)(?:\?|$)/);
      filePath = pathMatch ? decodeURIComponent(pathMatch[1]) : '';
    } else {
      // Format: https://bucket.firebasestorage.app/v0/b/bucket/o/path%2Fto%2Ffile.jpg?alt=media&token=...
      const pathMatch = url.pathname.match(/\/o\/(.*?)(?:\?|$)/);
      filePath = pathMatch ? decodeURIComponent(pathMatch[1]) : '';
    }
    
    // Extract base path and extension
    const lastDotIndex = filePath.lastIndexOf('.');
    const basePath = lastDotIndex > 0 ? filePath.substring(0, lastDotIndex) : filePath;
    const extension = lastDotIndex > 0 ? filePath.substring(lastDotIndex) : '';
    
    // Get the base URL without the file path
    const bucketUrl = originalUrl.split('/o/')[0];
    
    return { basePath, extension, bucketUrl, originalPath: filePath };
  } catch (error) {
    console.error('Error parsing storage URL:', error);
    return { basePath: '', extension: '', bucketUrl: '', originalPath: '' };
  }
}

/**
 * Generate resized image URL using the Firebase Storage Resize Images extension naming convention
 * @param {string} originalUrl - The original Firebase Storage URL
 * @param {string} size - Size in format "WIDTHxHEIGHT" (e.g., "300x300", "800x600", "1920x1440")
 * @param {string} format - Image format ("jpeg", "webp", or "original")
 * @returns {string} - The resized image URL
 */
export function getResizedImageUrl(originalUrl, size = '800x600', format = 'webp') {
  const { basePath, extension, bucketUrl, originalPath } = parseStorageUrl(originalUrl);
  
  if (!basePath || !bucketUrl) {
    console.warn('Could not parse storage URL, returning original:', originalUrl);
    return originalUrl;
  }
  
  // Determine the file extension based on format
  let fileExtension;
  if (format === 'original') {
    fileExtension = extension;
  } else if (format === 'webp') {
    fileExtension = '.webp';
  } else if (format === 'jpeg') {
    fileExtension = '.jpg';
  } else {
    fileExtension = extension; // fallback to original
  }
  
  // Build the resized image path
  const resizedPath = `${basePath}_${size}${fileExtension}`;
  const encodedPath = encodeURIComponent(resizedPath);
  
  // Get the token from the original URL to use with the resized image
  const originalUrlObj = new URL(originalUrl);
  const token = originalUrlObj.searchParams.get('token');
  const tokenParam = token ? `&token=${token}` : '';
  
  // Construct the resized image URL
  return `${bucketUrl}/o/${encodedPath}?alt=media${tokenParam}`;
}

/**
 * Get responsive image URLs for different screen sizes
 * @param {string} originalUrl - The original Firebase Storage URL
 * @param {boolean} preferWebP - Whether to prefer WebP format (defaults to true)
 * @returns {Object} - Object with thumbnail, mobile, desktop, and original URLs
 */
export function getResponsiveImageUrls(originalUrl, preferWebP = true) {
  const format = preferWebP ? 'webp' : 'jpeg';
  
  return {
    thumbnail: getResizedImageUrl(originalUrl, '300x300', format),
    mobile: getResizedImageUrl(originalUrl, '800x600', format),
    desktop: getResizedImageUrl(originalUrl, '1920x1440', format),
    original: originalUrl,
    // Fallback JPEG versions for better compatibility
    thumbnailJpeg: getResizedImageUrl(originalUrl, '300x300', 'jpeg'),
    mobileJpeg: getResizedImageUrl(originalUrl, '800x600', 'jpeg'),
    desktopJpeg: getResizedImageUrl(originalUrl, '1920x1440', 'jpeg'),
  };
}

/**
 * Generate a picture element with responsive sources
 * @param {string} originalUrl - The original Firebase Storage URL
 * @param {string} alt - Alt text for the image
 * @param {string} className - CSS classes for the img element
 * @param {Object} sizes - Custom sizes configuration
 * @returns {string} - HTML string for a picture element
 */
export function generateResponsivePicture(originalUrl, alt = '', className = '', sizes = {}) {
  const urls = getResponsiveImageUrls(originalUrl);
  
  const defaultSizes = {
    thumbnail: '(max-width: 320px) 300px',
    mobile: '(max-width: 768px) 800px',
    desktop: '1920px'
  };
  
  const sizesAttr = Object.assign(defaultSizes, sizes);
  
  return `
    <picture>
      <!-- WebP sources for modern browsers -->
      <source 
        srcset="${urls.thumbnail} 300w, ${urls.mobile} 800w, ${urls.desktop} 1920w"
        sizes="${Object.values(sizesAttr).join(', ')}"
        type="image/webp"
      />
      <!-- JPEG fallback for older browsers -->
      <source 
        srcset="${urls.thumbnailJpeg} 300w, ${urls.mobileJpeg} 800w, ${urls.desktopJpeg} 1920w"
        sizes="${Object.values(sizesAttr).join(', ')}"
        type="image/jpeg"
      />
      <!-- Fallback img element -->
      <img 
        src="${urls.mobile}" 
        alt="${alt}"
        class="${className}"
        loading="lazy"
      />
    </picture>
  `;
}

/**
 * Check if resized versions of an image likely exist
 * This is a heuristic check - the extension might still be processing
 * @param {string} originalUrl - The original Firebase Storage URL
 * @returns {Promise<boolean>} - Whether resized versions likely exist
 */
export async function checkResizedVersionsExist(originalUrl) {
  try {
    const urls = getResponsiveImageUrls(originalUrl);
    
    // Check if the thumbnail WebP version exists (smallest/fastest to check)
    const response = await fetch(urls.thumbnail, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Could not check if resized versions exist:', error);
    return false;
  }
}

/**
 * Get the appropriate image URL based on screen size and device capabilities
 * @param {string} originalUrl - The original Firebase Storage URL
 * @param {number} containerWidth - Width of the container in pixels
 * @param {number} devicePixelRatio - Device pixel ratio (defaults to window.devicePixelRatio)
 * @returns {string} - The most appropriate image URL
 */
export function getOptimalImageUrl(originalUrl, containerWidth, devicePixelRatio = window.devicePixelRatio || 1) {
  const urls = getResponsiveImageUrls(originalUrl);
  
  // Calculate required width accounting for device pixel ratio
  const requiredWidth = containerWidth * devicePixelRatio;
  
  // Choose the smallest image that's still large enough
  if (requiredWidth <= 300) {
    return urls.thumbnail;
  } else if (requiredWidth <= 800) {
    return urls.mobile;
  } else if (requiredWidth <= 1920) {
    return urls.desktop;
  } else {
    return urls.original; // For very large displays
  }
}
