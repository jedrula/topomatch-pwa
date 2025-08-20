<template>
  <div class="pose-detection-view">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <h1 class="text-3xl font-bold text-gray-900">Pose Detection Playground</h1>
          <p class="mt-2 text-gray-600">
            Upload a climbing image to detect hand and foot positions using YOLO11n-pose
          </p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PoseDetector />
    </div>
  </div>
</template>

<script setup>
import PoseDetector from '@/components/PoseDetector.vue';
</script>
