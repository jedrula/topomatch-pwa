<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <h1 class="text-2xl font-bold mb-6">
      {{ mode === "edit" ? "Edit Location" : "Add New Location" }}
    </h1>
    <div>
      <label class="block font-medium mb-1">Location Name</label>
      <input
        v-model="form.name"
        type="text"
        class="w-full border rounded px-4 py-2"
        :placeholder="mode === 'edit' ? 'Edit location name' : 'Enter location name'"
        required
      />
    </div>
    <div>
      <label class="block font-medium mb-1">Address</label>
      <input
        v-model="form.address"
        type="text"
        class="w-full border rounded px-4 py-2"
        :placeholder="mode === 'edit' ? 'Edit address' : 'Enter location address'"
      />
    </div>
    <div>
      <label class="block font-medium mb-1">Description</label>
      <textarea
        v-model="form.description"
        class="w-full border rounded px-4 py-2"
        :placeholder="mode === 'edit' ? 'Edit description' : 'Describe the climbing location'"
        rows="4"
      ></textarea>
    </div>
    <div>
      <label class="block font-medium mb-1">Hero Image</label>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        @change="onFileChange"
        :disabled="isUploading"
        class="w-full border rounded px-4 py-2"
      />
      <div v-if="isUploading" class="mt-2 text-blue-600">Uploading hero image...</div>
      <div v-if="form.heroImageUrl && !isUploading" class="mt-2">
        <img :src="form.heroImageUrl" alt="Hero" class="h-24 rounded object-cover" crossorigin="anonymous" />
      </div>
    </div>

    <!-- Grading System Configuration -->
    <div class="border-t pt-6">
      <GradingSystemManager
        :initial-system="form.gradingSystem"
        @system-selected="onGradingSystemSelected"
      />
    </div>
    <div class="flex gap-4 mt-6">
      <div class="flex items-center justify-between gap-4 mt-6 w-full">
        <div>
          <button
            v-if="mode === 'edit' && userStore.canDeleteLocations"
            type="button"
            @click="$emit('delete')"
            class="px-4 py-2 border border-red-500 text-red-600 rounded hover:bg-red-50 mr-auto"
          >
            Delete
          </button>
        </div>
        <div class="flex gap-2">
          <button type="button" @click="$emit('cancel')" class="px-4 py-2 border rounded">
            Cancel
          </button>
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">
            {{ mode === "edit" ? "Save Changes" : "Add Location" }}
          </button>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue';
import { storage } from '../services/firebase.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUserStore } from '../stores/userStore.js';
import GradingSystemManager from './GradingSystemManager.vue';

const props = defineProps({
  initial: {
    type: Object,
    default: () => ({ name: '', address: '', description: '', heroImageUrl: '', gradingSystem: null }),
  },
  mode: {
    type: String,
    default: 'add', // or 'edit'
  },
});
const emit = defineEmits(['submit', 'cancel', 'delete']);
const userStore = useUserStore();
const form = ref({ ...props.initial });
const isUploading = ref(false);

watch(
  () => props.initial,
  (val) => {
    form.value = { ...val };
  }
);

const onFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Only allow supported types
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    alert('Only JPG, PNG, and WEBP images are supported.');
    return;
  }

  try {
    isUploading.value = true;

    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `hero-images/${timestamp}-${file.name}`;

    // Upload to Firebase Storage
    const fileRef = storageRef(storage, fileName);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Update form with the Firebase Storage URL
    form.value.heroImageUrl = downloadURL;

  } catch (error) {
    console.error('Error uploading hero image:', error);
    alert('Failed to upload hero image. Please try again.');
  } finally {
    isUploading.value = false;
  }
};

const handleSubmit = () => {
  if (isUploading.value) {
    alert('Please wait for the hero image to finish uploading.');
    return;
  }
  emit('submit', { ...form.value });
};

const onGradingSystemSelected = (system) => {
  form.value.gradingSystem = system;
};
</script>
