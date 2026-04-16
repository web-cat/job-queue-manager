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
    })
    .returning('id')

  return submission.id
}

// Helper to get the current user id from token
async function getUserId(client: any, token: string) {
  const me = await client.get('/api/auth/me').header('Authorization', `Bearer ${token}`)
  return me.body().id
}

test.group('Submissions — index', () => {
  test('returns list of submissions when authenticated', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client.get('/api/submissions').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/submissions')
    response.assertStatus(401)
  })
})

test.group('Submissions — show', () => {
  test('returns a single submission', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const userId = await getUserId(client, token)
    const submissionId = await createSubmission(userId)

    const response = await client
      .get(`/api/submissions/${submissionId}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({ id: submissionId })
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

test.group('Submissions — result', () => {
  test('returns not ready when feedback is not ready', async ({ client }) => {
    const { token } = await loginAsUser(client)
    const userId = await getUserId(client, token)
    const submissionId = await createSubmission(userId)

    const response = await client
      .get(`/api/submissions/${submissionId}/result`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({ ready: false })
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/submissions/1/result')
    response.assertStatus(401)
  })
})

test.group('Submissions — webhook', () => {
  test('accepts webhook payload and returns received', async ({ client }) => {
    const response = await client.post('/api/submissions/webhook').json({
      submissionId: 1,
      score: 95,
      feedbackReady: true,
    })

    response.assertStatus(200)
    response.assertBodyContains({ received: true })
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
