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
