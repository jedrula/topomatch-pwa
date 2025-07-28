<template>
  <div class="min-h-screen bg-gray-50 px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-lg shadow p-6">
        <LocationForm
          :initial="locationFormData"
          mode="edit"
          @submit="handleEditSubmit"
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
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { locationService } from "../services/locationService.js";
import LocationForm from "../components/LocationForm.vue";

const route = useRoute();
const router = useRouter();
const error = ref("");
const locationFormData = ref({ name: "", description: "", heroImageUrl: "" });
const locationId = route.params.locationId;

const loadLocation = async () => {
  try {
    const loc = await locationService.getLocation(locationId);
    locationFormData.value = {
      name: loc.name || "",
      description: loc.description || "",
      heroImageUrl: loc.heroImageUrl || "",
    };
  } catch (err) {
    error.value = "Failed to load location.";
  }
};

const handleEditSubmit = async (form) => {
  try {
    // You may want to handle heroImageFile upload here if changed
    await locationService.updateLocation(locationId, {
      name: form.name,
      description: form.description,
      heroImageUrl: form.heroImageUrl, // If changed/uploaded
    });
    router.push(`/location/${locationId}`);
  } catch (err) {
    error.value = "Failed to update location.";
  }
};

const handleCancel = () => {
  router.push(`/location/${locationId}`);
};

onMounted(loadLocation);
</script>
