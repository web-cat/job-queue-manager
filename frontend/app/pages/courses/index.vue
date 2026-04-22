<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { get } = useApi();

const { data: response, pending } = await useAsyncData("courses", () =>
  get<{ data: any[] }>("/courses")
    .then((r) => r.data)
    .catch(() => []),
);

const sections = computed(() => {
  const flat: any[] = [];
  for (const course of response.value ?? []) {
    if (course.sections && course.sections.length > 0) {
      for (const section of course.sections) {
        flat.push({ ...section, course });
      }
    }
  }
  return flat;
});

const search = ref("");

const filtered = computed(() => {
  if (!search.value) return sections.value;
  const q = search.value.toLowerCase();
  return sections.value.filter(
    (s: any) =>
      s.course.name?.toLowerCase().includes(q) || 
      s.course.number?.toLowerCase().includes(q) ||
      s.label?.toLowerCase().includes(q)
  );
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Courses
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your enrolled courses and sections
        </p>
      </div>
    </div>

    <UInput
      v-model="search"
      icon="i-heroicons-magnifying-glass"
      placeholder="Search courses…"
      class="mb-6 max-w-sm"
    />

    <div
      v-if="pending"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <USkeleton v-for="i in 6" :key="i" class="h-32 w-full rounded-xl" />
    </div>

    <div v-else-if="!filtered.length" class="text-center py-16">
      <UIcon
        name="i-heroicons-academic-cap"
        class="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4"
      />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        No courses found
      </h3>
      <p class="text-gray-500 text-sm">
        {{
          search
            ? "Try a different search term."
            : "You are not enrolled in any courses yet."
        }}
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="section in filtered"
        :key="section.id"
        :to="`/courses/${section.course.id}/sections/${section.id}`"
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-[#861F41]/50 hover:shadow-md transition-all group"
      >
        <div class="flex items-start justify-between mb-3">
          <div
            class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"
          >
            <UIcon
              name="i-heroicons-academic-cap"
              class="w-5 h-5 text-blue-600 dark:text-blue-400"
            />
          </div>
          <span class="text-xs font-mono text-gray-400">{{
            section.course.number
          }}</span>
        </div>
        <h3
          class="font-semibold text-gray-900 dark:text-white group-hover:text-[#861F41] transition-colors line-clamp-1 mb-1"
        >
          {{ section.course.name }}
        </h3>
        <div class="text-xs text-gray-500 font-mono flex items-center gap-2">
          <span>{{ section.label ?? `Section ${section.id}` }}</span>
          <span>· {{ section.course.organization?.name ?? "Virginia Tech" }}</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
