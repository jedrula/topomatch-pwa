import { functions } from './firebase.js';
import { httpsCallable } from 'firebase/functions';

/**
 * Like Service
 * Handles toggling likes on ascents via Cloud Function
 */

/**
 * Toggle like on an ascent
 * @param {string} ascentId - The ID of the ascent to like/unlike
 * @returns {Promise<{liked: boolean, likeCount: number}>}
 */
export async function toggleLike(ascentId) {
  try {
    const toggleLikeFn = httpsCallable(functions, 'toggleLike');
    const result = await toggleLikeFn({ ascentId });
    return result.data;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
}

/**
 * Check if current user has liked an ascent
 * @param {Object} ascent - The ascent object with likedByUserIds array
 * @param {string} userId - The current user's ID
 * @returns {boolean}
 */
export function hasUserLiked(ascent, userId) {
  if (!ascent || !userId) return false;
  return ascent.likedByUserIds?.includes(userId) || false;
}

/**
 * Get like count for an ascent
 * @param {Object} ascent - The ascent object
 * @returns {number}
 */
export function getLikeCount(ascent) {
  return ascent?.likeCount || 0;
}

/**
 * Toggle like on a location
 * @param {string} locationId - The ID of the location to like/unlike
 * @returns {Promise<{isLiked: boolean, likesCount: number}>}
 */
export async function toggleLocationLike(locationId) {
  try {
    const toggleLocationLikeFn = httpsCallable(functions, 'toggleLocationLike');
    const result = await toggleLocationLikeFn({ locationId });
    return result.data;
  } catch (error) {
    console.error('Error toggling location like:', error);
    throw error;
  }
}

/**
 * Get all location IDs that the current user has liked
 * @returns {Promise<string[]>}
 */
export async function getUserLikes() {
  try {
    const getUserLikesFn = httpsCallable(functions, 'getUserLikes');
    const result = await getUserLikesFn();
    return result.data.likedLocationIds;
  } catch (error) {
    console.error('Error getting user likes:', error);
    throw error;
  }
}

export default {
  toggleLike,
  hasUserLiked,
  getLikeCount,
  toggleLocationLike,
  getUserLikes,
};
