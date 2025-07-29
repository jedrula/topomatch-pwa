<script setup>
import { RouterView } from "vue-router";
import UserRoleSwitcher from "./components/UserRoleSwitcher.vue";
import AppHeader from "./components/AppHeader.vue";
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Global header -->
    <AppHeader />

    <!-- Main content -->
    <RouterView />

    <!-- User role switcher for testing - positioned at bottom -->
    <div class="fixed bottom-4 right-4 z-40">
      <UserRoleSwitcher />
    </div>
  </div>
</template>

<style scoped></style>
