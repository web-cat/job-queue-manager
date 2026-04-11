// PURPOSE: Defines a grading plugin — an executable that knows how to run and
// evaluate student code for a specific language/framework combination.

// DESIGN: Binary config fields (config_description, default_config_settings) store
// serialized configuration. language_id identifies what runtime the plugin
// targets. This is closely related to the other team's worker pod images —
// each grading_plugin likely corresponds to a specific Docker image.

// DEPENDENCIES: user

// CONSUMERS: step.ts (a step uses a grading_plugin to grade)

// NEXT TEAM NOTES: Coordinate with the other team on the relationship between
// grading_plugin records and their worker pod images. The worker_tag concept
// in enqueued_job (TBD) likely maps to a grading_plugin identifier.

// STATUS: complete [NEEDS INLINE DOCS — binary config fields explanation]

import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Step from './step.js'

export default class GradingPlugin extends BaseModel {
  static table = 'grading_plugin'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare languageId: number | null

  @column()
  declare name: string | null

  @column()
  declare mainFileName: string | null

  @column()
  declare subdirName: string | null

  @column()
  declare uploadedFileName: string | null

  @column()
  declare isConfigFile: boolean

  @column()
  declare isPublished: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Step)
  declare steps: HasMany<typeof Step>
}
