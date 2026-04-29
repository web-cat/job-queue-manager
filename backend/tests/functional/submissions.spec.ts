import { test } from '@japa/runner'
import nock from 'nock'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import { createHash, createHmac, randomUUID } from 'node:crypto'

// Helper to register and get a token
async function loginAsUser(client: any, roleId: number = 1) {
  const email = `user_${Date.now()}@test.com`
  const register = await client.post('/api/auth/register').json({
    firstName: 'Test',
    lastName: 'User',
    email,
    password: 'password123',
  })

  // Promote user to requested role (Admin by default to pass Bouncer RBAC during tests)
  const user = await User.findByOrFail('email', email)
  user.globalRoleId = roleId
  await user.save()

  return { token: register.body().token.token, email }
}

// Helper to create a submission directly in DB
// since store() requires a file upload + MinIO
async function createSubmission(userId: number) {
  // First create a submission_result stub (FK required)
  const [result] = await db
    .table('submission_result')
    .insert({ correctness_score: 0 })
    .returning('id')

  // Create a minimal assignment to satisfy workoutId FK
  const [policy] = await db
    .table('submission_policy')
    .insert({
      award_early_bonus: false,
      deduct_late_penalty: false,
      allow_partners: false,
      auto_assign_partners: true,
      deduct_excess_submission_penalty: false,
      force_lti_clickthrough: false,
      use_time_bank_days: false,
      submisison_method: 0,
    })
    .returning('id')

  const [assignment] = await db
    .table('assignment')
    .insert({
      name: `Test Assignment ${Date.now()}`,
      submission_policy_id: policy.id,
      scrambled: false,
    })
    .returning('id')

  const [submission] = await db
    .table('submission')
    .insert({
      user_id: userId,
      workout_id: assignment.id,
      submission_result_id: result.id,
      feedback_ready: false,
      is_submission_for_grading: true,
      partner_link: false,
      status: 'pending',
      retry_count: 0,
    })
    .returning('id')

  // track created rows for cleanup
  createdSubmissionIds.push(submission.id)
  createdAssignmentIds.push(assignment.id)
  createdPolicyIds.push(policy.id)
  createdResultIds.push(result.id)

  return submission.id
}

async function createSubmissionWithAssignmentOptions(
  userId: number,
  options: { dockerImageTag?: string | null; estimatedRuntimeSeconds?: number | null }
) {
  const [result] = await db
    .table('submission_result')
    .insert({ correctness_score: 0 })
    .returning('id')

  const [policy] = await db
    .table('submission_policy')
    .insert({
      award_early_bonus: false,
      deduct_late_penalty: false,
      allow_partners: false,
      auto_assign_partners: true,
      deduct_excess_submission_penalty: false,
      force_lti_clickthrough: false,
      use_time_bank_days: false,
      submisison_method: 0,
    })
    .returning('id')

  const [assignment] = await db
    .table('assignment')
    .insert({
      name: `Test Assignment ${Date.now()}`,
      submission_policy_id: policy.id,
      scrambled: false,
      docker_image_tag: options.dockerImageTag ?? null,
      estimated_runtime_seconds: options.estimatedRuntimeSeconds ?? 120,
    })
    .returning('id')

  const [submission] = await db
    .table('submission')
    .insert({
      user_id: userId,
      workout_id: assignment.id,
      submission_result_id: result.id,
      feedback_ready: false,
      is_submission_for_grading: true,
      partner_link: false,
    })
    .returning('id')

  // track created rows for cleanup
  createdSubmissionIds.push(submission.id)
  createdAssignmentIds.push(assignment.id)
  createdPolicyIds.push(policy.id)
  createdResultIds.push(result.id)

  return { submissionId: submission.id, assignmentId: assignment.id }
}

// Track created DB entities so tests can clean up after themselves
const createdSubmissionIds: number[] = []
const createdAssignmentIds: number[] = []
const createdPolicyIds: number[] = []
const createdResultIds: number[] = []
// Helper to cleanup created rows. Call from test `finally` blocks.
async function cleanupCreated() {
  try {
    if (createdSubmissionIds.length) {
      await db.from('submission').whereIn('id', createdSubmissionIds).del()
    }
    if (createdAssignmentIds.length) {
      await db.from('assignment').whereIn('id', createdAssignmentIds).del()
    }
    if (createdPolicyIds.length) {
      await db.from('submission_policy').whereIn('id', createdPolicyIds).del()
    }
    if (createdResultIds.length) {
      await db.from('submission_result').whereIn('id', createdResultIds).del()
    }
  } catch (e) {
    console.warn('cleanup error', e)
  } finally {
    createdSubmissionIds.length = 0
    createdAssignmentIds.length = 0
    createdPolicyIds.length = 0
    createdResultIds.length = 0
  }
}

