import * as webPush from 'web-push';
import * as admin from 'firebase-admin';

let vapidConfigured = false;

/**
 * Configure web-push with VAPID keys (lazy initialization)
 * Uses FCM VAPID keys since Chrome/Firefox/Edge use FCM endpoints
 */
function ensureVapidConfigured() {
  if (vapidConfigured) return;
  
  // Use the same VAPID keys that frontend uses for subscription
  // Chrome/Firefox/Edge use FCM endpoints, so these should be FCM VAPID keys
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const contact = process.env.WEB_PUSH_CONTACT || 'mailto:support@topomatch.app';
  
  console.log('VAPID Debug Info:', {
    publicKeyExists: !!publicKey,
    publicKeyLength: publicKey?.length,
    publicKeyStartsWith: publicKey?.substring(0, 10),
    publicKeyHasEquals: publicKey?.includes('='),
    privateKeyExists: !!privateKey,
    privateKeyLength: privateKey?.length,
  });
  
  if (!publicKey || !privateKey) {
    console.warn('Web Push VAPID keys not configured. Notifications will not be sent.');
    return;
  }
  
  webPush.setVapidDetails(contact, publicKey, privateKey);
  vapidConfigured = true;
  console.log('Web Push configured with VAPID keys');
}

export interface WebPushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, any>;
}

/**
 * Send push notification to iOS/Android device using FCM
 */
async function sendCapacitorPushNotification(
  token: string,
  payload: WebPushNotificationPayload
): Promise<void> {
  try {
    await admin.messaging().send({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });
    console.log('Capacitor push notification sent successfully to token:', token.substring(0, 20) + '...');
  } catch (error) {
    console.error('Error sending Capacitor push notification:', error);
    throw error;
  }
}

/**
 * Send Web Push notification to a single subscription
 */
export async function sendWebPushNotification(
  subscription: webPush.PushSubscription,
  payload: WebPushNotificationPayload
): Promise<void> {
  ensureVapidConfigured();
  
  if (!vapidConfigured) {
    throw new Error('Web Push VAPID keys not configured');
  }
  
  try {
    const notificationPayload = JSON.stringify({
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/pwa-192x192.png',
      },
      data: payload.data || {},
    });

    await webPush.sendNotification(subscription, notificationPayload);
    console.log('Web Push notification sent successfully');
  } catch (error) {
    console.error('Error sending Web Push notification:', error);
    throw error;
  }
}

/**
 * Send Web Push notification to all subscriptions for a user
 */
