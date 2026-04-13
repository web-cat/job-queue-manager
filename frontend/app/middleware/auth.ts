import { useAuthStore } from "~/stores/auth";

/**
 * auth middleware
 *
 * Protects routes from unauthenticated access.
 * Add to any page with: definePageMeta({ middleware: 'auth' })
 *
 * Token and user are restored automatically from localStorage by
 * pinia-plugin-persistedstate — no manual init() call needed here.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on server — localStorage only exists on client
  if (import.meta.server) return;

  const authStore = useAuthStore();

  if (!authStore.token) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  // Fetch user profile if token exists but user not loaded yet
  if (!authStore.user) {
    await authStore.fetchUser();
  }
});
