import { test } from '@japa/runner'
import { createHmac, createHash, randomUUID } from 'node:crypto'
// Add to imports at top of oauth.spec.ts:
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'

// ── Helpers ───────────────────────────────────────────────────────────

async function loginAsUser(client: any) {
  const email = `oauth_test_${Date.now()}@test.com`
  const register = await client.post('/api/auth/register').json({
    firstName: 'OAuth',
    lastName: 'Test',
    email,
    password: 'password123',
  })
  return { token: register.body().token.token, email }
}

async function createOAuthClient(client: any, token: string, name?: string) {
  const response = await client
    .post('/api/oauth/clients')
    .header('Authorization', `Bearer ${token}`)
    .json({ name: name ?? `test-client-${Date.now()}` })
  return response.body()
}

function signRequest(
  clientSecret: string,
  method: string,
  path: string,
  body: string = ''
): { timestamp: string; nonce: string; signature: string } {
  const timestamp = Date.now().toString()
  const nonce = randomUUID()
  const bodyHash = createHash('sha256').update(body).digest('hex')
  const canonical = [method.toUpperCase(), path, timestamp, nonce, bodyHash].join('\n')
  const signature = createHmac('sha256', clientSecret).update(canonical).digest('hex')
  return { timestamp, nonce, signature }
}

// ── OAuth Client Management ───────────────────────────────────────────

test.group('OAuth — createClient', () => {
  test('creates a client and returns client_id and client_secret', async ({ client, assert }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .post('/api/oauth/clients')
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'my-script' })

    response.assertStatus(201)
    const body = response.body()
    assert.exists(body.client_id)
    assert.exists(body.client_secret)
    assert.equal(body.name, 'my-script')
    assert.exists(body.warning)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.post('/api/oauth/clients').json({ name: 'my-script' })

    response.assertStatus(401)
  })

  test('returns 422 when name is missing', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .post('/api/oauth/clients')
      .header('Authorization', `Bearer ${token}`)
      .json({})

    response.assertStatus(422)
  })
})

test.group('OAuth — listClients', () => {
  test('returns list of clients for authenticated user', async ({ client, assert }) => {
    const { token } = await loginAsUser(client)
    await createOAuthClient(client, token, 'client-a')
    await createOAuthClient(client, token, 'client-b')

    const response = await client
      .get('/api/oauth/clients')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const body = response.body()
    assert.isArray(body)
    assert.isAtLeast(body.length, 2)
  })

  test('does not return client_secret in list', async ({ client, assert }) => {
    const { token } = await loginAsUser(client)
    await createOAuthClient(client, token)

    const response = await client
      .get('/api/oauth/clients')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const body = response.body()
    body.forEach((c: any) => {
      assert.notExists(c.client_secret)
      assert.notExists(c.client_secret_encrypted)
    })
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/oauth/clients')
    response.assertStatus(401)
  })
})

