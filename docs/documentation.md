# Job Queue Manager — File Documentation Reference

#

# This file provides header-level documentation for every file in the project.

# Files marked with [NEEDS INLINE DOCS] require additional inline code documentation

# and should be revisited in a dedicated documentation pass.

#

# Format:

# FILE: <path relative to project root>

# PURPOSE: What this file does and why it exists

# DESIGN: Key design decisions and rationale

# DEPENDENCIES: What this file depends on

# CONSUMERS: What depends on this file

# NEXT TEAM NOTES: Important context for future developers

# STATUS: complete | needs-inline-docs | stub

# STATUS VALUES

# complete — file is production-ready and header docs are sufficient

# stub — file has unimplemented TODOs blocking production use

# needs-inline-docs — file works but complex logic needs inline comments

# complete [NEEDS INLINE DOCS] — production-ready but inline docs needed

# ─────────────────────────────────────────────────────────────────────────────

# ═══════════════════════════════════════════════════════════════════════════════

# INFRASTRUCTURE / CONFIGURATION

# ═══════════════════════════════════════════════════════════════════════════════

FILE: .devcontainer/devcontainer.json

PURPOSE: Defines the VS Code dev container for the project. Ensures every team
member works in an identical Linux environment regardless of their host OS.
Eliminates "works on my machine" issues across the team.DESIGN: Uses Microsoft's official typescript-node:22 base image rather than a
custom Dockerfile for lower maintenance overhead. kubectl is installed as a
devcontainer feature so team members can interact with the VT Discovery
Kubernetes cluster from within the container. KUBECONFIG is automatically
pointed at discovery.yaml in the project root. pnpm is enforced as the
package manager to maintain monorepo workspace consistency.

DEPENDENCIES: Docker Desktop (must be running on host), discovery.yaml in
project root (gitignored — each team member downloads their own from Rancher)

CONSUMERS: VS Code Dev Containers extension, all team members

NEXT TEAM NOTES: If you need to add new tools or extensions, add them here
rather than installing manually so all team members benefit. The remoteUser
is set to root to avoid permission issues with the Kubernetes config files.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: .devcontainer/setup.sh

PURPOSE: One-time setup script that runs after the dev container is first opened.
Verifies cluster connectivity, installs workspace dependencies, and copies
.env.example to .env if not already present.

DESIGN: Intentionally simple bash script rather than a complex tool. Designed
to be idempotent — safe to run multiple times without side effects.

DEPENDENCIES: kubectl (installed in container), pnpm (installed in postCreateCommand),
discovery.yaml in project root

CONSUMERS: Team members on first container setup

NEXT TEAM NOTES: If onboarding steps change (new env vars, new services, etc.)
update this script so new team members get correct setup automatically.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: pnpm-workspace.yaml

PURPOSE: Declares the pnpm monorepo workspace members. Tells pnpm that backend/,
frontend/, and packages/ are all part of the same workspace so they can share
dependencies and import from each other.

DESIGN: Monorepo structure was chosen to allow shared TypeScript types and
utilities between the frontend and backend without publishing packages.
The packages/ directory is reserved for shared code (data transfer objects,
shared types, utility functions) that both frontend and backend consume.

DEPENDENCIES: pnpm

CONSUMERS: pnpm install, all workspace scripts

NEXT TEAM NOTES: If you add a new workspace member (e.g. a CLI tool or shared
library), add it here. Keep shared TypeScript interfaces in packages/ rather
than duplicating them in frontend and backend.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: package.json (root)

PURPOSE: Root-level package.json for the monorepo. Defines convenience scripts
that can be run from the project root without cd-ing into subfolders.

DESIGN: Scripts use pnpm --filter to target specific workspace members. This
means teammates can run pnpm dev:backend from anywhere in the project rather
than navigating into backend/ first.

DEPENDENCIES: pnpm workspaces

CONSUMERS: All team members, CI/CD pipeline

NEXT TEAM NOTES: Add new root-level scripts here as the project grows. Keep
package manager pinned to a specific pnpm version to avoid version drift.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: .gitignore (root)

PURPOSE: Prevents sensitive and generated files from being committed to the repo.

DESIGN: Covers Node.js, pnpm, Nuxt 4, AdonisJS, and Kubernetes-specific patterns.
Critical entries: discovery.yaml (cluster credentials), .env (secrets).
.env.example is explicitly allowed so teammates know what variables are needed.

DEPENDENCIES: git

NEXT TEAM NOTES: If you add new tools that generate build artifacts or cache
files, add their patterns here. Never remove discovery.yaml or .env from
this file — committing either would expose credentials.

STATUS: complete

# ═══════════════════════════════════════════════════════════════════════════════

# DATABASE — MIGRATIONS

# ═══════════════════════════════════════════════════════════════════════════════

#

# MIGRATION OVERVIEW:

# The database schema is based on the legacy OpenCSS Rails application schema,

# modernized for this TypeScript/AdonisJS stack. The original schema was

# delivered as a single raw SQL file (docs/initial-er-diagram.sql) which has

# been translated into 6 domain-specific Lucid schema builder migrations.

#

# ORDERING: Migrations run in numeric timestamp order. Dependencies between

# domains (e.g. user must exist before course) are handled by the ordering.

# Never reorder migrations — always add new ones at the end.

#

# ROLLBACK: Every migration has a down() method. Test rollbacks locally before

