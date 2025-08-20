<template>
  <g
    :class="holdClasses"
    :style="holdStyles"
    @click.stop="handleClick"
    @mouseenter="handleHover(true, $event)"
    @mouseleave="handleHover(false, $event)"
    v-html="svgMarkup"
  ></g>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  svgMarkup: {
    type: String,
    required: true,
  },
  interaction: {
    type: String,
    default: 'default',
    validator: (value) =>
      [
        'default',
        'selected',
        'hidden',
        'hover',
        'drawing-background',
        'disabled',
        'delete-target',
        'delete-hover',
      ].includes(value),
  },
  interactionAllowed: {
    type: String,
    default: 'none',
    validator: (value) => ['selectable', 'forbidden', 'none'].includes(value),
  },
  color: {
    type: String,
    default: '#3b82f6', // blue-500
  },
});

const emit = defineEmits(['click', 'hover']);

const holdClasses = computed(() => {
  const classes = ['hold-svg'];

  classes.push(`interaction-${props.interaction}`);
  classes.push(`allowed-${props.interactionAllowed}`);

  return classes;
});

const holdStyles = computed(() => {
  const styles = {};

  // Apply color for selected and hover states
  if (props.interaction === 'selected' || props.interaction === 'hover') {
    styles['--hold-color'] = props.color;
  }

  return styles;
});

const handleClick = () => {
  if (props.interactionAllowed === 'selectable') {
    emit('click');
  }
};

const handleHover = (isEntering, event) => {
  console.log('🎯 HoldSvg handleHover:', { isEntering, hasEvent: !!event });
  emit('hover', isEntering, event);
};
</script>

<style scoped>
.hold-svg {
  transition: opacity 0.2s ease, filter 0.2s ease, transform 0.2s ease;
  fill: transparent;
}

.selectable {
  cursor: pointer;
}

/* Default: invisible */
.interaction-default {
  opacity: 0;
}

/* Selected: border only, no fill */
.interaction-selected {
  opacity: 1;
}

.interaction-selected :deep(path) {
  stroke: var(--hold-color, #3b82f6);
  stroke-width: 12;
  fill: transparent;
  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.6));
}

/* Hidden: solid fill with scale to cover completely */
.interaction-hidden {
  opacity: 1;
  transform: scale(1.1);
  transform-origin: center;
  transform-box: fill-box;
}

.interaction-hidden :deep(g) {
  transform: scale(1.1);
  transform-origin: center;
  transform-box: fill-box;
}

.interaction-hidden :deep(path) {
  fill: lab(82 5.83 24.45) !important; /* Rock-like gray color */
  stroke: lab(82 5.83 24.45) !important;
  stroke-width: 0 !important;
  opacity: 1 !important;
}

/* Hovered: enhanced visibility */
.interaction-hover {
  opacity: 1;
}

.interaction-hover :deep(path) {
  stroke: var(--hold-color, #3b82f6);
  stroke-width: 16;
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8));
}

/* Drawing background: low opacity for existing holds during drawing */
.interaction-drawing-background {
  opacity: 0.7;
}

.interaction-drawing-background :deep(path) {
  stroke: var(--hold-color, #3b82f6);
  stroke-width: 8;
  fill: transparent;
}

/* Interaction allowed states */
.allowed-selectable {
  cursor: pointer;
  pointer-events: auto;
}

.allowed-forbidden {
  cursor: not-allowed;
  pointer-events: auto;
}

.allowed-none {
  cursor: default;
  pointer-events: none;
}
/* Delete mode states */
.hold-svg-delete-target {
  cursor: crosshair;
  stroke: #ff4444;
  stroke-width: 3px;
  fill: rgba(255, 68, 68, 0.2);
  stroke-dasharray: 5, 5;
  animation: pulse-delete 1s infinite;
}

.hold-svg-delete-hover {
  cursor: crosshair;
  stroke: #ff0000;
  stroke-width: 4px;
  fill: rgba(255, 0, 0, 0.3);
  filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.8));
}

.hold-svg-disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

@keyframes pulse-delete {
  0% {
    stroke-opacity: 1;
  }
  50% {
    stroke-opacity: 0.5;
  }
  100% {
    stroke-opacity: 1;
  }
}
</style>
