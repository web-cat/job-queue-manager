// PURPOSE: Defines all HTTP routes for the backend API. The single source of
// truth for what endpoints exist, their HTTP methods, and which middleware
// protects them.

// DESIGN: Routes are split into three groups:
//   1. Public routes — no auth required (register, login, CAS, LTI)
//   2. Session API (/api) — AdonisJS token auth, used by the Nuxt frontend
//   3. External Tool API (/api/v1) — HMAC-SHA256 signed requests, used by
//      scripts, IDE plugins, and instructor automation tools
//
// The session and external tool APIs share the same route definitions via
// registerApiRoutes() — any new route added there appears in both APIs.
// Bouncer policies apply identically in both groups since the HMAC middleware
// injects the client's owner user into the auth context.
//
// DEPENDENCIES: All controllers, middleware (auth, admin, oauthSignature), kernel.ts
// CONSUMERS: AdonisJS HTTP server

/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
*/
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const CasController = () => import('#controllers/cas_controller')
const LtiController = () => import('#controllers/lti_controller')
const SubmissionsController = () => import('#controllers/submissions_controller')
const AssignmentsController = () => import('#controllers/assignments_controller')
const CoursesController = () => import('#controllers/courses_controller')
const UsersController = () => import('#controllers/users_controller')
const TermsController = () => import('#controllers/terms_controller')
const SubmissionPoliciesController = () => import('#controllers/submission_policies_controller')
const OAuthController = () => import('#controllers/oauth_controller')
const ExecutionServiceController = () => import('#controllers/execution_service_controller')
const ImageManagementController = () => import('#controllers/image_management_controller')

// ── Global Route Matchers ─────────────────────────────────────────────
router.where('id', router.matchers.number())
router.where('sectionId', router.matchers.number())
router.where('userId', router.matchers.number())
router.where('imageId', router.matchers.number())
router.where('offeringId', router.matchers.number())

// ── Health check ──────────────────────────────────────────────────────
router.get('/', async () => {
  return { hello: 'world' }
})

// ── Public auth routes (no token required) ────────────────────────────
router.post('/api/auth/register', [AuthController, 'register'])
router.post('/api/auth/login', [AuthController, 'login'])

// ── OAuth 2.0 token exchange (public) ────────────────────────────────
// Alternative to HMAC signing — exchange client_id + secret for Bearer token
router.post('/api/oauth/token', [OAuthController, 'token'])

// ── CAS SSO routes (public — CAS handles its own auth) ───────────────
// NOTE: Only works on Discovery cluster, not localhost
router.get('/api/auth/cas', [CasController, 'redirect'])
router.get('/api/auth/cas/callback', [CasController, 'callback'])
router.get('/api/auth/cas/logout', [CasController, 'logout'])

// ── LTI 1.3 routes (public — Canvas POSTs directly) ──────────────────
// MUST remain public — security provided by OIDC flow, not session tokens
router.post('/api/lti/init', [LtiController, 'init'])
router.post('/api/lti/launch', [LtiController, 'launch'])
router.get('/api/lti/jwks', [LtiController, 'jwks'])

// ── Public download route (protected by signed URL) ──────────────────
router
  .get('/api/submissions/:id/download', [SubmissionsController, 'download'])
  .as('submissions.download')