# pushing to the cluster: node ace migration:rollback

#

# SHARED TABLES: The enqueued_job table is written by your team but managed

# (read/updated) by the other team's Kubernetes backend. Changes to this table

# schema must be coordinated with the other team before deployment.

FILE: backend/database/migrations/1770829437460_create_roles_and_users.ts

PURPOSE: Creates the user identity and authentication foundation. This migration
must run first as almost every other table references the user table.

DESIGN: The user table follows the legacy schema exactly, including the
encrypted_password column name (not password) which is a Rails Devise
convention. auth_access_tokens is an AdonisJS-specific table required by
DbAccessTokensProvider for API token authentication. The identity table
supports OAuth provider linking (Google, GitHub, CAS).

DEPENDENCIES: None (first migration)

CONSUMERS: All subsequent migrations reference user table

NEXT TEAM NOTES: If adding new auth providers, add them to the identity table's
provider column. Do not modify the user table structure without coordinating
with the other team — they may reference user IDs.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/database/migrations/1770829437461_create_organizations_and_lms.ts

PURPOSE: Creates the LMS (Learning Management System) integration infrastructure.
Supports Canvas, Blackboard, and other LTI-compatible LMS platforms.

DESIGN: The circular foreign key between organization and lms_instance
(organization.id references lms_instance.id and vice versa) is a legacy
design from the Rails schema. It is preserved for compatibility but is unusual.
This constraint is added via schema.raw() after both tables are created to
avoid dependency ordering issues.

DEPENDENCIES: 1770829437460 (user table)

CONSUMERS: 1770829437462 (section references lms_instance), lti_identity,
lis_result_id

NEXT TEAM NOTES: The circular FK is intentional but fragile. When inserting
data, create the lms_instance first, then update organization with the ID.
VT uses Canvas as its primary LMS — lms_instance records for VT Canvas will
need to be seeded.

STATUS: complete [NEEDS INLINE DOCS — circular FK explanation in code]

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/database/migrations/1770829437462_create_courses_and_sections.ts

PURPOSE: Creates the course management structure. A course is an abstract
definition (CS 3214), a section is a specific offering of that course in
a given term (CS 3214 Fall 2024, Section 1).

DESIGN: The section table is named section but serves as the course_offering
concept — one course can have many sections across many terms. course_enrollment
links users to sections with a specific role (student, instructor, TA) via
course_role. friendly_id_slugs supports human-readable URL slugs for courses.

DEPENDENCIES: 1770829437461 (organization, lms_instance)

CONSUMERS: 1770829437464 (assignment_offering references section)

NEXT TEAM NOTES: When querying a student's courses, join through
course_enrollment using user_id and course_offering_id (which is section.id).
The naming is confusing — course_offering_id in many tables means section.id.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/database/migrations/1770829437463_create_exercises_and_prompts.ts

PURPOSE: Creates the exercise and question bank. Exercises are the atomic unit
of content — a single coding problem, multiple choice question, etc.
Exercise versions allow content to be updated without breaking historical data.

DESIGN: The exercise system uses a polymorphic actable pattern for prompts —
a prompt can be a coding_prompt, multiple_choice_prompt, etc. This is a
Rails STI (Single Table Inheritance) pattern preserved from the legacy schema.
IRT data (Item Response Theory) stores psychometric difficulty/discrimination
scores used for adaptive testing.

DEPENDENCIES: 1770829437462 (section for exercise_collections)

CONSUMERS: 1770829437464 (exercise_workouts links exercises to assignments)

NEXT TEAM NOTES: The actable_id/actable_type pattern on prompts and prompt_answers
is a polymorphic association. When loading a prompt, check actable_type to
determine which table to join for the actual prompt content. This is complex
to work with in Lucid — consider adding explicit computed properties to the
Prompt model.

STATUS: complete [NEEDS INLINE DOCS — actable/polymorphic pattern explanation]

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/database/migrations/1770829437464_create_assignments_and_submissions.ts

PURPOSE: Creates the assignment, submission, and grading infrastructure. This is
the core of the grading workflow — assignments are collections of exercises
offered to students, submissions are student attempts, grading_plugins define
how code gets executed.

DESIGN: submission_policy controls late penalties, attempt limits, partner

submissions, and time banks. workout_policies control UI behavior (hide
feedback, hide thumbnails). The submission table has a self-referential FK
(primary_submission_id) to support partner submissions where one submission
is the primary. submission_result uses correctness_score as its primary key
(unusual) — this is preserved from the legacy schema.

DEPENDENCIES: 1770829437463 (exercises), 1770829437461 (lti_workouts)

CONSUMERS: 1770829437465 (enqueued_job references submission)

NEXT TEAM NOTES: The grading_plugin and step tables are likely managed primarily
by the other team's Kubernetes backend. Your team creates the records but the
other team executes them. Coordinate schema changes to these tables carefully.
The submission_result primary key on correctness_score is a legacy quirk —
do not change it as it would break the submission FK.

STATUS: complete [NEEDS INLINE DOCS — submission_result PK explanation]

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/database/migrations/1770829437465_create_enqueued_jobs.ts

PURPOSE: Creates the shared handoff table between your system and the other
team's Kubernetes backend. Your team writes job records into this table;
the other team reads and manages them.

