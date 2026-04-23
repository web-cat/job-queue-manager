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

  INTERNAL_APP_URL: Env.schema.string(),

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
  JOB_QUEUE_API_KEY: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for MinIO / S3-compatible object storage
  |
  | MinIO is deployed as a Kubernetes service in the cluster.
  | The AWS SDK is used directly since @adonisjs/drive requires v7.
  | forcePathStyle must be true for MinIO — it does not support
  | virtual-hosted style bucket URLs.
  |
  | AWS_ACCESS_KEY_ID     → MinIO root user (minioadmin)
  | AWS_SECRET_ACCESS_KEY → MinIO root password (from minio-secret)
  | AWS_REGION            → set to us-east-1 (required by SDK, not used by MinIO)
  | S3_BUCKET             → bucket name (data)
  | S3_ENDPOINT           → cluster: http://minio.22012-job-queue-manager.svc.cluster.local:9000
  |                         local dev: http://127.0.0.1:9000 (requires kubectl port-forward)
  |----------------------------------------------------------
  */
  S3_BUCKET: Env.schema.string(),
  S3_ENDPOINT: Env.schema.string(),
  AWS_ACCESS_KEY_ID: Env.schema.string(),
  AWS_SECRET_ACCESS_KEY: Env.schema.string(),
  AWS_REGION: Env.schema.string.optional(),
})
