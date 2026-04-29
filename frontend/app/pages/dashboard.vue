<script setup lang="ts">
import { useAuthStore } from "#imports";

definePageMeta({ middleware: "auth" });

const authStore = useAuthStore();
const config = useRuntimeConfig();
const { get } = useApi();

type ServiceStatusState =
  | "loading"
  | "online"
  | "offline"
  | "restricted"
  | "cluster-only";

type ServiceStatus = {
  state: ServiceStatusState;
  label: string;
  detail: string;
};

const apiStatus = ref<ServiceStatus>({
  state: "loading",
  label: "Checking...",
  detail: "Probing the backend root endpoint",
});

const queueStatus = ref<ServiceStatus>({
  state: "loading",
  label: "Checking...",
  detail: "Probing the grading cluster status",
});

const statusPollInterval = ref<ReturnType<typeof setInterval> | null>(null);

const { data: submissions, pending: loadingSubmissions } = await useAsyncData(
  "dashboard-submissions",
  () =>
    get<{ data: any[] }>("/submissions?limit=5")
      .then((r) => r.data)
      .catch(() => []),
);

const stats = computed(() => ({
  total: submissions.value?.length ?? 0,
  graded: submissions.value?.filter((s: any) => s.feedbackReady).length ?? 0,
  pending: submissions.value?.filter((s: any) => !s.feedbackReady).length ?? 0,
}));

const jobQueueApiBase = computed(() =>
  String(config.public.jobQueueApiUrl ?? "")
    .trim()
    .replace(/\/$/, ""),
);
const jobQueueApiKey = computed(() =>
  String(config.public.jobQueueApiKey ?? "").trim(),
);
const queueProxyUrl = computed(
  () =>
    String(config.public.apiBase ?? "")
      .trim()
      .replace(/\/$/, "") + "/api/administration/execution/queue/status",
);

const casStatus = computed<ServiceStatus>(() => {
  const apiHost = new URL(config.public.apiBase).hostname;
  const isLocalApi = ["localhost", "127.0.0.1", "0.0.0.0"].includes(apiHost);

  if (isLocalApi) {
    return {
      state: "cluster-only",
      label: "Cluster only",
      detail: "CAS login only works against the Discovery cluster.",
    };
  }

  return {
    state: "online",
    label: "Online",
    detail: "CAS login should be available from this deployment.",
  };
});

const systemStatuses = computed(() => [
  {
    title: "API",
    status: apiStatus.value,
  },
  {
    title: "Grading Cluster",
    status: queueStatus.value,
  },
  {
    title: "CAS Auth",
    status: casStatus.value,
  },
]);

function statusTone(state: ServiceStatusState) {
  if (state === "online") {
    return {
      dot: "bg-green-500",
      label: "text-green-600 dark:text-green-400",
    };
  }

  if (state === "restricted") {
    return {
      dot: "bg-sky-500",
      label: "text-sky-600 dark:text-sky-400",
    };
  }

  if (state === "cluster-only") {
    return {
      dot: "bg-amber-500",
      label: "text-amber-600 dark:text-amber-400",
    };
  }

  if (state === "loading") {
    return {
      dot: "bg-gray-400 animate-pulse",
      label: "text-gray-500",
    };
  }

  return {
    dot: "bg-red-500",
    label: "text-red-600 dark:text-red-400",
  };
}

function setServiceStatus(
  target: Ref<ServiceStatus>,
  state: ServiceStatusState,
  label: string,
  detail: string,
) {
  target.value = { state, label, detail };
}

async function refreshSystemStatuses() {
  await nextTick();

  try {
    const response = await fetch(`${config.public.apiBase}/`, {
      cache: "no-store",
    });
    if (response.ok) {
      setServiceStatus(
        apiStatus,
        "online",
        "Online",
        "Backend root endpoint responded successfully.",
      );
    } else {
      setServiceStatus(
        apiStatus,
        "offline",
        "Offline",
        `Backend root returned ${response.status}.`,
      );
    }
  } catch {
    setServiceStatus(
      apiStatus,
      "offline",
      "Offline",
      "Backend root could not be reached.",
    );
  }

  try {
    const response = await fetch(queueProxyUrl.value, {
      cache: "no-store",
      headers: authStore.token
        ? { Authorization: `Bearer ${authStore.token}` }
        : {},
    });

    if (response.ok) {
      setServiceStatus(
        queueStatus,
        "online",
        "Online",
        "Grading cluster status received successfully.",
      );
      return;
    }

    if (response.status === 403) {
      setServiceStatus(
        queueStatus,
        "restricted",
        "Restricted",
        "Queue status is available, but this account cannot view it.",
      );
      return;
    }

    setServiceStatus(
      queueStatus,
      "offline",
      "Offline",
      `Grading cluster returned ${response.status}.`,
    );
  } catch {
    setServiceStatus(
      queueStatus,
      "offline",
      "Offline",
      "Grading cluster could not be reached.",
    );
  }
}

