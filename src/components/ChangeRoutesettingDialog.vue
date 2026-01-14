<template>
  <div
    v-if="video"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click.self="handleCancel"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <h3 class="text-[15px] font-semibold text-gray-900 mb-2">Change Video Routesetting</h3>
      <p class="text-gray-600 text-[13px] mb-4">
        This will move the video to a different routesetting period and <strong>clear any boulder problem assignment</strong>.
      </p>
      
      <div class="mb-6">
        <label class="block text-[13px] font-medium text-gray-700 mb-2">
          Select Routesetting:
        </label>
        <select
          v-model="selectedRoutesetting"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="" disabled>Choose a routesetting...</option>
          <option
            v-for="rs in availableRoutesettings"
            :key="rs"
            :value="rs"
          >
            {{ formatRoutesettingDate(rs) }}
          </option>
        </select>
      </div>

      <div class="flex gap-3 justify-end">
        <button
          @click="handleCancel"
          :disabled="isChanging"
          class="btn-secondary h-9 px-4"
        >
          Cancel
        </button>
        <button
          @click="handleConfirm"
          :disabled="isChanging || !selectedRoutesetting"
          class="h-9 px-4 bg-purple-600 text-white text-[13px] font-medium rounded-md hover:bg-purple-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none inline-flex items-center gap-2"
        >
          <span v-if="isChanging" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ isChanging ? 'Updating...' : 'Move & Clear Assignment' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  video: {
    type: Object,
    default: null
  },
  availableRoutesettings: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'success']);

const selectedRoutesetting = ref('');
const isChanging = ref(false);

// Pre-select current routesetting when video changes
watch(() => props.video, (newVideo) => {
  if (newVideo) {
    selectedRoutesetting.value = newVideo.routesetting || '';
  }
}, { immediate: true });

const formatRoutesettingDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const handleCancel = () => {
  if (isChanging.value) return;
  emit('close');
};

const handleConfirm = async () => {
  if (!props.video || !selectedRoutesetting.value || isChanging.value) return;

  try {
    isChanging.value = true;
    
    // Import ascentService to update the ascent
    const { ascentService } = await import('@/services/ascentService');
    
    await ascentService.updateAscent(props.video.id, {
      routesetting: selectedRoutesetting.value,
      problemId: null, // Clear problem assignment
      problemSnapshot: null, // Clear problem snapshot
    });
    
    // Emit success with video ID
    emit('success', props.video.id);
  } catch (error) {
    console.error('Error changing video routesetting:', error);
    alert(`Failed to change routesetting: ${error.message}`);
  } finally {
    isChanging.value = false;
  }
};
</script>
