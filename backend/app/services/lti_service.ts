import lti from 'ims-lti'
import axios from 'axios'
import LmsInstance from '#models/lms_instance'
import LtiIdentity from '#models/lti_identity'
import LisResultId from '#models/lis_result_id'
import User from '#models/user'
import AssignmentOffering from '#models/assignment_offering'

/**
 * LtiService
 *
 * Handles LTI 1.1 Tool Provider functionality including:
 *   - Launch validation (OAuth signature verification)
 *   - User provisioning (find or create users from LTI launch data)
 *   - Grade passback (send scores back to LMS via LIS Outcomes Service)
 *
 * LTI 1.1 FLOW:
 *   1. Instructor configures tool in Canvas with consumer key + secret
 *   2. Student clicks assignment link in Canvas
 *   3. Canvas POSTs a signed launch request to POST /api/lti/launch
 *   4. Your app validates the OAuth signature using the shared secret
 *   5. Your app finds or creates the user based on LTI user ID
 *   6. Your app redirects the student to the assignment in your frontend
 *   7. When grading completes, your app POSTs score to lis_outcome_service_url
 *
 * CONSUMER KEY/SECRET:
 *   Stored in the lms_instance table (consumer_key, consumer_secret columns).
 *   Must be obtained from VT Canvas admin or your professor.
 *   Add to the lms_instance table via Adminer before testing.
 *
 * GRADE PASSBACK:
 *   Canvas provides lis_outcome_service_url and lis_result_sourcedid in the
 *   launch POST. Store these in lis_result_id table, then POST scores back
 *   to lis_outcome_service_url using OAuth-signed XML when grading completes.
 *
 * REFERENCE: https://www.middleware.vt.edu/sso/cas.html (LTI section)
 * REFERENCE: https://www.imsglobal.org/specs/ltiv1p1
 */
export default class LtiService {
  /**
   * Look up the LMS instance and its consumer secret by consumer key.
   * Canvas includes oauth_consumer_key in every launch request.
   * We use this to find the matching lms_instance record with the secret.
   */
  async findLmsInstance(consumerKey: string): Promise<LmsInstance | null> {
    return LmsInstance.findBy('consumer_key', consumerKey)
  }

  /**
   * Validate an LTI launch request using OAuth HMAC-SHA1 signature.
   * Returns the validated ims-lti Provider object on success, null on failure.
   *
   * The Provider object gives you convenient accessors like:
   *   provider.userId       → LTI user ID from Canvas
   *   provider.username     → user's display name
   *   provider.student      → true if user is a student
   *   provider.ta           → true if user is a TA
   *   provider.instructor   → true if user is an instructor
   *   provider.body         → all raw LTI parameters
   */
  async validateLaunch(
    req: any,
    consumerKey: string,
    consumerSecret: string
  ): Promise<{ valid: boolean; provider: any }> {
    return new Promise((resolve) => {
      const provider = new lti.Provider(consumerKey, consumerSecret)

      provider.valid_request(req, (err: Error | null, isValid: boolean) => {
        if (err || !isValid) {
          console.error('[LtiService] Launch validation failed:', err?.message)
          resolve({ valid: false, provider: null })
        } else {
          resolve({ valid: true, provider })
        }
      })
    })
  }

  /**
   * Find or create a User from LTI launch parameters.
   * Links the user to their LTI identity for future launches.
   *
   * On first launch: creates User + LtiIdentity records
   * On subsequent launches: loads existing user via LtiIdentity
   */
  async findOrCreateUser(provider: any, lmsInstance: LmsInstance): Promise<User> {
    const ltiUserId = provider.userId as string
    const email = (provider.body.lis_person_contact_email_primary as string) ?? ''
    const firstName = (provider.body.lis_person_name_given as string) ?? null
    const lastName = (provider.body.lis_person_name_family as string) ?? null

    // Check if we already have an LTI identity for this user + LMS
    let ltiIdentity = await LtiIdentity.query()
      .where('lti_user_id', ltiUserId)
      .where('lms_instance_id', lmsInstance.id)
      .preload('user')
      .first()

    if (ltiIdentity) {
      // Existing user — update their info from LTI data
      const user = ltiIdentity.user
      await user.merge({ firstName, lastName }).save()
      return user
    }

    // New LTI user — find by email or create account
    const user = await User.firstOrCreate(
      { email },
      {
        email,
        encryptedPassword: '', // LTI users have no local password
        firstName,
        lastName,
        slug: ltiUserId,
        signInCount: 0,
        // TODO: Assign role based on LTI role claim
        // provider.student → globalRoleId: 2 (Student)
        // provider.instructor → globalRoleId: 1 (Admin)
        globalRoleId: provider.student ? 2 : 1,
      }
    )

    // Create LTI identity linking this user to the LMS
    await LtiIdentity.create({
      userId: user.id,
      ltiUserId,
      lmsInstanceId: lmsInstance.id,
    })

    return user
  }

