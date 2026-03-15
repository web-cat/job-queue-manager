import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('email').notNullable().unique()
      table.string('password').nullable() // nullable for OAuth/CAS users
      table.string('full_name').nullable()
      table.enu('role', ['admin', 'viewer']).notNullable().defaultTo('viewer')

      // Auth provider tracking
      table.enu('provider', ['local', 'google', 'github', 'cas']).notNullable().defaultTo('local')
      table.string('provider_id').nullable() // OAuth/CAS user identifier
      table.string('cas_pid').nullable() // VT specific — stores PID (e.g. thomask88)

      table.timestamps(true, true)

      // Indexes
      table.index(['email'], 'idx_users_email')
      table.index(['provider', 'provider_id'], 'idx_users_provider')
      table.index(['cas_pid'], 'idx_users_cas_pid')
    })

    // API tokens table — used by workers and admin users
    this.schema.createTable('auth_access_tokens', (table) => {
      table.bigIncrements('id')
      table
        .integer('tokenable_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('type').notNullable()
      table.string('name').nullable()
      table.string('hash').notNullable()
      table.text('abilities').notNullable()
      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.timestamp('last_used_at', { useTz: true }).nullable()
      table.timestamp('expires_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTableIfExists('auth_access_tokens')
    this.schema.dropTableIfExists(this.tableName)
  }
}
