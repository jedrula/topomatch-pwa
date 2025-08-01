<template>
  <div
    class="image-upload-box"
    :class="{ 'has-image': imageUrl, 'drag-over': isDragOver }"
    @drop="onDrop"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @click="triggerFileInput"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="onFileSelect"
      style="display: none"
    />

    <div v-if="!imageUrl" class="upload-prompt">
      <div class="upload-icon">📷</div>
      <p>{{ placeholder }}</p>
      <p class="upload-hint">{{ label }}</p>
    </div>

    <div v-else class="image-preview">
      <img :src="imageUrl" :alt="label" />
      <div class="image-overlay">
        <button @click.stop="clearImage" class="clear-btn">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, defineProps } from "vue";

const props = defineProps({
  label: {
    type: String,
    default: "Upload Image",
  },
  modelValue: {
    type: String,
    default: "",
  },
  previewUrl: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Click or drag image here",
  },
});

const emit = defineEmits(["update:modelValue", "image-selected", "file-selected", "clear"]);

const fileInput = ref(null);
const isDragOver = ref(false);
const imageUrl = ref(props.modelValue || props.previewUrl);

const triggerFileInput = () => {
  fileInput.value.click();
};

const onFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    handleFile(file);
  }
};

const onDrop = (event) => {
  event.preventDefault();
  isDragOver.value = false;

  const files = event.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
};

const onDragOver = (event) => {
  event.preventDefault();
  isDragOver.value = true;
};

const onDragLeave = () => {
  isDragOver.value = false;
};

const handleFile = (file) => {
  if (!file.type.startsWith("image/")) {
    alert("Please select an image file");
    return;
  }

  const url = URL.createObjectURL(file);
  imageUrl.value = url;
  emit("update:modelValue", url);
  emit("image-selected", { file, url });
  emit("file-selected", file);
};

const clearImage = () => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
  }
  imageUrl.value = "";
  emit("update:modelValue", "");
  emit("image-selected", null);
  emit("file-selected", null);
  emit("clear");
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

// Watch for external changes to modelValue and previewUrl
import { watch } from "vue";
watch(
  () => props.modelValue,
  (newValue) => {
    imageUrl.value = newValue;
  }
);
watch(
  () => props.previewUrl,
  (newValue) => {
    if (newValue && !props.modelValue) {
      imageUrl.value = newValue;
    }
  }
);
</script>

<style scoped>
.image-upload-box {
  width: 100%;
  height: 300px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  position: relative;
  overflow: hidden;
}

.image-upload-box:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.image-upload-box.drag-over {
  border-color: #007bff;
  background: #e3f2fd;
  transform: scale(1.02);
}

.image-upload-box.has-image {
  border: 2px solid #007bff;
  background: transparent;
}

.upload-prompt {
  text-align: center;
  color: #666;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-prompt p {
  margin: 0.5rem 0;
}

.upload-hint {
  font-size: 0.9rem;
  color: #999;
}

.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-upload-box:hover .image-overlay {
  opacity: 1;
}

.clear-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: background 0.3s ease;
}

.clear-btn:hover {
  background: #ff4444;
  color: white;
}
</style>
