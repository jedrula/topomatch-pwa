/**
 * Simple image compression utility using Canvas API
 * Compresses images to approximately 2MB or less
 */

/**
 * Compress an image file to approximately 2MB
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed image file
 */
export async function compressImage(file, options = {}) {
  const {
    maxSizeMB = 2,
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.85,
    format = 'image/jpeg'
  } = options;

  // If file is already small enough, return as-is
  if (file.size <= maxSizeMB * 1024 * 1024) {
    console.log(`Image already under ${maxSizeMB}MB, skipping compression`);
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = calculateDimensions(img.width, img.height, maxWidth, maxHeight);
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw the resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with quality compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          // Create a new File from the compressed blob
          const compressedFile = new File([blob], file.name, {
            type: format,
            lastModified: Date.now()
          });
          
          console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
          resolve(compressedFile);
        },
        format,
        quality
      );
      
      // Clean up
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 * @param {number} originalWidth 
 * @param {number} originalHeight 
 * @param {number} maxWidth 
 * @param {number} maxHeight 
 * @returns {Object} - New width and height
 */
function calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
  let width = originalWidth;
  let height = originalHeight;
  
  // Calculate the scaling factor
  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const ratio = Math.min(widthRatio, heightRatio);
  
  // Only scale down, never up
  if (ratio < 1) {
    width = Math.round(originalWidth * ratio);
    height = Math.round(originalHeight * ratio);
  }
  
  return { width, height };
}

/**
 * Check if image needs compression based on file size
 * @param {File} file - The image file to check
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} - Whether compression is needed
 */
export function needsCompression(file, maxSizeMB = 2) {
  return file.size > maxSizeMB * 1024 * 1024;
}
