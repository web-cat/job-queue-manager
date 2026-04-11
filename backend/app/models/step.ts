// PURPOSE: A grading step within an assignment — links an assignment to a
// grading_plugin with specific configuration. Supports multi-step grading
// pipelines (compile → test → style check, etc.).

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Assignment from './assignment.js'
import GradingPlugin from './grading_plugin.js'
import StepConfig from './step_config.js'

export default class Step extends BaseModel {
  static table = 'step'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare assignmentId: number | null

  @column()
  declare gradingPluginId: number

  @column()
  declare stepConfigId: number | null

  @column()
  declare order: number | null

  @column()
  declare timeout: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Assignment)
  declare assignment: BelongsTo<typeof Assignment>

  @belongsTo(() => GradingPlugin)
  declare gradingPlugin: BelongsTo<typeof GradingPlugin>

  @belongsTo(() => StepConfig)
  declare stepConfig: BelongsTo<typeof StepConfig>
}
