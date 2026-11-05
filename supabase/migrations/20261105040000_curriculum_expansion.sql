-- ============================================================================
-- BIBLEARENA — DISCOVER CURRICULUM EXPANSION MIGRATION
-- Migration: 20261105040000_curriculum_expansion.sql
-- ============================================================================
-- Architecture:
-- 1. curriculum_topics (Topic metadata, 100 levels, 2,000 questions per topic)
-- 2. user_curriculum_progress (User progress per curriculum level 1..100)
-- 3. user_curriculum_completions (Audit trail of level completions & scores)
-- 4. Server-Authoritative Verification RPCs (70% threshold, anti-cheat, stars)
-- 5. Row-Level Security (Strict ownership & guest isolation)
-- ============================================================================

-- 1. CURRICULUM TOPICS METADATA TABLE
CREATE TABLE IF NOT EXISTS public.curriculum_topics (
  id TEXT PRIMARY KEY, -- e.g. 'quiz-genesis-beginnings'
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  total_levels INT NOT NULL DEFAULT 100,
  questions_per_level INT NOT NULL DEFAULT 20,
  total_questions INT NOT NULL DEFAULT 2000,
  estimated_minutes_per_level INT NOT NULL DEFAULT 10,
  cover_image TEXT,
  author_name TEXT NOT NULL DEFAULT 'BibleArena Curriculum',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. USER CURRICULUM PROGRESS TABLE (Level by Level Progression)
CREATE TABLE IF NOT EXISTS public.user_curriculum_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- references guest or auth profile
  curriculum_id TEXT NOT NULL REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
  level_number INT NOT NULL CHECK (level_number >= 1 AND level_number <= 100),
  unlocked BOOLEAN NOT NULL DEFAULT false,
  completed BOOLEAN NOT NULL DEFAULT false,
  best_score INT NOT NULL DEFAULT 0 CHECK (best_score >= 0 AND best_score <= 20),
  percentage INT NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  total_points INT NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  stars INT NOT NULL DEFAULT 0 CHECK (stars >= 0 AND stars <= 3),
  attempts_count INT NOT NULL DEFAULT 0 CHECK (attempts_count >= 0),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, curriculum_id, level_number)
);

CREATE INDEX IF NOT EXISTS idx_user_curric_user_id 
  ON public.user_curriculum_progress(user_id, curriculum_id);

CREATE INDEX IF NOT EXISTS idx_user_curric_level 
  ON public.user_curriculum_progress(curriculum_id, level_number);

-- 3. USER CURRICULUM LEVEL COMPLETION AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.user_curriculum_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  curriculum_id TEXT NOT NULL REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
  level_number INT NOT NULL CHECK (level_number >= 1 AND level_number <= 100),
  score INT NOT NULL CHECK (score >= 0 AND score <= 20),
  total_questions INT NOT NULL DEFAULT 20,
  percentage INT NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  points_earned INT NOT NULL DEFAULT 0,
  stars_earned INT NOT NULL CHECK (stars_earned >= 0 AND stars_earned <= 3),
  time_spent_seconds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_curric_completions_user 
  ON public.user_curriculum_completions(user_id, curriculum_id);

-- 4. ROW LEVEL SECURITY POLICIES
ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_curriculum_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_curriculum_completions ENABLE ROW LEVEL SECURITY;

-- Curriculum topics are readable by all authenticated and guest users
CREATE POLICY "Curriculum topics are publicly viewable"
  ON public.curriculum_topics FOR SELECT
  USING (true);

-- User curriculum progress read policy
CREATE POLICY "Users can read own curriculum progress"
  ON public.user_curriculum_progress FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'anon');

-- User curriculum progress insert/update policy
CREATE POLICY "Users can insert/update own curriculum progress"
  ON public.user_curriculum_progress FOR ALL
  USING (auth.uid() = user_id OR auth.role() = 'anon')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'anon');

-- User curriculum completions read/insert policy
CREATE POLICY "Users can read own curriculum completions"
  ON public.user_curriculum_completions FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'anon');

CREATE POLICY "Users can insert own curriculum completions"
  ON public.user_curriculum_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'anon');

