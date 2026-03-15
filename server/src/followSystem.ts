import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

const REGION = "europe-west1";

export const toggleFollow = onCall({region: REGION}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  const {targetUserId} = request.data as {targetUserId?: string};
  if (!targetUserId) {
    throw new HttpsError("invalid-argument", "targetUserId is required");
  }
  if (request.auth.uid === targetUserId) {
    throw new HttpsError("invalid-argument", "Cannot follow yourself");
  }

  const db = getFirestore();
  const docId = `${request.auth.uid}_${targetUserId}`;
  const ref = db.collection("follows").doc(docId);

  const isFollowing = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      tx.delete(ref);
      return false;
    } else {
      tx.set(ref, {
        followerId: request.auth!.uid,
        followeeId: targetUserId,
        createdAt: FieldValue.serverTimestamp(),
      });
      return true;
    }
  });

  return {isFollowing};
});

export const getFollowData = onCall({region: REGION}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  const userId = (request.data as {userId?: string}).userId;
  if (!userId) {
    throw new HttpsError("invalid-argument", "userId is required");
  }

  const db = getFirestore();
  const [followerSnap, followingSnap] = await Promise.all([
    db.collection("follows").where("followeeId", "==", userId).get(),
    db.collection("follows").where("followerId", "==", userId).get(),
  ]);

  const followerUids = followerSnap.docs.map((d) => d.data().followerId as string);
  const followingUids = followingSnap.docs.map((d) => d.data().followeeId as string);

  const allUids = [...new Set([...followerUids, ...followingUids])];
  const userDocs = allUids.length > 0
    ? await Promise.all(allUids.map((uid) => db.collection("users").doc(uid).get()))
    : [];

  const userMap = new Map(userDocs.map((d) => [d.id, d.data()]));
  const toSummary = (uid: string) => ({
    uid,
    displayName: userMap.get(uid)?.displayName ?? "",
    photoURL: userMap.get(uid)?.photoURL ?? null,
  });

  return {
    followers: followerUids.map(toSummary),
    following: followingUids.map(toSummary),
  };
});

export const getFollowCounts = onCall({region: REGION}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  const {userId} = request.data as {userId?: string};
  if (!userId) {
    throw new HttpsError("invalid-argument", "userId is required");
  }

  const db = getFirestore();
  const [followerSnap, followingSnap] = await Promise.all([
    db.collection("follows").where("followeeId", "==", userId).count().get(),
    db.collection("follows").where("followerId", "==", userId).count().get(),
  ]);

  return {
    followersCount: followerSnap.data().count,
    followingCount: followingSnap.data().count,
  };
});
