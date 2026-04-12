<script setup lang="ts">
import { useAuthStore } from "#imports";

definePageMeta({ layout: "default" });

const route = useRoute();
const authStore = useAuthStore();

const status = ref<"loading" | "success" | "error">("loading");

onMounted(async () => {
  const token = route.query.token as string | undefined;
  const error = route.query.error as string | undefined;

  if (error || !token) {
    status.value = "error";
    return;
  }

  try {
    await authStore.setToken(token);
    status.value = "success";

    // Redirect to the relevant assignment if context provided
    const resourceLinkId = route.query.resourceLinkId as string | undefined;
    if (resourceLinkId) {
      setTimeout(() => navigateTo("/assignments"), 800);
    } else {
      setTimeout(() => navigateTo("/dashboard"), 800);
    }
  } catch {
    status.value = "error";
  }
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"
  >
    <div class="text-center space-y-4">
      <template v-if="status === 'loading'">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-10 h-10 text-[#861F41] animate-spin mx-auto"
        />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Launching from Canvas…
        </h2>
        <p class="text-sm text-gray-500">Setting up your session</p>
      </template>

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
          Ready
        </h2>
        <p class="text-sm text-gray-500">Taking you to your assignment…</p>
      </template>

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
          Launch failed
        </h2>
        <p class="text-sm text-gray-500">Please try again from Canvas.</p>
        <UButton variant="ghost" to="/login" size="sm">Go to login</UButton>
      </template>
    </div>
  </div>
</template>
