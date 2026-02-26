import { getFirestore } from 'firebase-admin/firestore'

const CONFIG_DOC_PATH = 'app-config/backend'

let cachedHoldDetectionServerUrl: string | null = null
let cachedAtMs = 0

const CACHE_TTL_MS = 60 * 1000

export async function getHoldDetectionServerUrl({ forceRefresh = false } = {}) {
  const now = Date.now()

  if (!forceRefresh && cachedHoldDetectionServerUrl && now - cachedAtMs < CACHE_TTL_MS) {
    return cachedHoldDetectionServerUrl
  }

  const db = getFirestore()
  const snap = await db.doc(CONFIG_DOC_PATH).get()

  const url = snap.get('holdDetection.serverUrl')

  if (!url || typeof url !== 'string') {
    throw new Error(`Hold detection server URL not configured in Firestore at ${CONFIG_DOC_PATH}.holdDetection.serverUrl`)
  }

  const normalizedUrl = url.trim().replace(/\/+$/, '')

  cachedHoldDetectionServerUrl = normalizedUrl
  cachedAtMs = Date.now()

  return normalizedUrl
}
