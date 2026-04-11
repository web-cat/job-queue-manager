// PURPOSE: Links a user to an external authentication provider (Google, GitHub,
// CAS). A single user can have multiple identities from different providers.

// DESIGN: The provider field identifies the auth system (google, github, cas,
// local). The uid is the user's identifier within that system (OAuth sub,
// CAS PID, etc.). This enables the same user to log in via multiple providers
// and always get the same account.

// DEPENDENCIES: user

// CONSUMERS: auth_controller.ts (CAS/OAuth login flow)

// NEXT TEAM NOTES: When implementing CAS login, create an identity record with
// provider='cas' and uid=<VT PID>. The CAS PID (e.g. thomask88) should be
// stored as the uid. Look up users by identity when processing CAS callbacks.

// STATUS: complete

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class Identity extends BaseModel {
  static table = 'identity'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare provider: string

  @column()
  declare uid: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