  /**
   * Store the LIS grade passback credentials for a submission.
   * Called during LTI launch when lis_outcome_service_url is present.
   * These credentials are needed later to send grades back to Canvas.
   */
  async storeLisCredentials(
    provider: any,
    lmsInstance: LmsInstance,
    userId: number,
    assignmentOfferingId: number
  ): Promise<void> {
    const lisResultSourcedid = provider.body.lis_result_sourcedid as string | undefined
    const lisOutcomeServiceUrl = provider.body.lis_outcome_service_url as string | undefined

    if (!lisResultSourcedid || !lisOutcomeServiceUrl) {
      // Grade passback not supported for this launch
      return
    }

    // Store or update the LIS credentials
    await LisResultId.updateOrCreate(
      {
        userId,
        assignmentOfferingId,
        lmsInstanceId: lmsInstance.id,
      },
      {
        lisResultSourcedid,
        lisResultSourceDid: lisResultSourcedid,
      }
    )
  }

  /**
   * Send a grade back to Canvas via LIS Outcomes Service.
   * Score must be between 0.0 and 1.0 (percentage as decimal).
   *
   * Called after grading completes — requires the lis_result_sourcedid
   * and lis_outcome_service_url stored during the original launch.
   *
   * TODO: This requires OAuth signing of the XML payload.
   * The ims-lti library's OutcomeService handles this automatically
   * when called from within the valid_request callback (provider.outcome_service).
   * For async passback (after the original request), you need to re-sign manually.
   */
  async sendGrade(
    lisOutcomeServiceUrl: string,
    lisResultSourcedid: string,
    consumerKey: string,
    consumerSecret: string,
    score: number
  ): Promise<boolean> {
    // Score must be 0.0 to 1.0
    const clampedScore = Math.min(1.0, Math.max(0.0, score))

    // Build the LIS Outcomes XML payload
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<imsx_POXEnvelopeRequest xmlns="http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0">
  <imsx_POXHeader>
    <imsx_POXRequestHeaderInfo>
      <imsx_version>V1.0</imsx_version>
      <imsx_messageIdentifier>${Date.now()}</imsx_messageIdentifier>
    </imsx_POXRequestHeaderInfo>
  </imsx_POXHeader>
  <imsx_POXBody>
    <replaceResultRequest>
      <resultRecord>
        <sourcedGUID>
          <sourcedId>${lisResultSourcedid}</sourcedId>
        </sourcedGUID>
        <result>
          <resultScore>
            <language>en</language>
            <textString>${clampedScore}</textString>
          </resultScore>
        </result>
      </resultRecord>
    </replaceResultRequest>
  </imsx_POXBody>
</imsx_POXEnvelopeRequest>`

    try {
      // TODO: This POST needs to be OAuth-signed with consumer key/secret
      // The ims-lti library does not provide a standalone OAuth signer for
      // async grade passback. You will need to use the 'oauth-signature' npm
      // package to sign this request manually, or use provider.outcome_service
      // during the original launch request.
      //
      // For now this sends unsigned — will be rejected by Canvas in production.
      // See: https://github.com/omsmith/ims-lti for OutcomeService usage
      console.warn('[LtiService] Grade passback is not yet OAuth-signed — will fail in production')

      await axios.post(lisOutcomeServiceUrl, xmlBody, {
        headers: { 'Content-Type': 'application/xml' },
        timeout: 10000,
      })

      return true
    } catch (error) {
      console.error('[LtiService] Grade passback failed:', error)
      return false
    }
  }
}
