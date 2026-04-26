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
  const toast = useToast();

  const baseURL = config.public.apiBase;

  const handleResponseError = async ({ response }: any) => {
    if (response.status === 403) {
      toast.add({
        title: "Access Denied",
        description: response._data?.message || "You do not have permission to perform this action.",
        color: "red"
      });
      // Re-fetch user to sync roles in case they changed
      await authStore.me();
    }
  };

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
      onResponseError: handleResponseError,
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
      onResponseError: handleResponseError,
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
      onResponseError: handleResponseError,
    });
  }

  async function del<T>(path: string): Promise<T> {
    return $fetch<T>(`${baseURL}/api${path}`, {
      method: "DELETE",
      headers: getHeaders(),
      onResponseError: handleResponseError,
    });
  }

  return { get, post, patch, del };
}
