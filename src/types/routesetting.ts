import { Timestamp } from 'firebase/firestore';

/**
 * Boulder problem stored at /locations/{locationId}/boulderProblems/{problemId}
 */
export interface BoulderProblem {
  id: string;
  name: string;
  grade: string;
  color: string;
  imageId: string;
  holds: unknown[];
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;

  /** Sibling problem on an adjacent image (same route, different camera angle) */
  linkedProblemId?: string | null;
  isPrimary?: boolean;

  /** The problem this one replaced on the previous image of the same wall section.
   *  Set when a wall is re-photographed and problems are redrawn.
   *  Used to aggregate betas/videos across routesetting history. */
  predecessorProblemId?: string | null;
}

export interface FloorplanSection {
  id: string;
  name: string;
  type: 'slab' | 'vertical' | 'overhang' | 'cave';
  imageIds: string[];
  points: Array<{ x: number; y: number }>;
}

export interface Floorplan {
  id: string;
  name: string;
  outline: Array<{ x: number; y: number }>;
  sections: FloorplanSection[];
}

/**
 * Location document now stores routesettings as an array of ISO timestamps
 * No separate subcollection - just timestamps in location.routesettings[]
 */
export interface Location {
  /** Array of routesetting timestamps (ISO format: YYYY-MM-DDTHH:mm:ss) */
  routesettings: string[];

  /** Climbing areas / floors within the location */
  floorplans: Floorplan[];

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

  /** If set, this image was uploaded to replace an older image on the same wall section.
   *  Permanent — set at upload time, never changes. */
  replacesImageId?: string;
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
