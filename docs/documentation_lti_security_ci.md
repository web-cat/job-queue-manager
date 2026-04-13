# ═══════════════════════════════════════════════════════════════════════════════

# LTI 1.1 INTEGRATION

# ═══════════════════════════════════════════════════════════════════════════════

#

# OVERVIEW:

# LTI (Learning Tools Interoperability) 1.1 allows Canvas to launch your app

# directly from an assignment link. Students click an assignment in Canvas and

# are automatically authenticated and redirected to the correct assignment in

# your system without a separate login.

#

# STATUS: Scaffolded and ready — blocked on Canvas consumer key/secret from

# your professor or VT Middleware. Once credentials are obtained:

# 1. Insert an lms_instance record in Adminer with the key/secret

# 2. Register the tool in Canvas with the launch URL

# 3. Test a launch from Canvas

#

# LTI 1.1 FLOW:

# 1. Instructor configures tool in Canvas:

# - Consumer Key: <value from lms_instance.consumer_key>

# - Consumer Secret: <value from lms_instance.consumer_secret>

# - Launch URL: https://webcatmaxxers.discovery.cs.vt.edu/api/lti/launch

# - Privacy: Public (so Canvas sends name and email)

# 2. Student clicks assignment link in Canvas

# 3. Canvas POSTs a signed launch request to POST /api/lti/launch

# 4. Backend validates OAuth HMAC-SHA1 signature using shared secret

# 5. Backend finds or creates user via lti_identity table

# 6. Backend stores grade passback credentials (lis_outcome_service_url,

# lis_result_sourcedid) in lis_result_id table for later use

# 7. Backend issues 24-hour API token

# 8. Backend redirects to frontend: /lti/launch?token=xxx&role=student&...

# 9. When grading completes, backend POSTs score to lis_outcome_service_url

#

# CANVAS PARAMETERS SENT ON LAUNCH:

# oauth_consumer_key → identifies which lms_instance to use

# lis_person_contact_email_primary → student email

# lis_person_name_given → first name

# lis_person_name_family → last name

# lis_result_sourcedid → grade passback token

# lis_outcome_service_url → where to POST grades

# context_id → Canvas course ID

# resource_link_id → Canvas assignment ID

# roles → Learner, Instructor, TeachingAssistant

#

# REQUIRED PACKAGE: ims-lti (npm install ims-lti)

# NOTE: ims-lti has no TypeScript declarations. Use require() not import.

#

# SEED REQUIRED: lms_instance table must have a record with consumer_key and

# consumer_secret before any LTI launch will work. Run in Adminer:

# INSERT INTO lms_instance (consumer_key, consumer_secret, url, lms_type_id)

# VALUES ('your_key', 'your_secret', 'https://canvas.vt.edu', 1);

FILE: backend/app/services/lti_service.ts
PURPOSE: Handles all LTI 1.1 Tool Provider functionality. Encapsulates launch
validation, user provisioning, and grade passback so the controller stays
clean. All LMS communication goes through this service.
DESIGN: Three main responsibilities — (1) OAuth signature validation via
ims-lti Provider, (2) user find-or-create via lti_identity table linking
LMS user IDs to system users, (3) grade passback via LIS Outcomes Service
XML POST. The sendGrade() method builds the XML payload manually since
ims-lti's OutcomeService only works synchronously within the original launch
request. Async grade passback requires manual OAuth signing which is marked
as a TODO.
DEPENDENCIES: ims-lti (require, not import — no TypeScript types available),
axios, lms_instance.ts, lti_identity.ts, lis_result_id.ts, user.ts
CONSUMERS: lti_controller.ts
NEXT TEAM NOTES: The sendGrade() method currently sends unsigned XML — it will
be rejected by Canvas in production. To fix this, install oauth-signature:
npm install oauth-signature
Then sign the request using the consumer key/secret before POSTing. This is
the most important TODO in the LTI implementation. See the comment block in
sendGrade() for the exact implementation pattern needed.
The resource_link_id → assignment_offering_id mapping also needs to be
implemented — Canvas sends a resource_link_id on every launch that identifies
which Canvas assignment triggered the launch. You need to map this to your
assignment_offering_id. Consider storing this mapping in a new table or in
the lti_workout table which already exists for this purpose.
STATUS: stub [NEEDS INLINE DOCS — sendGrade OAuth signing is blocking for production]

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/controllers/lti_controller.ts
PURPOSE: Handles the two LTI HTTP routes — launch (public) and grade passback
(protected). The launch route receives Canvas POST requests and orchestrates
the full LTI flow via LtiService. The grade route is called internally after
grading completes to send scores back to Canvas.
DESIGN: The launch route MUST remain public — Canvas POSTs to it directly
without an existing session token. Security is provided by the OAuth
HMAC-SHA1 signature validation in LtiService, not by API token auth.
The grade route is protected by API token because it is called internally
by your system after grading completes, not by Canvas.
New LTI users are assigned globalRoleId based on their Canvas role:
Learner → globalRoleId: 3 (Student)
Instructor → globalRoleId: 2 (Instructor)
DEPENDENCIES: lti_service.ts, user.ts, lis_result_id.ts, start/env.ts
CONSUMERS: routes.ts
NEXT TEAM NOTES: The resource_link_id → assignment_offering_id mapping is
currently unimplemented (TODO comment in launch()). When Canvas launches
your tool from an assignment, resource_link_id identifies which Canvas
assignment it came from. You need to resolve this to an assignment_offering_id
in your system to store grade passback credentials correctly.
The grade() method has a hardcoded Canvas grade passback URL placeholder —
replace this with the actual lis_outcome_service_url stored during launch
once the lis_result_id table is being populated correctly.
STATUS: stub [NEEDS INLINE DOCS — resource_link_id mapping and grade passback URL]

