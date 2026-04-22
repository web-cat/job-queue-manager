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

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);

function isValidZip(file: File): boolean {
  return file.name.toLowerCase().endsWith(".zip") || 
         file.type === "application/zip" || 
         file.type === "application/x-zip-compressed";
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (isValidZip(file)) {
      selectedFile.value = file;
    } else {
      toast.add({ title: "Invalid File", description: "Only .zip files are allowed.", color: "error" });
      target.value = "";
    }
  }
}

function handleDrop(event: DragEvent) {
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0];
    if (isValidZip(file)) {
      selectedFile.value = file;
    } else {
      toast.add({ title: "Invalid File", description: "Only .zip files are allowed.", color: "error" });
    }
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}

function clearFile() {
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

async function handleSubmit() {
  if (!selectedFile.value) {
    toast.add({
      title: "Error",
      description: "Please select a file to submit.",
      color: "error"
    });
    return;
  }

  submitting.value = true;
  try {
    const formData = new FormData();
    if (assignment.value?.id) {
      formData.append("workoutId", assignment.value.id.toString());
    }
    formData.append("isSubmissionForGrading", "true");
    formData.append("submission_zip", selectedFile.value);

    const result = await post<any>("/submissions", formData);
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

        <!-- File upload -->
        <div
          v-if="!selectedFile"
          @click="triggerFileInput"
          @drop.prevent="handleDrop"
          @dragover.prevent
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
            .zip archives only
          </p>
        </div>

        <!-- Selected File Display -->
        <div
          v-else
          class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 flex items-center justify-between"
        >
          <div class="flex items-center gap-3 overflow-hidden">
            <div
              class="w-10 h-10 rounded-lg bg-[#861F41]/10 flex items-center justify-center flex-shrink-0"
            >
              <UIcon
                name="i-heroicons-document"
                class="w-5 h-5 text-[#861F41]"
              />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ selectedFile.name }}
              </p>
              <p class="text-xs text-gray-500 font-mono">
                {{ formatFileSize(selectedFile.size) }}
              </p>
            </div>
          </div>
          <UButton
            variant="ghost"
            color="gray"
            icon="i-heroicons-x-mark"
            size="sm"
            @click="clearFile"
            class="flex-shrink-0 ml-2"
          />
        </div>

        <input
          type="file"
          ref="fileInput"
          class="hidden"
          accept=".zip"
          @change="handleFileChange"
        />

        <UButton
          @click="handleSubmit"
          :loading="submitting"
          :disabled="!selectedFile"
          size="lg"
          class="w-full bg-[#861F41] hover:bg-[#6d1835] text-white border-0 disabled:opacity-50"
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
