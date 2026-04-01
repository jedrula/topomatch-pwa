<template>
  <div class="p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-1">Hold Matching</h1>
    <p class="text-sm text-gray-400 mb-6">
      Image 1 by imageId (holds from Firestore) · Image 2 uploaded by you (holds from
      <code>/api/v1/detect</code>) · matched via <code>/general-matching</code>.
    </p>

    <div class="flex gap-6 mb-6">
      <!-- Image 1: by imageId -->
      <div class="flex-1">
        <label class="block font-medium mb-1 text-sm">Image 1 — imageId</label>
        <input
          v-model="imageId1"
          placeholder="paste imageId…"
          class="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
        />
        <img v-if="imgData1" :src="imgData1.dataUrl" class="mt-2 max-h-32 rounded object-contain" />
        <p v-if="imgData1" class="text-xs text-gray-400 mt-1">
          {{ imgData1.holds.length }} holds ·
          detection {{ imgData1.detectionDims?.width }}×{{ imgData1.detectionDims?.height }}
        </p>
      </div>

      <!-- Image 2: file upload -->
      <div class="flex-1">
        <label class="block font-medium mb-1 text-sm">Image 2 — upload file</label>
        <input
          type="file"
          accept="image/*"
          @change="onFile2Change"
          class="w-full text-sm text-gray-300 file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-gray-700 file:text-gray-200 file:text-sm"
        />
        <img v-if="imgData2" :src="imgData2.dataUrl" class="mt-2 max-h-32 rounded object-contain" />
        <p v-if="imgData2" class="text-xs text-gray-400 mt-1">
          {{ imgData2.holds.length }} holds ·
          {{ imgData2.detectionDims?.width }}×{{ imgData2.detectionDims?.height }}
        </p>
        <p v-else-if="file2" class="text-xs text-gray-500 mt-1">{{ file2.name }}</p>
      </div>
    </div>

    <div class="flex items-center gap-4 mb-6">
      <button
        :disabled="!imageId1 || !file2 || loading"
        @click="run"
        class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-40"
      >
        {{ loading ? loadingStep : 'Load &amp; Match' }}
      </button>

      <span v-if="matchResult" class="text-sm text-gray-400">
        {{ matchResult.confident_matches }} / {{ matchResult.total_matches }} confident matches
        (threshold {{ matchResult.confidence_threshold }})
      </span>
    </div>

    <!-- coordinate space diagnostic -->
    <div v-if="coordDiag" class="mb-4 p-3 rounded bg-gray-800 text-xs font-mono space-y-1">
      <p class="font-semibold text-gray-300">Coordinate space check</p>
      <p>match img1 dims: {{ coordDiag.matchDims1.width }}×{{ coordDiag.matchDims1.height }}</p>
      <p>match img2 dims: {{ coordDiag.matchDims2.width }}×{{ coordDiag.matchDims2.height }}</p>
      <p>detection img1 dims: {{ coordDiag.detectionDims1?.width ?? '?' }}×{{ coordDiag.detectionDims1?.height ?? '?' }}</p>
      <p>detection img2 dims: {{ coordDiag.detectionDims2?.width ?? '?' }}×{{ coordDiag.detectionDims2?.height ?? '?' }}</p>
      <p :class="coordDiag.scale1IsOne && coordDiag.scale2IsOne ? 'text-green-400' : 'text-yellow-400'">
        scale1: {{ coordDiag.scale1.x.toFixed(4) }}×{{ coordDiag.scale1.y.toFixed(4) }}
        · scale2: {{ coordDiag.scale2.x.toFixed(4) }}×{{ coordDiag.scale2.y.toFixed(4) }}
        {{ coordDiag.scale1IsOne && coordDiag.scale2IsOne ? '✓ same space' : '⚠ spaces differ – scale applied' }}
      </p>
    </div>

    <p v-if="error" class="text-red-400 mb-4">{{ error }}</p>

    <HoldMatchVisualizer
      v-if="matchResult && imgData1 && imgData2"
      :image1-data-url="imgData1.dataUrl"
      :image2-data-url="imgData2.dataUrl"
      :holds1="imgData1.holds"
      :holds2="imgData2.holds"
      :clusters2="[]"
      :hold-mapping="holdMapping"
      :matches="matchResult.matches"
      :scale1="coordDiag?.scale1 ?? { x: 1, y: 1 }"
      :scale2="coordDiag?.scale2 ?? { x: 1, y: 1 }"
    />

    <!-- Unmatched holds in uploaded image -->
    <div v-if="holdMapping && imgData2" class="mt-6">
      <h2 class="text-base font-semibold mb-2">
        Unmatched holds in uploaded image
        <span class="ml-2 text-sm font-normal text-gray-500">
          {{ unmatchedHolds2.length }} / {{ imgData2.holds.length }} holds have no match
        </span>
      </h2>
      <p v-if="unmatchedHolds2.length === 0" class="text-sm text-green-600">All holds matched ✓</p>
      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
        <div
          v-for="hold in unmatchedHolds2"
          :key="hold.id"
          class="p-2 rounded border border-orange-300 bg-orange-50 text-xs"
        >
          <p class="font-mono text-gray-600 truncate" :title="hold.id">{{ hold.id }}</p>
          <p class="text-gray-500 mt-0.5">
            center {{ Math.round(hold.centerX) }}, {{ Math.round(hold.centerY) }}
          </p>
          <p class="text-gray-400">conf {{ hold.confidence?.toFixed(2) ?? '–' }}</p>
        </div>
      </div>
    </div>

    <!-- Boulder problem removal analysis -->
    <div v-if="problemsAnalysis.length" class="mt-8">
      <h2 class="text-base font-semibold mb-2">
        Boulder problems — removal analysis
        <span class="ml-2 text-sm font-normal text-gray-500">
          {{ problemsAnalysis.filter(p => p.ratio < 0.3).length }} / {{ problemsAnalysis.length }} likely removed
        </span>
      </h2>
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b">
            <th class="py-1.5 pr-3">Problem</th>
            <th class="py-1.5 pr-3">Grade</th>
            <th class="py-1.5 pr-3">Holds</th>
            <th class="py-1.5 pr-3">Matched</th>
            <th class="py-1.5 pr-3">Coverage</th>
            <th class="py-1.5">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="{ problem, total, matched, ratio } in problemsAnalysis"
            :key="problem.id"
            class="border-b border-gray-100"
          >
            <td class="py-1.5 pr-3">
              <span class="inline-flex items-center gap-2">
                <span
                  class="inline-block w-3 h-3 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: problem.color || '#ccc' }"
                />
                {{ problem.name || '—' }}
              </span>
            </td>
            <td class="py-1.5 pr-3 text-gray-600">{{ problem.grade || '—' }}</td>
            <td class="py-1.5 pr-3 text-gray-600">{{ total }}</td>
            <td class="py-1.5 pr-3 text-gray-600">{{ matched }}</td>
            <td class="py-1.5 pr-3">
              <div class="flex items-center gap-2">
                <div class="w-16 h-1.5 rounded bg-gray-200 overflow-hidden">
                  <div
                    class="h-full rounded transition-all"
                    :class="ratio >= 0.3 ? 'bg-green-500' : ratio > 0 ? 'bg-orange-400' : 'bg-red-500'"
                    :style="{ width: `${Math.round(ratio * 100)}%` }"
                  />
                </div>
                <span class="text-xs text-gray-500">{{ Math.round(ratio * 100) }}%</span>
              </div>
            </td>
            <td class="py-1.5">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="ratio >= 0.3 ? 'bg-green-100 text-green-700' : ratio > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'"
              >
                {{ ratio >= 0.3 ? 'present' : ratio > 0 ? 'partially removed' : 'likely removed' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { holdDetectionService } from '@/services/holdDetectionService'
import { getHoldDetectionServerUrl } from '@/services/appConfigService'
import {
  mapMatchesToHolds,
  computeHoldToHoldMapping,
  computeMatchToDetectionScale,
} from '@/utils/holdMatcher'
import HoldMatchVisualizer from '@/components/HoldMatchVisualizer.vue'
import { uploadImageForProcessing, pollForJobResults } from '@/services/holdDetectionApiService'
import { boulderProblemsServiceV2 } from '@/services/boulderProblemsServiceV2'

const imageId1 = ref('b4070f89-1ca2-49b9-ab72-4a40488e76ee')
const file2 = ref(null)          // File selected by user
const imgData1 = ref(null)       // { dataUrl, holds, detectionDims, locationId }
const imgData2 = ref(null)       // { dataUrl, holds, detectionDims }
const matchResult = ref(null)
const holdMapping = ref(null)
const coordDiag = ref(null)
const boulderProblems1 = ref([])

const unmatchedHolds2 = computed(() => {
  if (!holdMapping.value || !imgData2.value) return []
  const matchedIds = new Set(
    [...holdMapping.value.values()].map(v => v.hold2?.id).filter(Boolean)
  )
  return imgData2.value.holds.filter(h => !matchedIds.has(h.id))
})

const problemsAnalysis = computed(() => {
  if (!holdMapping.value || !boulderProblems1.value.length) return []
  return boulderProblems1.value
    .map(problem => {
      const total = problem.holds?.length ?? 0
      // problem.holds[].holdId is the original hold.id from aiHolds/manualHolds in holdDetections
      const matched = total === 0 ? 0 :
        problem.holds.filter(h => holdMapping.value.has(h.holdId)).length
      const ratio = total === 0 ? 0 : matched / total
      return { problem, total, matched, ratio }
    })
    .sort((a, b) => a.ratio - b.ratio)
})
const loading = ref(false)
const loadingStep = ref('')
const error = ref(null)

function onFile2Change(e) {
  file2.value = e.target.files?.[0] ?? null
  imgData2.value = null  // clear previous result
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function urlToDataUrl(url) {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.readAsDataURL(blob)
  })
}

function fileToDataUrl(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

function toBase64(dataUrl) {
  return dataUrl.split(',')[1]
}

async function fetchImageData(imageId) {
  const snap = await getDoc(doc(db, 'locationImages', imageId))
  if (!snap.exists()) throw new Error(`Image "${imageId}" not found in locationImages`)

  const { downloadUrl, locationId } = snap.data()
  if (!downloadUrl) throw new Error(`Image "${imageId}" has no downloadUrl`)
  if (!locationId) throw new Error(`Image "${imageId}" has no locationId`)

  const [dataUrl, holdsRaw, detectionDoc] = await Promise.all([
    urlToDataUrl(downloadUrl),
    holdDetectionService.getAllHolds(locationId, imageId),
    holdDetectionService.getHoldDetection(locationId, imageId),
  ])

  const detectionDims = detectionDoc?.detectionResults?.metadata?.imageDimensions ?? null
  console.log(`[HoldMatching] ${imageId}: ${holdsRaw.length} holds, detection dims:`, detectionDims)
  return { dataUrl, holds: holdsRaw, detectionDims, locationId }
}

// Detect holds for user-uploaded image via /api/v1/process + polling /api/v1/status/:jobId
async function detectHoldsForFile(file) {
  const dataUrl = await fileToDataUrl(file)

  // Get natural image dimensions for coordinate space mapping
  const detectionDims = await new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })

  const jobId = await uploadImageForProcessing(file)
  console.log('[HoldMatching] /api/v1/process job_id:', jobId)

  const results = await pollForJobResults(jobId, status => {
    loadingStep.value = `Detecting holds (${status})…`
  })
  console.log('[HoldMatching] detection results:', results)

  return { dataUrl, holds: results.holds ?? [], detectionDims }
}

