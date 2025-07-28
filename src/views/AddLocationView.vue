<template>
  <div class="min-h-screen bg-gray-50 px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-lg shadow p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">Add New Location</h1>

        <!-- Error message -->
        <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ error }}
        </div>

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

          <div>
            <label for="heroImage" class="block text-sm font-medium text-gray-700 mb-2">
              Hero Image
            </label>
            <div class="space-y-3">
              <input
                id="heroImage"
                type="file"
                @change="handleImageSelect"
                accept="image/*"
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <!-- Image preview -->
              <div v-if="imagePreview" class="relative">
                <img
                  :src="imagePreview"
                  alt="Hero image preview"
                  class="w-full h-48 object-cover rounded-md border border-gray-200"
                />
                <button
                  type="button"
                  @click="removeImage"
                  class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>

              <!-- Upload progress -->
              <div v-if="uploadProgress > 0 && uploadProgress < 100" class="w-full">
                <div class="bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    :style="`width: ${uploadProgress}%`"
                  ></div>
                </div>
                <p class="text-sm text-gray-600 mt-1">Uploading... {{ uploadProgress }}%</p>
              </div>
            </div>
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
              :disabled="isLoading"
              class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? "Creating..." : "Add Location" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { locationService } from "../services/locationService.js";
import { storage } from "../services/firebase.js";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const router = useRouter();

const formData = ref({
  name: "",
  description: "",
});

const selectedImage = ref(null);
const imagePreview = ref(null);
const uploadProgress = ref(0);
const isLoading = ref(false);
const error = ref("");

const handleImageSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedImage.value = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const removeImage = () => {
  selectedImage.value = null;
  imagePreview.value = null;
  uploadProgress.value = 0;

  // Clear file input
  const fileInput = document.getElementById("heroImage");
  if (fileInput) {
    fileInput.value = "";
  }
};

const uploadImageToStorage = async (file) => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const fileName = `location-images/${timestamp}-${file.name}`;
    
    // Create a storage reference
    const imageRef = storageRef(storage, fileName);
    
    // Start the upload
    const uploadTask = uploadBytesResumable(imageRef, file);
    
    // Monitor upload progress
    uploadTask.on('state_changed',
      (snapshot) => {
        // Calculate progress percentage
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        uploadProgress.value = Math.round(progress);
      },
      (error) => {
        // Handle upload error
        console.error('Upload failed:', error);
        reject(error);
      },
      async () => {
        // Upload completed successfully
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          uploadProgress.value = 100;
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

const handleSubmit = async () => {
  if (isLoading.value) return;

  try {
    isLoading.value = true;
    error.value = "";

    let heroImageUrl = null;

    // Upload image if selected
    if (selectedImage.value) {
      heroImageUrl = await uploadImageToStorage(selectedImage.value);
    }

    // Create location with image URL
    const locationData = {
      ...formData.value,
      heroImageUrl,
    };

    const newLocation = await locationService.createLocation(locationData);

    console.log("Location created successfully:", newLocation);
    alert(`Location "${newLocation.name}" created successfully!`);
    router.go(-1);
  } catch (err) {
    console.error("Error creating location:", err);
    error.value = "Failed to create location. Please try again.";
  } finally {
    isLoading.value = false;
  }
};
</script>
