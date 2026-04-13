import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

/**
 * Pinia persisted state plugin
 *
 * Automatically saves and restores Pinia store state to/from localStorage.
 * This replaces the manual init() / localStorage approach in the auth store.
 * Stores opt in by adding a `persist` option to their defineStore() call.
 */
export default defineNuxtPlugin((nuxtApp) => {
  // @ts-ignore — $pinia is added by @pinia/nuxt
  nuxtApp.$pinia.use(piniaPluginPersistedstate)
})
