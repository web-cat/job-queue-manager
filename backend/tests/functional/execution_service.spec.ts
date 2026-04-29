import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Helper to register and get a token
async function loginAsUser(client: any) {
  const email = `user_${Date.now()}@test.com`
  await client.post('/api/auth/register').json({
    firstName: 'Test',
    lastName: 'User',
    email,
    password: 'password123',
  })
  const user = await db.from('user').where('email', email).first()
  const login = await client.post('/api/auth/login').json({ email, password: 'password123' })
  return { token: login.body().token.token, email, userId: user.id }
}

// Register a user then promote them to admin
async function loginAsAdmin(client: any) {
  const email = `admin_${Date.now()}@test.com`
  await client.post('/api/auth/register').json({
    firstName: 'Admin',
    lastName: 'User',
    email,
    password: 'password123',
  })

  const user = await db.from('user').where('email', email).first()
  await db.from('user').where('id', user.id).update({ global_role_id: 1 })

  const login = await client.post('/api/auth/login').json({
    email,
    password: 'password123',
  })
  return { token: login.body().token.token, email, userId: user.id }
}

// ─────────────────────────────────────────────────────────────────────────────
// Queue Status — GET /api/administration/execution/queue/status
// ─────────────────────────────────────────────────────────────────────────────

test.group('Admin / Execution Service — queue status', () => {
  test('returns 403 when authenticated as a regular user', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .get('/api/administration/execution/queue/status')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(403)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/administration/execution/queue/status')
    response.assertStatus(401)
  })

  test('returns 503 when execution service is unavailable', async ({ client }) => {
    const { token } = await loginAsAdmin(client)

    // Ensure test is deterministic: unset external JOB_QUEUE_API_URL so service reports unavailable
    delete process.env.JOB_QUEUE_API_URL

    const response = await client
      .get('/api/administration/execution/queue/status')
      .header('Authorization', `Bearer ${token}`)

    // Should return 503 because JOB_QUEUE_API_URL is not configured or unreachable in test env
    response.assertStatus(503)
    response.assertBodyContains({ error: { code: 'service_unavailable' } })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Queue Position — GET /api/administration/execution/queue/position/:jobId
// ─────────────────────────────────────────────────────────────────────────────

test.group('Admin / Execution Service — queue position', () => {
  test('returns 400 when jobId is not a positive integer', async ({ client }) => {
    const { token } = await loginAsAdmin(client)

    const response = await client
      .get('/api/administration/execution/queue/position/invalid')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(400)
    response.assertBodyContains({ error: { code: 'invalid_job_id' } })
  })

  test('returns 400 when jobId is zero', async ({ client }) => {
    const { token } = await loginAsAdmin(client)

    const response = await client
      .get('/api/administration/execution/queue/position/0')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(400)
    response.assertBodyContains({ error: { code: 'invalid_job_id' } })
  })

  test('returns 400 when jobId is negative', async ({ client }) => {
    const { token } = await loginAsAdmin(client)

    const response = await client
      .get('/api/administration/execution/queue/position/-1')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(400)
    response.assertBodyContains({ error: { code: 'invalid_job_id' } })
  })

  test('returns 404 when job not found in remote queue', async ({ client }) => {
    const { token } = await loginAsAdmin(client)

    const response = await client
      .get('/api/administration/execution/queue/position/142')
      .header('Authorization', `Bearer ${token}`)

    // Returns 404 when job is not found in the remote queue
    response.assertStatus(404)
    response.assertBodyContains({ error: { code: 'not_found' } })
  })

  test('returns 403 when authenticated as a regular user', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .get('/api/administration/execution/queue/position/142')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(403)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/administration/execution/queue/position/142')
    response.assertStatus(401)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Workers — GET /api/administration/execution/workers
// ─────────────────────────────────────────────────────────────────────────────

test.group('Admin / Execution Service — workers', () => {
  test('returns 503 when execution service is unavailable', async ({ client }) => {
    const { token } = await loginAsAdmin(client)

    // Ensure test is deterministic: unset external JOB_QUEUE_API_URL so service reports unavailable
    delete process.env.JOB_QUEUE_API_URL

    const response = await client
      .get('/api/administration/execution/workers')
      .header('Authorization', `Bearer ${token}`)

    // Should return 503 because JOB_QUEUE_API_URL is not configured or unreachable in test env
    response.assertStatus(503)
    response.assertBodyContains({ error: { code: 'service_unavailable' } })
  })

  test('returns 403 when authenticated as a regular user', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .get('/api/administration/execution/workers')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(403)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/administration/execution/workers')
    response.assertStatus(401)
  })
})
