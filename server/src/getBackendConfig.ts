import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

const DETECTION_SERVER_URL = defineString("HOLD_DETECTION_SERVER_URL", {
  description: "URL of the hold detection server",
});

/**
 * Get backend configuration (admin only)
 * Returns environment variables and system status
 */
export const getBackendConfig = onCall(
  {
    region: "europe-west1",
  },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    // Check if user is admin
    if (!request.auth.token.admin) {
      throw new HttpsError(
        "permission-denied",
        "Only admins can view backend configuration"
      );
    }

    logger.info(`Admin ${request.auth.uid} requested backend config`);

    return {
      holdDetection: {
        serverUrl: DETECTION_SERVER_URL.value(),
        configured: !!DETECTION_SERVER_URL.value(),
      },
      region: "europe-west1",
      timestamp: new Date().toISOString(),
    };
  }
);
