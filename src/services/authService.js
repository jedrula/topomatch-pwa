import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from './firebase.js';
import { doc, setDoc } from 'firebase/firestore';

const isCapacitor = window.Capacitor !== undefined;

// Import Capacitor plugin statically if in Capacitor
let FirebaseAuthPlugin = null;
if (isCapacitor) {
  // Static import - this will be tree-shaken out in web builds
  const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
  FirebaseAuthPlugin = FirebaseAuthentication;
  console.log('[authService] Firebase Authentication plugin loaded');
}

// Platform adapter - abstracts Capacitor vs Web SDK differences
const authAdapter = {
  async signIn(email, password) {
    if (isCapacitor) {
      console.log('[authAdapter] Signing in with Capacitor plugin');
      if (!FirebaseAuthPlugin) {
        throw new Error('Firebase Authentication plugin not loaded');
      }
      
      try {
        console.log('[authAdapter] Calling signInWithEmailAndPassword...');
        const result = await FirebaseAuthPlugin.signInWithEmailAndPassword({ email, password });
        console.log('[authAdapter] Sign in successful, user:', result.user);
        return result.user;
      } catch (error) {
        console.error('[authAdapter] Sign in failed:', error);
        throw error;
      }
    }
    console.log('[authAdapter] Signing in with Firebase SDK');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  async signUp(email, password) {
    if (isCapacitor) {
      if (!FirebaseAuthPlugin) {
        throw new Error('Firebase Authentication plugin not loaded');
      }
      const result = await FirebaseAuthPlugin.createUserWithEmailAndPassword({ email, password });
      return result.user;
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  async signOut() {
    if (isCapacitor) {
      if (!FirebaseAuthPlugin) {
        throw new Error('Firebase Authentication plugin not loaded');
      }
      await FirebaseAuthPlugin.signOut();
    } else {
      await firebaseSignOut(auth);
    }
  },

  async getCurrentUser() {
    if (isCapacitor) {
      try {
        if (!FirebaseAuthPlugin) {
          throw new Error('Firebase Authentication plugin not loaded');
        }
        const result = await FirebaseAuthPlugin.getCurrentUser();
        return result.user;
      } catch (error) {
        console.error('[authAdapter] Error getting current user:', error);
        return null;
      }
    }
    return auth.currentUser;
  },

  async getIdToken(forceRefresh = false) {
    if (isCapacitor) {
      if (!FirebaseAuthPlugin) {
        throw new Error('Firebase Authentication plugin not loaded');
      }
      const result = await FirebaseAuthPlugin.getIdToken({ forceRefresh });
      return result.token;
    }
    return auth.currentUser?.getIdToken(forceRefresh);
  },
};

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
  }

  // Helper to attach claims to user
  async _attachClaims(user) {
    if (!user) return null;
    try {
      const claims = await this.getUserClaims(user);
      return { ...user, customClaims: claims };
    } catch (error) {
      console.error('Error fetching user claims:', error);
      return user;
    }
  }

  // Listen for auth state changes
  onAuthStateChanged(callback) {
    this.authListeners.push(callback);
    
    const handleAuthChange = async (user) => {
      this.currentUser = user;
      const userWithClaims = await this._attachClaims(user);
      callback(userWithClaims);
    };
    
    if (isCapacitor) {
      if (!FirebaseAuthPlugin) {
        console.error('[authService] Firebase Authentication plugin not loaded yet');
        callback(null);
        return;
      }
      
      FirebaseAuthPlugin.addListener('authStateChange', (change) => {
        console.log('[authService] Auth state changed (Capacitor):', change);
        handleAuthChange(change.user);
      });
      console.log('[authService] Auth state listener registered');
      
      // Get initial auth state
      FirebaseAuthPlugin.getCurrentUser().then(result => {
        if (result.user) {
          console.log('[authService] Initial user found:', result.user);
          handleAuthChange(result.user);
        } else {
          console.log('[authService] No initial user');
          callback(null);
        }
      }).catch(error => {
        console.error('[authService] Error getting initial user:', error);
        callback(null);
      });
    } else {
      return onAuthStateChanged(auth, handleAuthChange);
    }
  }

  // Get current user
  async getCurrentUser() {
    return authAdapter.getCurrentUser();
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const user = await authAdapter.signIn(email, password);
      this.currentUser = user;
      return this._attachClaims(user);
    } catch (error) {
      console.error('Sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign up with email and password
  async signUp(email, password, displayName = null) {
    try {
      const user = await authAdapter.signUp(email, password);
      this.currentUser = user;

      // Create user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        displayName: displayName || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return this._attachClaims(user);
    } catch (error) {
      console.error('Sign up error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign out
  async signOut() {
    try {
      await authAdapter.signOut();
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
      const token = await authAdapter.getIdToken(false);
      if (isCapacitor) {
        // Parse JWT token to get claims
        const tokenParts = token.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        return payload;
      } else {
        const idTokenResult = await currentUser.getIdTokenResult();
        return idTokenResult.claims;
      }
    } catch (error) {
      console.error('Error getting user claims:', error);
      return null;
    }
  }

  // Refresh user token to get updated claims
  async refreshUserToken() {
    if (!this.currentUser) return null;

    try {
      await authAdapter.getIdToken(true);
      return this.getUserClaims();
    } catch (error) {
      console.error('Error refreshing user token:', error);
      return null;
    }
  }
}

export const authService = new AuthService();

// Legacy export for compatibility - returns cached user synchronously
export const getCurrentUser = () => authService.currentUser;
