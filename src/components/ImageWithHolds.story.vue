<script setup>
import ImageWithHolds from './ImageWithHolds.vue'
</script>

<template>
  <Story title="ImageWithHolds" :layout="{ type: 'grid', width: '100%' }">
    
    <!-- Basic Example -->
    <Variant title="Basic Example">
      <ImageWithHolds viewBox="0 0 800 600">
        <template #image>
          <img 
            src="/otwarcie_fabryczna_testowy.jpg" 
            alt="Test climbing image"
            style="width: 400px; height: auto;"
          />
        </template>
        <template #overlay>
          <!-- Simple holds -->
          <circle cx="200" cy="150" r="20" fill="rgba(255, 0, 0, 0.6)" stroke="red" stroke-width="2" />
          <circle cx="300" cy="200" r="20" fill="rgba(0, 255, 0, 0.6)" stroke="green" stroke-width="2" />
          <circle cx="250" cy="300" r="20" fill="rgba(0, 0, 255, 0.6)" stroke="blue" stroke-width="2" />
        </template>
      </ImageWithHolds>
    </Variant>

    <!-- Auto-detect ViewBox -->
    <Variant title="Auto-detect ViewBox">
      <ImageWithHolds :autoDetectViewBox="true">
        <template #image>
          <img 
            src="/otwarcie_fabryczna_testowy.jpg" 
            alt="Test climbing image"
            style="width: 400px; height: auto;"
          />
        </template>
        <template #overlay>
          <!-- Holds positioned with image coordinates -->
          <circle cx="400" cy="300" r="30" fill="rgba(255, 165, 0, 0.6)" stroke="orange" stroke-width="3" />
          <circle cx="600" cy="400" r="25" fill="rgba(255, 0, 255, 0.6)" stroke="magenta" stroke-width="3" />
          <circle cx="500" cy="500" r="35" fill="rgba(0, 255, 255, 0.6)" stroke="cyan" stroke-width="3" />
        </template>
      </ImageWithHolds>
    </Variant>

    <!-- Complex Overlay -->
    <Variant title="Complex Hold Shapes">
      <ImageWithHolds viewBox="0 0 800 600">
        <template #image>
          <img 
            src="/otwarcie_fabryczna_testowy.jpg" 
            alt="Test climbing image"
            style="width: 400px; height: auto;"
          />
        </template>
        <template #overlay>
          <!-- Start hold -->
          <polygon 
            points="100,450 150,430 180,460 150,490 100,480" 
            fill="rgba(0, 255, 0, 0.7)" 
            stroke="green" 
            stroke-width="3" 
          />
          <!-- Intermediate holds -->
          <ellipse cx="250" cy="350" rx="25" ry="15" fill="rgba(255, 255, 0, 0.6)" stroke="gold" stroke-width="2" />
          <ellipse cx="350" cy="250" rx="20" ry="30" fill="rgba(255, 255, 0, 0.6)" stroke="gold" stroke-width="2" />
          <!-- Finish hold -->
          <rect 
            x="420" y="80" width="60" height="40" 
            fill="rgba(255, 0, 0, 0.7)" 
            stroke="red" 
            stroke-width="3" 
            rx="5"
          />
          <!-- Route line -->
          <path 
            d="M 125,465 Q 250,350 350,250 Q 400,150 450,100" 
            stroke="rgba(255, 255, 255, 0.8)" 
            stroke-width="3" 
            fill="none" 
            stroke-dasharray="5,5"
          />
        </template>
      </ImageWithHolds>
    </Variant>

    <!-- Responsive Example -->
    <Variant title="Responsive">
      <ImageWithHolds :autoDetectViewBox="true">
        <template #image>
          <img 
            src="/otwarcie_fabryczna_testowy.jpg" 
            alt="Test climbing image"
            style="width: 100%; max-width: 600px; height: auto;"
          />
        </template>
        <template #overlay>
          <!-- Holds that scale with the image -->
          <circle cx="200" cy="200" r="20" fill="rgba(255, 0, 0, 0.6)" stroke="red" stroke-width="2" />
          <circle cx="400" cy="300" r="20" fill="rgba(0, 255, 0, 0.6)" stroke="green" stroke-width="2" />
          <circle cx="600" cy="400" r="20" fill="rgba(0, 0, 255, 0.6)" stroke="blue" stroke-width="2" />
        </template>
      </ImageWithHolds>
    </Variant>

  </Story>
</template>