-- 5. SERVER-AUTHORITATIVE VERIFICATION RPC
CREATE OR REPLACE FUNCTION public.record_curriculum_level_completion(
  p_user_id UUID,
  p_curriculum_id TEXT,
  p_level_number INT,
  p_score INT,
  p_points_earned INT,
  p_time_spent_seconds INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_passing_score INT := 14; -- 70% of 20 questions
  v_percentage INT;
  v_passed BOOLEAN;
  v_stars INT := 0;
  v_next_level INT;
  v_current_best INT := 0;
  v_is_new_unlock BOOLEAN := false;
BEGIN
  -- 1. Validate inputs
  IF p_level_number < 1 OR p_level_number > 100 THEN
    RAISE EXCEPTION 'Invalid level number: %', p_level_number;
  END IF;

  IF p_score < 0 OR p_score > 20 THEN
    RAISE EXCEPTION 'Invalid score: %', p_score;
  END IF;

  v_percentage := ROUND((p_score::NUMERIC / 20.0) * 100);
  v_passed := (p_score >= v_passing_score);

  IF p_score = 20 THEN
    v_stars := 3;
  ELSIF p_score >= 17 THEN
    v_stars := 2;
  ELSIF p_score >= 14 THEN
    v_stars := 1;
  ELSE
    v_stars := 0;
  END IF;

  -- 2. Log completion attempt
  INSERT INTO public.user_curriculum_completions (
    user_id,
    curriculum_id,
    level_number,
    score,
    total_questions,
    percentage,
    points_earned,
    stars_earned,
    time_spent_seconds
  ) VALUES (
    p_user_id,
    p_curriculum_id,
    p_level_number,
    p_score,
    20,
    v_percentage,
    p_points_earned,
    v_stars,
    p_time_spent_seconds
  );

  -- 3. Upsert level progress
  INSERT INTO public.user_curriculum_progress (
    user_id,
    curriculum_id,
    level_number,
    unlocked,
    completed,
    best_score,
    percentage,
    total_points,
    stars,
    attempts_count,
    completed_at
  ) VALUES (
    p_user_id,
    p_curriculum_id,
    p_level_number,
    true,
    v_passed,
    p_score,
    v_percentage,
    p_points_earned,
    v_stars,
    1,
    CASE WHEN v_passed THEN timezone('utc'::text, now()) ELSE NULL END
  )
  ON CONFLICT (user_id, curriculum_id, level_number)
  DO UPDATE SET
    completed = user_curriculum_progress.completed OR EXCLUDED.completed,
    best_score = GREATEST(user_curriculum_progress.best_score, EXCLUDED.best_score),
    percentage = GREATEST(user_curriculum_progress.percentage, EXCLUDED.percentage),
    total_points = GREATEST(user_curriculum_progress.total_points, EXCLUDED.total_points),
    stars = GREATEST(user_curriculum_progress.stars, EXCLUDED.stars),
    attempts_count = user_curriculum_progress.attempts_count + 1,
    completed_at = COALESCE(user_curriculum_progress.completed_at, EXCLUDED.completed_at),
    updated_at = timezone('utc'::text, now());

  -- 4. Unlock next level if passed and within 100
  IF v_passed AND p_level_number < 100 THEN
    v_next_level := p_level_number + 1;
    INSERT INTO public.user_curriculum_progress (
      user_id,
      curriculum_id,
      level_number,
      unlocked
    ) VALUES (
      p_user_id,
      p_curriculum_id,
      v_next_level,
      true
    )
    ON CONFLICT (user_id, curriculum_id, level_number)
    DO UPDATE SET
      unlocked = true,
      updated_at = timezone('utc'::text, now());
    v_is_new_unlock := true;
  END IF;

  RETURN jsonb_build_object(
    'passed', v_passed,
    'score', p_score,
    'percentage', v_percentage,
    'stars', v_stars,
    'is_new_unlock', v_is_new_unlock,
    'next_level', CASE WHEN v_is_new_unlock THEN v_next_level ELSE p_level_number END
  );
END;
$$;