// Helper to mock grading-cluster endpoints using `nock`.
// Usage example:
//   const scope = mockGraderStatus('online')
//   // run code that calls grading cluster
//   scope.done()
function mockGraderStatus(mode: 'online' | 'restricted' | 'offline' = 'online') {
  const base = process.env.GRADER_BASE_URL || 'http://grading.cluster'
  const scope = nock(base).get('/api/administration/execution/queue/status').query(true)

  if (mode === 'online') return scope.reply(200, { status: 'ok', workers: 2, queueLength: 1 })
  if (mode === 'restricted') return scope.reply(403, { error: 'forbidden' })
  return scope.reply(500, { error: 'down' })
}

// Helper to get the current user id from token
async function getUserId(client: any, token: string) {
  const me = await client.get('/api/auth/me').header('Authorization', `Bearer ${token}`)
  return me.body().id
}

async function createOAuthClientCredentials(client: any, token: string) {
  const createClient = await client
    .post('/api/oauth/clients')
    .header('Authorization', `Bearer ${token}`)
    .json({ name: `webhook-client-${Date.now()}` })

  createClient.assertStatus(201)

  return {
    clientId: createClient.body().client_id as string,
    clientSecret: createClient.body().client_secret as string,
  }
}

function buildHmacHeaders(args: {
  clientId: string
  clientSecret: string
  method: string
  path: string
  rawBody?: string
  nonce?: string
  timestamp?: string
}) {
  const timestamp = args.timestamp ?? String(Date.now())
  const nonce = args.nonce ?? randomUUID()
  const rawBody = args.rawBody ?? ''

  const bodyHash = createHash('sha256').update(rawBody).digest('hex')
  const canonical = [args.method.toUpperCase(), args.path, timestamp, nonce, bodyHash].join('\n')
  const signature = createHmac('sha256', args.clientSecret).update(canonical).digest('hex')

  return {
    'x-api-key': args.clientId,
    'x-timestamp': timestamp,
    'x-nonce': nonce,
    'x-signature': signature,
  }
}

test.group('Submissions — index', () => {
  test('returns list of submissions when authenticated', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client.get('/api/submissions').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
  }).timeout(60_000)

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/submissions')
    response.assertStatus(401)
  })
})

test.group('Submissions — show', (group) => {
  test('returns a single submission', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const userId = await getUserId(client, token)
    let submissionId
    try {
      submissionId = await createSubmission(userId)

      const response = await client
        .get(`/api/submissions/${submissionId}`)
        .header('Authorization', `Bearer ${token}`)

      response.assertStatus(200)
      response.assertBodyContains({ id: submissionId })
    } finally {
      await cleanupCreated()
    }
  })

  test('returns 404 for non-existent submission', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .get('/api/submissions/999999')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/submissions/1')
    response.assertStatus(401)
  })
})

test.group('Submissions — result', (group) => {
  test('returns not ready when feedback is not ready', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const userId = await getUserId(client, token)
    let submissionId
    try {
      submissionId = await createSubmission(userId)

      const response = await client
        .get(`/api/submissions/${submissionId}/result`)
        .header('Authorization', `Bearer ${token}`)

      response.assertStatus(200)
      response.assertBodyContains({ ready: false })
    } finally {
      await cleanupCreated()
    }
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/submissions/1/result')
    response.assertStatus(401)
  })
})

