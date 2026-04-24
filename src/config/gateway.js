/**
 * Returns the base gateway URL (port 8000 / ngrok root).
 * ngrok tunnels port 8000 and writes the URL to Firestore at
 * app-config/backend.holdDetection.serverUrl via write_ngrok_url.py.
 * It also writes the LAN IP as holdDetection.localUrl so clients on
 * the same network skip ngrok entirely and use the direct LAN address.
 *
 * Resolution order:
 *  1. VITE_GATEWAY_URL env var (local dev override)
 *  2. holdDetection.localUrl  — probed with a 1.5 s timeout; used if reachable
 *  3. holdDetection.serverUrl — ngrok fallback (for remote / off-LAN access)
 *  4. http://localhost:8000   — last resort if Firestore is unreachable
 */
import { getBackendAppConfig } from '@/services/appConfigService'

const LAN_PROBE_TIMEOUT_MS = 1500

let cachedGateway = null
let cachedGatewayAt = 0
const CACHE_TTL_MS = 5 * 60 * 1000

async function probeUrl(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LAN_PROBE_TIMEOUT_MS)
  try {
    const res = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'ngrok-skip-browser-warning': 'true' },
    })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export async function getGateway({ forceRefresh = false } = {}) {
  if (import.meta.env.VITE_GATEWAY_URL) {
    return import.meta.env.VITE_GATEWAY_URL
  }

  const now = Date.now()
  if (!forceRefresh && cachedGateway && now - cachedGatewayAt < CACHE_TTL_MS) {
    return cachedGateway
  }

  try {
    const data = await getBackendAppConfig({ forceRefresh: true })
    const localUrl  = data?.holdDetection?.localUrl?.replace(/\/+$/, '')
    const ngrokUrl  = data?.holdDetection?.serverUrl?.replace(/\/+$/, '')

    // Try LAN first — no ngrok credits, much faster
    if (localUrl && await probeUrl(localUrl)) {
      cachedGateway = localUrl
      cachedGatewayAt = now
      console.log(`[gateway] using LAN: ${localUrl}`)
      return localUrl
    }

    if (ngrokUrl) {
      cachedGateway = ngrokUrl
      cachedGatewayAt = now
      console.log(`[gateway] using ngrok: ${ngrokUrl}`)
      return ngrokUrl
    }
  } catch {
    // fall through to localhost
  }

  return 'http://localhost:8000'
}
