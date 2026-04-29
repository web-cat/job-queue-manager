import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

async function loginAsAdmin(client: any) {
  const email = `admin_${Date.now()}@test.com`
  const registerRes = await client.post('/api/auth/register').json({
    email,
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
  })

  const token = registerRes.body().token.token
  const meRes = await client.get('/api/auth/me').header('Authorization', `Bearer ${token}`)
  const userId = meRes.body().id

  await db.from('user').where('id', userId).update({ global_role_id: 1 })

  return { token, email, userId }
}

async function loginAsUser(client: any) {
  const email = `user_${Date.now()}@test.com`
  const registerRes = await client.post('/api/auth/register').json({
    email,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
  })

  const token = registerRes.body().token.token
  const meRes = await client.get('/api/auth/me').header('Authorization', `Bearer ${token}`)
  const userId = meRes.body().id

  return { token, email, userId }
}

test.group('Admin / Image Management endpoints', (group) => {
  group.setup(async () => {
    delete process.env.JOB_QUEUE_API_URL
    delete process.env.JOB_QUEUE_API_KEY
  })

  test('GET /api/images requires authentication', async ({ client }) => {
    const response = await client.get('/api/images')
    response.assertStatus(401)
  })

  test('GET /api/images requires admin role', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const response = await client.get('/api/images').header('Authorization', `Bearer ${token}`)
    response.assertStatus(403)
  })

  test('POST /api/images requires authentication', async ({ client }) => {
    const response = await client
      .post('/api/images')
      .json({ dockerImageTag: 'test', displayName: 'Test' })
    response.assertStatus(401)
  })

  test('POST /api/images requires admin role', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const response = await client
      .post('/api/images')
      .header('Authorization', `Bearer ${token}`)
      .json({ dockerImageTag: 'test', displayName: 'Test' })
    response.assertStatus(403)
  })

  test('POST /api/images validates required fields', async ({ client }) => {
    const { token } = await loginAsAdmin(client)
    const response = await client
      .post('/api/images')
      .header('Authorization', `Bearer ${token}`)
      .json({ displayName: 'Test' })
    response.assertStatus(400)
  })

  test('GET /api/images/{id} requires authentication', async ({ client }) => {
    const response = await client.get('/api/images/1')
    response.assertStatus(401)
  })

  test('GET /api/images/{id} requires admin role', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const response = await client.get('/api/images/1').header('Authorization', `Bearer ${token}`)
    response.assertStatus(403)
  })

  test('PUT /api/images/{id} requires authentication', async ({ client }) => {
    const response = await client.put('/api/images/1').json({ displayName: 'Updated' })
    response.assertStatus(401)
  })

  test('PUT /api/images/{id} requires admin role', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const response = await client
      .put('/api/images/1')
      .header('Authorization', `Bearer ${token}`)
      .json({ displayName: 'Updated' })
    response.assertStatus(403)
  })

  test('DELETE /api/images/{id} requires authentication', async ({ client }) => {
    const response = await client.delete('/api/images/1')
    response.assertStatus(401)
  })

  test('DELETE /api/images/{id} requires admin role', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const response = await client.delete('/api/images/1').header('Authorization', `Bearer ${token}`)
    response.assertStatus(403)
  })
})
