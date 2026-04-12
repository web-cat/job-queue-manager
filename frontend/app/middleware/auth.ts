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

// export default defineNuxtRouteMiddleware(async (to) => {
//   // Skip on server — no localStorage available
//   if (import.meta.server) return;

//   const authStore = useAuthStore();

//   authStore.init();

//   if (!authStore.token) {
//     return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
//   }

//   if (!authStore.user) {
//     await authStore.fetchUser();
//   }
// });
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  const authStore = useAuthStore();

  console.log("Before init - token:", authStore.token);
  authStore.init();
  console.log("After init - token:", authStore.token);
  console.log("localStorage token:", localStorage.getItem("auth_token"));

  if (!authStore.token) {
    console.log("No token, redirecting to login");
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  if (!authStore.user) {
    await authStore.fetchUser();
  }
});
