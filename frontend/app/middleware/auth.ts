import { useAuthStore } from "#imports";

/**
 * auth middleware
 *
 * Protects routes from unauthenticated access.
 * Add to any page with: definePageMeta({ middleware: 'auth' })
 *
 * On first load, attempts to restore session from localStorage token.
 * If no valid token, redirects to /login.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  // Restore token from localStorage on first load
  if (!authStore.token && import.meta.client) {
    authStore.init();
  }

  // If still no token, redirect to login
  if (!authStore.token) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  // If token exists but no user loaded, fetch user profile
  if (!authStore.user) {
    await authStore.fetchUser();
    // fetchUser() calls logout() if token is invalid, which redirects to /login
  }
});
