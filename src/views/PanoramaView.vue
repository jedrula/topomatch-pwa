<template>
  <div class="min-h-screen bg-gray-50">
    <main class="max-w-6xl mx-auto px-4 py-6 pb-24">
      <!-- Header -->
      <div class="mb-6 flex items-center gap-4">
        <button
          v-if="route.params.locationId"
          @click="router.push({ name: 'location-hold-detection-server', params: { locationId: route.params.locationId }, query: route.query.imageId ? { imageId: route.query.imageId } : {} })"
          class="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Panorama Stitching</h1>
          <p class="text-sm text-gray-500 mt-0.5">Select two overlapping images to stitch into a panorama</p>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span class="ml-3 text-gray-600">Loading images…</span>
      </div>

      <!-- Error state -->
      <div v-else-if="loadError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {{ loadError }}
      </div>

      <template v-else>
        <!-- Image pickers -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ImagePicker
            label="Image A (reference)"
            :sections="sectionsWithImages"
            :selected-id="selectedA?.imageId ?? null"
            @select="selectedA = $event"
          />
          <ImagePicker
            label="Image B (to be warped)"
            :sections="sectionsWithImages"
            :selected-id="selectedB?.imageId ?? null"
            @select="selectedB = $event"
          />
        </div>

        <!-- Stitch controls -->
        <div class="flex items-center gap-4 mb-6">
          <button
            :disabled="!selectedA || !selectedB || selectedA.imageId === selectedB.imageId || stitching"
            @click="runStitch"
            class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {{ stitching ? 'Stitching…' : 'Stitch Images' }}
          </button>

          <span v-if="!selectedA || !selectedB" class="text-sm text-gray-400">
            Select two images above to enable stitching
          </span>
          <span v-else-if="selectedA.imageId === selectedB.imageId" class="text-sm text-orange-500">
            Select two different images
          </span>

          <!-- Quality badge -->
          <span
            v-if="stitchResult"
            :class="qualityBadgeClass"
            class="px-2.5 py-1 rounded-full text-xs font-semibold"
          >
            {{ stitchResult.matchQuality }} · {{ stitchResult.inlierCount }} inliers ({{ (stitchResult.inlierRatio * 100).toFixed(0) }}%)
          </span>
        </div>

        <!-- Stitch error -->
        <div v-if="stitchError" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ stitchError }}
        </div>

        <!-- Stitching in progress -->
        <div v-if="stitching" class="mb-6 flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          <div class="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0"></div>
          Sending images to LoFTR server and computing homography…
        </div>

        <!-- Result canvas -->
        <div v-if="stitchResult" class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Panorama Result</h2>
          <div class="overflow-auto">
            <canvas ref="resultCanvas" class="max-w-full rounded" />
          </div>
          <p class="text-xs text-gray-400 mt-2">
            Output: {{ stitchResult.canvas.width }} × {{ stitchResult.canvas.height }}px
          </p>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { locationService } from '@/services/locationService';
import { orderImagesBySection } from '@/utils/imageOrdering';
import { stitchImages } from '@/utils/panoramaStitching';
import ImagePicker from '@/components/panorama/ImagePicker.vue';

const props = defineProps({
  locationId: { type: String, default: null },
});

const route = useRoute();
const router = useRouter();

const locationData = ref(null);
const allImages = ref([]);
const loading = ref(true);
const loadError = ref(null);

const selectedA = ref(null);
const selectedB = ref(null);

const stitching = ref(false);
const stitchError = ref(null);
const stitchResult = ref(null);
const resultCanvas = ref(null);

// ── Derived ─────────────────────────────────────────────────────────────────

const sections = computed(() =>
  (locationData.value?.floorplans ?? []).flatMap(fp => fp.sections),
);

/** Sections that actually have images available, in order, each with its image list */
const sectionsWithImages = computed(() => {
  const imagesById = Object.fromEntries(allImages.value.map(img => [img.imageId, img]));
  return sections.value
    .map(section => ({
      section,
      images: orderImagesBySection(section.imageIds, allImages.value)
        .filter(img => img && imagesById[img.imageId]),
    }))
    .filter(({ images }) => images.length > 0);
});

const qualityBadgeClass = computed(() => {
  const q = stitchResult.value?.matchQuality;
  return {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    poor: 'bg-red-100 text-red-800',
  }[q] ?? 'bg-gray-100 text-gray-800';
});

// ── Data loading ─────────────────────────────────────────────────────────────

onMounted(async () => {
  const locId = props.locationId || route.params.locationId;
  if (!locId) {
    loadError.value = 'No location ID provided.';
    loading.value = false;
    return;
  }

  try {
    const [locData, images] = await Promise.all([
      locationService.getLocation(locId),
      locationService.getLocationImages(locId),
    ]);
    locationData.value = locData;
    allImages.value = Array.isArray(images) ? images : [];

    autoSelectFromUrl();
  } catch (err) {
    loadError.value = `Failed to load location data: ${err.message}`;
  } finally {
    loading.value = false;
  }
});

/**
 * If ?imageId= is in the URL, auto-select that image as A and
 * the adjacent image (next in section, or first of next section) as B.
 */
function autoSelectFromUrl() {
  const imageId = route.query.imageId;
  if (!imageId || allImages.value.length === 0) return;

  const imgA = allImages.value.find(img => img.imageId === imageId);
  if (!imgA) return;
  selectedA.value = imgA;

  // Find which section contains this image and pick the next one
  const secs = sections.value;
  for (let si = 0; si < secs.length; si++) {
    const sec = secs[si];
    const idx = (sec.imageIds ?? []).indexOf(imageId);
    if (idx < 0) continue;

    // Try next in same section
    if (idx + 1 < sec.imageIds.length) {
      const nextId = sec.imageIds[idx + 1];
      const imgB = allImages.value.find(img => img.imageId === nextId);
      if (imgB) {
        selectedB.value = imgB;
        return;
      }
    }

    // Try first image of next section
    const nextSec = secs[(si + 1) % secs.length];
    if (nextSec && nextSec.id !== sec.id && nextSec.imageIds?.length) {
      const nextId = nextSec.imageIds[0];
      const imgB = allImages.value.find(img => img.imageId === nextId);
      if (imgB) {
        selectedB.value = imgB;
        return;
      }
    }
    break;
  }
}

// ── Stitching ────────────────────────────────────────────────────────────────

async function runStitch() {
  if (!selectedA.value || !selectedB.value) return;
  stitching.value = true;
  stitchError.value = null;
  stitchResult.value = null;

  try {
    const result = await stitchImages(selectedA.value.downloadUrl, selectedB.value.downloadUrl);
    stitchResult.value = result;
    await nextTick();
    renderResultCanvas(result.canvas);
  } catch (err) {
    stitchError.value = `Stitching failed: ${err.message}`;
  } finally {
    stitching.value = false;
  }
}

function renderResultCanvas(sourceCanvas) {
  const el = resultCanvas.value;
  if (!el) return;
  el.width = sourceCanvas.width;
  el.height = sourceCanvas.height;
  const ctx = el.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);
}

// Re-render if the result canvas element mounts after stitchResult is set
watch(resultCanvas, (el) => {
  if (el && stitchResult.value) renderResultCanvas(stitchResult.value.canvas);
});
</script>
