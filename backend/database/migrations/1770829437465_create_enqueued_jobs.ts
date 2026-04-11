// PURPOSE: Creates the shared handoff table between your system and the other
// team's Kubernetes backend. Your team writes job records into this table;
// the other team reads and manages them.

// DESIGN: Currently contains only the fields confirmed from the legacy schema.
// Several fields are commented out as TODOs pending confirmation from the
// other team: worker_tag (runtime identifier e.g. 'python3', 'java11'),
// status (pending/running/completed/failed), result (jsonb for grading output),
// and file_path (location of submitted zip file).

// DEPENDENCIES: 1770829437464 (submission)

// CONSUMERS: Other team's Kubernetes backend (reads jobs), job_queue_service.ts

// NEXT TEAM NOTES: THIS IS THE MOST IMPORTANT FILE TO COORDINATE WITH THE OTHER
// TEAM. Before adding any new columns here, get agreement from both teams.
// The TODO comments in this file mark exactly what needs to be resolved.
// Once the other team confirms their requirements, create a NEW migration
// (do not edit this one) to add the missing columns.

// STATUS: stub [NEEDS INLINE DOCS — TODO items must be resolved with other team]

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // ── Enqueued Jobs ─────────────────────────────────────────────
    // This is the shared table between your team and the K8s team.
    // Fields marked TODO need confirmation from the other team before finalizing.
    this.schema.createTable('enqueued_job', (table) => {
      table.increments('id')
      table.integer('submission_id').notNullable().references('id').inTable('submission')
      table.string('pod_name', 255).nullable()
      table.smallint('priority').nullable() // 1 for testing new assignment, 2 for normal submission, 3 for regrade submissions
      table.timestamp('started_at').nullable()
      table.timestamp('queue_time').nullable()
      table.timestamp('completed_at').nullable()
      table.string('container_image', 255).nullable() // base image for pod
      table.jsonb('env_vars').nullable() // environment variables containing testing specs (max memory, timeout limit, student zip, testing zip, etc.)
      table.string('status', 50).notNullable().defaultTo('pending') // pending, completed, running, failed
      table.integer('retry_count').defaultTo(0)
      table.jsonb('result').nullable()
    })
  }

  async down() {
    this.schema.dropTableIfExists('enqueued_job')
  }
}
