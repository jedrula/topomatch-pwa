/**
 * UUID Generation Utility
 * 
 * Provides a polyfill for crypto.randomUUID() for browsers that don't support it.
 * Falls back to a compliant UUID v4 implementation.
 */

/**
 * Generate a UUID v4
 * Uses native crypto.randomUUID() if available, otherwise falls back to polyfill
 * @returns {string} A UUID v4 string
 */
export function generateUUID() {
  // Try native implementation first
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback polyfill for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
