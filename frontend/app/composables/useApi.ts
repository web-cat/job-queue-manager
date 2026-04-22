import { useAuthStore } from "~/stores/auth";

/**
 * useApi composable
 *
 * Wraps $fetch with automatic auth header injection and base URL.
 * Use this for all API calls from pages and components.
 *
 * Usage:
 *   const { get, post, patch, del } = useApi()
 *   const submissions = await get('/submissions')
 *   const result = await post('/submissions', { workoutId: 1 })
 */
export function useApi() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const baseURL = config.public.apiBase;

  function getHeaders(body?: unknown): Record<string, string> {
    const headers: Record<string, string> = {};
    // Do not set Content-Type for FormData; the browser needs to set it with the boundary
    if (!(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    if (authStore.token) {
      headers["Authorization"] = `Bearer ${authStore.token}`;
    }
    return headers;
  }

  async function get<T>(
    path: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    return $fetch<T>(`${baseURL}/api${path}`, {
      method: "GET",
      headers: getHeaders(),
      params,
    });
  }

  async function post<T>(
    path: string,
    body?: Record<string, unknown> | unknown[] | FormData,
  ): Promise<T> {
    return $fetch<T>(`${baseURL}/api${path}`, {
      method: "POST",
      headers: getHeaders(body),
      body: body as any,
    });
  }

  async function patch<T>(
    path: string,
    body?: Record<string, unknown> | unknown[] | FormData,
  ): Promise<T> {
    return $fetch<T>(`${baseURL}/api${path}`, {
      method: "PATCH",
      headers: getHeaders(body),
      body: body as any,
    });
  }

  async function del<T>(path: string): Promise<T> {
    return $fetch<T>(`${baseURL}/api${path}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  }

  return { get, post, patch, del };
}
