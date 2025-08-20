<template>
  <div class="space-y-4">
    <!-- Upload area -->
    <div
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      :class="[
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
      ]"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*,.heic,.heif"
        @change="handleFileSelect"
        class="hidden"
      />

      <svg
        class="w-12 h-12 mx-auto mb-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>

      <h3 class="text-lg font-medium text-gray-900 mb-2">Upload Images</h3>
      <p class="text-gray-600 mb-4">Drag and drop images here, or click to select files</p>

      <button
        @click="$refs.fileInput.click()"
        type="button"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Select Files
      </button>

      <p class="text-sm text-gray-500 mt-2">PNG, JPG, WEBP, HEIC up to 10MB each</p>
    </div>

    <!-- Upload queue -->
    <div v-if="uploadQueue.length > 0" class="space-y-3">
      <h4 class="font-medium text-gray-900">Uploading Images</h4>

      <div v-for="upload in uploadQueue" :key="upload.id" class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center space-x-4">
          <!-- Image preview -->
          <div class="flex-shrink-0">
            <div
              v-if="upload.isHeic"
              class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-gray-400"
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
            </div>
            <img
              v-else
              :src="upload.preview"
              :alt="upload.file.name"
              class="w-16 h-16 object-cover rounded-lg"
            />
          </div>

          <!-- Upload info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ upload.file.name }}</p>
            <p class="text-sm text-gray-500">{{ formatFileSize(upload.file.size) }}</p>

            <!-- Progress bar -->
            <div class="mt-2">
              <div class="bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  :style="`width: ${upload.progress}%`"
                ></div>
              </div>
              <p class="text-xs text-gray-600 mt-1">
                {{ upload.status === "uploading" ? `${upload.progress}%` : upload.status }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex-shrink-0">
            <button
              v-if="upload.status === 'pending' || upload.status === 'error'"
              @click="removeFromQueue(upload.id)"
              class="text-red-600 hover:text-red-800"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div v-else-if="upload.status === 'uploading'" class="w-5 h-5">
              <div
                class="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-600"
              ></div>
            </div>

            <div v-else-if="upload.status === 'complete'" class="text-green-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div
          v-if="upload.error"
          class="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700"
        >
          {{ upload.error }}
        </div>
      </div>

      <!-- Upload actions -->
      <div class="flex items-center justify-between pt-4 border-t">
        <p class="text-sm text-gray-600">
          {{ completedUploads }}/{{ uploadQueue.length }} completed
          {{ isUploading ? '(uploading...)' : '' }}
        </p>

        <div class="space-x-2">
          <button
            @click="clearCompleted"
            v-if="completedUploads > 0 && !isUploading"
            class="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Clear Completed
          </button>
        </div>
      </div>
    </div>

    <!-- Error messages -->
    <div
      v-if="generalError"
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center justify-between"
    >
      <span>{{ generalError }}</span>
      <button @click="generalError = ''" class="text-red-700 hover:text-red-900 ml-4">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { storage } from "../services/firebase.js";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const props = defineProps({
  locationId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["uploaded", "error", "all-complete"]);

const fileInput = ref(null);
const uploadQueue = ref([]);
const isDragging = ref(false);
const isUploading = ref(false);
const generalError = ref("");

// Computed properties
const completedUploads = computed(
  () => uploadQueue.value.filter((upload) => upload.status === "complete").length
);

// File handling
const validateFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  // Disallow HEIC/HEIF by MIME type and extension
  const lowerName = file.name.toLowerCase();
  if (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    lowerName.endsWith(".heic") ||
    lowerName.endsWith(".heif")
  ) {
    return "HEIC/HEIF images are not supported. Please upload JPG, PNG, or WEBP.";
  }

  if (!allowedTypes.includes(file.type)) {
    return "Invalid file type. Please upload JPG, PNG, or WEBP images.";
  }

  if (file.size > maxSize) {
    return "File size too large. Maximum size is 10MB.";
  }

  return null;
};

const createUploadItem = (file) => {
  // Only create preview for supported image types, not HEIC
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif");

  const preview = isHeic ? null : URL.createObjectURL(file);

  return {
    id: Date.now() + Math.random(),
    file,
    preview,
    isHeic,
    progress: 0,
    status: "pending", // pending, uploading, complete, error
    error: null,
    downloadUrl: null,
  };
};

const addFilesToQueue = (files) => {
  const validFiles = [];
  let hasError = false;

  Array.from(files).forEach((file) => {
    const error = validateFile(file);
    console.log("after validateFile", error);
    if (error) {
      generalError.value = error;
      hasError = true;
      return;
    }

    // Check if file already in queue
    const exists = uploadQueue.value.some(
      (upload) => upload.file.name === file.name && upload.file.size === file.size
    );

    if (!exists) {
      validFiles.push(createUploadItem(file));
    }
  });

  uploadQueue.value.push(...validFiles);

  // Only clear error if no validation errors occurred
  if (!hasError) {
    generalError.value = "";
  }

  // Auto-start uploads immediately after adding files
  if (validFiles.length > 0) {
    startUploads();
  }
};

// Event handlers
const handleFileSelect = (event) => {
  addFilesToQueue(event.target.files);
  event.target.value = ""; // Reset input
};

const handleDragOver = (event) => {
  event.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = (event) => {
  event.preventDefault();
  isDragging.value = false;
};

const handleDrop = (event) => {
  event.preventDefault();
  isDragging.value = false;
  addFilesToQueue(event.dataTransfer.files);
};

// Upload management
const uploadSingleFile = async (uploadItem) => {
  try {
    uploadItem.status = "uploading";
    uploadItem.progress = 0;
    uploadItem.error = null;

    console.log("props.locationId:", props.locationId); // Debug log

    if (!props.locationId) {
      throw new Error("Location ID is required for upload");
    }

    const timestamp = Date.now();
    const fileName = `location-images/${props.locationId}/${timestamp}-${uploadItem.file.name}`;

    console.log("Upload fileName:", fileName); // Debug log

    const imageRef = storageRef(storage, fileName);

    const uploadTask = uploadBytesResumable(imageRef, uploadItem.file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          uploadItem.progress = Math.round(progress);
        },
        (error) => {
          uploadItem.status = "error";
          uploadItem.error = `Upload failed: ${error.message}`;
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            uploadItem.downloadUrl = downloadURL;
            uploadItem.status = "complete";
            uploadItem.progress = 100;
            resolve(downloadURL);
          } catch (error) {
            uploadItem.status = "error";
            uploadItem.error = `Failed to get download URL: ${error.message}`;
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    uploadItem.status = "error";
    uploadItem.error = error.message;
    throw error;
  }
};

const startUploads = async () => {
  if (isUploading.value) return;

  isUploading.value = true;
  generalError.value = "";

  const pendingItems = uploadQueue.value.filter((item) => item.status === "pending");
  
  if (pendingItems.length === 0) {
    isUploading.value = false;
    return;
  }

  console.log(`Starting ${pendingItems.length} uploads in parallel`);

  // Upload all files in parallel for better performance
  const uploadPromises = pendingItems.map(async (item) => {
    try {
      await uploadSingleFile(item);

      // Emit uploaded event with image info immediately after each upload completes
      emit("uploaded", {
        fileName: item.file.name,
        downloadUrl: item.downloadUrl,
        locationId: props.locationId,
      });

      return { success: true, item };
    } catch (error) {
      console.error("Upload failed:", error);
      emit("error", error.message);
      return { success: false, error, item };
    }
  });

  // Wait for all uploads to complete
  const results = await Promise.all(uploadPromises);
  
  const completedCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  isUploading.value = false;

  // Emit all-complete event after ALL uploads are processed
  emit("all-complete", {
    totalUploads: pendingItems.length,
    completedUploads: completedCount,
    failedUploads: errorCount,
  });

  console.log(`Upload batch complete: ${completedCount} succeeded, ${errorCount} failed`);
};

// Queue management
const removeFromQueue = (uploadId) => {
  const index = uploadQueue.value.findIndex((item) => item.id === uploadId);
  if (index !== -1) {
    const item = uploadQueue.value[index];
    if (item.preview) {
      URL.revokeObjectURL(item.preview); // Clean up preview URL only if it exists
    }
    uploadQueue.value.splice(index, 1);
  }
};

const clearCompleted = () => {
  uploadQueue.value = uploadQueue.value.filter((item) => {
    if (item.status === "complete") {
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
      return false;
    }
    return true;
  });
};

// Utility functions
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Cleanup on unmount
import { onUnmounted } from "vue";

onUnmounted(() => {
  uploadQueue.value.forEach((item) => {
    if (item.preview) {
      URL.revokeObjectURL(item.preview);
    }
  });
});
</script>
