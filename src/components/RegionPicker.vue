<template>
  <div class="mb-4">
    <label for="region-picker" class="block text-lg font-semibold text-gray-700 mb-2">
      Select Location:
    </label>
    <select
      id="region-picker"
      v-model="selectedRegionId"
      @change="$emit('regionChange', $event.target.value)"
      class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option disabled value="" class="text-gray-500">-- Select a location --</option>
      <option v-for="region in regions" :key="region.id" :value="region.id" class="text-gray-700">
        {{ region.name }}
      </option>
    </select>
  </div>
</template>

<script setup>
defineEmits(["regionChange"]);

const selectedRegionId = defineModel({
  type: String,
  required: true,
});

const regions = [
  { name: "Stokówka", id: "stokowka" },
  { name: "Wibrem 23 May", id: "wibrem-23-may" },
];
</script>

<style scoped>
/* Tailwind classes are used, no additional styles needed */
</style>
