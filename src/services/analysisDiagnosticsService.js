import { doc, setDoc, serverTimestamp, collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { db } from './firebase.js';
import { getCurrentUser } from './authService.js';

const COLLECTION = 'analysisDiagnostics';

export const analysisDiagnosticsService = {
  async logSnapshot({
    ascentId,
    locationId = null,
    matchedImageId = null,
    matchedImageUrl = null,
    matchSummary = {},
    frames = [],
    scoreSummary = [],
    holdsSummary = {},
    userId: explicitUserId = null,
  }) {
    if (!ascentId) {
      console.warn('[analysisDiagnostics] Missing ascentId, skipping log');
      return;
    }

    const user = explicitUserId ? { uid: explicitUserId } : getCurrentUser();

    // Use ascentId as document ID to ensure one diagnostic per ascent
    const docRef = doc(db, COLLECTION, ascentId);
    const payload = {
      ascentId,
      userId: (explicitUserId || user?.uid) ?? null,
      locationId: locationId || null,
      updatedAt: serverTimestamp(),
      match: {
        matchedImageId: matchedImageId || null,
        matchedImageUrl: matchedImageUrl || null,
        matchId: matchSummary.matchId || null,
        totalMatches: matchSummary.totalMatches ?? null,
        matchCount: matchSummary.matchCount ?? null,
        homographyInliers: matchSummary.homographyInliers ?? null,
        homographyMatrixSource: matchSummary.matrixSource || null,
        serverQuality: matchSummary.serverQuality || null,
        matchVisualizationUrl: matchSummary.matchVisualizationUrl || null,
        combinedDebugUrl: matchSummary.combinedDebugUrl || null,
        localizedTransforms: matchSummary.localizedTransforms || [],
        localizedTransformsCounts: matchSummary.localizedTransformsCounts || [],
      },
      frames: frames || [],
      scores: scoreSummary || [],
      holdsSummary: {
        totalHolds: holdsSummary.totalHolds ?? null,
        matchedHoldIds: holdsSummary.matchedHoldIds || [],
        matchedProblemIds: holdsSummary.matchedProblemIds || [],
      },
    };

    // Use merge to preserve createdAt on updates, set it on first creation
    await setDoc(docRef, {
      ...payload,
      createdAt: serverTimestamp(), // Only set if document doesn't exist
    }, { merge: true });
  },

  async fetchLatest({ limitCount = 100, userId = null } = {}) {
    const baseRef = collection(db, COLLECTION);
    let q = query(baseRef, orderBy('createdAt', 'desc'), limit(limitCount));

    if (userId) {
      q = query(baseRef, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        reportType: 'analysis',
        timestamp: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null,
      };
    });
  },
};

export default analysisDiagnosticsService;
