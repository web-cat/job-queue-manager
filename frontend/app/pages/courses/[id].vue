<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const route = useRoute();
const { get } = useApi();

const { data: course, pending } = await useAsyncData(
  `course-${route.params.id}`,
  () => get<any>(`/courses/${route.params.id}`),
);
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <UButton
      variant="ghost"
      size="sm"
      to="/courses"
      icon="i-heroicons-arrow-left"
      class="mb-6"
    >
      Back to courses
    </UButton>

    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-8 w-64" />
      <USkeleton class="h-40 w-full rounded-xl" />
    </div>

    <template v-else-if="course">
      <!-- Course header -->
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm font-mono text-gray-500 mb-1">
              {{ course.number }}
            </div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {{ course.name }}
            </h1>
            <div class="text-sm text-gray-500">
              {{ course.organization?.name ?? "Virginia Tech" }}
            </div>
          </div>
          <div
            class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"
          >
            <UIcon
              name="i-heroicons-academic-cap"
              class="w-6 h-6 text-blue-600 dark:text-blue-400"
            />
          </div>
        </div>
      </div>

      <!-- Sections -->
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 class="font-semibold text-gray-900 dark:text-white">Sections</h2>
        </div>

        <div v-if="!course.sections?.length" class="p-8 text-center">
          <p class="text-sm text-gray-500">
            No sections available for this course.
          </p>
        </div>

        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="section in course.sections"
            :key="section.id"
            class="px-6 py-4 flex items-center justify-between"
          >
            <div>
              <div class="font-medium text-gray-900 dark:text-white">
                {{ section.label ?? `Section ${section.id}` }}
              </div>
              <div class="text-xs font-mono text-gray-500 mt-0.5">
                {{ section.term?.season }} {{ section.term?.year }}
              </div>
            </div>
            <UBadge
              :label="
                section.selfEnrollmentAllowed ? 'Open enrollment' : 'Closed'
              "
              :color="section.selfEnrollmentAllowed ? 'success' : 'neutral'"
              variant="soft"
              size="xs"
            />
          </div>
        </div>
      </div>
    </template>

    <div v-else class="text-center py-16">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Course not found
      </h3>
      <UButton variant="ghost" to="/courses" size="sm" class="mt-2"
        >Back to courses</UButton
      >
    </div>
  </div>
</template>
