-- ============================================================================
-- BIBLEARENA — GAME LEVEL EXPANSION & PROGRESSION SYSTEM
-- Migration: 20261105020000_game_progression_system.sql
-- ============================================================================
-- Architecture:
-- 1. user_championship_progress (200 levels across 10 stages)
-- 2. user_gamemode_progress (18 game modes x 200 levels across 10 stages)
-- 3. user_stage_rewards (Stage badge achievements for 10 stages)
-- 4. Server-Authoritative Verification RPCs (70% threshold, skip prevention)
-- 5. Row-Level Security (Strict ownership & service isolation)
-- ============================================================================

-- 1. USER CHAMPIONSHIP PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.user_championship_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level_number INT NOT NULL CHECK (level_number >= 1 AND level_number <= 200),
  unlocked BOOLEAN NOT NULL DEFAULT false,
  completed BOOLEAN NOT NULL DEFAULT false,
  best_score INT NOT NULL DEFAULT 0 CHECK (best_score >= 0 AND best_score <= 10),
  stars INT NOT NULL DEFAULT 0 CHECK (stars >= 0 AND stars <= 3),
  attempts_count INT NOT NULL DEFAULT 0 CHECK (attempts_count >= 0),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, level_number)
);

CREATE INDEX IF NOT EXISTS idx_user_champ_user_level 
  ON public.user_championship_progress(user_id, level_number);

-- 2. USER GAMEMODE PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.user_gamemode_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_mode_id TEXT NOT NULL,
  level_number INT NOT NULL CHECK (level_number >= 1 AND level_number <= 200),
  unlocked BOOLEAN NOT NULL DEFAULT false,
  completed BOOLEAN NOT NULL DEFAULT false,
  best_score INT NOT NULL DEFAULT 0 CHECK (best_score >= 0 AND best_score <= 10),
  total_points INT NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  stars INT NOT NULL DEFAULT 0 CHECK (stars >= 0 AND stars <= 3),
  attempts_count INT NOT NULL DEFAULT 0 CHECK (attempts_count >= 0),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, game_mode_id, level_number)
);

CREATE INDEX IF NOT EXISTS idx_user_gamemode_user_mode_level 
  ON public.user_gamemode_progress(user_id, game_mode_id, level_number);

-- 3. USER STAGE REWARDS TABLE
CREATE TABLE IF NOT EXISTS public.user_stage_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('championship', 'gamemode')),
  game_mode_id TEXT,
  stage_id TEXT NOT NULL,
  badge_title TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, category, game_mode_id, stage_id)
);

-- ============================================================================
-- 4. ROW-LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE public.user_championship_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamemode_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stage_rewards ENABLE ROW LEVEL SECURITY;

-- Clean existing policies
DROP POLICY IF EXISTS "Users can read own championship progress" ON public.user_championship_progress;
DROP POLICY IF EXISTS "Users can read own gamemode progress" ON public.user_gamemode_progress;
DROP POLICY IF EXISTS "Users can read own stage rewards" ON public.user_stage_rewards;

-- Select policies
CREATE POLICY "Users can read own championship progress"
  ON public.user_championship_progress FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can read own gamemode progress"
  ON public.user_gamemode_progress FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can read own stage rewards"
  ON public.user_stage_rewards FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Disallow direct user inserts/updates; enforce server-authoritative RPCs
-- Revoke direct permissions
REVOKE INSERT, UPDATE, DELETE ON public.user_championship_progress FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_gamemode_progress FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_stage_rewards FROM authenticated, anon;

-- ============================================================================
-- 5. SERVER-AUTHORITATIVE RPCs (SECURITY DEFINER)
-- ============================================================================

