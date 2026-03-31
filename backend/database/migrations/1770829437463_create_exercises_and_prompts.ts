import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // ── IRT Data ──────────────────────────────────────────────────
    this.schema.createTable('irt_data', (table) => {
      table.increments('id')
      table.integer('attempt_count').notNullable()
      table.double('sum_of_scores').notNullable()
      table.double('difficulty').notNullable()
      table.double('discrimination').notNullable()
    })

    // ── Stems ─────────────────────────────────────────────────────
    this.schema.createTable('stems', (table) => {
      table.increments('id')
      table.text('preamble').nullable()
      table.timestamps(true, true)
    })

    // ── Exercise Families ─────────────────────────────────────────
    this.schema.createTable('exercise_families', (table) => {
      table.increments('id')
      table.string('name', 255).notNullable()
      table.timestamps(true, true)
    })

    // ── License Policies ──────────────────────────────────────────
    this.schema.createTable('license_policies', (table) => {
      table.increments('id')
      table.string('name', 255).nullable()
      table.text('description').nullable()
      table.boolean('can_fork').nullable()
      table.boolean('is_public').nullable()
      table.timestamps(true, true)
    })

    // ── Licenses ──────────────────────────────────────────────────
    this.schema.createTable('licenses', (table) => {
      table.increments('id')
      table.string('name', 255).nullable()
      table.text('description').nullable()
      table.string('url', 255).nullable()
      table.integer('license_policy_id').nullable().references('id').inTable('license_policies')
      table.timestamps(true, true)

      table.index(['license_policy_id'], 'index_licenses_on_license_policy_id')
    })

    // ── Exercise Collections ──────────────────────────────────────
    this.schema.createTable('exercise_collections', (table) => {
      table.increments('id')
      table.string('name', 255).nullable()
      table.text('description').nullable()
      table.integer('user_group_id').nullable().references('id').inTable('user_groups')
      table.integer('license_id').nullable().references('id').inTable('licenses')
      table.integer('user_id').nullable().references('id').inTable('user')
      table.integer('course_offering_id').nullable().references('id').inTable('section')
      table.timestamps(true, true)

      table.index(['user_group_id'], 'index_exercise_collections_on_user_group_id')
      table.index(['license_id'], 'index_exercise_collections_on_license_id')
      table.index(['user_id'], 'index_exercise_collections_on_user_id')
      table.index(['course_offering_id'], 'index_exercise_collections_on_course_offering_id')
    })

    // ── Exercises ─────────────────────────────────────────────────
    this.schema.createTable('exercises', (table) => {
      table.increments('id')
      table.integer('question_type').notNullable()
      table.integer('current_version_id').nullable()
      table.integer('versions').nullable()
      table.integer('exercise_family_id').nullable().references('id').inTable('exercise_families')
      table.string('name', 255).nullable()
      table.boolean('is_public').notNullable().defaultTo(false)
      table.integer('experience').notNullable()
      table.integer('irt_data_id').nullable().references('id').inTable('irt_data')
      table.string('external_id', 255).nullable()
      table.integer('exercise_collection_id').nullable().references('id').inTable('exercise_collections')
      table.timestamps(true, true)

      table.index(['exercise_family_id'], 'index_exercises_on_exercise_family_id')
      table.index(['is_public'], 'index_exercises_on_is_public')
      table.index(['irt_data_id'], 'exercises_irt_data_id_fk')
      table.index(['current_version_id'], 'index_exercises_on_current_version_id')
      table.index(['exercise_collection_id'], 'index_exercises_on_exercise_collection_id')
    })

    // ── Exercise Versions ─────────────────────────────────────────
    this.schema.createTable('exercise_versions', (table) => {
      table.increments('id')
      table.integer('exercise_id').notNullable().references('id').inTable('exercises')
      table.integer('version').notNullable()
      table.integer('stem_id').nullable().references('id').inTable('stems')
      table.integer('creator_id').nullable().references('id').inTable('user')
      table.integer('irt_data_id').nullable().references('id').inTable('irt_data')
      table.text('text_representation').nullable()
      table.timestamps(true, true)

      table.index(['exercise_id'], 'index_exercise_versions_on_exercise_id')
      table.index(['stem_id'], 'index_exercise_versions_on_stem_id')
      table.index(['creator_id'], 'exercise_versions_creator_id_fk')
      table.index(['irt_data_id'], 'exercise_versions_irt_data_id_fk')
    })

    // ── Resource Files ────────────────────────────────────────────
    this.schema.createTable('resource_files', (table) => {
      table.increments('id')
      table.string('filename', 255).nullable()
      table.string('token', 255).notNullable()
      table.integer('user_id').notNullable().references('id').inTable('user')
      table.boolean('public').defaultTo(true)
      table.string('hashval', 255).nullable()
      table.timestamps(true, true)

      table.index(['token'], 'index_resource_files_on_token')
      table.index(['hashval'], 'index_resource_files_on_hashval')
      table.index(['user_id'], 'index_resource_files_on_user_id')
    })

    // ── Exercise Versions Resource Files (join) ───────────────────
    this.schema.createTable('exercise_versions_resource_files', (table) => {
      table.integer('exercise_version_id').notNullable().references('id').inTable('exercise_versions')
      table.integer('resource_file_id').notNullable().references('id').inTable('resource_files')

      table.index(['exercise_version_id'], 'index_exercise_versions_resource_files_on_exercise_version_id')
      table.index(['resource_file_id'], 'index_exercise_versions_resource_files_on_resource_file_id')
    })

    // ── Ownerships ────────────────────────────────────────────────
    this.schema.createTable('ownerships', (table) => {
      table.increments('id')
      table.string('filename', 255).nullable()
      table.integer('resource_file_id').nullable().references('id').inTable('resource_files')
      table.integer('exercise_version_id').nullable().references('id').inTable('exercise_versions')
      table.timestamps(true, true)

      table.index(['exercise_version_id'], 'index_ownerships_on_exercise_version_id')
      table.index(['resource_file_id'], 'index_ownerships_on_resource_file_id')
      table.index(['filename'], 'index_ownerships_on_filename')
    })

    // ── Exercise Owners ───────────────────────────────────────────
    this.schema.createTable('exercise_owners', (table) => {
      table.increments('id')
      table.integer('exercise_id').notNullable().references('id').inTable('exercises')
      table.integer('owner_id').notNullable().references('id').inTable('user')

      table.index(['owner_id'], 'exercise_owners_owner_id_fk')
    })

    // ── Tags ──────────────────────────────────────────────────────
    this.schema.createTable('tags', (table) => {
      table.increments('id')
      table.string('name', 255).nullable()
      table.integer('taggings_count').defaultTo(0)
    })

    // ── Taggings ──────────────────────────────────────────────────
    this.schema.createTable('taggings', (table) => {
      table.increments('id')
      table.integer('tag_id').nullable().references('id').inTable('tags')
      table.integer('taggable_id').nullable()
      table.string('taggable_type', 255).nullable()
      table.integer('tagger_id').nullable()
      table.string('tagger_type', 255).nullable()
      table.string('context', 128).nullable()
      table.timestamp('created_at').nullable()

      table.index(['tag_id'], 'index_taggings_on_tag_id')
      table.index(['taggable_id'], 'index_taggings_on_taggable_id')
      table.index(['taggable_type'], 'index_taggings_on_taggable_type')
      table.index(['tagger_id'], 'index_taggings_on_tagger_id')
      table.index(['context'], 'index_taggings_on_context')
      table.index(['tagger_id', 'tagger_type'], 'index_taggings_on_tagger_id_and_tagger_type')
      table.index(['taggable_id', 'taggable_type', 'context'], 'index_taggings_on_taggable_id_and_taggable_type_and_context')
    })

    // ── Coding Prompts ────────────────────────────────────────────
    this.schema.createTable('coding_prompts', (table) => {
      table.increments('id')
      table.string('class_name', 255).nullable()
      table.text('wrapper_code').notNullable()
      table.text('test_script').notNullable()
      table.string('method_name', 255).nullable()
      table.text('starter_code').nullable()
      table.boolean('hide_examples').notNullable().defaultTo(false)
      table.timestamps(true, true)
    })

    // ── Coding Prompt Answers ─────────────────────────────────────
    this.schema.createTable('coding_prompt_answers', (table) => {
      table.increments('id')
      table.text('answer').nullable()
      table.text('error').nullable()
      table.integer('error_line_no').nullable()
    })

    // ── Test Cases ────────────────────────────────────────────────
    this.schema.createTable('test_cases', (table) => {
      table.increments('id')
      table.integer('coding_prompt_id').notNullable().references('id').inTable('coding_prompts')
      table.text('input').notNullable()
      table.text('expected_output').notNullable()
      table.double('weight').notNullable()
      table.text('description').nullable()
      table.text('negative_feedback').nullable()
      table.boolean('static').notNullable().defaultTo(false)
      table.boolean('screening').notNullable().defaultTo(false)
      table.boolean('example').notNullable().defaultTo(false)
      table.boolean('hidden').notNullable().defaultTo(false)
      table.timestamps(true, true)

      table.index(['coding_prompt_id'], 'index_test_cases_on_coding_prompt_id')
    })

    // ── Multiple Choice Prompts ───────────────────────────────────
    this.schema.createTable('multiple_choice_prompts', (table) => {
      table.increments('id')
      table.boolean('allow_multiple').notNullable().defaultTo(false)
      table.boolean('is_scrambled').notNullable().defaultTo(true)
    })

    // ── Multiple Choice Prompt Answers ────────────────────────────
    this.schema.createTable('multiple_choice_prompt_answers', (table) => {
      table.increments('id')
    })

    // ── Choices ───────────────────────────────────────────────────
    this.schema.createTable('choices', (table) => {
      table.increments('id')
      table.integer('multiple_choice_prompt_id').notNullable().references('id').inTable('multiple_choice_prompts')
      table.integer('position').notNullable()
      table.text('answer').notNullable()
      table.text('feedback').nullable()
      table.double('value').notNullable()
      table.timestamps(true, true)

      table.index(['multiple_choice_prompt_id'], 'index_choices_on_multiple_choice_prompt_id')
    })

    // ── Choices MC Prompt Answers (join) ──────────────────────────
    this.schema.createTable('choices_multiple_choice_prompt_answers', (table) => {
      table.integer('choice_id').nullable().references('id').inTable('choices')
      table.integer('multiple_choice_prompt_answer_id').nullable().references('id').inTable('multiple_choice_prompt_answers')

      table.index(['multiple_choice_prompt_answer_id'], 'choices_MC_prompt_answers_MC_prompt_answer_id_fk')
    })

    // ── Prompts ───────────────────────────────────────────────────
    this.schema.createTable('prompts', (table) => {
      table.increments('id')
      table.integer('exercise_version_id').notNullable().references('id').inTable('exercise_versions')
      table.text('question').notNullable()
      table.integer('position').notNullable()
      table.text('feedback').nullable()
      table.integer('actable_id').nullable()
      table.string('actable_type', 255).nullable()
      table.integer('irt_data_id').nullable().references('id').inTable('irt_data')
      table.timestamps(true, true)

      table.index(['exercise_version_id'], 'index_prompts_on_exercise_version_id')
      table.index(['actable_id'], 'index_prompts_on_actable_id')
      table.index(['irt_data_id'], 'prompts_irt_data_id_fk')
    })

    // ── Tag User Scores ───────────────────────────────────────────
    this.schema.createTable('tag_user_scores', (table) => {
      table.increments('id')
      table.integer('user_id').notNullable().references('id').inTable('user')
      table.integer('experience').defaultTo(0)
      table.integer('completed_exercises').defaultTo(0)
      table.timestamps(true, true)

      table.index(['user_id'], 'index_tag_user_scores_on_user_id')
    })

    // ── Visualization Loggings ────────────────────────────────────
    this.schema.createTable('visualization_loggings', (table) => {
      table.increments('id')
      table.integer('user_id').nullable().references('id').inTable('user')
      table.integer('exercise_id').nullable().references('id').inTable('exercises')
      table.integer('workout_id').nullable()
      table.integer('workout_offering_id').nullable()
      table.timestamps(true, true)

      table.index(['user_id'], 'index_visualization_loggings_on_user_id')
      table.index(['exercise_id'], 'index_visualization_loggings_on_exercise_id')
      table.index(['workout_id'], 'index_visualization_loggings_on_workout_id')
      table.index(['workout_offering_id'], 'index_visualization_loggings_on_workout_offering_id')
    })

    // ── Errors ────────────────────────────────────────────────────
    this.schema.createTable('error', (table) => {
      table.increments('id')
      table.string('usable_type', 255).nullable()
      table.integer('usable_id').nullable()
      table.string('class_name', 255).nullable()
      table.text('message').nullable()
      table.text('trace').nullable()
      table.text('target_url').nullable()
      table.text('referer_url').nullable()
      table.text('params').nullable()
      table.string('user_agent', 255).nullable()
      table.timestamps(true, true)

      table.index(['class_name'], 'index_errors_on_class_name')
      table.index(['created_at'], 'index_errors_on_created_at')
    })

    // ── Active Admin Comments ─────────────────────────────────────
    this.schema.createTable('active_admin_comments', (table) => {
      table.increments('id')
      table.string('namespace', 255).nullable()
      table.text('body').nullable()
      table.string('resource_id', 255).notNullable()
      table.string('resource_type', 255).notNullable()
      table.integer('author_id').nullable()
      table.string('author_type', 255).nullable()
      table.timestamps(true, true)

      table.index(['namespace'], 'index_active_admin_comments_on_namespace')
      table.index(['author_type', 'author_id'], 'index_active_admin_comments_on_author_type_and_author_id')
      table.index(['resource_type', 'resource_id'], 'index_active_admin_comments_on_resource_type_and_resource_id')
    })
  }

  async down() {
    this.schema.dropTableIfExists('active_admin_comments')
    this.schema.dropTableIfExists('error')
    this.schema.dropTableIfExists('visualization_loggings')
    this.schema.dropTableIfExists('tag_user_scores')
    this.schema.dropTableIfExists('prompts')
    this.schema.dropTableIfExists('choices_multiple_choice_prompt_answers')
    this.schema.dropTableIfExists('choices')
    this.schema.dropTableIfExists('multiple_choice_prompt_answers')
    this.schema.dropTableIfExists('multiple_choice_prompts')
    this.schema.dropTableIfExists('test_cases')
    this.schema.dropTableIfExists('coding_prompt_answers')
    this.schema.dropTableIfExists('coding_prompts')
    this.schema.dropTableIfExists('taggings')
    this.schema.dropTableIfExists('tags')
    this.schema.dropTableIfExists('exercise_owners')
    this.schema.dropTableIfExists('ownerships')
    this.schema.dropTableIfExists('exercise_versions_resource_files')
    this.schema.dropTableIfExists('resource_files')
    this.schema.dropTableIfExists('exercise_versions')
    this.schema.dropTableIfExists('exercises')
    this.schema.dropTableIfExists('exercise_collections')
    this.schema.dropTableIfExists('licenses')
    this.schema.dropTableIfExists('license_policies')
    this.schema.dropTableIfExists('exercise_families')
    this.schema.dropTableIfExists('stems')
    this.schema.dropTableIfExists('irt_data')
  }
}
