import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getHoldDetectionServerUrl } from "./services/appConfig";

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

    let serverUrl: string | null = null;
    try {
      serverUrl = await getHoldDetectionServerUrl({ forceRefresh: true });
    } catch (error) {
      serverUrl = null;
    }

    return {
      holdDetection: {
        serverUrl,
        configured: !!serverUrl,
      },
      region: "europe-west1",
      timestamp: new Date().toISOString(),
    };
  }
);
