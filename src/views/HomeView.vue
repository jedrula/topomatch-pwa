<template>
  <main>
    <div class="my-2">
      <RegionPicker @regionChange="onRegionChange" />
    </div>
    <MainFooter />
  </main>
</template>

<script setup>
import { useRouter } from "vue-router";
import RegionPicker from "@/components/RegionPicker.vue";
import MainFooter from "@/components/MainFooter.vue";

const router = useRouter();

function onRegionChange(newRegionId) {
  router.push({ name: "region", params: { regionId: newRegionId } });
}
</script>

<style scoped>
/* Add your styles here */
</style>
