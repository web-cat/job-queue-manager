// PURPOSE: Creates the course management structure. A course is an abstract
// definition (CS 3214), a section is a specific offering of that course in
// a given term (CS 3214 Fall 2024, Section 1).

// DESIGN: The section table is named section but serves as the course_offering
// concept — one course can have many sections across many terms. course_enrollment
// links users to sections with a specific role (student, instructor, TA) via
// course_role. friendly_id_slugs supports human-readable URL slugs for courses.

// DEPENDENCIES: 1770829437461 (organization, lms_instance)

// CONSUMERS: 1770829437464 (assignment_offering references section)

// NEXT TEAM NOTES: When querying a student's courses, join through
// course_enrollment using user_id and course_offering_id (which is section.id).
// The naming is confusing — course_offering_id in many tables means section.id.

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // ── Terms ────────────────────────────────────────────────────
    this.schema.createTable('term', (table) => {
      table.increments('id')
      table.integer('season').notNullable()
      table.integer('year').notNullable()
      table.string('slug', 255).notNullable()
      table.date('starts_on').notNullable()
      table.date('ends_on').notNullable()
      table.timestamps(true, true)

      table.index(['year', 'season'], 'index_terms_on_year_and_season')
    })

    // ── Courses ───────────────────────────────────────────────────
    this.schema.createTable('course', (table) => {
      table.increments('id')
      table.string('name', 255).notNullable()
      table.string('number', 255).notNullable()
      table.integer('organization_id').notNullable().references('id').inTable('organization')
      table.integer('creator_id').nullable().references('id').inTable('user')
      table.string('slug', 255).notNullable()
      table.integer('user_group_id').nullable().references('id').inTable('user_groups')
      table.boolean('is_hidden').defaultTo(false)
      table.timestamps(true, true)

      table.index(['organization_id'], 'index_courses_on_organization_id')
      table.index(['slug'], 'index_courses_on_slug')
      table.index(['user_group_id'], 'index_courses_on_user_group_id')
    })

    // ── Sections (course offerings) ───────────────────────────────
    this.schema.createTable('section', (table) => {
      table.increments('id')
      table.integer('course_id').notNullable().references('id').inTable('course')
      table.integer('term_id').notNullable().references('id').inTable('term')
      table.string('label', 255).notNullable()
      table.string('url', 255).nullable()
      table.boolean('self_enrollment_allowed').nullable()
      table.date('cutoff_date').nullable()
      table.integer('lms_instance_id').nullable().references('id').inTable('lms_instance')
      table.timestamps(true, true)

      table.index(['course_id'], 'index_course_offerings_on_course_id')
      table.index(['term_id'], 'index_course_offerings_on_term_id')
      table.index(['lms_instance_id'], 'index_course_offerings_on_lms_instance_id')
    })

    // ── Course Roles ──────────────────────────────────────────────
    this.schema.createTable('course_role', (table) => {
      table.increments('id')
      table.string('name', 255).notNullable()
      table.boolean('can_manage_course').notNullable().defaultTo(false)
      table.boolean('can_manage_assignments').notNullable().defaultTo(false)
      table.boolean('can_grade_submissions').notNullable().defaultTo(false)
      table.boolean('can_view_other_submissions').notNullable().defaultTo(false)
      table.boolean('builtin').notNullable().defaultTo(false)
    })

    // ── Course Enrollments ────────────────────────────────────────
    this.schema.createTable('course_enrollment', (table) => {
      table.increments('id')
      table.integer('user_id').notNullable().references('id').inTable('user')
      table.integer('course_offering_id').notNullable().references('id').inTable('section')
      table.integer('course_role_id').notNullable().references('id').inTable('course_role')

      table.index(['user_id'], 'index_course_enrollments_on_user_id')
      table.index(['course_offering_id'], 'index_course_enrollments_on_course_offering_id')
      table.index(['course_role_id'], 'index_course_enrollments_on_course_role_id')
    })

    // ── Friendly ID Slugs ─────────────────────────────────────────
    this.schema.createTable('friendly_id_slugs', (table) => {
      table.increments('id')
      table.string('slug', 255).notNullable()
      table.integer('sluggable_id').notNullable()
      table.string('sluggable_type', 50).nullable()
      table.string('scope', 255).nullable()
      table.timestamp('created_at').nullable()

      table.index(['slug', 'sluggable_type'], 'index_friendly_id_slugs_on_slug_and_sluggable_type')
      table.index(['sluggable_id'], 'index_friendly_id_slugs_on_sluggable_id')
      table.index(['sluggable_type'], 'index_friendly_id_slugs_on_sluggable_type')
    })
  }

  async down() {
    this.schema.dropTableIfExists('course_enrollment')
    this.schema.dropTableIfExists('course_role')
    this.schema.dropTableIfExists('section')
    this.schema.dropTableIfExists('course')
    this.schema.dropTableIfExists('term')
    this.schema.dropTableIfExists('friendly_id_slugs')
  }
}
