import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

// Helper to register and get a token
async function loginAsUser(client: any) {
  const email = `user_${Date.now()}@test.com`
  const register = await client.post('/api/auth/register').json({
    firstName: 'Test',
    lastName: 'User',
    email,
    password: 'password123',
  })
  return { token: register.body().token.token, email }
}

// Helper to create a submission policy directly in DB
// since there's no API endpoint for it
async function createSubmissionPolicy() {
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
  return policy.id
}

test.group('Assignments — index', () => {
  test('returns list of assignments when authenticated', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client.get('/api/assignments').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/assignments')
    response.assertStatus(401)
  })
})

test.group('Assignments — store', () => {
  test('creates an assignment successfully', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const policyId = await createSubmissionPolicy()

    const response = await client
      .post('/api/assignments')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: `Test Assignment ${Date.now()}`,
        submissionPolicyId: policyId,
      })

    response.assertStatus(201)
    response.assertBodyContains({ name: response.body().name })
  })

  test('rejects assignment creation with missing fields', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .post('/api/assignments')
      .header('Authorization', `Bearer ${token}`)
      .json({
        description: 'Missing name and policyId',
      })

    response.assertStatus(422)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.post('/api/assignments').json({
      name: 'Test Assignment',
      submissionPolicyId: 1,
    })

    response.assertStatus(401)
  })
})

test.group('Assignments — show', () => {
  test('returns a single assignment', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const policyId = await createSubmissionPolicy()

    const created = await client
      .post('/api/assignments')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: `Show Assignment ${Date.now()}`,
        submissionPolicyId: policyId,
      })

    const assignmentId = created.body().id

    const response = await client
      .get(`/api/assignments/${assignmentId}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({ id: assignmentId })
  })

  test('returns 404 for non-existent assignment', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .get('/api/assignments/999999')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })
})

test.group('Assignments — update', () => {
  test('updates an assignment successfully', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const policyId = await createSubmissionPolicy()

    const created = await client
      .post('/api/assignments')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: `Update Assignment ${Date.now()}`,
        submissionPolicyId: policyId,
      })

    const assignmentId = created.body().id

    const response = await client
      .patch(`/api/assignments/${assignmentId}`)
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: 'Updated Name',
      })

    response.assertStatus(200)
    response.assertBodyContains({ name: 'Updated Name' })
  })
})

test.group('Assignments — destroy', () => {
  test('deletes an assignment successfully', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const policyId = await createSubmissionPolicy()

    const created = await client
      .post('/api/assignments')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: `Delete Assignment ${Date.now()}`,
        submissionPolicyId: policyId,
      })

    const assignmentId = created.body().id

    const response = await client
      .delete(`/api/assignments/${assignmentId}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
  })
})

test.group('Assignments — offerings', () => {
  test('returns offerings for an assignment', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const policyId = await createSubmissionPolicy()

    const created = await client
      .post('/api/assignments')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: `Offerings Assignment ${Date.now()}`,
        submissionPolicyId: policyId,
      })

    const assignmentId = created.body().id

    const response = await client
      .get(`/api/assignments/${assignmentId}/offerings`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
  })
})
