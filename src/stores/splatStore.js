import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Ephemeral in-memory store mapping splatId → objectUrl (blob URL).
 * Used when loading a local .splat file so SplatView can retrieve it
 * without re-fetching. Job-based splats (from API) are fetched directly
 * in SplatView using the jobId.
 */
export const useSplatStore = defineStore('splat', () => {
  const blobs = ref(/** @type {Record<string, string>} */ ({}));
  // Viewer SceneFormat per splatId: 0 Splat, 1 KSplat, 2 Ply, 3 Spz.
  // A blob URL has no extension, so the viewer cannot sniff the format itself.
  const formats = ref(/** @type {Record<string, number>} */ ({}));

  function storeBlob(splatId, objectUrl, sceneFormat = 0) {
    blobs.value[splatId] = objectUrl;
    formats.value[splatId] = sceneFormat;
  }

  function getBlob(splatId) {
    return blobs.value[splatId] ?? null;
  }

  function getFormat(splatId) {
    return formats.value[splatId] ?? 0;
  }

  function removeBlob(splatId) {
    const url = blobs.value[splatId];
    if (url) {
      URL.revokeObjectURL(url);
      delete blobs.value[splatId];
      delete formats.value[splatId];
    }
  }

  return { storeBlob, getBlob, getFormat, removeBlob };
});
