/**
 * Fix localhost URLs for Firebase Storage emulator
 * Replaces localhost URLs with the configured replacement URL for mobile access
 */
export function fixLocalhostUrl(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // Get the replacement URL from environment variables
  const replacementUrl = import.meta.env.VITE_LOCALHOST_REPLACEMENT;
  
  // Only process localhost URLs (Firebase emulator) if replacement is configured
  if (replacementUrl && (url.includes('127.0.0.1:9199') || url.includes('localhost:9199'))) {
    // Replace localhost with the configured network IP
    return url
      .replace('http://127.0.0.1:9199', replacementUrl)
      .replace('http://localhost:9199', replacementUrl);
  }

  // Return unchanged for production URLs or when no replacement is configured
  return url;
}