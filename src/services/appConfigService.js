import { db } from '@/services/firebase'
import { doc, getDoc, getDocFromServer, setDoc, serverTimestamp } from 'firebase/firestore'

const CONFIG_DOC = doc(db, 'app-config', 'backend')

let cachedHoldDetectionServerUrl = null
let cachedAtMs = 0
let inFlightPromise = null

const CACHE_TTL_MS = 5 * 60 * 1000

export async function getBackendAppConfig({ forceRefresh = false } = {}) {
  const snap = forceRefresh ? await getDocFromServer(CONFIG_DOC) : await getDoc(CONFIG_DOC)
  return snap.exists() ? snap.data() : null
}

export async function getHoldDetectionServerUrl({ forceRefresh = false } = {}) {
  const now = Date.now()

  if (!forceRefresh && cachedHoldDetectionServerUrl && now - cachedAtMs < CACHE_TTL_MS) {
    return cachedHoldDetectionServerUrl
  }

  if (!forceRefresh && inFlightPromise) {
    return inFlightPromise
  }

  inFlightPromise = (async () => {
    const data = await getBackendAppConfig({ forceRefresh: true })
    const url = data?.holdDetection?.serverUrl

    if (!url || typeof url !== 'string') {
      throw new Error(
        "Hold detection server URL not configured. Set 'app-config/backend.holdDetection.serverUrl' (use /admin/healthcheck)."
      )
    }

    cachedHoldDetectionServerUrl = url
    cachedAtMs = Date.now()
    return url
  })()

  try {
    return await inFlightPromise
  } finally {
    inFlightPromise = null
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

  // Ensure the write reached the server (avoids "saved but not committed yet" confusion)
  await getDocFromServer(CONFIG_DOC)

  cachedHoldDetectionServerUrl = normalizedUrl
  cachedAtMs = Date.now()
  inFlightPromise = null

  return normalizedUrl
}
