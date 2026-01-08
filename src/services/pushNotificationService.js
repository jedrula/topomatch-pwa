import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentUser } from './authService';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Platform detection
const isCapacitor = !!window.Capacitor?.isNativePlatform();

/**
 * Check if standard Web Push is supported
 * Works in Chrome, Firefox, Edge, Safari (desktop and iOS in browser)
 */
export function isWebPushSupported() {
  return !isCapacitor && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Check if Capacitor Push Notifications are available
 * Works in Capacitor iOS/Android native apps
 */
function isCapacitorPushAvailable() {
  return isCapacitor;
}

/**
 * Request notification permission (shared by both FCM and Web Push)
 * Returns the permission status: 'granted', 'denied', or 'default'
 */
async function requestPermission() {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return null;
  }

  if (Notification.permission === 'denied') {
    console.log('Notification permission denied');
    return 'denied';
  }

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return 'granted';
}

/**
 * Request notification permission and set up push notifications
 * Automatically detects platform:
 * - Capacitor (iOS/Android): Uses native @capacitor/push-notifications
 * - Web: Uses standard Web Push API (works in all modern browsers)
 * Stores subscription/token in Firestore for the current user
 */
export async function requestNotificationPermission() {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.log('No user logged in, skipping notification permission request');
      return null;
    }

    // Capacitor native (iOS/Android)
    if (isCapacitorPushAvailable()) {
      console.log('Using Capacitor Push Notifications (native)');
      return await registerCapacitorPush(user.uid);
    }

    // Web Push (browser)
    if (isWebPushSupported()) {
      const permission = await requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission not granted');
        return null;
      }
      
      console.log('Using standard Web Push API');
      return await subscribeWebPush(user.uid);
    }

    console.log('Push notifications not supported in this environment');
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
}

/**
 * Subscribe to standard Web Push (all browsers)
 */
async function subscribeWebPush(userId) {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    // If subscription exists, unsubscribe first to allow resubscribing with new VAPID key
    if (subscription) {
      console.log('Unsubscribing old subscription before creating new one');
      await subscription.unsubscribe();
      subscription = null;
    }
    
    // Create new subscription using Web Push VAPID key
    // Works for all browsers (Chrome uses FCM endpoints, Safari uses its own)
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY),
    });
    
    console.log('Web Push subscription:', subscription);
    await saveWebPushSubscription(userId, subscription);
    return { type: 'webpush', subscription };
  } catch (error) {
    console.error('Web Push subscription error:', error);
    return null;
  }
}

/**
 * Register for Capacitor native push notifications (iOS/Android)
 * Uses @capacitor-firebase/messaging to get FCM tokens (works with Firebase Admin SDK)
 */
async function registerCapacitorPush(userId) {
  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    
    // Request permissions
    const permResult = await FirebaseMessaging.requestPermissions();
    
    if (permResult.receive !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }
    
    console.log('Push notification permission granted');
    
    // Get FCM token (works with Firebase Admin SDK)
    const result = await FirebaseMessaging.getToken();
    console.log('FCM token received:', result.token.substring(0, 30) + '...');
    await saveCapacitorToken(userId, result.token);
    
    // Listen for token refresh
    await FirebaseMessaging.addListener('tokenReceived', async (event) => {
      console.log('New FCM token received:', event.token.substring(0, 30) + '...');
      await saveCapacitorToken(userId, event.token);
    });
    
    // Listen for notifications received while app is in foreground
    await FirebaseMessaging.addListener('notificationReceived', (event) => {
      console.log('Push notification received:', event.notification);
    });
    
    // Listen for notification actions (when user taps notification)
    await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      console.log('Push notification action performed:', event.notification);
    });
    
    return { type: 'capacitor-firebase', token: result.token };
  } catch (error) {
    console.error('Capacitor Firebase Messaging registration error:', error);
    return null;
  }
}

/**
 * Save Capacitor push token to Firestore (FCM token)
 */
async function saveCapacitorToken(userId, token) {
  try {
    const tokenRef = doc(db, 'users', userId, 'pushTokens', token);
    await setDoc(tokenRef, {
      token,
      platform: isCapacitor ? (window.Capacitor.getPlatform()) : 'unknown',
      type: 'capacitor-firebase', // Using Firebase Messaging for FCM tokens
      createdAt: new Date(),
      lastUsed: new Date(),
    }, { merge: true });
    console.log('FCM token saved to Firestore');
  } catch (error) {
    console.error('Error saving Capacitor push token:', error);
    throw error;
  }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Save Web Push subscription to Firestore
 */
async function saveWebPushSubscription(userId, subscription) {
  try {
    const subscriptionData = subscription.toJSON();
    
    // Use a hash of the endpoint as the document ID to prevent duplicates
    // This ensures the same subscription always updates the same document
    const encoder = new TextEncoder();
    const data = encoder.encode(subscriptionData.endpoint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const subscriptionId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    
    const subRef = doc(db, 'users', userId, 'webPushSubscriptions', subscriptionId);
    await setDoc(subRef, {
      endpoint: subscriptionData.endpoint,
      keys: subscriptionData.keys,
      createdAt: new Date(),
      lastUsed: new Date(),
    }, { merge: true });
    
    console.log('Web Push subscription saved to Firestore');
  } catch (error) {
    console.error('Error saving Web Push subscription:', error);
    throw error;
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

// No need for foreground message listener with Web Push
// Service worker handles all notifications (foreground and background)

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
