import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import LicensePolicy from './license_policy.js'

export default class License extends BaseModel {
  static table = 'licenses'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string | null

  @column()
  declare description: string | null

  @column()
  declare url: string | null

  @column()
  declare licensePolicyId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => LicensePolicy)
  declare licensePolicy: BelongsTo<typeof LicensePolicy>
}
