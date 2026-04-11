// PURPOSE: Defines all HTTP routes for the backend API. The single source of
// truth for what endpoints exist, their HTTP methods, and which middleware
// protects them.

// DESIGN: Routes are organized into two groups: public (no auth required) and
// protected (API token required via middleware.auth). All routes are prefixed
// with /api for clarity. The webhook route is intentionally public because it
// receives callbacks from the other team's system — consider adding IP
// restriction middleware in production. Resource routes (router.resource())
// generate standard CRUD endpoints automatically.

// DEPENDENCIES: All controllers, middleware (auth, admin), kernel.ts

// CONSUMERS: AdonisJS HTTP server

// NEXT TEAM NOTES: When adding new features, add routes here first then create
// the corresponding controller methods. Keep the public/protected grouping
// clear. CAS auth routes will need to be added as public routes (the redirect
// and callback cannot require an existing token). LTI launch endpoints are
// also public.

// STATUS: complete [NEEDS INLINE DOCS — webhook IP restriction note]

/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const SubmissionsController = () => import('#controllers/submissions_controller')
const AssignmentsController = () => import('#controllers/assignments_controller')
const CoursesController = () => import('#controllers/courses_controller')

// ── Health check ─────────────────────────────────────────────────────
router.get('/', async () => {
  return { hello: 'world' }
})

// ── Public routes (no auth required) ─────────────────────────────────
router.post('/api/auth/register', [AuthController, 'register'])
router.post('/api/auth/login', [AuthController, 'login'])

// Webhook from other team — public but should be IP restricted in production
// TODO: Add IP restriction middleware once other team confirms their server IPs
router.post('/api/submissions/webhook', [SubmissionsController, 'webhook'])

// ── Protected routes (API token required) ────────────────────────────
router
  .group(() => {
    // ── Auth ───────────────────────────────────────────────────────
    router.delete('/auth/logout', [AuthController, 'logout'])
    router.get('/auth/me', [AuthController, 'me'])
    router.post('/auth/tokens', [AuthController, 'createToken'])
    router.get('/auth/tokens', [AuthController, 'listTokens'])
    router.delete('/auth/tokens/:id', [AuthController, 'revokeToken'])

    // ── Submissions ────────────────────────────────────────────────
    router.get('/submissions/:id/result', [SubmissionsController, 'result'])
    router.resource('submissions', SubmissionsController).apiOnly()

    // ── Assignments ────────────────────────────────────────────────
    router.get('/assignments/:id/offerings', [AssignmentsController, 'offerings'])
    router.post('/assignments/:id/offerings', [AssignmentsController, 'createOffering'])
    router.resource('assignments', AssignmentsController).apiOnly()

    // ── Courses ────────────────────────────────────────────────────
    router.get('/courses/:id/sections', [CoursesController, 'sections'])
    router.post('/courses/:id/sections', [CoursesController, 'createSection'])
    router.get('/courses/:id/sections/:sectionId/enrollments', [CoursesController, 'enrollments'])
    router.post('/courses/:id/sections/:sectionId/enroll', [CoursesController, 'enroll'])
    router.delete('/courses/:id/sections/:sectionId/enroll/:userId', [
      CoursesController,
      'unenroll',
    ])
    router.resource('courses', CoursesController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth({ guards: ['api'] }))
