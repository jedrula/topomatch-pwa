// Utility to handle Firebase Storage URLs for development vs production
export const getImageUrl = (storageUrl) => {
  if (!storageUrl) return null;

  // In development, proxy storage requests through Vite server
  if (import.meta.env.DEV && storageUrl.includes('localhost:9199')) {
    // Convert localhost storage URL to proxied URL
    const urlParts = new URL(storageUrl);
    return `/api/storage${urlParts.pathname}${urlParts.search}`;
  }

  // In production or for non-emulator URLs, return as-is
  return storageUrl;
};

// Alternative approach: Convert emulator URLs to data URLs
export const loadImageAsDataUrl = async (storageUrl) => {
  if (!storageUrl) return null;

  try {
    const response = await fetch(storageUrl, {
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image as data URL:', error);
    return null;
  }
};
