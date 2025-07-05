// Import all manifest files
import stokowkaManifest from './stokowka.json'
import wibrem23MayManifest from './wibrem-23-may.json'

// Export manifests by region ID
export const manifests = {
  'stokowka': stokowkaManifest,
  'wibrem-23-may': wibrem23MayManifest
}

// Helper function to get manifest for a region
export const getManifestForRegion = (regionId) => {
  return manifests[regionId] || []
}
