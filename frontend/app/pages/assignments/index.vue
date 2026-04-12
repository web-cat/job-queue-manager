<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { get } = useApi();

const { data: assignments, pending } = await useAsyncData("assignments", () =>
  get<{ data: any[] }>("/assignments")
    .then((r) => r.data)
    .catch(() => []),
);

const search = ref("");

const filtered = computed(() => {
  if (!assignments.value) return [];
  if (!search.value) return assignments.value;
  const q = search.value.toLowerCase();
  return assignments.value.filter(
    (a: any) =>
      a.name?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q),
  );
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Assignments
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Browse and submit your code assignments
        </p>
      </div>
    </div>

    <!-- Search -->
    <UInput
      v-model="search"
      icon="i-heroicons-magnifying-glass"
      placeholder="Search assignments…"
      class="mb-6 max-w-sm"
    />

    <!-- Loading -->
    <div
      v-if="pending"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <USkeleton v-for="i in 6" :key="i" class="h-40 w-full rounded-xl" />
    </div>

    <!-- Empty -->
    <div v-else-if="!filtered.length" class="text-center py-16">
      <UIcon
        name="i-heroicons-clipboard-document-list"
        class="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4"
      />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        No assignments found
      </h3>
      <p class="text-gray-500 text-sm">
        {{
          search
            ? "Try a different search term."
            : "No assignments are available yet."
        }}
      </p>
    </div>

    <!-- Assignment cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="assignment in filtered"
        :key="assignment.id"
        :to="`/assignments/${assignment.id}`"
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-[#861F41]/50 hover:shadow-md transition-all group"
      >
        <div class="flex items-start justify-between mb-3">
          <div
            class="w-10 h-10 rounded-lg bg-[#861F41]/10 dark:bg-[#861F41]/20 flex items-center justify-center"
          >
            <UIcon
              name="i-heroicons-code-bracket"
              class="w-5 h-5 text-[#861F41]"
            />
          </div>
          <UBadge
            :label="assignment.isPublic ? 'Public' : 'Private'"
            :color="assignment.isPublic ? 'success' : 'neutral'"
            variant="soft"
            size="xs"
          />
        </div>

        <h3
          class="font-semibold text-gray-900 dark:text-white group-hover:text-[#861F41] transition-colors mb-1 line-clamp-1"
        >
          {{ assignment.name }}
        </h3>
        <p
          v-if="assignment.description"
          class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4"
        >
          {{ assignment.description }}
        </p>

        <div
          class="flex items-center justify-between text-xs text-gray-400 font-mono"
        >
          <span>ID: {{ assignment.id }}</span>
          <span
            class="flex items-center gap-1 group-hover:text-[#861F41] transition-colors"
          >
            Submit <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