test.group('Submissions — webhook', (group) => {
  test('accepts webhook payload and returns received', async ({ client, assert }) => {
    const { token } = await loginAsUser(client, 4)
    const userId = await getUserId(client, token)
    const submissionId = await createSubmission(userId)
    const { clientId, clientSecret } = await createOAuthClientCredentials(client, token)

    const payload = {
      data: {
        submission_id: submissionId,
        status: 'pending',
        result: {
          correctness_score: 0,
          tool_score: 0,
          comments: '',
          comment_format: 0,
          runtime_ms: 0,
          exit_code: 0,
          test_output: '',
          has_payload: false,
          payload_url: '',
        },
      },
    }

    const rawBody = JSON.stringify(payload)
    const headers = buildHmacHeaders({
      clientId,
      clientSecret,
      method: 'POST',
      path: '/api/v1/submissions/webhook',
      rawBody,
    })

    const response = await client
      .post('/api/v1/submissions/webhook')
      .header('x-api-key', headers['x-api-key'])
      .header('x-timestamp', headers['x-timestamp'])
      .header('x-nonce', headers['x-nonce'])
      .header('x-signature', headers['x-signature'])
      .json(payload)

    try {
      response.assertStatus(200)
      response.assertBodyContains({ received: true })

      const updatedSubmission = await db.from('submission').where('id', submissionId).first()
      assert.equal(updatedSubmission?.status, 'pending')
    } finally {
      await cleanupCreated()
    }
  })

  test('updates the assignment runtime estimate from webhook results', async ({
    client,
    assert,
  }) => {
    const { token } = await loginAsUser(client, 4)
    const userId = await getUserId(client, token)
    const { submissionId, assignmentId } = await createSubmissionWithAssignmentOptions(userId, {
      dockerImageTag: 'ghcr.io/sytraore/job-queue-scheduler/test-grader-java8-zip:latest',
      estimatedRuntimeSeconds: 120,
    })
    const { clientId, clientSecret } = await createOAuthClientCredentials(client, token)

    const payload = {
      data: {
        submission_id: submissionId,
        status: 'completed',
        result: {
          correctness_score: 0,
          tool_score: 0,
          comments: '',
          comment_format: 0,
          runtime_ms: 8000,
          exit_code: 0,
          test_output: '',
          has_payload: false,
          payload_url: '',
        },
      },
    }

    const rawBody = JSON.stringify(payload)
    const headers = buildHmacHeaders({
      clientId,
      clientSecret,
      method: 'POST',
      path: '/api/v1/submissions/webhook',
      rawBody,
    })

    const response = await client
      .post('/api/v1/submissions/webhook')
      .header('x-api-key', headers['x-api-key'])
      .header('x-timestamp', headers['x-timestamp'])
      .header('x-nonce', headers['x-nonce'])
      .header('x-signature', headers['x-signature'])
      .json(payload)

    response.assertStatus(200)
    try {
      response.assertStatus(200)

      const updatedAssignment = await db.from('assignment').where('id', assignmentId).first()
      assert.equal(updatedAssignment?.estimated_runtime_seconds, 64)
    } finally {
      await cleanupCreated()
    }
  })

  test('returns 422 when required result object is missing', async ({ client, assert }) => {
    const { token } = await loginAsUser(client, 4)
    const userId = await getUserId(client, token)
    const submissionId = await createSubmission(userId)
    const { clientId, clientSecret } = await createOAuthClientCredentials(client, token)

    const payload = {
      data: {
        submission_id: submissionId,
        status: 'completed',
        submitted_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        retry_count: 0,
      },
    }

    const rawBody = JSON.stringify(payload)
    const headers = buildHmacHeaders({
      clientId,
      clientSecret,
      method: 'POST',
      path: '/api/v1/submissions/webhook',
      rawBody,
    })

    const response = await client
      .post('/api/v1/submissions/webhook')
      .header('x-api-key', headers['x-api-key'])
      .header('x-timestamp', headers['x-timestamp'])
      .header('x-nonce', headers['x-nonce'])
      .header('x-signature', headers['x-signature'])
      .json(payload)

    try {
      response.assertStatus(422)
      const body = response.body()
      assert.isArray(body.errors)
      assert.isAbove(body.errors.length, 0)
    } finally {
      await cleanupCreated()
    }
  })

  test('returns 401 when webhook is called without HMAC headers', async ({ client }) => {
    const { token } = await loginAsUser(client, 4)
    const userId = await getUserId(client, token)
    const submissionId = await createSubmission(userId)

    const response = await client.post('/api/v1/submissions/webhook').json({
      data: {
        submission_id: submissionId,
        status: 'pending',
        result: {
          correctness_score: 0,
        },
      },
    })
    try {
      response.assertStatus(401)
    } finally {
      await cleanupCreated()
    }
  })

  test('returns 403 when a non-service account calls webhook', async ({ client }) => {
    const { token } = await loginAsUser(client, 1) // Admin, not service account
    const userId = await getUserId(client, token)
    const submissionId = await createSubmission(userId)
    const { clientId, clientSecret } = await createOAuthClientCredentials(client, token)

    const payload = {
      data: {
        submission_id: submissionId,
        status: 'pending',
        result: {
          correctness_score: 0,
          tool_score: 0,
          comments: '',
          comment_format: 0,
          runtime_ms: 0,
          exit_code: 0,
          test_output: '',
          has_payload: false,
          payload_url: '',
        },
      },
    }

    const rawBody = JSON.stringify(payload)
    const headers = buildHmacHeaders({
      clientId,
      clientSecret,
      method: 'POST',
      path: '/api/v1/submissions/webhook',
      rawBody,
    })

    const response = await client
      .post('/api/v1/submissions/webhook')
      .header('x-api-key', headers['x-api-key'])
      .header('x-timestamp', headers['x-timestamp'])
      .header('x-nonce', headers['x-nonce'])
      .header('x-signature', headers['x-signature'])
      .json(payload)

    try {
      response.assertStatus(403)
      response.assertBodyContains({
        message: 'Only registered service accounts can access this endpoint.',
      })
    } finally {
      await cleanupCreated()
    }
  })
})

