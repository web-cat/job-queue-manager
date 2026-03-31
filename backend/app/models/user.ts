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
  passwordColumnName: 'encrypted_password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static table = 'user'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare encryptedPassword: string

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
