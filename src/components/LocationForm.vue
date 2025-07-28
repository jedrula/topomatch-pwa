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
        class="w-full border rounded px-4 py-2"
      />
      <div v-if="form.heroImageUrl" class="mt-2">
        <img :src="form.heroImageUrl" alt="Hero" class="h-24 rounded object-cover" />
      </div>
    </div>
    <div class="flex gap-4 mt-6">
      <button type="button" @click="$emit('cancel')" class="px-4 py-2 border rounded">
        Cancel
      </button>
      <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">
        {{ mode === "edit" ? "Save Changes" : "Add Location" }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, toRefs } from "vue";
const props = defineProps({
  initial: {
    type: Object,
    default: () => ({ name: "", description: "", heroImageUrl: "" }),
  },
  mode: {
    type: String,
    default: "add", // or 'edit'
  },
});
const emit = defineEmits(["submit", "cancel"]);
const form = ref({ ...props.initial });

watch(
  () => props.initial,
  (val) => {
    form.value = { ...val };
  }
);

const onFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  // Only allow supported types
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    alert("Only JPG, PNG, and WEBP images are supported.");
    return;
  }
  // Show preview
  form.value.heroImageUrl = URL.createObjectURL(file);
  form.value.heroImageFile = file;
};

const handleSubmit = () => {
  emit("submit", { ...form.value });
};
</script>
