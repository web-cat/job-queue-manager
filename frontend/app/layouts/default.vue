<script setup lang="ts">
import { useAuthStore } from "#imports";

const authStore = useAuthStore();
const route = useRoute();

// Hide nav on auth pages
const isAuthPage = computed(() =>
  ["/login", "/auth/callback", "/lti/launch"].some((p) =>
    route.path.startsWith(p),
  ),
);

const navLinks = [
  { label: "Dashboard", to: "/dashboard", icon: "i-heroicons-home" },
  {
    label: "Assignments",
    to: "/assignments",
    icon: "i-heroicons-clipboard-document-list",
  },
  {
    label: "Submissions",
    to: "/submissions",
    icon: "i-heroicons-code-bracket",
  },
  { label: "Courses", to: "/courses", icon: "i-heroicons-academic-cap" },
];
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Top nav bar -->
    <header
      v-if="!isAuthPage && authStore.isAuthenticated"
      class="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <NuxtLink to="/dashboard" class="flex items-center gap-3 group">
            <div
              class="w-8 h-8 rounded-lg bg-[#861F41] flex items-center justify-center"
            >
              <span class="text-white text-sm font-bold font-mono">JQ</span>
            </div>
            <span
              class="font-semibold text-gray-900 dark:text-white tracking-tight"
            >
              Job Queue
            </span>
          </NuxtLink>

          <!-- Nav links -->
          <nav class="hidden md:flex items-center gap-1">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="
                route.path.startsWith(link.to)
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              "
            >
              <UIcon :name="link.icon" class="w-4 h-4" />
              {{ link.label }}
            </NuxtLink>
          </nav>

          <!-- User menu -->
          <div class="flex items-center gap-3">
            <UColorModeButton />
            <UDropdownMenu
              :items="[
                [
                  {
                    label: authStore.fullName ?? authStore.user?.email ?? '',
                    disabled: true,
                  },
                  { type: 'separator' },
                  {
                    label: 'Sign out',
                    icon: 'i-heroicons-arrow-right-on-rectangle',
                    onSelect: () => authStore.logout(),
                  },
                ],
              ]"
            >
              <UAvatar
                :alt="authStore.initials"
                size="sm"
                class="cursor-pointer ring-2 ring-[#861F41]/20 hover:ring-[#861F41]/60 transition-all"
              />
            </UDropdownMenu>
          </div>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main>
      <slot />
    </main>
  </div>
</template>
