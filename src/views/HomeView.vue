<template>
  <div>
    <AppHeader />
    <main class="pt-4 px-4">
      <div class="my-2">
        <RegionPicker @regionChange="onRegionChange" />
      </div>

      <!-- Show global session loading state -->
      <div v-if="inferenceStore.isLoading && !inferenceStore.sessionReady" class="session-init">
        <p>{{ inferenceStore.loadingMessage }}</p>
        <div class="spinner-icon"></div>
      </div>

      <MainFooter />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import RegionPicker from "@/components/RegionPicker.vue";
import MainFooter from "@/components/MainFooter.vue";
import { useInferenceStore } from "@/stores/inferenceStore";

const router = useRouter();
const inferenceStore = useInferenceStore();

function onRegionChange(newRegionId) {
  router.push({ name: "region", params: { regionId: newRegionId } });
}
</script>

<style scoped>
/* Add your styles here */
.session-init {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2em;
  color: #666;
}

.spinner-icon {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 0.8s linear infinite;
  margin-top: 1em;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
