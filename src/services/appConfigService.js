import { db } from '@/services/firebase'
import { doc, getDoc, getDocFromServer, setDoc, serverTimestamp } from 'firebase/firestore'

const CONFIG_DOC = doc(db, 'app-config', 'backend')

let cachedHoldDetectionServerUrl = null
let cachedHoldDetectionAtMs = 0
let inFlightHoldDetectionPromise = null

let cachedClusterServerUrl = null
let cachedClusterAtMs = 0
let inFlightClusterPromise = null

const CACHE_TTL_MS = 5 * 60 * 1000

export async function getBackendAppConfig({ forceRefresh = false } = {}) {
  const snap = forceRefresh ? await getDocFromServer(CONFIG_DOC) : await getDoc(CONFIG_DOC)
  return snap.exists() ? snap.data() : null
}

export async function getHoldDetectionServerUrl({ forceRefresh = false } = {}) {
  const now = Date.now()

  if (!forceRefresh && cachedHoldDetectionServerUrl && now - cachedHoldDetectionAtMs < CACHE_TTL_MS) {
    return cachedHoldDetectionServerUrl
  }

  if (!forceRefresh && inFlightHoldDetectionPromise) {
    return inFlightHoldDetectionPromise
  }

  inFlightHoldDetectionPromise = (async () => {
    const data = await getBackendAppConfig({ forceRefresh: true })
    const url = data?.holdDetection?.serverUrl

    if (!url || typeof url !== 'string') {
      throw new Error(
        "Hold detection server URL not configured. Set 'app-config/backend.holdDetection.serverUrl' (use /admin/healthcheck)."
      )
    }

    cachedHoldDetectionServerUrl = url
    cachedHoldDetectionAtMs = Date.now()
    return url
  })()

  try {
    return await inFlightHoldDetectionPromise
  } finally {
    inFlightHoldDetectionPromise = null
  }
}

export async function setHoldDetectionServerUrl(serverUrl) {
  if (typeof serverUrl !== 'string' || !serverUrl.trim()) {
    throw new Error('Server URL is required')
  }

  const normalizedUrl = serverUrl.trim().replace(/\/+$/, '')

  await setDoc(
    CONFIG_DOC,
    {
      holdDetection: {
        serverUrl: normalizedUrl,
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

  await getDocFromServer(CONFIG_DOC)

  cachedHoldDetectionServerUrl = normalizedUrl
  cachedHoldDetectionAtMs = Date.now()
  inFlightHoldDetectionPromise = null

  return normalizedUrl
}

/**
 * Get the cluster server URL.
 * Falls back to the hold detection server URL if cluster.serverUrl is not set.
 */
export async function getClusterServerUrl({ forceRefresh = false } = {}) {
  const now = Date.now()

  if (!forceRefresh && cachedClusterServerUrl && now - cachedClusterAtMs < CACHE_TTL_MS) {
    return cachedClusterServerUrl
  }

  if (!forceRefresh && inFlightClusterPromise) {
    return inFlightClusterPromise
  }

  inFlightClusterPromise = (async () => {
    const data = await getBackendAppConfig({ forceRefresh: true })
    // Fall back to holdDetection.serverUrl if cluster.serverUrl is not configured
    const url = data?.cluster?.serverUrl || data?.holdDetection?.serverUrl

    if (!url || typeof url !== 'string') {
      throw new Error(
        "Cluster server URL not configured. Set 'app-config/backend.cluster.serverUrl' (use /admin/healthcheck)."
      )
    }

    cachedClusterServerUrl = url
    cachedClusterAtMs = Date.now()
    return url
  })()

  try {
    return await inFlightClusterPromise
  } finally {
    inFlightClusterPromise = null
  }
}

export async function setClusterServerUrl(serverUrl) {
  const normalizedUrl = typeof serverUrl === 'string' ? serverUrl.trim().replace(/\/+$/, '') : ''

  await setDoc(
    CONFIG_DOC,
    {
      cluster: {
        serverUrl: normalizedUrl || null,
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

  await getDocFromServer(CONFIG_DOC)

  cachedClusterServerUrl = normalizedUrl
  cachedClusterAtMs = Date.now()
  inFlightClusterPromise = null

  return normalizedUrl
}
