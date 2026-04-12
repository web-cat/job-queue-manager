<script setup lang="ts">
import { useAuthStore } from "#imports";

definePageMeta({ layout: "default" });

const authStore = useAuthStore();
const config = useRuntimeConfig();
const route = useRoute();

// Redirect if already authenticated
if (authStore.isAuthenticated) {
  await navigateTo("/dashboard");
}

const form = reactive({ email: "", password: "" });
const loading = ref(false);
const error = ref<string | null>(null);

// Show error from CAS/LTI redirect
if (route.query.error) {
  const errorMessages: Record<string, string> = {
    no_ticket: "CAS login failed — no ticket received.",
    invalid_ticket: "CAS ticket was invalid or expired. Please try again.",
    server_error: "A server error occurred during login. Please try again.",
    lti_error: "LTI launch failed. Please try again from Canvas.",
  };
  error.value =
    errorMessages[route.query.error as string] ??
    "Login failed. Please try again.";
}

const casLoginUrl = computed(() => `${config.public.apiBase}/api/auth/cas`);

async function handleLogin() {
  error.value = null;
  loading.value = true;
  try {
    await authStore.login(form.email, form.password);
    const redirect = route.query.redirect as string | undefined;
    await navigateTo(redirect ?? "/dashboard");
  } catch (e: any) {
    error.value = e?.data?.message ?? "Invalid email or password.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Left panel — branding -->
    <div
      class="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[#0A1628] relative overflow-hidden"
    >
      <!-- Background pattern -->
      <div class="absolute inset-0 opacity-10">
        <div
          class="absolute inset-0"
          style="
            background-image:
              linear-gradient(rgba(134, 31, 65, 0.3) 1px, transparent 1px),
              linear-gradient(
                90deg,
                rgba(134, 31, 65, 0.3) 1px,
                transparent 1px
              );
            background-size: 40px 40px;
          "
        />
      </div>

      <!-- Logo -->
      <div class="relative z-10 flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-[#861F41] flex items-center justify-center"
        >
          <span class="text-white font-bold font-mono text-lg">JQ</span>
        </div>
        <span class="text-white font-semibold text-lg tracking-tight"
          >Job Queue Manager</span
        >
      </div>

      <!-- Hero text -->
      <div class="relative z-10">
        <h1 class="text-4xl font-bold text-white leading-tight mb-4">
          Submit. Queue.<br />
          <span class="text-[#861F41]">Grade.</span>
        </h1>
        <p class="text-gray-400 text-lg leading-relaxed max-w-sm">
          The VT CS code submission and automated grading platform. Submit your
          assignments and get instant feedback.
        </p>
        <div class="mt-8 flex items-center gap-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-white font-mono">∞</div>
            <div class="text-xs text-gray-500 mt-1">Submissions</div>
          </div>
          <div class="w-px h-8 bg-gray-700" />
          <div class="text-center">
            <div class="text-2xl font-bold text-white font-mono">24/7</div>
            <div class="text-xs text-gray-500 mt-1">Grading</div>
          </div>
          <div class="w-px h-8 bg-gray-700" />
          <div class="text-center">
            <div class="text-2xl font-bold text-white font-mono">VT</div>
            <div class="text-xs text-gray-500 mt-1">Exclusive</div>
          </div>
        </div>
      </div>

      <!-- Bottom note -->
      <div class="relative z-10 text-gray-600 text-xs font-mono">
        Virginia Tech · Computer Science Department
      </div>
    </div>

    <!-- Right panel — login form -->
    <div
      class="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950"
    >
      <div class="w-full max-w-md">
        <!-- Mobile logo -->
        <div class="lg:hidden flex items-center gap-3 mb-8">
          <div
            class="w-8 h-8 rounded-lg bg-[#861F41] flex items-center justify-center"
          >
            <span class="text-white font-bold font-mono text-sm">JQ</span>
          </div>
          <span class="font-semibold text-gray-900 dark:text-white"
            >Job Queue Manager</span
          >
        </div>

        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Sign in with your VT credentials
          </p>
        </div>

        <!-- Error alert -->
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :title="error"
          icon="i-heroicons-exclamation-triangle"
          class="mb-6"
          closable
          @close="error = null"
        />

        <!-- CAS Login (primary) -->
        <UButton
          :to="casLoginUrl"
          external
          size="lg"
          class="w-full mb-4 bg-[#861F41] hover:bg-[#6d1835] text-white border-0"
          icon="i-heroicons-shield-check"
        >
          Sign in with VT CAS
        </UButton>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200 dark:border-gray-800" />
          </div>
          <div class="relative flex justify-center">
            <span
              class="px-3 bg-gray-50 dark:bg-gray-950 text-xs text-gray-500 font-mono"
              >or sign in locally</span
            >
          </div>
        </div>

        <!-- Local login form -->
        <UForm :state="form" @submit="handleLogin" class="space-y-4">
          <UFormField label="Email" name="email">
            <UInput
              v-model="form.email"
              type="email"
              placeholder="you@vt.edu"
              size="lg"
              class="w-full"
              autocomplete="email"
            />
          </UFormField>

          <UFormField label="Password" name="password">
            <UInput
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              size="lg"
              class="w-full"
              autocomplete="current-password"
            />
          </UFormField>

          <UButton
            type="submit"
            size="lg"
            variant="outline"
            :loading="loading"
            class="w-full"
          >
            Sign in
          </UButton>
        </UForm>

        <p class="mt-6 text-center text-xs text-gray-500 dark:text-gray-600">
          Local accounts are for development only.<br />
          Use VT CAS for production access.
        </p>
      </div>
    </div>
  </div>
</template>
