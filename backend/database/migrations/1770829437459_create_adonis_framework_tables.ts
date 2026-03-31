import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // ── Adonis Schema (migration tracking) ────────────────────────
    this.schema.createTable('adonis_schema', (table) => {
      table.increments('id')
      table.timestamp('migration_time').defaultTo(this.now())
    })

    // ── Adonis Schema Versions ───────────────────────────────────
    this.schema.createTable('adonis_schema_versions', (table) => {
      table.integer('version').primary()
    })
  }

  async down() {
    this.schema.dropTableIfExists('adonis_schema_versions')
    this.schema.dropTableIfExists('adonis_schema')
  }
}
