<template>
  <div class="min-h-screen bg-gray-50 px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-lg shadow p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">Add New Location</h1>
        
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="locationName" class="block text-sm font-medium text-gray-700 mb-2">
              Location Name
            </label>
            <input
              id="locationName"
              type="text"
              v-model="formData.name"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter location name"
              required
            />
          </div>

          <div>
            <label for="locationDescription" class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="locationDescription"
              v-model="formData.description"
              rows="4"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the climbing location"
            ></textarea>
          </div>

          <div class="flex items-center justify-between pt-4">
            <button
              type="button"
              @click="$router.go(-1)"
              class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Location
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const formData = ref({
  name: '',
  description: ''
})

const handleSubmit = () => {
  // Placeholder for form submission logic
  console.log('Adding new location:', formData.value)
  
  // For now, just show an alert and navigate back
  alert(`Location "${formData.value.name}" would be added here!`)
  router.go(-1)
}
</script>
