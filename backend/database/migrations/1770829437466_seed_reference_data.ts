import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Seed Migration — Foundational Reference Data
 *
 * This migration seeds the reference/lookup tables that must exist before
 * the application can function. Unlike regular migrations which create tables,
 * this one inserts the initial data rows that the application depends on.
 *
 * TABLES SEEDED:
 *   global_role   → system-wide permission levels (Admin, Instructor, Student)
 *   course_role   → course-level roles (Instructor, TA, Student)
 *   lms_type      → supported LMS platforms (Canvas, Blackboard, Moodle)
 *   organization  → VT as the default organization
 *
 * DESIGN: Using a migration for seed data (rather than a separate seeder)
 * ensures this data is always present after migration:fresh and is version
 * controlled alongside the schema. This is appropriate for reference data
 * that never changes — not for test/demo data.
 *
 * NEXT TEAM NOTES:
 *   - global_role IDs are hardcoded in cas_controller.ts (id:1=Admin, id:2=Student)
 *     and lti_service.ts. Do not change the order of these inserts.
 *   - To add a new LMS type, add a new row here and create a new migration.
 *   - The VT organization row is required for lms_instance FK if used.
 */
export default class extends BaseSchema {
  async up() {
    // ── Global Roles ──────────────────────────────────────────────
    // System-wide permission levels. IDs are referenced in code:
    //   id=1 → Admin (instructors, staff — can manage all courses)
    //   id=2 → Instructor (can manage their own courses and assignments)
    //   id=3 → Student (default for CAS/LTI login)
    // WARNING: Do not change these IDs — they are hardcoded in:
    //   - app/controllers/cas_controller.ts (globalRoleId: 2)
    //   - app/services/lti_service.ts (globalRoleId: 2 or 1)
    await this.db.rawQuery(`
      INSERT INTO global_role (id, name, can_manage_all_courses, can_edit_system_configuration, builtin)
      VALUES
        (1, 'Admin',           true,  true,  true),
        (2, 'Instructor',      false, false, true),
        (3, 'Student',         false, false, true),
        (4, 'Service Account', false, false, true)
      ON CONFLICT (id) DO NOTHING
    `)

    // ── Course Roles ──────────────────────────────────────────────
    // Per-course roles assigned via course_enrollment.
    // Controls what a user can do within a specific course section.
    await this.db.rawQuery(`
      INSERT INTO course_role (id, name, can_manage_course, can_manage_assignments, can_grade_submissions, can_view_other_submissions, builtin)
      VALUES
        (1, 'Instructor',          true,  true,  true,  true,  true),
        (2, 'Teaching Assistant',  false, false, true,  true,  true),
        (3, 'Student',             false, false, false, false, true),
        (4, 'Observer',            false, false, false, false, true)
      ON CONFLICT (id) DO NOTHING
    `)

    // ── LMS Types ─────────────────────────────────────────────────
    // Supported Learning Management System platforms.
    // Used to categorize lms_instance records.
    await this.db.rawQuery(`
      INSERT INTO lms_type (id, name)
      VALUES
        (1, 'Canvas'),
        (2, 'Blackboard'),
        (3, 'Moodle'),
        (4, 'Brightspace')
      ON CONFLICT (id) DO NOTHING
    `)

    // ── Organization ──────────────────────────────────────────────
    // Virginia Tech as the default organization.
    // Required as a parent for courses and lms_instance records.
    await this.db.rawQuery(`
      INSERT INTO organization (id, name, abbreviation, slug, is_hidden)
      VALUES
        (1, 'Virginia Tech', 'VT', 'virginia-tech', false)
      ON CONFLICT (id) DO NOTHING
    `)
  }

  async down() {
    // Remove seeded data in reverse dependency order
    await this.db.rawQuery(`DELETE FROM organization WHERE id = 1`)
    await this.db.rawQuery(`DELETE FROM lms_type WHERE id IN (1, 2, 3, 4)`)
    await this.db.rawQuery(`DELETE FROM course_role WHERE id IN (1, 2, 3, 4)`)
    await this.db.rawQuery(`DELETE FROM global_role WHERE id IN (1, 2, 3, 4)`)
  }
}
