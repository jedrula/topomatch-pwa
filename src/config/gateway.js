/**
 * Returns the topowall gateway base URL.
 * Source of truth: Firestore app-config/backend.topowall.serverUrl
 * (set via /admin/healthcheck). Falls back to holdDetection.serverUrl/topowall.
 *
 * VITE_GATEWAY_URL env var can override for local dev without Firestore.
 */
import { getTopowallServerUrl } from '@/services/appConfigService'

export async function getGateway() {
  if (import.meta.env.VITE_GATEWAY_URL) {
    return import.meta.env.VITE_GATEWAY_URL
  }
  return getTopowallServerUrl()
}