DESIGN: Currently contains only the fields confirmed from the legacy schema.
Several fields are commented out as TODOs pending confirmation from the
other team: worker_tag (runtime identifier e.g. 'python3', 'java11'),
status (pending/running/completed/failed), result (jsonb for grading output),
and file_path (location of submitted zip file).

DEPENDENCIES: 1770829437464 (submission)

CONSUMERS: Other team's Kubernetes backend (reads jobs), job_queue_service.ts

NEXT TEAM NOTES: THIS IS THE MOST IMPORTANT FILE TO COORDINATE WITH THE OTHER
TEAM. Before adding any new columns here, get agreement from both teams.
The TODO comments in this file mark exactly what needs to be resolved.
Once the other team confirms their requirements, create a NEW migration
(do not edit this one) to add the missing columns.

STATUS: stub [NEEDS INLINE DOCS — TODO items must be resolved with other team]

# ═══════════════════════════════════════════════════════════════════════════════

# DATABASE — MODELS

# ═══════════════════════════════════════════════════════════════════════════════

#

# MODEL OVERVIEW:

# All 57 Lucid models map directly to the database tables created by migrations.

# Models use Lucid ORM decorators (@column, @belongsTo, @hasMany, etc.) to

# define the schema and relationships.

#

# NAMING CONVENTIONS:

# - Model class names are PascalCase singular (User, Assignment, CourseRole)

# - Table names follow the legacy Rails convention — mostly snake_case singular

# (user, assignment, course_role) except for a few plurals

# - Column names in TypeScript are camelCase; Lucid maps them to snake_case DB columns

#

# RELATIONSHIPS:

# All foreign key relationships are defined on both sides where practical

# (belongsTo on the child, hasMany/hasOne on the parent). This allows

# preloading from either direction.

#

# DATE HANDLING:

# All date/timestamp columns use Luxon DateTime objects (not JS Date).

# When accepting dates from API requests, use vine.string() and convert

# with DateTime.fromISO(). Never assign a JS Date directly to a Lucid DateTime column.

FILE: backend/app/models/user.ts

PURPOSE: The central model for all authenticated users — students, instructors,
TAs, and administrators. Used by AdonisJS auth for token-based authentication.

DESIGN: Extends both BaseModel and the AuthFinder mixin which provides
verifyCredentials() for login. The passwordColumnName is encrypted_password
(not password) to match the legacy Rails Devise convention. The password
column is marked serializeAs: null so it never appears in API responses.
accessTokens uses DbAccessTokensProvider which requires the auth_access_tokens
table created in migration 1770829437460. Role/permission checking is done
via the globalRole relationship rather than a simple role string field.

DEPENDENCIES: global_role, time_zones tables, auth_access_tokens table

CONSUMERS: All controllers that use auth.getUserOrFail(), identity.ts,
lti_identity.ts, submission.ts, course_enrollment.ts

NEXT TEAM NOTES: When checking if a user is an admin, load the globalRole
relationship first: await user.load('globalRole'). CAS authentication will
set the cas_pid field (stored in identity table via provider='cas'). OAuth
logins create identity records linked to this user.

STATUS: complete [NEEDS INLINE DOCS — auth mixin and accessTokens explanation]

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/global_role.ts

PURPOSE: Defines system-wide permission levels for users. Controls what users
can do across the entire system (not just within a course).
DESIGN: Uses boolean flags rather than a string enum to allow fine-grained
permission combinations. The builtin flag marks roles that ship with the
system and should not be deleted. Examples: super admin, regular user.

DEPENDENCIES: None

CONSUMERS: user.ts (belongsTo), admin_middleware.ts (checks canManageAllCourses)

NEXT TEAM NOTES: When seeding the database, create at least two global roles:
one with canManageAllCourses=true (admin) and one with all false (student).
The admin_middleware checks canManageAllCourses for route protection.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/submission.ts

PURPOSE: Represents a student's submission of code for an assignment. The central
entity in the grading workflow — everything flows through submission.

DESIGN: Links a user to an assignment_offering (the specific instance of an
assignment in a course section). The workoutId column is a legacy name for
what is effectively assignmentId. feedbackReady is flipped to true by the
other team's system when grading is complete. The hasOne relationship to
enqueuedJob allows tracking job status from the submission.

DEPENDENCIES: user, assignment (via workoutId FK), assignment_offering,
submission_result, lti_workouts

CONSUMERS: enqueued_job.ts, submissions_controller.ts, job_queue_service.ts

NEXT TEAM NOTES: The workoutId column references assignment.id despite its
confusing name — this is a legacy naming issue. When the other team completes
grading, they update submission_result and set feedbackReady=true on this
record. Poll feedbackReady to know when results are available.

STATUS: complete [NEEDS INLINE DOCS — workoutId naming explanation]

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/enqueued_job.ts

PURPOSE: Represents a job in the queue waiting to be executed by the other
team's Kubernetes workers. Created by your system, managed by theirs.

DESIGN: Intentionally minimal — only contains fields confirmed from the legacy
schema. The workerId references the other team's worker pod registry.
priority is a smallint (0-32767) — higher values = higher priority.
discarded and suspended are boolean flags for job lifecycle management.

DEPENDENCIES: submission.ts

CONSUMERS: job_queue_service.ts (creates records), other team's K8s backend

NEXT TEAM NOTES: This model will need new columns added once the other team
confirms their requirements (worker_tag, status, result). Add these via a
new migration — do not modify the existing migration file.

