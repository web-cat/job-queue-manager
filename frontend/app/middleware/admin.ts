export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  if (authStore.user?.globalRoleId !== 1) {
    return navigateTo('/dashboard')
  }
})
