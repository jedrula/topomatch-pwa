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

  function storeBlob(splatId, objectUrl) {
    blobs.value[splatId] = objectUrl;
  }

  function getBlob(splatId) {
    return blobs.value[splatId] ?? null;
  }

  function removeBlob(splatId) {
    const url = blobs.value[splatId];
    if (url) {
      URL.revokeObjectURL(url);
      delete blobs.value[splatId];
    }
  }

  return { storeBlob, getBlob, removeBlob };
});
