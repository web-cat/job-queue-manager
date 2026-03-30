import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // ── Enqueued Jobs ─────────────────────────────────────────────
    // This is the shared table between your team and the K8s team.
    // Fields marked TODO need confirmation from the other team before finalizing.
    this.schema.createTable('enqueued_job', (table) => {
      table.integer('id').primary()
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

  async down() {
    this.schema.dropTableIfExists('enqueued_job')
  }
}
