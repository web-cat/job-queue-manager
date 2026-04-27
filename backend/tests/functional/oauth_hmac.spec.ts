import { test } from '@japa/runner'
import { createHash, createHmac, randomUUID } from 'node:crypto'

async function registerAndGetSessionToken(client: any) {
  const email = `oauth_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`
  const register = await client.post('/api/auth/register').json({
    firstName: 'OAuth',
    lastName: 'Tester',
    email,
    password: 'password123',
  })

  return {
    email,
    token: register.body().token.token as string,
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

test.group('OAuth + HMAC auth paths', () => {
  test('exchanges client credentials for bearer token and accesses /api/auth/me', async ({
    client,
  }) => {
    const { token, email } = await registerAndGetSessionToken(client)

    const createClient = await client
      .post('/api/oauth/clients')
      .header('Authorization', `Bearer ${token}`)
      .json({ name: `test-client-${Date.now()}` })

    createClient.assertStatus(201)

    const clientId = createClient.body().client_id
    const clientSecret = createClient.body().client_secret

    const tokenExchange = await client.post('/api/oauth/token').json({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    })

    tokenExchange.assertStatus(200)
    tokenExchange.assertBodyContains({ token_type: 'Bearer' })

    const accessToken = tokenExchange.body().access_token

    const me = await client.get('/api/auth/me').header('Authorization', `Bearer ${accessToken}`)

    me.assertStatus(200)
    me.assertBodyContains({ email })
  })

  test('authenticates /api/v1/auth/me using valid HMAC signature', async ({ client }) => {
    const { token, email } = await registerAndGetSessionToken(client)

    const createClient = await client
      .post('/api/oauth/clients')
      .header('Authorization', `Bearer ${token}`)
      .json({ name: `hmac-client-${Date.now()}` })

    createClient.assertStatus(201)

    const clientId = createClient.body().client_id as string
    const clientSecret = createClient.body().client_secret as string

    const headers = buildHmacHeaders({
      clientId,
      clientSecret,
      method: 'GET',
      path: '/api/v1/auth/me',
    })

    const response = await client
      .get('/api/v1/auth/me')
      .header('x-api-key', headers['x-api-key'])
      .header('x-timestamp', headers['x-timestamp'])
      .header('x-nonce', headers['x-nonce'])
      .header('x-signature', headers['x-signature'])

    response.assertStatus(200)
    response.assertBodyContains({ email })
  })

  test('rejects invalid HMAC signature and replayed nonce', async ({ client }) => {
    const { token } = await registerAndGetSessionToken(client)

    const createClient = await client
      .post('/api/oauth/clients')
      .header('Authorization', `Bearer ${token}`)
      .json({ name: `hmac-negative-${Date.now()}` })

    createClient.assertStatus(201)

    const clientId = createClient.body().client_id as string
    const clientSecret = createClient.body().client_secret as string

    const firstHeaders = buildHmacHeaders({
      clientId,
      clientSecret,
      method: 'GET',
      path: '/api/v1/auth/me',
      nonce: randomUUID(),
      timestamp: String(Date.now()),
    })

    const definitelyInvalidSignature =
      firstHeaders['x-signature'][0] === '0'
        ? `1${firstHeaders['x-signature'].slice(1)}`
        : `0${firstHeaders['x-signature'].slice(1)}`

    const invalidSig = await client
      .get('/api/v1/auth/me')
      .header('x-api-key', firstHeaders['x-api-key'])
      .header('x-timestamp', firstHeaders['x-timestamp'])
      .header('x-nonce', firstHeaders['x-nonce'])
      .header('x-signature', definitelyInvalidSignature)

    invalidSig.assertStatus(401)

    const replayHeaders = buildHmacHeaders({
      clientId,
      clientSecret,
      method: 'GET',
      path: '/api/v1/auth/me',
      nonce: randomUUID(),
      timestamp: String(Date.now()),
    })

    const ok = await client
      .get('/api/v1/auth/me')
      .header('x-api-key', replayHeaders['x-api-key'])
      .header('x-timestamp', replayHeaders['x-timestamp'])
      .header('x-nonce', replayHeaders['x-nonce'])
      .header('x-signature', replayHeaders['x-signature'])

    ok.assertStatus(200)

    const replay = await client
      .get('/api/v1/auth/me')
      .header('x-api-key', replayHeaders['x-api-key'])
      .header('x-timestamp', replayHeaders['x-timestamp'])
      .header('x-nonce', replayHeaders['x-nonce'])
      .header('x-signature', replayHeaders['x-signature'])

    replay.assertStatus(401)
  })
})
