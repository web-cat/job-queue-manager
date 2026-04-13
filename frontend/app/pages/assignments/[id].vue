<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const route = useRoute();
const { get, post } = useApi();
const toast = useToast();

const { data: assignment, pending } = await useAsyncData(
  `assignment-${route.params.id}`,
  () => get<any>(`/assignments/${route.params.id}`),
);

const submitting = ref(false);
const submitted = ref(false);
const submissionId = ref<number | null>(null);

// TODO: Replace with actual file upload once MinIO is integrated
// For now submitting a placeholder to test the API flow
async function handleSubmit() {
  submitting.value = true;
  try {
    const result = await post<any>("/submissions", {
      workoutId: assignment.value?.id,
      isSubmissionForGrading: true,
    });
    submitted.value = true;
    submissionId.value = result.submission?.id;
    toast.add({
      title: "Submission received",
      description: "Your code has been queued for grading.",
      color: "success",
    });
  } catch (e: any) {
    toast.add({
      title: "Submission failed",
      description: e?.data?.message ?? "Please try again.",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Back -->
    <UButton
      variant="ghost"
      size="sm"
      to="/assignments"
      icon="i-heroicons-arrow-left"
      class="mb-6"
    >
      Back to assignments
    </UButton>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-8 w-64" />
      <USkeleton class="h-48 w-full rounded-xl" />
    </div>

    <template v-else-if="assignment">
      <!-- Assignment header -->
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6"
      >
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {{ assignment.name }}
            </h1>
            <p
              v-if="assignment.description"
              class="text-gray-600 dark:text-gray-400"
            >
              {{ assignment.description }}
            </p>
          </div>
          <div
            class="w-12 h-12 rounded-xl bg-[#861F41]/10 dark:bg-[#861F41]/20 flex items-center justify-center flex-shrink-0"
          >
            <UIcon
              name="i-heroicons-code-bracket"
              class="w-6 h-6 text-[#861F41]"
            />
          </div>
        </div>

        <div
          class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-6 text-sm text-gray-500 font-mono"
        >
          <span>ID: {{ assignment.id }}</span>
          <span v-if="assignment.submissionPolicy">
            Max attempts:
            {{ assignment.submissionPolicy.maxSubmissions ?? "∞" }}
          </span>
        </div>
      </div>

      <!-- Submission success -->
      <div
        v-if="submitted"
        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-6"
      >
        <div class="flex items-center gap-3 mb-3">
          <div
            class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center"
          >
            <UIcon
              name="i-heroicons-check"
              class="w-4 h-4 text-green-600 dark:text-green-400"
            />
          </div>
          <h3 class="font-semibold text-green-900 dark:text-green-100">
            Submission received
          </h3>
        </div>
        <p class="text-sm text-green-700 dark:text-green-300 mb-4">
          Your submission has been queued for grading. Results will be available
          shortly.
        </p>
        <div class="flex gap-2">
          <UButton
            v-if="submissionId"
            :to="`/submissions/${submissionId}`"
            size="sm"
            color="success"
            variant="soft"
          >
            View submission status
          </UButton>
          <UButton to="/submissions" size="sm" variant="ghost">
            All submissions
          </UButton>
        </div>
      </div>

      <!-- Submit form -->
      <div
        v-else
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
      >
        <h2 class="font-semibold text-gray-900 dark:text-white mb-1">
          Submit Your Solution
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Upload your solution file to have it automatically graded.
        </p>

        <!-- File upload placeholder -->
        <div
          class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center mb-6 hover:border-[#861F41]/50 transition-colors cursor-pointer"
        >
          <UIcon
            name="i-heroicons-arrow-up-tray"
            class="w-10 h-10 text-gray-400 mx-auto mb-3"
          />
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Drop your file here or click to browse
          </p>
          <p class="text-xs text-gray-500 font-mono">
            .zip, .py, .c, .java — max 10MB
          </p>
          <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 font-mono">
            ⚠ File upload coming soon — MinIO integration pending
          </p>
        </div>

        <UButton
          @click="handleSubmit"
          :loading="submitting"
          size="lg"
          class="w-full bg-[#861F41] hover:bg-[#6d1835] text-white border-0"
          icon="i-heroicons-paper-airplane"
        >
          Submit for Grading
        </UButton>
      </div>
    </template>

    <!-- Not found -->
    <div v-else class="text-center py-16">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Assignment not found
      </h3>
      <UButton variant="ghost" to="/assignments" size="sm" class="mt-2"
        >Back to assignments</UButton
      >
    </div>
  </div>
</template>
