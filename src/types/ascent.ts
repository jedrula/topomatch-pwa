import {Timestamp} from 'firebase/firestore';

/**
 * Video data embedded within an ascent
 */
export interface AscentVideo {
  /** Unique ID for the video (used in Storage paths) */
  videoId: string;
  
  /** Current status of video processing */
  status: 'pending' | 'transcoding' | 'ready' | 'error';
  
  /** Original uploaded video path in Storage */
  originalPath: string;
  
  /** Transcoded video path in Storage (available when status='ready') */
  transcodedPath?: string;
  
  /** MIME type of original upload */
  mimeType: string;
  
  /** Original file size in bytes */
  originalFileSize: number;
  
  /** Transcoded file size in bytes (if available) */
  transcodedFileSize?: number;
  
  /** When the video was uploaded */
  uploadedAt: Timestamp;
  
  /** When transcoding completed */
  transcodedAt?: Timestamp;
  
  /** Base64 encoded thumbnail image (JPEG, ~20-50KB) */
  thumbnailBase64?: string;
  
  /** Error message if status='error' */
  error?: string;
}

/**
 * Snapshot of problem data at time of ascent
 * Preserved even if problem is deleted
 */
export interface ProblemSnapshot {
  /** Problem name at time of ascent */
  name: string;
  
  /** Grade at time of ascent */
  grade: string;
  
  /** Color hex code */
  color: string;
}

/**
 * Ascent (climb log) document
 * Top-level collection: /ascents/{ascentId}
 */
export interface Ascent {
  /** Firestore document ID */
  id?: string;
  
  /** User who logged this ascent */
  userId: string;
  
  /** Location where the climb happened */
  locationId: string;
  
  /** Boulder problem that was climbed */
  problemId: string;
  
  /** Snapshot of problem data (preserved if problem deleted) */
  problemSnapshot: ProblemSnapshot;
  
  /** How the climb was achieved */
  attemptType: 'flash' | 'second' | 'multiple';
  
  /** User's opinion of the grade (optional) */
  userGrade?: string;
  
  /** User notes about the climb */
  notes: string;
  
  /** When the climb happened */
  date: Timestamp;
  
  /** Optional embedded video data */
  video?: AscentVideo;
  
  /** When this ascent was logged */
  createdAt: Timestamp;
  
  /** Last update timestamp */
  updatedAt: Timestamp;
  
  /** Display name of user who logged this ascent (avoids user lookup) */
  userName: string;
}

/**
 * Data required to create a new ascent
 */
export interface CreateAscentData {
  locationId: string;
  problemId: string;
  problemSnapshot: ProblemSnapshot;
  attemptType: 'flash' | 'second' | 'multiple';
  userGrade?: string;
  notes?: string;
  date: Date;
  video?: Omit<AscentVideo, 'uploadedAt' | 'transcodedAt'>;
}
