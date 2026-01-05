import * as webPush from 'web-push';
import * as admin from 'firebase-admin';

let vapidConfigured = false;

/**
 * Configure web-push with VAPID keys (lazy initialization)
 */
function ensureVapidConfigured() {
  if (vapidConfigured) return;
  
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const contact = process.env.WEB_PUSH_CONTACT || 'mailto:support@topomatch.app';
  
  if (!publicKey || !privateKey) {
    console.warn('Web Push VAPID keys not configured. Web Push notifications will not be sent.');
    return;
  }
  
  webPush.setVapidDetails(contact, publicKey, privateKey);
  vapidConfigured = true;
  console.log('Web Push VAPID keys configured');
}

export interface WebPushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, any>;
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
 * Send Web Push to multiple users
 */
export async function sendWebPushToUsers(
  userIds: string[],
  payload: WebPushNotificationPayload
): Promise<{ totalSuccess: number; totalFailed: number }> {
  let totalSuccess = 0;
  let totalFailed = 0;

  const sendPromises = userIds.map(async (userId) => {
    try {
      const result = await sendWebPushToUser(userId, payload);
      totalSuccess += result.success;
      totalFailed += result.failed;
    } catch (error) {
      console.error(`Error sending Web Push to user ${userId}:`, error);
      // Count as failed if we can't even fetch subscriptions
      totalFailed++;
    }
  });

  await Promise.all(sendPromises);
  
  console.log(`Web Push batch complete: ${totalSuccess} success, ${totalFailed} failed`);
  return { totalSuccess, totalFailed };
}
