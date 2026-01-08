/**
 * Global handler for deep links from push notifications
 * Stores pending route until app and router are ready
 */

let pendingRoute = null;
let routerInstance = null;

/**
 * Set the router instance for foreground navigation
 */
export function setRouter(router) {
  routerInstance = router;
}

/**
 * Store a route to navigate to after app mounts
 */
export function setPendingRoute(route) {
  console.log('[deepLinkHandler] Pending route set:', route);
  pendingRoute = route;
  
  // If router is available (app already mounted/foreground), navigate immediately
  if (routerInstance) {
    console.log('[deepLinkHandler] App in foreground, navigating immediately');
    routerInstance.replace(route);
    pendingRoute = null;
  }
}

/**
 * Get and clear the pending route
 */
export function consumePendingRoute() {
  const route = pendingRoute;
  pendingRoute = null;
  return route;
}

/**
 * Initialize push notification listener (called before app mounts)
 */
export function initPushNotificationListener() {
  if (!window.Capacitor?.isNativePlatform()) {
    return;
  }

  import('@capacitor-firebase/messaging').then(({ FirebaseMessaging }) => {
    // Listen for notification taps (app closed or background)
    FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      console.log('[deepLinkHandler] Push notification tapped:', event);
      
      const data = event.notification.data || {};
      if (data.url) {
        setPendingRoute(data.url);
      }
    });
    
    console.log('[deepLinkHandler] Push notification listener registered');
  }).catch(err => {
    console.log('[deepLinkHandler] Firebase Messaging not available:', err.message);
  });
}
