// PURPOSE: Represents an OAuth 2.0 client credential pair belonging to a user.
// Used for machine-to-machine API access without CAS/LTI login.
// DESIGN: client_secret is stored hashed — raw value shown only at creation.
// Each client belongs to a user and tokens issued for it act as that user.

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class OAuthClient extends BaseModel {
  static table = 'oauth_client'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare clientId: string

  @column({ serializeAs: null }) // never expose the encrypted secret in API responses
  declare clientSecretEncrypted: string // was clientSecretHash

  @column()
  declare name: string

  @column()
  declare active: boolean

  @column.dateTime()
  declare lastUsedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
