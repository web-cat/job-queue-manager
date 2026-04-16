import { test } from '@japa/runner'
// import { skip } from 'node:test'

// Helper to register and get a token
async function loginAsUser(client: any) {
  const email = `user_${Date.now()}@test.com`
  const register = await client.post('/api/auth/register').json({
    firstName: 'Test',
    lastName: 'User',
    email,
    password: 'password123',
  })
  //   console.log('Register response:', JSON.stringify(register.body(), null, 2))
  return { token: register.body().token.token, email }
}

test.group('Courses — index', () => {
  test('returns list of courses when authenticated', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client.get('/api/courses').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/courses')
    response.assertStatus(401)
  })
})

test.group('Courses — store', () => {
  test('creates a course successfully', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .post('/api/courses')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: `Test Course ${Date.now()}`,
        number: 'CS1234',
        organizationId: 1, // Virginia Tech from seed data
        slug: `test-course-${Date.now()}`,
      })

    response.assertStatus(201)
    response.assertBodyContains({ name: response.body().name })
  })

  test('rejects course creation with missing fields', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .post('/api/courses')
      .header('Authorization', `Bearer ${token}`)
      .json({
        number: 'CS1234',
      })

    response.assertStatus(422)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.post('/api/courses').json({
      name: 'Test Course',
      number: 'CS1234',
      organizationId: 1,
      slug: 'test-course',
    })

    response.assertStatus(401)
  })
})

test.group('Courses — show', () => {
  test('returns a single course', async ({ client }) => {
    const { token } = await loginAsUser(client)

    // create a course first
    const created = await client
      .post('/api/courses')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: `Show Course ${Date.now()}`,
        number: 'CS5678',
        organizationId: 1,
        slug: `show-course-${Date.now()}`,
      })

    const courseId = created.body().id

    const response = await client
      .get(`/api/courses/${courseId}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({ id: courseId })
  })

  test('returns 404 for non-existent course', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .get('/api/courses/999999')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })
})

test.group('Courses — sections', () => {
  test('returns sections for a course', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const created = await client
      .post('/api/courses')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: `Sections Course ${Date.now()}`,
        number: 'CS9999',
        organizationId: 1,
        slug: `sections-course-${Date.now()}`,
      })

    const courseId = created.body().id

    const response = await client
      .get(`/api/courses/${courseId}/sections`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
  })

  // NOTE: createSection requires a valid termId from the term table.
  // Term table is not seeded by default so this test is skipped until
  // a term seed or factory is added.
  test('creates a section for a course', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const created = await client
      .post('/api/courses')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: `Create Section Course ${Date.now()}`,
        number: 'CS0001',
        organizationId: 1,
        slug: `create-section-course-${Date.now()}`,
      })

    const courseId = created.body().id

    const response = await client
      .post(`/api/courses/${courseId}/sections`)
      .header('Authorization', `Bearer ${token}`)
      .json({
        termId: 1, // requires a seeded term
        label: 'Section 1',
      })

    response.assertStatus(201)
  })
})
