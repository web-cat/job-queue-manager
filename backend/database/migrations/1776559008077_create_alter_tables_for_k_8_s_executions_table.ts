import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Assignment table
    this.schema.alterTable('assignment', (table) => {
      table.integer('estimated_runtime_seconds').notNullable().defaultTo(120)
      table.string('docker_image_tag').nullable()
    })

    // Submission table
    this.schema.alterTable('submission', (table) => {
      table.string('status').notNullable().defaultTo('pending')
      table.integer('external_job_id').nullable() // Maps to their job_id from job queue
      table.integer('retry_count').notNullable().defaultTo(0)
    })

    // Submission Result table
    this.schema.alterTable('submission_result', (table) => {
      table.text('test_output').nullable()
      table.timestamp('queued_at').nullable()
      table.timestamp('started_at').nullable()
      table.timestamp('completed_at').nullable()
      table.integer('runtime_ms').nullable()
      table.integer('exit_code').nullable()
    })
  }

  async down() {
    this.schema.alterTable('assignment', (table) => {
      table.dropColumn('estimated_runtime_seconds')
      table.dropColumn('docker_image_tag')
    })

    this.schema.alterTable('submission', (table) => {
      table.dropColumn('status')
      table.dropColumn('external_job_id')
      table.dropColumn('retry_count')
    })

    this.schema.alterTable('submission_result', (table) => {
      table.dropColumn('test_output')
      table.dropColumn('queued_at')
      table.dropColumn('started_at')
      table.dropColumn('completed_at')
      table.dropColumn('runtime_ms')
      table.dropColumn('exit_code')
    })
  }
}
