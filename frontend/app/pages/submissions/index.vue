<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { get } = useApi();

const page = ref(1);
const {
  data: response,
  pending,
  refresh,
} = await useAsyncData("submissions", () =>
  get<{ data: any[]; meta: any }>(`/submissions?page=${page.value}&limit=15`),
);

const submissions = computed(() => response.value?.data ?? []);

watch(page, () => refresh());

function getCorrectnessScore(sub: any): number | null {
  const score = sub.submissionResult?.correctnessScore ?? sub.score;
  return typeof score === "number" ? score : null;
}

function statusColor(sub: any) {
  if (sub.feedbackReady) return "success";
  return "warning";
}

function statusLabel(sub: any) {
  if (sub.feedbackReady) return "Graded";
  return "Pending";
}

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
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Submissions
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your submitted solutions and grading results
        </p>
      </div>
      <UButton to="/assignments" icon="i-heroicons-plus" size="sm"
        >New submission</UButton
      >
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-2">
      <USkeleton v-for="i in 5" :key="i" class="h-16 w-full rounded-xl" />
    </div>

    <!-- Empty -->
    <div v-else-if="!submissions.length" class="text-center py-16">
      <UIcon
        name="i-heroicons-code-bracket"
        class="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4"
      />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        No submissions yet
      </h3>
      <p class="text-gray-500 text-sm mb-4">
        Submit your first solution to get started.
      </p>
      <UButton to="/assignments" size="sm">Browse assignments</UButton>
    </div>

    <!-- Submissions table -->
    <div
      v-else
      class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
    >
      <div class="divide-y divide-gray-100 dark:divide-gray-800">
        <NuxtLink
          v-for="sub in submissions"
          :key="sub.id"
          :to="`/submissions/${sub.id}`"
          class="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
        >
          <!-- Status indicator -->
          <div
            class="w-2.5 h-2.5 rounded-full flex-shrink-0"
            :class="
              sub.feedbackReady ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
            "
          />

          <!-- Main info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span
                class="font-medium text-gray-900 dark:text-white group-hover:text-[#861F41] transition-colors"
              >
                Submission #{{ sub.id }}
              </span>
              <UBadge
                :label="statusLabel(sub)"
                :color="statusColor(sub)"
                variant="soft"
                size="xs"
              />
            </div>
            <div class="text-xs text-gray-500 font-mono mt-0.5">
              {{ timeAgo(sub.createdAt) }}
              <template v-if="sub.assignmentOffering?.assignment">
                · {{ sub.assignmentOffering.assignment.name }}
              </template>
            </div>
          </div>

          <!-- Score if graded -->
          <div
            v-if="sub.feedbackReady && getCorrectnessScore(sub) != null"
            class="text-right"
          >
            <div
              class="text-lg font-bold font-mono"
              :class="
                getCorrectnessScore(sub)! >= 0.7
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              "
            >
              {{ Math.round(getCorrectnessScore(sub)! * 100) }}%
            </div>
          </div>

          <UIcon
            name="i-heroicons-chevron-right"
            class="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0"
          />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
