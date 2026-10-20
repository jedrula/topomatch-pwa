import { getFirestore } from "firebase-admin/firestore";
import { getStorage, getDownloadURL } from "firebase-admin/storage";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

/**
 * Climbing videos placed in a gym's 3D scan, started by the server (2026-10-21, boulder-map-view
 * docs/video-upload-background.md). The app's only job is getting the bytes into Storage - the phone may be locked
 * or the app killed by then. When videos/raw/{uid}/{ascentId}.{ext} lands and the ascent asks for it
 * (place3d: {jobId}), this posts the video to the GPU box, which places and names it; the app reads the progress
 * from the box.
 *
 * The box address comes from the location (splatGatewayUrl, admin-written), never from the ascent: the request
 * carries the shared secret. Idempotent: a repeated event for the same object generation posts nothing.
 */
export const placeVideoSecret = defineSecret("PLACE_VIDEO_SECRET");

const RETRY_WAITS_MS = [5_000, 20_000, 60_000]; // the box restarting, a tunnel blip

export async function requestPlacement(filePath: string, event: any): Promise<void> {
  try {
    const [, , uid, fileName] = filePath.split("/"); // videos/raw/{uid}/{ascentId}.{ext}
    const ascentId = fileName?.split(".")[0];
    if (!uid || !ascentId) return;

    const db = getFirestore();
    const ascentRef = db.collection("ascents").doc(ascentId);
    const ascent = (await ascentRef.get()).data();
    const jobId: unknown = ascent?.place3d?.jobId;
    if (!ascent || typeof jobId !== "string") return; // not a climb for the 3D scan
    const generation = String(event.data.generation ?? "");
    if (ascent.place3d.postedGeneration === generation) {
      logger.info(`place3d: ${ascentId} already posted`);
      return;
    }
    if (ascent.userId !== uid) {
      logger.warn(`place3d: ${ascentId} is not ${uid}'s ascent`);
      return;
    }

    const location = (await db.collection("locations").doc(String(ascent.locationId)).get()).data();
    const gateway: unknown = location?.splatGatewayUrl;
    const jobs = Object.values(location?.splatJobs ?? {}).flat();
    if (typeof gateway !== "string" || !jobs.includes(jobId)) {
      logger.warn(`place3d: ${ascentId} - job ${jobId} is not a scan of location ${ascent.locationId}`);
      return;
    }

    const url = await getDownloadURL(getStorage().bucket(event.data.bucket).file(filePath));
    const endpoint = `${gateway}/topowall/api/v1/video-to-splat/${encodeURIComponent(jobId)}/place-video`;
    for (let attempt = 0; ; attempt++) {
      try {
        const r = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Place-Video-Secret": placeVideoSecret.value() },
          body: JSON.stringify({ url, id: ascentId, uid, climber: ascent.userName ?? null }),
        });
        if (r.ok) break;
        // a 4xx is the request's fault (no 3D view, a bad id): asking again does not help
        if (r.status < 500 || attempt >= RETRY_WAITS_MS.length) {
          logger.error(`place3d: ${ascentId} -> box said ${r.status}: ${(await r.text()).slice(0, 300)}`);
          return;
        }
      } catch (err) {
        if (attempt >= RETRY_WAITS_MS.length) throw err;
      }
      await new Promise((res) => setTimeout(res, RETRY_WAITS_MS[attempt]));
    }
    await ascentRef.update({ "place3d.postedGeneration": generation, "place3d.postedAt": new Date() });
    logger.info(`place3d: ${ascentId} posted to ${jobId}`);
  } catch (err) {
    // never fail the rest of the upload's handling (transcoding) over the 3D placement
    logger.error(`place3d: ${filePath}`, err);
  }
}
