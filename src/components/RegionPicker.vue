<template>
  <div style="margin-bottom: 2em">
    <label for="region-picker"><strong>Select a Region:</strong></label>
    <select
      id="region-picker"
      v-model="selectedRegionId"
      @change="$emit('regionChange', $event.target.value)"
    >
      <option disabled value="">-- Select a region --</option>
      <option v-for="region in regions" :key="region.id" :value="region.id">
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
