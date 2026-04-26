// PURPOSE: Stores OAuth 2.0 client credentials for machine-to-machine API access.
// Users generate client_id/client_secret pairs from the frontend and use them
// to authenticate external tools against the API without going through CAS/LTI.
//
// DESIGN: client_secret is stored as a scrypt hash — never in plaintext.
// The raw secret is shown only once at creation time. client_id is a UUID
// for uniqueness. Each client belongs to a user and inherits their permissions.
// Revoking a client_id prevents future token exchanges but does not invalidate
// already-issued access tokens (those expire naturally via auth_access_tokens).
//
// USAGE:
//   External tool → POST /api/oauth/token { client_id, client_secret }
//   Backend → issues short-lived Bearer token via auth_access_tokens
//   External tool → GET /api/submissions { Authorization: Bearer <token> }

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('oauth_client', (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('user')
        .onDelete('CASCADE')
      table.uuid('client_id').notNullable().unique()
      table.string('client_secret_encrypted', 255).notNullable() // scrypt hash of secret
      table.string('name', 255).notNullable() // human-readable label
      table.boolean('active').notNullable().defaultTo(true)
      table.timestamp('last_used_at').nullable()
      table.timestamps(true, true)

      table.index(['client_id'], 'oauth_client_client_id_idx')
      table.index(['user_id'], 'oauth_client_user_id_idx')
    })
  }

  async down() {
    this.schema.dropTableIfExists('oauth_client')
  }
}
