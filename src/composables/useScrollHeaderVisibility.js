import { ref, computed, onMounted, onUnmounted } from 'vue';

/**
 * Composable for tracking scroll position and showing/hiding text based on scroll threshold
 * @param {number} threshold - Scroll position threshold (default: 100px)
 * @returns {Object} - { showText, scrollY }
 */
export function useScrollHeaderVisibility(threshold = 100) {
  const scrollY = ref(0);

  // Show text only when scrolled less than threshold
  const showText = computed(() => scrollY.value < threshold);

  const handleScroll = (event) => {
    scrollY.value = event.target.scrollTop;
  };

  onMounted(() => {
    // Find the scrolling container (.app-content)
    const scrollContainer = document.querySelector('.app-content');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
  });

  onUnmounted(() => {
    const scrollContainer = document.querySelector('.app-content');
    if (scrollContainer) {
      scrollContainer.removeEventListener('scroll', handleScroll);
    }
  });

  return {
    showText,
    scrollY,
  };
}