STATUS: stub [NEEDS INLINE DOCS — coordination with other team required]

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/assignment.ts

PURPOSE: An assignment is a collection of exercises given to students. In the
legacy schema, assignments are called "workouts" — this naming is preserved
in many FK column names (workout_id, workout_policy_id).

DESIGN: submission_policy defines the rules for how this assignment can be
submitted (attempts, deadlines, partners, late penalties). An assignment
can be offered in multiple course sections via assignment_offering.

DEPENDENCIES: user, submission_policy

CONSUMERS: assignment_offering, exercise_workouts, workout_owners,
assignments_controller.ts

NEXT TEAM NOTES: The "workout" terminology throughout the codebase refers to
assignments. This is a legacy naming artifact. When building the frontend,
display "Assignment" to users while using workout_id in API calls.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/assignment_offering.ts

PURPOSE: Links an assignment to a specific course section with dates and
policies. A single assignment can be offered in many sections with different
due dates and configurations.

DESIGN: course_offering_id references section.id — the naming mismatch is a
legacy issue. availableFrom/dueAt/acceptUntil provide a three-stage deadline
system. student_extensions can override these dates per student.

DEPENDENCIES: assignment, section (via courseOfferingId), workout_policies

CONSUMERS: submission.ts, course_enrollment, student_extension.ts,
assignments_controller.ts

NEXT TEAM NOTES: When checking if a student can submit, check both
assignment_offering dates and student_extensions for that student. The
acceptUntil date is the hard cutoff — after this, no submissions are accepted
regardless of extensions.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/submission_result.ts

PURPOSE: Stores the grading result for a submission. Written by the other
team's Kubernetes workers after executing student code.

DESIGN: Uses correctness_score as its primary key — this is unusual and is a
legacy design preserved for FK compatibility. toolScore is the automated
test score, taScore is a manual TA override, correctnessScore is the final
combined score. commentFormat is a smallint enum for the format of the
comments field (plain text, markdown, HTML).

DEPENDENCIES: None (other tables reference this via correctness_score PK)

CONSUMERS: submission.ts (FK on submission_result_id)

NEXT TEAM NOTES: The primary key on correctness_score is a legacy quirk —
do not attempt to change it as it would break all submission FKs. When the
other team writes results back, they create/update records in this table.
Confirm the exact write-back mechanism with them.

STATUS: complete [NEEDS INLINE DOCS — unusual PK design explanation]

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/course.ts

PURPOSE: Represents an academic course (e.g. CS 3214 — Systems Software).
Courses are abstract definitions that get offered as sections each term.

DESIGN: organization_id links to the university/department offering the course.
Courses can be hidden (is_hidden) to prevent student self-enrollment while
still being accessible to instructors.

DEPENDENCIES: organization, user (creator)

CONSUMERS: section.ts, course_exercises.ts, courses_controller.ts

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/section.ts

PURPOSE: A specific offering of a course in a given term. This is what students
enroll in and what assignments are attached to.

DESIGN: Named section but represents course_offering in the domain model.
The lms_instance_id supports LTI integration — when students access via
Canvas, the section is associated with a Canvas course instance.

DEPENDENCIES: course, term, lms_instance

CONSUMERS: course_enrollment, assignment_offering, courses_controller.ts

NEXT TEAM NOTES: In many places course_offering_id actually means section.id.
This naming inconsistency exists throughout the codebase as a legacy artifact.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/identity.ts

PURPOSE: Links a user to an external authentication provider (Google, GitHub,
CAS). A single user can have multiple identities from different providers.

DESIGN: The provider field identifies the auth system (google, github, cas,
local). The uid is the user's identifier within that system (OAuth sub,
CAS PID, etc.). This enables the same user to log in via multiple providers
and always get the same account.

DEPENDENCIES: user

CONSUMERS: auth_controller.ts (CAS/OAuth login flow)

NEXT TEAM NOTES: When implementing CAS login, create an identity record with
provider='cas' and uid=<VT PID>. The CAS PID (e.g. thomask88) should be
stored as the uid. Look up users by identity when processing CAS callbacks.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/lti_identity.ts

PURPOSE: Links a user to their identity within an LTI-connected LMS platform.
Separate from identity.ts because LTI identities are scoped to a specific
LMS instance rather than a global provider.

DESIGN: lti_user_id is the user's identifier within the LMS (Canvas user ID,
Blackboard user ID, etc.). This enables mapping LMS users to system users
when grade passback occurs.

DEPENDENCIES: user, lms_instance

CONSUMERS: LTI launch controller (to be built), grade passback service
NEXT TEAM NOTES: When processing an LTI launch, look up or create an
lti_identity record to associate the LMS user with a system user. The
lis_result_id table stores the grade passback endpoints for each submission.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/lms_instance.ts

PURPOSE: Represents a specific deployment of an LMS (e.g. VT's Canvas instance
at canvas.vt.edu). Consumer_key and consumer_secret are the LTI 1.1
credentials for that LMS instance.

DESIGN: consumer_secret is marked serializeAs: null to prevent credential
leakage in API responses. Each university or department may have their own
LMS instance with different credentials.

DEPENDENCIES: lms_type, organization

CONSUMERS: section, lti_identity, lis_result_id, lti_workouts

NEXT TEAM NOTES: A seed record for VT's Canvas instance will need to be created.
Contact VT Middleware to obtain the consumer_key and consumer_secret for
LTI 1.1 integration with Canvas.

