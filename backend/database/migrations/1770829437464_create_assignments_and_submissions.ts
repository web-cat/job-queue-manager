import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // ── Submission Policies ───────────────────────────────────────
    this.schema.createTable('submission_policy', (table) => {
      table.integer('id').primary()
      table.double('available_points').nullable()
      table.bigint('available_time_delta').nullable()
      table.boolean('award_early_bonus').notNullable()
      table.bigint('dead_time_delta').nullable()
      table.boolean('deduct_late_penalty').notNullable()
      table.double('early_bonus_max_pts').nullable()
      table.double('early_bonus_unit_pts').nullable()
      table.bigint('early_bonus_unit_time').nullable()
      table.double('late_penalty_max_pts').nullable()
      table.double('late_penalty_unit_pts').nullable()
      table.bigint('late_penalty_unit_time').nullable()
      table.bigint('max_file_upload_size').nullable()
      table.integer('max_submits').nullable()
      table.text('name').nullable()
      table.text('score_format').nullable()
      table.double('ta_points').nullable()
      table.double('tool_points').nullable()
      table.integer('user_id').nullable().references('id').inTable('user')
      table.text('included_file_patterns').nullable()
      table.text('excluded_file_patterns').nullable()
      table.text('required_file_patterns').nullable()
      table.smallint('submisison_method').notNullable().defaultTo(0)
      table.boolean('allow_partners').notNullable()
      table.boolean('deduct_excess_submission_penalty').notNullable().defaultTo(false)
      table.double('excess_submissions_max_pts').nullable()
      table.integer('excess_submissions_threshold').nullable()
      table.double('excess_submissions_unit_pts').nullable()
      table.integer('excess_submissions_unit_size').nullable()
      table.boolean('auto_assign_partners').notNullable().defaultTo(true)
      table.integer('energy_bar_config_id').nullable()
      table.boolean('force_lti_clickthrough').notNullable()
      table.boolean('use_time_bank_days').notNullable()
      table.text('time_bank_name').nullable()
      table.integer('time_bank_size').nullable()
      table.timestamps(true, true)

      table.index(['user_id'], 'submission_policy_user_id_fk')
    })

    // ── Workout Policies ──────────────────────────────────────────
    this.schema.createTable('workout_policies', (table) => {
      table.increments('id')
      table.boolean('hide_thumbnails_before_start').nullable()
      table.boolean('hide_feedback_before_finish').nullable()
      table.boolean('hide_compilation_feedback_before_finish').nullable()
      table.boolean('no_review_before_close').nullable()
      table.boolean('hide_feedback_in_review_before_close').nullable()
      table.boolean('hide_thumbnails_in_review_before_close').nullable()
      table.boolean('no_hints').nullable()
      table.boolean('no_faq').nullable()
      table.string('name', 255).nullable()
      table.string('description', 255).nullable()
      table.boolean('invisible_before_review').nullable()
      table.boolean('hide_score_before_finish').nullable()
      table.boolean('hide_score_in_review_before_close').nullable()
      table.timestamps(true, true)
    })

    // ── Assignments ───────────────────────────────────────────────
    this.schema.createTable('assignment', (table) => {
      table.increments('id')
      table.string('name', 255).notNullable()
      table.boolean('scrambled').defaultTo(false)
      table.text('description').nullable()
      table.integer('points_multiplier').nullable()
      table.integer('user_id').nullable().references('id').inTable('user')
      table.string('external_id', 255).nullable()
      table.boolean('is_public').nullable()
      table
        .integer('submission_policy_id')
        .notNullable()
        .references('id')
        .inTable('submission_policy')
      table.timestamps(true, true)

      table.index(['is_public'], 'index_workouts_on_is_public')
      table.index(['user_id'], 'workouts_creator_id_fk')
    })

    // ── Workout Owners ────────────────────────────────────────────
    this.schema.createTable('workout_owners', (table) => {
      table.increments('id')
      table.integer('workout_id').notNullable().references('id').inTable('assignment')
      table.integer('owner_id').notNullable().references('id').inTable('user')

      table.index(['owner_id'], 'workout_owners_owner_id_fk')
    })

    // ── Course Exercises ──────────────────────────────────────────
    this.schema.createTable('course_exercises', (table) => {
      table.increments('id')
      table.integer('course_id').notNullable().references('id').inTable('course')
      table.integer('exercise_id').notNullable().references('id').inTable('exercises')
      table.timestamps(true, true)

      table.index(['course_id'], 'course_exercises_course_id_fk')
      table.index(['exercise_id'], 'course_exercises_exercise_id_fk')
    })

    // ── Exercise Workouts ─────────────────────────────────────────
    this.schema.createTable('exercise_workouts', (table) => {
      table.increments('id')
      table.integer('exercise_id').notNullable().references('id').inTable('exercises')
      table.integer('workout_id').notNullable().references('id').inTable('assignment')
      table.integer('position').notNullable()
      table.double('points').defaultTo(1)
      table.timestamps(true, true)

      table.index(['exercise_id'], 'exercise_workouts_exercise_id_fk')
      table.index(['workout_id'], 'exercise_workouts_workout_id_fk')
    })

    // ── Assignment Offerings ──────────────────────────────────────
    this.schema.createTable('assignment_offering', (table) => {
      table.increments('id')
      table.integer('course_offering_id').notNullable().references('id').inTable('section')
      table.integer('assignment_id').notNullable().references('id').inTable('assignment')
      table.timestamp('available_from').nullable()
      table.timestamp('due_at').nullable()
      table.timestamp('accept_until').nullable()
      table.boolean('published').notNullable().defaultTo(true)
      table.integer('time_limit').nullable()
      table.integer('workout_policy_id').nullable().references('id').inTable('workout_policies')
      table
        .integer('continue_from_workout_id')
        .nullable()
        .references('id')
        .inTable('assignment_offering')
      table.string('lms_assignment_id', 255).nullable()
      table.boolean('most_recent').defaultTo(true)
      table.string('lms_assignment_url', 255).nullable()
      table.string('lis_outcome_service_url', 255).nullable()
      table.integer('attempt_limit').nullable()
      table.timestamps(true, true)

      table.index(['course_offering_id'], 'index_workout_offerings_on_course_offering_id')
      table.index(['assignment_id'], 'index_workout_offerings_on_workout_id')
      table.index(['workout_policy_id'], 'index_workout_offerings_on_workout_policy_id')
      table.index(['lms_assignment_id'], 'index_workout_offerings_on_lms_assignment_id')
      table.index(['continue_from_workout_id'], 'workout_offerings_continue_from_workout_id_fk')
    })

    // ── Grading Plugins ───────────────────────────────────────────
    this.schema.createTable('grading_plugin', (table) => {
      table.integer('id').primary()
      table.integer('user_id').nullable().references('id').inTable('user')
      table.binary('config_description').nullable()
      table.binary('default_config_settings').nullable()
      table.boolean('is_config_file').notNullable()
      table.boolean('is_published').notNullable()
      table.integer('language_id').nullable()
      table.text('main_file_name').nullable()
      table.text('name').nullable()
      table.text('subdir_name').nullable()
      table.text('uploaded_file_name').nullable()
      table.binary('global_config_settings').nullable()
      table.binary('file_config_settings').nullable()
      table.timestamps(true, true)

      table.index(['user_id'], 'grading_plugin_user_id_fk')
    })

    // ── Step Configs ──────────────────────────────────────────────
    this.schema.createTable('step_config', (table) => {
      table.integer('id').primary()
      table.binary('config_settings').nullable()
      table.integer('user_id').nullable().references('id').inTable('user')
      table.text('name').nullable()
      table.timestamps(true, true)

      table.index(['user_id'], 'step_config_user_id_fk')
    })

    // ── Steps ─────────────────────────────────────────────────────
    this.schema.createTable('step', (table) => {
      table.integer('id').primary()
      table.integer('assignment_id').nullable().references('id').inTable('assignment')
      table.binary('config_settings').nullable()
      table.integer('order').nullable()
      table.integer('grading_plugin_id').notNullable().references('id').inTable('grading_plugin')
      table.integer('step_config_id').nullable().references('id').inTable('step_config')
      table.integer('timeout').nullable()
      table.timestamps(true, true)

      table.index(['assignment_id'], 'assignment_id')
      table.index(['grading_plugin_id'], 'grading_plugin_id')
      table.index(['step_config_id'], 'step_config_id')
    })

    // ── Student Extensions ────────────────────────────────────────
    this.schema.createTable('student_extensions', (table) => {
      table.increments('id')
      table.integer('user_id').nullable().references('id').inTable('user')
      table
        .integer('workout_offering_id')
        .nullable()
        .references('id')
        .inTable('assignment_offering')
      table.timestamp('soft_deadline').nullable()
      table.timestamp('hard_deadline').nullable()
      table.integer('time_limit').nullable()
      table.timestamp('opening_date').nullable()
      table.timestamps(true, true)

      table.index(['user_id'], 'index_student_extensions_on_user_id')
      table.index(['workout_offering_id'], 'index_student_extensions_on_workout_offering_id')
    })

    // ── LIS Result IDs ────────────────────────────────────────────
    this.schema.createTable('lis_result_id', (table) => {
      table.integer('id').primary()
      table.string('lis_result_sourcedid', 255).notNullable()
      table.string('lis_result_source_did', 255).notNullable()
      table.integer('lms_instance_id').notNullable().references('id').inTable('lms_instance')
      table
        .integer('assignment_offering_id')
        .notNullable()
        .references('id')
        .inTable('assignment_offering')
      table.integer('user_id').notNullable().references('id').inTable('user')
    })

    // ── Submission Result ─────────────────────────────────────────
    this.schema.createTable('submission_result', (table) => {
      table.double('correctness_score').primary()
      table.double('tool_score').nullable()
      table.double('ta_score').nullable()
      table.text('comments').nullable()
      table.smallint('comment_format').nullable()
      table.timestamp('last_updated').nullable()
      table.timestamps(true, true)
    })

    // ── Submissions ───────────────────────────────────────────────
    // TODO: Confirm with other team:
    //   - Do we need a worker_tag field here or on enqueued_job?
    //   - Where does the submitted file path live?
    this.schema.createTable('submission', (table) => {
      table.increments('id')
      table.integer('workout_id').notNullable().references('id').inTable('assignment')
      table.integer('user_id').notNullable().references('id').inTable('user')
      table.string('file_path', 255).nullable()
      table.double('score').nullable()
      table
        .integer('assignment_offering_id')
        .nullable()
        .references('id')
        .inTable('assignment_offering')
      table.boolean('feedback_ready').notNullable().defaultTo(false)
      table.timestamp('submit_time').nullable()
      table.timestamp('last_attempted_at').nullable()
      table.integer('exercises_completed').nullable()
      table.integer('exercises_remaining').nullable()
      table.integer('submit_number').nullable()
      table.string('lis_result_sourcedid', 255).nullable()
      table
        .double('submission_result_id')
        .notNullable()
        .references('correctness_score')
        .inTable('submission_result')
      table.boolean('is_submission_for_grading').notNullable().defaultTo(false)
      table.boolean('partner_link').notNullable().defaultTo(false)
      table.integer('primary_submission_id').nullable().references('id').inTable('submission')
      table.string('lis_outcome_service_url', 255).nullable()
      table.integer('lti_workout_id').nullable().references('id').inTable('lti_workouts')
      table.timestamp('started_at').nullable()
      table.timestamps(true, true)

      table.index(['user_id'], 'index_workout_scores_on_user_id')
      table.index(['workout_id'], 'index_workout_scores_on_workout_id')
      table.index(['assignment_offering_id'], 'workout_scores_workout_offering_id_fk')
      table.index(['lti_workout_id'], 'index_workout_scores_on_lti_workout_id')
      table.index(
        ['user_id', 'workout_id', 'assignment_offering_id'],
        'idx_ws_on_user_workout_workout_offering'
      )
    })

    // ── Attempts ──────────────────────────────────────────────────
    this.schema.createTable('attempts', (table) => {
      table.increments('id')
      table.integer('user_id').notNullable().references('id').inTable('user')
      table
        .integer('exercise_version_id')
        .notNullable()
        .references('id')
        .inTable('exercise_versions')
      table.timestamp('submit_time').notNullable()
      table.integer('submit_num').notNullable()
      table.double('score').defaultTo(0)
      table.integer('experience_earned').nullable()
      table.integer('workout_score_id').nullable().references('id').inTable('submission')
      table.integer('active_score_id').nullable().references('id').inTable('submission')
      table.boolean('feedback_ready').nullable()
      table.decimal('time_taken', 10, 0).nullable()
      table.decimal('feedback_timeout', 10, 0).nullable()
      table.decimal('worker_time', 10, 0).nullable()
      table.timestamps(true, true)

      table.index(['user_id'], 'index_attempts_on_user_id')
      table.index(['exercise_version_id'], 'index_attempts_on_exercise_version_id')
      table.index(['workout_score_id'], 'index_attempts_on_workout_score_id')
      table.index(['active_score_id'], 'index_attempts_on_active_score_id')
      table.index(['user_id', 'exercise_version_id'], 'idx_attempts_on_user_exercise_version')
      table.index(
        ['workout_score_id', 'exercise_version_id'],
        'idx_attempts_on_workout_score_exercise_version'
      )
    })

    // ── Attempts Tag User Scores (join) ───────────────────────────
    this.schema.createTable('attempts_tag_user_scores', (table) => {
      table.integer('attempt_id').nullable().references('id').inTable('attempts')
      table.integer('tag_user_score_id').nullable().references('id').inTable('tag_user_scores')

      table.index(['tag_user_score_id'], 'attempts_tag_user_scores_tag_user_score_id_fk')
    })

    // ── Prompt Answers ────────────────────────────────────────────
    this.schema.createTable('prompt_answers', (table) => {
      table.increments('id')
      table.integer('attempt_id').nullable().references('id').inTable('attempts')
      table.integer('prompt_id').nullable().references('id').inTable('prompts')
      table.integer('actable_id').nullable()
      table.string('actable_type', 255).nullable()

      table.index(['attempt_id'], 'index_prompt_answers_on_attempt_id')
      table.index(['prompt_id'], 'index_prompt_answers_on_prompt_id')
      table.index(['actable_id'], 'index_prompt_answers_on_actable_id')
    })

    // ── Test Case Results ─────────────────────────────────────────
    this.schema.createTable('test_case_results', (table) => {
      table.increments('id')
      table.integer('test_case_id').notNullable().references('id').inTable('test_cases')
      table.integer('user_id').notNullable().references('id').inTable('user')
      table
        .integer('coding_prompt_answer_id')
        .nullable()
        .references('id')
        .inTable('coding_prompt_answers')
      table.boolean('pass').notNullable()
      table.text('execution_feedback').nullable()
      table.integer('feedback_line_no').nullable()
      table.timestamps(true, true)

      table.index(['test_case_id'], 'index_test_case_results_on_test_case_id')
      table.index(['user_id'], 'index_test_case_results_on_user_id')
      table.index(['coding_prompt_answer_id'], 'index_test_case_results_on_coding_prompt_answer_id')
    })
  }

  async down() {
    this.schema.dropTableIfExists('test_case_results')
    this.schema.dropTableIfExists('prompt_answers')
    this.schema.dropTableIfExists('attempts_tag_user_scores')
    this.schema.dropTableIfExists('attempts')
    this.schema.dropTableIfExists('submission')
    this.schema.dropTableIfExists('submission_result')
    this.schema.dropTableIfExists('lis_result_id')
    this.schema.dropTableIfExists('student_extensions')
    this.schema.dropTableIfExists('step')
    this.schema.dropTableIfExists('step_config')
    this.schema.dropTableIfExists('grading_plugin')
    this.schema.dropTableIfExists('assignment_offering')
    this.schema.dropTableIfExists('exercise_workouts')
    this.schema.dropTableIfExists('course_exercises')
    this.schema.dropTableIfExists('workout_owners')
    this.schema.dropTableIfExists('assignment')
    this.schema.dropTableIfExists('workout_policies')
    this.schema.dropTableIfExists('submission_policy')
  }
}
