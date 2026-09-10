/**
 * Returns the base gateway URL (Cloudflare Tunnel → api.topomatch.com → localhost:8000).
 * The stable URL is written to Firestore at app-config/backend.holdDetection.serverUrl
 * by write_gateway_url.py on server startup.
 *
 * Strategy:
 *   1. If VITE_GATEWAY_URL is set → use that (local dev override)
 *   2. Read serverUrl from Firestore app-config/backend
 *   3. Fall back to localhost:8000
 *
 * The gateway routes /topowall/* → topowall-splat (:8002).
 */
import { getBackendAppConfig } from '@/services/appConfigService'

let _cached = null

export async function getGateway({ forceRefresh = false } = {}) {
  if (import.meta.env.VITE_GATEWAY_URL) {
    return import.meta.env.VITE_GATEWAY_URL
  }

  if (!forceRefresh && _cached) return _cached

  try {
    const data = await getBackendAppConfig({ forceRefresh: true })
    const serverUrl = data?.holdDetection?.serverUrl
    if (serverUrl) {
      _cached = serverUrl
      return serverUrl
    }
  } catch { /* fall through */ }

  return 'http://localhost:8000'
}
