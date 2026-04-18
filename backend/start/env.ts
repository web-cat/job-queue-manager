/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  INTERNAL_APP_URL: Env.schema.string({ format: 'url' }),

  /*
  |----------------------------------------------------------
  | Variables for VT CAS authentication
  |
  | Optional — local dev works without these.
  | CAS login will fail gracefully if not set.
  | Required on Discovery cluster for auth to work.
  |
  | CAS_BASE_URL     → VT CS CAS server base URL
  | CAS_SERVICE_URL  → your app's callback URL (must be cluster URL)
  | FRONTEND_URL     → where to redirect after successful auth
  |----------------------------------------------------------
  */
  CAS_BASE_URL: Env.schema.string.optional(),
  CAS_SERVICE_URL: Env.schema.string.optional(),
  FRONTEND_URL: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variable for job queue integration with other team
  |
  | Optional — stubbed until other team confirms their API.
  | Fill this in when the other team provides their endpoint.
  |----------------------------------------------------------
  */
  JOB_QUEUE_API_URL: Env.schema.string.optional(),
})
