import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'

// ── Helpers ───────────────────────────────────────────────────────────

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

async function createSubmission(userId: number, status: string = 'pending') {
  const [result] = await db
    .table('submission_result')
    .insert({ correctness_score: 0 })
    .returning('id')

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
      status,
      retry_count: 0,
    })
    .returning('id')

  return { submissionId: submission.id, resultId: result.id }
}

// ── Submission Result ─────────────────────────────────────────────────

test.group('Submissions — result when ready', () => {
  test('returns score when feedback is ready', async ({ client, assert }) => {
    const { token, userId } = await loginAsUser(client)
    const { submissionId, resultId } = await createSubmission(userId, 'completed')

    // Mark feedback as ready with a score
    await db.from('submission').where('id', submissionId).update({
      feedback_ready: true,
      status: 'completed',
    })
    await db.from('submission_result').where('id', resultId).update({
      correctness_score: 85,
    })

    const response = await client
      .get(`/api/submissions/${submissionId}/result`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const body = response.body()
    assert.isTrue(body.ready)
    assert.exists(body.submissionId)
  })

  test('returns ready false when still grading', async ({ client, assert }) => {
    const { token, userId } = await loginAsUser(client)
    const { submissionId } = await createSubmission(userId, 'pending')

    const response = await client
      .get(`/api/submissions/${submissionId}/result`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    assert.isFalse(response.body().ready)
  })
})

// ── Webhook Full Payload ──────────────────────────────────────────────

test.group('Submissions — webhook full result payload', () => {
  test('processes completed webhook and updates submission result', async ({ client, assert }) => {
    const { userId } = await loginAsUser(client)
    const { submissionId, resultId } = await createSubmission(userId, 'pending')

    const now = new Date().toISOString()

    const response = await client.post('/api/submissions/webhook').json({
      data: {
        submission_id: submissionId,
        status: 'completed',
        submitted_at: now,
        started_at: now,
        completed_at: now,
        retry_count: 0,
        result: {
          correctness_score: 92,
          tool_score: 88,
          comments: '1 test case failed.',
          comment_format: 0,
          runtime_ms: 1500,
          exit_code: 0,
          test_output: 'TestAdd: PASS\nTestEdge: FAIL',
          has_payload: false,
          payload_url: null,
        },
      },
    })

    response.assertStatus(200)
    response.assertBodyContains({ received: true })

    // Verify submission updated
    const submission = await db.from('submission').where('id', submissionId).first()
    assert.equal(submission?.status, 'completed')
    assert.isTrue(submission?.feedback_ready)

    // Verify result updated
    const result = await db.from('submission_result').where('id', resultId).first()
    assert.equal(result?.correctness_score, 92)
    assert.equal(result?.tool_score, 88)
    assert.equal(result?.exit_code, 0)
  })

  test('processes failed webhook and updates status', async ({ client, assert }) => {
    const { userId } = await loginAsUser(client)
    const { submissionId } = await createSubmission(userId, 'pending')

    const now = new Date().toISOString()

    const response = await client.post('/api/submissions/webhook').json({
      data: {
        submission_id: submissionId,
        status: 'failed',
        submitted_at: now,
        started_at: now,
        completed_at: now,
        retry_count: 3,
      },
    })

    response.assertStatus(200)

    const submission = await db.from('submission').where('id', submissionId).first()
    assert.equal(submission?.status, 'failed')
    assert.equal(submission?.retry_count, 3)
  })

  test('rejects webhook missing submission_id', async ({ client }) => {
    const response = await client.post('/api/submissions/webhook').json({
      data: {
        status: 'completed',
      },
    })
    response.assertStatus(422)
  })

  test('rejects webhook with missing data wrapper', async ({ client }) => {
    const response = await client.post('/api/submissions/webhook').json({
      submission_id: 1,
      status: 'completed',
    })
    response.assertStatus(422)
  })
})

// ── Download URL ──────────────────────────────────────────────────────

test.group('Submissions — download URL', () => {
  test('returns 404 when submission has no file', async ({ client }) => {
    const { token, userId } = await loginAsUser(client)
    const { submissionId } = await createSubmission(userId)

    const response = await client
      .get(`/api/submissions/${submissionId}/download-url`)
      .header('Authorization', `Bearer ${token}`)

    // No file_path on submission — should return 404
    response.assertStatus(404)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/submissions/1/download-url')
    response.assertStatus(401)
  })

  test('returns 404 for non-existent submission', async ({ client }) => {
    const { token } = await loginAsUser(client)

    const response = await client
      .get('/api/submissions/999999/download-url')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })
})

// ── Assignment Offerings Create ───────────────────────────────────────

test.group('Assignments — create offering', () => {
  test('creates an offering for an assignment', async ({ client, assert }) => {
    const { token } = await loginAsUser(client)

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

    // Create assignment
    const assignment = await client
      .post('/api/assignments')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: `Offering Assignment ${Date.now()}`,
        submissionPolicyId: policy.id,
      })

    const assignmentId = assignment.body().id

    // Create course and section for the offering
    const course = await client
      .post('/api/courses')
      .header('Authorization', `Bearer ${token}`)
      .json({
        name: `Offering Course ${Date.now()}`,
        number: 'CS0002',
        organizationId: 1,
        slug: `offering-course-${Date.now()}`,
      })

    const [term] = await db
      .table('term')
      .insert({
        season: 1,
        year: 2026,
        slug: `term-offering-${Date.now()}`,
        starts_on: new Date().toISOString(),
        ends_on: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString(),
      })
      .returning('id')

    const section = await client
      .post(`/api/courses/${course.body().id}/sections`)
      .header('Authorization', `Bearer ${token}`)
      .json({ termId: term.id, label: 'Section A' })

    const sectionId = section.body().id

    const response = await client
      .post(`/api/assignments/${assignmentId}/offerings`)
      .header('Authorization', `Bearer ${token}`)
      .json({
        courseOfferingId: sectionId,
        published: false,
      })

    response.assertStatus(201)
    assert.exists(response.body().id)
  })

  test('returns 401 when not authenticated', async ({ client }) => {
    const response = await client.post('/api/assignments/1/offerings').json({})
    response.assertStatus(401)
  })
})
