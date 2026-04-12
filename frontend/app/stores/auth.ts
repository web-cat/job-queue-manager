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

export const useAuthStore = defineStore("auth", () => {
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
   * Restore token from localStorage on app startup.
   */
  function init() {
    if (import.meta.client) {
      const stored = localStorage.getItem("auth_token");
      if (stored) token.value = stored;
    }
  }

  /**
   * Clear local auth state — used when token is invalid/expired.
   */
  function clearAuth() {
    token.value = null;
    user.value = null;
    if (import.meta.client) {
      localStorage.removeItem("auth_token");
    }
  }

  /**
   * Fetch current user profile from backend.
   */
  async function fetchUser() {
    if (!token.value) return;
    const config = useRuntimeConfig();
    try {
      const data = await $fetch<AuthUser>(
        `${config.public.apiBase}/api/auth/me`,
        { headers: { Authorization: `Bearer ${token.value}` } },
      );
      user.value = data;
    } catch {
      clearAuth();
    }
  }

  /**
   * Set token after login and fetch user profile.
   */
  async function setToken(newToken: string) {
    token.value = newToken;
    if (import.meta.client) {
      localStorage.setItem("auth_token", newToken);
    }
    await fetchUser();
  }

  /**
   * Local email/password login.
   */
  async function login(email: string, password: string): Promise<void> {
    const config = useRuntimeConfig();
    const data = await $fetch<{ token: { value: string } }>(
      `${config.public.apiBase}/api/auth/login`,
      { method: "POST", body: { email, password } },
    );
    await setToken(data.token.value);
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
    // State
    token,
    user,
    // Getters
    isAuthenticated,
    fullName,
    initials,
    // Actions
    init,
    clearAuth,
    fetchUser,
    setToken,
    login,
    logout,
  };
});
