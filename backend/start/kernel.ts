// PURPOSE: Registers all middleware with the AdonisJS HTTP server and router.
// Defines which middleware run on every request (server middleware) vs only
// on matched routes (router middleware) vs only when explicitly assigned
// (named middleware).
// DESIGN: server middleware (container_bindings, force_json_response, cors) run
// on all requests. router middleware (bodyparser, initialize_auth) run on
// matched routes. Named middleware (auth, admin) must be explicitly assigned
// to routes in routes.ts. The force_json_response middleware ensures all
// responses are JSON — important for an API-only backend.

// DEPENDENCIES: All middleware files

// CONSUMERS: AdonisJS server startup

// NEXT TEAM NOTES: When adding new named middleware (e.g. a rate limiter, an
// IP whitelist for webhooks), register it here first then use it in routes.ts.

/*
|--------------------------------------------------------------------------
| HTTP kernel file
|--------------------------------------------------------------------------
|
| The HTTP kernel file is used to register the middleware with the server
| or the router.
|
*/
import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

/**
 * The error handler is used to convert an exception
 * to an HTTP response.
 */
server.errorHandler(() => import('#exceptions/handler'))

/**
 * The server middleware stack runs middleware on all the HTTP
 * requests, even if there is no route registered for
 * the request URL.
 */
server.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('#middleware/force_json_response_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
])

/**
 * The router middleware stack runs middleware on all the HTTP
 * requests with a registered route.
 */
router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
])

/**
 * Named middleware collection must be explicitly assigned to
 * the routes or the routes group.
 */
export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
  admin: () => import('#middleware/admin_middleware'),
})
