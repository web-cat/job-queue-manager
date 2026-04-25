import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Add the artifact path to submission_result
    this.schema.alterTable('submission_result', (table) => {
      table.string('artifact_file_path').nullable()
    })

    // Drop the redundant score column from submission
    this.schema.alterTable('submission', (table) => {
      table.dropColumn('score')
    })

    // Drop the legacy enqueued_job table entirely
    this.schema.dropTable('enqueued_job')

    // Add user id and secret for APIs
    this.schema.alterTable('user', (table) => {
      // The Public Identifier (e.g., a UUID)
      table.uuid('api_client_id').nullable().unique()

      // The Private Secret (stored as a cryptographic hash)
      table.string('api_client_secret_hash').nullable()
    })
  }

  async down() {
    this.schema.alterTable('submission_result', (table) => {
      table.dropColumn('artifact_file_path')
    })

    this.schema.alterTable('user', (table) => {
      table.dropColumn('api_client_id')
      table.dropColumn('api_client_secret_hash')
    })

    this.schema.alterTable('submission', (table) => {
      // Recreate the column if we rollback
      table.double('score').nullable()
    })

    // Recreate the legacy table if we rollback
    this.schema.createTable('enqueued_job', (table) => {
      table.increments('id')
      table.integer('submission_id').notNullable().references('id').inTable('submission')
      table.string('pod_name', 255).nullable()
      table.smallint('priority').nullable()
      table.timestamp('started_at').nullable()
      table.timestamp('queue_time').nullable()
      table.timestamp('completed_at').nullable()
      table.string('container_image', 255).nullable()
      table.jsonb('env_vars').nullable()
      table.string('status', 50).notNullable().defaultTo('pending')
      table.integer('retry_count').defaultTo(0)
      table.jsonb('result').nullable()
    })
  }
}
