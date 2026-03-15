import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // ── Workers ───────────────────────────────────────────────────
    this.schema.createTable('workers', (table) => {
      table.increments('id')
      table.string('pod_name').notNullable().unique()
      table.enu('status', ['idle', 'busy', 'offline']).notNullable().defaultTo('idle')
      table.timestamp('last_heartbeat', { useTz: true }).nullable()
      table.timestamps(true, true)
    })

    // ── Jobs ──────────────────────────────────────────────────────
    this.schema.createTable('jobs', (table) => {
      table.increments('id')
      table
        .enu('status', ['pending', 'running', 'completed', 'failed', 'discarded', 'suspended'])
        .notNullable()
        .defaultTo('pending')
      table.smallint('priority').notNullable().defaultTo(0)
      table.boolean('suspended').notNullable().defaultTo(false)
      table.jsonb('metadata').nullable()
      table
        .integer('worker_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('workers')
        .onDelete('SET NULL')
      table.timestamp('queue_time', { useTz: true }).nullable()
      table.timestamp('start_time', { useTz: true }).nullable()
      table.timestamp('end_time', { useTz: true }).nullable()
      table.timestamps(true, true)

      // Indexes for common query patterns
      table.index(['status', 'priority'], 'idx_jobs_status_priority')
      table.index(['worker_id'], 'idx_jobs_worker_id')
    })

    // ── Job Logs ──────────────────────────────────────────────────
    this.schema.createTable('job_logs', (table) => {
      table.increments('id')
      table
        .integer('job_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('jobs')
        .onDelete('CASCADE')
      table
        .enu('event', [
          'queued',
          'claimed',
          'completed',
          'failed',
          'retried',
          'suspended',
          'discarded',
        ])
        .notNullable()
      table.text('message').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['job_id'], 'idx_job_logs_job_id')
    })
  }

  async down() {
    this.schema.dropTableIfExists('job_logs')
    this.schema.dropTableIfExists('jobs')
    this.schema.dropTableIfExists('workers')
  }
}