STATUS: complete [NEEDS INLINE DOCS — consumer_secret serialization]

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/exercise.ts

PURPOSE: The base unit of academic content. An exercise is a single question or
coding problem that can appear in multiple assignments.

DESIGN: question_type is an integer enum defining the exercise type (coding,
multiple choice, etc.). current_version_id points to the active version —
exercises are versioned so historical submissions reference the version that
was active when submitted. exercise_collection_id groups exercises into
shareable collections.

DEPENDENCIES: irt_data, exercise_family, exercise_collection

CONSUMERS: exercise_version, exercise_workouts, course_exercises

NEXT TEAM NOTES: Always work with exercise_versions, not exercises directly,
when associating with submissions. The exercise is the parent; the version
is what students actually see and submit against.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/exercise_version.ts

PURPOSE: A specific version of an exercise. Allows exercise content to be
updated without invalidating historical submissions that reference the
previous version.

DESIGN: Each version has its own stem (question preamble) and set of prompts.
text_representation stores a serialized version for search/display purposes.
irt_data tracks psychometric properties per version.

DEPENDENCIES: exercise, stem, irt_data, user (creator)

CONSUMERS: attempt, prompt, resource_files (via exercise_versions_resource_files)

NEXT TEAM NOTES: When the other team executes grading, they reference
exercise_version_id on the attempt record. The grading_plugin associated
with the assignment step defines how that version's code gets executed.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/grading_plugin.ts

PURPOSE: Defines a grading plugin — an executable that knows how to run and
evaluate student code for a specific language/framework combination.

DESIGN: Binary config fields (config_description, default_config_settings) store
serialized configuration. language_id identifies what runtime the plugin
targets. This is closely related to the other team's worker pod images —
each grading_plugin likely corresponds to a specific Docker image.

DEPENDENCIES: user

CONSUMERS: step.ts (a step uses a grading_plugin to grade)

NEXT TEAM NOTES: Coordinate with the other team on the relationship between
grading_plugin records and their worker pod images. The worker_tag concept
in enqueued_job (TBD) likely maps to a grading_plugin identifier.

STATUS: complete [NEEDS INLINE DOCS — binary config fields explanation]

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/models/app_error.ts

PURPOSE: Stores system errors for debugging and auditing. Records exception
details including stack trace, request parameters, and user agent.

DESIGN: Named AppError (not Error) to avoid conflict with JavaScript's built-in
Error class. The usable_type/usable_id pattern is a Rails polymorphic
association linking errors to the object that caused them.

DEPENDENCIES: None

CONSUMERS: Exception handler, debugging tools

NEXT TEAM NOTES: The usable_type/usable_id columns follow Rails STI naming.
When logging errors from TypeScript, set usable_type to the model class name
and usable_id to the relevant record ID.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

# The following models are documented briefly. All follow the same patterns

# as above and do not have unusual design considerations unless noted.

FILE: backend/app/models/organization.ts
PURPOSE: University or department that owns courses and LMS instances.
STATUS: complete

FILE: backend/app/models/term.ts
PURPOSE: Academic term (Fall 2024, Spring 2025). Season is an integer enum.
All sections belong to a term.
STATUS: complete

FILE: backend/app/models/course_role.ts
PURPOSE: Defines permissions within a course (student, instructor, TA).
Uses boolean flags for fine-grained control. The builtin flag marks
system-defined roles that should not be deleted.
STATUS: complete

FILE: backend/app/models/course_enrollment.ts
PURPOSE: Links a user to a section with a specific role. The junction table
for the student/instructor/TA relationship to a course section.
STATUS: complete

FILE: backend/app/models/submission_policy.ts
PURPOSE: Rules for how an assignment can be submitted — attempt limits, late
penalties, early bonuses, partner submission settings, time banks.
Very complex legacy object with many configuration options.
NEXT TEAM NOTES: Most fields have sensible defaults. The submisison_method
field (note: intentional typo from legacy schema) is a smallint enum — 0
is the standard method. Do not fix the typo — it matches the DB column name.
STATUS: complete [NEEDS INLINE DOCS — submisison_method typo explanation]

FILE: backend/app/models/workout_policy.ts
PURPOSE: Controls UI/UX behavior for assignment attempts — hiding feedback,
thumbnails, scores during review periods.
STATUS: complete

FILE: backend/app/models/attempt.ts
PURPOSE: A single attempt by a student on a specific exercise version within
a submission. One submission can have many attempts across its exercises.
NEXT TEAM NOTES: worker_time records how long the grading worker spent
executing this attempt. time_taken is how long the student spent.
STATUS: complete

FILE: backend/app/models/coding_prompt.ts
PURPOSE: A coding exercise prompt — contains the wrapper code, test script,
and starter code shown to students.
STATUS: complete

FILE: backend/app/models/coding_prompt_answer.ts
PURPOSE: A student's answer to a coding prompt — their submitted code and
any compilation errors.
STATUS: complete

FILE: backend/app/models/test_case.ts
PURPOSE: A single test case for a coding exercise — input, expected output,
weight, and visibility flags (hidden, screening, example).
STATUS: complete

FILE: backend/app/models/test_case_result.ts
PURPOSE: The result of running a specific test case against a student's
coding_prompt_answer — pass/fail and execution feedback.
STATUS: complete

