import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentUser } from './authService';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Detect if browser is Safari (including iOS)
 */
function isSafari() {
  const ua = navigator.userAgent;
  const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  return isSafariBrowser || isIOS;
}

/**
 * Check if Firebase Cloud Messaging is supported in this browser
 * iOS Safari and some other browsers don't support FCM even if they support Push API
 * Explicitly exclude Safari since FCM doesn't work there even if isSupported() returns true
 */
export async function isFCMSupported() {
  // Safari doesn't support FCM, force Web Push instead
  if (isSafari()) {
    console.log('Safari detected - FCM not supported, will use Web Push');
    return false;
  }
  
  try {
    return await isSupported();
  } catch (error) {
    console.log('FCM not supported:', error);
    return false;
  }
}

/**
 * Check if standard Web Push is supported (Safari/iOS)
 */
export function isWebPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
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
 * Automatically uses FCM (Chrome/Firefox/Edge) or Web Push (Safari/iOS)
 * Stores token/subscription in Firestore for the current user
 */
export async function requestNotificationPermission() {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.log('No user logged in, skipping notification permission request');
      return null;
    }

    // Request permission first (shared by both methods)
    const permission = await requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    // Try FCM first (Chrome/Firefox/Edge)
    const fcmSupported = await isFCMSupported();
    if (fcmSupported) {
      console.log('Using Firebase Cloud Messaging');
      return await subscribeFCM(user.uid);
    }

    // Fall back to Web Push (Safari/iOS)
    if (isWebPushSupported()) {
      console.log('Using standard Web Push (Safari/iOS)');
      return await subscribeWebPush(user.uid);
    }

    console.log('No push notification method available');
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
}

/**
 * Subscribe to Firebase Cloud Messaging (Chrome/Firefox/Edge)
 */
async function subscribeFCM(userId) {
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    
    if (token) {
      console.log('FCM token received:', token);
      await saveFCMToken(userId, token);
      return { type: 'fcm', token };
    }
    
    console.log('No FCM token available');
    return null;
  } catch (error) {
    console.error('FCM subscription error:', error);
    return null;
  }
}

/**
 * Subscribe to standard Web Push (Safari/iOS)
 */
async function subscribeWebPush(userId) {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY),
      });
    }
    
    console.log('Web Push subscription:', subscription);
    await saveWebPushSubscription(userId, subscription);
    return { type: 'webpush', subscription };
  } catch (error) {
    console.error('Web Push subscription error:', error);
    return null;
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
