import { defineStore } from 'pinia';
import { authService } from '../services/authService.js';
import { useLocationLikesStore } from './locationLikesStore.js';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase.js';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    userProfile: null, // Firestore user document
    isLoggedIn: false,
    isLoading: true, // Loading state for auth initialization
    authReadyPromise: null, // Promise that resolves when auth is initialized
  }),

  getters: {
    isAdmin: (state) => {
      if (!state.userProfile) return false;
      // Check Firestore user document for isAdmin field
      return state.userProfile.isAdmin === true;
    },
    isUser() {
      return this.isLoggedIn && !this.isAdmin;
    },
    canEditLocations() {
      return this.isAdmin;
    },
    canDeleteLocations() {
      return this.isAdmin;
    },
    canCreateLocations() {
      return this.isAdmin;
    },
    canViewLocations: (state) => state.isLoggedIn, // All logged-in users can view
    canUploadImages() {
      return this.isAdmin;
    },
    userDisplayName: (state) => {
      if (!state.user) return '';
      return state.user.displayName || state.user.email?.split('@')[0] || 'User';
    },
  },

  actions: {
    // Load user profile from Firestore
    async loadUserProfile(userId) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          this.userProfile = userDoc.data();
        } else {
          this.userProfile = null;
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        this.userProfile = null;
      }
    },

    // Initialize auth listener
    initAuth() {
      if (!this.authReadyPromise) {
        this.authReadyPromise = new Promise((resolve) => {
          authService.onAuthStateChanged(async (user) => {
            this.user = user;
            this.isLoggedIn = !!user;
            this.isLoading = false;
            
            // Load user profile and likes when they sign in
            if (user) {
              await this.loadUserProfile(user.uid);
              const likesStore = useLocationLikesStore();
              await likesStore.loadUserLikes();
            } else {
              this.userProfile = null;
            }
            
            resolve(user);
          });
        });
      }
      return this.authReadyPromise;
    },

    // Sign in
    async signIn(email, password) {
      try {
        const user = await authService.signIn(email, password);
        this.user = user;
        this.isLoggedIn = true;
        await this.loadUserProfile(user.uid);
        return user;
      } catch (error) {
        console.error('Sign in failed:', error);
        throw error;
      }
    },

    // Sign up
    async signUp(email, password, displayName = null) {
      try {
        const user = await authService.signUp(email, password, displayName);
        this.user = user;
        this.isLoggedIn = true;
        await this.loadUserProfile(user.uid);
        return user;
      } catch (error) {
        console.error('Sign up failed:', error);
        throw error;
      }
    },

    // Sign out
    async signOut() {
      try {
        await authService.signOut();
        this.user = null;
        this.userProfile = null;
        this.isLoggedIn = false;
        
        // Clear likes on sign out
        const likesStore = useLocationLikesStore();
        likesStore.clear();
      } catch (error) {
        console.error('Sign out failed:', error);
        throw error;
      }
    },

    // Refresh user claims (useful after admin role changes)
    async refreshUserClaims() {
      try {
        const claims = await authService.refreshUserToken();
        if (this.user && claims) {
          // Update the user object with fresh claims
          this.user = { ...this.user, customClaims: claims };
        }
        return claims;
      } catch (error) {
        console.error('Failed to refresh user claims:', error);
        throw error;
      }
    },
  },
});
