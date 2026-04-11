// PURPOSE: Represents a specific deployment of an LMS (e.g. VT's Canvas instance
// at canvas.vt.edu). Consumer_key and consumer_secret are the LTI 1.1
// credentials for that LMS instance.

// DESIGN: consumer_secret is marked serializeAs: null to prevent credential
// leakage in API responses. Each university or department may have their own
// LMS instance with different credentials.

// DEPENDENCIES: lms_type, organization

// CONSUMERS: section, lti_identity, lis_result_id, lti_workouts

// NEXT TEAM NOTES: A seed record for VT's Canvas instance will need to be created.
// Contact VT Middleware to obtain the consumer_key and consumer_secret for
// LTI 1.1 integration with Canvas.

// STATUS: complete [NEEDS INLINE DOCS — consumer_secret serialization]

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
