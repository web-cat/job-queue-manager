import { useAuthStore } from "~/stores/auth";

/**
 * guest middleware
 *
 * Redirects authenticated users away from public pages like /login.
 * Add to any page with: definePageMeta({ middleware: 'guest' })
 *
 * Token is restored automatically by pinia-plugin-persistedstate.
 */
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;

  const authStore = useAuthStore();

  if (authStore.token) {
    return navigateTo("/dashboard");
  }
});