// ─────────────────────────────────────────────────────────────────────
// SHARED ROUTE DEFINITIONS
// Applied to both /api (session auth) and /api/v1 (HMAC signed).
// Add new routes here — they will automatically appear in both APIs.
// ─────────────────────────────────────────────────────────────────────
function registerApiRoutes(prefix: string = '') {
  // Auth — me + token management (no login/logout for external tools)
  router.get('/auth/me', [AuthController, 'me'])
  router.post('/auth/tokens', [AuthController, 'createToken'])
  router.get('/auth/tokens', [AuthController, 'listTokens'])
  router.delete('/auth/tokens/:id', [AuthController, 'revokeToken'])

  // OAuth client management — users manage their own API credentials
  router.get('/oauth/clients', [OAuthController, 'listClients'])
  router.post('/oauth/clients', [OAuthController, 'createClient'])
  router.delete('/oauth/clients/:id', [OAuthController, 'revokeClient'])

  // LTI grade passback — called internally after grading completes
  router.post('/lti/grade', [LtiController, 'grade'])

  // Submissions
  router.get('/submissions/:id/result', [SubmissionsController, 'result'])
  router.get('/submissions/:id/download-url', [SubmissionsController, 'downloadUrl'])
  // router
  //   .get('/submissions/:id/download', [SubmissionsController, 'download'])
  //   .as(`${prefix}submissions.download`)
  router.resource('submissions', SubmissionsController).apiOnly().as(`${prefix}submissions`)

  // Assignments
  router.get('/assignments/:id/offerings', [AssignmentsController, 'offerings'])
  router.post('/assignments/:id/offerings', [AssignmentsController, 'createOffering'])
  router.patch('/assignments/:id/offerings/:offeringId', [AssignmentsController, 'updateOffering'])
  router.resource('assignments', AssignmentsController).apiOnly().as(`${prefix}assignments`)
  router.get('/assignments/:id/wait-time', [AssignmentsController, 'waitTime'])

  // Courses
  router.get('/courses/:id/sections', [CoursesController, 'sections'])
  router.post('/courses/:id/sections', [CoursesController, 'createSection'])
  router.get('/courses/:id/sections/:sectionId/enrollments', [CoursesController, 'enrollments'])
  router.post('/courses/:id/sections/:sectionId/enroll', [CoursesController, 'enroll'])
  router.delete('/courses/:id/sections/:sectionId/enroll/:userId', [CoursesController, 'unenroll'])
  router.resource('courses', CoursesController).apiOnly().as(`${prefix}courses`)

  // Submission policies — shared reference data
  router.get('/submission-policies', [SubmissionPoliciesController, 'index'])

  // Admin routes — additionally gated by admin middleware within both APIs
  router
    .group(() => {
      router.get('/users', [UsersController, 'index'])
      router.patch('/users/:id/role', [UsersController, 'updateRole'])
      router.get('/terms', [TermsController, 'index'])
      router.post('/terms', [TermsController, 'store'])
      router.get('/administration/courses/all', [CoursesController, 'allCourses'])
      // Execution service / queue administration endpoints
      router.get('/administration/execution/queue/status', [
        ExecutionServiceController,
        'queueStatus',
      ])
      router.get('/administration/execution/queue/position/:jobId', [
        ExecutionServiceController,
        'queuePosition',
      ])
      router.get('/administration/execution/workers', [ExecutionServiceController, 'workers'])
      // Image management endpoints (proxies to execution service)
      router.get('/images', [ImageManagementController, 'index'])
      router.get('/images/:imageId', [ImageManagementController, 'show'])
      router.post('/images', [ImageManagementController, 'store'])
      router.put('/images/:imageId', [ImageManagementController, 'update'])
      router.delete('/images/:imageId', [ImageManagementController, 'destroy'])
    })
    .use(middleware.admin())
}

// ── Session API — Nuxt frontend (/api) ───────────────────────────────
// Authenticated via AdonisJS Bearer token (login → token → requests)
router
  .group(() => registerApiRoutes('api.'))
  .prefix('/api')
  .use(middleware.auth({ guards: ['api'] }))

// ── Programmatic API (/api/v1) ────────────────────────────────────────
// Authenticated via HMAC-SHA256 request signing using OAuth client credentials.
// For any user or system that wants to interact with the backend programmatically
// without going through the Nuxt frontend — including students submitting from
// their IDE, instructors automating course and assignment setup, scripts,
// external integrations, and grading workers.
//
// Generate credentials at: POST /api/oauth/clients (requires existing session)
// Signing instructions: see app/auth/guards/hmac_guard.ts
router
  .group(() => {
    registerApiRoutes('v1.')

    // Webhook from partner team (HMAC required)
    router
      .post('/submissions/webhook', [SubmissionsController, 'webhook'])
      .use(middleware.serviceAccount())
  })
  .prefix('/api/v1')
  .use(middleware.oauthSignature())
