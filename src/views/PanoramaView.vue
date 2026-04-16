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
          <p class="text-sm text-gray-500 mt-0.5">Stitch two images or all images from an area</p>
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
        <!-- Mode tabs -->
        <div class="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            v-for="m in modes"
            :key="m.id"
            @click="mode = m.id"
            :class="[
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              mode === m.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            {{ m.label }}
          </button>
        </div>

        <!-- ── PAIR MODE ─────────────────────────────────────────────────── -->
        <template v-if="mode === 'pair'">
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

          <div class="flex items-center gap-4 mb-6 flex-wrap">
            <button
              :disabled="!selectedA || !selectedB || selectedA.imageId === selectedB.imageId || busy"
              @click="runPairStitch"
              class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {{ busy ? 'Stitching…' : 'Stitch Images' }}
            </button>
            <span v-if="!selectedA || !selectedB" class="text-sm text-gray-400">Select two images to enable</span>
            <span v-else-if="selectedA.imageId === selectedB.imageId" class="text-sm text-orange-500">Select two different images</span>
          </div>
        </template>

        <!-- ── SECTION MODE ──────────────────────────────────────────────── -->
        <template v-if="mode === 'section'">
          <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Select Area</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="{ section, images } in sectionsWithImages"
                :key="section.id"
                @click="selectedSection = section"
                :class="[
                  'px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                  selectedSection?.id === section.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50',
                ]"
              >
                {{ section.name }}
                <span class="ml-1 opacity-70 font-normal">({{ images.length }})</span>
              </button>
            </div>

            <!-- Preview strip -->
            <div v-if="selectedSection" class="mt-3 flex gap-2 overflow-x-auto pb-1">
              <img
                v-for="img in selectedSectionImages"
                :key="img.imageId"
                :src="img.thumbnailUrl || img.downloadUrl"
                class="flex-shrink-0 w-16 h-16 object-cover rounded border border-gray-200"
                :alt="img.fileName"
              />
            </div>
          </div>

          <div class="flex items-center gap-4 mb-6 flex-wrap">
            <button
              :disabled="!selectedSection || selectedSectionImages.length < 2 || busy"
              @click="runSectionStitch"
              class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {{ busy
                ? progressMessage
                : selectedSection
                  ? `Stitch "${selectedSection.name}" (${selectedSectionImages.length} images)`
                  : 'Select an area above' }}
            </button>
          </div>
        </template>

        <!-- ── Shared: progress / error / result ────────────────────────── -->
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
            <div class="flex items-center gap-2 flex-wrap">
              <span
                v-if="stitchResult.matchQuality"
                :class="qualityClass(stitchResult.matchQuality)"
                class="px-2.5 py-1 rounded-full text-xs font-semibold"
              >
                {{ stitchResult.matchQuality }} · {{ stitchResult.inlierCount }} inliers ({{ (stitchResult.inlierRatio * 100).toFixed(0) }}%)
              </span>
              <template v-if="stitchResult.pairResults">
                <span
                  v-for="(pr, i) in stitchResult.pairResults"
                  :key="i"
                  :class="qualityClass(pr.matchQuality)"
                  class="px-2 py-0.5 rounded-full text-xs font-semibold"
                  :title="`Pair ${i + 1}→${i + 2}: ${pr.inlierCount} inliers`"
                >
                  {{ i + 1 }}→{{ i + 2 }}: {{ pr.matchQuality }}
                </span>
              </template>
            </div>
          </div>
          <div class="overflow-auto">
            <canvas ref="resultCanvas" class="max-w-full rounded" />
          </div>
          <p class="text-xs text-gray-400 mt-2">
            {{ stitchResult.canvas.width }} × {{ stitchResult.canvas.height }}px
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
import { stitchImages, stitchSection } from '@/utils/panoramaStitching';
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

const modes = [
  { id: 'pair', label: 'Two images' },
  { id: 'section', label: 'Whole area' },
];
const mode = ref('pair');

const selectedA = ref(null);
const selectedB = ref(null);
const selectedSection = ref(null);

const busy = ref(false);
const progressMessage = ref('');
const stitchError = ref(null);
const stitchResult = ref(null);
const resultCanvas = ref(null);

// ── Derived ─────────────────────────────────────────────────────────────────

const sections = computed(() =>
  (locationData.value?.floorplans ?? []).flatMap(fp => fp.sections),
);

const sectionsWithImages = computed(() => {
  const imagesById = Object.fromEntries(allImages.value.map(img => [img.imageId, img]));
  return sections.value
    .map(section => ({
      section,
      images: orderImagesBySection(section.imageIds ?? [], allImages.value)
        .filter(img => img && imagesById[img.imageId]),
    }))
    .filter(({ images }) => images.length > 0);
});

const selectedSectionImages = computed(() => {
  if (!selectedSection.value) return [];
  const entry = sectionsWithImages.value.find(e => e.section.id === selectedSection.value.id);
  return entry?.images ?? [];
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

function autoSelectFromUrl() {
  const imageId = route.query.imageId;
  if (!imageId || allImages.value.length === 0) return;

  const imgA = allImages.value.find(img => img.imageId === imageId);
  if (!imgA) return;
  selectedA.value = imgA;

  const secs = sections.value;
  for (let si = 0; si < secs.length; si++) {
    const sec = secs[si];
    const idx = (sec.imageIds ?? []).indexOf(imageId);
    if (idx < 0) continue;

    selectedSection.value = sec;

    if (idx + 1 < sec.imageIds.length) {
      const imgB = allImages.value.find(img => img.imageId === sec.imageIds[idx + 1]);
      if (imgB) { selectedB.value = imgB; return; }
    }
    const nextSec = secs[(si + 1) % secs.length];
    if (nextSec && nextSec.id !== sec.id && nextSec.imageIds?.length) {
      const imgB = allImages.value.find(img => img.imageId === nextSec.imageIds[0]);
      if (imgB) { selectedB.value = imgB; }
    }
    break;
  }
}

// ── Stitching ────────────────────────────────────────────────────────────────

async function runPairStitch() {
  if (!selectedA.value || !selectedB.value) return;
  busy.value = true;
  progressMessage.value = 'Sending images to LoFTR server…';
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
    busy.value = false;
    progressMessage.value = '';
  }
}

async function runSectionStitch() {
  const images = selectedSectionImages.value;
  if (images.length < 2) return;
  busy.value = true;
  stitchError.value = null;
  stitchResult.value = null;
  progressMessage.value = 'Starting…';
  try {
    const result = await stitchSection(images, ({ message }) => {
      progressMessage.value = message;
    });
    stitchResult.value = result;
    await nextTick();
    renderResultCanvas(result.canvas);
  } catch (err) {
    stitchError.value = `Section stitching failed: ${err.message}`;
  } finally {
    busy.value = false;
    progressMessage.value = '';
  }
}

function renderResultCanvas(sourceCanvas) {
  const el = resultCanvas.value;
  if (!el) return;
  el.width = sourceCanvas.width;
  el.height = sourceCanvas.height;
  el.getContext('2d').drawImage(sourceCanvas, 0, 0);
}

watch(resultCanvas, (el) => {
  if (el && stitchResult.value) renderResultCanvas(stitchResult.value.canvas);
});

function qualityClass(q) {
  return {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    poor: 'bg-red-100 text-red-800',
  }[q] ?? 'bg-gray-100 text-gray-800';
}
</script>
