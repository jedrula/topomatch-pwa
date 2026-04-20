<template>
  <div class="min-h-screen bg-gray-50">
    <main class="max-w-6xl mx-auto px-4 py-6 pb-24">
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
          <p class="text-sm text-gray-500 mt-0.5">Pick two images and stitch on the server</p>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span class="ml-3 text-gray-600">Loading images…</span>
      </div>

      <div v-else-if="loadError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {{ loadError }}
      </div>

      <template v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ImagePicker
            label="Image A (reference)"
            :sections="sectionsWithImages"
            :selected-id="selectedA?.imageId ?? null"
            @select="selectedA = $event"
          />
          <ImagePicker
            label="Image B"
            :sections="sectionsWithImages"
            :selected-id="selectedB?.imageId ?? null"
            @select="selectedB = $event"
          />
        </div>

        <div class="flex items-center gap-4 mb-6 flex-wrap">
          <button
            :disabled="!canStitch || busy"
            @click="runPairStitch"
            class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {{ busy ? 'Stitching…' : 'Stitch Images' }}
          </button>
          <span v-if="!selectedA || !selectedB" class="text-sm text-gray-400">Select two images to enable</span>
          <span v-else-if="selectedA.imageId === selectedB.imageId" class="text-sm text-orange-500">Select two different images</span>
        </div>

        <div v-if="busy" class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-3">
          <div class="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0"></div>
          {{ progressMessage }}
        </div>

        <div v-if="stitchError" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ stitchError }}
        </div>

        <div v-if="stitchResult" class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 class="text-sm font-semibold text-gray-700">Panorama Result</h2>
            <span
              v-if="stitchResult.match_quality"
              :class="qualityClass(stitchResult.match_quality)"
              class="px-2.5 py-1 rounded-full text-xs font-semibold"
            >
              {{ stitchResult.match_quality }} · {{ stitchResult.inlier_matches }} inliers ({{ (stitchResult.inlier_ratio * 100).toFixed(0) }}%)
            </span>
          </div>

          <div class="overflow-auto">
            <img
              :src="stitchResult.dataUrl"
              alt="Stitched panorama"
              class="max-w-full rounded"
            />
          </div>

          <p class="text-xs text-gray-400 mt-2">
            {{ stitchResult.width }} × {{ stitchResult.height }}px
          </p>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { locationService } from '@/services/locationService';
import { orderImagesBySection } from '@/utils/imageOrdering';
import { stitchPanoramaOnServer } from '@/services/imageMatchingService';
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

const busy = ref(false);
const progressMessage = ref('');
const stitchError = ref(null);
const stitchResult = ref(null);

const sections = computed(() =>
  (locationData.value?.floorplans ?? []).flatMap(fp => fp.sections),
);

const sectionsWithImages = computed(() =>
  sections.value
    .map(section => ({
      section,
      images: orderImagesBySection(section.imageIds ?? [], allImages.value).filter(Boolean),
    }))
    .filter(({ images }) => images.length > 0),
);

const canStitch = computed(() => (
  !!selectedA.value &&
  !!selectedB.value &&
  selectedA.value.imageId !== selectedB.value.imageId
));

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
  } catch (error) {
    loadError.value = `Failed to load location data: ${error.message}`;
  } finally {
    loading.value = false;
  }
});

async function runPairStitch() {
  if (!canStitch.value) return;

  busy.value = true;
  progressMessage.value = 'Stitching on server…';
  stitchError.value = null;
  stitchResult.value = null;

  try {
    const response = await stitchPanoramaOnServer([
      selectedA.value.downloadUrl,
      selectedB.value.downloadUrl,
    ]);

    stitchResult.value = {
      ...response,
      dataUrl: `data:image/jpeg;base64,${response.result_image}`,
    };
  } catch (error) {
    stitchError.value = `Stitching failed: ${error.message}`;
  } finally {
    busy.value = false;
    progressMessage.value = '';
  }
}

function qualityClass(quality) {
  return {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    poor: 'bg-red-100 text-red-800',
  }[quality] ?? 'bg-gray-100 text-gray-800';
}
</script>
