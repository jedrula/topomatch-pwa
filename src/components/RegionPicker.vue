<template>
  <div class="text-center">
    <select
      id="region-picker"
      v-model="selectedRegionId"
      @change="$emit('regionChange', selectedRegionId)"
      class="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mx-auto"
    >
      <option disabled :value="undefined" class="text-gray-500">Select a location</option>
      <option v-for="region in regions" :key="region.id" :value="region.id" class="text-gray-700">
        {{ region.name }}
      </option>
    </select>

    <h2 class="text-lg font-semibold text-gray-700 mt-6">Popular Locations</h2>
    <div class="grid grid-cols-2 gap-4 mt-4 mx-auto" style="max-width: fit-content">
      <div
        v-for="region in regions"
        :key="region.id"
        @click="
          selectedRegionId = region.id;
          $emit('regionChange', region.id);
        "
        class="cursor-pointer w-32 h-32 border border-gray-300 rounded-md shadow-sm p-2 hover:bg-gray-100"
      >
        <img
          :src="region.thumbnail"
          :alt="region.name"
          class="w-full object-cover rounded-md"
          style="aspect-ratio: 1 / 1"
        />
        <p class="text-sm text-gray-700 mt-2">{{ region.name }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { REGIONS } from "@/constants/regions";

defineEmits(["regionChange"]);

const selectedRegionId = defineModel({
  type: String | undefined,
});

const regions = REGIONS;
</script>

<style scoped>
/* Tailwind classes are used, no additional styles needed */
</style>
