<template>
  <div class="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-3 animate-in fade-in">
    <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wider">Section Properties</h3>
    
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          :value="section.name"
          @input="$emit('update-field', 'name', $event.target.value)"
          class="w-full px-2.5 py-1.5 rounded-md bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Type</label>
        <select
          :value="section.type"
          @change="$emit('update-field', 'type', $event.target.value)"
          class="w-full px-2.5 py-1.5 rounded-md bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="slab">Slab</option>
          <option value="vertical">Vertical</option>
          <option value="overhang">Overhang</option>
          <option value="cave">Cave</option>
        </select>
      </div>
    </div>
    
    <p class="text-xs text-gray-500">
      {{ section.points.length }} vertices · Drag handles to reshape, click midpoints to add, dbl-click to remove
    </p>
  </div>
</template>

<script setup>
defineProps({
  section: {
    type: Object,
    required: true
  }
});

defineEmits(['update-field']);
</script>

<style scoped>
.animate-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
