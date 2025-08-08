<template>
  <g
    :class="holdClasses"
    :style="holdStyles"
    @click.stop="handleClick"
    @mouseenter="handleHover(true)"
    @mouseleave="handleHover(false)"
    v-html="svgMarkup"
  ></g>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  svgMarkup: {
    type: String,
    required: true,
  },
  interaction: {
    type: String,
    default: "default",
    validator: (value) => ["default", "selected", "hidden", "hover"].includes(value),
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    default: "#3b82f6", // blue-500
  },
});

const emit = defineEmits(["click", "hover"]);

const holdClasses = computed(() => {
  const classes = ["hold-svg"];

  classes.push(`interaction-${props.interaction}`);

  if (props.selectable) {
    classes.push("selectable");
  }

  return classes;
});

const holdStyles = computed(() => {
  const styles = {};

  // Apply color for selected state
  if (props.interaction === "selected") {
    styles["--hold-color"] = props.color;
  }

  return styles;
});

const handleClick = () => {
  if (props.selectable) {
    emit("click");
  }
};

const handleHover = (isEntering) => {
  emit("hover", isEntering);
};
</script>

<style scoped>
.hold-svg {
  transition: opacity 0.2s ease, filter 0.2s ease, transform 0.2s ease;
  cursor: default;
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
  stroke-width: 3;
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
  stroke-width: 4;
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8));
}

/* Non-selectable holds should not respond to pointer events */
.hold-svg:not(.selectable) {
  pointer-events: none;
}

.selectable {
  pointer-events: auto;
}
</style>
