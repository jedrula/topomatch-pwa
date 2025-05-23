<template>
  <transition-group name="gallery-fade" tag="div" class="region-gallery-grid">
    <div
      v-for="img in imagesProp"
      :key="img"
      class="region-gallery-item"
      @click="selectImage(img)"
      :class="{ selected: selectedImages.includes(img) }"
    >
      <slot :img="img" :selected="selectedImages.includes(img)">
        <img :src="img" alt="region image" />
        <div class="region-gallery-filename">{{ img.split("/").pop() }}</div>
      </slot>
    </div>
  </transition-group>
</template>

<script setup>
import { ref, onMounted, defineEmits, computed } from "vue";

const props = defineProps({
  manifestPath: {
    type: String,
    required: true,
  },
  images: {
    type: Array,
    default: undefined,
  },
});

const images = ref([]);
const selectedImages = ref([]);
const emit = defineEmits(["topo-selected", "topo-list-loaded"]);

const imagesProp = computed(() => props.images ?? images.value);

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
.gallery-fade-move {
  transition: transform 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}
.gallery-fade-enter-active,
.gallery-fade-leave-active {
  transition: opacity 0.3s;
}
.gallery-fade-enter-from,
.gallery-fade-leave-to {
  opacity: 0;
}
.region-gallery-item {
  cursor: pointer;
}

.region-gallery-img-wrapper {
  position: relative;
  width: 100%;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.region-gallery-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
}
.region-gallery-filename {
  margin-top: 0.5em;
  font-size: 0.95em;
  text-align: center;
  color: #444;
  word-break: break-all;
}
.visualize-btn {
  display: none;
}
</style>
