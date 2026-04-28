<script setup lang="ts">
import { useAuthStore } from "#imports";

definePageMeta({ middleware: "auth" });

const authStore = useAuthStore();
const { get } = useApi();

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
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">API</span>
              <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span
                  class="text-green-600 dark:text-green-400 font-mono text-xs"
                  >Online</span
                >
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Job Queue</span>
              <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span
                  class="text-green-600 dark:text-green-400 font-mono text-xs"
                  >Online</span
                >
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">CAS Auth</span>
              <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span
                  class="text-green-600 dark:text-green-400 font-mono text-xs"
                  >Online</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
