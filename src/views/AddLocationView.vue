<template>
  <div class="min-h-screen bg-gray-50 px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-lg shadow p-6">
        <LocationForm
          :initial="{ name: '', description: '', heroImageUrl: '' }"
          mode="add"
          @submit="handleAddSubmit"
          @cancel="handleCancel"
        />
        <div v-if="error" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { locationService } from "../services/locationService.js";
import LocationForm from "../components/LocationForm.vue";

const router = useRouter();
const error = ref("");

const handleAddSubmit = async (form) => {
  try {
    // You may want to handle heroImageFile upload here
    const locationId = await locationService.createLocation({
      name: form.name,
      description: form.description,
      heroImageUrl: form.heroImageUrl, // If uploaded
    });
    router.push(`/location/${locationId}`);
  } catch (err) {
    error.value = "Failed to create location.";
  }
};

const handleCancel = () => {
  router.go(-1);
};
</script>
