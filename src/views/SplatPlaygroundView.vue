<template>
  <div class="splat-playground">
    <div class="tab-bar">
      <RouterLink :to="{ name: 'splat-upload' }">Upload</RouterLink>
      <RouterLink :to="{ name: 'splat-history' }">History</RouterLink>
    </div>
    <RouterView />
  </div>
</template>

<script setup>
</script>

<style scoped>
.splat-playground {
  width: 100%;
  min-height: 100vh;
  background: #111;
}

.tab-bar {
  display: flex;
  gap: 2px;
  padding: 12px 20px 0;
  border-bottom: 1px solid #1f2937;
  background: #0d0d0d;
}

.tab-bar a {
  padding: 8px 20px;
  background: transparent;
  color: #6b7280;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: none;
  transition: color 0.15s, border-color 0.15s;
}
.tab-bar a.router-link-active { color: #fff; border-bottom-color: #2563eb; }
.tab-bar a:hover:not(.router-link-active) { color: #d1d5db; }
</style>
