<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const route = useRoute();
const { get, post } = useApi();
const toast = useToast();

const courseId = route.params.courseId;
const sectionId = route.params.sectionId;

// Fetch course details to get the header info
const { data: course, pending: pendingCourse } = await useAsyncData(
  `course-${courseId}`,
  () => get<any>(`/courses/${courseId}`)
);

// Fetch assignments specifically for this section
const { data: assignments, pending: pendingAssignments } = await useAsyncData(
  `section-${sectionId}-assignments`,
  () => get<{ data: any[] }>(`/assignments?sectionId=${sectionId}`)
    .then((r) => r.data)
    .catch(() => [])
);

const section = computed(() => {
  return course.value?.sections?.find((s: any) => s.id === Number(sectionId));
});

const isInstructor = computed(() => {
  return section.value?.enrollments?.[0]?.courseRoleId === 1;
});

const { data: policies } = await useAsyncData(
  "submission-policies",
  () => {
    if (isInstructor.value) {
      return get<any[]>("/submission-policies").catch(() => [])
    }
    return Promise.resolve([])
  }
);

const isSlideoverOpen = ref(false);
const assignmentState = ref({
  name: "",
  description: "",
  submissionPolicyId: null as number | null,
  isPublic: true,
  published: true,
  availableFrom: "",
  dueAt: "",
  attemptLimit: null as number | null,
  isUnlimitedAttempts: true
});

async function createAssignment() {
  if (!assignmentState.value.submissionPolicyId) {
    toast.add({ title: "Error", description: "Submission policy is required", color: "red" });
    return;
  }
  
  try {
    const asm = await post<any>("/assignments", {
      name: assignmentState.value.name,
      description: assignmentState.value.description,
      submissionPolicyId: assignmentState.value.submissionPolicyId,
      isPublic: assignmentState.value.isPublic
    });
    
    await post(`/assignments/${asm.id}/offerings`, {
      courseOfferingId: Number(sectionId),
      published: assignmentState.value.published,
      availableFrom: assignmentState.value.availableFrom ? new Date(assignmentState.value.availableFrom).toISOString() : undefined,
      dueAt: assignmentState.value.dueAt ? new Date(assignmentState.value.dueAt).toISOString() : undefined,
      attemptLimit: assignmentState.value.isUnlimitedAttempts ? undefined : (assignmentState.value.attemptLimit || undefined)
    });
    
    toast.add({ title: "Success", description: "Assignment created & offered.", color: "green" });
    isSlideoverOpen.value = false;
    
    // Reset state
    assignmentState.value = {
      name: "",
      description: "",
      submissionPolicyId: null,
      isPublic: true,
      published: true,
      availableFrom: "",
      dueAt: "",
      attemptLimit: null,
      isUnlimitedAttempts: true
    };
    
    // Refresh assignments list
    refreshNuxtData(`section-${sectionId}-assignments`);
  } catch(e: any) {
    toast.add({ title: "Error", description: e.message || "Failed to create assignment", color: "red" });
  }
}

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

function formatDueDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function dueUrgency(iso: string | null | undefined): 'past' | 'soon' | 'ok' | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return 'past';
  if (diff < 48 * 60 * 60 * 1000) return 'soon';
  return 'ok';
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <UButton
      variant="ghost"
      size="sm"
      to="/courses"
      icon="i-heroicons-arrow-left"
      class="mb-6"
    >
      Back to courses
    </UButton>

    <div v-if="pendingCourse" class="space-y-4 mb-6">
      <USkeleton class="h-8 w-64" />
      <USkeleton class="h-24 w-full rounded-xl" />
    </div>

    <template v-else-if="course && section">
      <!-- Course/Section Header -->
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm font-mono text-gray-500 mb-1">
              {{ course.number }} · {{ section.label ?? `Section ${section.id}` }}
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
    </template>

    <div v-else class="text-center py-16">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Section not found
      </h3>
      <p class="text-gray-500 text-sm">
        We couldn't find the section you're looking for.
      </p>
    </div>

    <div v-if="course && section">
      <div class="flex items-center justify-between mb-6 mt-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Assignments
        </h2>
        <div class="flex items-center gap-4">
          <UInput
            v-model="search"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search assignments…"
            class="max-w-xs"
          />
          <USlideover v-if="isInstructor" v-model:open="isSlideoverOpen">
            <UButton
              color="primary"
              icon="i-heroicons-plus"
            >
              Create assignment
            </UButton>

            <template #content>
              <div class="p-4 flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                    Create Assignment
                  </h3>
                  <UButton
                    color="gray"
                    variant="ghost"
                    icon="i-heroicons-x-mark"
                    @click="isSlideoverOpen = false"
                  />
                </div>
                
                <UForm :state="assignmentState" @submit="createAssignment" class="flex flex-col gap-5">
                  <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-2">
                    <div class="text-sm text-blue-700 dark:text-blue-300">
                      <span class="font-semibold">Target Course:</span> {{ course?.name }}<br />
                      <span class="font-semibold">Target Section:</span> {{ section?.label ?? `Section ${section?.id}` }}
                    </div>
                  </div>
                  
                  <UFormField label="Assignment Name">
                    <UInput v-model="assignmentState.name" required placeholder="e.g. Project 1" />
                  </UFormField>
                  
                  <UFormField label="Description (Optional)">
                    <UTextarea v-model="assignmentState.description" rows="3" placeholder="Brief details about the assignment..." />
                  </UFormField>
                  
                  <UFormField label="Submission Policy">
                    <USelectMenu
                      v-model="assignmentState.submissionPolicyId"
                      :items="policies || []"
                      value-key="id"
                      label-key="name"
                      placeholder="Select Policy"
                      required
                    />
                  </UFormField>

                  <div class="grid grid-cols-2 gap-4">
                    <UFormField label="Available From (Optional)">
                      <UInput v-model="assignmentState.availableFrom" type="datetime-local" />
                    </UFormField>
                    <UFormField label="Due At (Optional)">
                      <UInput v-model="assignmentState.dueAt" type="datetime-local" />
                    </UFormField>
                  </div>
                  
                  <UFormField label="Attempt Limit">
                    <div class="flex items-center gap-4">
                      <UCheckbox v-model="assignmentState.isUnlimitedAttempts" label="Unlimited" />
                      <UInput 
                        v-if="!assignmentState.isUnlimitedAttempts"
                        v-model="assignmentState.attemptLimit" 
                        type="number" 
                        min="1" 
                        placeholder="Limit" 
                        class="w-24" 
                        required 
                      />
                    </div>
                  </UFormField>
                  
                  <div class="flex flex-col gap-3 mt-2">
                    <UCheckbox v-model="assignmentState.isPublic" label="Is Public (Visible in global catalog)" />
                    <UCheckbox v-model="assignmentState.published" label="Published (Active for this section)" />
                  </div>
                  
                  <div class="mt-6 flex justify-end gap-3">
                    <UButton variant="ghost" color="gray" @click="isSlideoverOpen = false">Cancel</UButton>
                    <UButton type="submit" color="primary">Create & Offer</UButton>
                  </div>
                </UForm>
              </div>
            </template>
          </USlideover>
        </div>
      </div>

      <!-- Loading Assignments -->
      <div
        v-if="pendingAssignments"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <USkeleton v-for="i in 3" :key="i" class="h-40 w-full rounded-xl" />
      </div>

      <!-- Empty -->
      <div v-else-if="!filtered.length" class="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
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
              : "There are no assignments available for this section."
          }}
        </p>
      </div>

      <!-- Assignment cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="assignment in filtered"
          :key="assignment.id"
          :to="`/assignments/${assignment.id}?courseId=${courseId}&sectionId=${sectionId}`"
          class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-[#861F41]/50 hover:shadow-md transition-all group flex flex-col h-full"
        >
          <div class="flex items-start justify-between mb-3">
            <div
              class="w-10 h-10 rounded-lg bg-[#861F41]/10 dark:bg-[#861F41]/20 flex items-center justify-center shrink-0"
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
            class="font-semibold text-gray-900 dark:text-white group-hover:text-[#861F41] transition-colors mb-2 line-clamp-2"
          >
            {{ assignment.name }}
          </h3>
          <p
            v-if="assignment.description"
            class="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-3 flex-grow"
          >
            {{ assignment.description }}
          </p>
          <div v-else class="flex-grow"></div>

          <!-- Due date -->
          <div
            v-if="assignment.assignmentOfferings?.[0]?.dueAt"
            class="flex items-center gap-1.5 text-xs font-medium mb-3"
            :class="{
              'text-red-500 dark:text-red-400': dueUrgency(assignment.assignmentOfferings[0].dueAt) === 'past',
              'text-amber-500 dark:text-amber-400': dueUrgency(assignment.assignmentOfferings[0].dueAt) === 'soon',
              'text-gray-400 dark:text-gray-500': dueUrgency(assignment.assignmentOfferings[0].dueAt) === 'ok',
            }"
          >
            <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5 shrink-0" />
            <span>
              {{ dueUrgency(assignment.assignmentOfferings[0].dueAt) === 'past' ? 'Was due' : 'Due' }}
              {{ formatDueDate(assignment.assignmentOfferings[0].dueAt) }}
            </span>
          </div>

          <div
            class="flex items-center justify-between text-xs text-gray-400 font-mono mt-auto pt-4 border-t border-gray-100 dark:border-gray-800"
          >
            <span>ID: {{ assignment.id }}</span>
            <span
              class="flex items-center gap-1 group-hover:text-[#861F41] transition-colors"
            >
              View <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>


  </div>
</template>
