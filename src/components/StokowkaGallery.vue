<template>
  <div class="stokowka-grid">
    <div v-for="img in images" :key="img" class="stokowka-item">
      <img :src="img" alt="stokowka image" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const images = ref([]);

onMounted(async () => {
  try {
    const resp = await fetch("/topos/stokowka/manifest.json");
    if (resp.ok) {
      images.value = await resp.json();
      return;
    } else {
      alert("Could not load stokowka manifest.json (HTTP " + resp.status + ")");
    }
  } catch (e) {
    alert("Error loading stokowka manifest.json: " + e);
  }
});
</script>

<style scoped>
.stokowka-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 2em;
}
.stokowka-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>