FILE: backend/app/models/multiple_choice_prompt.ts
PURPOSE: A multiple choice question prompt with scrambling support.
STATUS: complete

FILE: backend/app/models/choice.ts
PURPOSE: A single answer choice for a multiple_choice_prompt with position,
feedback, and point value.
STATUS: complete

FILE: backend/app/models/prompt.ts
PURPOSE: Base prompt record using polymorphic actable pattern. The actable_type
and actable_id point to the specific prompt type (coding_prompt,
multiple_choice_prompt, etc.).
NEXT TEAM NOTES: [NEEDS INLINE DOCS] — The actable pattern requires checking
actable_type before loading the related prompt data. This is the most complex
relationship in the schema.
STATUS: complete [NEEDS INLINE DOCS]

FILE: backend/app/models/prompt_answer.ts
PURPOSE: Links an attempt to a prompt answer using the same actable pattern
as prompt.ts.
STATUS: complete [NEEDS INLINE DOCS — actable pattern]

FILE: backend/app/models/stem.ts
PURPOSE: The preamble/question text that appears before the prompts in an
exercise version. Shared across prompt types.
STATUS: complete

FILE: backend/app/models/exercise_family.ts
PURPOSE: Groups related exercises together (e.g. all versions of a problem set).
STATUS: complete

FILE: backend/app/models/exercise_collection.ts
PURPOSE: A curated collection of exercises that can be shared across courses
and organizations.
STATUS: complete

FILE: backend/app/models/irt_data.ts
PURPOSE: Item Response Theory psychometric data — difficulty, discrimination,
and attempt statistics used for adaptive testing and exercise quality metrics.
STATUS: complete

FILE: backend/app/models/resource_file.ts
PURPOSE: Files attached to exercise versions (images, datasets, starter files).
Token provides a public URL-safe identifier for file access.
STATUS: complete

FILE: backend/app/models/ownership.ts
PURPOSE: Links resource files to exercise versions. Junction table for the
many-to-many relationship.
STATUS: complete

FILE: backend/app/models/lms_type.ts
PURPOSE: The type of LMS (Canvas, Blackboard, Moodle). Used to configure
LMS-specific behavior in lms_instance records.
STATUS: complete

FILE: backend/app/models/lti_workout.ts
PURPOSE: Links an LMS assignment to a system assignment for LTI integration.
When a student clicks an assignment link in Canvas, this record maps it to
the correct assignment in the system.
STATUS: complete

FILE: backend/app/models/lis_result_id.ts
PURPOSE: Stores the LTI grade passback endpoint for a specific user/assignment
combination. Used to send grades back to the LMS after submission is graded.
NEXT TEAM NOTES: Grade passback requires calling the lis_outcome_service_url
with the lis_result_sourcedid token. This is the LTI 1.1 grade passback flow.
LTI 1.3 uses a different mechanism (Assignment and Grade Services).
STATUS: complete

FILE: backend/app/models/step.ts
PURPOSE: A grading step within an assignment — links an assignment to a
grading_plugin with specific configuration. Supports multi-step grading
pipelines (compile → test → style check, etc.).
STATUS: complete

FILE: backend/app/models/step_config.ts
PURPOSE: Saved configuration for a grading plugin that can be reused across
multiple steps and assignments.
STATUS: complete

FILE: backend/app/models/student_extension.ts
PURPOSE: Per-student deadline extensions for assignment offerings. Overrides
the default dates in assignment_offering for specific students.
STATUS: complete

FILE: backend/app/models/user_group.ts
PURPOSE: A group of users that can be granted shared access to exercise
collections and courses. Used for collaborative authoring.
STATUS: complete

FILE: backend/app/models/membership.ts
PURPOSE: Links users to user_groups. Junction table.
STATUS: complete

FILE: backend/app/models/group_access_request.ts
PURPOSE: A request to join a user_group. Supports an approval workflow
(pending → approved/denied).
STATUS: complete

FILE: backend/app/models/tag.ts
PURPOSE: A tag that can be applied to exercises for categorization and search.
taggings_count is a cached counter for performance.
STATUS: complete

FILE: backend/app/models/tagging.ts
PURPOSE: Polymorphic join table linking tags to any taggable object
(exercises, courses, etc.) via taggable_type/taggable_id.
STATUS: complete

FILE: backend/app/models/tag_user_score.ts
PURPOSE: Tracks a user's experience points and completed exercises within
a specific tag category. Used for gamification and progress tracking.
STATUS: complete

FILE: backend/app/models/license_policy.ts
PURPOSE: Defines sharing/reuse rules for exercise collections — whether
they can be forked, who can view them.
STATUS: complete

FILE: backend/app/models/license.ts
PURPOSE: A specific license (CC-BY, MIT, etc.) applied to exercise collections.
STATUS: complete

FILE: backend/app/models/visualization_logging.ts
PURPOSE: Tracks when students view exercise visualizations (e.g. algorithm
animations). Used for learning analytics.
STATUS: complete

FILE: backend/app/models/active_admin_comment.ts
PURPOSE: Legacy Rails ActiveAdmin comment system. Stores admin notes attached
to any resource. Likely not actively used in this implementation but
preserved for schema compatibility.
STATUS: complete

FILE: backend/app/models/friendly_id_slug.ts
PURPOSE: Stores human-readable URL slugs for courses and other resources.
Maps /courses/cs3214-fall-2024 to the correct database record.
STATUS: complete

