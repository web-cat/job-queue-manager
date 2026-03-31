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
