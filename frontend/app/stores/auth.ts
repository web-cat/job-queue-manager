import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { navigateTo, useRuntimeConfig } from "#app";

export interface AuthUser {
  id: number;
  email: string;
  slug: string;
  firstName: string | null;
  lastName: string | null;
  signInCount: number;
}

/**
 * Auth store with automatic persistence via pinia-plugin-persistedstate.
 *
 * The `persist` option at the bottom instructs the plugin to save `token`
 * and `user` to localStorage automatically on every change, and restore
 * them on page load — no manual init() calls needed in middleware or app.vue.
 *
 * The `.client` suffix on the plugin file ensures persistence only runs
 * on the client, avoiding SSR localStorage errors.
 */
export const useAuthStore = defineStore(
  "auth",
  () => {
    // ── State ──────────────────────────────────────────────────────────
    const token = ref<string | null>(null);
    const user = ref<AuthUser | null>(null);

    // ── Getters ────────────────────────────────────────────────────────
    const isAuthenticated = computed(() => !!token.value);

    const fullName = computed<string | null>(() => {
      if (!user.value) return null;
      if (user.value.firstName && user.value.lastName) {
        return `${user.value.firstName} ${user.value.lastName}`;
      }
      return user.value.slug;
    });

    const initials = computed<string>(() => {
      if (!user.value) return "?";
      if (user.value.firstName && user.value.lastName) {
        return `${user.value.firstName[0]}${user.value.lastName[0]}`.toUpperCase();
      }
      return user.value.slug.slice(0, 2).toUpperCase();
    });

    // ── Actions ────────────────────────────────────────────────────────

    /**
     * Clear local auth state.
     * Called when token is invalid/expired or on logout.
     */
    function clearAuth() {
      token.value = null;
      user.value = null;
    }

    /**
     * Fetch current user profile from backend.
     * Called after token is set to populate user details.
     */
    async function fetchUser() {
      if (!token.value) return;
      const config = useRuntimeConfig();
      try {
        console.log("store.login: apiBase =", config.public.apiBase);
        console.log(
          "store.login: calling",
          `${config.public.apiBase}/api/auth/login`,
        );
        const data = await $fetch<AuthUser>(
          `${config.public.apiBase}/api/auth/me`,
          { headers: { Authorization: `Bearer ${token.value}` } },
        );
        user.value = data;
      } catch {
        // Token invalid or expired — clear everything
        clearAuth();
      }
    }

    /**
     * Set token after CAS/LTI/local login and fetch user profile.
     */
    async function setToken(newToken: string) {
      token.value = newToken;
      await fetchUser();
    }

    /**
     * Local email/password login.
     */
    // async function login(email: string, password: string): Promise<void> {
    //   const config = useRuntimeConfig();
    //   const data = await $fetch<{ token: { value: string } }>(
    //     `${config.public.apiBase}/api/auth/login`,
    //     { method: "POST", body: { email, password } },
    //   );
    //   await setToken(data.token.value);
    // }
    async function login(email: string, password: string): Promise<void> {
      const config = useRuntimeConfig();
      console.log(
        "store.login: calling",
        `${config.public.apiBase}/api/auth/login`,
      );
      const data = await $fetch<{ token: { value: string } }>(
        `${config.public.apiBase}/api/auth/login`,
        { method: "POST", body: { email, password } },
      );
      console.log("store.login: got response", data);
      await setToken(data.token.value);
      console.log("store.login: token set", token.value?.slice(0, 20));
    }

    /**
     * Full logout — revoke token on server then clear local state.
     */
    async function logout() {
      const config = useRuntimeConfig();
      if (token.value) {
        try {
          await $fetch(`${config.public.apiBase}/api/auth/logout`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token.value}` },
          });
        } catch {
          // Ignore server errors — clear local state regardless
        }
      }
      clearAuth();
      await navigateTo("/login");
    }

    return {
      token,
      user,
      isAuthenticated,
      fullName,
      initials,
      clearAuth,
      fetchUser,
      setToken,
      login,
      logout,
    };
  },
  {
    // Persist token and user to localStorage automatically.
    // The plugin is loaded client-only via the .client.ts plugin file.
    persist: {
      key: "jqm-auth",
      pick: ["token", "user"],
    },
  },
);