FILE: backend/app/models/workout_owner.ts
PURPOSE: Links an assignment to its owner users — separate from the creator_id
on assignment, allows multiple ownership.
STATUS: complete

FILE: backend/app/models/signup.ts
PURPOSE: Stores interest signups from users who want to be notified when
the system opens for registration. Legacy table.
STATUS: complete

FILE: backend/app/models/time_zone.ts
PURPOSE: User-selectable time zones with display names for the UI.
STATUS: complete

# ═══════════════════════════════════════════════════════════════════════════════

# CONTROLLERS

# ═══════════════════════════════════════════════════════════════════════════════

FILE: backend/app/controllers/auth_controller.ts

PURPOSE: Handles user authentication — registration, login, logout, and API
token management. The entry point for all auth flows including local
password auth, and (when implemented) CAS SSO and LTI.

DESIGN: Uses vine validators for all request inputs to ensure type safety and
provide clear error messages. Tokens are created via AdonisJS
DbAccessTokensProvider and stored in auth_access_tokens. The createToken
method allows admins to generate named tokens for worker pods and service
integrations.

DEPENDENCIES: user.ts model, vine validators

CONSUMERS: routes.ts, frontend auth pages

NEXT TEAM NOTES: CAS login will add a cas() and casCallback() method to this
controller. OAuth will add similar methods. The existing local auth methods
should not need to change when adding new providers. When CAS is implemented,
look up or create the user via their identity record (provider='cas',
uid=<PID>).

STATUS: complete [NEEDS INLINE DOCS — token creation flow]

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/controllers/submissions_controller.ts

PURPOSE: Handles student code submission intake. Creates submission records,
triggers job queue integration, and returns grading results.

DESIGN: The store() method is the critical path — it creates a submission_result
stub (required by FK), creates the submission record, creates a local
enqueued_job record, and then calls job_queue_service to POST the job to the
other team's API (currently stubbed). The webhook() method receives result
callbacks from the other team when grading completes.

DEPENDENCIES: submission.ts, submission_result.ts, job_queue_service.ts

CONSUMERS: routes.ts, frontend submission form

NEXT TEAM NOTES: [NEEDS INLINE DOCS] — Three critical TODOs in this file:

1. File upload handling (zip submission storage)
2. Uncomment job_queue_service.enqueue() call once other team confirms endpoint
3. Implement webhook() to process result callbacks and update submission_result
   STATUS: stub [NEEDS INLINE DOCS — all three TODOs are blocking for production]

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/controllers/assignments_controller.ts

PURPOSE: CRUD operations for assignments and their section-specific offerings.
Used by instructors to create and manage assignments, and by students to
view available assignments.

DESIGN: Date fields use vine.string() with DateTime.fromISO() conversion rather
than vine.date() because vine.date() returns JS Date objects which are
incompatible with Lucid's DateTime columns. Index queries filter by
user ownership or public visibility.

DEPENDENCIES: assignment.ts, assignment_offering.ts

CONSUMERS: routes.ts, frontend assignment management pages

NEXT TEAM NOTES: The offerings sub-resource (/assignments/:id/offerings) handles
the association between an assignment and a specific course section. When
building the frontend assignment creation flow, always create an assignment
first then create offerings for each section it should appear in.

STATUS: complete

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/controllers/courses_controller.ts

PURPOSE: CRUD operations for courses, sections, and enrollments. Used by
administrators and instructors to set up the course structure that students
will enroll in.

DESIGN: Follows the same vine validator pattern as assignments_controller.
Enrollment validation prevents duplicate enrollments with a conflict response.
The unenroll endpoint takes userId as a URL parameter to allow admins to
remove specific users.

DEPENDENCIES: course.ts, section.ts, course_enrollment.ts

CONSUMERS: routes.ts, frontend course management pages

NEXT TEAM NOTES: LTI course creation (when a student launches from Canvas for
the first time) should auto-create section and course_enrollment records.
This will require a dedicated LTI launch handler that calls course/section
creation logic.

STATUS: complete

# ═══════════════════════════════════════════════════════════════════════════════

# SERVICES

# ═══════════════════════════════════════════════════════════════════════════════

FILE: backend/app/services/job_queue_service.ts

PURPOSE: The integration boundary between this system and the other team's
Kubernetes job execution backend. All communication with their REST API
goes through this service — no other file should make direct HTTP calls
to their system.

DESIGN: Deliberately isolated as a service (not a controller) so it can be
called from submissions_controller without coupling the HTTP layer to the
integration layer. All methods that require the other team's API are stubbed
with detailed TODO comments explaining exactly what needs to be implemented.
createLocalRecord() is the only fully implemented method — it creates the
enqueued_job record on your side regardless of the other team's API status.

DEPENDENCIES: enqueued_job.ts, submission.ts

CONSUMERS: submissions_controller.ts

NEXT TEAM NOTES: THIS IS THE PRIMARY FILE TO WORK ON ONCE THE OTHER TEAM
CONFIRMS THEIR API CONTRACT. The four questions to answer:

1. Their API base URL → JOB_QUEUE_API_URL env var
2. Their API auth mechanism → JOB_QUEUE_API_KEY env var
3. Their job payload format → enqueue() method body
4. How results come back → handleWebhook() or checkStatus() depending
   Once answered, fill in the TODO stubs. The interface is designed so that
   no other files need to change when this is implemented.
   STATUS: stub [CRITICAL — must be implemented before production deployment]

