// PURPOSE: Stores system errors for debugging and auditing. Records exception
// details including stack trace, request parameters, and user agent.

// DESIGN: Named AppError (not Error) to avoid conflict with JavaScript's built-in
// Error class. The usable_type/usable_id pattern is a Rails polymorphic
// association linking errors to the object that caused them.

// DEPENDENCIES: None

// CONSUMERS: Exception handler, debugging tools

// NEXT TEAM NOTES: The usable_type/usable_id columns follow Rails STI naming.
// When logging errors from TypeScript, set usable_type to the model class name
// and usable_id to the relevant record ID.

// STATUS: complete

import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AppError extends BaseModel {
  static table = 'error'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare usableType: string | null

  @column()
  declare usableId: number | null

  @column()
  declare className: string | null

  @column()
  declare message: string | null

  @column()
  declare trace: string | null

  @column()
  declare targetUrl: string | null

  @column()
  declare refererUrl: string | null

  @column()
  declare params: string | null

  @column()
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
