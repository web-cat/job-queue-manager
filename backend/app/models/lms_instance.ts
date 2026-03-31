import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import LmsType from './lms_type.js'
import Organization from './organization.js'
import LtiIdentity from './lti_identity.js'

export default class LmsInstance extends BaseModel {
  static table = 'lms_instance'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare consumerKey: string | null

  @column({ serializeAs: null })
  declare consumerSecret: string | null

  @column()
  declare url: string | null

  @column()
  declare lmsTypeId: number

  @column()
  declare organizationId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => LmsType)
  declare lmsType: BelongsTo<typeof LmsType>

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @hasMany(() => LtiIdentity)
  declare ltiIdentities: HasMany<typeof LtiIdentity>
}
