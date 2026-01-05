// Firebase Cloud Messaging Service Worker
// This runs in the background to receive push notifications
// Also handles standard Web Push for Safari/iOS

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase app in the service worker
// These values MUST match your Firebase config in firebase.js
firebase.initializeApp({
  projectId: 'topomatch-pwa',
  appId: '1:592023645230:web:0de421f7ba777652ef43bf',
  storageBucket: 'topomatch-pwa.firebasestorage.app',
  apiKey: 'AIzaSyD2LND6HuSMwEFL70ke48mJczTP5uScMW0',
  authDomain: 'topomatch-pwa.firebaseapp.com',
  messagingSenderId: '592023645230',
});

// ONLY handle standard Web Push - unified for all browsers
// Don't use FCM's onBackgroundMessage to avoid duplicate handlers
// FCM will still deliver via standard push events

// Handle standard Web Push messages (works for both FCM and Safari Web Push)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Received standard push event:', event);
  
  try {
    // Parse the push payload
    const data = event.data ? event.data.json() : {};
    console.log('[firebase-messaging-sw.js] Push data:', data);
    
    const notificationTitle = data.notification?.title || data.title || 'New notification';
    const notificationOptions = {
      body: data.notification?.body || data.body || '',
      icon: data.notification?.icon || data.icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: data.data || data,
      tag: data.data?.locationId || data.locationId || 'default',
      requireInteraction: false,
    };
    
    console.log('[firebase-messaging-sw.js] Showing notification:', notificationTitle, notificationOptions);
    
    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error handling push event:', error);
    // Show a fallback notification to prevent unsubscription
    event.waitUntil(
      self.registration.showNotification('New notification', {
        body: 'You have a new notification',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Get target URL from notification data
  const locationId = event.notification.data?.locationId;
  const dataUrl = event.notification.data?.url;
  
  // Construct full URL
  const targetUrl = dataUrl 
    ? `${self.location.origin}${dataUrl}`
    : locationId
      ? `${self.location.origin}/location/${locationId}`
      : self.location.origin;

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      
      // Check if any window from our origin is open
      for (const client of allClients) {
        if (client.url.startsWith(self.location.origin)) {
          // Focus window and send message to navigate
          await client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: dataUrl || `/location/${locationId}` || '/'
          });
          return;
        }
      }
      
      // No existing window - open new one
      await clients.openWindow(targetUrl);
    })()
  );
});
