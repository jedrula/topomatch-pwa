<template>
  <div class="region-gallery-grid">
    <div
      v-for="img in images"
      :key="img"
      class="region-gallery-item"
      @click="selectImage(img)"
      :class="{ selected: selectedImages.includes(img) }"
    >
      <img :src="img" alt="region image" />
      <div class="region-gallery-filename">{{ img.split("/").pop() }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits } from "vue";

const props = defineProps({
  manifestPath: {
    type: String,
    required: true,
  },
});

const images = ref([]);
const selectedImages = ref([]);
const emit = defineEmits(["topo-selected", "topo-list-loaded"]);

function selectImage(img) {
  if (selectedImages.value.includes(img)) {
    selectedImages.value = selectedImages.value.filter((i) => i !== img);
  } else {
    selectedImages.value.push(img);
  }
  emit("topo-selected", [...selectedImages.value]);
}

onMounted(async () => {
  try {
    const resp = await fetch(props.manifestPath);
    if (resp.ok) {
      images.value = await resp.json();
      selectedImages.value = [...images.value]; // select all by default
      emit("topo-list-loaded", [...images.value]);
      emit("topo-selected", [...images.value]);
      return;
    } else {
      alert("Could not load region manifest.json (HTTP " + resp.status + ")");
    }
  } catch (e) {
    alert("Error loading region manifest.json: " + e);
  }
});
</script>

<style scoped>
.region-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 2em;
}
.region-gallery-item {
  cursor: pointer;
  transition: box-shadow 0.2s, border 0.2s;
}
.region-gallery-item.selected {
  border: 2px solid #1976d2;
  box-shadow: 0 0 0 2px #1976d2;
}
.region-gallery-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.region-gallery-filename {
  margin-top: 0.5em;
  font-size: 0.95em;
  text-align: center;
  color: #444;
  word-break: break-all;
}
</style>
