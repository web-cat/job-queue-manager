import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;

  const authStore = useAuthStore();

  // Use nextTick to ensure pinia-persistedstate has hydrated
  return navigateTo(authStore.token ? "/dashboard" : "/login", {
    replace: true,
  });
});
