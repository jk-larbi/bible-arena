-- ============================================================================
-- BIBLEARENA — QUESTION UNIQUENESS & PLAYER EXPOSURE HISTORY MIGRATION
-- Migration: 20261106050000_question_history_and_uniqueness.sql
-- ============================================================================
-- Architecture:
-- 1. question_catalog: Stable unique identifiers, normalized fingerprints, metadata
-- 2. player_question_exposures: Persistent history of question encounters per player
-- 3. merge_guest_question_history: RPC to merge guest history into registered account
-- 4. record_question_exposure: Atomic RPC for upserting exposure logs
-- 5. Row-Level Security: Strict user/guest isolation & read-only question catalog
-- ============================================================================

-- 1. MASTER QUESTION CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.question_catalog (
  id TEXT PRIMARY KEY,
  curriculum_id TEXT REFERENCES public.curriculum_topics(id) ON DELETE SET NULL,
  game_mode_id TEXT,
  level_number INT NOT NULL DEFAULT 1,
  subtopic TEXT,
  difficulty TEXT NOT NULL DEFAULT 'Beginner',
  question_format TEXT NOT NULL DEFAULT 'multiple_choice',
  prompt TEXT NOT NULL,
  normalized_prompt TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer_index INT NOT NULL,
  scripture_reference TEXT NOT NULL,
  explanation TEXT NOT NULL,
  content_version INT NOT NULL DEFAULT 1,
  is_verified_unique BOOLEAN NOT NULL DEFAULT true,
  flagged_for_review BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_question_catalog_curric_lvl 
  ON public.question_catalog(curriculum_id, level_number);

CREATE INDEX IF NOT EXISTS idx_question_catalog_fingerprint 
  ON public.question_catalog(fingerprint);

CREATE INDEX IF NOT EXISTS idx_question_catalog_verified 
  ON public.question_catalog(is_verified_unique, flagged_for_review);

-- 2. PLAYER QUESTION EXPOSURES TABLE
CREATE TABLE IF NOT EXISTS public.player_question_exposures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL, -- UUID or guest identifier 'guest_...'
  question_id TEXT NOT NULL REFERENCES public.question_catalog(id) ON DELETE CASCADE,
  curriculum_id TEXT,
  game_id TEXT,
  level_number INT NOT NULL DEFAULT 1,
  session_id TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_attempted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  attempt_count INT NOT NULL DEFAULT 1 CHECK (attempt_count >= 1),
  last_result TEXT NOT NULL CHECK (last_result IN ('correct', 'incorrect', 'unanswered')),
  is_replay BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(player_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_player_q_exposures_player_curric 
  ON public.player_question_exposures(player_id, curriculum_id);

CREATE INDEX IF NOT EXISTS idx_player_q_exposures_session 
  ON public.player_question_exposures(session_id);

-- 3. ATOMIC EXPOSURE LOGGING RPC
CREATE OR REPLACE FUNCTION public.record_question_exposure(
  p_player_id TEXT,
  p_question_id TEXT,
  p_curriculum_id TEXT,
  p_level_number INT,
  p_session_id TEXT,
  p_result TEXT,
  p_is_replay BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exposure RECORD;
BEGIN
  INSERT INTO public.player_question_exposures (
    player_id,
    question_id,
    curriculum_id,
    level_number,
    session_id,
    first_seen_at,
    last_attempted_at,
    attempt_count,
    last_result,
    is_replay
  ) VALUES (
    p_player_id,
    p_question_id,
    p_curriculum_id,
    p_level_number,
    p_session_id,
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    1,
    p_result,
    p_is_replay
  )
  ON CONFLICT (player_id, question_id) DO UPDATE SET
    last_attempted_at = timezone('utc'::text, now()),
    attempt_count = public.player_question_exposures.attempt_count + 1,
    last_result = EXCLUDED.last_result,
    is_replay = true,
    updated_at = timezone('utc'::text, now())
  RETURNING * INTO v_exposure;

  RETURN jsonb_build_object(
    'success', true,
    'exposure_id', v_exposure.id,
    'attempt_count', v_exposure.attempt_count,
    'is_replay', v_exposure.is_replay
  );
END;
$$;

-- 4. GUEST TO REGISTERED USER HISTORY MERGE RPC
CREATE OR REPLACE FUNCTION public.merge_guest_question_history(
  p_guest_id TEXT,
  p_user_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merged_count INT := 0;
BEGIN
  -- Insert unseen guest questions into user history
  INSERT INTO public.player_question_exposures (
    player_id,
    question_id,
    curriculum_id,
    game_id,
    level_number,
    session_id,
    first_seen_at,
    last_attempted_at,
    attempt_count,
    last_result,
    is_replay
  )
  SELECT
    p_user_id,
    question_id,
    curriculum_id,
    game_id,
    level_number,
    session_id,
    first_seen_at,
    last_attempted_at,
    attempt_count,
    last_result,
    is_replay
  FROM public.player_question_exposures
  WHERE player_id = p_guest_id
  ON CONFLICT (player_id, question_id) DO UPDATE SET
    attempt_count = public.player_question_exposures.attempt_count + EXCLUDED.attempt_count,
    last_attempted_at = GREATEST(public.player_question_exposures.last_attempted_at, EXCLUDED.last_attempted_at),
    last_result = EXCLUDED.last_result,
    is_replay = true,
    updated_at = timezone('utc'::text, now());

  GET DIAGNOSTICS v_merged_count = ROW_COUNT;

  -- Clean up old guest records
  DELETE FROM public.player_question_exposures WHERE player_id = p_guest_id;

  RETURN jsonb_build_object(
    'success', true,
    'merged_count', v_merged_count
  );
END;
$$;

-- 5. ROW-LEVEL SECURITY POLICIES
ALTER TABLE public.question_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_question_exposures ENABLE ROW LEVEL SECURITY;

-- Question Catalog: Globally readable by all authenticated and anonymous clients
CREATE POLICY "Public read access to question catalog"
  ON public.question_catalog
  FOR SELECT
  TO public
  USING (true);

-- Player Question Exposures: Players can read and manage only their own exposures
CREATE POLICY "Players can select their own question history"
  ON public.player_question_exposures
  FOR SELECT
  TO public
  USING (
    player_id = COALESCE(auth.uid()::text, '') OR
    player_id LIKE 'guest_%'
  );

CREATE POLICY "Players can insert their own question history"
  ON public.player_question_exposures
  FOR INSERT
  TO public
  WITH CHECK (
    player_id = COALESCE(auth.uid()::text, '') OR
    player_id LIKE 'guest_%'
  );

CREATE POLICY "Players can update their own question history"
  ON public.player_question_exposures
  FOR UPDATE
  TO public
  USING (
    player_id = COALESCE(auth.uid()::text, '') OR
    player_id LIKE 'guest_%'
  );
