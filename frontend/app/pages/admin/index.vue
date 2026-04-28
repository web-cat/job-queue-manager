<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import { ref } from "vue";

definePageMeta({ middleware: "admin" });

const authStore = useAuthStore();
const { get, post, patch, del } = useApi();
const toast = useToast();

const tabItems = [
  { label: "System Users", slot: "users", icon: "i-heroicons-users" },
  { label: "Terms", slot: "terms", icon: "i-heroicons-calendar" },
  { label: "Courses & Sections", slot: "courses", icon: "i-heroicons-academic-cap" },
  { label: "Course Enrollments", slot: "enrollments", icon: "i-heroicons-user-group" },
  { label: "Assignments", slot: "assignments", icon: "i-heroicons-document-text" },
];

/* ─── DATA FETCHING ─────────────────────────────────────────────────────── */
const { data: usersResp, refresh: refreshUsers } = await useAsyncData(
  "admin-users",
  () => get<{ data: any[] }>("/users?limit=100").catch(() => null)
);
const users = computed(() => usersResp.value?.data || []);

const { data: terms, refresh: refreshTerms } = await useAsyncData(
  "admin-terms",
  () => get<any[]>("/terms").catch(() => [])
);

const { data: courses, refresh: refreshCourses } = await useAsyncData(
  "admin-courses",
  () => get<{ data: any[] }>("/administration/courses/all").catch(() => null)
);
const coursesList = computed(() => courses.value?.data || []);
const courseColumns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "number", header: "Number" },
  { accessorKey: "slug", header: "Slug" },
  { id: "organization", header: "Organization" },
];

const { data: policies } = await useAsyncData(
  "admin-policies",
  () => get<any[]>("/submission-policies").catch(() => [])
);

const globalRoles = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Instructor" },
  { id: 3, name: "Student" },
];

const courseRoles = [
  { id: 1, name: "Instructor" },
  { id: 2, name: "Teaching Assistant" },
  { id: 3, name: "Student" },
  { id: 4, name: "Observer" },
];

/* ─── USERS TAB ─────────────────────────────────────────────────────────── */
const userColumns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "email", header: "Email" },
  { id: "name", header: "Name" },
  { id: "role", header: "Global Role" },
];

async function updateGlobalRole(userId: number, roleId: number) {
  try {
    await patch(`/users/${userId}/role`, { globalRoleId: roleId });
    toast.add({ title: "Success", description: "User role updated.", color: "green" });
    refreshUsers();
  } catch (error: any) {
    toast.add({ title: "Error", description: error.message || "Failed to update role", color: "red" });
  }
}

/* ─── TERMS TAB ─────────────────────────────────────────────────────────── */
const termState = ref({
  season: 1,
  year: new Date().getFullYear(),
  slug: "",
  startsOn: "",
  endsOn: ""
});
const termColumns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "season", header: "Season" },
  { accessorKey: "year", header: "Year" },
  { accessorKey: "slug", header: "Slug" },
  { id: "startsOn", header: "Starts" },
  { id: "endsOn", header: "Ends" }
];
const seasons = [
  { id: 1, label: "Spring" },
  { id: 2, label: "Summer" },
  { id: 3, label: "Fall" },
  { id: 4, label: "Winter" }
];

async function createTerm() {
  try {
    await post("/terms", {
      ...termState.value,
      startsOn: new Date(termState.value.startsOn).toISOString(),
      endsOn: new Date(termState.value.endsOn).toISOString()
    });
    toast.add({ title: "Success", description: "Term created.", color: "green" });
    refreshTerms();
  } catch(e: any) {
    toast.add({ title: "Error", description: e.message || "Failed to create term", color: "red" });
  }
}

/* ─── COURSES TAB ───────────────────────────────────────────────────────── */
const courseState = ref({
  name: "",
  number: "",
  organizationId: 1,
  slug: ""
});
const sectionState = ref({
  courseId: null,
  termId: null,
  label: ""
});

