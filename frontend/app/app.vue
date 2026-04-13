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
