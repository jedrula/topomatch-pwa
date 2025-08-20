import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
  }

  // Listen for auth state changes
  onAuthStateChanged(callback) {
    this.authListeners.push(callback);
    return onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;

      if (user) {
        // Fetch custom claims and attach them to the user object
        try {
          const claims = await this.getUserClaims(user);
          const userWithClaims = { ...user, customClaims: claims };
          callback(userWithClaims);
        } catch (error) {
          console.error('Error fetching user claims:', error);
          // Still call callback with user, just without claims
          callback(user);
        }
      } else {
        callback(null);
      }
    });
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;

      // Fetch custom claims and attach them
      const claims = await this.getUserClaims(userCredential.user);
      const userWithClaims = { ...userCredential.user, customClaims: claims };

      return userWithClaims;
    } catch (error) {
      console.error('Sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign up with email and password
  async signUp(email, password, displayName = null) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;

      // Update display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      // Fetch custom claims and attach them (new users won't have admin claims yet)
      const claims = await this.getUserClaims(userCredential.user);
      const userWithClaims = { ...userCredential.user, customClaims: claims };

      return userWithClaims;
    } catch (error) {
      console.error('Sign up error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign out
  async signOut() {
    try {
      await firebaseSignOut(auth);
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Handle Firebase auth errors with user-friendly messages
  handleAuthError(error) {
    const friendlyMessages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
    };

    return new Error(friendlyMessages[error.code] || 'Authentication failed. Please try again.');
  }

  // Check if user is admin using custom claims
  isAdmin(user = null) {
    const currentUser = user || this.currentUser;
    if (!currentUser) return false;

    // Check custom claims for admin role
    return currentUser.customClaims?.admin === true;
  }

  // Get user's custom claims (includes admin status)
  async getUserClaims(user = null) {
    const currentUser = user || this.currentUser;
    if (!currentUser) return null;

    try {
      const idTokenResult = await currentUser.getIdTokenResult();
      return idTokenResult.claims;
    } catch (error) {
      console.error('Error getting user claims:', error);
      return null;
    }
  }

  // Refresh user token to get updated claims
  async refreshUserToken() {
    if (!this.currentUser) return null;

    try {
      await this.currentUser.getIdToken(true); // Force refresh
      return await this.getUserClaims();
    } catch (error) {
      console.error('Error refreshing user token:', error);
      return null;
    }
  }
}

export const authService = new AuthService();

// Legacy export for compatibility
export const getCurrentUser = () => authService.getCurrentUser();
