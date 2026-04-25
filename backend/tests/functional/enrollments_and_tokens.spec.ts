import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import User from '#models/user'

// ── Helpers ───────────────────────────────────────────────────────────

async function loginAsAdmin(client: any) {
  const email = `admin_${Date.now()}@test.com`
  await client.post('/api/auth/register').json({
    firstName: 'Admin',
    lastName: 'User',
    email,
    password: 'password123',
  })
  const user = await User.findByOrFail('email', email)
  user.globalRoleId = 1
  await user.save()
  const login = await client.post('/api/auth/login').json({ email, password: 'password123' })
  return { token: login.body().token.token, email, userId: user.id }
}

async function loginAsUser(client: any) {
  const email = `user_${Date.now()}@test.com`
  const register = await client.post('/api/auth/register').json({
    firstName: 'Test',
    lastName: 'User',
    email,
    password: 'password123',
  })
  const user = await User.findByOrFail('email', email)
  user.globalRoleId = 1
  await user.save()
  return { token: register.body().token.token, email, userId: user.id }
}

async function createCourseWithSection(client: any, token: string) {
  const course = await client
    .post('/api/courses')
    .header('Authorization', `Bearer ${token}`)
    .json({
      name: `Enrollment Course ${Date.now()}`,
      number: 'CS0001',
      organizationId: 1,
      slug: `enroll-course-${Date.now()}`,
    })
  const courseId = course.body().id

  const [term] = await db
    .table('term')
    .insert({
      season: 1,
      year: 2026,
      slug: `term-${Date.now()}`,
      starts_on: DateTime.now().toISO(),
      ends_on: DateTime.now().plus({ months: 4 }).toISO(),
    })
    .returning('id')

  const section = await client
    .post(`/api/courses/${courseId}/sections`)
    .header('Authorization', `Bearer ${token}`)
    .json({ termId: term.id, label: 'Section 1' })

  return { courseId, sectionId: section.body().id }
}

// ── Enrollments ───────────────────────────────────────────────────────

test.group('Courses — enrollments', () => {
  test('enrolls a user in a section successfully', async ({ client, assert }) => {
    const { token } = await loginAsAdmin(client)
    const { userId } = await loginAsUser(client)
    const { courseId, sectionId } = await createCourseWithSection(client, token)

    const response = await client
      .post(`/api/courses/${courseId}/sections/${sectionId}/enroll`)
      .header('Authorization', `Bearer ${token}`)
      .json({ userId, courseRoleId: 3 }) // Student role

    response.assertStatus(201)
    assert.exists(response.body().id)
  })

  test('returns conflict if user already enrolled', async ({ client }) => {
    const { token } = await loginAsAdmin(client)
    const { userId } = await loginAsUser(client)
    const { courseId, sectionId } = await createCourseWithSection(client, token)

    await client
      .post(`/api/courses/${courseId}/sections/${sectionId}/enroll`)
      .header('Authorization', `Bearer ${token}`)
      .json({ userId, courseRoleId: 3 })

    const response = await client
      .post(`/api/courses/${courseId}/sections/${sectionId}/enroll`)
      .header('Authorization', `Bearer ${token}`)
      .json({ userId, courseRoleId: 3 })

    response.assertStatus(409)
  })

  test('returns list of enrollments for a section', async ({ client, assert }) => {
    const { token } = await loginAsAdmin(client)
    const { userId } = await loginAsUser(client)
    const { courseId, sectionId } = await createCourseWithSection(client, token)

    await client
      .post(`/api/courses/${courseId}/sections/${sectionId}/enroll`)
      .header('Authorization', `Bearer ${token}`)
      .json({ userId, courseRoleId: 3 })

    const response = await client
      .get(`/api/courses/${courseId}/sections/${sectionId}/enrollments`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const body = response.body()
    assert.isArray(body)
    assert.isAtLeast(body.length, 1)
  })

  test('unenrolls a user from a section', async ({ client }) => {
    const { token } = await loginAsAdmin(client)
    const { userId } = await loginAsUser(client)
    const { courseId, sectionId } = await createCourseWithSection(client, token)

    await client
      .post(`/api/courses/${courseId}/sections/${sectionId}/enroll`)
      .header('Authorization', `Bearer ${token}`)
      .json({ userId, courseRoleId: 3 })

    const response = await client
      .delete(`/api/courses/${courseId}/sections/${sectionId}/enroll/${userId}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
  })

  test('returns 401 when not authenticated for enrollments', async ({ client }) => {
    const response = await client.get('/api/courses/1/sections/1/enrollments')
    response.assertStatus(401)
  })
})

// ── Token Management ──────────────────────────────────────────────────

test.group('Auth — token management', () => {
  test('creates a named API token', async ({ client, assert }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .post('/api/auth/tokens')
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'my-api-token', expiresIn: '7 days' })

    response.assertStatus(201)
    const body = response.body()
    assert.equal(body.name, 'my-api-token')
    assert.exists(body.token)
    assert.exists(body.expiresAt)
  })

  test('lists tokens for authenticated user', async ({ client, assert }) => {
    const { token } = await loginAsUser(client)

    await client
      .post('/api/auth/tokens')
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'list-test-token' })

    const response = await client.get('/api/auth/tokens').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    assert.isArray(response.body())
  })

  test('revokes a token by id', async ({ client, assert }) => {
    const { token } = await loginAsUser(client)

    const created = await client
      .post('/api/auth/tokens')
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'revoke-test-token' })

    const tokenId = created.body().id ?? 1

    const response = await client
      .delete(`/api/auth/tokens/${tokenId}`)
      .header('Authorization', `Bearer ${token}`)

    // 200 or 204 depending on implementation
    assert.isTrue([200, 204].includes(response.status()))
  })

  test('returns 401 when creating token without auth', async ({ client }) => {
    const response = await client.post('/api/auth/tokens').json({ name: 'unauthorized-token' })

    response.assertStatus(401)
  })

  test('returns 422 when name is missing', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .post('/api/auth/tokens')
      .header('Authorization', `Bearer ${token}`)
      .json({})

    response.assertStatus(422)
  })
})
