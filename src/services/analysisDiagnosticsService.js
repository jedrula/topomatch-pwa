import { doc, setDoc, serverTimestamp, collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { db } from './firebase.js';
import { getCurrentUser } from './authService.js';

const COLLECTION = 'analysisDiagnostics';

const toNumber = (value) => (typeof value === 'number' ? Number(value.toFixed(2)) : null);

const sanitizePoint = (point) => {
  if (!point) return null;
  return {
    name: point.name || point.type || null,
    x: toNumber(point.x),
    y: toNumber(point.y),
    confidence: typeof point.confidence === 'number' ? Number(point.confidence.toFixed(2)) : null,
  };
};

const sanitizeHold = (hold) => {
  if (!hold) return null;
  const centerX = hold.centerX ?? hold.centerPoint?.x ?? null;
  const centerY = hold.centerY ?? hold.centerPoint?.y ?? null;
  const width = hold.width ?? hold.boundingWidth ?? hold.bounds?.width ?? null;
  const height = hold.height ?? hold.boundingHeight ?? hold.bounds?.height ?? null;
  return {
    id: hold.id || hold.holdId || null,
    centerX: toNumber(centerX ?? null),
    centerY: toNumber(centerY ?? null),
    width: toNumber(width ?? null),
    height: toNumber(height ?? null),
    color: hold.color || hold.hexColor || null,
    source: hold.source || hold.type || null,
  };
};

const sanitizeProblem = (problem) => {
  if (!problem) return null;
  return {
    id: problem.id || problem.problemId || null,
    name: problem.name || null,
    grade: problem.grade || null,
    color: problem.color || null,
  };
};

const sanitizeKeypointRows = (rows = []) => rows.map((row) => ({
  name: row.name,
  confidence: typeof row.confidence === 'number' ? Number(row.confidence.toFixed(2)) : null,
  distanceToHold: typeof row.distanceToHold === 'number' ? Math.round(row.distanceToHold) : null,
  closestScore: typeof row.closestScore === 'number' ? Number(row.closestScore.toFixed(3)) : null,
  closestHold: sanitizeHold(row.closestHold),
  secondClosestHold: sanitizeHold(row.secondClosestHold),
  thirdClosestHold: sanitizeHold(row.thirdClosestHold),
  closestProblem: sanitizeProblem(row.closestProblem),
  secondClosestProblem: sanitizeProblem(row.secondClosestProblem),
  thirdClosestProblem: sanitizeProblem(row.thirdClosestProblem),
}));

const sanitizePoints = (points = []) => points.map(sanitizePoint).filter(Boolean);

export const analysisDiagnosticsService = {
  async logSnapshot({
    ascentId,
    locationId = null,
    bestFrameIndex = null,
    frameDimensions = null,
    poseConfidence = null,
    matchedImageId = null,
    matchedImageUrl = null,
    matchSummary = {},
    transformedKeypoints = {},
    keypointRows = [],
    scoreSummary = [],
    holdsSummary = {},
    userId: explicitUserId = null,
  }) {
    if (!ascentId) {
      console.warn('[analysisDiagnostics] Missing ascentId, skipping log');
      return;
    }

    const user = explicitUserId ? { uid: explicitUserId } : getCurrentUser();

    const docRef = doc(db, COLLECTION, ascentId);
    const payload = {
      ascentId,
      userId: (explicitUserId || user?.uid) ?? null,
      locationId: locationId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      bestFrame: {
        index: typeof bestFrameIndex === 'number' ? bestFrameIndex : null,
        ...(frameDimensions || {}),
        poseConfidence: typeof poseConfidence === 'number' ? Number(poseConfidence.toFixed(3)) : null,
      },
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
      },
      keypoints: {
        video: sanitizePoints(transformedKeypoints.original || []),
        image: sanitizePoints(transformedKeypoints.image || []),
      },
      keypointRows: sanitizeKeypointRows(keypointRows),
      scores: scoreSummary || [],
      holdsSummary: {
        totalHolds: holdsSummary.totalHolds ?? null,
        matchedHoldIds: holdsSummary.matchedHoldIds || [],
        matchedProblemIds: holdsSummary.matchedProblemIds || [],
      },
    };

    await setDoc(docRef, payload);
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
