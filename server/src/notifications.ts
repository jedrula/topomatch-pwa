import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import * as logger from "firebase-functions/logger";

const REGION = "europe-west1";

/**
 * Send push notification to all users about new routesetting at a location
 * In future, this will be filtered to only users following the location
 */
export const notifyNewRoutesetting = onCall(
  {region: REGION},
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
      // Get all FCM tokens from all users
      // TODO: In the future, filter by users following this location
      const usersSnapshot = await db.collection("users").get();

      const tokens: string[] = [];

      // Collect all tokens from all users
      for (const userDoc of usersSnapshot.docs) {
        const tokensSnapshot = await db
          .collection("users")
          .doc(userDoc.id)
          .collection("fcmTokens")
          .get();

        tokensSnapshot.docs.forEach((tokenDoc) => {
          tokens.push(tokenDoc.data().token);
        });
      }

      logger.info(`Found ${tokens.length} FCM tokens`);

      if (tokens.length === 0) {
        return {
          success: true,
          message: "No users to notify",
          sent: 0,
        };
      }

      // Prepare the notification message
      const message = {
        notification: {
          title: "🧗 New Routesetting!",
          body: `Fresh problems are now up at ${locationName}!`,
        },
        data: {
          locationId: locationId,
          type: "new-routesetting",
          url: `/location/${locationId}`,
        },
        // Web-specific options (icon goes here, not in notification)
        webpush: {
          notification: {
            icon: "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
          },
        },
        // Android-specific options
        android: {
          priority: "high" as const,
          notification: {
            channelId: "routesetting-updates",
            priority: "high" as const,
            defaultSound: true,
            defaultVibrateTimings: true,
            icon: "/pwa-192x192.png",
          },
        },
        // iOS-specific options
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      // Send notifications in batches (FCM limit is 500 per batch)
      const batchSize = 500;
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);

        try {
          const response = await getMessaging().sendEachForMulticast({
            tokens: batch,
            ...message,
          });

          successCount += response.successCount;
          failureCount += response.failureCount;

          // Log any failures
          if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                logger.warn(
                  `Failed to send to token ${batch[idx]}: ${resp.error?.message}`
                );

                // Clean up invalid tokens
                if (
                  resp.error?.code === "messaging/invalid-registration-token" ||
                  resp.error?.code === "messaging/registration-token-not-registered"
                ) {
                  // TODO: Delete invalid token from Firestore
                  logger.info(`Marking token for cleanup: ${batch[idx]}`);
                }
              }
            });
          }
        } catch (error) {
          logger.error(`Error sending batch: ${error}`);
          failureCount += batch.length;
        }
      }

      logger.info(
        `Notification sent - Success: ${successCount}, Failed: ${failureCount}`
      );

      return {
        success: true,
        sent: successCount,
        failed: failureCount,
        total: tokens.length,
      };
    } catch (error) {
      logger.error("Error sending notifications:", error);
      throw new HttpsError("internal", "Failed to send notifications");
    }
  }
);
