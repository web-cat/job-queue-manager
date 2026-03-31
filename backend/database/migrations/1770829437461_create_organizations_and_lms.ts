import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // ── Organizations ────────────────────────────────────────────
    this.schema.createTable('organization', (table) => {
      table.increments('id')
      table.string('name', 255).notNullable()
      table.string('abbreviation', 255).nullable()
      table.string('slug', 255).notNullable()
      table.boolean('is_hidden').defaultTo(false)
      table.integer('lms_instance_id').nullable()
      table.timestamps(true, true)
    })

    // ── LMS Types ────────────────────────────────────────────────
    this.schema.createTable('lms_type', (table) => {
      table.increments('id')
      table.string('name', 255).notNullable()
      table.timestamps(true, true)
    })

    // ── LMS Instances ────────────────────────────────────────────
    this.schema.createTable('lms_instance', (table) => {
      table.increments('id')
      table.string('consumer_key', 255).nullable()
      table.string('consumer_secret', 255).nullable()
      table.string('url', 255).nullable()
      table.integer('lms_type_id').notNullable().references('id').inTable('lms_type')
      table.integer('organization_id').nullable().references('id').inTable('organization')
      table.timestamps(true, true)

      table.index(['lms_type_id'], 'lms_instances_lms_type_id_fk')
      table.index(['organization_id'], 'index_lms_instances_on_organization_id')
    })

    // ── LTI Workouts ─────────────────────────────────────────────
    this.schema.createTable('lti_workouts', (table) => {
      table.increments('id')
      table.integer('workout_id').nullable()
      table.string('lms_assignment_id', 255).notNullable()
      table.integer('lms_instance_id').nullable().references('id').inTable('lms_instance')
      table.timestamps(true, true)

      table.index(['lms_instance_id'], 'index_lti_workouts_on_lms_instance_id')
      table.index(['workout_id'], 'index_lti_workouts_on_workout_id')
    })

    // ── LTI Identities ───────────────────────────────────────────
    this.schema.createTable('lti_identity', (table) => {
      table.increments('id')
      table.string('lti_user_id', 255).nullable()
      table.integer('user_id').notNullable().references('id').inTable('user')
      table.integer('lms_instance_id').notNullable().references('id').inTable('lms_instance')
      table.timestamps(true, true)

      table.index(['lms_instance_id'], 'index_lti_identities_on_lms_instance_id')
      table.index(['lti_user_id'], 'index_lti_identities_on_lti_user_id')
      table.index(['user_id'], 'index_lti_identities_on_user_id')
    })

    // ── Circular FK: organization ↔ lms_instance ─────────────────
    // The legacy schema has a circular reference between these two tables.
    // Added after both tables exist to avoid dependency issues.
    this.schema.raw(`
      ALTER TABLE organization
        ADD CONSTRAINT fk_organization_lms_instance
        FOREIGN KEY (lms_instance_id) REFERENCES lms_instance (id)
    `)
  }

  async down() {
    this.schema.raw(`
      ALTER TABLE IF EXISTS organization
        DROP CONSTRAINT IF EXISTS fk_organization_lms_instance
    `)
    this.schema.dropTableIfExists('lti_identity')
    this.schema.dropTableIfExists('lti_workouts')
    this.schema.dropTableIfExists('lms_instance')
    this.schema.dropTableIfExists('lms_type')
    this.schema.dropTableIfExists('organization')
  }
}
