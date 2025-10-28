import { ref } from 'vue';

export function useDraggable(initialX = 20, initialY = 20) {
  const isDragging = ref(false);
  const dragStartX = ref(0);
  const dragStartY = ref(0);
  const x = ref(initialX);
  const y = ref(initialY);
  const elementRef = ref(null);

  const startDrag = (event) => {
    isDragging.value = true;
    dragStartX.value = event.clientX - x.value;
    dragStartY.value = event.clientY - y.value;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    event.preventDefault();
  };

  const onDrag = (event) => {
    if (!isDragging.value) return;

    const newX = event.clientX - dragStartX.value;
    const newY = event.clientY - dragStartY.value;

    // Keep within viewport bounds
    const maxX = window.innerWidth - (elementRef.value?.offsetWidth || 300);
    const maxY = window.innerHeight - (elementRef.value?.offsetHeight || 400);

    x.value = Math.max(0, Math.min(newX, maxX));
    y.value = Math.max(0, Math.min(newY, maxY));
  };

  const stopDrag = () => {
    isDragging.value = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  return {
    isDragging,
    x,
    y,
    elementRef,
    startDrag,
  };
}