async function createCourse() {
  try {
    await post("/courses", courseState.value);
    toast.add({ title: "Success", description: "Course created.", color: "green" });
    refreshCourses();
  } catch(e: any) {
    toast.add({ title: "Error", description: e.message || "Failed to create course", color: "red" });
  }
}

async function createSection() {
  if (!sectionState.value.courseId) return toast.add({title: "Error", description: "Select a course first"});
  try {
    await post(`/courses/${sectionState.value.courseId}/sections`, {
      termId: sectionState.value.termId,
      label: sectionState.value.label
    });
    toast.add({ title: "Success", description: "Section created.", color: "green" });
  } catch(e: any) {
    toast.add({ title: "Error", description: e.message || "Failed to create section", color: "red" });
  }
}

/* ─── ENROLLMENTS TAB ───────────────────────────────────────────────────── */
const erSelectedCourse = ref(null);
const erSelectedSection = ref(null);
const erSections = ref<any[]>([]);
const erEnrollments = ref<any[]>([]);
const enrollState = ref({
  userId: null,
  courseRoleId: 3
});
const enrollmentCols = [
  { id: "user.email", accessorKey: "user.email", header: "Email" },
  { id: "user.firstName", accessorKey: "user.firstName", header: "First Name" },
  { id: "courseRole.name", accessorKey: "courseRole.name", header: "Role" },
  { id: "actions", header: "" }
];

async function fetchSectionsForEr() {
  erSelectedSection.value = null;
  erEnrollments.value = [];
  if (!erSelectedCourse.value) return;
  try {
    erSections.value = await get<any[]>(`/courses/${erSelectedCourse.value}/sections`);
  } catch (e) { erSections.value = []; }
}
async function fetchEnrollments() {
  if (!erSelectedCourse.value || !erSelectedSection.value) return;
  try {
    erEnrollments.value = await get<any[]>(`/courses/${erSelectedCourse.value}/sections/${erSelectedSection.value}/enrollments`);
  } catch(e) { erEnrollments.value = []; }
}
async function enrollUser() {
  if (!erSelectedCourse.value || !erSelectedSection.value || !enrollState.value.userId) return;
  try {
    await post(`/courses/${erSelectedCourse.value}/sections/${erSelectedSection.value}/enroll`, enrollState.value);
    toast.add({ title: "Success", description: "User enrolled.", color: "green" });
    fetchEnrollments();
  } catch(e: any) {
    toast.add({ title: "Error", description: e.message || "Failed to enroll user", color: "red" });
  }
}
async function unenrollUser(userId: number) {
  if (!erSelectedCourse.value || !erSelectedSection.value) return;
  try {
    await del(`/courses/${erSelectedCourse.value}/sections/${erSelectedSection.value}/enroll/${userId}`);
    toast.add({ title: "Success", description: "User removed.", color: "green" });
    fetchEnrollments();
  } catch(e: any) {
    toast.add({ title: "Error", description: e.message || "Failed to unenroll user", color: "red" });
  }
}

/* ─── ASSIGNMENTS TAB ───────────────────────────────────────────────────── */
const asmSelectedCourse = ref(null);
const asmSelectedSection = ref(null);
const asmSections = ref<any[]>([]);
const assignmentState = ref({
  name: "",
  submissionPolicyId: null as number | null,
  isPublic: true,
  published: true
});

async function fetchSectionsForAsm() {
  asmSelectedSection.value = null;
  if (!asmSelectedCourse.value) return;
  try {
    asmSections.value = await get<any[]>(`/courses/${asmSelectedCourse.value}/sections`);
  } catch(e) { asmSections.value = []; }
}

async function createAssignment() {
  if (!asmSelectedSection.value || !assignmentState.value.submissionPolicyId) return;
  try {
    const asm = await post<any>("/assignments", {
      name: assignmentState.value.name,
      submissionPolicyId: assignmentState.value.submissionPolicyId,
      isPublic: assignmentState.value.isPublic
    });
    await post(`/assignments/${asm.id}/offerings`, {
      courseOfferingId: asmSelectedSection.value,
      published: assignmentState.value.published
    });
    toast.add({ title: "Success", description: "Assignment created & offered.", color: "green" });
  } catch(e: any) {
    toast.add({ title: "Error", description: e.message || "Failed to create assignment", color: "red" });
  }
}

