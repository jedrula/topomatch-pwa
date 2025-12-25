import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const REGION = "europe-west1";

/**
 * Toggle like on an ascent
 * Adds/removes userId from likedByUserIds array and updates likeCount
 * 
 * Future: Will also create notification when someone likes your video
 */
export const toggleLike = onCall(
  {region: REGION},
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const {ascentId} = request.data;
    const userId = request.auth.uid;

    if (!ascentId) {
      throw new HttpsError("invalid-argument", "ascentId is required");
    }

    const db = getFirestore();
    const ascentRef = db.collection("ascents").doc(ascentId);

    try {
      // Get current ascent data
      const ascentDoc = await ascentRef.get();

      if (!ascentDoc.exists) {
        throw new HttpsError("not-found", "Ascent not found");
      }

      const ascentData = ascentDoc.data();
      
      if (!ascentData) {
        throw new HttpsError("not-found", "Ascent data not found");
      }
      
      const likedByUserIds = ascentData.likedByUserIds || [];
      const isCurrentlyLiked = likedByUserIds.includes(userId);

      if (isCurrentlyLiked) {
        // Unlike: remove userId from array and decrement count
        await ascentRef.update({
          likedByUserIds: FieldValue.arrayRemove(userId),
          likeCount: FieldValue.increment(-1),
        });

        logger.info(`User ${userId} unliked ascent ${ascentId}`);

        return {
          liked: false,
          likeCount: Math.max(0, (ascentData.likeCount || 0) - 1),
        };
      } else {
        // Like: add userId to array and increment count
        await ascentRef.update({
          likedByUserIds: FieldValue.arrayUnion(userId),
          likeCount: FieldValue.increment(1),
        });

        logger.info(`User ${userId} liked ascent ${ascentId}`);

        // TODO: Create notification for ascent owner
        // const ascentOwnerId = ascentData.userId;
        // if (ascentOwnerId && ascentOwnerId !== userId) {
        //   await db.collection("notifications").add({
        //     type: "like",
        //     recipientUserId: ascentOwnerId,
        //     actorUserId: userId,
        //     ascentId: ascentId,
        //     createdAt: FieldValue.serverTimestamp(),
        //     read: false,
        //   });
        // }

        return {
          liked: true,
          likeCount: (ascentData.likeCount || 0) + 1,
        };
      }
    } catch (error) {
      logger.error("Error toggling like:", error);
      throw new HttpsError("internal", "Failed to toggle like");
    }
  }
);
