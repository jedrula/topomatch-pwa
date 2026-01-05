// Web Push Service Worker
// Handles standard Web Push notifications for all browsers
// Works in Chrome, Firefox, Edge, Safari (desktop and iOS)

// Handle standard Web Push messages
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Received standard push event:', event);
  console.log('[firebase-messaging-sw.js] Notification permission:', Notification.permission);
  
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
        .then(() => console.log('[firebase-messaging-sw.js] Notification shown successfully'))
        .catch(error => console.error('[firebase-messaging-sw.js] Error showing notification:', error))
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