</script>

<template>
  <UContainer class="py-10 max-w-7xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
      <p class="text-gray-500">System management, course creation, and user administration.</p>
    </div>

    <UTabs :items="tabItems" class="w-full">
      
      <!-- ================= USERS TAB ================= -->
      <template #users>
        <UCard class="mt-4">
          <template #header>
            <h2 class="text-lg font-semibold">System Users</h2>
          </template>
          <UTable :data="users" :columns="userColumns">
            <template #name-cell="{ row }">
              {{ row.original.firstName }} {{ row.original.lastName }}
            </template>
            <template #role-cell="{ row }">
              <USelectMenu
                v-model="row.original.globalRoleId"
                :items="globalRoles"
                value-key="id"
                label-key="name"
                size="xs"
                @update:modelValue="val => updateGlobalRole(row.original.id, val)"
                class="w-32"
              />
            </template>
          </UTable>
        </UCard>
      </template>

      <!-- ================= TERMS TAB ================= -->
      <template #terms>
        <UCard class="mt-4 mb-8">
          <template #header>
            <h2 class="text-lg font-semibold">Create Term</h2>
          </template>
          <UForm :state="termState" @submit="createTerm" class="flex flex-col gap-4 max-w-lg">
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Season">
                <USelectMenu v-model="termState.season" :items="seasons" value-key="id" label-key="label" />
              </UFormField>
              <UFormField label="Year">
                <UInput v-model.number="termState.year" type="number" />
              </UFormField>
            </div>
            <UFormField label="Term Slug (e.g., spring-2026)">
              <UInput v-model="termState.slug" />
            </UFormField>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Starts On">
                <UInput v-model="termState.startsOn" type="date" />
              </UFormField>
              <UFormField label="Ends On">
                <UInput v-model="termState.endsOn" type="date" />
              </UFormField>
            </div>
            <UButton type="submit" color="primary">Create Term</UButton>
          </UForm>
        </UCard>

        <UCard class="mt-4">
          <template #header>
            <h2 class="text-lg font-semibold">Existing Terms</h2>
          </template>
          <UTable :data="terms || []" :columns="termColumns">
            <template #startsOn-cell="{ row }">
              {{ new Date(row.original.startsOn).toLocaleDateString() }}
            </template>
            <template #endsOn-cell="{ row }">
              {{ new Date(row.original.endsOn).toLocaleDateString() }}
            </template>
          </UTable>
        </UCard>
      </template>

      <!-- ================= COURSES & SECTIONS TAB ================= -->
      <template #courses>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <!-- Create Course -->
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold">1. Create Course abstract</h2>
            </template>
            <UForm :state="courseState" @submit="createCourse" class="flex flex-col gap-4">
              <UFormField label="Course Name (e.g., Intro to C)">
                <UInput v-model="courseState.name" />
              </UFormField>
              <UFormField label="Course Number (e.g., CS101)">
                <UInput v-model="courseState.number" />
              </UFormField>
              <UFormField label="Course Slug (e.g., cs101-test)">
                <UInput v-model="courseState.slug" />
              </UFormField>
              <UButton type="submit" color="primary">Create Course</UButton>
            </UForm>
          </UCard>
          
          <!-- Create Section -->
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold">2. Create Course Section (Offering)</h2>
            </template>
            <UForm :state="sectionState" @submit="createSection" class="flex flex-col gap-4">
              <UFormField label="Course">
                <USelectMenu v-model="sectionState.courseId" :items="coursesList" value-key="id" label-key="name" placeholder="Select Course" />
              </UFormField>
              <UFormField label="Term">
                <USelectMenu v-model="sectionState.termId" :items="terms || []" value-key="id" label-key="slug" placeholder="Select Term" />
              </UFormField>
              <UFormField label="Section Label (e.g., CRN 12345 or Section 1)">
                <UInput v-model="sectionState.label" />
              </UFormField>
              <UButton type="submit" color="primary">Create Section</UButton>
            </UForm>
          </UCard>
        </div>

        <UCard class="mt-6">
          <template #header>
            <h2 class="text-lg font-semibold">All Courses</h2>
          </template>
          <UTable :data="coursesList" :columns="courseColumns">
            <template #organization-cell="{ row }">
              {{ row.original.organization?.name || "-" }}
            </template>
          </UTable>
        </UCard>
      </template>

      <!-- ================= ENROLLMENTS TAB ================= -->
      <template #enrollments>
        <UCard class="mt-4">
          <template #header>
            <h2 class="text-lg font-semibold">Course Enrollments</h2>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <UFormField label="Select Course">
              <USelectMenu v-model="erSelectedCourse" :items="coursesList" value-key="id" label-key="name" placeholder="Select Course" @update:modelValue="fetchSectionsForEr" />
            </UFormField>
            <UFormField label="Select Section">
              <USelectMenu v-model="erSelectedSection" :items="erSections" value-key="id" label-key="label" placeholder="Select Section" :disabled="!erSections.length" @update:modelValue="fetchEnrollments" />
            </UFormField>
          </div>

          <div v-if="erSelectedSection" class="mb-8 border-t border-gray-200 dark:border-gray-800 pt-6">
            <h3 class="text-md font-semibold mb-3">Add User to Section</h3>
            <UForm :state="enrollState" @submit="enrollUser" class="flex items-end gap-4 max-w-3xl">
              <UFormField label="User" class="flex-1">
                <USelectMenu v-model="enrollState.userId" :items="users" value-key="id" label-key="email" searchable placeholder="Find user..." />
              </UFormField>
              <UFormField label="Course Role" class="flex-1">
                <USelectMenu v-model="enrollState.courseRoleId" :items="courseRoles" value-key="id" label-key="name" placeholder="Select Role" />
              </UFormField>
              <UButton type="submit" color="green">Enroll User</UButton>
            </UForm>
          </div>

          <UTable :data="erEnrollments" :columns="enrollmentCols" v-if="erEnrollments.length">
            <template #actions-cell="{ row }">
              <UButton size="xs" color="red" variant="soft" icon="i-heroicons-trash" @click="unenrollUser(row.original.userId)" />
            </template>
          </UTable>
          <p v-else-if="erSelectedSection" class="text-gray-500 italic mt-4">No users enrolled in this section.</p>
        </UCard>
      </template>

      <!-- ================= ASSIGNMENTS TAB ================= -->
      <template #assignments>
        <UCard class="mt-4 max-w-2xl">
          <template #header>
            <h2 class="text-lg font-semibold">Create Assignment</h2>
          </template>
          <UForm :state="assignmentState" @submit="createAssignment" class="flex flex-col gap-4">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <UFormField label="Target Course">
                <USelectMenu v-model="asmSelectedCourse" :items="coursesList" value-key="id" label-key="name" placeholder="Select Course" @update:modelValue="fetchSectionsForAsm" />
              </UFormField>
              <UFormField label="Target Section">
                <USelectMenu v-model="asmSelectedSection" :items="asmSections" value-key="id" label-key="label" placeholder="Select Section" :disabled="!asmSections.length" />
              </UFormField>
            </div>
            <UFormField label="Assignment Name">
              <UInput v-model="assignmentState.name" />
            </UFormField>
            <UFormField label="Submission Policy">
              <USelectMenu v-model="assignmentState.submissionPolicyId" :items="policies || []" value-key="id" label-key="name" placeholder="Select Policy" />
            </UFormField>
            <div class="flex gap-4">
              <UCheckbox v-model="assignmentState.isPublic" label="Is Public (Visible in Catalog)" />
              <UCheckbox v-model="assignmentState.published" label="Published (Active for Section)" />
            </div>
            <UButton type="submit" color="primary" :disabled="!asmSelectedSection">Create & Offer Assignment</UButton>
          </UForm>
        </UCard>
      </template>

    </UTabs>
  </UContainer>
</template>
