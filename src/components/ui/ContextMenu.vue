<template>
  <div ref="triggerRef" class="relative" @contextmenu.prevent="handleContextMenu">
    <slot />
    <slot name="trigger" :open="handleClick" />
  </div>

  <Teleport to="body">
    <Transition name="context-menu">
      <div
        v-if="isOpen"
        ref="menuRef"
        :style="menuStyle"
        class="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-950 shadow-md"
        @click="handleMenuClick"
      >
        <slot name="content" :close="close" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['open', 'close']);

const isOpen = ref(false);
const triggerRef = ref(null);
const menuRef = ref(null);
const position = ref({ x: 0, y: 0 });

const menuStyle = computed(() => ({
  position: 'fixed',
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  zIndex: 9999
}));

const handleClick = (e) => {
  const rect = e.target.getBoundingClientRect();
  position.value = { x: rect.right, y: rect.top };
  isOpen.value = true;
  emit('open');
  
  // Adjust position if menu would go off screen
  setTimeout(() => {
    if (!menuRef.value) return;
    const menuRect = menuRef.value.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (menuRect.right > viewportWidth) {
      position.value.x = rect.left - menuRect.width;
    }
    if (menuRect.bottom > viewportHeight) {
      position.value.y = viewportHeight - menuRect.height - 5;
    }
  }, 0);
};

const handleContextMenu = (e) => {
  position.value = { x: e.clientX, y: e.clientY };
  isOpen.value = true;
  emit('open');
  
  // Adjust position if menu would go off screen
  setTimeout(() => {
    if (!menuRef.value) return;
    const rect = menuRef.value.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (rect.right > viewportWidth) {
      position.value.x = viewportWidth - rect.width - 5;
    }
    if (rect.bottom > viewportHeight) {
      position.value.y = viewportHeight - rect.height - 5;
    }
  }, 0);
};

const close = () => {
  isOpen.value = false;
  emit('close');
};

const handleMenuClick = () => {
  close();
};

const handleClickOutside = (e) => {
  if (!isOpen.value) return;
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    close();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('contextmenu', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('contextmenu', handleClickOutside);
});
</script>

<style scoped>
.context-menu-enter-active,
.context-menu-leave-active {
  transition: opacity 0.1s, transform 0.1s;
}

.context-menu-enter-from,
.context-menu-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
