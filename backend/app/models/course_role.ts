// PURPOSE: Defines permissions within a course (student, instructor, TA).
// Uses boolean flags for fine-grained control. The builtin flag marks
// system-defined roles that should not be deleted.

import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class CourseRole extends BaseModel {
  static table = 'course_role'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare canManageCourse: boolean

  @column()
  declare canManageAssignments: boolean

  @column()
  declare canGradeSubmissions: boolean

  @column()
  declare canViewOtherSubmissions: boolean

  @column()
  declare builtin: boolean
}