test.group('OAuth — revokeClient', () => {
  test('revokes a client successfully', async ({ client, assert }) => {
    const { token } = await loginAsUser(client)
    const created = await createOAuthClient(client, token)

    const response = await client
      .delete(`/api/oauth/clients/${created.id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    assert.equal(response.body().client_id, created.client_id)
  })

  test("returns 404 when revoking another user's client", async ({ client }) => {
    // Create client as user A
    const { token: tokenA } = await loginAsUser(client)
    const created = await createOAuthClient(client, tokenA)

    // Try to revoke as user B
    const { token: tokenB } = await loginAsUser(client)
    const response = await client
      .delete(`/api/oauth/clients/${created.id}`)
      .header('Authorization', `Bearer ${tokenB}`)

    response.assertStatus(404)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.delete('/api/oauth/clients/1')
    response.assertStatus(401)
  })
})

// ── Token Exchange ────────────────────────────────────────────────────

test.group('OAuth — token exchange', () => {
  test('exchanges valid credentials for a Bearer token', async ({ client, assert }) => {
    const { token } = await loginAsUser(client)
    const created = await createOAuthClient(client, token)

    const response = await client.post('/api/oauth/token').json({
      client_id: created.client_id,
      client_secret: created.client_secret,
      grant_type: 'client_credentials',
    })

    response.assertStatus(200)
    const body = response.body()
    assert.exists(body.access_token)
    assert.equal(body.token_type, 'Bearer')
    assert.equal(body.expires_in, 3600)
  })

  test('rejects invalid client_secret', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const created = await createOAuthClient(client, token)

    const response = await client.post('/api/oauth/token').json({
      client_id: created.client_id,
      client_secret: 'wrong_secret',
      grant_type: 'client_credentials',
    })

    response.assertStatus(401)
  })

  test('rejects unknown client_id', async ({ client }) => {
    const response = await client.post('/api/oauth/token').json({
      client_id: '00000000-0000-0000-0000-000000000000', // valid UUID format, doesn't exist
      client_secret: 'doesnt-matter',
      grant_type: 'client_credentials',
    })
    response.assertStatus(401)
  })

  test('rejects wrong grant_type', async ({ client }) => {
    const response = await client.post('/api/oauth/token').json({
      client_id: 'some-id',
      client_secret: 'some-secret',
      grant_type: 'authorization_code',
    })

    response.assertStatus(400)
  })

  test('rejects revoked client', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const created = await createOAuthClient(client, token)

    // Revoke the client
    await client
      .delete(`/api/oauth/clients/${created.id}`)
      .header('Authorization', `Bearer ${token}`)

    // Try to exchange token
    const response = await client.post('/api/oauth/token').json({
      client_id: created.client_id,
      client_secret: created.client_secret,
      grant_type: 'client_credentials',
    })

    response.assertStatus(401)
  })
})

// ── HMAC Signed API (/api/v1) ─────────────────────────────────────────

test.group('OAuth — HMAC signed requests (/api/v1)', () => {
  test('authenticates and returns assignments with valid HMAC signature', async ({
    client,
    assert,
  }) => {
    const { token } = await loginAsUser(client)
    const created = await createOAuthClient(client, token)

    const { timestamp, nonce, signature } = signRequest(
      created.client_secret,
      'GET',
      '/api/v1/assignments'
    )

    const response = await client
      .get('/api/v1/assignments')
      .header('x-api-key', created.client_id)
      .header('x-timestamp', timestamp)
      .header('x-nonce', nonce)
      .header('x-signature', signature)

    response.assertStatus(200)
    assert.exists(response.body().data)
  })

  test('rejects request with missing headers', async ({ client }) => {
    const response = await client.get('/api/v1/assignments')
    response.assertStatus(401)
  })

  test('rejects request with invalid signature', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const created = await createOAuthClient(client, token)

    const { timestamp, nonce } = signRequest(created.client_secret, 'GET', '/api/v1/assignments')

    const response = await client
      .get('/api/v1/assignments')
      .header('x-api-key', created.client_id)
      .header('x-timestamp', timestamp)
      .header('x-nonce', nonce)
      .header('x-signature', 'invalidsignature')

    response.assertStatus(401)
  })

  test('rejects replayed nonce', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const created = await createOAuthClient(client, token)

    const { timestamp, nonce, signature } = signRequest(
      created.client_secret,
      'GET',
      '/api/v1/assignments'
    )

    const headers = {
      'x-api-key': created.client_id,
      'x-timestamp': timestamp,
      'x-nonce': nonce,
      'x-signature': signature,
    }

    // First request — should succeed
    await client.get('/api/v1/assignments').headers(headers)

    // Second request with same nonce — should fail
    const response = await client.get('/api/v1/assignments').headers(headers)
    response.assertStatus(401)
  })

  test('rejects expired timestamp', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const created = await createOAuthClient(client, token)

    // Use a timestamp 10 minutes in the past
    const oldTimestamp = (Date.now() - 10 * 60 * 1000).toString()
    const nonce = randomUUID()
    const bodyHash = createHash('sha256').update('').digest('hex')
    const canonical = ['GET', '/api/v1/assignments', oldTimestamp, nonce, bodyHash].join('\n')
    const signature = createHmac('sha256', created.client_secret).update(canonical).digest('hex')

    const response = await client
      .get('/api/v1/assignments')
      .header('x-api-key', created.client_id)
      .header('x-timestamp', oldTimestamp)
      .header('x-nonce', nonce)
      .header('x-signature', signature)

    response.assertStatus(401)
  })

  test('rejects revoked client on HMAC request', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const created = await createOAuthClient(client, token)

    // Revoke the client
    await client
      .delete(`/api/oauth/clients/${created.id}`)
      .header('Authorization', `Bearer ${token}`)

    const { timestamp, nonce, signature } = signRequest(
      created.client_secret,
      'GET',
      '/api/v1/assignments'
    )

    const response = await client
      .get('/api/v1/assignments')
      .header('x-api-key', created.client_id)
      .header('x-timestamp', timestamp)
      .header('x-nonce', nonce)
      .header('x-signature', signature)

    response.assertStatus(401)
  })
})

test.group('OAuth — HMAC role enforcement (/api/v1)', () => {
  test('admin can create assignment via HMAC', async ({ client, assert }) => {
    // Create admin user
    const email = `admin_hmac_${Date.now()}@test.com`
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
    const token = login.body().token.token

    // Create OAuth client for admin
    const created = await client
      .post('/api/oauth/clients')
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'admin-cli-test' })
    const { client_id: clientId, client_secret: clientSecret } = created.body()

    // Create submission policy
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

    // Sign request
    const { timestamp, nonce, signature } = signRequest(
      clientSecret,
      'POST',
      '/api/v1/assignments',
      JSON.stringify({ name: 'HMAC Test Assignment', submissionPolicyId: policy.id })
    )

    const response = await client
      .post('/api/v1/assignments')
      .header('x-api-key', clientId)
      .header('x-timestamp', timestamp)
      .header('x-nonce', nonce)
      .header('x-signature', signature)
      .json({ name: 'HMAC Test Assignment', submissionPolicyId: policy.id })

    response.assertStatus(201)
    assert.exists(response.body().id)
  })

  test('student cannot create assignment via HMAC', async ({ client }) => {
    // Register as student (globalRoleId: 3 by default)
    const email = `student_hmac_${Date.now()}@test.com`
    const register = await client.post('/api/auth/register').json({
      firstName: 'Student',
      lastName: 'User',
      email,
      password: 'password123',
    })
    const token = register.body().token.token

    const created = await client
      .post('/api/oauth/clients')
      .header('Authorization', `Bearer ${token}`)
      .json({ name: 'student-cli-test' })
    const { client_id: clientId, client_secret: clientSecret } = created.body()

    const body = JSON.stringify({ name: 'Should Fail', submissionPolicyId: 1 })
    const { timestamp, nonce, signature } = signRequest(
      clientSecret,
      'POST',
      '/api/v1/assignments',
      body
    )

    const response = await client
      .post('/api/v1/assignments')
      .header('x-api-key', clientId)
      .header('x-timestamp', timestamp)
      .header('x-nonce', nonce)
      .header('x-signature', signature)
      .json({ name: 'Should Fail', submissionPolicyId: 1 })

    response.assertStatus(403)
  })
})
