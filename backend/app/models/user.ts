import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

export type UserRole = 'admin' | 'viewer'
export type AuthProvider = 'local' | 'google' | 'github' | 'cas'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static table = 'users'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string | null

  @column()
  declare fullName: string | null

  @column()
  declare role: UserRole

  @column()
  declare provider: AuthProvider

  @column()
  declare providerId: string | null

  // VT specific — stores the user's PID (e.g. thomask88)
  @column()
  declare casPid: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // ── Auth ─────────────────────────────────────────────────────────

  static accessTokens = DbAccessTokensProvider.forModel(User)

  // ── Helpers ──────────────────────────────────────────────────────

  get isAdmin(): boolean {
    return this.role === 'admin'
  }

  get isOAuthUser(): boolean {
    return this.provider !== 'local'
  }
}
