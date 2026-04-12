import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import User from '#models/user'
import LtiService from '#services/lti_service'
import LisResultId from '#models/lis_result_id'

/**
 * LtiController
 *
 * Handles LTI 1.1 Tool Provider HTTP routes.
 *
 * Routes (all public — Canvas POSTs directly, no existing token):
 *   POST /api/lti/launch        → validate launch, provision user, redirect to frontend
 *   POST /api/lti/grade/:userId → send grade back to Canvas (called internally after grading)
 *
 * CONFIGURATION IN CANVAS:
 *   When setting up your tool in Canvas, use these settings:
 *   - Consumer Key: <value from lms_instance.consumer_key>
 *   - Consumer Secret: <value from lms_instance.consumer_secret>
 *   - Launch URL: https://webcatmaxxers.discovery.cs.vt.edu/api/lti/launch
 *   - Domain: webcatmaxxers.discovery.cs.vt.edu
 *   - Privacy: Public (so Canvas sends name and email)
 *
 * IMPORTANT: The launch endpoint must be public (no auth token required)
 * because Canvas POSTs to it directly without an existing session.
 * Security is provided by the OAuth signature validation instead.
 */
export default class LtiController {
  private ltiService = new LtiService()

  /**
   * POST /api/lti/launch
   *
   * Receives the LTI launch POST from Canvas when a student clicks an
   * assignment link. Validates the OAuth signature, provisions the user,
   * stores grade passback credentials, and redirects to the frontend.
   *
   * Canvas sends these key parameters in the POST body:
   *   oauth_consumer_key          → identifies which LMS instance
   *   lis_person_contact_email_primary → student's email
   *   lis_person_name_given       → student's first name
   *   lis_person_name_family      → student's last name
   *   lis_result_sourcedid        → grade passback token
   *   lis_outcome_service_url     → where to POST grades
   *   context_id                  → Canvas course ID
   *   resource_link_id            → Canvas assignment ID
   *   roles                       → Learner, Instructor, TeachingAssistant
   */
  async launch({ request, response }: HttpContext) {
    const frontendUrl = env.get('FRONTEND_URL', 'https://webcatmaxxers.discovery.cs.vt.edu')
    const body = request.body()
    const consumerKey = body.oauth_consumer_key as string | undefined

    if (!consumerKey) {
      return response.badRequest({ message: 'Missing oauth_consumer_key' })
    }

    // Find the LMS instance by consumer key
    const lmsInstance = await this.ltiService.findLmsInstance(consumerKey)

    if (!lmsInstance || !lmsInstance.consumerSecret) {
      console.error(`[LtiController] Unknown consumer key: ${consumerKey}`)
      return response.unauthorized({ message: 'Unknown LTI consumer' })
    }

    // Validate the OAuth signature
    const { valid, provider } = await this.ltiService.validateLaunch(
      request.request, // raw Node.js IncomingMessage
      lmsInstance.consumerKey!,
      lmsInstance.consumerSecret
    )

    if (!valid) {
      return response.unauthorized({ message: 'Invalid LTI launch signature' })
    }

    try {
      // Find or create the user from LTI launch data
      const user = await this.ltiService.findOrCreateUser(provider, lmsInstance)

      // Store grade passback credentials if Canvas provided them
      // resource_link_id maps to an assignment_offering in your system
      // TODO: Map Canvas resource_link_id to your assignment_offering_id
      // For now storing with a placeholder assignmentOfferingId
      // This needs to be resolved once assignment setup in Canvas is configured
      if (provider.body.lis_outcome_service_url && provider.body.lis_result_sourcedid) {
        // TODO: Look up the correct assignmentOfferingId from resource_link_id
        // const assignmentOfferingId = await resolveAssignmentOffering(provider.body.resource_link_id)
        console.warn(
          '[LtiController] Grade passback credentials received but assignment mapping not yet implemented'
        )
      }

      // Issue an API token for the user
      const token = await User.accessTokens.create(user, ['*'], {
        name: `lti-session-${user.id}`,
        expiresIn: '24 hours',
      })

      const tokenValue = token.value!.release()

      // Redirect to frontend with token
      // Include context info so frontend knows what assignment to show
      const params = new URLSearchParams({
        token: tokenValue,
        context: provider.body.context_id ?? '',
        resourceLinkId: provider.body.resource_link_id ?? '',
        role: provider.student ? 'student' : provider.instructor ? 'instructor' : 'ta',
      })

      return response.redirect(`${frontendUrl}/lti/launch?${params.toString()}`)
    } catch (error) {
      console.error('[LtiController] Error during LTI launch:', error)
      return response.redirect(`${frontendUrl}/login?error=lti_error`)
    }
  }

  /**
   * POST /api/lti/grade
   *
   * Sends a grade back to Canvas for a specific user and assignment.
   * Called internally after grading completes — not called by Canvas.
   *
   * Body:
   *   userId              → system user ID
   *   assignmentOfferingId → the offering to grade
   *   score               → 0.0 to 1.0 (e.g. 0.85 = 85%)
   *
   * This endpoint is protected by API token auth (see routes.ts).
   */
  async grade({ request, response }: HttpContext) {
    const { userId, assignmentOfferingId, score } = request.body()

    if (score < 0 || score > 1) {
      return response.badRequest({ message: 'Score must be between 0.0 and 1.0' })
    }

    // Look up the stored LIS credentials for this user + assignment
    const lisRecord = await LisResultId.query()
      .where('user_id', userId)
      .where('assignment_offering_id', assignmentOfferingId)
      .preload('lmsInstance')
      .first()

    if (!lisRecord) {
      return response.notFound({
        message: 'No grade passback credentials found for this user and assignment',
      })
    }

    const lmsInstance = lisRecord.lmsInstance

    if (!lmsInstance.consumerKey || !lmsInstance.consumerSecret) {
      return response.internalServerError({ message: 'LMS instance missing credentials' })
    }

    // Send grade to Canvas
    const success = await this.ltiService.sendGrade(
      // TODO: Store lis_outcome_service_url on lis_result_id or submission
      // For now this is a placeholder
      `https://canvas.vt.edu/api/lti/v1/tools/${lmsInstance.id}/grade_passback`,
      lisRecord.lisResultSourcedid,
      lmsInstance.consumerKey,
      lmsInstance.consumerSecret,
      score
    )

    if (!success) {
      return response.internalServerError({ message: 'Grade passback failed' })
    }

    return response.ok({ message: 'Grade submitted successfully', score })
  }
}
