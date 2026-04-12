import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;

  const authStore = useAuthStore();
  authStore.init();

  if (authStore.token) {
    return navigateTo("/dashboard");
  }
});
