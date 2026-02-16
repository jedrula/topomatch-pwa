<template>
  <div class="relative w-full">
    <svg
      :viewBox="`0 0 ${viewBox.width} ${viewBox.height}`"
      class="w-full h-auto"
      style="max-height: 300px"
    >
      <!-- Floorplan outline -->
      <polygon
        :points="pointsToString(offsetPoints(outline))"
        class="floorplan-outline"
      />

      <!-- Sections -->
      <g v-for="section in sections" :key="section.id">
        <polygon
          :points="pointsToString(offsetPoints(section.points))"
          :class="[
            'floorplan-section transition-all duration-200 cursor-pointer',
            { 'active': activeSection === section.id }
          ]"
          @click="$emit('section-click', section.id)"
        />
        
        <!-- Section label -->
        <text
          :x="centroid(offsetPoints(section.points)).x"
          :y="centroid(offsetPoints(section.points)).y - 14"
          text-anchor="middle"
          font-size="18"
          :class="[
            'transition-colors duration-200 pointer-events-none',
            activeSection === section.id ? 'fill-blue-600' : 'fill-gray-500'
          ]"
        >
          {{ typeIcons[section.type] || '▮' }}
        </text>
        <text
          :x="centroid(offsetPoints(section.points)).x"
          :y="centroid(offsetPoints(section.points)).y + 6"
          text-anchor="middle"
          font-size="12"
          font-weight="600"
          :class="[
            'transition-colors duration-200 pointer-events-none',
            activeSection === section.id ? 'fill-gray-900' : 'fill-gray-700'
          ]"
        >
          {{ section.name }}
        </text>
        <text
          :x="centroid(offsetPoints(section.points)).x"
          :y="centroid(offsetPoints(section.points)).y + 22"
          text-anchor="middle"
          font-size="10"
          class="fill-gray-500 pointer-events-none"
        >
          {{ section.imageIds?.length || 0 }} photos
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  sections: {
    type: Array,
    required: true
  },
  outline: {
    type: Array,
    required: true
  },
  activeSection: {
    type: String,
    default: null
  }
});

defineEmits(['section-click']);

const typeIcons = {
  slab: '◣',
  overhang: '◤',
  cave: '◠',
  vertical: '▮'
};

function getBBox(points) {
  if (!points || points.length === 0) {
    // Default viewBox when no outline exists (larger = more zoomed out)
    return {
      minX: 0,
      minY: 0,
      maxX: 2000,
      maxY: 1500
    };
  }
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys)
  };
}

function pointsToString(points) {
  return points.map(p => `${p.x},${p.y}`).join(' ');
}

function centroid(points) {
  const n = points.length;
  return {
    x: points.reduce((s, p) => s + p.x, 0) / n,
    y: points.reduce((s, p) => s + p.y, 0) / n
  };
}

const viewBox = computed(() => {
  const bbox = getBBox(props.outline);
  const pad = 20;
  return {
    width: bbox.maxX - bbox.minX + pad * 2,
    height: bbox.maxY - bbox.minY + pad * 2
  };
});

const offset = computed(() => {
  const bbox = getBBox(props.outline);
  const pad = 20;
  return {
    x: -bbox.minX + pad,
    y: -bbox.minY + pad
  };
});

function offsetPoints(points) {
  return points.map(p => ({ x: p.x + offset.value.x, y: p.y + offset.value.y }));
}
</script>

<style scoped>
.floorplan-outline {
  fill: hsl(var(--floorplan-bg));
  stroke: hsl(var(--floorplan-border));
  stroke-width: 2;
}

.floorplan-section {
  fill: hsl(var(--floorplan-section));
  stroke: hsl(var(--floorplan-border));
  stroke-width: 1.5;
}

.floorplan-section.active {
  fill: hsl(var(--floorplan-section-active));
  stroke: rgb(37, 99, 235);
  stroke-width: 2.5;
}

.floorplan-section:not(.active):hover {
  fill: hsl(var(--floorplan-section-hover));
}
</style>
