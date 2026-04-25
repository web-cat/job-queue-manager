// PURPOSE: The central model for all authenticated users — students, instructors,
// TAs, and administrators. Used by AdonisJS auth for token-based authentication.

// DESIGN: Extends both BaseModel and the AuthFinder mixin which provides
// verifyCredentials() for login. The passwordColumnName is encrypted_password
// (not password) to match the legacy Rails Devise convention. The password
// column is marked serializeAs: null so it never appears in API responses.
// accessTokens uses DbAccessTokensProvider which requires the auth_access_tokens
// table created in migration 1770829437460. Role/permission checking is done
// via the globalRole relationship rather than a simple role string field.

// DEPENDENCIES: global_role, time_zones tables, auth_access_tokens table

// CONSUMERS: All controllers that use auth.getUserOrFail(), identity.ts,
// lti_identity.ts, submission.ts, course_enrollment.ts

// NEXT TEAM NOTES: When checking if a user is an admin, load the globalRole
// relationship first: await user.load('globalRole'). CAS authentication will
// set the cas_pid field (stored in identity table via provider='cas'). OAuth
// logins create identity records linked to this user.

// STATUS: complete [NEEDS INLINE DOCS — auth mixin and accessTokens explanation]

import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import GlobalRole from './global_role.js'
import TimeZone from './time_zone.js'
import Submission from './submission.js'
import Identity from './identity.js'
import LtiIdentity from './lti_identity.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  // Must use camelCase property name, not the DB snake_case column name.
  // Lucid stores attributes internally by camelCase key — $getAttribute('encrypted_password')
  // returns undefined but $getAttribute('encryptedPassword') works correctly.
  passwordColumnName: 'encryptedPassword',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static table = 'user'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare encryptedPassword: string

  @column({ columnName: 'api_client_id' })
  declare apiClientId: string | null

  @column({ columnName: 'api_client_secret_hash', serializeAs: null })
  declare apiClientSecretHash: string | null

  @column()
  declare firstName: string | null

  @column()
  declare lastName: string | null

  @column()
  declare globalRoleId: number

  @column()
  declare timeZoneId: number | null

  @column()
  declare currentWorkoutScoreId: number | null

  @column()
  declare slug: string

  @column()
  declare avatar: string | null

  @column()
  declare signInCount: number

  @column()
  declare resetPasswordToken: string | null

  @column.dateTime()
  declare resetPasswordSentAt: DateTime | null

  @column.dateTime()
  declare rememberCreatedAt: DateTime | null

  @column.dateTime()
  declare currentSignInAt: DateTime | null

  @column.dateTime()
  declare lastSignInAt: DateTime | null

  @column()
  declare currentSignInIp: string | null

  @column()
  declare lastSignInIp: string | null

  @column()
  declare confirmationToken: string | null

  @column.dateTime()
  declare confirmedAt: DateTime | null

  @column.dateTime()
  declare confirmationSentAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @belongsTo(() => GlobalRole)
  declare globalRole: BelongsTo<typeof GlobalRole>

  @belongsTo(() => TimeZone)
  declare timeZone: BelongsTo<typeof TimeZone>

  @hasMany(() => Submission)
  declare submissions: HasMany<typeof Submission>

  @hasMany(() => Identity)
  declare identities: HasMany<typeof Identity>

  @hasMany(() => LtiIdentity)
  declare ltiIdentities: HasMany<typeof LtiIdentity>
}