// ── main ──────────────────────────────────────────────────────────────────────

async function run() {
  error.value = null
  matchResult.value = null
  holdMapping.value = null
  coordDiag.value = null
  boulderProblems1.value = []
  loading.value = true

  try {
    const serverUrl = await getHoldDetectionServerUrl()

    loadingStep.value = 'Loading image 1 & holds…'
    const [d1, d2] = await Promise.all([
      fetchImageData(imageId1.value.trim()),
      detectHoldsForFile(file2.value),
    ])
    imgData1.value = d1
    imgData2.value = d2

    loadingStep.value = 'Loading boulder problems…'
    const problemsResult = await boulderProblemsServiceV2.getBoulderProblemsByImage(d1.locationId, imageId1.value.trim())
    boulderProblems1.value = problemsResult.problems ?? problemsResult

    loadingStep.value = 'Matching…'
    const matchRes = await fetch(`${serverUrl}/api/v1/general-matching`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({
        image1: toBase64(d1.dataUrl),
        image2: toBase64(d2.dataUrl),
        confidence_threshold: 0.6,
        max_matches: 10000,
        max_size: 840,
      }),
    })
    if (!matchRes.ok) throw new Error(`/general-matching HTTP ${matchRes.status}`)
    const match = await matchRes.json()
    console.log('[HoldMatching] /general-matching response:', match)
    matchResult.value = match

    // ── coordinate space diagnostics ─────────────────────────────────────────
    const matchDims1 = match.image_dimensions?.image1 ?? null
    const matchDims2 = match.image_dimensions?.image2 ?? null

    const scale1 = computeMatchToDetectionScale(matchDims1, d1.detectionDims)
    const scale2 = computeMatchToDetectionScale(matchDims2, d2.detectionDims)

    coordDiag.value = {
      matchDims1: matchDims1 ?? { width: '?', height: '?' },
      matchDims2: matchDims2 ?? { width: '?', height: '?' },
      detectionDims1: d1.detectionDims,
      detectionDims2: d2.detectionDims,
      scale1,
      scale2,
      scale1IsOne: Math.abs(scale1.x - 1) < 0.01 && Math.abs(scale1.y - 1) < 0.01,
      scale2IsOne: Math.abs(scale2.x - 1) < 0.01 && Math.abs(scale2.y - 1) < 0.01,
    }
    console.log('[HoldMatching] coord diag:', coordDiag.value)

    // ── hold mapping ──────────────────────────────────────────────────────────
    loadingStep.value = 'Computing hold mapping…'
    const holdMatchMap = mapMatchesToHolds(match.matches, d1.holds, scale1.x, scale1.y)
    holdMapping.value = computeHoldToHoldMapping(holdMatchMap, d2.holds, scale2.x, scale2.y)
    console.log('[HoldMatching] holdMapping:', Object.fromEntries(holdMapping.value))
  } catch (err) {
    error.value = err.message
    console.error('[HoldMatching] error:', err)
  } finally {
    loading.value = false
  }
}
</script>
