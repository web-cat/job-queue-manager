<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const route = useRoute();
const { get } = useApi();
const authStore = useAuthStore();
const config = useRuntimeConfig();
const toast = useToast();
const downloading = ref(false);

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

// Track all submissions for this assignment
const allAssignmentSubmissions = ref<any[]>([]);

// Fetch all submissions for the assignment once submission is loaded
const submissionNumber = computed(() => {
  if (!submission.value || !allAssignmentSubmissions.value.length) return null;
  const sorted = [...allAssignmentSubmissions.value].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const index = sorted.findIndex((s) => s.id === submission.value?.id);
  return index >= 0 ? index + 1 : null;
});

watch(
  () => submission.value?.workoutId,
  async (workoutId) => {
    if (!workoutId) return;
    try {
      const res = await get<{ data: any[] }>(
        `/submissions?workoutId=${workoutId}`,
      );
      allAssignmentSubmissions.value = res.data ?? [];
    } catch (error) {
      console.error("Failed to fetch assignment submissions:", error);
    }
  },
  { immediate: true },
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
    }, 15000);
  }
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});

const showInitialSkeleton = computed(() => pending.value && !submission.value);

const submissionResult = computed(
  () => result.value?.submissionResult ?? submission.value?.submissionResult,
);

const correctnessScore = computed<number | null>(() => {
  const score = submissionResult.value?.correctnessScore;
  return typeof score === "number" ? score : null;
});

const toolScore = computed<number | null>(() => {
  const score = submissionResult.value?.toolScore;
  return typeof score === "number" ? score : null;
});

const runtimeSeconds = computed<number | null>(() => {
  const runtimeMs = submissionResult.value?.runtimeMs;
  return typeof runtimeMs === "number" ? runtimeMs / 1000 : null;
});

const scoreColor = computed(() => {
  if (correctnessScore.value == null) return "text-gray-500";
  if (correctnessScore.value >= 0.9)
    return "text-green-600 dark:text-green-400";
  if (correctnessScore.value >= 0.7)
    return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
});

function formatPercent(score: number | null): string {
  return score == null ? "—" : `${Math.round(score * 100)}%`;
}

function formatRuntime(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
  return `${seconds.toFixed(2)} s`;
}

function formatComments(comments: string | null | undefined): string {
  return comments?.trim() || "No grader comments were provided.";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function downloadFile() {
  if (!submission.value?.id) return;

  downloading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiBase}/api/submissions/${submission.value.id}/download-url`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to secure download link");
    }

    const data = await response.json();

    if (data.url) {
      // Append the apiBase to the relative signed URL if needed
      const fullUrl = data.url.startsWith("http")
        ? data.url
        : `${config.public.apiBase}${data.url}`;
      window.location.assign(fullUrl);
    } else {
      throw new Error("Invalid response from server");
    }
  } catch (e: any) {
    toast.add({
      title: "Download Failed",
      description: e.message,
      color: "error",
    });
  } finally {
    downloading.value = false;
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <UButton
      variant="ghost"
      size="sm"
      :to="
        submission?.workoutId
          ? {
              path: `/assignments/${submission.workoutId}`,
              query: {
                courseId: route.query.courseId,
                sectionId: route.query.sectionId,
              },
            }
          : '/submissions'
      "
      icon="i-heroicons-arrow-left"
      class="mb-6"
    >
      Back to assignment
    </UButton>

    <div v-if="showInitialSkeleton" class="space-y-4">
      <USkeleton class="h-8 w-48" />
      <USkeleton class="h-40 w-full rounded-xl" />
    </div>

    <template v-else-if="submission">
      <!-- Status header -->
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-4"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              <span v-if="submissionNumber">
                Submission #{{ submissionNumber }}
              </span>
              <USkeleton v-else class="h-8 w-32" />
            </h1>
            <UBadge
              :label="submission.feedbackReady ? 'Graded' : 'Pending'"
              :color="submission.feedbackReady ? 'success' : 'warning'"
              variant="soft"
            />
          </div>

          <UButton
            v-if="submission.filePath"
            icon="i-heroicons-arrow-down-tray"
            size="sm"
            color="neutral"
            variant="solid"
            :loading="downloading"
            @click="downloadFile"
          >
            Download Code
          </UButton>
          <p v-else class="text-xs text-gray-400 italic">No file available</p>
        </div>

        <div class="grid grid-cols-3 gap-4 text-sm">
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
          <div>
            <div
              class="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1"
            >
              Submission ID
            </div>
            <div>
              <UBadge
                :label="`${submission.id}`"
                variant="subtle"
                size="sm"
                color="neutral"
              />
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
        <template v-else-if="submissionResult">
          <div
            class="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
          >
            <div
              class="flex items-center justify-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
            >
              <div class="text-center">
                <div
                  class="text-6xl font-bold font-mono mb-1"
                  :class="scoreColor"
                >
                  {{ formatPercent(correctnessScore) }}
                </div>
                <div class="text-sm text-gray-500">Correctness Score</div>
              </div>
            </div>

            <div class="grid gap-3">
              <div
                class="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900"
              >
                <div
                  class="text-xs uppercase tracking-wider text-gray-500 font-mono mb-1"
                >
                  Tool Score
                </div>
                <div
                  class="text-lg font-semibold text-gray-900 dark:text-white font-mono"
                >
                  {{ formatPercent(toolScore) }}
                </div>
              </div>
              <div
                class="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900"
              >
                <div
                  class="text-xs uppercase tracking-wider text-gray-500 font-mono mb-1"
                >
                  Runtime
                </div>
                <div
                  class="text-lg font-semibold text-gray-900 dark:text-white font-mono"
                >
                  {{ formatRuntime(runtimeSeconds) }}
                </div>
              </div>
              <div
                class="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900"
              >
                <div
                  class="text-xs uppercase tracking-wider text-gray-500 font-mono mb-1"
                >
                  Exit Code
                </div>
                <div
                  class="text-lg font-semibold text-gray-900 dark:text-white font-mono"
                >
                  {{ submissionResult.exitCode ?? "—" }}
                </div>
              </div>
            </div>
          </div>

          <div
            class="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50"
          >
            <div
              class="text-xs uppercase tracking-wider text-gray-500 font-mono mb-2"
            >
              Grader Comments
            </div>
            <p
              class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
            >
              {{ formatComments(submissionResult.comments) }}
            </p>
          </div>

          <div
            v-if="submissionResult.testOutput"
            class="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-950 text-gray-100"
          >
            <div
              class="text-xs uppercase tracking-wider text-gray-400 font-mono mb-2"
            >
              Test Output
            </div>
            <pre
              class="text-xs leading-6 whitespace-pre-wrap font-mono overflow-x-auto"
              >{{ submissionResult.testOutput }}</pre
            >
          </div>
        </template>

        <div v-else class="text-center py-8 text-sm text-gray-500">
          The submission is marked as graded, but no result payload is available
          yet.
        </div>
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
