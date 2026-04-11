// PURPOSE: Stores the LTI grade passback endpoint for a specific user/assignment
// combination. Used to send grades back to the LMS after submission is graded.
// NEXT TEAM NOTES: Grade passback requires calling the lis_outcome_service_url
// with the lis_result_sourcedid token. This is the LTI 1.1 grade passback flow.
// LTI 1.3 uses a different mechanism (Assignment and Grade Services).

import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import LmsInstance from './lms_instance.js'
import AssignmentOffering from './assignment_offering.js'

export default class LisResultId extends BaseModel {
  static table = 'lis_result_id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare lisResultSourcedid: string

  @column()
  declare lisResultSourceDid: string

  @column()
  declare lmsInstanceId: number

  @column()
  declare assignmentOfferingId: number

  @column()
  declare userId: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => LmsInstance)
  declare lmsInstance: BelongsTo<typeof LmsInstance>

  @belongsTo(() => AssignmentOffering)
  declare assignmentOffering: BelongsTo<typeof AssignmentOffering>
}
