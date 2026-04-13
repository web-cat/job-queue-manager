<script setup lang="ts">
import { useAuthStore } from "#imports";

definePageMeta({ layout: "false" });

const route = useRoute();
const authStore = useAuthStore();

const status = ref<"loading" | "success" | "error">("loading");
const errorMessage = ref<string | null>(null);

onMounted(async () => {
  const token = route.query.token as string | undefined;
  const error = route.query.error as string | undefined;

  if (error || !token) {
    status.value = "error";
    errorMessage.value = "Authentication failed. Please try again.";
    setTimeout(() => navigateTo("/login?error=" + (error ?? "unknown")), 2000);
    return;
  }

  try {
    await authStore.setToken(token);
    status.value = "success";

    // Small delay so user sees the success state
    setTimeout(() => navigateTo("/dashboard"), 800);
  } catch {
    status.value = "error";
    errorMessage.value = "Failed to load your profile. Please try again.";
    setTimeout(() => navigateTo("/login"), 2000);
  }
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"
  >
    <div class="text-center space-y-4">
      <!-- Loading -->
      <template v-if="status === 'loading'">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-10 h-10 text-[#861F41] animate-spin mx-auto"
        />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Signing you in…
        </h2>
        <p class="text-sm text-gray-500">Verifying your VT credentials</p>
      </template>

      <!-- Success -->
      <template v-else-if="status === 'success'">
        <div
          class="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto"
        >
          <UIcon
            name="i-heroicons-check"
            class="w-7 h-7 text-green-600 dark:text-green-400"
          />
        </div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Signed in successfully
        </h2>
        <p class="text-sm text-gray-500">Redirecting to your dashboard…</p>
      </template>

      <!-- Error -->
      <template v-else>
        <div
          class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto"
        >
          <UIcon
            name="i-heroicons-x-mark"
            class="w-7 h-7 text-red-600 dark:text-red-400"
          />
        </div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Sign in failed
        </h2>
        <p class="text-sm text-gray-500">{{ errorMessage }}</p>
      </template>
    </div>
  </div>
</template>
