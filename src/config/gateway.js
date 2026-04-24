/**
 * Returns the base gateway URL (port 8000 / ngrok root).
 * ngrok tunnels port 8000 and writes the URL to Firestore at
 * app-config/backend.holdDetection.serverUrl via write_ngrok_url.py.
 * It also writes holdDetection.localUrl (LAN IP, e.g. http://192.168.x.x:8000).
 *
 * Strategy:
 *   1. If VITE_GATEWAY_URL is set → use that (local dev override)
 *   2. Try localUrl (LAN) with a short timeout → use if reachable (no ngrok credits)
 *   3. Fall back to serverUrl (ngrok)
 *   4. Fall back to localhost:8000
 *
 * The gateway routes /topowall/* → topowall-splat (:8002).
 */
import { getBackendAppConfig } from '@/services/appConfigService'

const LAN_TIMEOUT_MS = 1500
let _cached = null

async function _reachable(url) {
  try {
    const ctrl = new AbortController()
    const tid = setTimeout(() => ctrl.abort(), LAN_TIMEOUT_MS)
    const res = await fetch(`${url}/health`, { signal: ctrl.signal, mode: 'cors' })
    clearTimeout(tid)
    return res.ok
  } catch {
    return false
  }
}

export async function getGateway({ forceRefresh = false } = {}) {
  if (import.meta.env.VITE_GATEWAY_URL) {
    return import.meta.env.VITE_GATEWAY_URL
  }

  if (!forceRefresh && _cached) return _cached

  try {
    const data = await getBackendAppConfig({ forceRefresh: true })
    const localUrl = data?.holdDetection?.localUrl
    const serverUrl = data?.holdDetection?.serverUrl

    if (localUrl && await _reachable(localUrl)) {
      _cached = localUrl
      return localUrl
    }

    if (serverUrl) {
      _cached = serverUrl
      return serverUrl
    }
  } catch { /* fall through */ }

  return 'http://localhost:8000'
}