-- A. Complete Championship Level
CREATE OR REPLACE FUNCTION public.verify_and_complete_championship_level(
  p_level_number INT,
  p_score INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_prev_completed BOOLEAN;
  v_prev_score INT;
  v_passed BOOLEAN;
  v_stars INT := 0;
  v_unlocked_next BOOLEAN := false;
  v_badge_awarded TEXT := NULL;
  v_stage_start INT;
  v_stage_end INT;
  v_stage_id TEXT;
  v_stage_badge TEXT;
  v_uncompleted_in_stage INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_level_number < 1 OR p_level_number > 200 THEN
    RAISE EXCEPTION 'Invalid level number: %', p_level_number USING ERRCODE = '22003';
  END IF;

  IF p_score < 0 OR p_score > 10 THEN
    RAISE EXCEPTION 'Invalid score: %', p_score USING ERRCODE = '22003';
  END IF;

  -- Ensure Level 1 exists for user
  INSERT INTO public.user_championship_progress (user_id, level_number, unlocked)
  VALUES (v_user_id, 1, true)
  ON CONFLICT (user_id, level_number) DO NOTHING;

  -- Verify user is allowed to play this level
  IF p_level_number > 1 THEN
    SELECT completed, best_score INTO v_prev_completed, v_prev_score
    FROM public.user_championship_progress
    WHERE user_id = v_user_id AND level_number = p_level_number - 1;

    IF NOT COALESCE(v_prev_completed, false) OR COALESCE(v_prev_score, 0) < 7 THEN
      RAISE EXCEPTION 'Level % is locked. Must complete Level % with at least 70%% first.', p_level_number, p_level_number - 1
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Scoring & Stars
  v_passed := (p_score >= 7);
  IF p_score >= 10 THEN
    v_stars := 3;
  ELSIF p_score >= 8 THEN
    v_stars := 2;
  ELSIF p_score >= 7 THEN
    v_stars := 1;
  ELSE
    v_stars := 0;
  END IF;

  -- Upsert current level progress
  INSERT INTO public.user_championship_progress (
    user_id, level_number, unlocked, completed, best_score, stars, attempts_count, completed_at
  )
  VALUES (
    v_user_id, p_level_number, true, v_passed, p_score, v_stars, 1,
    CASE WHEN v_passed THEN timezone('utc'::text, now()) ELSE NULL END
  )
  ON CONFLICT (user_id, level_number) DO UPDATE SET
    unlocked = true,
    completed = user_championship_progress.completed OR v_passed,
    best_score = GREATEST(user_championship_progress.best_score, p_score),
    stars = GREATEST(user_championship_progress.stars, v_stars),
    attempts_count = user_championship_progress.attempts_count + 1,
    completed_at = CASE 
      WHEN user_championship_progress.completed THEN user_championship_progress.completed_at
      WHEN v_passed THEN timezone('utc'::text, now())
      ELSE NULL
    END,
    updated_at = timezone('utc'::text, now());

  -- Unlock next level if passed
  IF v_passed AND p_level_number < 200 THEN
    INSERT INTO public.user_championship_progress (user_id, level_number, unlocked)
    VALUES (v_user_id, p_level_number + 1, true)
    ON CONFLICT (user_id, level_number) DO UPDATE SET
      unlocked = true,
      updated_at = timezone('utc'::text, now());
    v_unlocked_next := true;
  END IF;

  -- Determine Stage Range
  v_stage_start := (((p_level_number - 1) / 20) * 20) + 1;
  v_stage_end := v_stage_start + 19;

  -- Check if all 20 levels in stage are completed
  SELECT COUNT(*) INTO v_uncompleted_in_stage
  FROM generate_series(v_stage_start, v_stage_end) AS lvl
  LEFT JOIN public.user_championship_progress ucp 
    ON ucp.user_id = v_user_id AND ucp.level_number = lvl AND ucp.completed = true
  WHERE ucp.id IS NULL;

  IF v_uncompleted_in_stage = 0 THEN
    v_stage_id := CASE (v_stage_start - 1) / 20 + 1
      WHEN 1 THEN 'Beginner'
      WHEN 2 THEN 'Easy'
      WHEN 3 THEN 'Intermediate'
      WHEN 4 THEN 'Challenging'
      WHEN 5 THEN 'Advanced'
      WHEN 6 THEN 'Very Advanced'
      WHEN 7 THEN 'Expert'
      WHEN 8 THEN 'Master'
      WHEN 9 THEN 'Grandmaster'
      WHEN 10 THEN 'Legendary'
    END;

    v_stage_badge := v_stage_id || ' Scripture Disciple';

    INSERT INTO public.user_stage_rewards (user_id, category, stage_id, badge_title)
    VALUES (v_user_id, 'championship', v_stage_id, v_stage_badge)
    ON CONFLICT DO NOTHING;

    v_badge_awarded := v_stage_badge;
  END IF;

  RETURN jsonb_build_object(
    'passed', v_passed,
    'stars', v_stars,
    'score', p_score,
    'unlocked_next_level', v_unlocked_next,
    'stage_completed_badge', v_badge_awarded
  );
END;
$$;

-- B. Complete Game Mode Level
CREATE OR REPLACE FUNCTION public.verify_and_complete_gamemode_level(
  p_game_mode TEXT,
  p_level_number INT,
  p_score INT,
  p_points INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_prev_completed BOOLEAN;
  v_prev_score INT;
  v_passed BOOLEAN;
  v_stars INT := 0;
  v_unlocked_next BOOLEAN := false;
  v_badge_awarded TEXT := NULL;
  v_stage_start INT;
  v_stage_end INT;
  v_stage_id TEXT;
  v_stage_badge TEXT;
  v_uncompleted_in_stage INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_level_number < 1 OR p_level_number > 200 THEN
    RAISE EXCEPTION 'Invalid level number: %', p_level_number USING ERRCODE = '22003';
  END IF;

  IF p_score < 0 OR p_score > 10 THEN
    RAISE EXCEPTION 'Invalid score: %', p_score USING ERRCODE = '22003';
  END IF;

  -- Ensure Level 1 exists for user
  INSERT INTO public.user_gamemode_progress (user_id, game_mode_id, level_number, unlocked)
  VALUES (v_user_id, p_game_mode, 1, true)
  ON CONFLICT (user_id, game_mode_id, level_number) DO NOTHING;

  -- Verify user is allowed to play this level
  IF p_level_number > 1 THEN
    SELECT completed, best_score INTO v_prev_completed, v_prev_score
    FROM public.user_gamemode_progress
    WHERE user_id = v_user_id AND game_mode_id = p_game_mode AND level_number = p_level_number - 1;

    IF NOT COALESCE(v_prev_completed, false) OR COALESCE(v_prev_score, 0) < 7 THEN
      RAISE EXCEPTION 'Level % is locked in %. Must complete Level % with at least 70%% first.', p_level_number, p_game_mode, p_level_number - 1
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Scoring & Stars
  v_passed := (p_score >= 7);
  IF p_score >= 10 THEN
    v_stars := 3;
  ELSIF p_score >= 8 THEN
    v_stars := 2;
  ELSIF p_score >= 7 THEN
    v_stars := 1;
  ELSE
    v_stars := 0;
  END IF;

  -- Upsert current level progress
  INSERT INTO public.user_gamemode_progress (
    user_id, game_mode_id, level_number, unlocked, completed, best_score, total_points, stars, attempts_count, completed_at
  )
  VALUES (
    v_user_id, p_game_mode, p_level_number, true, v_passed, p_score, p_points, v_stars, 1,
    CASE WHEN v_passed THEN timezone('utc'::text, now()) ELSE NULL END
  )
  ON CONFLICT (user_id, game_mode_id, level_number) DO UPDATE SET
    unlocked = true,
    completed = user_gamemode_progress.completed OR v_passed,
    best_score = GREATEST(user_gamemode_progress.best_score, p_score),
    total_points = GREATEST(user_gamemode_progress.total_points, p_points),
    stars = GREATEST(user_gamemode_progress.stars, v_stars),
    attempts_count = user_gamemode_progress.attempts_count + 1,
    completed_at = CASE 
      WHEN user_gamemode_progress.completed THEN user_gamemode_progress.completed_at
      WHEN v_passed THEN timezone('utc'::text, now())
      ELSE NULL
    END,
    updated_at = timezone('utc'::text, now());

  -- Unlock next level if passed
  IF v_passed AND p_level_number < 200 THEN
    INSERT INTO public.user_gamemode_progress (user_id, game_mode_id, level_number, unlocked)
    VALUES (v_user_id, p_game_mode, p_level_number + 1, true)
    ON CONFLICT (user_id, game_mode_id, level_number) DO UPDATE SET
      unlocked = true,
      updated_at = timezone('utc'::text, now());
    v_unlocked_next := true;
  END IF;

  -- Determine Stage Range
  v_stage_start := (((p_level_number - 1) / 20) * 20) + 1;
  v_stage_end := v_stage_start + 19;

  -- Check if all 20 levels in stage are completed
  SELECT COUNT(*) INTO v_uncompleted_in_stage
  FROM generate_series(v_stage_start, v_stage_end) AS lvl
  LEFT JOIN public.user_gamemode_progress ugp 
    ON ugp.user_id = v_user_id AND ugp.game_mode_id = p_game_mode AND ugp.level_number = lvl AND ugp.completed = true
  WHERE ugp.id IS NULL;

  IF v_uncompleted_in_stage = 0 THEN
    v_stage_id := CASE (v_stage_start - 1) / 20 + 1
      WHEN 1 THEN 'Beginner'
      WHEN 2 THEN 'Easy'
      WHEN 3 THEN 'Intermediate'
      WHEN 4 THEN 'Challenging'
      WHEN 5 THEN 'Advanced'
      WHEN 6 THEN 'Very Advanced'
      WHEN 7 THEN 'Expert'
      WHEN 8 THEN 'Master'
      WHEN 9 THEN 'Grandmaster'
      WHEN 10 THEN 'Legendary'
    END;

    v_stage_badge := v_stage_id || ' ' || UPPER(p_game_mode) || ' Master';

    INSERT INTO public.user_stage_rewards (user_id, category, game_mode_id, stage_id, badge_title)
    VALUES (v_user_id, 'gamemode', p_game_mode, v_stage_id, v_stage_badge)
    ON CONFLICT DO NOTHING;

    v_badge_awarded := v_stage_badge;
  END IF;

  RETURN jsonb_build_object(
    'passed', v_passed,
    'stars', v_stars,
    'score', p_score,
    'total_points', p_points,
    'unlocked_next_level', v_unlocked_next,
    'stage_completed_badge', v_badge_awarded
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_and_complete_championship_level(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_and_complete_gamemode_level(TEXT, INT, INT, INT) TO authenticated;
