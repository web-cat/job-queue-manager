--
-- PostgreSQL database dump
--

\restrict rCx8LEh8BGNytVOf4dhSnY7SZgbqlRkHoob1qvv3QyoJ2Ck0lPdhx6pr2kHaQD3

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3 (Debian 18.3-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: active_admin_comments; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.active_admin_comments (
    id integer NOT NULL,
    namespace character varying(255),
    body text,
    resource_id character varying(255) NOT NULL,
    resource_type character varying(255) NOT NULL,
    author_id integer,
    author_type character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.active_admin_comments OWNER TO "user";

--
-- Name: active_admin_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.active_admin_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.active_admin_comments_id_seq OWNER TO "user";

--
-- Name: active_admin_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.active_admin_comments_id_seq OWNED BY public.active_admin_comments.id;


--
-- Name: adonis_schema; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.adonis_schema (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    batch integer NOT NULL,
    migration_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.adonis_schema OWNER TO "user";

--
-- Name: adonis_schema_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.adonis_schema_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.adonis_schema_id_seq OWNER TO "user";

--
-- Name: adonis_schema_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.adonis_schema_id_seq OWNED BY public.adonis_schema.id;


--
-- Name: adonis_schema_versions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.adonis_schema_versions (
    version integer NOT NULL
);


ALTER TABLE public.adonis_schema_versions OWNER TO "user";

--
-- Name: assignment; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.assignment (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    scrambled boolean DEFAULT false,
    description text,
    points_multiplier integer,
    user_id integer,
    external_id character varying(255),
    is_public boolean,
    submission_policy_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.assignment OWNER TO "user";

--
-- Name: assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.assignment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignment_id_seq OWNER TO "user";

--
-- Name: assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.assignment_id_seq OWNED BY public.assignment.id;


--
-- Name: assignment_offering; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.assignment_offering (
    id integer NOT NULL,
    course_offering_id integer NOT NULL,
    assignment_id integer NOT NULL,
    available_from timestamp with time zone,
    due_at timestamp with time zone,
    accept_until timestamp with time zone,
    published boolean DEFAULT true NOT NULL,
    time_limit integer,
    workout_policy_id integer,
    continue_from_workout_id integer,
    lms_assignment_id character varying(255),
    most_recent boolean DEFAULT true,
    lms_assignment_url character varying(255),
    lis_outcome_service_url character varying(255),
    attempt_limit integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.assignment_offering OWNER TO "user";

--
-- Name: assignment_offering_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.assignment_offering_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignment_offering_id_seq OWNER TO "user";

--
-- Name: assignment_offering_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.assignment_offering_id_seq OWNED BY public.assignment_offering.id;


--
-- Name: attempts; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.attempts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    exercise_version_id integer NOT NULL,
    submit_time timestamp with time zone NOT NULL,
    submit_num integer NOT NULL,
    score double precision DEFAULT '0'::double precision,
    experience_earned integer,
    workout_score_id integer,
    active_score_id integer,
    feedback_ready boolean,
    time_taken numeric(10,0),
    feedback_timeout numeric(10,0),
    worker_time numeric(10,0),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.attempts OWNER TO "user";

--
-- Name: attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attempts_id_seq OWNER TO "user";

--
-- Name: attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.attempts_id_seq OWNED BY public.attempts.id;


--
-- Name: attempts_tag_user_scores; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.attempts_tag_user_scores (
    attempt_id integer,
    tag_user_score_id integer
);


ALTER TABLE public.attempts_tag_user_scores OWNER TO "user";

--
-- Name: auth_access_tokens; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.auth_access_tokens (
    id bigint NOT NULL,
    tokenable_id integer NOT NULL,
    type character varying(255) NOT NULL,
    name character varying(255),
    hash character varying(255) NOT NULL,
    abilities text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone
);


ALTER TABLE public.auth_access_tokens OWNER TO "user";

--
-- Name: auth_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.auth_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_access_tokens_id_seq OWNER TO "user";

--
-- Name: auth_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.auth_access_tokens_id_seq OWNED BY public.auth_access_tokens.id;


--
-- Name: choices; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.choices (
    id integer NOT NULL,
    multiple_choice_prompt_id integer NOT NULL,
    "position" integer NOT NULL,
    answer text NOT NULL,
    feedback text,
    value double precision NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.choices OWNER TO "user";

--
-- Name: choices_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.choices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.choices_id_seq OWNER TO "user";

--
-- Name: choices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.choices_id_seq OWNED BY public.choices.id;


--
-- Name: choices_multiple_choice_prompt_answers; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.choices_multiple_choice_prompt_answers (
    choice_id integer,
    multiple_choice_prompt_answer_id integer
);


ALTER TABLE public.choices_multiple_choice_prompt_answers OWNER TO "user";

--
-- Name: coding_prompt_answers; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.coding_prompt_answers (
    id integer NOT NULL,
    answer text,
    error text,
    error_line_no integer
);


ALTER TABLE public.coding_prompt_answers OWNER TO "user";

--
-- Name: coding_prompt_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.coding_prompt_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coding_prompt_answers_id_seq OWNER TO "user";

--
-- Name: coding_prompt_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.coding_prompt_answers_id_seq OWNED BY public.coding_prompt_answers.id;


--
-- Name: coding_prompts; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.coding_prompts (
    id integer NOT NULL,
    class_name character varying(255),
    wrapper_code text NOT NULL,
    test_script text NOT NULL,
    method_name character varying(255),
    starter_code text,
    hide_examples boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.coding_prompts OWNER TO "user";

--
-- Name: coding_prompts_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.coding_prompts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coding_prompts_id_seq OWNER TO "user";

--
-- Name: coding_prompts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.coding_prompts_id_seq OWNED BY public.coding_prompts.id;


--
-- Name: course; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.course (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    number character varying(255) NOT NULL,
    organization_id integer NOT NULL,
    creator_id integer,
    slug character varying(255) NOT NULL,
    user_group_id integer,
    is_hidden boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.course OWNER TO "user";

--
-- Name: course_enrollment; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.course_enrollment (
    id integer NOT NULL,
    user_id integer NOT NULL,
    course_offering_id integer NOT NULL,
    course_role_id integer NOT NULL
);


ALTER TABLE public.course_enrollment OWNER TO "user";

--
-- Name: course_enrollment_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.course_enrollment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_enrollment_id_seq OWNER TO "user";

--
-- Name: course_enrollment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.course_enrollment_id_seq OWNED BY public.course_enrollment.id;


--
-- Name: course_exercises; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.course_exercises (
    id integer NOT NULL,
    course_id integer NOT NULL,
    exercise_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.course_exercises OWNER TO "user";

--
-- Name: course_exercises_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.course_exercises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_exercises_id_seq OWNER TO "user";

--
-- Name: course_exercises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.course_exercises_id_seq OWNED BY public.course_exercises.id;


--
-- Name: course_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.course_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_id_seq OWNER TO "user";

--
-- Name: course_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.course_id_seq OWNED BY public.course.id;


--
-- Name: course_role; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.course_role (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    can_manage_course boolean DEFAULT false NOT NULL,
    can_manage_assignments boolean DEFAULT false NOT NULL,
    can_grade_submissions boolean DEFAULT false NOT NULL,
    can_view_other_submissions boolean DEFAULT false NOT NULL,
    builtin boolean DEFAULT false NOT NULL
);


ALTER TABLE public.course_role OWNER TO "user";

--
-- Name: course_role_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.course_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_role_id_seq OWNER TO "user";

--
-- Name: course_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.course_role_id_seq OWNED BY public.course_role.id;


--
-- Name: enqueued_job; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.enqueued_job (
    id integer NOT NULL,
    submission_id integer NOT NULL,
    worker_id integer,
    priority smallint,
    discarded boolean NOT NULL,
    suspended boolean NOT NULL,
    queue_time timestamp with time zone
);


ALTER TABLE public.enqueued_job OWNER TO "user";

--
-- Name: error; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.error (
    id integer NOT NULL,
    usable_type character varying(255),
    usable_id integer,
    class_name character varying(255),
    message text,
    trace text,
    target_url text,
    referer_url text,
    params text,
    user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.error OWNER TO "user";

--
-- Name: error_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.error_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.error_id_seq OWNER TO "user";

--
-- Name: error_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.error_id_seq OWNED BY public.error.id;


--
-- Name: exercise_collections; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.exercise_collections (
    id integer NOT NULL,
    name character varying(255),
    description text,
    user_group_id integer,
    license_id integer,
    user_id integer,
    course_offering_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.exercise_collections OWNER TO "user";

--
-- Name: exercise_collections_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.exercise_collections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exercise_collections_id_seq OWNER TO "user";

--
-- Name: exercise_collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.exercise_collections_id_seq OWNED BY public.exercise_collections.id;


--
-- Name: exercise_families; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.exercise_families (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.exercise_families OWNER TO "user";

--
-- Name: exercise_families_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.exercise_families_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exercise_families_id_seq OWNER TO "user";

--
-- Name: exercise_families_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.exercise_families_id_seq OWNED BY public.exercise_families.id;


--
-- Name: exercise_owners; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.exercise_owners (
    id integer NOT NULL,
    exercise_id integer NOT NULL,
    owner_id integer NOT NULL
);


ALTER TABLE public.exercise_owners OWNER TO "user";

--
-- Name: exercise_owners_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.exercise_owners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exercise_owners_id_seq OWNER TO "user";

--
-- Name: exercise_owners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.exercise_owners_id_seq OWNED BY public.exercise_owners.id;


--
-- Name: exercise_versions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.exercise_versions (
    id integer NOT NULL,
    exercise_id integer NOT NULL,
    version integer NOT NULL,
    stem_id integer,
    creator_id integer,
    irt_data_id integer,
    text_representation text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.exercise_versions OWNER TO "user";

--
-- Name: exercise_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.exercise_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exercise_versions_id_seq OWNER TO "user";

--
-- Name: exercise_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.exercise_versions_id_seq OWNED BY public.exercise_versions.id;


--
-- Name: exercise_versions_resource_files; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.exercise_versions_resource_files (
    exercise_version_id integer NOT NULL,
    resource_file_id integer NOT NULL
);


ALTER TABLE public.exercise_versions_resource_files OWNER TO "user";

--
-- Name: exercise_workouts; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.exercise_workouts (
    id integer NOT NULL,
    exercise_id integer NOT NULL,
    workout_id integer NOT NULL,
    "position" integer NOT NULL,
    points double precision DEFAULT '1'::double precision,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.exercise_workouts OWNER TO "user";

--
-- Name: exercise_workouts_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.exercise_workouts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exercise_workouts_id_seq OWNER TO "user";

--
-- Name: exercise_workouts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.exercise_workouts_id_seq OWNED BY public.exercise_workouts.id;


--
-- Name: exercises; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.exercises (
    id integer NOT NULL,
    question_type integer NOT NULL,
    current_version_id integer,
    versions integer,
    exercise_family_id integer,
    name character varying(255),
    is_public boolean DEFAULT false NOT NULL,
    experience integer NOT NULL,
    irt_data_id integer,
    external_id character varying(255),
    exercise_collection_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.exercises OWNER TO "user";

--
-- Name: exercises_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.exercises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exercises_id_seq OWNER TO "user";

--
-- Name: exercises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.exercises_id_seq OWNED BY public.exercises.id;


--
-- Name: friendly_id_slugs; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.friendly_id_slugs (
    id integer NOT NULL,
    slug character varying(255) NOT NULL,
    sluggable_id integer NOT NULL,
    sluggable_type character varying(50),
    scope character varying(255),
    created_at timestamp with time zone
);


ALTER TABLE public.friendly_id_slugs OWNER TO "user";

--
-- Name: friendly_id_slugs_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.friendly_id_slugs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.friendly_id_slugs_id_seq OWNER TO "user";

--
-- Name: friendly_id_slugs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.friendly_id_slugs_id_seq OWNED BY public.friendly_id_slugs.id;


--
-- Name: global_role; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.global_role (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    can_manage_all_courses boolean DEFAULT false NOT NULL,
    can_edit_system_configuration boolean DEFAULT false NOT NULL,
    builtin boolean DEFAULT false NOT NULL
);


ALTER TABLE public.global_role OWNER TO "user";

--
-- Name: global_role_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.global_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.global_role_id_seq OWNER TO "user";

--
-- Name: global_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.global_role_id_seq OWNED BY public.global_role.id;


--
-- Name: grading_plugin; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.grading_plugin (
    id integer NOT NULL,
    user_id integer,
    config_description bytea,
    default_config_settings bytea,
    is_config_file boolean NOT NULL,
    is_published boolean NOT NULL,
    language_id integer,
    main_file_name text,
    name text,
    subdir_name text,
    uploaded_file_name text,
    global_config_settings bytea,
    file_config_settings bytea,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.grading_plugin OWNER TO "user";

--
-- Name: group_access_requests; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.group_access_requests (
    id integer NOT NULL,
    user_id integer,
    user_group_id integer,
    pending boolean DEFAULT true,
    decision boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.group_access_requests OWNER TO "user";

--
-- Name: group_access_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.group_access_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_access_requests_id_seq OWNER TO "user";

--
-- Name: group_access_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.group_access_requests_id_seq OWNED BY public.group_access_requests.id;


--
-- Name: identity; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.identity (
    id integer NOT NULL,
    user_id integer NOT NULL,
    provider character varying(255) NOT NULL,
    uid character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.identity OWNER TO "user";

--
-- Name: identity_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.identity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.identity_id_seq OWNER TO "user";

--
-- Name: identity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.identity_id_seq OWNED BY public.identity.id;


--
-- Name: irt_data; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.irt_data (
    id integer NOT NULL,
    attempt_count integer NOT NULL,
    sum_of_scores double precision NOT NULL,
    difficulty double precision NOT NULL,
    discrimination double precision NOT NULL
);


ALTER TABLE public.irt_data OWNER TO "user";

--
-- Name: irt_data_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.irt_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.irt_data_id_seq OWNER TO "user";

--
-- Name: irt_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.irt_data_id_seq OWNED BY public.irt_data.id;


--
-- Name: license_policies; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.license_policies (
    id integer NOT NULL,
    name character varying(255),
    description text,
    can_fork boolean,
    is_public boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.license_policies OWNER TO "user";

--
-- Name: license_policies_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.license_policies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.license_policies_id_seq OWNER TO "user";

--
-- Name: license_policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.license_policies_id_seq OWNED BY public.license_policies.id;


--
-- Name: licenses; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.licenses (
    id integer NOT NULL,
    name character varying(255),
    description text,
    url character varying(255),
    license_policy_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.licenses OWNER TO "user";

--
-- Name: licenses_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.licenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.licenses_id_seq OWNER TO "user";

--
-- Name: licenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.licenses_id_seq OWNED BY public.licenses.id;


--
-- Name: lis_result_id; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.lis_result_id (
    id integer NOT NULL,
    lis_result_sourcedid character varying(255) NOT NULL,
    lis_result_source_did character varying(255) NOT NULL,
    lms_instance_id integer NOT NULL,
    assignment_offering_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.lis_result_id OWNER TO "user";

--
-- Name: lms_instance; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.lms_instance (
    id integer NOT NULL,
    consumer_key character varying(255),
    consumer_secret character varying(255),
    url character varying(255),
    lms_type_id integer NOT NULL,
    organization_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.lms_instance OWNER TO "user";

--
-- Name: lms_instance_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.lms_instance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lms_instance_id_seq OWNER TO "user";

--
-- Name: lms_instance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.lms_instance_id_seq OWNED BY public.lms_instance.id;


--
-- Name: lms_type; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.lms_type (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.lms_type OWNER TO "user";

--
-- Name: lms_type_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.lms_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lms_type_id_seq OWNER TO "user";

--
-- Name: lms_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.lms_type_id_seq OWNED BY public.lms_type.id;


--
-- Name: lti_identity; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.lti_identity (
    id integer NOT NULL,
    lti_user_id character varying(255),
    user_id integer NOT NULL,
    lms_instance_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.lti_identity OWNER TO "user";

--
-- Name: lti_identity_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.lti_identity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lti_identity_id_seq OWNER TO "user";

--
-- Name: lti_identity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.lti_identity_id_seq OWNED BY public.lti_identity.id;


--
-- Name: lti_workouts; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.lti_workouts (
    id integer NOT NULL,
    workout_id integer,
    lms_assignment_id character varying(255) NOT NULL,
    lms_instance_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.lti_workouts OWNER TO "user";

--
-- Name: lti_workouts_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.lti_workouts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lti_workouts_id_seq OWNER TO "user";

--
-- Name: lti_workouts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.lti_workouts_id_seq OWNED BY public.lti_workouts.id;


--
-- Name: memberships; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.memberships (
    id integer NOT NULL,
    user_id integer,
    user_group_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.memberships OWNER TO "user";

--
-- Name: memberships_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.memberships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.memberships_id_seq OWNER TO "user";

--
-- Name: memberships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.memberships_id_seq OWNED BY public.memberships.id;


--
-- Name: multiple_choice_prompt_answers; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.multiple_choice_prompt_answers (
    id integer NOT NULL
);


ALTER TABLE public.multiple_choice_prompt_answers OWNER TO "user";

--
-- Name: multiple_choice_prompt_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.multiple_choice_prompt_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.multiple_choice_prompt_answers_id_seq OWNER TO "user";

--
-- Name: multiple_choice_prompt_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.multiple_choice_prompt_answers_id_seq OWNED BY public.multiple_choice_prompt_answers.id;


--
-- Name: multiple_choice_prompts; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.multiple_choice_prompts (
    id integer NOT NULL,
    allow_multiple boolean DEFAULT false NOT NULL,
    is_scrambled boolean DEFAULT true NOT NULL
);


ALTER TABLE public.multiple_choice_prompts OWNER TO "user";

--
-- Name: multiple_choice_prompts_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.multiple_choice_prompts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.multiple_choice_prompts_id_seq OWNER TO "user";

--
-- Name: multiple_choice_prompts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.multiple_choice_prompts_id_seq OWNED BY public.multiple_choice_prompts.id;


--
-- Name: organization; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.organization (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    abbreviation character varying(255),
    slug character varying(255) NOT NULL,
    is_hidden boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.organization OWNER TO "user";

--
-- Name: organization_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.organization_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organization_id_seq OWNER TO "user";

--
-- Name: organization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.organization_id_seq OWNED BY public.organization.id;


--
-- Name: ownerships; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.ownerships (
    id integer NOT NULL,
    filename character varying(255),
    resource_file_id integer,
    exercise_version_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ownerships OWNER TO "user";

--
-- Name: ownerships_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.ownerships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ownerships_id_seq OWNER TO "user";

--
-- Name: ownerships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.ownerships_id_seq OWNED BY public.ownerships.id;


--
-- Name: prompt_answers; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.prompt_answers (
    id integer NOT NULL,
    attempt_id integer,
    prompt_id integer,
    actable_id integer,
    actable_type character varying(255)
);


ALTER TABLE public.prompt_answers OWNER TO "user";

--
-- Name: prompt_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.prompt_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prompt_answers_id_seq OWNER TO "user";

--
-- Name: prompt_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.prompt_answers_id_seq OWNED BY public.prompt_answers.id;


--
-- Name: prompts; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.prompts (
    id integer NOT NULL,
    exercise_version_id integer NOT NULL,
    question text NOT NULL,
    "position" integer NOT NULL,
    feedback text,
    actable_id integer,
    actable_type character varying(255),
    irt_data_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.prompts OWNER TO "user";

--
-- Name: prompts_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.prompts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prompts_id_seq OWNER TO "user";

--
-- Name: prompts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.prompts_id_seq OWNED BY public.prompts.id;


--
-- Name: resource_files; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.resource_files (
    id integer NOT NULL,
    filename character varying(255),
    token character varying(255) NOT NULL,
    user_id integer NOT NULL,
    public boolean DEFAULT true,
    hashval character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.resource_files OWNER TO "user";

--
-- Name: resource_files_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.resource_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resource_files_id_seq OWNER TO "user";

--
-- Name: resource_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.resource_files_id_seq OWNED BY public.resource_files.id;


--
-- Name: section; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.section (
    id integer NOT NULL,
    course_id integer NOT NULL,
    term_id integer NOT NULL,
    label character varying(255) NOT NULL,
    url character varying(255),
    self_enrollment_allowed boolean,
    cutoff_date date,
    lms_instance_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.section OWNER TO "user";

--
-- Name: section_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.section_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.section_id_seq OWNER TO "user";

--
-- Name: section_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.section_id_seq OWNED BY public.section.id;


--
-- Name: signups; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.signups (
    id integer NOT NULL,
    first_name character varying(255),
    last_name_name character varying(255),
    email character varying(255),
    institution character varying(255),
    comments text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.signups OWNER TO "user";

--
-- Name: signups_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.signups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signups_id_seq OWNER TO "user";

--
-- Name: signups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.signups_id_seq OWNED BY public.signups.id;


--
-- Name: stems; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.stems (
    id integer NOT NULL,
    preamble text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.stems OWNER TO "user";

--
-- Name: stems_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.stems_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stems_id_seq OWNER TO "user";

--
-- Name: stems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.stems_id_seq OWNED BY public.stems.id;


--
-- Name: step; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.step (
    id integer NOT NULL,
    assignment_id integer,
    config_settings bytea,
    "order" integer,
    grading_plugin_id integer NOT NULL,
    step_config_id integer,
    timeout integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.step OWNER TO "user";

--
-- Name: step_config; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.step_config (
    id integer NOT NULL,
    config_settings bytea,
    user_id integer,
    name text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.step_config OWNER TO "user";

--
-- Name: student_extensions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.student_extensions (
    id integer NOT NULL,
    user_id integer,
    workout_offering_id integer,
    soft_deadline timestamp with time zone,
    hard_deadline timestamp with time zone,
    time_limit integer,
    opening_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.student_extensions OWNER TO "user";

--
-- Name: student_extensions_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.student_extensions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_extensions_id_seq OWNER TO "user";

--
-- Name: student_extensions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.student_extensions_id_seq OWNED BY public.student_extensions.id;


--
-- Name: submission; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.submission (
    id integer NOT NULL,
    workout_id integer NOT NULL,
    user_id integer NOT NULL,
    score double precision,
    assignment_offering_id integer,
    feedback_ready boolean DEFAULT false NOT NULL,
    submit_time timestamp with time zone,
    last_attempted_at timestamp with time zone,
    exercises_completed integer,
    exercises_remaining integer,
    submit_number integer,
    lis_result_sourcedid character varying(255),
    submission_result_id double precision NOT NULL,
    is_submission_for_grading boolean DEFAULT false NOT NULL,
    partner_link boolean DEFAULT false NOT NULL,
    primary_submission_id integer,
    lis_outcome_service_url character varying(255),
    lti_workout_id integer,
    started_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.submission OWNER TO "user";

--
-- Name: submission_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.submission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.submission_id_seq OWNER TO "user";

--
-- Name: submission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.submission_id_seq OWNED BY public.submission.id;


--
-- Name: submission_policy; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.submission_policy (
    id integer NOT NULL,
    available_points double precision,
    available_time_delta bigint,
    award_early_bonus boolean NOT NULL,
    dead_time_delta bigint,
    deduct_late_penalty boolean NOT NULL,
    early_bonus_max_pts double precision,
    early_bonus_unit_pts double precision,
    early_bonus_unit_time bigint,
    late_penalty_max_pts double precision,
    late_penalty_unit_pts double precision,
    late_penalty_unit_time bigint,
    max_file_upload_size bigint,
    max_submits integer,
    name text,
    score_format text,
    ta_points double precision,
    tool_points double precision,
    user_id integer,
    included_file_patterns text,
    excluded_file_patterns text,
    required_file_patterns text,
    submisison_method smallint DEFAULT '0'::smallint NOT NULL,
    allow_partners boolean NOT NULL,
    deduct_excess_submission_penalty boolean DEFAULT false NOT NULL,
    excess_submissions_max_pts double precision,
    excess_submissions_threshold integer,
    excess_submissions_unit_pts double precision,
    excess_submissions_unit_size integer,
    auto_assign_partners boolean DEFAULT true NOT NULL,
    energy_bar_config_id integer,
    force_lti_clickthrough boolean NOT NULL,
    use_time_bank_days boolean NOT NULL,
    time_bank_name text,
    time_bank_size integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.submission_policy OWNER TO "user";

--
-- Name: submission_result; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.submission_result (
    correctness_score double precision NOT NULL,
    tool_score double precision,
    ta_score double precision,
    comments text,
    comment_format smallint,
    last_updated timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.submission_result OWNER TO "user";

--
-- Name: tag_user_scores; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.tag_user_scores (
    id integer NOT NULL,
    user_id integer NOT NULL,
    experience integer DEFAULT 0,
    completed_exercises integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.tag_user_scores OWNER TO "user";

--
-- Name: tag_user_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.tag_user_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tag_user_scores_id_seq OWNER TO "user";

--
-- Name: tag_user_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.tag_user_scores_id_seq OWNED BY public.tag_user_scores.id;


--
-- Name: taggings; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.taggings (
    id integer NOT NULL,
    tag_id integer,
    taggable_id integer,
    taggable_type character varying(255),
    tagger_id integer,
    tagger_type character varying(255),
    context character varying(128),
    created_at timestamp with time zone
);


ALTER TABLE public.taggings OWNER TO "user";

--
-- Name: taggings_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.taggings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.taggings_id_seq OWNER TO "user";

--
-- Name: taggings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.taggings_id_seq OWNED BY public.taggings.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    name character varying(255),
    taggings_count integer DEFAULT 0
);


ALTER TABLE public.tags OWNER TO "user";

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tags_id_seq OWNER TO "user";

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: term; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.term (
    id integer NOT NULL,
    season integer NOT NULL,
    year integer NOT NULL,
    slug character varying(255) NOT NULL,
    starts_on date NOT NULL,
    ends_on date NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.term OWNER TO "user";

--
-- Name: term_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.term_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.term_id_seq OWNER TO "user";

--
-- Name: term_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.term_id_seq OWNED BY public.term.id;


--
-- Name: test_case_results; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.test_case_results (
    id integer NOT NULL,
    test_case_id integer NOT NULL,
    user_id integer NOT NULL,
    coding_prompt_answer_id integer,
    pass boolean NOT NULL,
    execution_feedback text,
    feedback_line_no integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.test_case_results OWNER TO "user";

--
-- Name: test_case_results_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.test_case_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.test_case_results_id_seq OWNER TO "user";

--
-- Name: test_case_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.test_case_results_id_seq OWNED BY public.test_case_results.id;


--
-- Name: test_cases; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.test_cases (
    id integer NOT NULL,
    coding_prompt_id integer NOT NULL,
    input text NOT NULL,
    expected_output text NOT NULL,
    weight double precision NOT NULL,
    description text,
    negative_feedback text,
    static boolean DEFAULT false NOT NULL,
    screening boolean DEFAULT false NOT NULL,
    example boolean DEFAULT false NOT NULL,
    hidden boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.test_cases OWNER TO "user";

--
-- Name: test_cases_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.test_cases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.test_cases_id_seq OWNER TO "user";

--
-- Name: test_cases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.test_cases_id_seq OWNED BY public.test_cases.id;


--
-- Name: time_zones; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.time_zones (
    id integer NOT NULL,
    name character varying(255),
    zone character varying(255),
    display_as character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.time_zones OWNER TO "user";

--
-- Name: time_zones_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.time_zones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.time_zones_id_seq OWNER TO "user";

--
-- Name: time_zones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.time_zones_id_seq OWNED BY public.time_zones.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    encrypted_password character varying(255) NOT NULL,
    reset_password_token character varying(255),
    reset_password_sent_at timestamp with time zone,
    remember_created_at timestamp with time zone,
    sign_in_count integer DEFAULT 0 NOT NULL,
    current_sign_in_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    current_sign_in_ip character varying(255),
    last_sign_in_ip character varying(255),
    confirmation_token character varying(255),
    confirmed_at timestamp with time zone,
    confirmation_sent_at timestamp with time zone,
    first_name character varying(255),
    last_name character varying(255),
    global_role_id integer NOT NULL,
    avatar character varying(255),
    slug character varying(255) NOT NULL,
    current_workout_score_id integer,
    time_zone_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."user" OWNER TO "user";

--
-- Name: user_groups; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.user_groups (
    id integer NOT NULL,
    name character varying(255),
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_groups OWNER TO "user";

--
-- Name: user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.user_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_groups_id_seq OWNER TO "user";

--
-- Name: user_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.user_groups_id_seq OWNED BY public.user_groups.id;


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_id_seq OWNER TO "user";

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: visualization_loggings; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.visualization_loggings (
    id integer NOT NULL,
    user_id integer,
    exercise_id integer,
    workout_id integer,
    workout_offering_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.visualization_loggings OWNER TO "user";

--
-- Name: visualization_loggings_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.visualization_loggings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visualization_loggings_id_seq OWNER TO "user";

--
-- Name: visualization_loggings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.visualization_loggings_id_seq OWNED BY public.visualization_loggings.id;


--
-- Name: workout_owners; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.workout_owners (
    id integer NOT NULL,
    workout_id integer NOT NULL,
    owner_id integer NOT NULL
);


ALTER TABLE public.workout_owners OWNER TO "user";

--
-- Name: workout_owners_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.workout_owners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workout_owners_id_seq OWNER TO "user";

--
-- Name: workout_owners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.workout_owners_id_seq OWNED BY public.workout_owners.id;


--
-- Name: workout_policies; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.workout_policies (
    id integer NOT NULL,
    hide_thumbnails_before_start boolean,
    hide_feedback_before_finish boolean,
    hide_compilation_feedback_before_finish boolean,
    no_review_before_close boolean,
    hide_feedback_in_review_before_close boolean,
    hide_thumbnails_in_review_before_close boolean,
    no_hints boolean,
    no_faq boolean,
    name character varying(255),
    description character varying(255),
    invisible_before_review boolean,
    hide_score_before_finish boolean,
    hide_score_in_review_before_close boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.workout_policies OWNER TO "user";

--
-- Name: workout_policies_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.workout_policies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workout_policies_id_seq OWNER TO "user";

--
-- Name: workout_policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.workout_policies_id_seq OWNED BY public.workout_policies.id;


--
-- Name: active_admin_comments id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.active_admin_comments ALTER COLUMN id SET DEFAULT nextval('public.active_admin_comments_id_seq'::regclass);


--
-- Name: adonis_schema id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.adonis_schema ALTER COLUMN id SET DEFAULT nextval('public.adonis_schema_id_seq'::regclass);


--
-- Name: assignment id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.assignment ALTER COLUMN id SET DEFAULT nextval('public.assignment_id_seq'::regclass);


--
-- Name: assignment_offering id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.assignment_offering ALTER COLUMN id SET DEFAULT nextval('public.assignment_offering_id_seq'::regclass);


--
-- Name: attempts id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.attempts ALTER COLUMN id SET DEFAULT nextval('public.attempts_id_seq'::regclass);


--
-- Name: auth_access_tokens id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.auth_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.auth_access_tokens_id_seq'::regclass);


--
-- Name: choices id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.choices ALTER COLUMN id SET DEFAULT nextval('public.choices_id_seq'::regclass);


--
-- Name: coding_prompt_answers id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.coding_prompt_answers ALTER COLUMN id SET DEFAULT nextval('public.coding_prompt_answers_id_seq'::regclass);


--
-- Name: coding_prompts id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.coding_prompts ALTER COLUMN id SET DEFAULT nextval('public.coding_prompts_id_seq'::regclass);


--
-- Name: course id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course ALTER COLUMN id SET DEFAULT nextval('public.course_id_seq'::regclass);


--
-- Name: course_enrollment id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course_enrollment ALTER COLUMN id SET DEFAULT nextval('public.course_enrollment_id_seq'::regclass);


--
-- Name: course_exercises id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course_exercises ALTER COLUMN id SET DEFAULT nextval('public.course_exercises_id_seq'::regclass);


--
-- Name: course_role id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course_role ALTER COLUMN id SET DEFAULT nextval('public.course_role_id_seq'::regclass);


--
-- Name: error id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.error ALTER COLUMN id SET DEFAULT nextval('public.error_id_seq'::regclass);


--
-- Name: exercise_collections id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_collections ALTER COLUMN id SET DEFAULT nextval('public.exercise_collections_id_seq'::regclass);


--
-- Name: exercise_families id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_families ALTER COLUMN id SET DEFAULT nextval('public.exercise_families_id_seq'::regclass);


--
-- Name: exercise_owners id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_owners ALTER COLUMN id SET DEFAULT nextval('public.exercise_owners_id_seq'::regclass);


--
-- Name: exercise_versions id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_versions ALTER COLUMN id SET DEFAULT nextval('public.exercise_versions_id_seq'::regclass);


--
-- Name: exercise_workouts id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_workouts ALTER COLUMN id SET DEFAULT nextval('public.exercise_workouts_id_seq'::regclass);


--
-- Name: exercises id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercises ALTER COLUMN id SET DEFAULT nextval('public.exercises_id_seq'::regclass);


--
-- Name: friendly_id_slugs id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.friendly_id_slugs ALTER COLUMN id SET DEFAULT nextval('public.friendly_id_slugs_id_seq'::regclass);


--
-- Name: global_role id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.global_role ALTER COLUMN id SET DEFAULT nextval('public.global_role_id_seq'::regclass);


--
-- Name: group_access_requests id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.group_access_requests ALTER COLUMN id SET DEFAULT nextval('public.group_access_requests_id_seq'::regclass);


--
-- Name: identity id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.identity ALTER COLUMN id SET DEFAULT nextval('public.identity_id_seq'::regclass);


--
-- Name: irt_data id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.irt_data ALTER COLUMN id SET DEFAULT nextval('public.irt_data_id_seq'::regclass);


--
-- Name: license_policies id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.license_policies ALTER COLUMN id SET DEFAULT nextval('public.license_policies_id_seq'::regclass);


--
-- Name: licenses id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.licenses ALTER COLUMN id SET DEFAULT nextval('public.licenses_id_seq'::regclass);


--
-- Name: lms_instance id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lms_instance ALTER COLUMN id SET DEFAULT nextval('public.lms_instance_id_seq'::regclass);


--
-- Name: lms_type id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lms_type ALTER COLUMN id SET DEFAULT nextval('public.lms_type_id_seq'::regclass);


--
-- Name: lti_identity id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lti_identity ALTER COLUMN id SET DEFAULT nextval('public.lti_identity_id_seq'::regclass);


--
-- Name: lti_workouts id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lti_workouts ALTER COLUMN id SET DEFAULT nextval('public.lti_workouts_id_seq'::regclass);


--
-- Name: memberships id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.memberships ALTER COLUMN id SET DEFAULT nextval('public.memberships_id_seq'::regclass);


--
-- Name: multiple_choice_prompt_answers id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.multiple_choice_prompt_answers ALTER COLUMN id SET DEFAULT nextval('public.multiple_choice_prompt_answers_id_seq'::regclass);


--
-- Name: multiple_choice_prompts id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.multiple_choice_prompts ALTER COLUMN id SET DEFAULT nextval('public.multiple_choice_prompts_id_seq'::regclass);


--
-- Name: organization id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.organization ALTER COLUMN id SET DEFAULT nextval('public.organization_id_seq'::regclass);


--
-- Name: ownerships id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ownerships ALTER COLUMN id SET DEFAULT nextval('public.ownerships_id_seq'::regclass);


--
-- Name: prompt_answers id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.prompt_answers ALTER COLUMN id SET DEFAULT nextval('public.prompt_answers_id_seq'::regclass);


--
-- Name: prompts id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.prompts ALTER COLUMN id SET DEFAULT nextval('public.prompts_id_seq'::regclass);


--
-- Name: resource_files id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.resource_files ALTER COLUMN id SET DEFAULT nextval('public.resource_files_id_seq'::regclass);


--
-- Name: section id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.section ALTER COLUMN id SET DEFAULT nextval('public.section_id_seq'::regclass);


--
-- Name: signups id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.signups ALTER COLUMN id SET DEFAULT nextval('public.signups_id_seq'::regclass);


--
-- Name: stems id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stems ALTER COLUMN id SET DEFAULT nextval('public.stems_id_seq'::regclass);


--
-- Name: student_extensions id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.student_extensions ALTER COLUMN id SET DEFAULT nextval('public.student_extensions_id_seq'::regclass);


--
-- Name: submission id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.submission ALTER COLUMN id SET DEFAULT nextval('public.submission_id_seq'::regclass);


--
-- Name: tag_user_scores id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tag_user_scores ALTER COLUMN id SET DEFAULT nextval('public.tag_user_scores_id_seq'::regclass);


--
-- Name: taggings id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.taggings ALTER COLUMN id SET DEFAULT nextval('public.taggings_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: term id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.term ALTER COLUMN id SET DEFAULT nextval('public.term_id_seq'::regclass);


--
-- Name: test_case_results id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.test_case_results ALTER COLUMN id SET DEFAULT nextval('public.test_case_results_id_seq'::regclass);


--
-- Name: test_cases id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.test_cases ALTER COLUMN id SET DEFAULT nextval('public.test_cases_id_seq'::regclass);


--
-- Name: time_zones id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.time_zones ALTER COLUMN id SET DEFAULT nextval('public.time_zones_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Name: user_groups id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_groups ALTER COLUMN id SET DEFAULT nextval('public.user_groups_id_seq'::regclass);


--
-- Name: visualization_loggings id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.visualization_loggings ALTER COLUMN id SET DEFAULT nextval('public.visualization_loggings_id_seq'::regclass);


--
-- Name: workout_owners id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.workout_owners ALTER COLUMN id SET DEFAULT nextval('public.workout_owners_id_seq'::regclass);


--
-- Name: workout_policies id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.workout_policies ALTER COLUMN id SET DEFAULT nextval('public.workout_policies_id_seq'::regclass);


--
-- Name: active_admin_comments active_admin_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.active_admin_comments
    ADD CONSTRAINT active_admin_comments_pkey PRIMARY KEY (id);


--
-- Name: adonis_schema adonis_schema_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.adonis_schema
    ADD CONSTRAINT adonis_schema_pkey PRIMARY KEY (id);


--
-- Name: adonis_schema_versions adonis_schema_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.adonis_schema_versions
    ADD CONSTRAINT adonis_schema_versions_pkey PRIMARY KEY (version);


--
-- Name: assignment_offering assignment_offering_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.assignment_offering
    ADD CONSTRAINT assignment_offering_pkey PRIMARY KEY (id);


--
-- Name: assignment assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.assignment
    ADD CONSTRAINT assignment_pkey PRIMARY KEY (id);


--
-- Name: attempts attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.attempts
    ADD CONSTRAINT attempts_pkey PRIMARY KEY (id);


--
-- Name: auth_access_tokens auth_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.auth_access_tokens
    ADD CONSTRAINT auth_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: choices choices_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.choices
    ADD CONSTRAINT choices_pkey PRIMARY KEY (id);


--
-- Name: coding_prompt_answers coding_prompt_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.coding_prompt_answers
    ADD CONSTRAINT coding_prompt_answers_pkey PRIMARY KEY (id);


--
-- Name: coding_prompts coding_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.coding_prompts
    ADD CONSTRAINT coding_prompts_pkey PRIMARY KEY (id);


--
-- Name: course_enrollment course_enrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course_enrollment
    ADD CONSTRAINT course_enrollment_pkey PRIMARY KEY (id);


--
-- Name: course_exercises course_exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course_exercises
    ADD CONSTRAINT course_exercises_pkey PRIMARY KEY (id);


--
-- Name: course course_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_pkey PRIMARY KEY (id);


--
-- Name: course_role course_role_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course_role
    ADD CONSTRAINT course_role_pkey PRIMARY KEY (id);


--
-- Name: enqueued_job enqueued_job_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.enqueued_job
    ADD CONSTRAINT enqueued_job_pkey PRIMARY KEY (id);


--
-- Name: error error_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.error
    ADD CONSTRAINT error_pkey PRIMARY KEY (id);


--
-- Name: exercise_collections exercise_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_collections
    ADD CONSTRAINT exercise_collections_pkey PRIMARY KEY (id);


--
-- Name: exercise_families exercise_families_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_families
    ADD CONSTRAINT exercise_families_pkey PRIMARY KEY (id);


--
-- Name: exercise_owners exercise_owners_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_owners
    ADD CONSTRAINT exercise_owners_pkey PRIMARY KEY (id);


--
-- Name: exercise_versions exercise_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_versions
    ADD CONSTRAINT exercise_versions_pkey PRIMARY KEY (id);


--
-- Name: exercise_workouts exercise_workouts_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_workouts
    ADD CONSTRAINT exercise_workouts_pkey PRIMARY KEY (id);


--
-- Name: exercises exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_pkey PRIMARY KEY (id);


--
-- Name: friendly_id_slugs friendly_id_slugs_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.friendly_id_slugs
    ADD CONSTRAINT friendly_id_slugs_pkey PRIMARY KEY (id);


--
-- Name: global_role global_role_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.global_role
    ADD CONSTRAINT global_role_pkey PRIMARY KEY (id);


--
-- Name: grading_plugin grading_plugin_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.grading_plugin
    ADD CONSTRAINT grading_plugin_pkey PRIMARY KEY (id);


--
-- Name: group_access_requests group_access_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.group_access_requests
    ADD CONSTRAINT group_access_requests_pkey PRIMARY KEY (id);


--
-- Name: identity identity_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.identity
    ADD CONSTRAINT identity_pkey PRIMARY KEY (id);


--
-- Name: irt_data irt_data_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.irt_data
    ADD CONSTRAINT irt_data_pkey PRIMARY KEY (id);


--
-- Name: license_policies license_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.license_policies
    ADD CONSTRAINT license_policies_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);


--
-- Name: lis_result_id lis_result_id_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lis_result_id
    ADD CONSTRAINT lis_result_id_pkey PRIMARY KEY (id);


--
-- Name: lms_instance lms_instance_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lms_instance
    ADD CONSTRAINT lms_instance_pkey PRIMARY KEY (id);


--
-- Name: lms_type lms_type_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lms_type
    ADD CONSTRAINT lms_type_pkey PRIMARY KEY (id);


--
-- Name: lti_identity lti_identity_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lti_identity
    ADD CONSTRAINT lti_identity_pkey PRIMARY KEY (id);


--
-- Name: lti_workouts lti_workouts_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lti_workouts
    ADD CONSTRAINT lti_workouts_pkey PRIMARY KEY (id);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);


--
-- Name: multiple_choice_prompt_answers multiple_choice_prompt_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.multiple_choice_prompt_answers
    ADD CONSTRAINT multiple_choice_prompt_answers_pkey PRIMARY KEY (id);


--
-- Name: multiple_choice_prompts multiple_choice_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.multiple_choice_prompts
    ADD CONSTRAINT multiple_choice_prompts_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: ownerships ownerships_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ownerships
    ADD CONSTRAINT ownerships_pkey PRIMARY KEY (id);


--
-- Name: prompt_answers prompt_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.prompt_answers
    ADD CONSTRAINT prompt_answers_pkey PRIMARY KEY (id);


--
-- Name: prompts prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.prompts
    ADD CONSTRAINT prompts_pkey PRIMARY KEY (id);


--
-- Name: resource_files resource_files_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.resource_files
    ADD CONSTRAINT resource_files_pkey PRIMARY KEY (id);


--
-- Name: section section_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.section
    ADD CONSTRAINT section_pkey PRIMARY KEY (id);


--
-- Name: signups signups_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.signups
    ADD CONSTRAINT signups_pkey PRIMARY KEY (id);


--
-- Name: stems stems_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.stems
    ADD CONSTRAINT stems_pkey PRIMARY KEY (id);


--
-- Name: step_config step_config_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.step_config
    ADD CONSTRAINT step_config_pkey PRIMARY KEY (id);


--
-- Name: step step_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.step
    ADD CONSTRAINT step_pkey PRIMARY KEY (id);


--
-- Name: student_extensions student_extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.student_extensions
    ADD CONSTRAINT student_extensions_pkey PRIMARY KEY (id);


--
-- Name: submission submission_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.submission
    ADD CONSTRAINT submission_pkey PRIMARY KEY (id);


--
-- Name: submission_policy submission_policy_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.submission_policy
    ADD CONSTRAINT submission_policy_pkey PRIMARY KEY (id);


--
-- Name: submission_result submission_result_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.submission_result
    ADD CONSTRAINT submission_result_pkey PRIMARY KEY (correctness_score);


--
-- Name: tag_user_scores tag_user_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tag_user_scores
    ADD CONSTRAINT tag_user_scores_pkey PRIMARY KEY (id);


--
-- Name: taggings taggings_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.taggings
    ADD CONSTRAINT taggings_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: term term_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.term
    ADD CONSTRAINT term_pkey PRIMARY KEY (id);


--
-- Name: test_case_results test_case_results_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.test_case_results
    ADD CONSTRAINT test_case_results_pkey PRIMARY KEY (id);


--
-- Name: test_cases test_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_pkey PRIMARY KEY (id);


--
-- Name: time_zones time_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.time_zones
    ADD CONSTRAINT time_zones_pkey PRIMARY KEY (id);


--
-- Name: user user_email_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_unique UNIQUE (email);


--
-- Name: user_groups user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: visualization_loggings visualization_loggings_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.visualization_loggings
    ADD CONSTRAINT visualization_loggings_pkey PRIMARY KEY (id);


--
-- Name: workout_owners workout_owners_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.workout_owners
    ADD CONSTRAINT workout_owners_pkey PRIMARY KEY (id);


--
-- Name: workout_policies workout_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.workout_policies
    ADD CONSTRAINT workout_policies_pkey PRIMARY KEY (id);


--
-- Name: assignment_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX assignment_id ON public.step USING btree (assignment_id);


--
-- Name: attempts_tag_user_scores_tag_user_score_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX attempts_tag_user_scores_tag_user_score_id_fk ON public.attempts_tag_user_scores USING btree (tag_user_score_id);


--
-- Name: choices_MC_prompt_answers_MC_prompt_answer_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "choices_MC_prompt_answers_MC_prompt_answer_id_fk" ON public.choices_multiple_choice_prompt_answers USING btree (multiple_choice_prompt_answer_id);


--
-- Name: course_exercises_course_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX course_exercises_course_id_fk ON public.course_exercises USING btree (course_id);


--
-- Name: course_exercises_exercise_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX course_exercises_exercise_id_fk ON public.course_exercises USING btree (exercise_id);


--
-- Name: exercise_owners_owner_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX exercise_owners_owner_id_fk ON public.exercise_owners USING btree (owner_id);


--
-- Name: exercise_versions_creator_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX exercise_versions_creator_id_fk ON public.exercise_versions USING btree (creator_id);


--
-- Name: exercise_versions_irt_data_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX exercise_versions_irt_data_id_fk ON public.exercise_versions USING btree (irt_data_id);


--
-- Name: exercise_workouts_exercise_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX exercise_workouts_exercise_id_fk ON public.exercise_workouts USING btree (exercise_id);


--
-- Name: exercise_workouts_workout_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX exercise_workouts_workout_id_fk ON public.exercise_workouts USING btree (workout_id);


--
-- Name: exercises_irt_data_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX exercises_irt_data_id_fk ON public.exercises USING btree (irt_data_id);


--
-- Name: grading_plugin_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX grading_plugin_id ON public.step USING btree (grading_plugin_id);


--
-- Name: grading_plugin_user_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX grading_plugin_user_id_fk ON public.grading_plugin USING btree (user_id);


--
-- Name: idx_attempts_on_user_exercise_version; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX idx_attempts_on_user_exercise_version ON public.attempts USING btree (user_id, exercise_version_id);


--
-- Name: idx_attempts_on_workout_score_exercise_version; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX idx_attempts_on_workout_score_exercise_version ON public.attempts USING btree (workout_score_id, exercise_version_id);


--
-- Name: idx_ws_on_user_workout_workout_offering; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX idx_ws_on_user_workout_workout_offering ON public.submission USING btree (user_id, workout_id, assignment_offering_id);


--
-- Name: index_active_admin_comments_on_author_type_and_author_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_active_admin_comments_on_author_type_and_author_id ON public.active_admin_comments USING btree (author_type, author_id);


--
-- Name: index_active_admin_comments_on_namespace; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_active_admin_comments_on_namespace ON public.active_admin_comments USING btree (namespace);


--
-- Name: index_active_admin_comments_on_resource_type_and_resource_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_active_admin_comments_on_resource_type_and_resource_id ON public.active_admin_comments USING btree (resource_type, resource_id);


--
-- Name: index_attempts_on_active_score_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_attempts_on_active_score_id ON public.attempts USING btree (active_score_id);


--
-- Name: index_attempts_on_exercise_version_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_attempts_on_exercise_version_id ON public.attempts USING btree (exercise_version_id);


--
-- Name: index_attempts_on_user_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_attempts_on_user_id ON public.attempts USING btree (user_id);


--
-- Name: index_attempts_on_workout_score_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_attempts_on_workout_score_id ON public.attempts USING btree (workout_score_id);


--
-- Name: index_choices_on_multiple_choice_prompt_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_choices_on_multiple_choice_prompt_id ON public.choices USING btree (multiple_choice_prompt_id);


--
-- Name: index_course_enrollments_on_course_offering_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_course_enrollments_on_course_offering_id ON public.course_enrollment USING btree (course_offering_id);


--
-- Name: index_course_enrollments_on_course_role_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_course_enrollments_on_course_role_id ON public.course_enrollment USING btree (course_role_id);


--
-- Name: index_course_enrollments_on_user_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_course_enrollments_on_user_id ON public.course_enrollment USING btree (user_id);


--
-- Name: index_course_offerings_on_course_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_course_offerings_on_course_id ON public.section USING btree (course_id);


--
-- Name: index_course_offerings_on_lms_instance_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_course_offerings_on_lms_instance_id ON public.section USING btree (lms_instance_id);


--
-- Name: index_course_offerings_on_term_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_course_offerings_on_term_id ON public.section USING btree (term_id);


--
-- Name: index_courses_on_organization_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_courses_on_organization_id ON public.course USING btree (organization_id);


--
-- Name: index_courses_on_slug; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_courses_on_slug ON public.course USING btree (slug);


--
-- Name: index_courses_on_user_group_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_courses_on_user_group_id ON public.course USING btree (user_group_id);


--
-- Name: index_errors_on_class_name; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_errors_on_class_name ON public.error USING btree (class_name);


--
-- Name: index_errors_on_created_at; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_errors_on_created_at ON public.error USING btree (created_at);


--
-- Name: index_exercise_collections_on_course_offering_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_exercise_collections_on_course_offering_id ON public.exercise_collections USING btree (course_offering_id);


--
-- Name: index_exercise_collections_on_license_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_exercise_collections_on_license_id ON public.exercise_collections USING btree (license_id);


--
-- Name: index_exercise_collections_on_user_group_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_exercise_collections_on_user_group_id ON public.exercise_collections USING btree (user_group_id);


--
-- Name: index_exercise_collections_on_user_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_exercise_collections_on_user_id ON public.exercise_collections USING btree (user_id);


--
-- Name: index_exercise_versions_on_exercise_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_exercise_versions_on_exercise_id ON public.exercise_versions USING btree (exercise_id);


--
-- Name: index_exercise_versions_on_stem_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_exercise_versions_on_stem_id ON public.exercise_versions USING btree (stem_id);


--
-- Name: index_exercise_versions_resource_files_on_exercise_version_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_exercise_versions_resource_files_on_exercise_version_id ON public.exercise_versions_resource_files USING btree (exercise_version_id);


--
-- Name: index_exercise_versions_resource_files_on_resource_file_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_exercise_versions_resource_files_on_resource_file_id ON public.exercise_versions_resource_files USING btree (resource_file_id);


--
-- Name: index_exercises_on_current_version_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_exercises_on_current_version_id ON public.exercises USING btree (current_version_id);


--
-- Name: index_exercises_on_exercise_collection_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_exercises_on_exercise_collection_id ON public.exercises USING btree (exercise_collection_id);


--
-- Name: index_exercises_on_exercise_family_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_exercises_on_exercise_family_id ON public.exercises USING btree (exercise_family_id);


--
-- Name: index_exercises_on_is_public; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_exercises_on_is_public ON public.exercises USING btree (is_public);


--
-- Name: index_friendly_id_slugs_on_slug_and_sluggable_type; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_friendly_id_slugs_on_slug_and_sluggable_type ON public.friendly_id_slugs USING btree (slug, sluggable_type);


--
-- Name: index_friendly_id_slugs_on_sluggable_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_friendly_id_slugs_on_sluggable_id ON public.friendly_id_slugs USING btree (sluggable_id);


--
-- Name: index_friendly_id_slugs_on_sluggable_type; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_friendly_id_slugs_on_sluggable_type ON public.friendly_id_slugs USING btree (sluggable_type);


--
-- Name: index_group_access_requests_on_user_group_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_group_access_requests_on_user_group_id ON public.group_access_requests USING btree (user_group_id);


--
-- Name: index_group_access_requests_on_user_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_group_access_requests_on_user_id ON public.group_access_requests USING btree (user_id);


--
-- Name: index_identities_on_uid_and_provider; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_identities_on_uid_and_provider ON public.identity USING btree (uid, provider);


--
-- Name: index_identities_on_user_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_identities_on_user_id ON public.identity USING btree (user_id);


--
-- Name: index_licenses_on_license_policy_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_licenses_on_license_policy_id ON public.licenses USING btree (license_policy_id);


--
-- Name: index_lms_instances_on_organization_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_lms_instances_on_organization_id ON public.lms_instance USING btree (organization_id);


--
-- Name: index_lti_identities_on_lms_instance_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_lti_identities_on_lms_instance_id ON public.lti_identity USING btree (lms_instance_id);


--
-- Name: index_lti_identities_on_lti_user_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_lti_identities_on_lti_user_id ON public.lti_identity USING btree (lti_user_id);


--
-- Name: index_lti_identities_on_user_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_lti_identities_on_user_id ON public.lti_identity USING btree (user_id);


--
-- Name: index_lti_workouts_on_lms_instance_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_lti_workouts_on_lms_instance_id ON public.lti_workouts USING btree (lms_instance_id);


--
-- Name: index_lti_workouts_on_workout_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_lti_workouts_on_workout_id ON public.lti_workouts USING btree (workout_id);


--
-- Name: index_ownerships_on_exercise_version_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_ownerships_on_exercise_version_id ON public.ownerships USING btree (exercise_version_id);


--
-- Name: index_ownerships_on_filename; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_ownerships_on_filename ON public.ownerships USING btree (filename);


--
-- Name: index_ownerships_on_resource_file_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_ownerships_on_resource_file_id ON public.ownerships USING btree (resource_file_id);


--
-- Name: index_prompt_answers_on_actable_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_prompt_answers_on_actable_id ON public.prompt_answers USING btree (actable_id);


--
-- Name: index_prompt_answers_on_attempt_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_prompt_answers_on_attempt_id ON public.prompt_answers USING btree (attempt_id);


--
-- Name: index_prompt_answers_on_prompt_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_prompt_answers_on_prompt_id ON public.prompt_answers USING btree (prompt_id);


--
-- Name: index_prompts_on_actable_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_prompts_on_actable_id ON public.prompts USING btree (actable_id);


--
-- Name: index_prompts_on_exercise_version_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_prompts_on_exercise_version_id ON public.prompts USING btree (exercise_version_id);


--
-- Name: index_resource_files_on_hashval; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_resource_files_on_hashval ON public.resource_files USING btree (hashval);


--
-- Name: index_resource_files_on_token; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_resource_files_on_token ON public.resource_files USING btree (token);


--
-- Name: index_resource_files_on_user_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_resource_files_on_user_id ON public.resource_files USING btree (user_id);


--
-- Name: index_student_extensions_on_user_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_student_extensions_on_user_id ON public.student_extensions USING btree (user_id);


--
-- Name: index_student_extensions_on_workout_offering_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_student_extensions_on_workout_offering_id ON public.student_extensions USING btree (workout_offering_id);


--
-- Name: index_tag_user_scores_on_user_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_tag_user_scores_on_user_id ON public.tag_user_scores USING btree (user_id);


--
-- Name: index_taggings_on_context; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_taggings_on_context ON public.taggings USING btree (context);


--
-- Name: index_taggings_on_tag_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_taggings_on_tag_id ON public.taggings USING btree (tag_id);


--
-- Name: index_taggings_on_taggable_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_taggings_on_taggable_id ON public.taggings USING btree (taggable_id);


--
-- Name: index_taggings_on_taggable_id_and_taggable_type_and_context; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_taggings_on_taggable_id_and_taggable_type_and_context ON public.taggings USING btree (taggable_id, taggable_type, context);


--
-- Name: index_taggings_on_taggable_type; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_taggings_on_taggable_type ON public.taggings USING btree (taggable_type);


--
-- Name: index_taggings_on_tagger_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_taggings_on_tagger_id ON public.taggings USING btree (tagger_id);


--
-- Name: index_taggings_on_tagger_id_and_tagger_type; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_taggings_on_tagger_id_and_tagger_type ON public.taggings USING btree (tagger_id, tagger_type);


--
-- Name: index_terms_on_year_and_season; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_terms_on_year_and_season ON public.term USING btree (year, season);


--
-- Name: index_test_case_results_on_coding_prompt_answer_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_test_case_results_on_coding_prompt_answer_id ON public.test_case_results USING btree (coding_prompt_answer_id);


--
-- Name: index_test_case_results_on_test_case_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_test_case_results_on_test_case_id ON public.test_case_results USING btree (test_case_id);


--
-- Name: index_test_case_results_on_user_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_test_case_results_on_user_id ON public.test_case_results USING btree (user_id);


--
-- Name: index_test_cases_on_coding_prompt_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_test_cases_on_coding_prompt_id ON public.test_cases USING btree (coding_prompt_id);


--
-- Name: index_users_on_global_role_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_users_on_global_role_id ON public."user" USING btree (global_role_id);


--
-- Name: index_users_on_time_zone_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_users_on_time_zone_id ON public."user" USING btree (time_zone_id);


--
-- Name: index_visualization_loggings_on_exercise_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_visualization_loggings_on_exercise_id ON public.visualization_loggings USING btree (exercise_id);


--
-- Name: index_visualization_loggings_on_user_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_visualization_loggings_on_user_id ON public.visualization_loggings USING btree (user_id);


--
-- Name: index_visualization_loggings_on_workout_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_visualization_loggings_on_workout_id ON public.visualization_loggings USING btree (workout_id);


--
-- Name: index_visualization_loggings_on_workout_offering_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_visualization_loggings_on_workout_offering_id ON public.visualization_loggings USING btree (workout_offering_id);


--
-- Name: index_workout_offerings_on_course_offering_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_workout_offerings_on_course_offering_id ON public.assignment_offering USING btree (course_offering_id);


--
-- Name: index_workout_offerings_on_lms_assignment_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_workout_offerings_on_lms_assignment_id ON public.assignment_offering USING btree (lms_assignment_id);


--
-- Name: index_workout_offerings_on_workout_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_workout_offerings_on_workout_id ON public.assignment_offering USING btree (assignment_id);


--
-- Name: index_workout_offerings_on_workout_policy_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_workout_offerings_on_workout_policy_id ON public.assignment_offering USING btree (workout_policy_id);


--
-- Name: index_workout_scores_on_lti_workout_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_workout_scores_on_lti_workout_id ON public.submission USING btree (lti_workout_id);


--
-- Name: index_workout_scores_on_user_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_workout_scores_on_user_id ON public.submission USING btree (user_id);


--
-- Name: index_workout_scores_on_workout_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_workout_scores_on_workout_id ON public.submission USING btree (workout_id);


--
-- Name: index_workouts_on_is_public; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX index_workouts_on_is_public ON public.assignment USING btree (is_public);


--
-- Name: lms_instances_lms_type_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX lms_instances_lms_type_id_fk ON public.lms_instance USING btree (lms_type_id);


--
-- Name: prompts_irt_data_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX prompts_irt_data_id_fk ON public.prompts USING btree (irt_data_id);


--
-- Name: step_config_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX step_config_id ON public.step USING btree (step_config_id);


--
-- Name: step_config_user_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX step_config_user_id_fk ON public.step_config USING btree (user_id);


--
-- Name: submission_policy_user_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX submission_policy_user_id_fk ON public.submission_policy USING btree (user_id);


--
-- Name: workout_offerings_continue_from_workout_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX workout_offerings_continue_from_workout_id_fk ON public.assignment_offering USING btree (continue_from_workout_id);


--
-- Name: workout_owners_owner_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX workout_owners_owner_id_fk ON public.workout_owners USING btree (owner_id);


--
-- Name: workout_scores_workout_offering_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX workout_scores_workout_offering_id_fk ON public.submission USING btree (assignment_offering_id);


--
-- Name: workouts_creator_id_fk; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX workouts_creator_id_fk ON public.assignment USING btree (user_id);


--
-- Name: assignment_offering assignment_offering_assignment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.assignment_offering
    ADD CONSTRAINT assignment_offering_assignment_id_foreign FOREIGN KEY (assignment_id) REFERENCES public.assignment(id);


--
-- Name: assignment_offering assignment_offering_continue_from_workout_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.assignment_offering
    ADD CONSTRAINT assignment_offering_continue_from_workout_id_foreign FOREIGN KEY (continue_from_workout_id) REFERENCES public.assignment_offering(id);


--
-- Name: assignment_offering assignment_offering_course_offering_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.assignment_offering
    ADD CONSTRAINT assignment_offering_course_offering_id_foreign FOREIGN KEY (course_offering_id) REFERENCES public.section(id);


--
-- Name: assignment_offering assignment_offering_workout_policy_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.assignment_offering
    ADD CONSTRAINT assignment_offering_workout_policy_id_foreign FOREIGN KEY (workout_policy_id) REFERENCES public.workout_policies(id);


--
-- Name: assignment assignment_submission_policy_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.assignment
    ADD CONSTRAINT assignment_submission_policy_id_foreign FOREIGN KEY (submission_policy_id) REFERENCES public.submission_policy(id);


--
-- Name: assignment assignment_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.assignment
    ADD CONSTRAINT assignment_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: attempts attempts_active_score_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.attempts
    ADD CONSTRAINT attempts_active_score_id_foreign FOREIGN KEY (active_score_id) REFERENCES public.submission(id);


--
-- Name: attempts attempts_exercise_version_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.attempts
    ADD CONSTRAINT attempts_exercise_version_id_foreign FOREIGN KEY (exercise_version_id) REFERENCES public.exercise_versions(id);


--
-- Name: attempts_tag_user_scores attempts_tag_user_scores_attempt_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.attempts_tag_user_scores
    ADD CONSTRAINT attempts_tag_user_scores_attempt_id_foreign FOREIGN KEY (attempt_id) REFERENCES public.attempts(id);


--
-- Name: attempts_tag_user_scores attempts_tag_user_scores_tag_user_score_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.attempts_tag_user_scores
    ADD CONSTRAINT attempts_tag_user_scores_tag_user_score_id_foreign FOREIGN KEY (tag_user_score_id) REFERENCES public.tag_user_scores(id);


--
-- Name: attempts attempts_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.attempts
    ADD CONSTRAINT attempts_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: attempts attempts_workout_score_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.attempts
    ADD CONSTRAINT attempts_workout_score_id_foreign FOREIGN KEY (workout_score_id) REFERENCES public.submission(id);


--
-- Name: auth_access_tokens auth_access_tokens_tokenable_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.auth_access_tokens
    ADD CONSTRAINT auth_access_tokens_tokenable_id_foreign FOREIGN KEY (tokenable_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: choices_multiple_choice_prompt_answers choices_multiple_choice_prompt_answers_choice_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.choices_multiple_choice_prompt_answers
    ADD CONSTRAINT choices_multiple_choice_prompt_answers_choice_id_foreign FOREIGN KEY (choice_id) REFERENCES public.choices(id);


--
-- Name: choices_multiple_choice_prompt_answers choices_multiple_choice_prompt_answers_multiple_choice_prompt_a; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.choices_multiple_choice_prompt_answers
    ADD CONSTRAINT choices_multiple_choice_prompt_answers_multiple_choice_prompt_a FOREIGN KEY (multiple_choice_prompt_answer_id) REFERENCES public.multiple_choice_prompt_answers(id);


--
-- Name: choices choices_multiple_choice_prompt_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.choices
    ADD CONSTRAINT choices_multiple_choice_prompt_id_foreign FOREIGN KEY (multiple_choice_prompt_id) REFERENCES public.multiple_choice_prompts(id);


--
-- Name: course course_creator_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_creator_id_foreign FOREIGN KEY (creator_id) REFERENCES public."user"(id);


--
-- Name: course_enrollment course_enrollment_course_offering_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course_enrollment
    ADD CONSTRAINT course_enrollment_course_offering_id_foreign FOREIGN KEY (course_offering_id) REFERENCES public.section(id);


--
-- Name: course_enrollment course_enrollment_course_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course_enrollment
    ADD CONSTRAINT course_enrollment_course_role_id_foreign FOREIGN KEY (course_role_id) REFERENCES public.course_role(id);


--
-- Name: course_enrollment course_enrollment_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course_enrollment
    ADD CONSTRAINT course_enrollment_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: course_exercises course_exercises_course_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course_exercises
    ADD CONSTRAINT course_exercises_course_id_foreign FOREIGN KEY (course_id) REFERENCES public.course(id);


--
-- Name: course_exercises course_exercises_exercise_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course_exercises
    ADD CONSTRAINT course_exercises_exercise_id_foreign FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);


--
-- Name: course course_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: course course_user_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_user_group_id_foreign FOREIGN KEY (user_group_id) REFERENCES public.user_groups(id);


--
-- Name: enqueued_job enqueued_job_submission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.enqueued_job
    ADD CONSTRAINT enqueued_job_submission_id_foreign FOREIGN KEY (submission_id) REFERENCES public.submission(id);


--
-- Name: exercise_collections exercise_collections_course_offering_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_collections
    ADD CONSTRAINT exercise_collections_course_offering_id_foreign FOREIGN KEY (course_offering_id) REFERENCES public.section(id);


--
-- Name: exercise_collections exercise_collections_license_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_collections
    ADD CONSTRAINT exercise_collections_license_id_foreign FOREIGN KEY (license_id) REFERENCES public.licenses(id);


--
-- Name: exercise_collections exercise_collections_user_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_collections
    ADD CONSTRAINT exercise_collections_user_group_id_foreign FOREIGN KEY (user_group_id) REFERENCES public.user_groups(id);


--
-- Name: exercise_collections exercise_collections_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_collections
    ADD CONSTRAINT exercise_collections_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: exercise_owners exercise_owners_exercise_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_owners
    ADD CONSTRAINT exercise_owners_exercise_id_foreign FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);


--
-- Name: exercise_owners exercise_owners_owner_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_owners
    ADD CONSTRAINT exercise_owners_owner_id_foreign FOREIGN KEY (owner_id) REFERENCES public."user"(id);


--
-- Name: exercise_versions exercise_versions_creator_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_versions
    ADD CONSTRAINT exercise_versions_creator_id_foreign FOREIGN KEY (creator_id) REFERENCES public."user"(id);


--
-- Name: exercise_versions exercise_versions_exercise_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_versions
    ADD CONSTRAINT exercise_versions_exercise_id_foreign FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);


--
-- Name: exercise_versions exercise_versions_irt_data_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_versions
    ADD CONSTRAINT exercise_versions_irt_data_id_foreign FOREIGN KEY (irt_data_id) REFERENCES public.irt_data(id);


--
-- Name: exercise_versions_resource_files exercise_versions_resource_files_exercise_version_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_versions_resource_files
    ADD CONSTRAINT exercise_versions_resource_files_exercise_version_id_foreign FOREIGN KEY (exercise_version_id) REFERENCES public.exercise_versions(id);


--
-- Name: exercise_versions_resource_files exercise_versions_resource_files_resource_file_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_versions_resource_files
    ADD CONSTRAINT exercise_versions_resource_files_resource_file_id_foreign FOREIGN KEY (resource_file_id) REFERENCES public.resource_files(id);


--
-- Name: exercise_versions exercise_versions_stem_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_versions
    ADD CONSTRAINT exercise_versions_stem_id_foreign FOREIGN KEY (stem_id) REFERENCES public.stems(id);


--
-- Name: exercise_workouts exercise_workouts_exercise_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_workouts
    ADD CONSTRAINT exercise_workouts_exercise_id_foreign FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);


--
-- Name: exercise_workouts exercise_workouts_workout_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercise_workouts
    ADD CONSTRAINT exercise_workouts_workout_id_foreign FOREIGN KEY (workout_id) REFERENCES public.assignment(id);


--
-- Name: exercises exercises_exercise_collection_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_exercise_collection_id_foreign FOREIGN KEY (exercise_collection_id) REFERENCES public.exercise_collections(id);


--
-- Name: exercises exercises_exercise_family_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_exercise_family_id_foreign FOREIGN KEY (exercise_family_id) REFERENCES public.exercise_families(id);


--
-- Name: exercises exercises_irt_data_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_irt_data_id_foreign FOREIGN KEY (irt_data_id) REFERENCES public.irt_data(id);


--
-- Name: organization fk_organization_lms_instance; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT fk_organization_lms_instance FOREIGN KEY (id) REFERENCES public.lms_instance(id);


--
-- Name: grading_plugin grading_plugin_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.grading_plugin
    ADD CONSTRAINT grading_plugin_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: group_access_requests group_access_requests_user_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.group_access_requests
    ADD CONSTRAINT group_access_requests_user_group_id_foreign FOREIGN KEY (user_group_id) REFERENCES public.user_groups(id);


--
-- Name: group_access_requests group_access_requests_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.group_access_requests
    ADD CONSTRAINT group_access_requests_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: identity identity_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.identity
    ADD CONSTRAINT identity_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: licenses licenses_license_policy_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_license_policy_id_foreign FOREIGN KEY (license_policy_id) REFERENCES public.license_policies(id);


--
-- Name: lis_result_id lis_result_id_assignment_offering_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lis_result_id
    ADD CONSTRAINT lis_result_id_assignment_offering_id_foreign FOREIGN KEY (assignment_offering_id) REFERENCES public.assignment_offering(id);


--
-- Name: lis_result_id lis_result_id_lms_instance_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lis_result_id
    ADD CONSTRAINT lis_result_id_lms_instance_id_foreign FOREIGN KEY (lms_instance_id) REFERENCES public.lms_instance(id);


--
-- Name: lis_result_id lis_result_id_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lis_result_id
    ADD CONSTRAINT lis_result_id_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: lms_instance lms_instance_lms_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lms_instance
    ADD CONSTRAINT lms_instance_lms_type_id_foreign FOREIGN KEY (lms_type_id) REFERENCES public.lms_type(id);


--
-- Name: lms_instance lms_instance_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lms_instance
    ADD CONSTRAINT lms_instance_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: lti_identity lti_identity_lms_instance_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lti_identity
    ADD CONSTRAINT lti_identity_lms_instance_id_foreign FOREIGN KEY (lms_instance_id) REFERENCES public.lms_instance(id);


--
-- Name: lti_identity lti_identity_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lti_identity
    ADD CONSTRAINT lti_identity_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: lti_workouts lti_workouts_lms_instance_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.lti_workouts
    ADD CONSTRAINT lti_workouts_lms_instance_id_foreign FOREIGN KEY (lms_instance_id) REFERENCES public.lms_instance(id);


--
-- Name: memberships memberships_user_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_user_group_id_foreign FOREIGN KEY (user_group_id) REFERENCES public.user_groups(id);


--
-- Name: memberships memberships_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: ownerships ownerships_exercise_version_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ownerships
    ADD CONSTRAINT ownerships_exercise_version_id_foreign FOREIGN KEY (exercise_version_id) REFERENCES public.exercise_versions(id);


--
-- Name: ownerships ownerships_resource_file_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ownerships
    ADD CONSTRAINT ownerships_resource_file_id_foreign FOREIGN KEY (resource_file_id) REFERENCES public.resource_files(id);


--
-- Name: prompt_answers prompt_answers_attempt_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.prompt_answers
    ADD CONSTRAINT prompt_answers_attempt_id_foreign FOREIGN KEY (attempt_id) REFERENCES public.attempts(id);


--
-- Name: prompt_answers prompt_answers_prompt_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.prompt_answers
    ADD CONSTRAINT prompt_answers_prompt_id_foreign FOREIGN KEY (prompt_id) REFERENCES public.prompts(id);


--
-- Name: prompts prompts_exercise_version_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.prompts
    ADD CONSTRAINT prompts_exercise_version_id_foreign FOREIGN KEY (exercise_version_id) REFERENCES public.exercise_versions(id);


--
-- Name: prompts prompts_irt_data_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.prompts
    ADD CONSTRAINT prompts_irt_data_id_foreign FOREIGN KEY (irt_data_id) REFERENCES public.irt_data(id);


--
-- Name: resource_files resource_files_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.resource_files
    ADD CONSTRAINT resource_files_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: section section_course_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.section
    ADD CONSTRAINT section_course_id_foreign FOREIGN KEY (course_id) REFERENCES public.course(id);


--
-- Name: section section_lms_instance_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.section
    ADD CONSTRAINT section_lms_instance_id_foreign FOREIGN KEY (lms_instance_id) REFERENCES public.lms_instance(id);


--
-- Name: section section_term_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.section
    ADD CONSTRAINT section_term_id_foreign FOREIGN KEY (term_id) REFERENCES public.term(id);


--
-- Name: step step_assignment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.step
    ADD CONSTRAINT step_assignment_id_foreign FOREIGN KEY (assignment_id) REFERENCES public.assignment(id);


--
-- Name: step_config step_config_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.step_config
    ADD CONSTRAINT step_config_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: step step_grading_plugin_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.step
    ADD CONSTRAINT step_grading_plugin_id_foreign FOREIGN KEY (grading_plugin_id) REFERENCES public.grading_plugin(id);


--
-- Name: step step_step_config_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.step
    ADD CONSTRAINT step_step_config_id_foreign FOREIGN KEY (step_config_id) REFERENCES public.step_config(id);


--
-- Name: student_extensions student_extensions_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.student_extensions
    ADD CONSTRAINT student_extensions_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: student_extensions student_extensions_workout_offering_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.student_extensions
    ADD CONSTRAINT student_extensions_workout_offering_id_foreign FOREIGN KEY (workout_offering_id) REFERENCES public.assignment_offering(id);


--
-- Name: submission submission_assignment_offering_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.submission
    ADD CONSTRAINT submission_assignment_offering_id_foreign FOREIGN KEY (assignment_offering_id) REFERENCES public.assignment_offering(id);


--
-- Name: submission submission_lti_workout_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.submission
    ADD CONSTRAINT submission_lti_workout_id_foreign FOREIGN KEY (lti_workout_id) REFERENCES public.lti_workouts(id);


--
-- Name: submission_policy submission_policy_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.submission_policy
    ADD CONSTRAINT submission_policy_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: submission submission_primary_submission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.submission
    ADD CONSTRAINT submission_primary_submission_id_foreign FOREIGN KEY (primary_submission_id) REFERENCES public.submission(id);


--
-- Name: submission submission_submission_result_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.submission
    ADD CONSTRAINT submission_submission_result_id_foreign FOREIGN KEY (submission_result_id) REFERENCES public.submission_result(correctness_score);


--
-- Name: submission submission_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.submission
    ADD CONSTRAINT submission_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: submission submission_workout_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.submission
    ADD CONSTRAINT submission_workout_id_foreign FOREIGN KEY (workout_id) REFERENCES public.assignment(id);


--
-- Name: tag_user_scores tag_user_scores_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.tag_user_scores
    ADD CONSTRAINT tag_user_scores_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: taggings taggings_tag_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.taggings
    ADD CONSTRAINT taggings_tag_id_foreign FOREIGN KEY (tag_id) REFERENCES public.tags(id);


--
-- Name: test_case_results test_case_results_coding_prompt_answer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.test_case_results
    ADD CONSTRAINT test_case_results_coding_prompt_answer_id_foreign FOREIGN KEY (coding_prompt_answer_id) REFERENCES public.coding_prompt_answers(id);


--
-- Name: test_case_results test_case_results_test_case_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.test_case_results
    ADD CONSTRAINT test_case_results_test_case_id_foreign FOREIGN KEY (test_case_id) REFERENCES public.test_cases(id);


--
-- Name: test_case_results test_case_results_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.test_case_results
    ADD CONSTRAINT test_case_results_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: test_cases test_cases_coding_prompt_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_coding_prompt_id_foreign FOREIGN KEY (coding_prompt_id) REFERENCES public.coding_prompts(id);


--
-- Name: user user_global_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_global_role_id_foreign FOREIGN KEY (global_role_id) REFERENCES public.global_role(id);


--
-- Name: user user_time_zone_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_time_zone_id_foreign FOREIGN KEY (time_zone_id) REFERENCES public.time_zones(id);


--
-- Name: visualization_loggings visualization_loggings_exercise_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.visualization_loggings
    ADD CONSTRAINT visualization_loggings_exercise_id_foreign FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);


--
-- Name: visualization_loggings visualization_loggings_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.visualization_loggings
    ADD CONSTRAINT visualization_loggings_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: workout_owners workout_owners_owner_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.workout_owners
    ADD CONSTRAINT workout_owners_owner_id_foreign FOREIGN KEY (owner_id) REFERENCES public."user"(id);


--
-- Name: workout_owners workout_owners_workout_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.workout_owners
    ADD CONSTRAINT workout_owners_workout_id_foreign FOREIGN KEY (workout_id) REFERENCES public.assignment(id);


--
-- PostgreSQL database dump complete
--

\unrestrict rCx8LEh8BGNytVOf4dhSnY7SZgbqlRkHoob1qvv3QyoJ2Ck0lPdhx6pr2kHaQD3

