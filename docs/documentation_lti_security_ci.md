# ═══════════════════════════════════════════════════════════════════════════════

# LTI 1.3 INTEGRATION (CURRENT STATUS)

# ═══════════════════════════════════════════════════════════════════════════════

#

# OVERVIEW:

# LTI (Learning Tools Interoperability) is scaffolded as LTI 1.3/OIDC.

# Public routes are present in routes.ts:

# POST /api/lti/init

# POST /api/lti/launch

# GET /api/lti/jwks

#

# STATUS: Stubbed and awaiting full implementation.

# The controller currently redirects with lti_not_implemented errors while

# the service methods throw intentional stub errors.

#

# REQUIRED FOR COMPLETION (CURRENT APPROACH):

# 1. Configure Canvas Developer Key for LTI 1.3 with init/launch/jwks URLs

# 2. Implement OIDC initiation + state/nonce handling

# 3. Implement id_token verification using Canvas JWKS

# 4. Provision users from verified claims and issue app token

# 5. Implement AGS grade passback endpoint integration

FILE: backend/app/services/lti_service.ts
PURPOSE: Defines the LTI 1.3 service contract and implementation TODOs for OIDC
initiation, id_token verification, user provisioning, and AGS grade passback.
DESIGN: Methods are intentional stubs that throw explicit errors until Canvas
LTI 1.3 implementation is completed. Controller depends on this service and
handles graceful redirect errors for now.
DEPENDENCIES: lti_controller.ts, env config, future JWKS/JWT dependencies
CONSUMERS: lti_controller.ts
NEXT TEAM NOTES: Keep launch/init/jwks public routes. Implement OIDC state/nonce,
JWT verification, claim mapping, and AGS grade passback in this service.
STATUS: stub [NEEDS INLINE DOCS — complete LTI 1.3 implementation]

# ─────────────────────────────────────────────────────────────────────────────

FILE: backend/app/controllers/lti_controller.ts
PURPOSE: Handles LTI 1.3 HTTP endpoints (init, launch, jwks, grade) and
currently returns controlled fallback redirects while service logic is stubbed.
DESIGN: init/launch/jwks must remain public because Canvas invokes them without
an existing app session. grade is protected and intended for internal use.
DEPENDENCIES: lti_service.ts, start/env.ts
CONSUMERS: routes.ts
NEXT TEAM NOTES: Implement the launch success path to issue a real app token and
redirect frontend with context when OIDC/JWT verification is complete.
STATUS: stub [NEEDS INLINE DOCS — LTI 1.3 completion]

# ─────────────────────────────────────────────────────────────────────────────

# PENDING TODOS FOR LTI COMPLETION:

# 1. Register Canvas LTI 1.3 Developer Key and deployment

# 2. Implement init state/nonce storage + validation

# 3. Implement id_token verification against Canvas JWKS

# 4. Implement user provisioning + identity mapping from LTI claims

# 5. Implement AGS grade passback and lineitem mapping

# 6. Test full launch → submission → grade passback flow end to end

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
registry on every merge to main. Handles semantic versioning, git tagging,
and automatic rollout restart deployment to Discovery Kubernetes.
DESIGN: Uses PaulHatch/semantic-version for automated version bumping based on
commit message patterns — "Feature" bumps minor, "Major" or "!:" bumps major,
everything else bumps patch. Backend and frontend images are built and pushed,
then a deploy job configures kubectl from GitHub secret kubeconfig, restarts
backend/frontend deployments, and waits for rollout completion.
DEPENDENCIES: GitHub repository secrets: REGISTRY_USERNAME, REGISTRY_PASSWORD
(VT container registry credentials), DISCOVERY_KUBECONFIG_B64 (base64 kubeconfig)
CONSUMERS: Kubernetes cluster (pulls images on pod restart)
NEXT TEAM NOTES: The semantic versioning commit patterns are:
"Feature" anywhere in commit message → minor bump (e.g. 1.1.0 → 1.2.0)
"Major" or "!:" anywhere in commit → major bump (e.g. 1.2.0 → 2.0.0)
anything else → patch bump (e.g. 1.2.0 → 1.2.1)
STATUS: complete [build, push, and deployment automation enabled]
