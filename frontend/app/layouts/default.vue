<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
const route = useRoute();

// Hide nav on auth pages only
const isAuthPage = computed(
  () =>
    route.path === "/login" ||
    route.path.startsWith("/auth/") ||
    route.path.startsWith("/lti/"),
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

async function handleLogout() {
  await authStore.logout();
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Top nav — shown on all non-auth pages regardless of auth state -->
    <!-- Auth middleware handles redirecting unauthenticated users before they see this -->
    <header
      v-if="!isAuthPage"
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

          <!-- Right side actions -->
          <div class="flex items-center gap-2">
            <UColorModeButton />

            <!-- User info + sign out -->
            <div class="flex items-center gap-2">
              <span
                v-if="authStore.user"
                class="hidden sm:block text-sm text-gray-600 dark:text-gray-400 font-mono"
              >
                {{ authStore.user.slug }}
              </span>

              <!-- Sign out button — always visible -->
              <UButton
                variant="ghost"
                size="sm"
                icon="i-heroicons-arrow-right-on-rectangle"
                :loading="false"
                @click="handleLogout"
              >
                <span class="hidden sm:inline">Sign out</span>
              </UButton>
            </div>
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