onMounted(() => {
  void refreshSystemStatuses();
  statusPollInterval.value = setInterval(() => {
    void refreshSystemStatuses();
  }, 60000);
});

onUnmounted(() => {
  if (statusPollInterval.value) {
    clearInterval(statusPollInterval.value);
    statusPollInterval.value = null;
  }
});

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Good
        {{
          new Date().getHours() < 12
            ? "morning"
            : new Date().getHours() < 17
              ? "afternoon"
              : "evening"
        }},
        <span class="text-[#861F41]">{{
          authStore.fullName ?? authStore.user?.slug
        }}</span>
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm font-mono">
        {{ authStore.user?.email }}
      </p>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
      >
        <div
          class="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
        >
          Total Submissions
        </div>
        <div class="text-3xl font-bold text-gray-900 dark:text-white font-mono">
          {{ stats.total }}
        </div>
      </div>
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
      >
        <div
          class="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
        >
          Graded
        </div>
        <div
          class="text-3xl font-bold text-green-600 dark:text-green-400 font-mono"
        >
          {{ stats.graded }}
        </div>
      </div>
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
      >
        <div
          class="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
        >
          Pending
        </div>
        <div
          class="text-3xl font-bold text-amber-600 dark:text-amber-400 font-mono"
        >
          {{ stats.pending }}
        </div>
      </div>
    </div>

    <!-- Main grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent submissions -->
      <div
        class="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
      >
        <div
          class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between"
        >
          <h2 class="font-semibold text-gray-900 dark:text-white">
            Recent Submissions
          </h2>
          <UButton variant="ghost" size="xs" to="/submissions"
            >View all</UButton
          >
        </div>

        <div v-if="loadingSubmissions" class="p-6 space-y-3">
          <USkeleton v-for="i in 3" :key="i" class="h-12 w-full" />
        </div>

        <div v-else-if="!submissions?.length" class="p-12 text-center">
          <UIcon
            name="i-heroicons-code-bracket"
            class="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3"
          />
          <p class="text-sm text-gray-500">No submissions yet</p>
          <UButton variant="soft" size="sm" to="/assignments" class="mt-3"
            >Browse assignments</UButton
          >
        </div>

        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <NuxtLink
            v-for="sub in submissions"
            :key="sub.id"
            :to="`/submissions/${sub.id}`"
            class="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-2 h-2 rounded-full flex-shrink-0"
                :class="
                  sub.feedbackReady
                    ? 'bg-green-500'
                    : 'bg-amber-500 animate-pulse'
                "
              />
              <div>
                <div
                  class="text-sm font-medium text-gray-900 dark:text-white group-hover:text-[#861F41] transition-colors"
                >
                  Submission #{{ sub.id }}
                </div>
                <div class="text-xs text-gray-500 font-mono">
                  {{ timeAgo(sub.createdAt) }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UBadge
                :label="sub.feedbackReady ? 'Graded' : 'Pending'"
                :color="sub.feedbackReady ? 'success' : 'warning'"
                variant="soft"
                size="xs"
              />
              <UIcon
                name="i-heroicons-chevron-right"
                class="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors"
              />
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="space-y-4">
        <div
          class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
        >
          <h2 class="font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div class="space-y-2">
            <UButton
              to="/assignments"
              variant="soft"
              class="w-full justify-start"
              icon="i-heroicons-clipboard-document-list"
            >
              Browse Assignments
            </UButton>
            <UButton
              to="/submissions"
              variant="soft"
              class="w-full justify-start"
              icon="i-heroicons-code-bracket"
            >
              My Submissions
            </UButton>
            <UButton
              to="/courses"
              variant="soft"
              class="w-full justify-start"
              icon="i-heroicons-academic-cap"
            >
              My Courses
            </UButton>
          </div>
        </div>

        <!-- System status -->
        <div
          class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
        >
          <h2 class="font-semibold text-gray-900 dark:text-white mb-4">
            System Status
          </h2>
          <div class="space-y-3">
            <div
              v-for="service in systemStatuses"
              :key="service.title"
              class="rounded-lg border border-gray-100 dark:border-gray-800 px-3 py-2"
            >
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="text-gray-600 dark:text-gray-400">{{
                  service.title
                }}</span>
                <div class="flex items-center gap-1.5 shrink-0">
                  <div
                    class="w-1.5 h-1.5 rounded-full"
                    :class="statusTone(service.status.state).dot"
                  />
                  <span
                    class="font-mono text-xs"
                    :class="statusTone(service.status.state).label"
                  >
                    {{ service.status.label }}
                  </span>
                </div>
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ service.status.detail }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
