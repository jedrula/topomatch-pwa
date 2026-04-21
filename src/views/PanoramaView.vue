<template>
  <div class="min-h-screen bg-gray-50">
    <main class="max-w-6xl mx-auto px-4 py-6 pb-32">
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
          <p class="text-sm text-gray-500 mt-0.5">Select images or upload a wall-scan video</p>
        </div>
      </div>

      <!-- Tab switcher -->
      <div class="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          v-for="t in ['images', 'video']" :key="t"
          @click="tab = t"
          class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize"
          :class="tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'"
        >{{ t }}</button>
      </div>

      <!-- ── IMAGES TAB ── -->
      <template v-if="tab === 'images'">
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span class="ml-3 text-gray-600">Loading images…</span>
        </div>
        <div v-else-if="loadError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{{ loadError }}</div>
        <template v-else>
          <div v-for="{ section, images } in sectionsWithImages" :key="section.sectionId" class="mb-8">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">{{ section.name || 'Section' }}</h2>
              <button @click="toggleSection(images)" class="text-xs text-blue-600 hover:underline">
                {{ isSectionFullySelected(images) ? 'Deselect all' : 'Select all' }}
              </button>
            </div>
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              <button
                v-for="img in images" :key="img.imageId"
                @click="toggleImage(img)"
                class="relative aspect-square rounded-lg overflow-hidden border-2 focus:outline-none transition-all"
                :class="selectedIds.has(img.imageId) ? 'border-blue-500 ring-2 ring-blue-300' : 'border-transparent hover:border-gray-300'"
              >
                <img :src="img.downloadUrl" :alt="img.imageId" class="w-full h-full object-cover" />
                <div v-if="selectedIds.has(img.imageId)" class="absolute inset-0 bg-blue-500/20 flex items-start justify-end p-1">
                  <div class="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {{ selectionOrder(img.imageId) }}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </template>
      </template>

      <!-- ── VIDEO TAB ── -->
      <template v-else>
        <div class="max-w-lg space-y-4">
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            Record a slow left-to-right pan of the wall. The server will extract frames and stitch them automatically.
          </div>

          <!-- File upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Wall scan video</label>
            <input
              type="file" accept="video/*"
              @change="onVideoFileChange"
              class="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-700"
            />
            <p v-if="videoFile" class="mt-1 text-xs text-gray-500">{{ videoFile.name }} ({{ (videoFile.size / 1024 / 1024).toFixed(1) }} MB)</p>
          </div>

          <!-- Upload progress -->
          <div v-if="uploadProgress !== null" class="space-y-1">
            <div class="flex justify-between text-xs text-gray-600">
              <span>Uploading…</span><span>{{ uploadProgress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full transition-all" :style="{ width: uploadProgress + '%' }"></div>
            </div>
          </div>
        </div>
      </template>

      <!-- Shared: busy / error / result -->
      <div v-if="busy" class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-3">
        <div class="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0"></div>
        {{ busyMessage }}
      </div>

      <div v-if="stitchError" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{{ stitchError }}</div>

      <div v-if="stitchResult" class="mt-6 bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 class="text-sm font-semibold text-gray-700">
            Panorama Result
            <span v-if="stitchResult.frames_used" class="font-normal text-gray-400">({{ stitchResult.frames_used }} frames)</span>
          </h2>
          <span v-if="stitchResult.worst_quality" :class="qualityClass(stitchResult.worst_quality)" class="px-2.5 py-1 rounded-full text-xs font-semibold">
            worst: {{ stitchResult.worst_quality }}
          </span>
        </div>
        <div class="overflow-auto">
          <img :src="stitchResult.dataUrl" alt="Stitched panorama" class="max-w-full rounded" />
        </div>
        <p class="text-xs text-gray-400 mt-2">{{ stitchResult.width }} × {{ stitchResult.height }}px</p>
        <div v-if="stitchResult.pair_results?.length" class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="(pr, i) in stitchResult.pair_results" :key="i"
            :class="qualityClass(pr.match_quality)"
            class="px-2 py-0.5 rounded text-xs font-medium"
          >{{ i + 1 }}→{{ i + 2 }}: {{ pr.match_quality }} ({{ pr.inlier_matches }} inliers)</span>
        </div>
      </div>
    </main>

    <!-- Fixed bottom bar -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-4 z-20">
      <!-- Images tab: thumbnail strip + stitch button -->
      <template v-if="tab === 'images'">
        <div class="flex gap-1.5 overflow-x-auto flex-1">
          <img
            v-for="img in orderedSelectedImages" :key="img.imageId"
            :src="img.downloadUrl"
            class="h-10 w-10 rounded object-cover flex-shrink-0 border border-gray-200"
          />
          <span v-if="selectedIds.size === 0" class="text-sm text-gray-400 self-center">No images selected</span>
        </div>
        <button
          :disabled="selectedIds.size < 2 || busy"
          @click="runStitch"
          class="flex-shrink-0 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >{{ busy ? 'Stitching…' : `Stitch ${selectedIds.size < 2 ? '' : selectedIds.size + ' '}Images` }}</button>
      </template>

      <!-- Video tab: upload + stitch button -->
      <template v-else>
        <span class="text-sm text-gray-500 flex-1">
          {{ videoFile ? videoFile.name : 'No video selected' }}
        </span>
        <button
          :disabled="!videoFile || busy"
          @click="runVideoStitch"
          class="flex-shrink-0 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >{{ busy ? busyMessage : 'Upload & Stitch' }}</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { locationService } from '@/services/locationService';
import { orderImagesBySection } from '@/utils/imageOrdering';
import { stitchPanoramaOnServer, stitchPanoramaVideoOnServer } from '@/services/imageMatchingService';

const props = defineProps({
  locationId: { type: String, default: null },
});

const route = useRoute();
const router = useRouter();

// ── Tab ──
const tab = ref('images');

// ── Images tab state ──
const locationData = ref(null);
const allImages = ref([]);
const loading = ref(true);
const loadError = ref(null);
const selectedIdsList = ref([]);
const selectedIds = computed(() => new Set(selectedIdsList.value));

// ── Video tab state ──
const videoFile = ref(null);
const uploadProgress = ref(null);

// ── Shared ──
const busy = ref(false);
const busyMessage = ref('');
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

const orderedSelectedImages = computed(() => {
  const imageMap = Object.fromEntries(allImages.value.map(img => [img.imageId, img]));
  return selectedIdsList.value.map(id => imageMap[id]).filter(Boolean);
});

function selectionOrder(imageId) {
  return selectedIdsList.value.indexOf(imageId) + 1;
}

function toggleImage(img) {
  const idx = selectedIdsList.value.indexOf(img.imageId);
  if (idx === -1) selectedIdsList.value.push(img.imageId);
  else selectedIdsList.value.splice(idx, 1);
}

function isSectionFullySelected(images) {
  return images.every(img => selectedIds.value.has(img.imageId));
}

function toggleSection(images) {
  if (isSectionFullySelected(images)) {
    const sectionIds = new Set(images.map(img => img.imageId));
    selectedIdsList.value = selectedIdsList.value.filter(id => !sectionIds.has(id));
  } else {
    for (const img of images) {
      if (!selectedIds.value.has(img.imageId)) selectedIdsList.value.push(img.imageId);
    }
  }
}

function onVideoFileChange(e) {
  videoFile.value = e.target.files[0] ?? null;
  stitchResult.value = null;
  stitchError.value = null;
}

onMounted(async () => {
  const locId = props.locationId || route.params.locationId;
  if (!locId) { loadError.value = 'No location ID provided.'; loading.value = false; return; }
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

async function runStitch() {
  if (selectedIds.value.size < 2 || busy.value) return;
  busy.value = true;
  busyMessage.value = `Stitching ${selectedIds.value.size} images…`;
  stitchError.value = null;
  stitchResult.value = null;
  try {
    const urls = orderedSelectedImages.value.map(img => img.downloadUrl);
    const response = await stitchPanoramaOnServer(urls);
    stitchResult.value = { ...response, dataUrl: `data:image/jpeg;base64,${response.result_image}` };
  } catch (error) {
    stitchError.value = `Stitching failed: ${error.message}`;
  } finally {
    busy.value = false;
    busyMessage.value = '';
  }
}

async function runVideoStitch() {
  if (!videoFile.value || busy.value) return;
  busy.value = true;
  stitchError.value = null;
  stitchResult.value = null;

  try {
    // 1. Upload video to Firebase Storage
    busyMessage.value = 'Uploading video…';
    uploadProgress.value = 0;
    const locId = props.locationId || route.params.locationId;
    const storage = getStorage();
    const path = `panorama-videos/${locId}/${Date.now()}_${videoFile.value.name}`;
    const sRef = storageRef(storage, path);
    const uploadTask = uploadBytesResumable(sRef, videoFile.value);

    const videoUrl = await new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        snap => { uploadProgress.value = Math.round((snap.bytesTransferred / snap.totalBytes) * 100); },
        reject,
        async () => resolve(await getDownloadURL(uploadTask.snapshot.ref)),
      );
    });
    uploadProgress.value = null;

    // 2. Call backend
    busyMessage.value = 'Extracting frames & stitching…';
    const response = await stitchPanoramaVideoOnServer(videoUrl);
    stitchResult.value = { ...response, dataUrl: `data:image/jpeg;base64,${response.result_image}` };
  } catch (error) {
    stitchError.value = `Video stitch failed: ${error.message}`;
  } finally {
    busy.value = false;
    busyMessage.value = '';
    uploadProgress.value = null;
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
