import { defineStore } from "pinia";
import { authService } from "../services/authService.js";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null,
    isLoggedIn: false,
    isLoading: true, // Loading state for auth initialization
  }),

  getters: {
    isAdmin: (state) => {
      if (!state.user) return false;
      console.log("state.user.customClaims", state.user.customClaims);
      // Check custom claims for admin role
      return state.user.customClaims?.admin === true;
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
      if (!state.user) return "";
      return state.user.displayName || state.user.email?.split("@")[0] || "User";
    },
  },

  actions: {
    // Initialize auth listener
    initAuth() {
      return new Promise((resolve) => {
        authService.onAuthStateChanged((user) => {
          this.user = user;
          this.isLoggedIn = !!user;
          this.isLoading = false;
          resolve(user);
        });
      });
    },

    // Sign in
    async signIn(email, password) {
      try {
        const user = await authService.signIn(email, password);
        this.user = user;
        this.isLoggedIn = true;
        return user;
      } catch (error) {
        console.error("Sign in failed:", error);
        throw error;
      }
    },

    // Sign up
    async signUp(email, password, displayName = null) {
      try {
        const user = await authService.signUp(email, password, displayName);
        this.user = user;
        this.isLoggedIn = true;
        return user;
      } catch (error) {
        console.error("Sign up failed:", error);
        throw error;
      }
    },

    // Sign out
    async signOut() {
      try {
        await authService.signOut();
        this.user = null;
        this.isLoggedIn = false;
      } catch (error) {
        console.error("Sign out failed:", error);
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
          console.log("🔄 Refreshed user claims:", claims);
        }
        return claims;
      } catch (error) {
        console.error("Failed to refresh user claims:", error);
        throw error;
      }
    },
  },
});
