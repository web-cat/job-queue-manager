import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // ── Enqueued Jobs ─────────────────────────────────────────────
    // This is the shared table between your team and the K8s team.
    // Fields marked TODO need confirmation from the other team before finalizing.
    this.schema.createTable('enqueued_job', (table) => {
      table.integer('id').primary()
      table.integer('submission_id').notNullable().references('id').inTable('submission')
      table.integer('worker_id').nullable()
      table.smallint('priority').nullable()
      table.boolean('discarded').notNullable()
      table.boolean('suspended').notNullable()
      table.timestamp('queue_time').nullable()

      // TODO: Confirm with other team — what worker tag format do they expect?
      // e.g. 'python3', 'java11', 'c-gcc' etc.
      // table.string('worker_tag', 255).nullable()

      // TODO: Confirm with other team — do they need a status field?
      // e.g. 'pending', 'running', 'completed', 'failed'
      // table.string('status', 50).notNullable().defaultTo('pending')

      // TODO: Confirm with other team — do they write results back here
      // or directly to submission_result?
      // table.jsonb('result').nullable()

      // TODO: File storage — where does the submitted zip path live?
      // Option A: on submission table
      // Option B: on enqueued_job as a reference
      // table.string('file_path', 255).nullable()
    })
  }

  async down() {
    this.schema.dropTableIfExists('enqueued_job')
  }
}
