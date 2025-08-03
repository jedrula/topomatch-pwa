<template>
  <div class="min-h-screen bg-gray-50">
    <main class="max-w-4xl mx-auto px-4 py-8">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Admin Management</h1>
        <p class="text-gray-600">Manage user roles and system administration</p>
      </div>

      <!-- Admin Panel Component -->
      <AdminPanel />
    </main>
  </div>
</template>

<script setup>
import AdminPanel from "@/components/AdminPanel.vue";
import { useUserStore } from "@/stores/userStore.js";
import { useRouter } from "vue-router";
import { onMounted } from "vue";

const userStore = useUserStore();
const router = useRouter();

// Redirect non-admins away from this page
onMounted(() => {
  if (!userStore.isLoading && !userStore.isAdmin) {
    console.warn("Access denied: Admin privileges required");
    router.push("/");
  }
});
</script>
