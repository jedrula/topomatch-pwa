import { defineStore } from 'pinia';
import { toggleLocationLike, getUserLikes } from '../services/likeService.js';

export const useLocationLikesStore = defineStore('locationLikes', {
  state: () => ({
    likedLocationIds: new Set(), // Set for fast lookup
    isLoading: false,
    error: null,
  }),

  getters: {
    /**
     * Check if a location is liked by current user
     * @param {object} state
     * @returns {function(string): boolean}
     */
    isLocationLiked: (state) => (locationId) => {
      return state.likedLocationIds.has(locationId);
    },

    /**
     * Get count of liked locations
     * @param {object} state
     * @returns {number}
     */
    likedCount: (state) => state.likedLocationIds.size,
  },

  actions: {
    /**
     * Load user's liked locations from backend
     */
    async loadUserLikes() {
      this.isLoading = true;
      this.error = null;

      try {
        console.log('📍 Loading user likes...');
        const locationIds = await getUserLikes();
        this.likedLocationIds = new Set(locationIds);
        console.log(`✅ Loaded ${locationIds.length} liked locations:`, locationIds);
      } catch (error) {
        console.error('❌ Error loading user likes:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        this.error = error.message;
        // Don't throw - keep empty set on error
        this.likedLocationIds = new Set();
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Toggle like status for a location (optimistic update)
     * @param {string} locationId
     * @returns {Promise<{isLiked: boolean, likesCount: number}>}
     */
    async toggleLike(locationId) {
      // Optimistic update - immediately toggle in UI
      const wasLiked = this.likedLocationIds.has(locationId);
      
      if (wasLiked) {
        this.likedLocationIds.delete(locationId);
      } else {
        this.likedLocationIds.add(locationId);
      }

      try {
        // Call backend
        const result = await toggleLocationLike(locationId);
        
        // Backend is source of truth - sync local state
        if (result.isLiked) {
          this.likedLocationIds.add(locationId);
        } else {
          this.likedLocationIds.delete(locationId);
        }

        console.log(`✅ Toggled like for location ${locationId}: ${result.isLiked}`);
        return result;
      } catch (error) {
        console.error('❌ Error toggling like:', error);
        
        // Rollback optimistic update on error
        if (wasLiked) {
          this.likedLocationIds.add(locationId);
        } else {
          this.likedLocationIds.delete(locationId);
        }
        
        throw error;
      }
    },

    /**
     * Clear all likes (used on logout)
     */
    clear() {
      this.likedLocationIds.clear();
      this.isLoading = false;
      this.error = null;
    },
  },
});