# ─────────────────────────────────────────────────────────────────────────────

# PENDING TODOS FOR LTI COMPLETION:

# 1. Get consumer key/secret from professor (BLOCKER)

# 2. Seed lms_instance with Canvas credentials

# 3. Register tool in Canvas with launch URL

# 4. Implement resource_link_id → assignment_offering_id mapping

# 5. Install oauth-signature and implement async grade passback signing

# 6. Store lis_outcome_service_url on lis_result_id records during launch

# 7. Test full launch → submission → grade passback flow end to end

# ═══════════════════════════════════════════════════════════════════════════════

# SECURITY — DEPENDENCY VULNERABILITY MANAGEMENT

# ═══════════════════════════════════════════════════════════════════════════════

#

# OVERVIEW:

# The project uses pnpm overrides in the root package.json to pin transitive

# dependencies to safe versions. This resolves vulnerabilities in packages

# that are dependencies of dependencies (not directly controllable).

#

# CURRENT STATUS (as of April 2026):

# Resolved: 28 of 30 original vulnerabilities

# Remaining: 2 (both in prettier-plugin-edgejs → lodash-es, dev-only)

# Production impact: None — all remaining vulnerabilities are in dev tooling

#

# REMAINING VULNERABILITIES:

# Package: lodash-es <=4.17.23

# Path: @adonisjs/prettier-config → prettier-plugin-edgejs → chevrotain → lodash-es

# Why unfixable: lodash-es has no release >= 4.18.0 yet. No override possible.

# Risk: Dev-only formatter. Never included in production build. Zero runtime risk.

# Resolution: Wait for lodash-es to publish a patched version, or remove

# @adonisjs/prettier-config from devDependencies if Edge.js formatting

# is not needed (AdonisJS v6 uses TypeScript files, not Edge templates).

#

# PNPM OVERRIDES (in root package.json):

# flatted >=3.4.2 — ESLint toolchain, dev only

# picomatch >=4.0.4 — AdonisJS assembler, dev only

# brace-expansion >=2.0.3 — ESLint/minimatch, dev only

# defu >=6.1.5 — Nuxt devtools-kit

# yaml >=2.8.3 — vue-router transitive

# file-type >=21.3.2 — AdonisJS bodyparser

#

# HOW TO CHECK:

# pnpm audit — run from project root

# npm audit — run from backend/ directory

#

# NEXT TEAM NOTES: Run pnpm audit before each release. If new vulnerabilities

# appear, add them to the pnpm.overrides block in root package.json if a

# patched version exists. If no patched version exists and the package is

# dev-only, document it here and move on.

# ═══════════════════════════════════════════════════════════════════════════════

# CI/CD — GITHUB ACTIONS

# ═══════════════════════════════════════════════════════════════════════════════

FILE: .github/workflows/build-images.yml
PURPOSE: Automatically builds and pushes Docker images to the VT container
registry on every merge to main. Handles semantic versioning and git tagging.
DESIGN: Uses PaulHatch/semantic-version for automated version bumping based on
commit message patterns — "Feature" bumps minor, "Major" or "!:" bumps major,
everything else bumps patch. Two jobs are defined: build-backend (active) and
build-frontend (commented out, ready to uncomment when frontend Dockerfile
exists). Jobs are intentionally separate so frontend and backend can be built
independently in the future.
DEPENDENCIES: GitHub repository secrets: REGISTRY_USERNAME, REGISTRY_PASSWORD
(VT container registry credentials — set in GitHub repo Settings → Secrets)
CONSUMERS: Kubernetes cluster (pulls images on pod restart)
NEXT TEAM NOTES: To activate frontend deployment:

1. Create frontend/Dockerfile
2. Uncomment the build-frontend job in this file
3. Update the Kubernetes ingress so / routes to frontend and /api to backend
4. Create a frontend Kubernetes deployment manifest
   The semantic versioning commit patterns are:
   "Feature" anywhere in commit message → minor bump (e.g. 1.1.0 → 1.2.0)
   "Major" or "!:" anywhere in commit → major bump (e.g. 1.2.0 → 2.0.0)
   anything else → patch bump (e.g. 1.2.0 → 1.2.1)
   STATUS: complete [frontend job commented out pending frontend Dockerfile]
