import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {sendWebPushToUsers} from "./services/webPushService";

const REGION = "europe-west1";

// Define secrets for Web Push VAPID keys
// Chrome/Firefox/Edge use FCM endpoints, so we use FCM VAPID keys here
const webPushVapidPublicKey = defineSecret("WEB_PUSH_VAPID_PUBLIC_KEY");
const webPushVapidPrivateKey = defineSecret("WEB_PUSH_VAPID_PRIVATE_KEY");

/**
 * Send push notification to all users about new routesetting at a location
 * In future, this will be filtered to only users following the location
 */
export const notifyNewRoutesetting = onCall(
  {
    region: REGION,
    secrets: [webPushVapidPublicKey, webPushVapidPrivateKey],
  },
  async (request) => {
    const db = getFirestore();
    
    // Check authentication
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to send notifications"
      );
    }

    // Check admin permission
    const callerUid = request.auth.uid;
    const userDoc = await db.collection("users").doc(callerUid).get();
    const isAdmin = userDoc.data()?.isAdmin === true;

    if (!isAdmin) {
      throw new HttpsError(
        "permission-denied",
        "Only admins can send routesetting notifications"
      );
    }

    const {locationId, locationName} = request.data;

    if (!locationId || !locationName) {
      throw new HttpsError(
        "invalid-argument",
        "locationId and locationName are required"
      );
    }

    logger.info(`Sending routesetting notification for location: ${locationName}`);

    try {
      // Get all users
      // TODO: In the future, filter by users following this location
      const usersSnapshot = await db.collection("users").get();
      const userIds = usersSnapshot.docs.map((doc) => doc.id);

      // Prepare notification payload
      const notificationPayload = {
        title: "🧗 New Routesetting!",
        body: `Fresh problems are now up at ${locationName}!`,
        icon: "/pwa-192x192.png",
        data: {
          locationId: locationId,
          type: "new-routesetting",
          url: `/location/${locationId}`,
        },
      };

      // Send Web Push notifications (all browsers)
      logger.info(`Sending Web Push to ${userIds.length} users`);
      const webPushResults = await sendWebPushToUsers(userIds, notificationPayload);
      logger.info(`Web Push: ${webPushResults.totalSuccess} success, ${webPushResults.totalFailed} failed`);

      return {
        success: true,
        sent: webPushResults.totalSuccess,
        failed: webPushResults.totalFailed,
        total: userIds.length,
      };
    } catch (error) {
      logger.error("Error sending notifications:", error);
      throw new HttpsError("internal", "Failed to send notifications");
    }
  }
);
