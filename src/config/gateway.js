/**
 * Returns the base gateway URL (port 8000 / ngrok root).
 * ngrok tunnels port 8000 and writes the URL to Firestore at
 * app-config/backend.holdDetection.serverUrl via write_ngrok_url.py.
 *
 * The gateway routes /topowall/* → topowall-splat (:8002), so callers
 * should append /topowall/api/v1/... themselves.
 *
 * Override for local dev (without Firestore): set VITE_GATEWAY_URL=http://localhost:8000
 */
import { getHoldDetectionServerUrl } from '@/services/appConfigService'

export async function getGateway() {
  if (import.meta.env.VITE_GATEWAY_URL) {
    return import.meta.env.VITE_GATEWAY_URL
  }
  try {
    return await getHoldDetectionServerUrl()
  } catch {
    return 'http://localhost:8000'
  }
}
