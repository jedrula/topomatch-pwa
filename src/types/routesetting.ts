import { Timestamp } from 'firebase/firestore';

/**
 * Location document now stores routesettings as an array of ISO timestamps
 * No separate subcollection - just timestamps in location.routesettings[]
 */
export interface Location {
  /** Array of routesetting timestamps (ISO format: YYYY-MM-DDTHH:mm:ss) */
  routesettings: string[];
  
  /** Other location fields... */
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

/**
 * Location image with routesetting information
 * Each image tracks which routesettings it belongs to via array
 */
export interface LocationImageWithSetting {
  /** Unique image ID (UUID, used as folder name in Storage) */
  imageId: string;
  
  /** Location this image belongs to */
  locationId: string;
  
  /** Array of routesetting timestamps this image belongs to */
  routesettings: string[];
  
  /** Original filename (for display purposes) */
  fileName: string;
  
  /** File extension (jpg, png, etc.) */
  fileExtension: string;
  
  /** When this image was uploaded */
  uploadedAt: Timestamp;
}

/**
 * Helper functions for working with routesetting storage paths
 */
export const RoutesettingUtils = {
  /**
   * Compute storage path for an image (flat structure)
   * Format: location-images/{locationId}/{imageId}/original.{ext}
   */
  getImageStoragePath(locationId: string, imageId: string, extension: string): string {
    return `location-images/${locationId}/${imageId}/original.${extension}`;
  },

  /**
   * Get thumbnail path for a specific size
   * Format: location-images/{locationId}/{imageId}/original_{size}.webp
   */
  getThumbnailPath(locationId: string, imageId: string, size: string = '300x300'): string {
    return `location-images/${locationId}/${imageId}/original_${size}.webp`;
  },

  /**
   * Parse imageId from storage path
   * Input: location-images/{locationId}/{imageId}/original.ext
   * Output: imageId
   */
  parseImageIdFromPath(storagePath: string): string | null {
    const parts = storagePath.split('/');
    if (parts.length >= 3 && parts[0] === 'location-images') {
      return parts[2]; // imageId
    }
    return null;
  },

  /**
   * Format timestamp as ISO string (YYYY-MM-DDTHH:mm:ss)
   */
  formatTimestamp(date: Date): string {
    return date.toISOString().slice(0, 19);
  },

  /**
   * Get current timestamp
   */
  getCurrentTimestamp(): string {
    return this.formatTimestamp(new Date());
  },

  /**
   * Parse ISO timestamp string to Date object
   */
  parseTimestamp(timestampString: string): Date {
    return new Date(timestampString);
  }
};
