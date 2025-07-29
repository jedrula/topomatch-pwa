<template>
  <div class="min-h-screen bg-gray-50 px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="text-gray-600">Loading location...</div>
      </div>

      <!-- Error state -->
      <div
        v-else-if="error"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
      >
        {{ error }}
      </div>

      <!-- Location content -->
      <div v-else-if="location" class="space-y-6">
        <!-- Header with back button -->
        <div class="flex items-center justify-between">
          <button
            @click="$router.go(-1)"
            class="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <!-- Edit button -->
          <button
            @click="editLocation"
            class="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            Edit Location
          </button>
        </div>

        <!-- Hero image or placeholder -->
        <div class="relative h-64 rounded-lg overflow-hidden bg-gray-200">
          <img
            v-if="location.heroImageUrl"
            :src="location.heroImageUrl"
            :alt="location.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="flex items-center justify-center h-full text-gray-500">
            <div class="text-center">
              <svg
                class="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p class="text-lg font-medium">No hero image</p>
              <p class="text-sm">Upload an image to showcase this location</p>
            </div>
          </div>
        </div>

        <!-- Location info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ location.name }}</h1>
          <p v-if="location.description" class="text-gray-700 text-lg leading-relaxed">
            {{ location.description }}
          </p>
          <p v-else class="text-gray-500 italic">No description provided</p>

          <!-- Metadata -->
          <div class="mt-6 pt-6 border-t border-gray-200">
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="font-medium text-gray-500">Created</dt>
                <dd class="text-gray-900">{{ formatDate(location.createdAt) }}</dd>
              </div>
              <div v-if="location.updatedAt && location.updatedAt !== location.createdAt">
                <dt class="font-medium text-gray-500">Last updated</dt>
                <dd class="text-gray-900">{{ formatDate(location.updatedAt) }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Images section -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Images</h2>
            <button
              @click="showUploadModal = true"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Upload Images
            </button>
          </div>

          <!-- No images placeholder -->
          <div v-if="images.length === 0" class="text-center py-12">
            <svg
              class="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
            <p class="text-gray-500 mb-4">
              Upload photos of boulder problems, routes, or the location itself
            </p>
            <button
              @click="showUploadModal = true"
              class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Upload Your First Images
            </button>
          </div>

          <!-- Images grid -->
          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
              v-for="image in images"
              :key="image.id"
              class="aspect-square bg-gray-100 rounded-lg overflow-hidden"
            >
              <!-- Check if it's a HEIC file -->
              <div
                v-if="isHeicFile(image.name)"
                class="w-full h-full flex items-center justify-center text-gray-500 bg-gray-200"
              >
                <div class="text-center">
                  <svg
                    class="w-8 h-8 mx-auto mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p class="text-xs font-medium">HEIC</p>
                  <p class="text-xs text-gray-500">{{ image.name.split("-").pop() }}</p>
                </div>
              </div>
              <img
                v-else
                :src="image.url"
                :alt="image.name"
                class="w-full h-full object-cover hover:opacity-75 transition-opacity cursor-pointer"
                @click="openImageModal(image)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal (placeholder) -->
    <div
      v-if="showUploadModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <h3 class="text-lg font-semibold">Upload Images</h3>
          <button @click="showUploadModal = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="px-6 flex-1 overflow-y-auto">
          <ImageUpload
            :location-id="route.params.locationId"
            @uploaded="handleImageUploadComplete"
            @error="handleImageUploadError"
          />
          <div class="text-xs text-gray-500 mt-2">
            Debug: locationId = {{ route.params.locationId }}
          </div>
        </div>

        <div class="flex gap-2 p-6 pt-4 flex-shrink-0 border-t">
          <button
            @click="showUploadModal = false"
            class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { locationService } from "../services/locationService.js";
import ImageUpload from "../components/ImageUpload.vue";

const route = useRoute();
const router = useRouter();

const location = ref(null);
const images = ref([]); // Placeholder for location images
const isLoading = ref(true);
const error = ref("");
const showUploadModal = ref(false);

const locationId = route.params.locationId;

const loadLocation = async () => {
  try {
    isLoading.value = true;
    error.value = "";

    location.value = await locationService.getLocation(locationId);

    // Load images for this location from the backend
    await loadLocationImages();
  } catch (err) {
    console.error("Error loading location:", err);
    error.value = "Failed to load location. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

const loadLocationImages = async () => {
  try {
    const imageRecords = await locationService.getLocationImages(locationId);

    // Transform the records to the format expected by the template
    images.value = imageRecords.map((record) => ({
      id: record.id,
      url: record.downloadUrl,
      name: record.fileName,
    }));

    console.log("Loaded location images:", images.value);
  } catch (err) {
    console.error("Error loading location images:", err);
    // Don't set error here, just keep images empty
    images.value = [];
  }
};

const formatDate = (date) => {
  if (!date) return "";

  // Handle both Date objects and Firestore timestamps
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const editLocation = () => {
  // Navigate to edit form (could be same AddLocationView in edit mode)
  router.push(`/location/${locationId}/edit`);
};

const openImageModal = (image) => {
  // Open image in full-screen modal
  console.log("Open image:", image);
};

const isHeicFile = (fileName) => {
  if (!fileName) return false;
  const lowerName = fileName.toLowerCase();
  return lowerName.endsWith(".heic") || lowerName.endsWith(".heif");
};

const handleImageUploadComplete = async (uploadResult) => {
  console.log("Image uploaded successfully:", uploadResult);

  try {
    // Save image metadata to Firestore via backend function
    const imageRecord = await locationService.addLocationImage(
      uploadResult.locationId,
      uploadResult.fileName,
      uploadResult.downloadUrl
    );
    console.log("Image metadata saved:", imageRecord);

    // Add the new image to the images array for immediate display
    images.value.push({
      id: imageRecord.id,
      url: uploadResult.downloadUrl,
      name: uploadResult.fileName,
    });
  } catch (error) {
    console.error("Error saving image metadata:", error);
    // Still close modal even if metadata save fails
  }

  // Close the modal after successful upload
  showUploadModal.value = false;
};

const handleImageUploadError = (error) => {
  console.error("Image upload failed:", error);
  // Handle upload error (show notification, etc.)
};

onMounted(() => {
  loadLocation();
});
</script>
