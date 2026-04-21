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

// Register a user then promote them to admin directly in DB.
async function loginAsAdmin(client: any) {
  const email = `admin_${Date.now()}@test.com`
  await client.post('/api/auth/register').json({
    firstName: 'Admin',
    lastName: 'User',
    email,
    password: 'password123',
  })

  // Look up by email since register response doesn't expose the user id
  const user = await db.from('user').where('email', email).first()
  await db.from('user').where('id', user.id).update({ global_role_id: 1 })

  const login = await client.post('/api/auth/login').json({
    email,
    password: 'password123',
  })
  return { token: login.body().token.token, email, userId: user.id }
}

// ─────────────────────────────────────────────────────────────────────────────
// Users — GET /api/users
// ─────────────────────────────────────────────────────────────────────────────

test.group('Admin / Users — index', () => {
  test('returns user list when authenticated as admin', async ({ client }) => {
    const { token } = await loginAsAdmin(client)

    const response = await client.get('/api/users').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
  })

  test('returns 403 when authenticated as a regular user', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client.get('/api/users').header('Authorization', `Bearer ${token}`)

    response.assertStatus(403)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/users')
    response.assertStatus(401)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Users — PATCH /api/users/:id/role
// ─────────────────────────────────────────────────────────────────────────────

test.group('Admin / Users — updateRole', () => {
  test('updates a user role when authenticated as admin', async ({ client }) => {
    const { token } = await loginAsAdmin(client)

    // Create a target user to update
    const { userId } = await loginAsUser(client)

    const response = await client
      .patch(`/api/users/${userId}/role`)
      .header('Authorization', `Bearer ${token}`)
      .json({ globalRoleId: 2 }) // promote to Instructor

    response.assertStatus(200)
    response.assertBodyContains({ globalRoleId: 2 })
  })

  test('returns 403 when a regular user tries to update a role', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const { userId } = await loginAsUser(client)

    const response = await client
      .patch(`/api/users/${userId}/role`)
      .header('Authorization', `Bearer ${token}`)
      .json({ globalRoleId: 1 })

    response.assertStatus(403)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.patch('/api/users/1/role').json({ globalRoleId: 1 })

    response.assertStatus(401)
  })

  test('returns 404 when user does not exist', async ({ client }) => {
    const { token } = await loginAsAdmin(client)

    const response = await client
      .patch('/api/users/999999/role')
      .header('Authorization', `Bearer ${token}`)
      .json({ globalRoleId: 2 })

    response.assertStatus(404)
  })

  test('returns 422 when globalRoleId is missing', async ({ client }) => {
    const { token } = await loginAsAdmin(client)
    const { userId } = await loginAsUser(client)

    const response = await client
      .patch(`/api/users/${userId}/role`)
      .header('Authorization', `Bearer ${token}`)
      .json({}) // missing globalRoleId

    response.assertStatus(422)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Terms — GET /api/terms
// ─────────────────────────────────────────────────────────────────────────────

test.group('Admin / Terms — index', () => {
  test('returns term list when authenticated as admin', async ({ client }) => {
    const { token } = await loginAsAdmin(client)

    const response = await client.get('/api/terms').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
  })

  test('returns 403 when authenticated as a regular user', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client.get('/api/terms').header('Authorization', `Bearer ${token}`)

    response.assertStatus(403)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/terms')
    response.assertStatus(401)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Terms — POST /api/terms
// ─────────────────────────────────────────────────────────────────────────────

test.group('Admin / Terms — store', () => {
  test('creates a term when authenticated as admin', async ({ client }) => {
    const { token } = await loginAsAdmin(client)
    const slug = `spring-2099-${Date.now()}`

    const response = await client
      .post('/api/terms')
      .header('Authorization', `Bearer ${token}`)
      .json({
        season: 1,
        year: 2099,
        slug,
        startsOn: '2099-01-10T00:00:00.000Z',
        endsOn: '2099-05-10T00:00:00.000Z',
      })

    response.assertStatus(201)
    response.assertBodyContains({ slug })
  })

  test('returns 403 when a regular user tries to create a term', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .post('/api/terms')
      .header('Authorization', `Bearer ${token}`)
      .json({
        season: 1,
        year: 2099,
        slug: `blocked-${Date.now()}`,
        startsOn: '2099-01-10T00:00:00.000Z',
        endsOn: '2099-05-10T00:00:00.000Z',
      })

    response.assertStatus(403)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.post('/api/terms').json({
      season: 1,
      year: 2099,
      slug: 'noauth-term',
      startsOn: '2099-01-10T00:00:00.000Z',
      endsOn: '2099-05-10T00:00:00.000Z',
    })

    response.assertStatus(401)
  })

  test('returns 422 when required fields are missing', async ({ client }) => {
    const { token } = await loginAsAdmin(client)

    const response = await client
      .post('/api/terms')
      .header('Authorization', `Bearer ${token}`)
      .json({
        season: 1,
        // missing year, slug, startsOn, endsOn
      })

    response.assertStatus(422)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Submission Policies — GET /api/submission-policies
// ─────────────────────────────────────────────────────────────────────────────

test.group('Admin / SubmissionPolicies — index', () => {
  test('returns policy list when authenticated as admin', async ({ client }) => {
    const { token } = await loginAsAdmin(client)

    const response = await client
      .get('/api/submission-policies')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
  })

  test('returns 403 when authenticated as a regular user', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .get('/api/submission-policies')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(403)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/submission-policies')
    response.assertStatus(401)
  })
})
