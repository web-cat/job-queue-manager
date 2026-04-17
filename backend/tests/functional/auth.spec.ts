import { test } from '@japa/runner'

test.group('Auth — register', () => {
  test('registers a new user successfully', async ({ client }) => {
    const response = await client.post('/api/auth/register').json({
      firstName: 'Test',
      lastName: 'User',
      email: `register_${Date.now()}@test.com`,
      password: 'password123',
    })

    response.assertStatus(201)
    response.assertBodyContains({ token: {} })
  })

  test('returns conflict if email already exists', async ({ client }) => {
    const email = `duplicate_${Date.now()}@test.com`

    // register once
    await client.post('/api/auth/register').json({
      firstName: 'Test',
      lastName: 'User',
      email,
      password: 'password123',
    })

    // register again with same email
    const response = await client.post('/api/auth/register').json({
      firstName: 'Test',
      lastName: 'User',
      email,
      password: 'password123',
    })

    response.assertStatus(409)
  })

  test('rejects registration with missing fields', async ({ client }) => {
    const response = await client.post('/api/auth/register').json({
      email: 'test@test.com',
    })

    response.assertStatus(422)
  })
})

// BUG FOUND: The login fails for new registered users.
// Cause: auth_controller.ts register() manually hashes the password
// before passing it to the User.create(), which causes double-hashing.
// verifyCredentials() then fails to match because it hashes again on the comparison.

test.group('Auth — login', () => {
  test('logs in with valid credentials', async ({ client }) => {
    const email = `login_${Date.now()}@test.com`

    await client.post('/api/auth/register').json({
      firstName: 'Test',
      lastName: 'User',
      email,
      password: 'password123',
    })

    const response = await client.post('/api/auth/login').json({
      email,
      password: 'password123',
    })

    response.assertStatus(200)
    response.assertBodyContains({ token: {} })
  })

  test('rejects invalid credentials', async ({ client }) => {
    const response = await client.post('/api/auth/login').json({
      email: 'nobody@test.com',
      password: 'wrongpassword',
    })

    response.assertStatus(401)
  })

  //   test('debug login response', async ({ client }) => {
  //     const email = `debug_${Date.now()}@test.com`

  //     await client.post('/api/auth/register').json({
  //       firstName: 'Test',
  //       lastName: 'User',
  //       email,
  //       password: 'password123',
  //     })

  //     const response = await client.post('/api/auth/login').json({
  //       email,
  //       password: 'password123',
  //     })

  //     console.log('Login response body:', JSON.stringify(response.body(), null, 2))
  //     console.log('Login status:', response.status())
  //   })
})

test.group('Auth — me', () => {
  test('returns current user when authenticated', async ({ client }) => {
    const email = `me_${Date.now()}@test.com`

    const register = await client.post('/api/auth/register').json({
      firstName: 'Test',
      lastName: 'User',
      email,
      password: 'password123',
    })

    const token = register.body().token.token

    const response = await client.get('/api/auth/me').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({ email })
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/auth/me')
    response.assertStatus(401)
  })
})