# ═══════════════════════════════════════════════════════════════════════════════

# MIDDLEWARE

# ═══════════════════════════════════════════════════════════════════════════════

FILE: backend/app/middleware/auth_middleware.ts

PURPOSE: Protects routes from unauthenticated access. Verifies the API token
in the Authorization header and populates auth.user for downstream use.

DESIGN: Provided by the AdonisJS starter kit. Uses authenticateUsing() which
tries each specified guard in order. The redirectTo URL is used for web
sessions — for API routes this is ignored as 401 is returned directly.

DEPENDENCIES: AdonisJS auth package, auth_access_tokens table

CONSUMERS: kernel.ts (registered as named middleware), routes.ts

STATUS: complete (starter kit file — do not modify)

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/middleware/admin_middleware.ts

PURPOSE: Restricts access to admin-only routes. Must be used after auth
middleware since it depends on auth.user being populated.
DESIGN: Checks the user's globalRole relationship for canManageAllCourses
permission rather than a simple role string. This is because the legacy
schema uses a relational role system rather than a role enum on the user.
The relationship must be explicitly loaded (user.load('globalRole')) since
Lucid relationships are lazy by default.

DEPENDENCIES: auth_middleware (must run first), global_role.ts, user.ts

CONSUMERS: routes.ts (applied to admin-only route groups)

NEXT TEAM NOTES: To protect a route with admin access, chain both middlewares:
.use([middleware.auth({ guards: ['api'] }), middleware.admin()])
Consider adding a canManageAssignments check for instructor-level routes
that don't require full admin access.

STATUS: complete

# ═══════════════════════════════════════════════════════════════════════════════

# ROUTING

# ═══════════════════════════════════════════════════════════════════════════════

FILE: backend/start/routes.ts

PURPOSE: Defines all HTTP routes for the backend API. The single source of
truth for what endpoints exist, their HTTP methods, and which middleware
protects them.

DESIGN: Routes are organized into two groups: public (no auth required) and
protected (API token required via middleware.auth). All routes are prefixed
with /api for clarity. The webhook route is intentionally public because it
receives callbacks from the other team's system — consider adding IP
restriction middleware in production. Resource routes (router.resource())
generate standard CRUD endpoints automatically.

DEPENDENCIES: All controllers, middleware (auth, admin), kernel.ts

CONSUMERS: AdonisJS HTTP server

NEXT TEAM NOTES: When adding new features, add routes here first then create
the corresponding controller methods. Keep the public/protected grouping
clear. CAS auth routes will need to be added as public routes (the redirect
and callback cannot require an existing token). LTI launch endpoints are
also public.

STATUS: complete [NEEDS INLINE DOCS — webhook IP restriction note]

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/start/kernel.ts

PURPOSE: Registers all middleware with the AdonisJS HTTP server and router.
Defines which middleware run on every request (server middleware) vs only
on matched routes (router middleware) vs only when explicitly assigned
(named middleware).
DESIGN: server middleware (container_bindings, force_json_response, cors) run
on all requests. router middleware (bodyparser, initialize_auth) run on
matched routes. Named middleware (auth, admin) must be explicitly assigned
to routes in routes.ts. The force_json_response middleware ensures all
responses are JSON — important for an API-only backend.

DEPENDENCIES: All middleware files

CONSUMERS: AdonisJS server startup

NEXT TEAM NOTES: When adding new named middleware (e.g. a rate limiter, an
IP whitelist for webhooks), register it here first then use it in routes.ts.

STATUS: complete

# ═══════════════════════════════════════════════════════════════════════════════

# INLINE DOCUMENTATION PASS — FILES TO REVISIT

# ═══════════════════════════════════════════════════════════════════════════════

#

# The following files need a dedicated inline documentation pass to explain

# complex logic, design patterns, and non-obvious decisions at the code level:

#

# CRITICAL (blocking for future team understanding):

# backend/app/services/job_queue_service.ts

# — Document all TODO stubs with exact format examples once other team confirms

# backend/app/controllers/submissions_controller.ts

# — Document the submission creation flow step by step

# backend/database/migrations/1770829437465_create_enqueued_jobs.ts

# — Document all TODO columns and what they're waiting on

#

# HIGH PRIORITY:

# backend/app/models/user.ts

# — Explain AuthFinder mixin, accessTokens provider, encrypted_password

# backend/app/models/submission.ts

# — Explain workoutId naming, feedbackReady lifecycle

# backend/app/models/submission_result.ts

# — Explain correctness_score as primary key

# backend/app/models/prompt.ts

# — Explain actable polymorphic pattern with examples

# backend/database/migrations/1770829437461_create_organizations_and_lms.ts

# — Explain circular FK between organization and lms_instance

#

# MEDIUM PRIORITY:

# backend/app/models/submission_policy.ts

# — Explain submisison_method typo, time_bank fields, partner submission flow

# backend/app/models/grading_plugin.ts

# — Explain binary config fields, relationship to other team's worker images

# backend/app/models/lms_instance.ts

# — Explain consumer_key/secret, LTI 1.1 vs 1.3 implications

# backend/database/migrations/1770829437463_create_exercises_and_prompts.ts

# — Explain actable pattern, IRT data usage

# backend/database/migrations/1770829437464_create_assignments_and_submissions.ts

# — Explain submission_result PK, workout naming, grading pipeline
