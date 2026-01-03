// Firebase Cloud Messaging Service Worker
// This runs in the background to receive push notifications

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

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: payload.data || {},
    tag: payload.data?.locationId || 'default', // Group notifications by location
    requireInteraction: false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
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
