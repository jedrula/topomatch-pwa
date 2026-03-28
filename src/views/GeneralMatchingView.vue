<template>
  <div class="p-6 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">General Image Matching</h1>

    <div class="flex flex-col gap-6">
      <div>
        <label class="block font-medium mb-1">Image 1</label>
        <input type="file" accept="image/*" @change="onImage1Change" />
        <img v-if="image1Preview" :src="image1Preview" class="mt-2 max-h-48 rounded" />
      </div>

      <div>
        <label class="block font-medium mb-1">Image 2</label>
        <input type="file" accept="image/*" @change="onImage2Change" />
        <img v-if="image2Preview" :src="image2Preview" class="mt-2 max-h-48 rounded" />
      </div>

      <button
        :disabled="!image1 || !image2 || loading"
        @click="runMatching"
        class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-40"
      >
        {{ loading ? 'Matching…' : 'Run Matching' }}
      </button>

      <p v-if="error" class="text-red-500">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getHoldDetectionServerUrl } from '@/services/appConfigService'

const image1 = ref(null)
const image2 = ref(null)
const image1Preview = ref(null)
const image2Preview = ref(null)
const loading = ref(false)
const error = ref(null)

function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

async function onImage1Change(e) {
  const file = e.target.files[0]
  if (!file) return
  image1.value = file
  image1Preview.value = await readFile(file)
}

async function onImage2Change(e) {
  const file = e.target.files[0]
  if (!file) return
  image2.value = file
  image2Preview.value = await readFile(file)
}

function toBase64(dataUrl) {
  return dataUrl.split(',')[1]
}

async function runMatching() {
  error.value = null
  loading.value = true
  try {
    const serverUrl = await getHoldDetectionServerUrl()

    const [data1, data2] = await Promise.all([readFile(image1.value), readFile(image2.value)])

    const body = {
      image1: toBase64(data1),
      image2: toBase64(data2),
    }

    const response = await fetch(`${serverUrl}/api/v1/general-matching`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('[GeneralMatching] response:', result)
  } catch (err) {
    error.value = err.message
    console.error('[GeneralMatching] error:', err)
  } finally {
    loading.value = false
  }
}
</script>
