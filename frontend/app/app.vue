<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();

// Only run on client — localStorage is not available server-side
if (import.meta.client) {
  authStore.init();
}
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :key="$route.fullPath" />
    </NuxtLayout>
  </UApp>
</template>
<style>
:root {
  --font-sans: "DM Sans", system-ui, sans-serif;
  --font-mono: "DM Mono", "Fira Code", monospace;
}

* {
  font-family: var(--font-sans);
}

code,
pre,
kbd,
.font-mono {
  font-family: var(--font-mono);
}
</style>
