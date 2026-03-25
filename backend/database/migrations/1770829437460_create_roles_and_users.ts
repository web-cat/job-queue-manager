import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // ── Global Roles ─────────────────────────────────────────────
    this.schema.createTable('global_role', (table) => {
      table.increments('id')
      table.string('name', 255).notNullable()
      table.boolean('can_manage_all_courses').notNullable().defaultTo(false)
      table.boolean('can_edit_system_configuration').notNullable().defaultTo(false)
      table.boolean('builtin').notNullable().defaultTo(false)
    })

    // ── Time Zones ───────────────────────────────────────────────
    this.schema.createTable('time_zones', (table) => {
      table.increments('id')
      table.string('name', 255).nullable()
      table.string('zone', 255).nullable()
      table.string('display_as', 255).nullable()
      table.timestamps(true, true)
    })

    // ── Users ────────────────────────────────────────────────────
    this.schema.createTable('user', (table) => {
      table.increments('id')
      table.string('email', 255).notNullable().unique()
      table.string('encrypted_password', 255).notNullable()
      table.string('reset_password_token', 255).nullable()
      table.timestamp('reset_password_sent_at').nullable()
      table.timestamp('remember_created_at').nullable()
      table.integer('sign_in_count').notNullable().defaultTo(0)
      table.timestamp('current_sign_in_at').nullable()
      table.timestamp('last_sign_in_at').nullable()
      table.string('current_sign_in_ip', 255).nullable()
      table.string('last_sign_in_ip', 255).nullable()
      table.string('confirmation_token', 255).nullable()
      table.timestamp('confirmed_at').nullable()
      table.timestamp('confirmation_sent_at').nullable()
      table.string('first_name', 255).nullable()
      table.string('last_name', 255).nullable()
      table.integer('global_role_id').notNullable().references('id').inTable('global_role')
      table.string('avatar', 255).nullable()
      table.string('slug', 255).notNullable()
      table.integer('current_workout_score_id').nullable()
      table.integer('time_zone_id').nullable().references('id').inTable('time_zones')
      table.timestamps(true, true)

      table.index(['global_role_id'], 'index_users_on_global_role_id')
      table.index(['time_zone_id'], 'index_users_on_time_zone_id')
    })

    // ── Auth Access Tokens (AdonisJS token auth) ─────────────────
    this.schema.createTable('auth_access_tokens', (table) => {
      table.bigIncrements('id')
      table.integer('tokenable_id').unsigned().notNullable().references('id').inTable('user').onDelete('CASCADE')
      table.string('type').notNullable()
      table.string('name').nullable()
      table.string('hash').notNullable()
      table.text('abilities').notNullable()
      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('last_used_at').nullable()
      table.timestamp('expires_at').nullable()
    })

    // ── Identities (OAuth providers) ─────────────────────────────
    this.schema.createTable('identity', (table) => {
      table.increments('id')
      table.integer('user_id').notNullable().references('id').inTable('user')
      table.string('provider', 255).notNullable()
      table.string('uid', 255).notNullable()
      table.timestamps(true, true)

      table.index(['uid', 'provider'], 'index_identities_on_uid_and_provider')
      table.index(['user_id'], 'index_identities_on_user_id')
    })

    // ── User Groups ───────────────────────────────────────────────
    this.schema.createTable('user_groups', (table) => {
      table.increments('id')
      table.string('name', 255).nullable()
      table.text('description').nullable()
      table.timestamps(true, true)
    })

    // ── Memberships ───────────────────────────────────────────────
    this.schema.createTable('memberships', (table) => {
      table.increments('id')
      table.integer('user_id').nullable().references('id').inTable('user')
      table.integer('user_group_id').nullable().references('id').inTable('user_groups')
      table.timestamps(true, true)
    })

    // ── Group Access Requests ────────────────────────────────────
    this.schema.createTable('group_access_requests', (table) => {
      table.increments('id')
      table.integer('user_id').nullable().references('id').inTable('user')
      table.integer('user_group_id').nullable().references('id').inTable('user_groups')
      table.boolean('pending').defaultTo(true)
      table.boolean('decision').nullable()
      table.timestamps(true, true)

      table.index(['user_id'], 'index_group_access_requests_on_user_id')
      table.index(['user_group_id'], 'index_group_access_requests_on_user_group_id')
    })

    // ── Signups ───────────────────────────────────────────────────
    this.schema.createTable('signups', (table) => {
      table.increments('id')
      table.string('first_name', 255).nullable()
      table.string('last_name_name', 255).nullable()
      table.string('email', 255).nullable()
      table.string('institution', 255).nullable()
      table.text('comments').nullable()
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTableIfExists('group_access_requests')
    this.schema.dropTableIfExists('memberships')
    this.schema.dropTableIfExists('user_groups')
    this.schema.dropTableIfExists('identity')
    this.schema.dropTableIfExists('auth_access_tokens')
    this.schema.dropTableIfExists('user')
    this.schema.dropTableIfExists('time_zones')
    this.schema.dropTableIfExists('global_role')
    this.schema.dropTableIfExists('signups')
  }
}
