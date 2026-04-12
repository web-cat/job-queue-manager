<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const route = useRoute();
const { get } = useApi();

const {
  data: submission,
  pending,
  refresh,
} = await useAsyncData(`submission-${route.params.id}`, () =>
  get<any>(`/submissions/${route.params.id}`),
);

const { data: result } = await useAsyncData(
  `submission-result-${route.params.id}`,
  () => get<any>(`/submissions/${route.params.id}/result`),
);

// Poll for result if not graded yet
let pollInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  if (!submission.value?.feedbackReady) {
    pollInterval = setInterval(async () => {
      await refresh();
      if (submission.value?.feedbackReady && pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    }, 5000);
  }
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const scoreColor = computed(() => {
  if (!result.value?.score) return "text-gray-500";
  if (result.value.score >= 0.9) return "text-green-600 dark:text-green-400";
  if (result.value.score >= 0.7) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
});
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <UButton
      variant="ghost"
      size="sm"
      to="/submissions"
      icon="i-heroicons-arrow-left"
      class="mb-6"
    >
      Back to submissions
    </UButton>

    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-8 w-48" />
      <USkeleton class="h-40 w-full rounded-xl" />
    </div>

    <template v-else-if="submission">
      <!-- Status header -->
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-4"
      >
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">
            Submission #{{ submission.id }}
          </h1>
          <UBadge
            :label="submission.feedbackReady ? 'Graded' : 'Pending'"
            :color="submission.feedbackReady ? 'success' : 'warning'"
            variant="soft"
          />
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div
              class="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1"
            >
              Submitted
            </div>
            <div class="text-gray-900 dark:text-white font-mono">
              {{ formatDate(submission.createdAt) }}
            </div>
          </div>
          <div v-if="submission.assignmentOffering?.assignment">
            <div
              class="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1"
            >
              Assignment
            </div>
            <div class="text-gray-900 dark:text-white">
              {{ submission.assignmentOffering.assignment.name }}
            </div>
          </div>
        </div>
      </div>

      <!-- Grading result -->
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-4"
      >
        <h2 class="font-semibold text-gray-900 dark:text-white mb-4">
          Grading Result
        </h2>

        <!-- Pending state -->
        <div v-if="!submission.feedbackReady" class="text-center py-8">
          <div class="flex items-center justify-center gap-3 mb-3">
            <UIcon
              name="i-heroicons-arrow-path"
              class="w-5 h-5 text-amber-500 animate-spin"
            />
            <span class="text-gray-600 dark:text-gray-400 font-medium"
              >Grading in progress…</span
            >
          </div>
          <p class="text-sm text-gray-500">
            This page will update automatically when grading completes.
          </p>
        </div>

        <!-- Result available -->
        <template v-else-if="result?.ready">
          <!-- Score display -->
          <div
            class="flex items-center justify-center py-6 mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <div class="text-center">
              <div
                class="text-6xl font-bold font-mono mb-1"
                :class="scoreColor"
              >
                {{
                  result.score != null
                    ? `${Math.round(result.score * 100)}%`
                    : "—"
                }}
              </div>
              <div class="text-sm text-gray-500">Correctness Score</div>
            </div>
          </div>

          <!-- TODO: Show test case results when other team confirms result format -->
          <div
            class="text-center text-sm text-gray-500 font-mono p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
          >
            Detailed test case results coming soon<br />
            (pending other team API contract)
          </div>
        </template>
      </div>

      <!-- Job queue info -->
      <div
        v-if="submission.enqueuedJob"
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
      >
        <h2 class="font-semibold text-gray-900 dark:text-white mb-4">
          Queue Info
        </h2>
        <div class="grid grid-cols-2 gap-4 text-sm font-mono">
          <div>
            <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Job ID
            </div>
            <div class="text-gray-900 dark:text-white">
              {{ submission.enqueuedJob.id }}
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Status
            </div>
            <div class="text-gray-900 dark:text-white">
              {{ submission.enqueuedJob.status ?? "pending" }}
            </div>
          </div>
          <div v-if="submission.enqueuedJob.priority != null">
            <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Priority
            </div>
            <div class="text-gray-900 dark:text-white">
              {{ submission.enqueuedJob.priority }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="text-center py-16">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Submission not found
      </h3>
      <UButton variant="ghost" to="/submissions" size="sm" class="mt-2"
        >Back to submissions</UButton
      >
    </div>
  </div>
</template>