test.group('Submissions — store', () => {
  // NOTE: store() requires a zip file upload to MinIO object storage.
  // MinIO is not available in the local dev environment without additional setup.
  // This test is documented here for completeness but cannot run locally.
  // To test: deploy to cluster where MinIO is configured, then test via:
  // POST /api/submissions with multipart form data containing submission_zip file
  test('store requires MinIO — cannot test locally', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .post('/api/submissions')
      .header('Authorization', `Bearer ${token}`)
      .json({
        workoutId: 1,
      })

    // Without a file this should return 400 bad request
    response.assertStatus(400)
  })
})

test.group('Submissions — MinIO storage', () => {
  // These tests require MinIO to be accessible.
  // Local dev: kubectl port-forward svc/minio 9000:9000 -n 22012-job-queue-manager
  // CI: skipped automatically when MinIO is unreachable

  async function isMinioAvailable(): Promise<boolean> {
    const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3')
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
    try {
      await s3.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET! }))
      return true
    } catch {
      return false
    }
  }

  test('can connect to MinIO and reach the data bucket', async ({ assert }) => {
    if (!(await isMinioAvailable())) {
      console.log('MinIO not reachable — skipping')
      return
    }
    // ... rest of test

    const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3')
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    const result = await s3.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET! }))
    assert.equal(result.$metadata.httpStatusCode, 200)
  })

  test('submission zip is uploaded to correct MinIO path', async ({ client, assert }) => {
    if (!(await isMinioAvailable())) {
      console.log('MinIO not reachable — skipping')
      return
    }

    const { token } = await loginAsUser(client)

    // Create a submission policy and assignment to satisfy FKs
    const [policy] = await db
      .table('submission_policy')
      .insert({
        award_early_bonus: false,
        deduct_late_penalty: false,
        allow_partners: false,
        auto_assign_partners: true,
        deduct_excess_submission_penalty: false,
        force_lti_clickthrough: false,
        use_time_bank_days: false,
        submisison_method: 0,
      })
      .returning('id')

    const [assignment] = await db
      .table('assignment')
      .insert({
        name: `MinIO Test Assignment ${Date.now()}`,
        submission_policy_id: policy.id,
        scrambled: false,
      })
      .returning('id')

    // Write a temp zip file
    const fs = await import('node:fs')
    const zipPath = `/tmp/minio-test-${Date.now()}.zip`

    // Use the zip binary to create a minimal zip
    const { execSync } = await import('node:child_process')
    const pyPath = `/tmp/solution-${Date.now()}.py`
    fs.writeFileSync(pyPath, 'print("hello")')
    execSync(`zip ${zipPath} ${pyPath}`)

    const response = await client
      .post('/api/submissions')
      .header('Authorization', `Bearer ${token}`)
      .file('submission_zip', zipPath, { filename: 'solution.zip' })
      .field('workoutId', String(assignment.id))
      .field('isSubmissionForGrading', 'true')

    response.assertStatus(201)

    const body = response.body()
    const expectedKey = `submissions/${body.submission.id}/input/solution.zip`
    assert.equal(body.archivePath, expectedKey)

    // Verify file exists in MinIO
    const { S3Client, HeadObjectCommand } = await import('@aws-sdk/client-s3')
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    const head = await s3.send(
      new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: expectedKey,
      })
    )

    assert.equal(head.$metadata.httpStatusCode, 200)

    // Cleanup temp files
    fs.unlinkSync(zipPath)
    fs.unlinkSync(pyPath)
  })
})
// kubectl port-forward svc/minio 9000:9000 -n 22012-job-queue-manager

// backend/.env requirement
// S3_ENDPOINT=http://127.0.0.1:9000
