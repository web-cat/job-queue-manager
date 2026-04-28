import { nextTick } from "vue";

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return;

  const authStore = useAuthStore();

  await nextTick();

  if (!authStore.isAuthenticated) {
    return navigateTo("/login");
  }

  if (authStore.user?.globalRoleId !== 1) {
    return navigateTo("/dashboard");
  }
});
