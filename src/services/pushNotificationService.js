import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentUser } from './authService';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Check if Firebase Cloud Messaging is supported in this browser
 * iOS Safari and some other browsers don't support FCM even if they support Push API
 */
export async function isFCMSupported() {
  try {
    return await isSupported();
  } catch (error) {
    console.log('FCM not supported:', error);
    return false;
  }
}

/**
 * Request notification permission and get FCM token
 * Stores token in Firestore for the current user
 */
export async function requestNotificationPermission() {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.log('No user logged in, skipping notification permission request');
      return null;
    }

    // Check if Firebase Cloud Messaging is supported (iOS Safari doesn't support FCM)
    const fcmSupported = await isFCMSupported();
    if (!fcmSupported) {
      console.log('Firebase Cloud Messaging is not supported in this browser');
      return null;
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    // Check current permission
    if (Notification.permission === 'denied') {
      console.log('Notification permission was denied by user');
      return null;
    }

    // Request permission if not already granted
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission was not granted');
        return null;
      }
    }

    // Get FCM token
    try {
      const messaging = getMessaging();
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });
      
      if (token) {
        console.log('FCM token received:', token);
        
        // Store token in Firestore
        await saveFCMToken(user.uid, token);
        
        return token;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (messagingError) {
      console.error('FCM messaging error (browser may not support FCM):', messagingError);
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
}

    if (token) {
      console.log('FCM token received:', token);
      
      // Store token in Firestore
      await saveFCMToken(user.uid, token);
      
      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
}

/**
 * Save FCM token to Firestore
 * Idempotent: Same browser = same token = updates existing doc (merge: true)
 * Different browser = different token = new doc
 * Result: One token per browser/device (like WhatsApp Web)
 */
async function saveFCMToken(userId, token) {
  try {
    const tokenRef = doc(db, 'users', userId, 'fcmTokens', token);
    await setDoc(tokenRef, {
      token,
      createdAt: new Date(),
      lastUsed: new Date(),
    }, { merge: true }); // merge: true preserves createdAt if doc already exists
    console.log('FCM token saved to Firestore');
  } catch (error) {
    console.error('Error saving FCM token:', error);
    throw error;
  }
}

/**
 * Delete FCM token from Firestore
 */
export async function deleteFCMToken(userId, token) {
  try {
    const tokenRef = doc(db, 'users', userId, 'fcmTokens', token);
    await deleteDoc(tokenRef);
    console.log('FCM token deleted from Firestore');
  } catch (error) {
    console.error('Error deleting FCM token:', error);
  }
}

/**
 * Set up foreground message listener
 * This handles notifications when the app is in the foreground
 * NOTE: router is passed in to enable navigation on click
 */
export function setupForegroundMessageListener(router) {
  try {
    const messaging = getMessaging();
    
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show notification manually when app is in foreground
      if (payload.notification) {
        const notification = new Notification(payload.notification.title || 'New notification', {
          body: payload.notification.body,
          icon: payload.notification.icon || '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          data: payload.data,
          tag: payload.data?.locationId || 'default',
        });
        
        // Handle notification click
        notification.onclick = () => {
          console.log('[Foreground] Notification clicked:', payload.data);
          
          // Construct URL from notification data
          const url = payload.data?.url || 
                     (payload.data?.locationId ? `/location/${payload.data.locationId}` : '/');
          
          // Focus window and navigate using router
          window.focus();
          
          if (router) {
            router.push(url).catch(err => {
              console.error('[Foreground] Failed to navigate:', err);
            });
          }
          
          notification.close();
        };
      }
    });
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
  }
}

/**
 * Notify all users about new routesetting at a location
 * Calls Firebase Function to send notifications
 */
export async function notifyNewRoutesetting(locationId, locationName) {
  try {
    const notifyFunction = httpsCallable(functions, 'notifyNewRoutesetting');
    const result = await notifyFunction({
      locationId,
      locationName,
    });
    
    console.log('Notification sent:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error calling notifyNewRoutesetting function:', error);
    throw error;
  }
}