export async function sendWebPushToUser(
  userId: string,
  payload: WebPushNotificationPayload
): Promise<{ success: number; failed: number }> {
  ensureVapidConfigured();
  
  if (!vapidConfigured) {
    console.warn('Web Push not configured, skipping');
    return { success: 0, failed: 0 };
  }
  
  const db = admin.firestore();
  let success = 0;
  let failed = 0;

  try {
    // Get all Web Push subscriptions for the user
    const subscriptionsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('webPushSubscriptions')
      .get();

    if (subscriptionsSnapshot.empty) {
      console.log(`No Web Push subscriptions found for user ${userId}`);
      return { success, failed };
    }

    // Send to all subscriptions
    const sendPromises = subscriptionsSnapshot.docs.map(async (doc) => {
      try {
        const subData = doc.data();
        const subscription: webPush.PushSubscription = {
          endpoint: subData.endpoint,
          keys: subData.keys,
        };

        await sendWebPushNotification(subscription, payload);
        
        // Update lastUsed timestamp
        await doc.ref.update({ lastUsed: admin.firestore.FieldValue.serverTimestamp() });
        
        success++;
      } catch (error) {
        console.error(`Failed to send Web Push to subscription ${doc.id}:`, error);
        failed++;
        
        // Delete invalid subscriptions (e.g., expired, revoked)
        if ((error as any)?.statusCode === 410) {
          console.log(`Deleting expired subscription ${doc.id}`);
          await doc.ref.delete();
        }
      }
    });

    await Promise.all(sendPromises);
    console.log(`Web Push sent to user ${userId}: ${success} success, ${failed} failed`);
    
    return { success, failed };
  } catch (error) {
    console.error(`Error sending Web Push to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Send Capacitor push notification to all iOS/Android tokens for a user
 */
export async function sendCapacitorPushToUser(
  userId: string,
  payload: WebPushNotificationPayload
): Promise<{ success: number; failed: number }> {
  const db = admin.firestore();
  let success = 0;
  let failed = 0;

  try {
    // Get all Capacitor push tokens for the user
    const tokensSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('pushTokens')
      .get();

    if (tokensSnapshot.empty) {
      console.log(`No Capacitor push tokens found for user ${userId}`);
      return { success, failed };
    }

    // Send to all tokens
    const sendPromises = tokensSnapshot.docs.map(async (doc) => {
      try {
        const tokenData = doc.data();
        const token = tokenData.token;

        await sendCapacitorPushNotification(token, payload);
        
        // Update lastUsed timestamp
        await doc.ref.update({ lastUsed: admin.firestore.FieldValue.serverTimestamp() });
        
        success++;
      } catch (error) {
        console.error(`Failed to send Capacitor push to token ${doc.id}:`, error);
        failed++;
        
        // Delete invalid tokens
        if ((error as any)?.code === 'messaging/registration-token-not-registered') {
          console.log(`Deleting invalid token ${doc.id}`);
          await doc.ref.delete();
        }
      }
    });

    await Promise.all(sendPromises);
    console.log(`Capacitor push sent to user ${userId}: ${success} success, ${failed} failed`);
    
    return { success, failed };
  } catch (error) {
    console.error(`Error sending Capacitor push to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Check if user has push notifications enabled
 */
async function isPushNotificationEnabled(userId: string): Promise<boolean> {
  const db = admin.firestore();
  
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`User ${userId} not found, skipping push notification`);
      return false;
    }
    
    const userData = userDoc.data();
    
    // Check if pushNotificationsEnabled field exists, default to false if not set
    const enabled = userData?.pushNotificationsEnabled ?? false;
    
    if (!enabled) {
      console.log(`Push notifications disabled for user ${userId}`);
    }
    
    return enabled;
  } catch (error) {
    console.error(`Error checking push notification preference for user ${userId}:`, error);
    return false; // Default to disabled on error
  }
}

/**
 * Send push notification to user on ALL platforms (web + iOS/Android)
 */
export async function sendPushToUser(
  userId: string,
  payload: WebPushNotificationPayload
): Promise<{ webSuccess: number; webFailed: number; capacitorSuccess: number; capacitorFailed: number }> {
  // Check if user has push notifications enabled
  const enabled = await isPushNotificationEnabled(userId);
  
  if (!enabled) {
    console.log(`Skipping push notification for user ${userId} (disabled by user preference)`);
    return {
      webSuccess: 0,
      webFailed: 0,
      capacitorSuccess: 0,
      capacitorFailed: 0,
    };
  }
  
  // Send to both web and mobile in parallel
  const [webResult, capacitorResult] = await Promise.all([
    sendWebPushToUser(userId, payload),
    sendCapacitorPushToUser(userId, payload),
  ]);

  console.log(`Push notification sent to user ${userId}:`, {
    web: webResult,
    capacitor: capacitorResult,
  });

  return {
    webSuccess: webResult.success,
    webFailed: webResult.failed,
    capacitorSuccess: capacitorResult.success,
    capacitorFailed: capacitorResult.failed,
  };
}

/**
 * Send push notification to multiple users on ALL platforms
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: WebPushNotificationPayload
): Promise<{ totalWebSuccess: number; totalWebFailed: number; totalCapacitorSuccess: number; totalCapacitorFailed: number }> {
  let totalWebSuccess = 0;
  let totalWebFailed = 0;
  let totalCapacitorSuccess = 0;
  let totalCapacitorFailed = 0;

  const sendPromises = userIds.map(async (userId) => {
    try {
      const result = await sendPushToUser(userId, payload);
      totalWebSuccess += result.webSuccess;
      totalWebFailed += result.webFailed;
      totalCapacitorSuccess += result.capacitorSuccess;
      totalCapacitorFailed += result.capacitorFailed;
    } catch (error) {
      console.error(`Error sending push to user ${userId}:`, error);
    }
  });

  await Promise.all(sendPromises);
  
  console.log(`Push batch complete:`, {
    web: { success: totalWebSuccess, failed: totalWebFailed },
    capacitor: { success: totalCapacitorSuccess, failed: totalCapacitorFailed },
  });
  
  return { totalWebSuccess, totalWebFailed, totalCapacitorSuccess, totalCapacitorFailed };
}
