<script setup>
import { RouterView } from "vue-router";
import UserRoleSwitcher from "./components/UserRoleSwitcher.vue";
import AppHeader from "./components/AppHeader.vue";
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Global header -->
    <AppHeader />

    <!-- User role switcher for testing -->
    <div class="max-w-7xl mx-auto px-4 pt-4">
      <UserRoleSwitcher />
    </div>

    <!-- Main content -->
    <RouterView />
  </div>
</template>

<style scoped></style>
