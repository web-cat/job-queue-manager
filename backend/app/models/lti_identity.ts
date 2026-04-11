// PURPOSE: Links a user to their identity within an LTI-connected LMS platform.
// Separate from identity.ts because LTI identities are scoped to a specific
// LMS instance rather than a global provider.

// DESIGN: lti_user_id is the user's identifier within the LMS (Canvas user ID,
// Blackboard user ID, etc.). This enables mapping LMS users to system users
// when grade passback occurs.

// DEPENDENCIES: user, lms_instance

// CONSUMERS: LTI launch controller (to be built), grade passback service
// NEXT TEAM NOTES: When processing an LTI launch, look up or create an
// lti_identity record to associate the LMS user with a system user. The
// lis_result_id table stores the grade passback endpoints for each submission.

// STATUS: complete

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import LmsInstance from './lms_instance.js'

export default class LtiIdentity extends BaseModel {
  static table = 'lti_identity'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare ltiUserId: string | null

  @column()
  declare userId: number

  @column()
  declare lmsInstanceId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => LmsInstance)
  declare lmsInstance: BelongsTo<typeof LmsInstance>
}
